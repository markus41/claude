# CLI Command Archetype

Create Claude Code slash commands with argument parsing, documentation, and execution logic.

## Overview

This archetype generates complete command definitions including:
- Command markdown file with frontmatter
- Argument parsing documentation
- Usage examples and output formatting
- Error handling patterns

## When to Use

- Creating new slash commands for Claude Code
- Building automation shortcuts
- Defining workflow commands
- Creating utility commands

## Variables

| Variable | Type | Required | Description |
|----------|------|----------|-------------|
| `commandName` | string | Yes | Command name (kebab-case) |
| `description` | string | Yes | What the command does |
| `category` | choice | Yes | Organization category |
| `arguments` | multi | Yes | Argument types accepted |
| `tools` | multi | Yes | Required tools |
| `outputFormat` | choice | Yes | Result display format |
| `dangerous` | boolean | No | Requires confirmation |

## Example Usage

```bash
# Interactive mode
/archetype create cli-command

# Non-interactive
/archetype create cli-command \
  --variable commandName=db:backup \
  --variable description="Create database backup with optional compression" \
  --variable category=database \
  --variable arguments=positional,flags \
  --variable tools=Bash,Read,Write \
  --variable outputFormat=table \
  --variable dangerous=true \
  --non-interactive
```

## Generated Structure

```
commands/
└── {commandName}.md    # Command definition with docs
```

## Argument Types

| Type | Example | Usage |
|------|---------|-------|
| `positional` | `/cmd file.txt` | Required values |
| `flags` | `/cmd --verbose` | Boolean switches |
| `options` | `/cmd --env=prod` | Key-value pairs |
| `subcommands` | `/cmd list\|add\|remove` | Action variants |

## Output Formats

| Format | Best For |
|--------|----------|
| `table` | Structured data, lists |
| `json` | Machine-readable output |
| `markdown` | Documentation, reports |
| `plain` | Simple text output |
| `interactive` | User prompts, wizards |

## Command Categories

| Category | Examples |
|----------|----------|
| devops | deploy, build, release |
| database | migrate, backup, seed |
| testing | test, coverage, lint |
| documentation | docs, readme, changelog |
| workflow | start, status, complete |
| utility | clean, validate, convert |
| analysis | audit, scan, report |

## Best Practices

1. **Clear naming**: Use descriptive kebab-case names
2. **Document thoroughly**: Include all argument options
3. **Show examples**: Provide multiple usage patterns
4. **Handle errors**: Define error states and recovery
5. **Confirm dangerous**: Always confirm destructive actions
