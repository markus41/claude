# Tauri Desktop Studio — Plugin Instructions

This plugin helps Claude assist with building Tauri 2.x desktop applications, especially those with Rust audio/ML pipelines and Next.js 15 frontends.

## When this plugin should activate

- The user mentions Tauri, `tauri.conf.json`, capabilities, IPC commands, or `#[tauri::command]`
- The user is building a desktop app that needs OS integration, native menus, system tray, or low-latency audio
- The user is migrating from Electron / Tauri v1
- Files like `src-tauri/`, `Cargo.toml` with `tauri = "2"`, or `tauri.conf.json` exist in the workspace

## Default conventions to assume

| Topic | Default |
|-------|---------|
| Package manager | pnpm with workspaces |
| Frontend framework | Next.js 15 + React 19, static export |
| State | Zustand 5 with immer middleware |
| Tauri version | 2.10 (Rust 1.78, edition 2021) |
| Plugins | stronghold, log, shell |
| Audio I/O | cpal 0.15 |
| Inference | ort 2.0-rc.12 (ONNX Runtime) |
| Tests | vitest 2 (renderer), `cargo test` + hound (Rust) |
| Lint | ESLint 9 flat + clippy |

## Hard rules

1. **Capabilities, never `allowlist`.** Tauri 2.x removed v1's allowlist. If you see `allowlist` keys, migrate them.
2. **No secrets in `tauri.conf.json` or source.** Keychain via `keyring`, vault via Stronghold.
3. **Real-time audio threads do not allocate, lock, or log.** Channel-out, process elsewhere.
4. **ONNX sessions are loaded once.** `Arc<Session>` in app state.
5. **Static export for the frontend.** No Server Actions, no API routes — replace with `invoke()`.

## Workflow

EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT

For non-trivial Tauri changes, plan the IPC surface (commands + events + capabilities) **before** writing code. Treat capabilities as a security review checkpoint.

## When to delegate

- Architecture decisions / Electron migration → `tauri-architect` (opus)
- DSP / cpal / ONNX issues → `rust-audio-engineer`
- Pre-release security audit → `desktop-security-reviewer`

## Reference docs

- `CONTEXT_SUMMARY.md` — bootstrap context (loaded by default)
- `docs/architecture.md` — full architecture overview
- `docs/cheatsheet.md` — quick command/permission reference
- `docs/migration-electron.md` — Electron → Tauri 2 migration playbook
- `skills/*/SKILL.md` — domain-specific patterns (load on demand)
- `commands/*.md` — slash commands

## Don't touch

- `src-tauri/target/` (Rust build artifacts)
- `out/` or `.next/` (Next.js build output)
- `node_modules/`
- Auto-updater private keys (anywhere outside the user's home / CI secrets)
