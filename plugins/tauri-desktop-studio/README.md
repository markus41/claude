# Tauri Desktop Studio

Production-grade plugin for building Tauri 2.x desktop applications with Rust backends and Next.js 15 / React 19 frontends. Modeled on the Discovery Co-Pilot stack (real-time audio capture, on-device ML inference, OAuth PKCE, Stronghold secrets).

## What's inside

### Commands

| Command | Purpose |
|---------|---------|
| `/tauri-scaffold` | Bootstrap a new Tauri 2.x app with Next.js shell + Stronghold/log/shell plugins |
| `/tauri-dev` | Run the dev loop (`tauri dev`) with HMR + Rust hot reload |
| `/tauri-build` | Production bundle with Authenticode/notarization/updater signing |
| `/tauri-ipc` | Generate a complete IPC roundtrip (Rust handler + TS wrapper + permission) |
| `/tauri-capability` | Author or audit a capability JSON for capability-based ACL |

### Skills

- **tauri-config** — `tauri.conf.json`, capabilities, CSP, asset protocol
- **rust-audio-pipeline** — cpal capture, WASAPI loopback, RNNoise, ring buffers, lock-free threading
- **onnx-inference** — ort 2.0-rc.12 sessions, Silero VAD, ECAPA-TDNN speaker embeddings
- **tauri-ipc-commands** — `#[tauri::command]`, state, async, errors, events, channels
- **stronghold-vault** — encrypted vault, Argon2-derived keys, key rotation
- **oauth-pkce-desktop** — Authorization Code + PKCE with loopback redirect, keyring storage
- **nextjs-static-export** — Next.js 15 + React 19 inside Tauri (what works, what doesn't)

### Agents

- **tauri-architect** (opus) — multi-process design, IPC topology, security boundaries
- **rust-audio-engineer** (sonnet) — DSP, real-time constraints, ML inference plumbing
- **desktop-security-reviewer** (sonnet) — capabilities ACL audit, CSP, secret handling, supply chain

## Stack baseline

| Layer | Default |
|-------|---------|
| Shell | Tauri 2.10 (Rust 1.78, edition 2021) |
| Plugins | tauri-plugin-stronghold, tauri-plugin-log, tauri-plugin-shell |
| Renderer | Next.js 15, React 19, Zustand 5, Framer Motion 11 |
| 3D | React Three Fiber, drei, postprocessing, Three 0.169, Rive |
| Audio I/O (Rust) | cpal 0.15, nnnoiseless 0.5, crossbeam-channel 0.5 |
| Inference (Rust) | ort 2.0-rc.12 (ONNX Runtime), Silero VAD, ECAPA-TDNN |
| Concurrency | tokio, tokio-tungstenite, parking_lot, bytes |
| Auth + Secrets | keyring 3, argon2 0.5, sha2, Stronghold |
| Backend (optional) | FastAPI + Uvicorn + Pydantic 2 + httpx |
| Tests | vitest 2 (renderer), hound (WAV fixtures), mockito (WS) |
| Build | pnpm workspaces, concurrently, tsc 5.6, ESLint 9 flat, Prettier 3 |

## Documentation

- [`docs/architecture.md`](docs/architecture.md) — full architecture, IPC topology, threading model
- [`docs/cheatsheet.md`](docs/cheatsheet.md) — quick reference: permissions, paths, common commands
- [`docs/migration-electron.md`](docs/migration-electron.md) — Electron → Tauri 2 playbook
- [`docs/troubleshooting.md`](docs/troubleshooting.md) — common errors and fixes

## Installation

This plugin lives in the marketplace. Install via:
```
/plugin install tauri-desktop-studio
```

## License

MIT
