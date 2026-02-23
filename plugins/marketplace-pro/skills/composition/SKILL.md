---
name: Intent-Based Composition
description: Resolve high-level intents into ordered plugin composition plans using greedy set cover for capability matching and Kahn's topological sort for dependency ordering. Activates when working with "compose", "plugin composition", "capability matching", "dependency resolution", or "intent specification".
version: 1.0.0
---

# Intent-Based Composition Skill

## Overview

The Intent-Based Composition Engine transforms a high-level description of what you want to achieve into a concrete, ordered plan of which plugins to install and how to configure them. Instead of manually inspecting each plugin's capabilities and dependencies, you describe your intent and the engine figures out the rest.

The engine operates in three phases:

1. **Capability Matching** -- find which plugins satisfy your requirements
2. **Dependency Resolution** -- determine the correct install/execution order
3. **Configuration Inference** -- auto-generate sensible defaults from your project

## When to Use Intent-Based Composition

Use this skill when:

- You know *what* you want to accomplish but not *which* plugins provide it
- You need to install multiple plugins that must work together
- You want automatic dependency ordering so plugins install in the right sequence
- You want configuration that adapts to your existing project stack
- You are onboarding a new project and want a recommended plugin set

Do **not** use this skill when:

- You already know exactly which single plugin to install
- You need to manually control every configuration value
- You are debugging a specific plugin (use the plugin's own diagnostics instead)

## How Capability Matching Works

### The Problem: Set Cover

Given N plugins each providing a different subset of capabilities, find the smallest collection of plugins that covers all the capabilities you need. This is the classic **minimum set cover** problem.

### The Algorithm: Greedy Set Cover

Optimal set cover is NP-hard, but the greedy heuristic produces a solution within a factor of ln(n)+1 of optimal -- more than good enough for plugin selection.

```
Input:
  U = { cap-A, cap-B, cap-C, cap-D }    -- capabilities you need
  S = {
    plugin-1 provides { cap-A, cap-B },
    plugin-2 provides { cap-B, cap-C },
    plugin-3 provides { cap-C, cap-D },
    plugin-4 provides { cap-A, cap-B, cap-C },
  }

Round 1: plugin-4 covers 3 of 4 remaining (cap-A, cap-B, cap-C)
  U = { cap-D }

Round 2: plugin-3 covers 1 of 1 remaining (cap-D)
  U = {} -- done!

Result: [ plugin-4, plugin-3 ]   (2 plugins instead of 4)
```

### Tie-Breaking Rules

When two plugins cover the same number of uncovered capabilities, the engine breaks ties by:

1. **Preferred provider** -- if the user specified `provider: "my-plugin"` for a capability, that plugin wins
2. **Coverage count** -- more capabilities covered wins
3. **Alphabetical name** -- for deterministic, reproducible output

### Conflict Detection

After matching, the engine checks each selected plugin's `conflicts` array. If plugin A declares a conflict with capability X and plugin B provides capability X, the composition is rejected with a clear error message.

## How Dependency Resolution Works

### The Problem: Topological Ordering

Selected plugins may depend on each other: plugin A requires capability X, which plugin B provides. Plugin B must be installed before plugin A. With many plugins and cross-dependencies, finding a valid ordering requires a topological sort.

### The Algorithm: Kahn's Algorithm (BFS Topological Sort)

Kahn's algorithm is a breadth-first approach to topological sorting that also naturally detects cycles.

```
Input graph (edges mean "must come before"):
  plugin-B -> plugin-A    (B provides what A requires)
  plugin-C -> plugin-A    (C provides what A requires)
  plugin-D -> plugin-B    (D provides what B requires)

Step 1: Compute in-degrees
  plugin-D: 0  (no one must come before D)
  plugin-C: 0
  plugin-B: 1  (D must come before B)
  plugin-A: 2  (B and C must come before A)

Step 2: Start queue with in-degree 0 nodes
  queue = [plugin-C, plugin-D]   (alphabetical for determinism)

Step 3: Process queue
  Dequeue plugin-C -> output: [C]
    plugin-A in-degree: 2 -> 1
  Dequeue plugin-D -> output: [C, D]
    plugin-B in-degree: 1 -> 0 -> enqueue B
  Dequeue plugin-B -> output: [C, D, B]
    plugin-A in-degree: 1 -> 0 -> enqueue A
  Dequeue plugin-A -> output: [C, D, B, A]

Install order: plugin-C, plugin-D, plugin-B, plugin-A
```

### Cycle Detection

If the output list has fewer nodes than the graph, some nodes could never reach in-degree 0 -- they form a cycle. The engine reports the exact cycle path:

```
ERROR: Cycle detected!
  auth-plugin -> user-plugin -> auth-plugin (via capability "authentication")
```

## How Configuration Inference Works

The engine scans your project root for well-known files and directories to build a **technology fingerprint**:

| Detected File | Technologies Added |
|---|---|
| `package.json` | node, javascript |
| `tsconfig.json` | typescript |
| `Dockerfile` | docker, containers |
| `Chart.yaml` | helm, kubernetes |
| `.github/` | github, github-actions |
| `main.tf` | terraform, iac |
| `requirements.txt` | python |
| `go.mod` | go, golang |
| `vite.config.ts` | vite, frontend |
| `.mcp.json` | mcp, claude-code |

For Node.js projects, the engine also reads `package.json` dependencies to detect frameworks like React, Vue, Next.js, Express, and database ORMs.

Each detected technology maps to configuration fragments that are merged into plugin configs. For example, detecting TypeScript adds `{ language: "typescript", strictMode: true }` to each plugin's configuration.

## Composition YAML Format

Create a `composition.yaml` file to define your intent:

```yaml
# Basic composition
intent: "Set up a CI/CD pipeline with security scanning"
requirements:
  - capability: ci-cd
  - capability: supply-chain-security
  - capability: plugin-composition
```

```yaml
# With provider preferences and constraints
intent: "Deploy a full-stack application with monitoring"
requirements:
  - capability: kubernetes
    provider: fullstack-iac
  - capability: ci-cd
    provider: deployment-pipeline
  - capability: supply-chain-security
  - capability: contextual-recommendations
constraints:
  env: production
  region: us-east-1
  strictMode: "true"
```

```yaml
# Minimal - just capabilities
intent: "Plugin development toolkit"
requirements:
  - capability: plugin-dev-tools
  - capability: plugin-composition
  - capability: trust-scoring
```

### Field Reference

| Field | Type | Required | Description |
|---|---|---|---|
| `intent` | string | yes | Human-readable goal description |
| `requirements` | array | yes | List of capability requirements |
| `requirements[].capability` | string | yes | Capability identifier to satisfy |
| `requirements[].provider` | string | no | Preferred plugin to provide this capability |
| `constraints` | object | no | Key-value pairs merged into all plugin configs |

## Extending with Custom Capabilities

### Declaring Capabilities in Your Plugin

Add a `capabilities` block to your plugin's `.claude-plugin/plugin.json`:

```json
{
  "name": "my-custom-plugin",
  "version": "1.0.0",
  "description": "My plugin description",
  "capabilities": {
    "provides": [
      "my-custom-capability",
      "another-capability"
    ],
    "requires": [
      "plugin-registry"
    ],
    "conflicts": [
      "legacy-capability"
    ]
  }
}
```

### Capability Naming Conventions

- Use lowercase kebab-case: `supply-chain-security`, not `SupplyChainSecurity`
- Be specific: `kubernetes-helm-deploy` is better than `deploy`
- Use domain prefixes for plugin-specific capabilities: `mp-trust-scoring`
- Document what the capability means in your plugin's description

### Making Your Plugin Composable

For best results with the composition engine:

1. **Declare all provided capabilities** -- the engine can only match what it knows about
2. **Declare all required capabilities** -- this enables correct dependency ordering
3. **Declare conflicts** -- prevents incompatible plugins from being composed together
4. **Keep capabilities granular** -- `auth-jwt` and `auth-oauth` are better than just `auth`
5. **Avoid circular dependencies** -- if A requires B and B requires A, the engine cannot order them

## Architecture

```
IntentSpec (YAML/JSON)
    |
    v
CapabilityMatcher (greedy set cover)
    |   reads: plugins/*/.claude-plugin/plugin.json
    |   output: MatchResult { selected, uncovered, conflicts }
    v
DependencyResolver (Kahn's toposort)
    |   input: selected plugins + all manifests
    |   output: DependencyGraph { nodes, edges, hasCycles }
    v
ConfigurationInferrer (project fingerprinting)
    |   scans: project root files
    |   output: InferredConfig[] per plugin
    v
CompositionPlan
    { intent, plugins[], installOrder[], warnings[] }
```

### Source Files

- **Types**: `src/composition/types.ts` -- all interfaces, error classes, enums
- **Engine**: `src/composition/engine.ts` -- CapabilityMatcher, DependencyResolver, ConfigurationInferrer, CompositionEngine
- **Command**: `commands/compose.md` -- the `/mp:compose` slash command

## Related Skills and Commands

- `/mp:compose` -- the slash command that invokes this engine
- **Supply Chain Security** module -- `src/security/trust-engine.ts`
- **Contextual Intelligence** module -- `src/intelligence/fingerprint.ts`
- **Dev Studio** module -- `src/devstudio/server.ts`
- **Federation** module -- `src/federation/registry.ts`
