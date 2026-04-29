# Electron → Tauri 2.x Migration Playbook

A pragmatic guide for porting an Electron app to Tauri 2.x.

## When migration is worth it

- Bundle size matters (Tauri ~10–15 MB vs Electron ~150+ MB)
- Memory footprint matters (Tauri uses the system webview, no bundled Chromium)
- Native compute needed (Rust backend, ONNX, audio)
- Strict supply chain / signing requirements

## When to stay on Electron

- App relies heavily on Node.js APIs (`fs`, `child_process`, native node modules)
- Large existing surface of `nodeIntegration: true` code
- Need a specific Chromium version or feature not in stable webviews

## Migration order

1. **Inventory main-process code.** Every `ipcMain.handle('foo', ...)` becomes a `#[tauri::command]`.
2. **Inventory preload scripts.** `contextBridge.exposeInMainWorld` becomes a typed wrapper around `invoke()`.
3. **Inventory renderer Node usage.** Anything using `require('fs')` or `electron` directly must be replaced — there's no Node in the renderer.
4. **Map permissions.** Electron has no ACL; you'll write capability files from scratch. List every external action (FS, shell, notifications) per window.
5. **Pick the frontend strategy.**
   - SPA (React/Vue/Svelte): minor changes, just remove Node usages.
   - Next.js: switch to static export (`output: 'export'`).
   - Electron with built-in Express server: replace with Rust commands.

## Common mappings

| Electron | Tauri 2.x |
|----------|-----------|
| `ipcMain.handle('cmd', fn)` | `#[tauri::command] async fn cmd(...) -> Result<_, _>` |
| `ipcRenderer.invoke('cmd', args)` | `invoke('cmd', { args })` |
| `webContents.send('event', data)` | `app.emit('event', data)` |
| `ipcRenderer.on('event', cb)` | `await listen('event', cb)` |
| `BrowserWindow` | `tauri.conf.json` window config + `WebviewWindow::new` |
| `Menu.buildFromTemplate` | `tauri::menu::Menu` builder |
| `nativeTheme.shouldUseDarkColors` | `app.theme()` from `@tauri-apps/api/window` |
| `dialog.showOpenDialog` | `@tauri-apps/plugin-dialog` `open()` |
| `shell.openExternal(url)` | `@tauri-apps/plugin-shell` `open(url)` |
| `safeStorage.encryptString` | Stronghold or keyring |
| `app.getPath('userData')` | `appDataDir()` |
| `autoUpdater` | `@tauri-apps/plugin-updater` |
| Native node module (e.g. `node-portaudio`) | Rust crate (e.g. `cpal`) |

## Renderer → no more `require`

```typescript
// Before (Electron preload + nodeIntegration)
const { invoke } = require('@org/ipc');
const fs = require('fs');

// After (Tauri)
import { invoke } from '@tauri-apps/api/core';
import { readTextFile } from '@tauri-apps/plugin-fs';
```

If you have Node packages that are pure JS, they keep working in the renderer. Anything with native bindings or that imports Node built-ins (`fs`, `path`, `crypto`) must be replaced.

## Background tasks

Electron pattern:
```javascript
// main.js
setInterval(checkForUpdates, 60_000);
```

Tauri pattern (Rust, in `setup`):
```rust
.setup(|app| {
    let handle = app.handle().clone();
    tauri::async_runtime::spawn(async move {
        loop {
            tokio::time::sleep(Duration::from_secs(60)).await;
            if let Err(e) = check_for_updates(&handle).await {
                log::warn!("update check failed: {e}");
            }
        }
    });
    Ok(())
})
```

## Auto-updater

Electron uses `electron-updater` with a YAML feed. Tauri uses `@tauri-apps/plugin-updater`:

```json
// tauri.conf.json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": ["https://releases.example.com/{{target}}/{{current_version}}"],
    "pubkey": "<base64 ed25519 pubkey>"
  }
}
```

Updater artifacts are signed during `tauri build` if the private key is provided via `TAURI_SIGNING_PRIVATE_KEY` env var.

## Checklist

- [ ] All `ipcMain.handle` → `#[tauri::command]`
- [ ] All preload bridges → typed TS wrappers
- [ ] Capability files written for every window
- [ ] CSP defined in `tauri.conf.json`
- [ ] `nodeIntegration` users replaced with Tauri plugins or Rust commands
- [ ] Auto-updater migrated, keys generated
- [ ] Bundle outputs match Electron equivalents (msi/dmg/appimage)
- [ ] Code signing config set (Authenticode + notarization)
- [ ] Tests still pass
- [ ] `tauri info` clean on all target platforms
