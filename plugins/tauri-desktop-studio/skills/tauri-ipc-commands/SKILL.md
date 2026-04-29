---
name: Tauri IPC Commands
description: Use when the user asks how to write a #[tauri::command], pass state, handle errors, emit events, do async IPC, or wire up a Rust ↔ TypeScript bridge in Tauri 2.x.
version: 0.1.0
---

# Tauri 2.x IPC Patterns

Two channels: **commands** (request/response, renderer-initiated) and **events** (push, either direction).

## Command anatomy

```rust
#[tauri::command]
async fn my_cmd(
    arg_one: String,                 // simple
    args: MyArgs,                    // serde struct
    state: State<'_, AppState>,      // shared state
    app: AppHandle,                  // for emit, paths, etc.
    window: Window,                  // for window-scoped ops
) -> Result<MyResponse, String> {
    // ...
}
```

- All return-type errors must be `Serialize`. Use `String` or a typed `AppError` that implements `Serialize`.
- `async fn` is supported and runs on tokio; lifetimes use `'_`.
- The renderer always passes args inside an object: `invoke('my_cmd', { argOne: 'x', args: {...} })` — Tauri auto-converts camelCase ↔ snake_case for arg names but **not** for struct fields without `#[serde(rename_all = "camelCase")]`.

## Typed error pattern

```rust
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error("audio device not found: {0}")]
    DeviceNotFound(String),
    #[error("inference failed: {0}")]
    Inference(#[from] ort::Error),
    #[error(transparent)]
    Other(#[from] anyhow::Error),
}

impl serde::Serialize for AppError {
    fn serialize<S: serde::Serializer>(&self, s: S) -> Result<S::Ok, S::Error> {
        s.serialize_str(&self.to_string())
    }
}

#[tauri::command]
async fn start_capture(...) -> Result<Handle, AppError> { ... }
```

## State

```rust
pub struct AppState {
    pub audio: Arc<AudioPipeline>,
    pub inference: Arc<InferenceState>,
}

tauri::Builder::default()
    .setup(|app| {
        let inference = load_models(&app.path().resource_dir()?)?;
        app.manage(AppState {
            audio: Arc::new(AudioPipeline::new()),
            inference: Arc::new(inference),
        });
        Ok(())
    })
```

Inside a command: `state.audio.start(...)`. State is `Send + Sync` and shared across all command invocations.

## Events (push from Rust)

```rust
use tauri::Emitter;

// Global (all listeners)
app_handle.emit("transcript:chunk", &chunk)?;

// Window-scoped (only listeners on that window)
window.emit_to("main", "audio:level", level_db)?;
```

Renderer:
```typescript
import { listen, type UnlistenFn } from '@tauri-apps/api/event';

const unlisten: UnlistenFn = await listen<TranscriptChunk>('transcript:chunk', (e) => {
  appendChunk(e.payload);
});
// On unmount:
unlisten();
```

## Channels (typed streaming, Tauri 2.x)

For high-frequency streams, prefer `Channel` over events — it has a typed JS counterpart and zero pub/sub overhead:
```rust
use tauri::ipc::Channel;

#[tauri::command]
fn stream_levels(on_event: Channel<f32>) {
    std::thread::spawn(move || loop {
        on_event.send(read_level()).ok();
        std::thread::sleep(std::time::Duration::from_millis(50));
    });
}
```
```typescript
import { Channel, invoke } from '@tauri-apps/api/core';
const ch = new Channel<number>();
ch.onmessage = (level) => setLevel(level);
await invoke('stream_levels', { onEvent: ch });
```

## Best practices

- **One command, one effect.** Don't pack multiple unrelated actions into a single command.
- **Validate args server-side.** Even with TS types, treat the renderer as untrusted input.
- **Don't return raw bytes via JSON.** Use the `tauri::ipc::Response` type or write to a temp file and return the path.
- **Always `.map_err(|e| e.to_string())`** for cross-language errors unless you've implemented a custom `Serialize`.
- **Cancellation**: pass a `tauri::ipc::CommandScope` or a manual cancellation token in `AppState` for long-running ops.
