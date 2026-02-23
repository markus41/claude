---
name: mp:setup
description: Interactive setup wizard for marketplace-pro — configures federation, security policies, and project intelligence in one command
arguments:
  - name: mode
    description: "Setup mode: full, quick, security-only, federation-only (default: full)"
    required: false
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# Marketplace Pro Setup Wizard

Interactive, multi-step setup wizard that configures the entire marketplace-pro ecosystem: federated registries, security policies, project intelligence, and plugin lockfile.

## Usage
```
/mp:setup [--mode=full|quick|security-only|federation-only]
```

## Modes
- **full** (default) -- All five steps, interactive prompts at each stage
- **quick** -- Smart defaults, minimal prompts, fastest path to working config
- **security-only** -- Only Step 3 (security policies and trust thresholds)
- **federation-only** -- Only Step 2 (registry configuration)

## Setup Flow

```
+============================================================================+
|                                                                            |
|  __  __            _        _         _                  ____              |
| |  \/  | __ _ _ __| | _____| |_ _ __ | | __ _  ___ ___  |  _ \ _ __ ___  |
| | |\/| |/ _` | '__| |/ / _ \ __| '_ \| |/ _` |/ __/ _ \ | |_) | '__/ _ \ |
| | |  | | (_| | |  |   <  __/ |_| |_) | | (_| | (_|  __/ |  __/| | | (_) ||
| |_|  |_|\__,_|_|  |_|\_\___|\__| .__/|_|\__,_|\___\___| |_|   |_|  \___/ |
|                                 |_|                                        |
|                                                                            |
|                       Interactive Setup Wizard                             |
|                                                                            |
+============================================================================+

  Setup Progress:
    [ ] Step 1: Detect Environment
    [ ] Step 2: Initialize Federation
    [ ] Step 3: Configure Security
    [ ] Step 4: Initial Scan
    [ ] Step 5: Generate Lockfile

  Estimated time: 5-10 minutes (full mode)

```

---

## Step 1: Detect Environment

**Goal:** Understand the current project state before making any changes.

### Actions to perform:

1. **Check plugins directory:**
   ```bash
   ls -d plugins/ 2>/dev/null && echo "EXISTS" || echo "MISSING"
   ```
   - If `plugins/` does not exist, inform the user and offer to create it.

2. **Check for existing registry configuration:**
   ```bash
   test -f .claude/registries.json && echo "EXISTS" || echo "MISSING"
   ```
   - If it exists, read it and display current configuration.
   - If missing, note that Step 2 will create it.

3. **Check for existing installed plugins:**
   ```bash
   ls plugins/*/. 2>/dev/null | head -20
   ```
   - List each installed plugin by reading its `.claude-plugin/plugin.json` manifest.
   - Display count and names.

4. **Detect project type by scanning for framework/language/infra markers:**

   | File / Pattern | Detection |
   |----------------|-----------|
   | `package.json` | Node.js project |
   | `tsconfig.json` | TypeScript |
   | `next.config.*` | Next.js |
   | `nuxt.config.*` | Nuxt |
   | `angular.json` | Angular |
   | `vite.config.*` | Vite |
   | `requirements.txt` or `pyproject.toml` | Python |
   | `go.mod` | Go |
   | `Cargo.toml` | Rust |
   | `pom.xml` or `build.gradle` | Java/JVM |
   | `Dockerfile` | Docker |
   | `docker-compose.y*ml` | Docker Compose |
   | `*.tf` files | Terraform |
   | `helm/` or `Chart.yaml` | Helm |
   | `k8s/` or `kubernetes/` | Kubernetes |
   | `.github/workflows/` | GitHub Actions |
   | `Jenkinsfile` | Jenkins |
   | `.harness/` | Harness CI/CD |
   | `pulumi/` or `Pulumi.yaml` | Pulumi |

   Use `Glob` and `Bash` to check each marker. Collect results into a fingerprint summary.

5. **Display detection results:**
   ```
   =====================================================================
    STEP 1/5: ENVIRONMENT DETECTION
   =====================================================================

    Project Root:      /home/user/project
    Plugins Directory: EXISTS (plugins/)
    Registry Config:   MISSING (will create in Step 2)
    Installed Plugins: 4 found

    Detected Stack:
    +-- Languages:      TypeScript (78%), Python (12%), Shell (10%)
    +-- Frameworks:     Next.js, FastAPI
    +-- Infrastructure: Docker, Kubernetes, Helm, Terraform
    +-- CI/CD:          GitHub Actions
    +-- Patterns:       Monorepo, API Gateway

    Installed Plugins:
    +-- marketplace-pro          v1.0.0
    +-- aws-eks-helm-keycloak    v1.2.0
    +-- fastapi-backend          v0.8.0
    +-- frontend-design-system   v1.1.0

   =====================================================================
   ```

