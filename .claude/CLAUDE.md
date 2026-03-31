# Project Instructions

## Overview
Neural Orchestration Platform (Golden Armada) — plugin-based AI agent orchestration
with visual workflow builder. React 18 + Vite 5 + TypeScript strict + Tailwind CSS.
19 domain plugins, 54 skills, 37 agents, 7 MCP servers, 11 hooks.

## Workflow Protocol
EXPLORE → PLAN → CODE → TEST → FIX → DOCUMENT

## Build & Test
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test` or `npm test`
- E2E: `pnpm test:e2e`
- Type check: `npx tsc --noEmit`
- Lint: `npx eslint .`

## Tech Stack
| Layer | Technology |
|-------|-----------|
| UI | React 18, ReactFlow, Framer Motion, Lucide |
| State | Zustand + immer, TanStack Query |
| Styling | Tailwind CSS 3, CVA, tailwind-merge |
| Validation | Zod, react-hook-form |
| Build | Vite 5, TypeScript 5.3 strict |
| Testing | Vitest, Playwright, Testing Library |
| CI | GitHub Actions (12 workflows) |
| MCP | 5 custom + perplexity + firecrawl |

## Key Paths
- Source: `src/` (components, hooks, stores, types, utils, workflows)
- Tests: `src/test/`
- Plugins: `plugins/` (19 domain plugins)
- Rules: `.claude/rules/` (modular, path-scoped instructions)
- Skills: `.claude/skills/` (54 reusable workflows)
- Agents: `.claude/agents/` (37 specialized subagents)
- Hooks: `.claude/hooks/` (11 lifecycle scripts)
- Templates: `.claude/templates/` (PR, design doc, test plan, incident)
- Docs: `docs/context/` (architecture, data model, API, security, testing)
- MCP servers: `.claude/mcp-servers/` + `.mcp.json`

## Reference Documents
Read these before making major changes:
- Architecture: `@docs/context/architecture.md`
- Data model: `@docs/context/data-model.md`
- API contracts: `@docs/context/api-contracts.md`
- Security: `@docs/context/security-rules.md` + `@.claude/rules/security.md`
- Testing: `@docs/context/testing-strategy.md` + `@.claude/rules/testing.md`
- Glossary: `@docs/context/domain-glossary.md`
- Decisions: `@docs/context/decisions/`

## Rules
- Code style: `@.claude/rules/code-style.md`
- Testing: `@.claude/rules/testing.md`
- Security: `@.claude/rules/security.md`
- Git: `@.claude/rules/git-workflow.md`
- Docker/K8s: `@.claude/rules/docker-k8s.md`
- Infrastructure: `@.claude/rules/infra.md`
- PR review: `@.claude/rules/review.md`
- Product/UX: `@.claude/rules/product.md`

## Decision Trees
- Auth/identity tasks → check `plugins/aws-eks-helm-keycloak/` + `docs/context/security-rules.md`
- Plugin development → check `plugins/claude-code-expert/` + `.claude/rules/architecture.md`
- UI/frontend tasks → check `src/components/` + `docs/context/ux-principles.md`
- Infrastructure tasks → check `.github/workflows/` + `.claude/rules/infra.md`
- Agent/skill creation → check `.claude/agents/` + `.claude/skills/` + `docs/context/domain-glossary.md`

## Key Commands
- Use subagents for research (preserves main context)
- Use `/compact` every 20-30 exchanges
- Use `/clear` between unrelated tasks
- Use `/cc-setup` for first-time configuration
- Use `/cc-sync` to update configuration after changes

## Research
- Use Perplexity MCP for web knowledge queries
- Use Firecrawl MCP for scraping specific URLs
- Use Context7 MCP for library documentation
- Check lessons-learned before starting: `.claude/rules/lessons-learned.md`

## Models
| Model | Use |
|-------|-----|
| opus | Architecture, complex decisions, security review |
| sonnet | Development, implementation, test writing |
| haiku | Research, fast lookups, docs |

## Self-Healing
When you encounter an error:
1. Fix the issue
2. Update `.claude/rules/lessons-learned.md` with the fix
3. If it reveals a pattern, update the appropriate rule in `.claude/rules/`

## Conventions
- TypeScript strict mode (all strict flags enabled)
- ES modules (`"type": "module"`)
- Path aliases: `@/*` → `./src/*`
- Commit format: `type(scope): description`
- Plugin manifests: `.claude-plugin/plugin.json`

## Don't Touch
- `node_modules/`, `dist/`, `build/`, `coverage/`
- `pnpm-lock.yaml` (auto-generated)
- `.claude/worktrees/` (git worktree managed)
- Plugin `node_modules/` directories
