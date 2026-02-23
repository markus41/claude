# Marketplace Pro

Advanced plugin marketplace platform that transforms plugin management from a simple package manager into an enterprise orchestration platform. Features intent-based composition, supply chain security, contextual intelligence, hot-reload development, and federated registry support.

## Feature Overview

Marketplace Pro is built around five specialized modules:

| Module | Purpose | Key Algorithms |
|--------|---------|---------------|
| **Composition Engine** | Resolve natural-language intents into plugin plans | Greedy set cover, Kahn's topological sort |
| **Supply Chain Security** | Trust scoring, signature verification, sandboxing | Sigstore signing, composite weighted scoring |
| **Contextual Intelligence** | Project-aware plugin recommendations | Apriori mining, cosine similarity matching |
| **Dev Studio** | Hot-reload development server and build tools | File watching, live validation |
| **Federation** | Multi-registry protocol with policy enforcement | Priority resolution, GitOps lockfile |

## Quick Start

Get up and running in three steps:

```
# Step 1: Run the interactive setup wizard
/mp:setup

# Step 2: Check your dashboard
/mp:status

# Step 3: Discover plugins for your project
/mp:quick scan
```

The setup wizard walks you through federation configuration, security policies, project scanning, and lockfile generation. For the fastest path, use quick mode:

```
/mp:setup --mode=quick
```

## Command Reference

### Setup and Quickstart

| Command | Description |
|---------|-------------|
| `/mp:setup` | Interactive setup wizard (federation, security, intelligence, lockfile) |
| `/mp:setup --mode=quick` | Setup with smart defaults, minimal prompts |
| `/mp:setup --mode=security-only` | Configure only security policies |
| `/mp:setup --mode=federation-only` | Configure only registry federation |
| `/mp:quick scan` | Quick project fingerprint + top 3 plugin recommendations |
| `/mp:quick trust <plugin>` | Quick trust score and grade for a plugin |
| `/mp:quick check` | Health check: lockfile drift, policy violations, staleness |
| `/mp:quick graph` | Dependency graph of installed plugins |
| `/mp:status` | Full dashboard overview of all subsystems |
| `/mp:help` | Show all available commands |

### Composition Engine

| Command | Description |
|---------|-------------|
| `/mp:compose <intent>` | Resolve a natural-language intent into a plugin composition plan |

Example:
```
/mp:compose "deploy a FastAPI app to EKS with auth and monitoring"
```

The engine matches your intent against installed plugin capabilities using greedy set cover, resolves dependencies with topological sort, and produces an ordered installation plan.

### Security and Trust

| Command | Description |
|---------|-------------|
| `/mp:trust <plugin>` | Full trust score audit with factor breakdown |
| `/mp:verify <plugin>` | Verify plugin signature and integrity |
| `/mp:verify <plugin> --sign` | Sign an unsigned plugin |

Trust scores are computed from five weighted factors:

```
Overall = 0.25 * Signed + 0.20 * Reputation + 0.25 * CodeAnalysis
        + 0.15 * Community + 0.15 * Freshness

Grade:  A (90-100)  B (80-89)  C (60-79)  D (40-59)  F (0-39)
```

### Intelligence

| Command | Description |
|---------|-------------|
| `/mp:recommend` | Full project-aware plugin recommendations |

Scans your project to detect frameworks, languages, infrastructure, and architectural patterns. Uses Apriori association rule mining to identify capability gaps and cosine similarity to rank plugin relevance.

### Dev Studio

| Command | Description |
|---------|-------------|
| `/mp:dev start` | Start hot-reload development server |
| `/mp:dev stop` | Stop development server |
| `/mp:dev test` | Run plugin test suite |
| `/mp:dev lint` | Lint plugin manifest and source |
| `/mp:dev build` | Build plugin bundle (.cpkg) |
| `/mp:dev watch` | Watch mode with live validation |

### Federation

