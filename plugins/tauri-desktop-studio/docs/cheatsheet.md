# Tauri 2.x Cheatsheet

## CLI

| Command | What |
|---------|------|
| `pnpm create tauri-app` | Scaffold |
| `pnpm tauri dev` | Dev loop with HMR |
| `pnpm tauri build` | Production bundle |
| `pnpm tauri build --target x86_64-pc-windows-msvc` | Cross-target |
| `pnpm tauri info` | Diagnostic dump (versions, deps, OS) |
| `pnpm tauri icon path/to/icon.png` | Generate full icon set |
| `pnpm tauri signer generate -w key` | Updater keypair |
| `pnpm tauri signer sign -k key file` | Sign an updater artifact |
| `pnpm tauri plugin add stronghold` | Add an official plugin |
| `pnpm tauri permission new` | Scaffold a custom permission |
| `pnpm tauri migrate` | Migrate v1 → v2 |

## Path variables (capabilities + asset protocol scope)

| Variable | Windows | macOS | Linux |
|----------|---------|-------|-------|
| `$APPDATA` | `%APPDATA%\<id>` | `~/Library/Application Support/<id>` | `~/.local/share/<id>` |
| `$APPCONFIG` | `%APPDATA%\<id>` | `~/Library/Application Support/<id>` | `~/.config/<id>` |
| `$APPCACHE` | `%LOCALAPPDATA%\<id>\Cache` | `~/Library/Caches/<id>` | `~/.cache/<id>` |
| `$APPLOG` | `%APPDATA%\<id>\logs` | `~/Library/Logs/<id>` | `~/.local/share/<id>/logs` |
| `$RESOURCE` | bundled resources |
| `$DOCUMENT` | User Documents |
| `$DOWNLOAD` | User Downloads |
| `$DESKTOP` | User Desktop |
| `$HOME` | User home |
| `$TEMP` | OS temp dir |

## Common permissions

| Permission | Effect |
|------------|--------|
| `core:default` | Baseline core APIs (window, app, path, event listening) |
| `core:allow-emit` | `app.emit` from JS |
| `shell:allow-open` | Open URLs / files via OS default handler |
| `dialog:default` | Open/save/message dialogs |
| `fs:allow-read-text-file` | `readTextFile()` |
| `fs:allow-write-text-file` | `writeTextFile()` |
| `fs:scope` (with allow/deny) | Constrain FS to specific paths |
| `log:default` | Forward log records from JS |
| `stronghold:default` | All Stronghold operations |
| `notification:allow-notify` | OS notifications |
| `os:allow-platform` | Detect OS |
| `process:allow-restart` | Restart the app |
| `clipboard-manager:allow-write-text` | Set clipboard text |

## TypeScript imports (most-used)

```typescript
import { invoke } from '@tauri-apps/api/core';
import { listen, emit, type UnlistenFn } from '@tauri-apps/api/event';
import { Channel } from '@tauri-apps/api/core';
import { appDataDir, resourceDir, join } from '@tauri-apps/api/path';
import { getCurrent, getCurrentWebviewWindow } from '@tauri-apps/api/webviewWindow';
import { open as openShell } from '@tauri-apps/plugin-shell';
import { Stronghold, Client } from '@tauri-apps/plugin-stronghold';
import { writeTextFile, readTextFile, exists } from '@tauri-apps/plugin-fs';
```

## Rust imports (most-used)

```rust
use tauri::{command, State, AppHandle, Manager, Emitter, Window};
use tauri::path::BaseDirectory;
use tauri::ipc::Channel;
use serde::{Deserialize, Serialize};
```

## Capability skeletons

### Main app
```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "main-capability",
  "windows": ["main"],
  "permissions": ["core:default", "log:default", "shell:allow-open", "stronghold:default"]
}
```

### Sandboxed popup (e.g. OAuth window)
```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "oauth-popup",
  "windows": ["oauth"],
  "permissions": ["core:default"]
}
```

### File-scoped read
```json
{
  "permissions": [
    "fs:allow-read-text-file",
    { "identifier": "fs:scope", "allow": ["$APPDATA/transcripts/**"] }
  ]
}
```

## Common mistake → fix

| Mistake | Fix |
|---------|-----|
| `withGlobalTauri: true` in prod | Set `false`, use ES module imports |
| `script-src 'unsafe-eval'` | Remove; use a CSP-safe code path |
| FS scope `["**"]` | Anchor to a path variable |
| Building inference session per-call | Move to `Arc<Session>` in app state |
| Allocating in cpal callback | Pre-size vec; `try_send` and drop |
| `git commit` with private updater key | Use `tauri.conf.json` env var or CI secret |
