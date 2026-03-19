# Claude Code Expert Context Summary

High-intelligence Claude Code expert plugin (v6.0.0) with 16 commands, 33 skills, 16 agents, and a 10-tool MCP server for deep code reasoning, orchestrated execution, model routing, CI/CD integration, enterprise security, context budgeting, and interactive tutorials.

## What this plugin is best at
- Turning vague engineering requests into evidence-backed plans.
- Building repo fingerprints, invariant maps, and failure-mode analyses before code changes.
- Delegating broad work to teams while preserving a principal-engineer level synthesis pass.
- Diagnosing Claude Code, plugin, MCP, hook, and workflow problems systematically.
- Routing tasks to optimal models with cost awareness.
- Integrating Claude Code into CI/CD pipelines and enterprise environments.

## Core assets
- `commands/cc-intel.md`: deep-analysis command for repo intelligence, hypothesis trees, and execution strategy.
- `agents/principal-engineer-strategist.md`: senior reviewer for architecture, tradeoffs, and hidden-risk detection.
- `skills/deep-code-intelligence/SKILL.md`: reusable reasoning workflow for hard coding tasks.
- `mcp-server/src/index.js`: 10-tool searchable docs index with model recommendations, checklists, and comparisons.

## v6.0.0 additions
- **Model routing**: `skills/model-routing/SKILL.md` — intelligent model selection with cost tables.
- **Context budgeting**: `commands/cc-budget.md`, `skills/context-budgeting/SKILL.md` — token arithmetic and compact strategies.
- **CI/CD**: `commands/cc-cicd.md`, `skills/cicd-integration/SKILL.md` — GitHub Actions, headless mode, automated reviews.
- **Enterprise security**: `skills/enterprise-security/SKILL.md`, `agents/security-compliance-advisor.md` — compliance, audit logging, secrets management.
- **Plugin development**: `skills/plugin-development/SKILL.md`, `agents/plugin-architect.md` — build your own plugins.
- **Tutorials**: `commands/cc-learn.md`, `skills/worked-examples/SKILL.md` — 8 step-by-step walkthroughs.

## When to open deeper docs
| Signal | Open docs | Why |
|---|---|---|
| User asks for the "best" approach or a major refactor | `commands/cc-intel.md` | Evidence-driven analysis loop and output contract. |
| Need architectural judgement or root-cause isolation | `agents/principal-engineer-strategist.md` | Principal-level decomposition, invariants, and tradeoff review. |
| Need model or cost guidance | `skills/model-routing/SKILL.md` | Decision matrix, cost tables, budget planning. |
| Need CI/CD integration | `commands/cc-cicd.md` | GitHub Actions, pre-commit, headless mode patterns. |
| Need enterprise security patterns | `skills/enterprise-security/SKILL.md` | Compliance, audit logging, permission hardening. |
| Need task routing across plugin docs | `CLAUDE.md` and `mcp-server/src/index.js` | Fast path and queryable retrieval model. |
