---
name: tauri-scaffold
intent: Bootstrap a new Tauri 2.x desktop app with Next.js 15 shell, Stronghold/log plugins, and capability files
tags:
  - tauri-desktop-studio
  - command
  - scaffold
inputs: []
risk: low
cost: low
description: Bootstrap a new Tauri 2.x desktop app with Next.js 15 shell, Stronghold/log plugins, and capability files
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
---

# Scaffold Tauri 2.x Desktop App

Bootstrap a production-ready Tauri 2.x project with the Discovery Co-Pilot stack as a baseline.

## Steps

1. **Create app via official scaffolder:**
   ```bash
   pnpm create tauri-app@latest -- --template next-ts --identifier com.example.app
   cd <app-name>
   pnpm install
   ```

2. **Add the canonical plugin set:**
   ```bash
   cd src-tauri
   cargo add tauri-plugin-stronghold tauri-plugin-log tauri-plugin-shell
   cd ..
   pnpm add @tauri-apps/plugin-stronghold @tauri-apps/plugin-log @tauri-apps/plugin-shell
   ```

3. **Wire plugins in `src-tauri/src/lib.rs`:**
   ```rust
   #[cfg_attr(mobile, tauri::mobile_entry_point)]
   pub fn run() {
       tauri::Builder::default()
           .plugin(tauri_plugin_log::Builder::new().build())
           .plugin(tauri_plugin_shell::init())
           .plugin(tauri_plugin_stronghold::Builder::new(|password| {
               argon2::hash_raw(
                   password.as_ref(),
                   b"static-salt-or-derived",
                   &argon2::Config::default(),
               ).unwrap()
           }).build())
           .invoke_handler(tauri::generate_handler![])
           .run(tauri::generate_context!())
           .expect("error while running tauri");
   }
   ```

4. **Create capability file** at `src-tauri/capabilities/main.json`:
   ```json
   {
     "$schema": "https://schema.tauri.app/config/2/capability",
     "identifier": "main-capability",
     "description": "Main webview capability",
     "windows": ["main"],
     "permissions": [
       "core:default",
       "log:default",
       "shell:allow-open",
       "stronghold:default"
     ]
   }
   ```

5. **Configure `src-tauri/tauri.conf.json`:**
   - Set `productName`, `identifier`, `version`
   - `build.devUrl: "http://localhost:3000"`, `build.frontendDist: "../out"`
   - `build.beforeDevCommand: "pnpm dev"`, `build.beforeBuildCommand: "pnpm build"`
   - Lock CSP: `"connect-src": "ipc: http://ipc.localhost"` plus your API origins
   - Keep `withGlobalTauri: false` (use ES module imports)

6. **Next.js 15 config** (`next.config.mjs`):
   ```js
   export default {
     output: 'export',
     images: { unoptimized: true },
     trailingSlash: true,
   };
   ```
   Static export is required because Tauri loads bundled HTML, not a Node server.

7. **Verify:** `pnpm tauri dev` should open the window and HMR.

## Notes

- Use `pnpm` (workspaces), not `npm`. Concurrently is already pulled in by the template.
- For ECAPA-TDNN/Silero workloads, also run `/tauri-ipc` to scaffold an audio command and add `cpal`, `ort`, `nnnoiseless` to `Cargo.toml`.
