# Troubleshooting Tauri 2.x

## Build errors

### `error[E0432]: unresolved import 'tauri::Manager'`
Add `use tauri::Manager;` — this is needed for `app.handle()`, `state()`, etc.

### `failed to run custom build command for 'tauri-build'`
Usually a missing system dependency. Run `pnpm tauri info`. Common fixes:
- **Linux**: `sudo apt install libwebkit2gtk-4.1-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev libssl-dev`
- **Windows**: install Visual Studio 2019/2022 Build Tools with C++ workload; install WebView2 runtime
- **macOS**: `xcode-select --install`

### `Error: failed to build wry`
Usually webkit2gtk version mismatch on Linux. Check `pkg-config --modversion webkit2gtk-4.1`. If only `webkit2gtk-4.0` is available, you're on an older distro — install `webkit2gtk-4.1` from a backports repo or upgrade.

### `error: linker 'cc' not found` on Linux
Install build-essential: `sudo apt install build-essential`.

## Runtime errors

### `is not allowed by the capability configuration`
The renderer called a Tauri API that no capability grants. Add the permission to the capability file for that window.

### `command 'foo' not found`
- Forgot to add to `invoke_handler![]`
- Function name mismatch (Rust uses snake_case, JS calls match the Rust name exactly — Tauri does NOT auto-convert command names, only arg names)

### `Failed to deserialize: missing field`
Renderer args don't match Rust struct. Check:
- `#[serde(rename_all = "camelCase")]` on the struct if your fields are snake_case in Rust but camelCase in TS
- The args object key matches the Rust parameter name (e.g. `invoke('cmd', { args })` for `fn cmd(args: T)`)

### `cannot find function 'mainEntryPoint'` on mobile
Add `#[cfg_attr(mobile, tauri::mobile_entry_point)]` to the public `run()` function in `lib.rs`.

## Audio / ML

### Audible glitches in audio
- Check the cpal callback for allocations or locks
- Increase channel buffer size or reduce per-frame work
- On Linux, try a larger ALSA buffer via `cpal::Device::default_input_config().buffer_size`

### `ort` model load fails: `LoadLibraryEx... 0xC1`
- Mismatched architecture: x64 binary loading an arm64 dll, or vice versa
- Missing VC++ runtime on Windows — install `vc_redist.x64.exe`
- With `load-dynamic`, set `ORT_DYLIB_PATH` to the absolute path

### Silero VAD always returns 0.5
- Wrong sample rate — must be 8 kHz or 16 kHz
- Wrong frame size — 512 samples for 16 kHz
- Forgot to maintain `h`/`c` LSTM state between frames

## CSP / asset protocol

### Images don't load
- Add `"img-src": "'self' asset: http://asset.localhost data:"` to CSP
- Enable asset protocol: `"assetProtocol.enable": true` and add `allow` paths
- Use `convertFileSrc()` from `@tauri-apps/api/core` to convert local paths to webview-loadable URLs

### Fetch blocked
- Add origin to `connect-src`
- For HTTPS: confirm the URL exactly (trailing slash, scheme)
- For WebSocket: `connect-src` must include the `wss://` URL too

## Bundle / signing

### macOS: "App is damaged and can't be opened"
Not signed/notarized. Either:
- Right-click → Open the first time (bypasses Gatekeeper for that user), or
- Sign + notarize properly via `tauri build` with credentials in env

### Windows SmartScreen blocks installer
Need a code-signing cert with reputation. EV certs get reputation faster. Document `Run anyway` for early users.

### `tauri build` produces no installer for Linux
Check the `bundle.targets` in `tauri.conf.json` — must include `appimage` or `deb`.

## Auto-updater

### "Signature verification failed"
Public key in `tauri.conf.json` doesn't match the private key that signed the artifact. Regenerate or fix the env var.

### Updater silently does nothing
- Endpoint URL not returning 200 with the expected JSON shape
- `pubkey` empty or mismatched
- App version equal to or higher than the announced update — bumping `version` in `tauri.conf.json` is mandatory

## Diagnostic dump

When in doubt, attach the output of:
```bash
pnpm tauri info
```
to any bug report — it captures Rust toolchain, Tauri versions, OS, and detected build deps.
