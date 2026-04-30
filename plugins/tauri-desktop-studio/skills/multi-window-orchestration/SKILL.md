---
name: Multi-Window Orchestration
description: Use when the user asks about multiple Tauri windows, side-panel UIs, picture-in-picture overlays, child windows for OAuth/dialogs, sharing state across windows, or window-scoped events.
version: 0.1.0
---

# Multi-Window / Multi-Webview Orchestration

Tauri 2.x supports multiple windows AND multiple webviews per window (split panes). This is the right primitive for:

- Always-on-top compact recorder + main window
- Picture-in-picture transcript while another app is foreground
- Sandboxed OAuth popup with its own capability
- Settings / preferences as a separate small window
- Multi-monitor: one window per screen
- Embedded "hosted" webview (e.g. Notion / Stripe Checkout) isolated from the main app

## Static config: declare windows in `tauri.conf.json`

```jsonc
"app": {
  "windows": [
    {
      "label": "main",
      "title": "Discovery Co-Pilot",
      "width": 1280,
      "height": 800,
      "minWidth": 960,
      "minHeight": 600,
      "center": true,
      "resizable": true,
      "decorations": true
    },
    {
      "label": "recorder",
      "title": "Recording…",
      "width": 320,
      "height": 96,
      "alwaysOnTop": true,
      "decorations": false,
      "transparent": true,
      "skipTaskbar": true,
      "resizable": false,
      "url": "/recorder"
    }
  ]
}
```

Tauri creates the `recorder` window at launch but you can open it lazily (see below).

## Dynamic: create a window from JS

```typescript
import { WebviewWindow, type WebviewWindowOptions } from '@tauri-apps/api/webviewWindow';

export async function openSettings() {
  const existing = await WebviewWindow.getByLabel('settings');
  if (existing) {
    await existing.show();
    await existing.setFocus();
    return existing;
  }
  const win = new WebviewWindow('settings', {
    title: 'Settings',
    url: '/settings',
    width: 720,
    height: 560,
    resizable: false,
    parent: 'main',
  });
  win.once('tauri://error', (e) => console.error('failed to create window', e));
  return win;
}
```

## Dynamic: from Rust

```rust
use tauri::{WebviewWindowBuilder, WebviewUrl};

#[tauri::command]
async fn open_oauth_window(app: tauri::AppHandle, auth_url: String) -> Result<(), String> {
    WebviewWindowBuilder::new(&app, "oauth", WebviewUrl::External(auth_url.parse().map_err(|e: url::ParseError| e.to_string())?))
        .title("Sign in")
        .inner_size(480.0, 720.0)
        .center()
        .resizable(false)
        .focused(true)
        .build()
        .map_err(|e| e.to_string())?;
    Ok(())
}
```

## Per-window capabilities

Each window can have its own capability with **completely different permissions**. Critical for hosting third-party content.

`src-tauri/capabilities/main.json`:
```json
{ "identifier": "main-capability", "windows": ["main", "recorder"], "permissions": ["core:default", "log:default", "stronghold:default", "shell:allow-open"] }
```

`src-tauri/capabilities/oauth.json`:
```json
{ "identifier": "oauth-capability", "windows": ["oauth"], "permissions": ["core:default"] }
```

`src-tauri/capabilities/embedded.json`:
```json
{ "identifier": "embedded-capability", "windows": ["embedded"], "permissions": [] }
```

The `embedded` window above can render an external URL but has **zero** Tauri APIs — just a sandboxed webview.

## Window-scoped vs global events

```typescript
import { listen, emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

// Global — every window receives it
await emit('user:signed-in', { userId });
await listen('user:signed-in', (e) => { ... });

// Window-scoped — only the named window receives it
const main = await WebviewWindow.getByLabel('main');
await main!.emit('apply-theme', { theme: 'dark' });

// Listen only on this window
const me = getCurrentWebviewWindow();
await me.listen('apply-theme', (e) => { ... });
```

Use window-scoped events when the same event name has different meaning per window (e.g. `recording:start` for recorder window vs noise on main).

## Sharing state across windows

Three options:

### 1. Single source of truth in Rust

Best for app-wide state. Each window queries via `invoke`:
```typescript
const status = await invoke<{ isRecording: boolean }>('recording_status');
```
Push updates with `app.emit_to("main", ...)` and `app.emit_to("recorder", ...)`.

### 2. Zustand store synced via events

Each window has its own JS runtime (separate store instance). To sync, broadcast every store change:

