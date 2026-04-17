# MCP Tools Reference — v5.0.0

22 tools in the plugin's MCP server. All tools are lazy-loaded on call; none consume context when idle beyond their metadata.

## Reference tools (15, `cc_docs_*`)

| Tool | Signature | Use |
|---|---|---|
| `cc_docs_search` | `(query)` | Full-text search across plugin skills/commands/agents |
| `cc_docs_list_topics` | `()` | List all documentation topics |
| `cc_docs_full_reference` | `(topic)` | Full content for a named topic |
| `cc_docs_env_vars` | `()` | Environment variables catalog |
| `cc_docs_settings_schema` | `()` | `.claude/settings.json` schema |
| `cc_docs_troubleshoot` | `(issue)` | Symptom → diagnostic section |
| `cc_docs_resolve_task` | `(task)` | Task → recommended commands/agents/skills/workflow |
| `cc_docs_model_recommend` | `(task, budget?)` | Model selection with cost |
| `cc_docs_checklist` | `(task_type)` | Checklist for named task type |
| `cc_docs_compare` | `(items[])` | Side-by-side comparison of 2-3 topics |
| `cc_docs_autonomy_plan` | `(task, repo_signals?)` | Autonomy plan for a task |
| `cc_docs_workflow_pack_recommend` | `(task)` | Shortlist workflow packs |
| `cc_docs_hook_pack_recommend` | `(signals?)` | Shortlist hook packs from repo signals |
| `cc_docs_team_topology_recommend` | `(task, complexity, team_size)` | Shortlist team topologies |
| `cc_docs_schedule_recommend` | `(task, requires_local_files?)` | Schedule blueprint + deployment profile |

## KB artifact tools (7, `cc_kb_*`)

All return one artifact ≤ 2 KB. Caller names the artifact. Use `*_recommend` tools above to get a shortlist of names.

| Tool | Signature | Returns |
|---|---|---|
| `cc_kb_hook_recipe` | `(name)` | Hook pack: script + event + matcher + settings.json snippet + verify |
| `cc_kb_topology_kit` | `(name)` | Topology: composition, file ownership, coordination, cost, anti-patterns |
| `cc_kb_workflow_pack` | `(name)` | Workflow pack: phases, steps, exit criteria, anti-patterns |
| `cc_kb_channel_server` | `(name)` | Channel server TypeScript implementation |
| `cc_kb_lsp_config` | `(language)` | LSP config: install, verify, diagnostics hook, notes |
| `cc_kb_pattern_template` | `(name)` | Agentic pattern: 5-layer wiring, cost, anti-patterns |
| `cc_kb_autonomy_profile` | `(profile)` | Profile: permissions, gates, session init, memory rules |

## Available KB artifacts (as of v8.0)

### Hooks (seeded 2; target 8+)

- `protect-sensitive-files`
- `auto-format-after-edit`
- *(extract remaining from `archive/v7.6.0/skills/hook-script-library/` + `hook-policy-engine/`)*

### Topologies (seeded 2; target 5)

- `architect-implementer-reviewer`
- `competing-hypotheses-debug`
- *(extract remaining: frontend-backend-test, security-performance-test-review-board, docs-migration-sprint)*

### Workflows (seeded 2; target 7)

- `tdd-implementation`
- `fix-bug-from-trace`
- *(extract: understand-codebase, refactor-safely, repo-review-before-merge, generate-claude-md, migration-plan-before-edits)*

### Channels (seeded 1; target 4)

- `ci-webhook`
- *(extract: mobile-approval, discord-bridge, fakechat)*

### LSP (seeded 2; target 18)

- `typescript`
- `python`
- *(extract: go, rust, java, csharp, ruby, php, elixir, swift, svelte, vue, tailwind, graphql, prisma, yaml, dockerfile, bash)*

### Patterns (seeded 2; target 13)

- `reflection`
- `prompt-chaining`
- *(extract: routing, parallelization, eval-optimizer, orchestrator-workers, react, blackboard, plus 4 Anthropic workflow primitives)*

### Autonomy (seeded 2; target 4)

- `balanced`
- `conservative`
- *(extract: aggressive, unattended-review)*

## Extraction status

v8.0.0 ships with seed artifacts in each category to prove the pattern (tests green, 2 KB cap enforced). Full extraction from the archived v7 skills is tracked as a Phase 1 carryover task — mechanical work that can happen across any session.

Run `node mcp-server/test/tools.test.js` to validate the seeded set.
