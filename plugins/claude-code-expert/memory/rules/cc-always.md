# CC Always Rules

> Hard rules that every Claude Code session using this plugin should follow. Copied into each consumer repo as `.claude/rules/cc-always.md` by `/cc-setup`.
>
> User-curated only. Consolidator never writes here.

## Memory discipline (three-tier)

- **Engram is tier 1**: save decisions, bugs, discoveries, and conventions via `mem_save` proactively — don't wait to be asked.
- **Obsidian vault is tier 2**: write durable findings to `C:/Users/MarkusAhling/obsidian/Repositories/{org}/{repo}.md`. ADRs go in `Decisions/NNNN-title.md`.
- **Baseline rules are tier 3**: these come from the plugin and describe non-negotiables.

## Evidence before implementation

- For any non-trivial change, build an evidence table (files read, invariants noted, constraints) before writing code.
- Prefer repo-specific facts over generic best practices. Validate against official docs when a framework or library is involved (use Context7 MCP if available).

## Hooks and autonomy

- The plugin ships security-hardened hook packs. If a consumer repo enables them, hooks produce deterministic JSON — do not fight them.
- Autonomy profile choice lives in `.claude/rules/cc-autonomy.md` if configured. Respect the permission block.

## Git safety

- Never force-push to `main` / `master`.
- Never bypass hooks (`--no-verify`) without explicit user approval.
- Never amend a published commit without explicit user approval.

## Context discipline

- Keep CLAUDE.md under 150 lines — route to references, don't inline them.
- Use `/compact` every 20–30 exchanges on long sessions.
- Delegate heavy research to subagents (fresh context windows).

## Obsidian pointers

When working on a repo, check the vault first:

- `Repositories/{org}/{repo}.md` — does this repo have docs? If yes, read before starting.
- `Research/Claude-Code/Patterns/*.md` — is there a relevant pattern already promoted?
- `Projects/{project}/*.md` — is there an active project plan?

When finishing substantive work, update the relevant vault note. Do not let durable knowledge rot in engram.
