---
name: Tauri Config
description: Use when the user asks about tauri.conf.json, capability files, CSP, asset protocol, bundle settings, plugin config, or Tauri 2.x security model. Provides config templates and ACL guidance.
version: 0.1.0
---

# Tauri 2.x Configuration

The two source-of-truth config files in any Tauri 2.x app:

1. **`src-tauri/tauri.conf.json`** — product, build, app/window, bundle, plugin config
2. **`src-tauri/capabilities/*.json`** — per-window ACL (replaces v1 allowlist)

## Minimal `tauri.conf.json`

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "Discovery Co-Pilot",
  "version": "1.0.0",
  "identifier": "co.lobbi.discovery",
  "build": {
    "frontendDist": "../out",
    "devUrl": "http://localhost:3000",
    "beforeDevCommand": "pnpm dev",
    "beforeBuildCommand": "pnpm build"
  },
  "app": {
    "withGlobalTauri": false,
    "windows": [
      {
        "label": "main",
        "title": "Discovery Co-Pilot",
        "width": 1280,
        "height": 800,
        "minWidth": 960,
        "minHeight": 600,
        "resizable": true,
        "center": true,
        "decorations": true
      }
    ],
    "security": {
      "csp": {
        "default-src": "'self'",
        "connect-src": "ipc: http://ipc.localhost https://api.example.com wss://api.example.com",
        "img-src": "'self' asset: http://asset.localhost data: blob:",
        "style-src": "'self' 'unsafe-inline'",
        "script-src": "'self'"
      },
      "assetProtocol": {
        "enable": true,
        "scope": {
          "allow": ["$APPDATA/recordings/**", "$RESOURCE/**"],
          "deny": ["$APPDATA/secrets/**"]
        }
      }
    }
  },
  "bundle": {
    "active": true,
    "targets": ["msi", "nsis", "dmg", "appimage", "deb"],
    "icon": ["icons/32x32.png", "icons/128x128.png", "icons/icon.icns", "icons/icon.ico"]
  },
  "plugins": {
    "shell": { "open": true },
    "log": { "level": "info" },
    "stronghold": {}
  }
}
```

## Path variables (use in capabilities + asset protocol scopes)

| Variable | Resolves to |
|----------|-------------|
| `$APPDATA` | OS app-data dir (Roaming on Windows) |
| `$APPCONFIG` | App config dir |
| `$APPCACHE` | App cache dir |
| `$APPLOG` | App log dir |
| `$RESOURCE` | Bundled resources |
| `$DOCUMENT` | User Documents |
| `$DOWNLOAD` | User Downloads |
| `$DESKTOP` | User Desktop |

## CSP rules

- Always pin `connect-src` to your real API origins. `ipc: http://ipc.localhost` is required for `invoke()`.
- `'unsafe-inline'` in `style-src` is unavoidable for many React libs (emotion, styled-components). Avoid it in `script-src`.
- For dev, Tauri auto-injects `ws://localhost:<port>` for HMR — you don't need to add it manually.

## Common mistakes

- Setting `withGlobalTauri: true` in production: leaks `window.__TAURI__` to the renderer; prefer ES module imports.
- Forgetting to bump `version` before `tauri build`: existing installs won't auto-update.
- CSP `default-src: '*'` to "make it work": defeats the model — list each origin.
- Using v1 `allowlist` keys in `tauri.conf.json`: silently ignored in v2. Use capabilities.
