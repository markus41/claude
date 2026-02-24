---
name: mp:status
intent: Dashboard view of the entire marketplace-pro ecosystem — federation, security, intelligence, lockfile, and dev status
tags:
  - marketplace-pro
  - command
  - status
inputs: []
risk: medium
cost: medium
description: Dashboard view of the entire marketplace-pro ecosystem — federation, security, intelligence, lockfile, and dev status
allowed-tools:
  - Bash
  - Read
  - Glob
  - Grep
---

# Marketplace Pro Status Dashboard

Single-command overview of the entire marketplace-pro ecosystem. Reads all configuration files and installed plugins to produce a consolidated dashboard.

## Usage
```
/mp:status
```

No arguments. Produces a read-only dashboard with no side effects.

---

## Procedure

### 1. Gather Data

Read the following files (handle missing gracefully):

| File | Data |
|------|------|
| `.claude/registries.json` | Federation configuration |
| `.claude/policies/plugins.yaml` | Security policy |
| `plugin-lock.json` | Lockfile state |
| `plugins/*/. claude-plugin/plugin.json` | All installed plugin manifests |

Check for running dev servers:
```bash
# Check if any marketplace-pro dev server process is running
ps aux 2>/dev/null | grep -i 'mp-dev\|marketplace.*dev\|plugin.*hot-reload' | grep -v grep || true
```

Check last intelligence scan:
```bash
# Look for cached scan results
ls -la .claude/cache/intelligence-scan.json 2>/dev/null || true
```

### 2. Display Dashboard

```
+==========================================================================+
|                   MARKETPLACE PRO - STATUS DASHBOARD                     |
+==========================================================================+
|  Generated: 2026-02-23T14:30:00Z                                        |
+==========================================================================+

  FEDERATION
  ----------
  Registries configured: 2

  Registry         Type    Enabled  Priority  Status
  ---------------  ------  -------  --------  -----------
  local            local   yes      100       OK (4 plugins)
  org              git     no       50        Disabled
  public           https   yes      10        OK (connected)

  Resolution: priority strategy, prefer local
  Config:     .claude/registries.json

  SECURITY
  --------
  Policy: Moderate
  Config: .claude/policies/plugins.yaml

  Setting                    Value
  -------------------------  ----------------
  Minimum trust score        60 (Grade C)
  Block unsigned             No
  Require verified author    No
  Audit on install           Yes
  Fail on critical findings  Yes

  Trust Score Distribution (installed plugins):
  Grade A (90-100):  ##          2 plugins
  Grade B (80-89):   ##          2 plugins
  Grade C (60-79):                0 plugins
  Grade D (40-59):                0 plugins
  Grade F (0-39):                 0 plugins

  Policy Violations: 0

  INTELLIGENCE
  ------------
  Last scan:        2026-02-22T10:15:00Z (1 day ago)
  Known gaps:       3 (monitoring, secrets-mgmt, api-docs)
  Recommendations:  3 available (run /mp:recommend)

  Detected Stack:
    Languages:      TypeScript (78%), Python (12%)
    Frameworks:     Next.js, FastAPI
    Infrastructure: Docker, Kubernetes, Helm

  LOCKFILE
  --------
  File:      plugin-lock.json
  Generated: 2026-02-22T09:00:00Z

  Plugin                     Locked    Actual    Status
  -------------------------  --------  --------  --------
  marketplace-pro            v1.0.0    v1.0.0    OK
  aws-eks-helm-keycloak      v1.2.0    v1.2.0    OK
  fastapi-backend            v0.7.0    v0.8.0    DRIFT
  frontend-design-system     --        v1.1.0    NEW

  Drift: 1 plugin    New: 1 plugin
  Action: Run /mp:lock sync to update lockfile

  INSTALLED PLUGINS
  -----------------
  4 plugins installed in plugins/

  Plugin                     Version  Provides              Trust
  -------------------------  -------  --------------------  ------
  marketplace-pro            v1.0.0   8 capabilities        B (82)
  aws-eks-helm-keycloak      v1.2.0   3 capabilities        A (91)
  fastapi-backend            v0.8.0   2 capabilities        B (85)
  frontend-design-system     v1.1.0   2 capabilities        A (93)

  DEV STUDIO
  ----------
  Hot-reload servers: None running
  Start with: /mp:dev start

+==========================================================================+
|  Quick Actions:                                                          |
|    /mp:quick check     Detailed health check                            |
|    /mp:quick scan      Refresh recommendations                          |
|    /mp:lock sync       Fix lockfile drift                               |
|    /mp:help            All available commands                            |
+==========================================================================+
```

### 3. Handle Missing Configuration

When configuration files are missing, display placeholder sections:

```
  FEDERATION
  ----------
  Status: NOT CONFIGURED
  Run /mp:setup or /mp:setup --mode=federation-only to configure.
```

```
  SECURITY
  --------
  Status: NOT CONFIGURED
  Run /mp:setup or /mp:setup --mode=security-only to configure.
```

```
  LOCKFILE
  --------
  Status: NOT FOUND
  Run /mp:setup or /mp:lock init to generate.
```

```
  INTELLIGENCE
  ------------
  Last scan: Never
  Run /mp:quick scan or /mp:recommend for first scan.
```

### 4. Minimal Dashboard (no config at all)

If nothing is configured yet:

```
+==========================================================================+
|                   MARKETPLACE PRO - STATUS DASHBOARD                     |
+==========================================================================+

  Setup Status: INCOMPLETE

  [X] Plugin installed        plugins/marketplace-pro/
  [ ] Federation configured   .claude/registries.json
  [ ] Security configured     .claude/policies/plugins.yaml
  [ ] Lockfile generated      plugin-lock.json
  [ ] Intelligence scanned    .claude/cache/intelligence-scan.json

  Run /mp:setup to complete the initial configuration.

  Installed Plugins: 4 found
    marketplace-pro, aws-eks-helm-keycloak, fastapi-backend,
    frontend-design-system

+==========================================================================+
```

---

## Notes

- This command is read-only. It never modifies any files.
- All file reads are wrapped in error handling; missing files produce "NOT CONFIGURED" instead of errors.
- Trust scores are computed on-the-fly using the quick scoring method (same as `/mp:quick trust`).
- The dashboard adapts its width to the terminal but targets 76 characters for readability.
