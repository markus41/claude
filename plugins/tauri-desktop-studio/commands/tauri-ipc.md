---
name: tauri-ipc
intent: Generate a Tauri 2.x IPC command (Rust handler + TypeScript invoke wrapper + shared types)
tags:
  - tauri-desktop-studio
  - command
  - ipc
inputs: []
risk: low
cost: low
description: Generate a Tauri 2.x IPC command (Rust handler + TypeScript invoke wrapper + shared types)
allowed-tools:
  - Read
  - Write
  - Edit
---

# Generate IPC Command

Create a complete IPC roundtrip: Rust `#[tauri::command]` + TS wrapper + shared input/output types.

## Rust handler (`src-tauri/src/commands/<name>.rs`)

```rust
use tauri::State;
use serde::{Deserialize, Serialize};

#[derive(Debug, Deserialize)]
pub struct StartCaptureArgs {
    pub device_name: String,
    pub sample_rate: u32,
    pub denoise: bool,
}

#[derive(Debug, Serialize)]
pub struct CaptureHandle {
    pub session_id: String,
    pub actual_sample_rate: u32,
}

#[tauri::command]
pub async fn start_capture(
    args: StartCaptureArgs,
    state: State<'_, crate::AppState>,
) -> Result<CaptureHandle, String> {
    state
        .audio
        .start(&args.device_name, args.sample_rate, args.denoise)
        .await
        .map_err(|e| e.to_string())
}
```

Register in `lib.rs`:
```rust
.invoke_handler(tauri::generate_handler![
    commands::start_capture,
    // ...
])
```

## TypeScript wrapper (`src/lib/tauri/commands.ts`)

```typescript
import { invoke } from '@tauri-apps/api/core';

export interface StartCaptureArgs {
  deviceName: string;
  sampleRate: number;
  denoise: boolean;
}

export interface CaptureHandle {
  sessionId: string;
  actualSampleRate: number;
}

export async function startCapture(args: StartCaptureArgs): Promise<CaptureHandle> {
  return invoke<CaptureHandle>('start_capture', { args });
}
```

> Tauri converts snake_case Rust field names ↔ camelCase TS automatically — but the **command name itself** must match the Rust function name. The wrapper passes the args object under a single key (`args`) to match the Rust handler param name.

## Capability permission

Add a per-command permission to `src-tauri/capabilities/main.json` (or scope it tighter):
```json
{ "permissions": ["my-app:allow-start-capture"] }
```

And declare it in `src-tauri/permissions/audio.toml`:
```toml
"$schema" = "https://schema.tauri.app/config/2/permission"

[[permission]]
identifier = "allow-start-capture"
description = "Allows starting audio capture"
commands.allow = ["start_capture"]
```

## Events (one-way push from Rust → renderer)

```rust
use tauri::Emitter;
app_handle.emit("audio:level", level_db).unwrap();
```

```typescript
import { listen } from '@tauri-apps/api/event';
const unlisten = await listen<number>('audio:level', (e) => setLevel(e.payload));
// later: unlisten();
```

Use events for streams (audio levels, transcript chunks). Use `invoke` for request/response.
