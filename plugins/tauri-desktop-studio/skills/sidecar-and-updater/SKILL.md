---
name: Sidecar Binaries & Advanced Updater
description: Use when the user asks about Tauri sidecar binaries (externalBin), bundling Python / Node / native CLIs with the app, advanced auto-updater patterns (staged rollouts, mandatory updates, custom endpoints, signing).
version: 0.1.0
---

# Sidecar Binaries & Advanced Updater

## Sidecar binaries (`externalBin`)

Sidecar = an executable bundled with the app, callable from Rust. Use for:
- Pre-existing CLIs (ffmpeg, yt-dlp, ripgrep, custom Python tools)
- Models that ship as a separate runtime (whisper.cpp, llama.cpp, ollama-style)
- Pre-built native helpers you don't want to compile via Cargo

### Configure

```jsonc
// src-tauri/tauri.conf.json
{
  "bundle": {
    "externalBin": [
      "binaries/ffmpeg",
      "binaries/whisper-cpp"
    ]
  }
}
```

Sidecars must follow a strict naming convention with a triple suffix:
```
binaries/
  ffmpeg-x86_64-pc-windows-msvc.exe
  ffmpeg-x86_64-apple-darwin
  ffmpeg-aarch64-apple-darwin
  ffmpeg-x86_64-unknown-linux-gnu
```
Tauri picks the right one for the build target. Add capability:
```json
{ "permissions": [{ "identifier": "shell:allow-execute", "allow": [{ "name": "binaries/ffmpeg", "sidecar": true, "args": true }] }] }
```

### Execute from Rust

```rust
use tauri_plugin_shell::{ShellExt, process::CommandEvent};

#[tauri::command]
async fn transcribe_offline(app: tauri::AppHandle, path: String) -> Result<String, String> {
    let sidecar = app.shell()
        .sidecar("whisper-cpp")
        .map_err(|e| e.to_string())?
        .args(["-m", "models/ggml-large-v3-turbo.bin", "-f", &path, "-otxt"]);

    let (mut rx, mut child) = sidecar.spawn().map_err(|e| e.to_string())?;

    let mut stdout = String::new();
    while let Some(event) = rx.recv().await {
        match event {
            CommandEvent::Stdout(line_bytes) => {
                stdout.push_str(&String::from_utf8_lossy(&line_bytes));
            }
            CommandEvent::Stderr(line_bytes) => {
                tracing::debug!(stderr = %String::from_utf8_lossy(&line_bytes));
            }
            CommandEvent::Terminated(payload) => {
                if payload.code != Some(0) {
                    return Err(format!("sidecar exit {:?}", payload.code));
                }
            }
            _ => {}
        }
    }
    Ok(stdout)
}
```

### Execute from JS

```typescript
import { Command } from '@tauri-apps/plugin-shell';

const cmd = Command.sidecar('binaries/ffmpeg', ['-i', input, '-c:a', 'pcm_s16le', '-ar', '16000', output]);
cmd.stderr.on('data', (line) => console.log('ffmpeg:', line));
cmd.on('close', (data) => console.log('exit', data.code));
await cmd.spawn();
```

### Sourcing sidecar binaries in CI

Don't commit binaries — fetch in CI and place under `src-tauri/binaries/` before `tauri build`:
```yaml
- name: Fetch ffmpeg
  run: |
    mkdir -p src-tauri/binaries
    curl -L "$FFMPEG_URL" -o ffmpeg.tar.xz
    tar -xf ffmpeg.tar.xz
    mv ffmpeg-*/ffmpeg src-tauri/binaries/ffmpeg-${{ matrix.target }}
    chmod +x src-tauri/binaries/*
```

## Advanced updater (`tauri-plugin-updater`)

### Standard config

```jsonc
// tauri.conf.json
"plugins": {
  "updater": {
    "active": true,
    "endpoints": [
      "https://releases.example.com/{{target}}/{{arch}}/{{current_version}}"
    ],
    "pubkey": "<base64 ed25519 public key>",
    "windows": {
      "installMode": "passive"
    }
  }
}
```

`installMode` options:
- `passive` — default, shows installer with progress
- `quiet` — silent install, no UI
- `basicUi` — minimal installer

### Update endpoint contract

The endpoint must respond:
- **204**: no update available
- **200 + JSON**: update info

```json
{
  "version": "1.4.3",
  "notes": "## Fixes\n- Crash on import\n- ...",
  "pub_date": "2026-04-30T12:00:00Z",
  "platforms": {
    "windows-x86_64": {
      "signature": "<base64 signature of the .nsis>",
      "url": "https://releases.example.com/myapp_1.4.3_x64-setup.nsis.zip"
    },
    "darwin-aarch64": {
      "signature": "<base64 signature>",
      "url": "https://releases.example.com/myapp_1.4.3_aarch64.app.tar.gz"
    },
    "linux-x86_64": {
      "signature": "<base64 signature>",
      "url": "https://releases.example.com/myapp_1.4.3_amd64.AppImage.tar.gz"
    }
  }
}
```

