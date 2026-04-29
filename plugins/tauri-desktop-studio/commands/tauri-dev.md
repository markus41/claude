---
name: tauri-dev
intent: Start the Tauri 2.x dev loop with frontend HMR and Rust hot reload
tags:
  - tauri-desktop-studio
  - command
  - dev
inputs: []
risk: low
cost: low
description: Start the Tauri 2.x dev loop with frontend HMR and Rust hot reload
allowed-tools:
  - Bash
  - Read
---

# Tauri Dev Loop

Run the desktop app in development mode.

```bash
pnpm tauri dev
```

This:
1. Runs `beforeDevCommand` (e.g. `pnpm dev` for Next.js on :3000)
2. Compiles `src-tauri` in debug mode
3. Opens the webview pointed at `devUrl`
4. Watches Rust sources — saves trigger an in-place rebuild + reload

## Common dev tweaks

- **Inspect IPC**: open DevTools (right-click → Inspect or `Ctrl+Shift+I`). Console logs from the renderer appear there; Rust `log::info!` goes to the terminal that ran `tauri dev`.
- **Custom log filter**: `RUST_LOG=info,my_app=debug pnpm tauri dev`
- **Skip frontend rebuild** if it's already running: `pnpm tauri dev --no-dev-server`
- **Targeting a specific window**: pass `--config '{ "app": { "windows": [...] } }'` to override at launch.
- **Permissions errors** ("plugin X not allowed"): edit the capability JSON — runtime ACL is enforced even in dev.

## When dev hangs

- Stale Rust target: `rm -rf src-tauri/target` and retry
- Wrong `devUrl`: must match the frontend dev server port (Next.js defaults to 3000)
- WSL/macOS: webview may need additional system deps; see `tauri info` output for missing libs
