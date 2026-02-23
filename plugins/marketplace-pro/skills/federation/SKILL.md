---
name: federation
description: >-
  Federated registry protocol for multi-source plugin resolution with policy enforcement,
  lockfile management, and conflict detection across local, team, org, and public registries.
triggers:
  - federation
  - federated registry
  - multi-registry
  - plugin policy
  - plugin lockfile
  - registry conflict
related-skills:
  - security
  - composition
---

# Federated Registry Protocol

## Overview

The Federated Registry Protocol enables plugin resolution across multiple registries with configurable priority, security policies, conflict detection, and deterministic lockfiles. It transforms plugin management from a single-source package manager into an enterprise-grade multi-source orchestration system.

## Architecture

```
                  +-----------------+
                  | RegistryClient  |  Fetches and caches registry indexes
                  +--------+--------+
                           |
                  +--------v--------+
                  | RegistryResolver|  Resolves plugins across registries
                  +--------+--------+
                           |
                  +--------v--------+
                  |  PolicyEngine   |  Evaluates allow/deny/require rules
                  +--------+--------+
                           |
                  +--------v--------+
                  | LockfileManager |  Deterministic version pinning
                  +-----------------+
```

## Components

### RegistryClient

Loads configuration from `.claude/registries.json` and fetches plugin indexes from multiple sources. Supports local filesystem directories and remote HTTP(S) URLs.

**Key behaviors:**
- Caches registry data with configurable TTL (default: 1 hour)
- Graceful degradation when registries are unavailable
- Token and OIDC authentication support
- Local directory scanning builds indexes from plugin manifests

### RegistryResolver

Resolves plugin names across all configured registries in priority order (highest first).

**Conflict detection:**
- Same plugin name in multiple registries is detected via SHA-256 content hash comparison
- Resolution strategies: `highest-priority` (default), `error`, `prompt`
- All conflicts are recorded for audit trail

### PolicyEngine

Evaluates security rules from `.claude/policies/plugins.yaml` using short-circuit matching (first match wins).

**Rule types:**
- `allow` — Permits the plugin
- `deny` — Blocks the plugin with a reason
- `require` — Warns when mandatory plugins are missing

**Unless clause:** Exempts matching plugins when ALL conditions are met (trust score threshold, signature verification).

### LockfileManager

Produces `plugin-lock.json` for reproducible plugin environments.

**Capabilities:**
- Generate lockfile from current resolved state
- Detect drift between lockfile and installed plugins
- Produce human-readable diffs for PR reviews
- Install from lockfile for deterministic environments

## Workflow

### Setting Up Federation

1. Configure registries with priorities:
   ```
   /mp:registry add local ./plugins --priority 100
   /mp:registry add team https://plugins.team.dev/index.json --priority 75
   /mp:registry add public https://marketplace.claude.dev/registry.json --priority 0
   ```

2. Define security policy in `.claude/policies/plugins.yaml`

3. Sync registry caches:
   ```
   /mp:registry sync
   ```

### Installing Plugins

1. Resolve plugin across registries (highest priority first)
2. Check policy engine for allow/deny decision
3. Install from the resolved source
4. Update the lockfile:
   ```
   /mp:lock generate
   ```

### CI/CD Integration

1. Commit `plugin-lock.json` to version control
2. In CI: `mp:lock check` to verify no drift
3. In deployment: `mp:lock install` for reproducible environment
4. In PRs: `mp:lock diff` to review plugin changes

### Policy Enforcement

1. Define rules in `.claude/policies/plugins.yaml`
2. Audit installed plugins: `/mp:policy enforce`
3. Check individual plugins: `/mp:policy check <name>`

## Configuration Files

| File | Purpose |
|------|---------|
| `.claude/registries.json` | Registry sources and federation settings |
| `.claude/policies/plugins.yaml` | Security policy rules |
| `plugin-lock.json` | Deterministic version lock |
| `config/registries.default.json` | Default registry configuration |
| `config/policies.default.yaml` | Default security policy |

## Commands

| Command | Description |
|---------|-------------|
| `/mp:registry add` | Add a registry source |
| `/mp:registry remove` | Remove a registry |
| `/mp:registry list` | Show configured registries |
| `/mp:registry sync` | Refresh all caches |
| `/mp:policy check` | Check a plugin against policy |
| `/mp:policy list` | Show policy rules |
| `/mp:policy enforce` | Audit installed plugins |
| `/mp:lock generate` | Create lockfile from current state |
| `/mp:lock check` | Verify plugins match lockfile |
| `/mp:lock diff` | Show changes since last lock |
| `/mp:lock install` | Install from lockfile |

## Source Code

- Types: `src/federation/types.ts`
- Engine: `src/federation/registry.ts`
- Config: `config/registries.default.json`
- Policy: `config/policies.default.yaml`