| Command | Description |
|---------|-------------|
| `/mp:registry list` | List configured registries |
| `/mp:registry add` | Add a new registry |
| `/mp:registry remove` | Remove a registry |
| `/mp:registry sync` | Sync plugin index from registries |
| `/mp:registry test` | Test registry connectivity |
| `/mp:policy show` | Display current security policy |
| `/mp:policy edit` | Modify policy settings |
| `/mp:policy init` | Create default policy file |
| `/mp:policy audit` | Run policy audit on all installed plugins |
| `/mp:lock show` | Display lockfile contents |
| `/mp:lock sync` | Update lockfile to match installed plugins |
| `/mp:lock diff` | Show drift between lockfile and actual state |
| `/mp:lock init` | Generate initial lockfile |
| `/mp:lock verify` | Verify integrity checksums |

## Architecture

```
+====================================================================+
|                        marketplace-pro                              |
+====================================================================+
|                                                                     |
|  Commands (/mp:*)          Agents                                   |
|  +---------------------+  +------------------------------------+   |
|  | setup, quick,       |  | marketplace-advisor                |   |
|  | status, help,       |  | (plugin selection, troubleshooting,|   |
|  | compose, trust,     |  |  algorithm explanations)           |   |
|  | verify, recommend,  |  +------------------------------------+   |
|  | dev, registry,      |                                           |
|  | policy, lock        |                                           |
|  +---------------------+                                           |
|          |                                                          |
|          v                                                          |
|  +-------------------+  +-------------------+  +-----------------+ |
|  | Composition       |  | Supply Chain      |  | Contextual      | |
|  | Engine            |  | Security          |  | Intelligence    | |
|  |                   |  |                   |  |                 | |
|  | Intent parsing    |  | Sigstore verify   |  | Fingerprinting  | |
|  | Capability match  |  | Trust scoring     |  | Apriori mining  | |
|  | Greedy set cover  |  | Permission sandbox|  | Cosine matching | |
|  | Kahn toposort     |  | Security audit    |  | Gap detection   | |
|  | Config inference   |  | Dangerous pattern |  | Recommendation  | |
|  |                   |  |   scanning        |  |   ranking       | |
|  +-------------------+  +-------------------+  +-----------------+ |
|                                                                     |
|  +-------------------+  +---------------------------------------+  |
|  | Dev Studio        |  | Federation Protocol                   |  |
|  |                   |  |                                       |  |
|  | Hot-reload server |  | Multi-registry resolution (priority)  |  |
|  | Visual dep graph  |  | GitOps lockfile (plugin-lock.json)    |  |
|  | Test harness      |  | Policy engine (plugins.yaml)          |  |
|  | Bundle builder    |  | Registry auth (token, SSH, none)      |  |
|  +-------------------+  +---------------------------------------+  |
|                                                                     |
+====================================================================+
```

### Module Entry Points

| Module | Entry | Types |
|--------|-------|-------|
| Composition Engine | `src/composition/engine.ts` | `src/composition/types.ts` |
| Supply Chain Security | `src/security/trust-engine.ts` | `src/security/types.ts` |
| Contextual Intelligence | `src/intelligence/fingerprint.ts` | `src/intelligence/types.ts` |
| Dev Studio | `src/devstudio/server.ts` | -- |
| Federation | `src/federation/registry.ts` | -- |

### Type System Highlights

**Composition types** (`src/composition/types.ts`):
- `IntentSpec` -- User-facing input describing desired capabilities
- `CompositionPlan` -- Ordered list of plugins with auto-inferred configuration
- `DependencyGraph` -- DAG with cycle detection
- `MatchResult` -- Capability matching output with conflict detection

**Security types** (`src/security/types.ts`):
- `TrustScore` -- Composite score with five weighted factors and letter grade
- `SecurityAudit` -- Findings, permission gap analysis, pass/fail
- `PluginPermissions` -- Filesystem, network, exec, env scope declarations
- `SandboxWrapper` -- Generated shell wrapper enforcing permission boundaries

**Intelligence types** (`src/intelligence/types.ts`):
- `ProjectFingerprint` -- Frameworks, languages, infrastructure, patterns, gaps
- `AssociationRule` -- Apriori rules with support, confidence, lift
- `PluginRecommendation` -- Ranked recommendations with relevance and gap analysis

## Algorithm Reference

### Greedy Set Cover (Composition)

Selects the minimum set of plugins to cover all required capabilities. At each step, the plugin covering the most uncovered capabilities is chosen. Provider preferences from the user override the greedy choice. Approximation ratio: O(ln n).

