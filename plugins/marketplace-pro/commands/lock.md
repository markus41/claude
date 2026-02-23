---
name: mp:lock
description: Manage deterministic lockfiles for reproducible plugin installations across environments
arguments:
  - name: action
    description: "Action: generate, check, diff, or install"
    required: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# /mp:lock — Plugin Lockfile Management

Manage deterministic lockfiles for reproducible plugin installations across environments.

## Usage

### `generate`

Generate a `plugin-lock.json` from the current installed state.

```
/mp:lock generate
```

Resolves all installed plugins through the federation engine and records:
- Exact version numbers
- SHA-512 integrity hashes
- Source registry for each plugin
- Full resolved URL/path
- Dependency list
- Timestamp

The lockfile is written to `plugin-lock.json` in the project root.

### `check`

Verify that installed plugins match the lockfile.

```
/mp:lock check
```

Detects drift:
- **Version mismatches** — A plugin's version differs from the lockfile
- **Integrity mismatches** — A plugin's content hash differs (modified files)
- **Source changes** — A plugin is now coming from a different registry
- **Missing plugins** — Plugins in the lockfile that are not installed
- **Unlocked plugins** — Installed plugins not tracked in the lockfile

Exit codes:
- `0` — All plugins match the lockfile
- `1` — Drift detected

### `diff`

Show what changed since the last lockfile generation.

```
/mp:lock diff
```

Produces a human-readable diff suitable for PR reviews:

```
## Plugin Lockfile Changes

### Added
+ **new-plugin** v1.0.0 (from public)

### Removed
- **old-plugin** v0.5.0

### Updated
~ **existing-plugin** 1.2.3 -> 1.3.0

### Source Changed
! **moved-plugin** registry: public -> team-internal

---
*4 plugin(s) affected*
```

### `install`

Install plugins from the lockfile for a reproducible environment.

```
/mp:lock install
```

Reads `plugin-lock.json` and installs each plugin from its recorded source at the exact recorded version. Verifies integrity hashes after installation.

This is the equivalent of `npm ci` — it produces a deterministic result matching the lockfile exactly.

## Lockfile Format

```json
{
  "lockVersion": 1,
  "generatedAt": "2026-02-23T12:00:00.000Z",
  "registries": {
    "local": "./plugins",
    "public": "https://marketplace.claude.dev/registry.json"
  },
  "plugins": {
    "plugin-name": {
      "version": "1.2.3",
      "integrity": "sha256-abc123...",
      "source": "local",
      "resolved": "./plugins/plugin-name",
      "dependencies": ["other-plugin"],
      "installedAt": "2026-02-23T12:00:00.000Z"
    }
  }
}
```

## Best Practices

1. **Commit the lockfile** — `plugin-lock.json` should be checked into version control
2. **Use `check` in CI** — Fail CI builds if installed plugins don't match the lockfile
3. **Review diffs in PRs** — Use `diff` output to review plugin changes before merging
4. **Use `install` in production** — Deploy from the lockfile for reproducible environments

## Implementation

**Engine:** `src/federation/registry.ts` — `LockfileManager` class.
