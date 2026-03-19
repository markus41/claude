---
name: setup
intent: Bootstrap or refresh Claude Code workspace files inside an installed project, including nested repositories discovered beneath the root .claude tree
tags:
  - setup
  - update
  - claude
  - documentation
  - lsp
inputs: []
risk: medium
cost: low
description: Bootstrap or refresh Claude Code workspace files inside an installed project, including nested repositories discovered beneath the root .claude tree
model: claude-sonnet-4-5
---

# Claude Workspace Setup Command

Create or refresh a fingerprinted Claude Code workspace for an installed project.

## Overview

The `/setup` command creates the managed Claude Code structure expected by this plugin:

- Root `CLAUDE.md` with read-when triggers and reference document mapping.
- Root `.claude/` tree with rules, skills, templates, agents, hooks, and a fingerprint manifest.
- `docs/context/` with nested, durable markdown files such as `project.md`, `architecture.md`, `testing-strategy.md`, and ADRs.
- Automatic discovery of repository-like folders beneath the root `.claude/` tree so they also receive local `.claude/` guidance.
- Best-effort LSP installation for supported stacks.
- Safe handling for existing top-level `README.md` and `CLAUDE.md`; those files are preserved by default unless you opt in with `--force`.

Use `/update` to run the same synchronization flow later after the plugin changes.

---

## Basic Syntax

```bash
/setup [--project-root <path>] [--force | --no-force] [--no-install-lsps] [--no-include-nested-repositories]
/update [--project-root <path>] [--force | --no-force] [--no-install-lsps] [--no-include-nested-repositories]
```

---

## Options

```
--project-root <path>               Root of the installed project to manage (default: current directory)
--force / --no-force                Overwrite protected top-level managed files such as README.md and CLAUDE.md
--install-lsps / --no-install-lsps  Enable or disable automatic LSP package installation
--include-nested-repositories / --no-include-nested-repositories
                                   Enable or disable scanning inside the root .claude tree for repositories
```

---

## Generated Structure

```text
project/
├── CLAUDE.md
├── README.md
├── .claude/
│   ├── fingerprint.json
│   ├── rules/
│   ├── skills/
│   ├── templates/
│   ├── agents/
│   ├── hooks/
│   └── lessons-learned.md
└── docs/context/
    ├── project.md
    ├── project-overview.md
    ├── architecture.md
    ├── data-model.md
    ├── api-contracts.md
    ├── testing-strategy.md
    ├── plan.md
    └── decisions/
```

---

## Behavior Notes

### Setup and update parity
- `/setup` and `/update` use the same managed-file generator.
- `/update` is the command you should rerun after plugin upgrades or template revisions.
- The fingerprint file records generated metadata so the workspace remains traceable.

### Protected top-level files
- Root `README.md` and `CLAUDE.md` are treated as host-project-owned files.
- If either file already exists, setup/update leaves it in place by default and emits a warning in the command result.
- Pass `--force` to intentionally replace those protected files with the plugin-managed versions.
- Plugin-owned files under `.claude/` and `docs/context/` continue to regenerate automatically.

### Nested repository handling
- The root `.claude/` folder is scanned recursively.
- Directories that look like repositories, or directories named with `repo` / `repository`, receive their own `.claude/README.md` and `.claude/CLAUDE.md`.

### LSP installation
- Node-based projects receive a best-effort install of common LSP packages, including:
  - `typescript`
  - `typescript-language-server`
  - `vscode-langservers-extracted`
  - `yaml-language-server`
- Installation warnings are surfaced in the command result instead of failing the whole setup run.

---

## Examples

### Bootstrap the current project
```bash
/setup --project-root .
```

### Refresh after updating the plugin and replace protected top-level docs intentionally
```bash
/update --project-root . --force
```

### Refresh docs only without touching LSP dependencies
```bash
/update --project-root . --no-install-lsps
```