### Kahn's Topological Sort (Dependencies)

Determines execution order by processing the dependency DAG layer by layer. Plugins with zero unresolved dependencies are processed first. Detects cycles that would prevent valid ordering.

### Apriori Mining (Intelligence)

Discovers association rules from a training dataset of project profiles. Rules take the form "projects with {typescript, react} tend to also have {testing}" with measured support, confidence, and lift. Applied to the user's project to identify expected but missing capabilities.

### Cosine Similarity (Recommendations)

Converts project fingerprints and plugin capability descriptors into feature vectors. Cosine similarity measures the angle between vectors -- plugins whose capability vectors point in the same direction as the project fingerprint score highest.

### Composite Trust Scoring (Security)

Weighted average of five independent factors (signature verification, author reputation, code analysis, community signals, freshness). Each factor scores 0-100 and has a fixed weight summing to 1.0. The composite score maps to a letter grade (A through F).

## Configuration Reference

### `.claude/registries.json`

Federation configuration. Defines where plugins are discovered and installed from.

```json
{
  "version": "1.0.0",
  "registries": {
    "local": {
      "type": "local",
      "enabled": true,
      "path": "./plugins",
      "priority": 100
    },
    "org": {
      "type": "git",
      "enabled": false,
      "url": "git@github.com:org/plugins.git",
      "branch": "main",
      "auth": { "type": "token", "envVar": "ORG_REGISTRY_TOKEN" }
    },
    "public": {
      "type": "https",
      "enabled": false,
      "url": "https://marketplace.claude.dev/api/v1"
    }
  },
  "resolution": {
    "strategy": "priority",
    "preferLocal": true
  }
}
```

### `.claude/policies/plugins.yaml`

Security and trust policies.

```yaml
version: "1.0"

trust:
  minimum_score: 60
  grade_requirement: "C"
  block_unsigned: false

install:
  mode: "moderate"   # permissive | moderate | strict
  allowlist: []
  blocklist: []

permissions:
  require_permission_declaration: true

audit:
  on_install: true
  fail_on_critical: true
```

### `plugin-lock.json`

Pinned plugin versions with integrity checksums.

```json
{
  "version": "1.0.0",
  "generated": "2026-02-23T00:00:00Z",
  "plugins": {
    "marketplace-pro": {
      "version": "1.0.0",
      "registry": "local",
      "integrity": "sha512-...",
      "trustScore": { "overall": 82, "grade": "B" }
    }
  },
  "dependencyGraph": {
    "nodes": ["marketplace-pro"],
    "edges": []
  }
}
```

### `.claude-plugin/plugin.json`

Plugin manifest (one per plugin). See `plugins/marketplace-pro/.claude-plugin/plugin.json` for a complete example.

Required fields: `name`, `version`, `description`.
Optional fields: `author`, `keywords`, `license`, `repository`, `capabilities`, `modules`.

## Contributing

### Plugin Development

1. Create a directory under `plugins/` with your plugin name.
2. Add `.claude-plugin/plugin.json` with at minimum `name`, `version`, and `description`.
3. Declare capabilities in `capabilities.provides` and `capabilities.requires`.
4. Add commands in `commands/` using YAML frontmatter format.
5. Add agents in `agents/` with YAML frontmatter.
6. Use `/mp:dev start` for hot-reload development.
7. Use `/mp:dev lint` to validate your manifest.
8. Use `/mp:dev build` to create a distributable `.cpkg` bundle.

### Adding Commands

Commands are Markdown files with YAML frontmatter in the `commands/` directory:

```yaml
---
name: mp:mycommand
description: What this command does
arguments:
  - name: target
    description: "The target to operate on"
    required: true
allowed-tools:
  - Bash
  - Read
---

# Command Title

Instructions for Claude to follow when this command is invoked.
```

### Adding Agents

Agents are Markdown files with YAML frontmatter in the `agents/` directory:

```yaml
---
name: my-agent
description: What this agent specializes in
model: haiku
tools:
  - Read
  - Glob
---

# Agent Name

System prompt and behavioral instructions.
```

## License

MIT
