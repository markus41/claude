---
name: mp:compose
description: Resolve an intent into an ordered plugin composition plan using greedy set cover and Kahn's topological sort
arguments:
  - name: intent
    description: "Intent description or path to composition.yaml"
    required: true
  - name: mode
    description: "Execution mode: plan, install, or dry-run (default: plan)"
    required: false
allowed-tools:
  - Bash
  - Read
  - Write
  - Glob
  - Grep
---

# Plugin Composition Engine

Resolve a high-level intent into an ordered plugin composition plan.

## Usage

```
/mp:compose <intent-or-path> [--mode=plan|install|dry-run]
```

## Arguments

| Argument | Description | Default |
|----------|-------------|---------|
| `intent` | Intent description string or path to a `composition.yaml` file | (required) |
| `--mode` | `plan` = show plan only, `install` = execute, `dry-run` = validate without output | `plan` |

## Examples

```bash
# Plan from a YAML file
/mp:compose ./composition.yaml

# Plan from inline intent
/mp:compose "I need plugin composition, supply chain security, and CI/CD"

# Install after planning
/mp:compose ./composition.yaml --mode=install

# Validate without installing
/mp:compose ./composition.yaml --mode=dry-run
```

## Workflow

When this command is invoked, follow these steps:

### Step 1: Parse the Intent

If the argument is a file path (ends in `.yaml` or `.yml`), read and parse it as an `IntentSpec`:

```yaml
# composition.yaml
intent: "Set up a secure plugin development environment"
requirements:
  - capability: plugin-composition
  - capability: supply-chain-security
  - capability: plugin-dev-tools
  - capability: policy-enforcement
    provider: marketplace-pro
constraints:
  env: development
  strictMode: "true"
```

If the argument is a plain string, convert it to an IntentSpec by:
1. Setting `intent` to the string
2. Scanning all plugin manifests in `plugins/*/. claude-plugin/plugin.json` for capabilities
3. Using fuzzy matching to map the intent description to capability names
4. Building the `requirements` array from matched capabilities

### Step 2: Load Plugin Manifests

Scan the plugins directory for all installed plugins:

```bash
# Find all plugin manifests
for dir in plugins/*/; do
  manifest="$dir.claude-plugin/plugin.json"
  if [ -f "$manifest" ]; then
    # Read and parse the manifest
    cat "$manifest"
  fi
done
```

Display a summary table of discovered plugins and their capabilities:

```
Discovered Plugins
------------------
Plugin                    Provides                          Requires
marketplace-pro           plugin-composition, ...           plugin-registry
deployment-pipeline       (none declared)                   (none declared)
fullstack-iac             (none declared)                   (none declared)
...
```

### Step 3: Run Capability Matching (Greedy Set Cover)

Execute the greedy set cover algorithm:

1. Start with the full set of required capabilities
2. Iteratively select the plugin covering the most uncovered capabilities
3. Break ties by: preferred provider > coverage count > alphabetical name
4. Continue until all capabilities are covered or no more candidates exist

Display the matching results:

```
Capability Matching
-------------------
Required: plugin-composition, supply-chain-security, plugin-dev-tools, policy-enforcement

Round 1: Selected "marketplace-pro" (covers 4/4 remaining)
  - plugin-composition
  - supply-chain-security
  - plugin-dev-tools
  - policy-enforcement

All capabilities covered in 1 round(s).
Selected plugins: marketplace-pro
```

If any capabilities cannot be satisfied:

```
WARNING: Unsatisfied capabilities:
  - some-missing-capability (no installed plugin provides this)

Consider installing additional plugins from the registry.
```

### Step 4: Resolve Dependencies (Kahn's Topological Sort)

Build a directed acyclic graph (DAG) of plugin dependencies:

1. For each selected plugin's `requires`, find which plugin `provides` it
2. Create edges: provider -> consumer
3. Run Kahn's algorithm (BFS topological sort) for install ordering
4. Detect and report any cycles

Display the dependency graph:

```
Dependency Graph
----------------
marketplace-pro
  requires: plugin-registry
    provided by: (external - not in selected set)

Install Order (topological):
  1. marketplace-pro

Dependency edges: (none among selected plugins)
```

If cycles are detected:

```
ERROR: Cyclic dependency detected!
  plugin-a -> plugin-b -> plugin-c -> plugin-a
  (via capabilities: auth -> user-management -> auth)

Cannot determine install order. Please resolve the cycle by:
  - Removing one of the conflicting plugins
  - Using constraints to prefer a specific provider
```

### Step 5: Infer Configuration

Scan the project root for technology fingerprinting:

```
Project Fingerprint
-------------------
Detected technologies: docker, github-actions, kubernetes, mcp, node, typescript
Detection sources:
  package.json         -> node, javascript
  tsconfig.json        -> typescript
  Dockerfile           -> docker, containers
  .github              -> github, github-actions
  .mcp.json            -> mcp, claude-code
```

Generate auto-configuration for each selected plugin:

```
Auto-Configuration
------------------
marketplace-pro:
  language: typescript
  strictMode: true
  containerRuntime: docker
  ciPlatform: github-actions
  mcpEnabled: true
  pluginVersion: 1.0.0
  env: development          (from constraints)
```

### Step 6: Present the Composition Plan

Display the final plan:

```
Composition Plan
================
Intent: "Set up a secure plugin development environment"

Plugins (install order):
  1. marketplace-pro v1.0.0
     Provides: plugin-composition, supply-chain-security, plugin-dev-tools, policy-enforcement
     Config: { language: "typescript", strictMode: true, ... }

Install commands:
  claude plugin install marketplace-pro

Warnings:
  - (none)

Total: 1 plugin(s), 4 capability(ies) satisfied
```

### Step 7: Execute (if mode=install)

If `--mode=install`:

1. Ask for confirmation: "Proceed with installation? [y/N]"
2. For each plugin in install order:
   a. Run the install command
   b. Apply the auto-generated configuration
   c. Verify the plugin is functional
3. Display final status

If `--mode=dry-run`:
- Show the plan but skip execution
- Validate that all plugins exist and manifests are readable

If `--mode=plan` (default):
- Show the plan and stop

## Error Handling

| Error | Resolution |
|-------|------------|
| No plugins found | Ensure plugins are installed in `plugins/` directory |
| Unsatisfiable capabilities | Install missing plugins or relax requirements |
| Cyclic dependencies | Remove conflicting plugins or add provider constraints |
| Manifest parse error | Fix the malformed `plugin.json` file |
| Conflict detected | Check `conflicts` arrays in plugin manifests |

## See Also

- **Composition Skill** (`/mp:compose` skill documentation) - In-depth explanation of algorithms
- **Plugin Manifests** - `plugins/*/.claude-plugin/plugin.json` format
- **Registry** - `.claude/registry/` for plugin metadata
