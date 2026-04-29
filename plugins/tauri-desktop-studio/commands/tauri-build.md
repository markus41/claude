---
name: tauri-build
intent: Build production Tauri 2.x bundles (msi/nsis/dmg/appimage/deb) with signing config
tags:
  - tauri-desktop-studio
  - command
  - build
inputs: []
risk: medium
cost: medium
description: Build production Tauri 2.x bundles (msi/nsis/dmg/appimage/deb) with signing config
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Production Build & Bundle

Generate signed installers for distribution.

## Build

```bash
pnpm tauri build              # current platform
pnpm tauri build --target x86_64-pc-windows-msvc
pnpm tauri build --bundles nsis,msi
```

Output lands in `src-tauri/target/release/bundle/<format>/`.

## Signing

### Windows (Authenticode)

In `tauri.conf.json`:
```json
"bundle": {
  "windows": {
    "certificateThumbprint": "ABCDEF...",
    "digestAlgorithm": "sha256",
    "timestampUrl": "http://timestamp.digicert.com",
    "tsp": false,
    "nsis": { "installMode": "currentUser" }
  }
}
```
Cert must be in the Windows Cert Store; supply thumbprint only — never raw key material.

### macOS (notarization)

```json
"bundle": {
  "macOS": {
    "minimumSystemVersion": "10.13",
    "signingIdentity": "Developer ID Application: Your Name (TEAMID)",
    "providerShortName": "TEAMID",
    "entitlements": "./entitlements.plist"
  }
}
```
Set env: `APPLE_ID`, `APPLE_PASSWORD` (app-specific), `APPLE_TEAM_ID`. Tauri auto-runs notarytool.

### Updater signing

```bash
pnpm tauri signer generate -w ~/.tauri/myapp.key
```
Public key goes in `tauri.conf.json` under `plugins.updater.pubkey`. Private key signs every release artifact:
```bash
pnpm tauri signer sign -k ~/.tauri/myapp.key path/to/installer
```

## CI hints

- Cache `~/.cargo/registry`, `~/.cargo/git`, `src-tauri/target`
- Build matrix: `windows-latest`, `macos-latest` (or `macos-14` for arm), `ubuntu-22.04`
- For Linux: `sudo apt install libwebkit2gtk-4.1-dev libssl-dev libgtk-3-dev libayatana-appindicator3-dev librsvg2-dev`
- Never commit signing keys; pull from GitHub Encrypted Secrets / Azure Key Vault
