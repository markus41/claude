# Claude Code Expert Context Summary

High-intelligence Claude Code expert plugin for deep code reasoning, orchestrated execution, guided diagnostics, and queryable internal documentation.

## What this plugin is best at
- Turning vague engineering requests into evidence-backed plans.
- Building repo fingerprints, invariant maps, and failure-mode analyses before code changes.
- Delegating broad work to teams while preserving a principal-engineer level synthesis pass.
- Diagnosing Claude Code, plugin, MCP, hook, and workflow problems systematically.

## Core assets
- `commands/cc-intel.md`: deep-analysis command for repo intelligence, hypothesis trees, and execution strategy.
- `agents/principal-engineer-strategist.md`: senior reviewer for architecture, tradeoffs, and hidden-risk detection.
- `skills/deep-code-intelligence/SKILL.md`: reusable reasoning workflow for hard coding tasks.
- `mcp-server/src/index.js`: searchable docs index over commands, agents, and skills with task resolution.

## When to open deeper docs
| Signal | Open docs | Why |
|---|---|---|
| User asks for the “best” approach or a major refactor | `commands/cc-intel.md` | Provides the evidence-driven analysis loop and output contract. |
| Need architectural judgement or root-cause isolation | `agents/principal-engineer-strategist.md` | Encodes principal-level decomposition, invariants, and tradeoff review. |
| Need a reusable deep-thinking workflow | `skills/deep-code-intelligence/SKILL.md` | Defines hypotheses, constraints, validation ladders, and stop conditions. |
| Need task routing across plugin docs | `CLAUDE.md` and `mcp-server/src/index.js` | Explains the fast path and queryable retrieval model. |
| Need broader orchestration, research, or review | `commands/cc-orchestrate.md`, `commands/cc-council.md`, `skills/research-routing/SKILL.md` | Adds parallelism, source validation, and structured review depth. |