---

## Step 2: Initialize Federation

**Goal:** Create `.claude/registries.json` to configure where plugins are discovered and installed from.

### Default template for `.claude/registries.json`:
```json
{
  "$schema": "https://marketplace-pro.dev/schemas/registries.json",
  "version": "1.0.0",
  "registries": {
    "local": {
      "type": "local",
      "enabled": true,
      "path": "./plugins",
      "priority": 100,
      "description": "Local plugins directory"
    },
    "org": {
      "type": "git",
      "enabled": false,
      "url": "",
      "branch": "main",
      "path": "plugins/",
      "priority": 50,
      "auth": {
        "type": "token",
        "envVar": "ORG_REGISTRY_TOKEN"
      },
      "description": "Organization private plugin registry"
    },
    "public": {
      "type": "https",
      "enabled": false,
      "url": "https://marketplace.claude.dev/api/v1",
      "priority": 10,
      "description": "Public marketplace registry"
    }
  },
  "resolution": {
    "strategy": "priority",
    "allowDuplicates": false,
    "preferLocal": true
  }
}
```

### Interactive prompts:

1. **Ask which registries to enable:**
   ```
   +-------------------------------------------------------------------+
   | STEP 2: FEDERATION CONFIGURATION                                  |
   +-------------------------------------------------------------------+
   |                                                                    |
   |  Which registries would you like to enable?                       |
   |                                                                    |
   |  [1] Local only (plugins/ directory)                              |
   |  [2] Local + Organization (private Git registry)                  |
   |  [3] Local + Public marketplace                                   |
   |  [4] All three (Local + Org + Public)                             |
   |                                                                    |
   |  Selection: _                                                     |
   |                                                                    |
   +-------------------------------------------------------------------+
   ```

2. **If org registry selected, ask for details:**
   - Repository URL
   - Branch name (default: `main`)
   - Authentication method: token env var, SSH key, or none
   - Set `enabled: true`

3. **If public registry selected:**
   - Confirm the public endpoint URL
   - Set `enabled: true`

4. **Write `.claude/registries.json`** with the configured values.

5. **Display result:**
   ```
   Registry configuration written to .claude/registries.json

   Active Registries:
   +-- local   (priority: 100)  ./plugins
   +-- org     (priority: 50)   git@github.com:org/plugins.git
   +-- public  (priority: 10)   https://marketplace.claude.dev/api/v1

   Resolution strategy: priority (highest wins on conflict)
   ```

---

## Step 3: Configure Security

**Goal:** Create `.claude/policies/plugins.yaml` with security policies and trust thresholds.

### Default template for `.claude/policies/plugins.yaml`:
```yaml
# Marketplace Pro - Plugin Security Policy
# Generated by /mp:setup on <DATE>

version: "1.0"

# Trust score thresholds (0-100)
trust:
  minimum_score: 60
  grade_requirement: "C"  # Minimum letter grade: A, B, C, D, F
  block_unsigned: false
  require_verified_author: false

# Installation policy
install:
  mode: "moderate"  # permissive | moderate | strict
  # permissive: allow all plugins regardless of trust score
  # moderate:   require minimum trust score, warn on unsigned
  # strict:     allowlist only, require signatures, verified authors

  allowlist: []     # Only used in strict mode: ["plugin-a", "plugin-b"]
  blocklist: []     # Blocked in all modes

# Permission boundaries
permissions:
  max_filesystem_scopes: 10
  max_network_hosts: 5
  allow_exec: true
  allow_env_read: true
  require_permission_declaration: true

# Audit settings
audit:
  on_install: true
  on_update: true
  fail_on_critical: true
  fail_on_high: false
```

### Interactive prompts:

