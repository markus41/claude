---
name: mp:registry
description: Manage federated plugin registries with priority-based resolution and policy enforcement
arguments:
  - name: action
    description: "Action: add <name> <url>, remove <name>, list, or sync"
    required: true
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# /mp:registry — Federated Registry Management

Manage federated plugin registries. Plugins can be sourced from multiple registries (local, team, organization, public) with configurable priority and policy enforcement.

## Usage

### `add <name> <url> --priority <n>`

Add a new registry source to the federation.

```
/mp:registry add team-internal https://plugins.team.internal/registry.json --priority 50
/mp:registry add company-registry https://registry.corp.example.com/index.json --priority 75
/mp:registry add local-dev ./my-plugins --priority 100
```

**Parameters:**
- `name` — Unique identifier for the registry (used in policy rules and lockfiles)
- `url` — URL or local path to the registry index
- `--priority <n>` — Resolution priority (0-100). Higher values are checked first.
  - 100: Project-local plugins
  - 75: Team/organization registries
  - 50: Company-wide registries
  - 0: Public marketplace
- `--auth <method>` — Authentication: `token:ENV_VAR`, `oidc:provider`, or `none` (default)
- `--policy <mode>` — Policy mode: `enforce`, `allow-listed`, or `open` (default)

### `remove <name>`

Remove a registry from the federation.

```
/mp:registry remove team-internal
```

Removes the registry and invalidates its cache. Does not uninstall plugins sourced from it.

### `list`

Show all configured registries with their status, priority, and cached plugin counts.

```
/mp:registry list
```

Output shows:
- Registry name and URL
- Priority level
- Policy mode
- Enabled/disabled status
- Cache age and plugin count (if cached)
- Any fetch errors from last sync

### `sync`

Force-refresh all registry caches, ignoring TTL.

```
/mp:registry sync
```

Fetches fresh plugin indexes from all enabled registries. Reports success/failure for each registry and the number of plugins discovered.

## How It Works

The federation engine resolves plugins by checking registries in priority order (highest first). When the same plugin exists in multiple registries:

1. **Content hash comparison** — SHA-256 hashes are compared to detect conflicts
2. **Conflict resolution** — Based on the configured strategy:
   - `highest-priority` (default): Use the highest-priority registry
   - `error`: Fail with a conflict error
   - `prompt`: Ask the user to choose

## Configuration

Registries are stored in `.claude/registries.json`. The default configuration is at `plugins/marketplace-pro/config/registries.default.json`.

## Implementation

**Engine:** `src/federation/registry.ts` — `RegistryClient` and `RegistryResolver` classes.
