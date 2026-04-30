---
name: Tauri Mobile (iOS / Android)
description: Use when the user asks about Tauri 2.x mobile targets, building for iOS / Android, mobile entry point, mobile-specific permissions, or porting a desktop Tauri app to mobile.
version: 0.1.0
---

# Tauri 2.x Mobile (iOS / Android)

Tauri 2.x supports iOS and Android in addition to desktop. The same Rust core compiles to all five targets. This skill is for shipping the same product on mobile (or planning that path).

## Init mobile from an existing Tauri 2.x project

```bash
pnpm tauri ios init
pnpm tauri android init
```

Generates `src-tauri/gen/{apple,android}/` with Xcode project / Gradle project that wraps your Rust core. **Don't edit those generated files** unless you know why; regen overwrites them.

## Required `lib.rs` change

Mobile entry point must be wired. If you scaffolded recently, this is already there:

```rust
// src-tauri/src/lib.rs
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        // ... plugins, commands
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
```

`src-tauri/src/main.rs` (desktop only) calls `app_lib::run()`. Mobile loads `lib.rs` directly via `mobile_entry_point`.

## Dev / build

```bash
# iOS — requires macOS + Xcode + Apple developer account for device
pnpm tauri ios dev                      # simulator
pnpm tauri ios dev --host               # physical device on same network
pnpm tauri ios build --target aarch64

# Android — requires Android Studio + NDK
pnpm tauri android dev                  # emulator or device via adb
pnpm tauri android build --apk
pnpm tauri android build --aab          # for Play Store
```

`pnpm tauri info` reports missing iOS/Android prerequisites and what to install.

## What does/doesn't work

| Feature | iOS | Android | Notes |
|---------|-----|---------|-------|
| `#[tauri::command]` | ✓ | ✓ | Same |
| Capabilities ACL | ✓ | ✓ | Same JSON files |
| Tauri events | ✓ | ✓ | Same |
| Plugins (official) | mostly ✓ | mostly ✓ | Each plugin lists supported platforms |
| `cpal` audio | partial | partial | Use `oboe` (Android) / iOS `AVAudioEngine` via plugin |
| `ort` ONNX Runtime | ✓ | ✓ | Need static linking; CoreML EP on iOS can accelerate |
| `keyring` | ✗ | ✗ | Use `tauri-plugin-keyring` (cross-platform) or platform plugins |
| `tauri-plugin-stronghold` | ✓ | ✓ | Works |
| Webview | WKWebView | Android System WebView | Browser quirks differ |
| File system access | sandboxed | scoped | Always via `fs:scope` |

## Mobile-specific capability example

```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "mobile-main",
  "platforms": ["iOS", "android"],
  "windows": ["main"],
  "permissions": [
    "core:default",
    "log:default",
    "haptics:default",
    "notification:allow-notify",
    "notification:allow-request-permission",
    "biometric:allow-authenticate"
  ]
}
```

`platforms` filters which capability files apply. Combine with desktop ones via `platforms: ["macOS", "linux", "windows"]`.

## Mobile-only plugins worth knowing

| Plugin | Purpose |
|--------|---------|
| `tauri-plugin-haptics` | iOS/Android haptic feedback |
| `tauri-plugin-biometric` | Face ID / Touch ID / Android biometric auth |
| `tauri-plugin-barcode-scanner` | Camera-based barcode/QR |
| `tauri-plugin-nfc` | NFC read/write (Android, iOS NDEF) |
| `tauri-plugin-deep-link` | Custom URL scheme handlers |
| `tauri-plugin-notification` | Local + push notifications |

## Bundle / signing

### iOS

`pnpm tauri ios build` produces an `.ipa` ready for TestFlight / App Store. Provisioning profile + Apple Developer account required. Configure team and bundle id in `src-tauri/gen/apple/<App>.xcodeproj` (Xcode), or via:

```bash
TAURI_APPLE_DEVELOPMENT_TEAM=ABC123XYZ pnpm tauri ios build
```

### Android

```bash
pnpm tauri android build --apk --debug                          # local install
pnpm tauri android build --aab --release                        # Play Store
```

Signing config: place keystore in CI secret, env vars during build:
```bash
ANDROID_KEY_ALIAS=upload \
ANDROID_KEY_PASSWORD=*** \
ANDROID_KEYSTORE_PATH=/secrets/keystore.jks \
ANDROID_KEYSTORE_PASSWORD=*** \
pnpm tauri android build --aab --release
```

## Audio on mobile

cpal works partially on Android via JNI. For low-latency audio (real-time transcription), prefer:
- **Android**: write a native plugin wrapping `oboe`
- **iOS**: write a native plugin wrapping `AVAudioEngine` / Audio Unit

Both are `tauri::plugin::Builder` Rust plugins with platform-conditional FFI. The Tauri docs have a "Develop Mobile Plugins" guide.

## Capability / responsive UI

Mobile webviews are `100vh` of a phone — your Next.js layout needs:
- Touch targets ≥ 44 pt (iOS HIG) / 48 dp (Material)
- Safe-area insets:
  ```css
  body { padding-top: env(safe-area-inset-top); padding-bottom: env(safe-area-inset-bottom); }
  ```
- No horizontal scroll
- Keyboard-aware layouts (iOS pushes content; Android may not — handle manually)

## Build matrix in CI (GitHub Actions example)

```yaml
strategy:
  matrix:
    include:
      - { os: macos-14,    target: ios }
      - { os: macos-14,    target: android }
      - { os: macos-14,    target: aarch64-apple-darwin }
      - { os: macos-13,    target: x86_64-apple-darwin }
      - { os: windows-2022, target: x86_64-pc-windows-msvc }
      - { os: ubuntu-22.04, target: x86_64-unknown-linux-gnu }
```

## Pitfalls

- **`load-dynamic` `ort` on mobile**: prefer static linking — there's no system ONNX Runtime to load. Use the default feature set and bundle the .a/.so.
- **WebRTC / `getUserMedia`**: WKWebView and Android WebView have different permission models. You'll likely need a native plugin for mic access.
- **Build size**: a Tauri Android APK is bigger than a typical hello-world Tauri desktop. Strip debug symbols and use `panic = "abort"` in release.
- **Hot reload across mobile + desktop**: `pnpm tauri ios dev --host` exposes the dev server on your LAN; phones must be on the same network.
- **Different webview engines** = different bugs. Test on a real iOS device and a real low-end Android (Pixel 4a class).
- **No `keyring` crate on mobile**: use `tauri-plugin-stronghold` or a custom plugin around iOS Keychain / Android Keystore.