1. **Ask security level:**
   ```
   +-------------------------------------------------------------------+
   | STEP 3: SECURITY CONFIGURATION                                    |
   +-------------------------------------------------------------------+
   |                                                                    |
   |  Choose a security posture:                                       |
   |                                                                    |
   |  [1] Permissive                                                   |
   |      Allow all plugins. No trust score checks.                    |
   |      Best for: personal projects, experimentation                 |
   |                                                                    |
   |  [2] Moderate (recommended)                                       |
   |      Require minimum trust score (C grade / 60+).                 |
   |      Warn on unsigned plugins. Audit on install.                  |
   |      Best for: team projects, standard development                |
   |                                                                    |
   |  [3] Strict                                                       |
   |      Allowlist only. Require signatures and verified authors.     |
   |      Block on critical findings. Full audit on every change.      |
   |      Best for: enterprise, regulated environments                 |
   |                                                                    |
   |  Selection: _                                                     |
   |                                                                    |
   +-------------------------------------------------------------------+
   ```

2. **Apply configuration based on selection:**

   | Setting | Permissive | Moderate | Strict |
   |---------|-----------|----------|--------|
   | `trust.minimum_score` | 0 | 60 | 80 |
   | `trust.grade_requirement` | F | C | B |
   | `trust.block_unsigned` | false | false | true |
   | `trust.require_verified_author` | false | false | true |
   | `install.mode` | permissive | moderate | strict |
   | `audit.on_install` | false | true | true |
   | `audit.fail_on_critical` | false | true | true |
   | `audit.fail_on_high` | false | false | true |

3. **If strict mode, ask for initial allowlist:**
   - Scan installed plugins and offer to add them all
   - Allow manual additions

4. **Write `.claude/policies/plugins.yaml`.**

5. **Display result:**
   ```
   Security policy written to .claude/policies/plugins.yaml

   Security Posture: MODERATE
   +-- Minimum Trust Score: 60 (Grade C)
   +-- Unsigned Plugins:   Allowed (with warning)
   +-- Audit on Install:   Yes
   +-- Block on Critical:  Yes
   +-- Allowlist Mode:     Off
   ```

---

## Step 4: Initial Scan

**Goal:** Run the contextual intelligence engine against the current project to detect capabilities and suggest plugins.

### Actions to perform:

1. **Run project fingerprinting** by scanning the project root:
   - Detect frameworks, languages, infrastructure (reuse Step 1 data)
   - Identify architectural patterns
   - Detect existing tooling gaps via association rules

2. **Display detected capabilities:**
   ```
   =====================================================================
    STEP 4/5: PROJECT INTELLIGENCE SCAN
   =====================================================================

    Project Fingerprint:
    +-- Frameworks:      Next.js 14, FastAPI 0.104
    +-- Languages:       TypeScript (78%), Python (12%)
    +-- Infrastructure:  Docker, Kubernetes, Helm
    +-- Patterns:        Monorepo, API Gateway, Event-Driven
    +-- CI/CD:           GitHub Actions

    Detected Capability Gaps:
    +-- monitoring       (confidence: 0.87) -- projects with k8s + helm
    |                    typically have monitoring configured
    +-- secrets-mgmt     (confidence: 0.72) -- detected k8s but no
    |                    vault/external-secrets integration
    +-- api-docs         (confidence: 0.68) -- FastAPI detected but
    |                    no OpenAPI/Swagger plugin installed

   ```

3. **Suggest plugins based on intelligence engine:**
   ```
    Recommended Plugins:
    +-- observability-stack     relevance: 0.91   fills: monitoring
    +-- vault-integration      relevance: 0.78   fills: secrets-mgmt
    +-- api-docs-generator     relevance: 0.74   fills: api-docs

    Would you like to install any recommended plugins? (y/n/select): _
   ```

4. **If user selects plugins to install:**
   - Check trust scores against the policy from Step 3
   - Verify signatures if required
   - Run security audit if configured
   - Install or note for manual installation

5. **If no recommendations or user declines:**
   - Proceed to Step 5.

---

## Step 5: Generate Lockfile

**Goal:** Create `plugin-lock.json` that pins all installed plugin versions and their integrity checksums.

### Lockfile template (`plugin-lock.json`):
```json
{
  "$schema": "https://marketplace-pro.dev/schemas/plugin-lock.json",
  "version": "1.0.0",
  "generated": "<ISO-8601 timestamp>",
  "generatedBy": "mp:setup",
  "plugins": {
    "<plugin-name>": {
      "version": "<semver>",
      "registry": "local",
      "integrity": "sha512-<hash>",
      "capabilities": {
        "provides": ["..."],
        "requires": ["..."]
      },
      "trustScore": {
        "overall": 85,
        "grade": "B"
      },
      "installedAt": "<ISO-8601>"
    }
  },
  "dependencyGraph": {
    "nodes": ["..."],
    "edges": [
      { "from": "plugin-a", "to": "plugin-b", "capability": "..." }
    ]
  }
}
```

