---
name: mp:quick
intent: Rapid single-purpose marketplace actions — scan, trust, check, graph
tags:
  - marketplace-pro
  - command
  - quick
inputs: []
risk: medium
cost: medium
description: Rapid single-purpose marketplace actions — scan, trust, check, graph
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Marketplace Pro Quick Commands

Rapid, single-purpose commands for everyday marketplace operations. Each action completes in seconds and produces concise, actionable output.

## Usage
```
/mp:quick <action> [target]
```

## Actions

| Action | Purpose | Target |
|--------|---------|--------|
| `scan` | Project fingerprint + top 3 recommendations | none |
| `trust <plugin>` | Quick trust score lookup | plugin name |
| `check` | Health check (drift, violations, staleness) | none |
| `graph` | Dependency graph of installed plugins | none |

---

## Action: scan

**Purpose:** Quick project fingerprint with the top 3 plugin recommendations.

### Procedure

1. **Scan project root for technology markers:**
   - Check for `package.json`, `tsconfig.json`, `Dockerfile`, `*.tf`, `Chart.yaml`, `go.mod`, `Cargo.toml`, `requirements.txt`, `pyproject.toml`, framework configs
   - Use `Glob` for pattern matching across the project

2. **Detect languages by file extension count:**
   ```bash
   find . -type f -name '*.ts' -o -name '*.tsx' -o -name '*.js' -o -name '*.jsx' -o -name '*.py' -o -name '*.go' -o -name '*.rs' -o -name '*.java' | \
     sed 's/.*\.//' | sort | uniq -c | sort -rn | head -10
   ```

3. **Read installed plugin manifests** to know what capabilities are already covered.

4. **Identify gaps** by comparing detected stack against common associations:
   - k8s + helm but no monitoring plugin -> suggest observability
   - FastAPI but no api-docs plugin -> suggest docs generator
   - Docker but no security scanning plugin -> suggest container security
   - TypeScript but no testing plugin -> suggest test framework

5. **Display output:**

```
MARKETPLACE PRO - QUICK SCAN
=============================

Project: /home/user/project
Stack:   TypeScript | Next.js | Docker | Kubernetes | Helm
Plugins: 4 installed

Top 3 Recommendations:
 #  Plugin                   Relevance  Gap Filled
 1  observability-stack      0.91       monitoring, alerting
 2  vault-integration        0.78       secrets-mgmt
 3  api-docs-generator       0.74       api-docs

Run /mp:recommend for full analysis.
```

### Quick Mode Optimizations
- Skips deep Apriori association mining (uses heuristic rules instead)
- No interactive prompts
- Completes in under 5 seconds

---

## Action: trust

**Purpose:** Instant trust score and grade for a specific plugin.

### Usage
```
/mp:quick trust <plugin-name>
```

### Procedure

1. **Locate the plugin** in `plugins/<plugin-name>/`:
   - Read `.claude-plugin/plugin.json` for manifest data
   - If not found, report error and exit

2. **Compute quick trust score** using available local signals:

   | Factor | Weight | Source |
   |--------|--------|--------|
   | Signed | 0.25 | Check for `.cpkg` signature or `signatures/` dir |
   | Code Analysis | 0.30 | Quick grep for dangerous patterns (eval, exec, curl) |
   | Freshness | 0.20 | Last modified date of plugin files |
   | Manifest Quality | 0.15 | Completeness of plugin.json fields |
   | Permissions | 0.10 | Whether permissions are declared |

3. **Display output:**

```
TRUST SCORE: marketplace-pro
==============================

  Overall:  82 / 100
  Grade:    B

  Factors:
    Signed:           70  (weight 0.25)  -- no signature found
    Code Analysis:    90  (weight 0.30)  -- no dangerous patterns
    Freshness:        85  (weight 0.20)  -- updated 3 days ago
    Manifest Quality: 80  (weight 0.15)  -- missing 'repository' field
    Permissions:      75  (weight 0.10)  -- permissions not declared

  Warnings:
    - Plugin is unsigned. Consider signing with /mp:verify --sign
    - No permissions declared in manifest

Run /mp:trust marketplace-pro for full audit.
```

### Error Cases
- Plugin not found: `Error: Plugin '<name>' not found in plugins/. Run /mp:status to see installed plugins.`
- Manifest missing: `Error: No plugin.json found at plugins/<name>/.claude-plugin/plugin.json`

---

## Action: check

**Purpose:** Quick health check across lockfile drift, policy violations, and plugin staleness.

### Procedure