### Check + install in JS

```typescript
import { check } from '@tauri-apps/plugin-updater';
import { relaunch } from '@tauri-apps/plugin-process';
import { ask } from '@tauri-apps/plugin-dialog';

const update = await check();
if (update?.available) {
  const ok = await ask(`Update to ${update.version}?\n\n${update.body}`, {
    title: 'Update available',
    kind: 'info',
  });
  if (ok) {
    let downloaded = 0;
    let total = 0;
    await update.downloadAndInstall((event) => {
      switch (event.event) {
        case 'Started': total = event.data.contentLength ?? 0; break;
        case 'Progress': downloaded += event.data.chunkLength; break;
        case 'Finished': /* installer launches automatically */ break;
      }
    });
    await relaunch();
  }
}
```

### Patterns the basic config doesn't cover

#### 1. Staged rollout — serve update to N% of users

Implement on the **endpoint side** (your Worker / S3 + edge function). Hash the device id deterministically and gate:
```typescript
// Worker route /releases/:target/:arch/:current
const deviceId = url.searchParams.get('device_id') ?? crypto.randomUUID();
const bucket = (await sha256(deviceId))[0] % 100;
const rolloutPct = await env.KV.get('rollout:1.4.3', { type: 'json' }) ?? 0;
if (bucket >= rolloutPct) return new Response(null, { status: 204 });   // not yet
return Response.json(updateManifest);
```
Push the rollout percentage forward over hours/days; instant rollback if the metrics dashboard shows regressions.

#### 2. Mandatory update floor — block app launch below a min version

```json
{
  "version": "1.4.3",
  "minimum_required_version": "1.4.0",
  ...
}
```
Tauri doesn't enforce this natively — read it in your update-check logic and refuse to start the main UI if `currentVersion < minimum_required_version`.

#### 3. Beta channel

Two endpoints, one config:
```jsonc
"endpoints": [
  "https://releases.example.com/stable/{{target}}/{{current_version}}",
  "https://releases.example.com/beta/{{target}}/{{current_version}}"
]
```
Tauri tries them in order. Or store user preference in app state and pick which one to query.

#### 4. Custom installer hook (Windows post-install)

In `tauri.conf.json`:
```jsonc
"bundle": {
  "windows": {
    "nsis": {
      "installerHooks": "./build/installer-hooks.nsh"
    }
  }
}
```
Use to:
- Migrate user data on upgrade
- Register file associations
- Install a Windows service helper

#### 5. Differential updates

Tauri builds one full installer per release. For very large apps, implement diff updates server-side (xdelta-based) and ship both `full` and `patch` URLs in the manifest. Tauri's stock plugin doesn't ship a differential client — write your own `applyPatch` command if size matters.

### Signing keys

```bash
pnpm tauri signer generate -w ~/.tauri/myapp.key
# Public key: paste into tauri.conf.json
# Private key: NEVER commit
```

In CI:
```yaml
env:
  TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY_PASSWORD }}
```
`pnpm tauri build` auto-signs updater artifacts when these are set.

### Update endpoint in front of R2

Stick the manifest behind a Worker that reads from KV / R2:
```typescript
// /releases/:channel/:target/:arch/:current
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const m = new URL(req.url).pathname.match(/^\/releases\/(stable|beta)\/([\w-]+)\/([\w-]+)\/(\d+\.\d+\.\d+)/);
    if (!m) return new Response('not found', { status: 404 });
    const [_, channel, target, arch, current] = m;

    const manifest = await env.RELEASES.get<Manifest>(`${channel}:latest`, 'json');
    if (!manifest) return new Response(null, { status: 204 });
    if (semverGte(current, manifest.version)) return new Response(null, { status: 204 });
    if (!manifest.platforms[`${target}-${arch}`]) return new Response(null, { status: 204 });

    return Response.json(manifest, { headers: { 'cache-control': 'public, max-age=60' }});
  }
};
```
This pairs nicely with the **cloudflare-workers-stack** plugin's R2 + KV bindings.

## Pitfalls

- **Sidecar architecture mismatch**: missing the right triple suffix → "binary not found" at runtime. Always supply all targets.
- **Forgetting to sign updater artifacts**: Tauri rejects unsigned updates at install with "signature missing".
- **Public key in config different from key that signed**: silent failure at install — verify locally with `tauri signer verify`.
- **Endpoint returning 200 + empty body** when no update: Tauri parses as JSON and errors. Use 204.
- **Mac codesign + notarize timing**: notarization can take minutes. CI must wait for `notarytool wait` to complete before publishing the artifact.
- **Side-loading sidecars**: if you `chmod +x` only the file users will run, but not the bundler — bundle output won't be executable. Set permissions before `tauri build`.
