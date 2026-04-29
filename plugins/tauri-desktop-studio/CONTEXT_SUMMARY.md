---
name: Tauri Desktop Studio
description: Production Tauri 2.x desktop app plugin for Rust + Next.js stacks
---

# Tauri Desktop Studio

Tauri 2.x desktop apps with Rust audio/ML backends and Next.js 15 / React 19 frontends.

## Stack

| Layer | Tech |
|-------|------|
| Shell | Tauri 2.10, Rust 1.78 |
| Plugins | tauri-plugin-stronghold, log, shell |
| Renderer | Next.js 15, React 19, Zustand 5, Framer Motion 11, R3F |
| Audio I/O | cpal 0.15, nnnoiseless, crossbeam-channel, tokio |
| Inference | ort 2.0-rc.12 (ONNX), Silero VAD, ECAPA-TDNN |
| Auth + Secrets | keyring, argon2, sha2, Stronghold, OAuth PKCE |
| Tooling | pnpm, vitest 2, hound, ESLint 9, Prettier 3 |

## Commands

`/tauri-scaffold`, `/tauri-dev`, `/tauri-build`, `/tauri-ipc`, `/tauri-capability`

## Skills

`tauri-config`, `rust-audio-pipeline`, `onnx-inference`, `tauri-ipc-commands`, `stronghold-vault`, `oauth-pkce-desktop`, `nextjs-static-export`

## Agents

- `tauri-architect` (opus) — IPC topology, multi-window, security model
- `rust-audio-engineer` (sonnet) — DSP, real-time, ONNX inference
- `desktop-security-reviewer` (sonnet) — capabilities ACL, CSP, secrets, supply chain

## Hard rules

1. **Capabilities, not v1 allowlist.** Every webview gets a capability file.
2. **No secrets in source / `tauri.conf.json`.** keyring or Stronghold.
3. **Audio threads never block** — channel-out, process elsewhere.
4. **ONNX sessions load once** — `Arc<Session>` in app state.
5. **Frontend is static-exported.** No Server Actions / API routes — replace with `invoke()`.

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| Topology / multi-window design | `docs/architecture.md` | Process model, threading |
| Build / runtime error | `docs/troubleshooting.md` | Common failures |
| CLI / permission quick ref | `docs/cheatsheet.md` | Path vars, perms, imports |
| Porting Electron | `docs/migration-electron.md` | API mappings |
| Audio / ONNX | `skills/rust-audio-pipeline/SKILL.md`, `skills/onnx-inference/SKILL.md` | DSP + inference |
| New IPC command | `commands/tauri-ipc.md`, `skills/tauri-ipc-commands/SKILL.md` | Handler + wrapper + perm |
| Capability / CSP audit | `commands/tauri-capability.md`, `agents/desktop-security-reviewer.md` | ACL checklist |
| OAuth / vault | `skills/oauth-pkce-desktop/SKILL.md`, `skills/stronghold-vault/SKILL.md` | PKCE + Argon2 vault |
| Frontend wiring | `skills/nextjs-static-export/SKILL.md` | Static export, Tauri APIs |