1. **Lockfile drift check:**
   - Read `plugin-lock.json` if it exists
   - Compare pinned plugin versions against actual `plugin.json` versions in `plugins/`
   - Flag any mismatches (version changed, plugin added/removed without lockfile update)

2. **Policy violation check:**
   - Read `.claude/policies/plugins.yaml` if it exists
   - For each installed plugin:
     - Check trust score against minimum threshold
     - Check if plugin is on blocklist
     - In strict mode, check if plugin is on allowlist
   - Report any violations

3. **Staleness check:**
   - Check last modification time of each plugin directory
   - Flag plugins not updated in more than 90 days as "stale"
   - Flag plugins not updated in more than 180 days as "very stale"

4. **Display output:**

```
MARKETPLACE PRO - HEALTH CHECK
================================

  Lockfile:  plugin-lock.json
  Policy:    .claude/policies/plugins.yaml
  Plugins:   4 installed

  Lockfile Drift:
    [OK]   marketplace-pro          v1.0.0 matches
    [OK]   aws-eks-helm-keycloak    v1.2.0 matches
    [DRIFT] fastapi-backend         locked: v0.7.0  actual: v0.8.0
    [NEW]  frontend-design-system   not in lockfile

  Policy Violations:
    [OK]   No violations found

  Staleness:
    [OK]   marketplace-pro          3 days ago
    [OK]   aws-eks-helm-keycloak    1 week ago
    [STALE] fastapi-backend         94 days ago
    [OK]   frontend-design-system   2 days ago

  Summary: 2 issues found
    - 1 lockfile drift (run /mp:lock sync to fix)
    - 1 stale plugin (run /mp:quick trust fastapi-backend)
```

### When no config files exist:
```
  Lockfile:  NOT FOUND (run /mp:setup or /mp:lock init)
  Policy:    NOT FOUND (run /mp:setup or /mp:policy init)
  Plugins:   4 installed

  Skipping lockfile drift and policy checks.

  Staleness:
    ...
```

---

## Action: graph

**Purpose:** Display the dependency graph of all installed plugins based on capability provides/requires.

### Procedure

1. **Read all plugin manifests** from `plugins/*/. claude-plugin/plugin.json`.

2. **Build adjacency list** from capabilities:
   - For each plugin's `requires`, find which plugin `provides` that capability
   - Record directed edges: provider -> consumer

3. **Detect issues:**
   - Unsatisfied requirements (no provider found)
   - Circular dependencies
   - Orphan plugins (no edges in or out)

4. **Display output:**

```
MARKETPLACE PRO - DEPENDENCY GRAPH
=====================================

  Plugins: 4 installed
  Edges:   2 dependencies
  Cycles:  None

  Graph:
  +---------------------------------------------------------------+
  |                                                               |
  |  marketplace-pro                                              |
  |    requires: plugin-registry -----> (UNSATISFIED)             |
  |    provides: plugin-composition, supply-chain-security,       |
  |              trust-scoring, contextual-recommendations,       |
  |              plugin-dev-tools, federated-registries,           |
  |              policy-enforcement, plugin-lockfile               |
  |                                                               |
  |  aws-eks-helm-keycloak                                        |
  |    requires: (none)                                           |
  |    provides: eks-deployment, helm-management,                 |
  |              keycloak-auth                                     |
  |                                                               |
  |  fastapi-backend                                              |
  |    requires: (none)                                           |
  |    provides: fastapi-scaffolding, api-endpoints               |
  |                                                               |
  |  frontend-design-system                                       |
  |    requires: (none)                                           |
  |    provides: design-tokens, component-library                 |
  |                                                               |
  +---------------------------------------------------------------+

  Warnings:
    - marketplace-pro requires 'plugin-registry' but no installed
      plugin provides it. Consider installing a registry plugin.

  Legend:
    ----->  depends on (requires capability from)
    (UNSATISFIED)  no installed plugin provides this capability
```

### ASCII graph for complex dependencies:

When there are actual inter-plugin edges, render a layered ASCII DAG:

```
  Execution Order (topological sort):
  Layer 0:  plugin-a, plugin-b       (no dependencies)
  Layer 1:  plugin-c                 (depends on a)
  Layer 2:  plugin-d                 (depends on b, c)

  plugin-a ----+
               +--> plugin-c ----+
  plugin-b ----+                 +--> plugin-d
               +--------------------+
```

---

## General Notes

- All quick commands are non-interactive (no prompts).
- All quick commands exit with code 0 on success, 1 on error.
- Output is designed for terminal readability with consistent formatting.
- For deeper analysis, each quick command suggests the corresponding full command.
