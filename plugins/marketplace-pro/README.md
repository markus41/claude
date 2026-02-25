# marketplace-pro

**Version:** 1.0.0 | **License:** MIT
**Author:** Markus Ahling (markus@lobbi.io)

## Purpose

Marketplace Pro transforms plugin management from a simple package manager into an
enterprise orchestration platform. It exists because as the plugin ecosystem grows,
teams need more than install/uninstall -- they need intent-based composition ("deploy
a FastAPI app to EKS with auth"), supply chain security with trust scoring, contextual
recommendations based on project analysis, and federated registries with policy enforcement.

The plugin is built around five specialized modules: a Composition Engine (greedy set
cover + Kahn's topological sort), Supply Chain Security (Sigstore signing, composite
trust scoring), Contextual Intelligence (Apriori mining, cosine similarity), Dev Studio
(hot-reload server), and Federation Protocol (multi-registry with GitOps lockfile).

## Directory Structure

```
marketplace-pro/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 1 agent
  commands/                      # 12 commands
  skills/                        # 5 skills (subdirectories with SKILL.md)
  src/                           # TypeScript modules (composition, security, etc.)
```

## Modules

| Module | Entry Point | Key Algorithms |
|--------|-------------|---------------|
| Composition Engine | `src/composition/engine.ts` | Greedy set cover, Kahn's toposort |
| Supply Chain Security | `src/security/trust-engine.ts` | Sigstore, composite trust scoring |
| Contextual Intelligence | `src/intelligence/fingerprint.ts` | Apriori mining, cosine similarity |
| Dev Studio | `src/devstudio/server.ts` | File watching, live validation |
| Federation | `src/federation/registry.ts` | Priority resolution, GitOps lockfile |

## Agent

| Agent | Description |
|-------|-------------|
| marketplace-advisor | Plugin selection guidance, troubleshooting, algorithm explanations |

## Commands

| Command | Description |
|---------|-------------|
| `/mp:setup` | Interactive setup wizard (federation, security, intelligence) |
| `/mp:quick scan` | Quick project fingerprint + top 3 recommendations |
| `/mp:quick trust <plugin>` | Quick trust score and grade |
| `/mp:quick check` | Health check: lockfile drift, policy violations |
| `/mp:status` | Full dashboard overview of all subsystems |
| `/mp:help` | Show all available commands |
| `/mp:compose <intent>` | Resolve natural-language intent into plugin plan |
| `/mp:trust <plugin>` | Full trust score audit with factor breakdown |
| `/mp:verify <plugin>` | Verify plugin signature and integrity |
| `/mp:recommend` | Full project-aware plugin recommendations |
| `/mp:dev start` | Start hot-reload development server |
| `/mp:registry list` | List configured registries |

**Additional subcommands:** `/mp:dev stop|test|lint|build|watch`,
`/mp:registry add|remove|sync|test`, `/mp:policy show|edit|init|audit`,
`/mp:lock show|sync|diff|init|verify`

## Trust Scoring

```
Overall = 0.25 * Signed + 0.20 * Reputation + 0.25 * CodeAnalysis
        + 0.15 * Community + 0.15 * Freshness

Grade:  A (90-100)  B (80-89)  C (60-79)  D (40-59)  F (0-39)
```

## Skills

- **composition** -- Intent-based plugin DAG resolution
- **security** -- Trust scoring, signature verification, sandboxing
- **intelligence** -- Project fingerprinting and gap detection
- **devstudio** -- Hot-reload development and build tools
- **federation** -- Multi-registry protocol and policy enforcement

## Configuration Files

| File | Purpose |
|------|---------|
| `.claude/registries.json` | Federation: registry URLs, auth, priority |
| `.claude/policies/plugins.yaml` | Security: trust thresholds, allowlist/blocklist |
| `plugin-lock.json` | Pinned versions with integrity checksums |

## Prerequisites

No external dependencies required. The plugin operates on the existing plugin
registry at `.claude/registry/plugins.index.json`.

## Quick Start

```
/mp:setup                                # Interactive setup wizard
/mp:status                               # Check dashboard
/mp:quick scan                           # Discover plugins for your project
/mp:compose "deploy FastAPI to EKS with auth and monitoring"
/mp:trust jira-orchestrator              # Check trust score
/mp:dev start                            # Start plugin development server
```
