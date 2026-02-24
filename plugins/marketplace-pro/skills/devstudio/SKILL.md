---
name: devstudio
description: Plugin Dev Studio workflow for hot-reload development, interactive testing, dependency visualization, and validation of Claude Code plugins. Covers the full plugin development lifecycle from scaffold to publish.
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Glob
  - Grep
related-skills:
  - debugging
  - testing
---

# Plugin Dev Studio Workflow

Comprehensive development environment for building, testing, and validating Claude Code plugins with hot-reload support.

## When to Use This Skill

Activate this skill when:
- Developing a new plugin and need rapid iteration with live validation
- Debugging plugin manifest or resource file issues
- Visualizing plugin dependency graphs for architecture review
- Building regression test suites for plugin commands
- Preparing a plugin for publication to a registry

## Architecture Overview

The Dev Studio consists of four core subsystems:

```
+------------------+     +---------------+     +-------------------+
|   FileWatcher    | --> |  HotReloader  | --> | Resource Registry |
| (FNV-1a hashing) |     | (Validation)  |     | (Live state)      |
+------------------+     +---------------+     +-------------------+
                                |
                                v
                     +--------------------+
                     | Console Reporter   |
                     | (file:line errors) |
                     +--------------------+

+-------------------+     +---------------------------+
| PluginPlayground  |     | DependencyGraphRenderer   |
| (Record/Replay)   |     | (ASCII + Mermaid output)  |
+-------------------+     +---------------------------+
```

### FileWatcher

Monitors a plugin directory for file changes using filesystem watchers with content-hash-based change detection.

**Key design decisions:**
- Uses FNV-1a (32-bit) hashing for speed — non-cryptographic, but extremely fast for small files
- Only triggers reload when file content actually changed (ignores timestamp-only updates)
- Debounces rapid changes with a 100ms window to batch editor save operations
- Classifies files by resource type (command, skill, agent, config, source)

### HotReloader

Processes file changes and maintains a live resource registry.

**On each change:**
1. If manifest changed: re-read, re-validate JSON structure and required fields
2. If markdown resource changed: re-lint frontmatter (YAML validity, required fields)
3. Update resource registry: add new resources, update modified ones, remove deleted ones
4. Report validation results with `file:line` references for inline error display

### PluginPlayground

Isolated execution context for testing plugin commands.

**Record-replay workflow:**
1. Register mock capabilities for external dependencies
2. Execute commands and record full input/output pairs as fixtures
3. Save fixtures to `tests/fixtures/` as JSON
4. Replay fixtures in CI to detect regressions

### DependencyGraphRenderer

Builds and renders plugin dependency graphs.

**Two output formats:**
- **ASCII tree**: Uses Unicode box-drawing characters for terminal display
- **Mermaid diagram**: Pasteable into GitHub markdown, Notion, or Mermaid Live Editor

## Development Workflow

### Phase 1: Scaffold and Configure

```bash
# Create plugin structure
mkdir -p my-plugin/{commands,skills,agents,config,src,tests/fixtures}
mkdir -p my-plugin/.claude-plugin

# Create minimal manifest
cat > my-plugin/.claude-plugin/plugin.json << 'EOF'
{
  "name": "my-plugin",
  "version": "0.1.0",
  "description": "My new plugin",
  "contextEntry": "CONTEXT.md",
  "capabilities": {
    "provides": ["my-capability"],
    "requires": []
  }
}
EOF
```

```bash

# Create operator context entrypoint (keep concise)
cat > my-plugin/CONTEXT.md << 'EOF'
# my-plugin Context

## Purpose
One-paragraph operator summary.

## Key Commands
- /my:command

## Agent Inventory
- my-agent

## Load Deeper Docs When
- You need implementation details or architecture rationale.
EOF
```

### Phase 2: Develop with Hot-Reload

```bash
# Start the dev server with file watching
/mp:dev serve ./my-plugin --watch
```

The dev server will:
- Validate the manifest on startup
- Discover and register all commands, skills, and agents
- Watch for file changes and re-validate on save
- Show inline errors with file:line references

### Phase 3: Test in Playground

```bash
# Launch interactive playground
/mp:dev playground ./my-plugin

# In the playground:
# > run /my:command "test input"
# > save my-test-case
# > log
```

### Phase 4: Visualize Dependencies

```bash
# Show dependency graph
/mp:dev graph ./my-plugin
```

Review the ASCII tree to verify:
- All capability declarations are correct
- Inter-resource dependencies are properly linked
- No circular dependencies exist

### Phase 5: Validate Before Publish

```bash
# Full validation suite
/mp:dev validate ./my-plugin
```

Fix all errors before publishing. Warnings are advisory but should be addressed.

### Phase 6: Regression Testing

```bash
# List saved fixtures
/mp:dev fixture list

# Replay a specific fixture
/mp:dev fixture replay my-test-case
```

## Validation Rules

### Manifest Validation (plugin.json)

| Rule | Severity | Description |
|------|----------|-------------|
| Valid JSON | error | File must be parseable JSON |
| `name` field | error | Must be a non-empty string |
| `version` field | error | Must be a non-empty string |
| `description` field | error | Must be a non-empty string |
| `contextEntry` field | error | Must reference `CONTEXT.md` or `PLUGIN_CONTEXT.md` |
| `capabilities` present | warning | Plugin should declare capabilities |
| `capabilities.provides` is array | error | Must be an array of strings |
| `capabilities.requires` is array | error | Must be an array of strings |

### Command/Skill Validation (.md files)

| Rule | Severity | Description |
|------|----------|-------------|
| Has frontmatter | error | Must start with `---` |
| Frontmatter closed | error | Must have closing `---` |
| `name` in frontmatter | error | Commands and skills must have a name |
| `description` in frontmatter | warning | Should have a description |
| Top-level heading | info | Should have `# Title` after frontmatter |

## File Structure

```
plugin-root/
  .claude-plugin/
    plugin.json          # Plugin manifest (validated by HotReloader)
  CONTEXT.md             # Minimal operator context entrypoint
  commands/
    *.md                 # Slash commands (validated for frontmatter)
  skills/
    */SKILL.md           # Skills (validated for frontmatter)
  agents/
    *.md                 # Agents (validated for frontmatter)
  config/
    *.json               # Configuration files
  src/
    devstudio/
      types.ts           # Type definitions
      server.ts          # FileWatcher, HotReloader, Playground, GraphRenderer
  tests/
    fixtures/
      *.json             # Recorded test fixtures (from playground)
```

## Troubleshooting

### Common Issues

**"Plugin manifest not found"**
- Ensure `.claude-plugin/plugin.json` exists in the plugin root
- Check that the path passed to `/mp:dev` is correct

**"Missing YAML frontmatter"**
- Markdown resource files must start with `---` on the first line
- Frontmatter must be closed with a second `---` line

**"Content hash unchanged but file was modified"**
- The FileWatcher uses content hashing, not timestamps
- If only whitespace changed, verify the hash actually differs
- The FNV-1a hash has a very low (but non-zero) collision rate for small changes

**"Fixture replay fails with empty output"**
- Playground execution is a simulation; real command execution requires the Claude runtime
- Record the actual output using `recordOutput()` after command execution

## Source Files

- Types: `src/devstudio/types.ts`
- Implementation: `src/devstudio/server.ts`
- Command: `commands/dev.md`
- This skill: `skills/devstudio/SKILL.md`

---

**Skill version**: 1.0
**Module**: dev-studio (marketplace-pro plugin)