### Actions to perform:

1. **Scan all installed plugins** in `plugins/` directory:
   - Read each `plugin.json` manifest
   - Compute SHA-512 integrity hash of the plugin directory
   - Record version, capabilities, and registry source

2. **Build dependency graph** from capability declarations:
   - `provides` and `requires` fields create edges
   - Detect any cycles

3. **Write `plugin-lock.json`** to the project root.

4. **Ask about version control:**
   ```
   +-------------------------------------------------------------------+
   | STEP 5: LOCKFILE GENERATION                                       |
   +-------------------------------------------------------------------+
   |                                                                    |
   |  Generated plugin-lock.json with 4 plugins pinned.               |
   |                                                                    |
   |  How should the lockfile be handled in Git?                       |
   |                                                                    |
   |  [1] Commit it (reproducible installs, recommended for teams)     |
   |  [2] Add to .gitignore (regenerate on each machine)               |
   |  [3] Decide later                                                 |
   |                                                                    |
   |  Selection: _                                                     |
   |                                                                    |
   +-------------------------------------------------------------------+
   ```

5. **Display final summary:**
   ```
   Lockfile written to plugin-lock.json

   Pinned Plugins:
   +-- marketplace-pro          v1.0.0  sha512-a1b2...  Grade B
   +-- aws-eks-helm-keycloak    v1.2.0  sha512-c3d4...  Grade A
   +-- fastapi-backend          v0.8.0  sha512-e5f6...  Grade B
   +-- frontend-design-system   v1.1.0  sha512-g7h8...  Grade A

   Dependency Graph:
   marketplace-pro --> (requires: plugin-registry)
   aws-eks-helm-keycloak --> (standalone)
   fastapi-backend --> (standalone)
   frontend-design-system --> (standalone)
   ```

---

## Completion Summary

```
+============================================================================+
|                                                                            |
|  SETUP COMPLETE                                                            |
|                                                                            |
+============================================================================+

  Files Created:
  +-- .claude/registries.json        Federation configuration
  +-- .claude/policies/plugins.yaml  Security policies
  +-- plugin-lock.json               Plugin version lockfile

  Configuration:
  +-- Registries:     2 active (local, public)
  +-- Security:       Moderate (trust >= 60, audit on install)
  +-- Plugins Pinned: 4
  +-- Dep Graph:      No cycles detected

  +------------------------------------------------------------------------+
  | NEXT STEPS                                                              |
  +------------------------------------------------------------------------+
  |                                                                         |
  |  /mp:status             View your dashboard                            |
  |  /mp:quick scan         Scan for new plugin recommendations            |
  |  /mp:quick check        Run a health check                             |
  |  /mp:trust <plugin>     Check trust score for a plugin                 |
  |  /mp:compose <intent>   Compose plugins for a goal                     |
  |  /mp:help               See all available commands                     |
  |                                                                         |
  +------------------------------------------------------------------------+

```

---

## Quick Mode Behavior

When `--mode=quick` is specified:

1. **Step 1** runs fully (no prompts needed).
2. **Step 2** defaults to local-only registry, no prompts.
3. **Step 3** defaults to moderate security, no prompts.
4. **Step 4** runs scan but skips install prompts; just displays recommendations.
5. **Step 5** writes lockfile, defaults to "decide later" for git handling.

Total time: under 30 seconds.

## Security-Only Mode

When `--mode=security-only`:
- Skips Steps 1, 2, 4, 5.
- Runs only Step 3 (security configuration).
- If `.claude/policies/plugins.yaml` already exists, offers to reconfigure or keep.

## Federation-Only Mode

When `--mode=federation-only`:
- Skips Steps 1, 3, 4, 5.
- Runs only Step 2 (registry configuration).
- If `.claude/registries.json` already exists, offers to reconfigure or keep.

## Error Handling

- If any step fails, display the error clearly and offer:
  - Retry the step
  - Skip the step and continue
  - Abort setup entirely
- All written files use atomic write patterns (write to `.tmp`, then rename).
- If setup is aborted partway, previously written files are preserved (they are valid on their own).

## Re-running Setup

Running `/mp:setup` again when configuration already exists:
- Detects existing files in Step 1
- Offers to reconfigure or keep each existing config
- Lockfile is always regenerated to reflect current state
