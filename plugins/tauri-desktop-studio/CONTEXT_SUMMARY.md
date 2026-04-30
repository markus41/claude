---
name: Tauri Desktop Studio
description: Tauri 2.x desktop + mobile plugin (Rust + Next.js + audio-ML)
---

# Tauri Desktop Studio

Tauri 2.x for desktop + iOS + Android with Rust audio/ML, Next.js 15, animation/3D, real-time STT, and forward-looking compliance/distribution patterns.

## Stack

Tauri 2.10 · Rust 1.78 · Next.js 15 · React 19 · Zustand 5 · Framer Motion 11 · R3F + drei + Three 0.169 · Rive · cpal · nnnoiseless · ort 2.0-rc.12 · tokio-tungstenite · keyring · Stronghold · argon2 · Deepgram SDK v5 · mammoth · react-markdown · react-virtuoso · vitest 2 · ESLint 9 flat + eslint-plugin-local · pnpm.

## Commands

`/tauri-scaffold` `/tauri-dev` `/tauri-build` `/tauri-ipc` `/tauri-capability`

## Skills (14)

Core: `tauri-config`, `tauri-ipc-commands`, `nextjs-static-export`. Audio/ML: `rust-audio-pipeline`, `onnx-inference`, `deepgram-streaming-stt`, `realtime-websocket-rust`. UI: `animation-3d-layer`, `document-ingestion`, `multi-window-orchestration`. Security: `stronghold-vault`, `oauth-pkce-desktop`, `compliance-router-pattern`. Distribution: `sidecar-and-updater`, `tauri-mobile-targets`.

## Agents

`tauri-architect` (opus), `rust-audio-engineer` (sonnet), `desktop-security-reviewer` (sonnet).

## Hard rules

1. Capabilities, not v1 allowlist.
2. Secrets in keyring/Stronghold, never source.
3. Audio threads never block.
4. ONNX sessions load once.
5. Frontend static-exported.
6. External AI SDKs via ComplianceRouter (ESLint-enforced).

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| Topology / mobile design | `docs/architecture.md`, `skills/tauri-mobile-targets/SKILL.md` | Process model + mobile |
| Build error | `docs/troubleshooting.md` | Common fixes |
| CLI quick ref | `docs/cheatsheet.md` | Path vars, perms |
| Electron port | `docs/migration-electron.md` | API mappings |
| Audio / ONNX | `skills/rust-audio-pipeline`, `skills/onnx-inference` | DSP + inference |
| Deepgram live STT | `skills/deepgram-streaming-stt` | Token broker, diarize |
| Realtime WS | `skills/realtime-websocket-rust` | tungstenite, reconnect |
| Animation / 3D / Rive | `skills/animation-3d-layer` | FM + R3F + Rive |
| .docx / markdown / virtualized | `skills/document-ingestion` | mammoth, virtuoso |
| Multi-window / PiP / sandbox | `skills/multi-window-orchestration` | per-window caps |
| New IPC | `commands/tauri-ipc.md`, `skills/tauri-ipc-commands` | handler + perm |
| Capability audit | `commands/tauri-capability.md`, `agents/desktop-security-reviewer` | ACL check |
| OAuth / vault | `skills/oauth-pkce-desktop`, `skills/stronghold-vault` | PKCE + Argon2 |
| ComplianceRouter | `skills/compliance-router-pattern` | SDK gating + lint |
| Sidecars / updater | `skills/sidecar-and-updater` | externalBin, rollout |
| iOS / Android | `skills/tauri-mobile-targets` | mobile init + plugins |
| Frontend wiring | `skills/nextjs-static-export` | static export |
