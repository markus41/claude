# Tauri Desktop Studio — Architecture

End-to-end architecture for a Tauri 2.x desktop app with real-time audio capture, on-device ML, and an OAuth-authenticated cloud backend.

## Process topology

```
┌──────────────────────────────── Tauri Process ────────────────────────────────┐
│                                                                                │
│  ┌──────────── Webview (Next.js 15 / React 19) ──────────────┐                 │
│  │  Components → Zustand store → invoke() / listen()          │                 │
│  └──────────────────────┬─────────────────────────────────────┘                 │
│                         │  IPC (capability-checked)                              │
│  ┌──────────────────────▼─────────────────────────────────────┐                 │
│  │  Tauri Core (Rust)                                          │                 │
│  │  ├── invoke_handler! → commands/*.rs                        │                 │
│  │  ├── AppState { audio: Arc<AudioPipeline>, inf: Arc<Inf> }  │                 │
│  │  ├── Plugins: stronghold, log, shell                        │                 │
│  │  └── Tokio runtime                                          │                 │
│  └──────────────────────┬─────────────────────────────────────┘                 │
│                         │                                                        │
│  ┌──────────────────────▼─────────────────────────────────────┐                 │
│  │  Audio thread (cpal RT callback)                            │                 │
│  │     │  bounded crossbeam channel (drop-on-full)              │                 │
│  │  Tokio audio worker (spawn_blocking)                        │                 │
│  │     ├─→ RNNoise (nnnoiseless)                               │                 │
│  │     ├─→ Resample to 16 kHz                                   │                 │
│  │     ├─→ Silero VAD (ort)                                     │                 │
│  │     └─→ ECAPA-TDNN speaker embedding (ort)                   │                 │
│  │  Emit `transcript:chunk` / `audio:level` events              │                 │
│  └─────────────────────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────────┘
       │                                                          │
       │ keyring (refresh tokens)                                 │ HTTPS / WSS
       ▼                                                          ▼
  OS Keychain                                            FastAPI backend
                                                         (transcription,
                                                         compliance routing)
```

## IPC contract

| Direction | Mechanism | Use cases |
|-----------|-----------|-----------|
| Renderer → Rust | `invoke()` | Discrete actions: start capture, sign in, save settings |
| Rust → Renderer | `app.emit()` events | Pub/sub: notifications, state changes |
| Rust → Renderer | `Channel<T>` | Typed streams: audio levels, transcript chunks |

Every IPC entrypoint must be:
1. Listed in the capability file (or in a `permissions/*.toml`)
2. Type-checked on both sides (matching Rust struct ↔ TS interface, with `serde(rename_all = "camelCase")` if needed)
3. Idempotent or explicitly cancellable when long-running

## Threading model

- **cpal callback thread** (RT priority): allocation-free, only `try_send` to the bounded channel.
- **Tokio runtime**: handles all async commands and event emission.
- **`spawn_blocking` pool**: ONNX inference, file I/O over a few KB, anything CPU-heavy that would block the runtime.
- **No ad-hoc `std::thread::spawn`** for app logic — stick to tokio so cancellation and shutdown work cleanly.

## State

- **Renderer state**: Zustand stores for UI-only state (current view, form drafts).
- **Rust app state**: `tauri::State<AppState>` for shared resources (audio pipeline, ONNX sessions, HTTP client).
- **Persistent state**:
  - User preferences → JSON in `$APPCONFIG`
  - Per-user tokens → OS keychain via `keyring`
  - Cryptographic material → Stronghold vault
  - Application data (transcripts, recordings) → SQLite or files in `$APPDATA`

## Security boundaries

| Boundary | Enforcement |
|----------|-------------|
| Webview ↔ Rust | Capability ACL (per-window) |
| Rust ↔ OS resources | Capabilities + scoped FS allow/deny |
| App ↔ network | CSP `connect-src` enumerates origins; reqwest uses cert pinning where it matters |
| App ↔ user secrets | `keyring` (per-user) or Stronghold (Argon2-derived password) |
| Auto-updater | Ed25519 signature verification (Tauri-native) |

## Build & distribution

- `pnpm tauri build --bundles msi,nsis,dmg,appimage`
- Authenticode sign on Windows; notarytool on macOS
- Updater artifacts signed with project keypair (key never in repo)
- Bundle resources for ONNX models — rendered loaded via `BaseDirectory::Resource`

## Observability

- Renderer: `console` → DevTools in dev; production logs forwarded via `@tauri-apps/plugin-log`
- Rust: `log::info!` macros; `tauri-plugin-log` writes to a file in `$APPLOG` and mirrors to the renderer
- Crash reporting (optional): sentry-rust + sentry-electron-style breadcrumbs from JS via a forwarding command
