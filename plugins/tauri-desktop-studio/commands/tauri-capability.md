---
name: tauri-capability
intent: Author or audit a Tauri 2.x capability JSON for capability-based ACL permissions
tags:
  - tauri-desktop-studio
  - command
  - capability
  - security
inputs: []
risk: medium
cost: low
description: Author or audit a Tauri 2.x capability JSON for capability-based ACL permissions
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
---

# Capability ACL Authoring & Audit

Tauri 2.x replaced v1's `allowlist` with **capabilities** — per-window permission bundles enforced at runtime. This command authors a new capability or audits an existing one for over-privilege.

## Capability file shape

`src-tauri/capabilities/<name>.json`:
```json
{
  "$schema": "https://schema.tauri.app/config/2/capability",
  "identifier": "main-capability",
  "description": "Main app webview",
  "windows": ["main"],
  "permissions": [
    "core:default",
    "log:default",
    "shell:allow-open",
    "stronghold:default",
    {
      "identifier": "fs:scope",
      "allow": ["$APPDATA/transcripts/**", "$DOCUMENT/exports/**"],
      "deny": ["$APPDATA/secrets/**"]
    }
  ]
}
```

## Authoring rules

1. **One capability per webview boundary.** External webviews (e.g. an OAuth popup) get their own minimal capability.
2. **Prefer scoped permissions over `:default`.** `fs:default` grants broad FS access; `fs:allow-read-text-file` + a scope clause is much tighter.
3. **No wildcards in scopes.** `"allow": ["**"]` defeats the model. Always anchor to a path variable like `$APPDATA`, `$DOCUMENT`, `$RESOURCE`.
4. **Plugin permissions** are namespaced: `<plugin>:<perm>`. E.g. `dialog:allow-open`, `stronghold:allow-create-client`.
5. **Custom commands** also need permissions — see `/tauri-ipc` for the `permissions/*.toml` pattern.

## Audit checklist

When reviewing an existing capability:

| Check | Action |
|-------|--------|
| Uses `"core:allow-*"` raw access? | Replace with the most specific permission. |
| `fs` permissions without `fs:scope`? | Add a scope clause. |
| Same capability covers multiple webviews? | Split — different trust levels = different capabilities. |
| Capability identifier in source control matches deployed? | Capability changes are runtime-enforced; mismatched files silently lose perms. |
| Plugin in `Cargo.toml` but no permission granted? | Either remove the plugin or add `<plugin>:default`. |

## Verify

```bash
pnpm tauri dev
# Trigger every UI path that uses Tauri APIs.
# A blocked permission throws "is not allowed by the capability configuration"
# in the renderer console — that's the signal to add (or refuse) the permission.
```