```typescript
// store.ts
import { create } from 'zustand';
import { listen, emit } from '@tauri-apps/api/event';
import { getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';

const me = getCurrentWebviewWindow();

export const useApp = create<AppState>()((set, get) => ({
  isRecording: false,
  setRecording(v) {
    set({ isRecording: v });
    // Broadcast to other windows
    emit('store:set', { key: 'isRecording', value: v, source: me.label });
  },
}));

// Subscribe at boot
listen<{ key: string; value: any; source: string }>('store:set', (e) => {
  if (e.payload.source === me.label) return;     // ignore our own broadcasts
  useApp.setState({ [e.payload.key]: e.payload.value });
});
```

### 3. Tauri-plugin-store (filesystem-backed)

```typescript
import { Store } from '@tauri-apps/plugin-store';
const store = await Store.load('settings.json');
await store.set('theme', 'dark');
await store.save();
```
Persisted across restarts; readable from any window. Updates aren't auto-broadcast — pair with `store:changed` events.

## Window lifecycle gotchas

```typescript
const win = await WebviewWindow.getByLabel('recorder');
if (win) {
  await win.close();              // closes; emits "tauri://close-requested"
  await win.hide();                // off-screen but in memory
  await win.minimize();
  await win.setAlwaysOnTop(true);
  await win.setSize(new LogicalSize(400, 200));
  await win.setPosition(new LogicalPosition(0, 0));
  await win.startDragging();        // for custom-decorations chrome
}
```

For custom title bars (`decorations: false`):
```tsx
<div data-tauri-drag-region className="titlebar">
  My App
  <button onClick={() => getCurrentWebviewWindow().minimize()}>—</button>
  <button onClick={() => getCurrentWebviewWindow().close()}>×</button>
</div>
```

## Multi-webview in one window (split pane)

Tauri 2.x supports embedding multiple webviews inside a single window — useful for split editors, sidebars, and host/guest content separation:

```rust
use tauri::{WebviewWindowBuilder, WebviewBuilder, WebviewUrl, LogicalPosition, LogicalSize};

#[tauri::command]
async fn open_split(app: tauri::AppHandle) -> Result<(), String> {
    let window = WebviewWindowBuilder::new(&app, "main", WebviewUrl::App("/main".into()))
        .title("Split")
        .build()
        .map_err(|e| e.to_string())?;

    window.add_child(
        WebviewBuilder::new("editor", WebviewUrl::App("/editor".into())),
        LogicalPosition::new(0., 0.),
        LogicalSize::new(640., 800.),
    ).map_err(|e| e.to_string())?;

    window.add_child(
        WebviewBuilder::new("preview", WebviewUrl::App("/preview".into())),
        LogicalPosition::new(640., 0.),
        LogicalSize::new(640., 800.),
    ).map_err(|e| e.to_string())?;

    Ok(())
}
```

Each child webview gets its own capability via the `webviews` field instead of `windows`.

## Patterns

### Always-on-top recorder bar
- `decorations: false`, `transparent: true`, `alwaysOnTop: true`, `skipTaskbar: true`
- Subscribe to `audio:level` from main → drive a small meter
- Click-to-show-main: `WebviewWindow.getByLabel('main').setFocus()`

### OAuth popup with sandboxed capability
- `decorations: true`, `parent: 'main'`, modal
- Capability has only `core:default`
- Listen for navigation to redirect URI; close window when done

### Settings as separate window
- Smaller size, `resizable: false`, central
- Same capability as main (or a "settings-only" subset)

### Multi-monitor
- `WebviewWindow.getAll()` to enumerate; place by monitor:
```typescript
import { availableMonitors, currentMonitor } from '@tauri-apps/api/window';
const monitors = await availableMonitors();
new WebviewWindow('viewer-1', { x: monitors[1].position.x, y: monitors[1].position.y, ... });
```

## Pitfalls

- **Same `label` twice**: `new WebviewWindow('settings', ...)` when one exists silently fails. Always check `getByLabel` first.
- **Per-window capability missing**: silently degrades — APIs throw at runtime. Add the capability before creating the window.
- **`transparent: true` on Linux**: requires a compositor; degrades gracefully on others, but `decorations: false` + `transparent: true` plus odd window managers can produce visual glitches.
- **Auto-resume from minimize on event**: if main is minimized and emits to it, the listener is queued; events buffer fine, but UI may appear sluggish on un-minimize.
- **Memory**: each window is a separate webview process. 5+ windows = noticeable memory.
- **State desync in Zustand-broadcast**: a slow listener can lag → divergence. Have one window be authoritative; others read-only.
