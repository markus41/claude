# ULTRAPLAN — Claude Code Expert Plugin Redesign

> **Status:** Draft v2 (post-advisor-review) · **Date:** 2026-04-16
> **Target path:** `C:\Users\MarkusAhling\pro\claude\plugins\claude-code-expert`
> **Current version:** v7.6.0 (1.3 MB · 26 agents · 21 commands · 49 skills · 15-tool MCP server)
> **Target version:** v8.0.0 — the "second-brain" redesign, engram-native

---

## 0. TL;DR

The plugin has grown organically across 7 minor versions into a **reference-document library masquerading as a capability pack**. It violates the two principles modern Claude Code is built around (2025–2026):

1. **Progressive disclosure** — frontmatter is tiny, body loads on activation, deep references live in `references/` or in MCP tools that the model queries on demand. Anthropic's `skill-creator` is the canonical spec: SKILL.md ≤ ~500 lines, description is the trigger and should be **specific and "pushy"**.
2. **Separation of knowledge vs. behavior** — MCP servers hold the reference corpus (queryable, zero passive cost); skills/agents/commands encode *when to act and how*, not *what to know*.

And — critically — it ignores what is already installed at the user level:

3. **`engram:memory` is the installed, always-active second brain.** SQLite + FTS5, global MCP, with `mem_save`, `mem_search`, `mem_context`, `mem_session_summary`, `topic_key` upsert, `scope` (project/personal), 7 types. Building a parallel memory system inside this plugin would duplicate it.

**v8.0 thesis (revised):**
- Collapse the 49-skill sprawl into **~14 behavior-triggering skills** that route reference queries to the MCP server.
- Re-center the MCP server as the sole source of reference truth (22 tools, ≤ 2 KB per artifact).
- **Delegate memory storage entirely to engram.** The plugin adds three things engram does not:
  1. **CC-scoped `topic_key` conventions** so Claude's proactive saves during CC-setup sessions are retrievable as a coherent CC knowledge base (`cc/hooks/{pack}`, `cc/autonomy/{profile}`, `cc/plugin/{name}`, etc.).
  2. **A `memory-consolidator` agent** that queries engram on-demand (or from a Stop-hook trigger), mines CC-scoped observations, and writes reinforced patterns into `memory/rules/cc-patterns.md` — a small curated file that `/cc-setup` loads as baseline conventions for the next session.
  3. **A `/cc-memory` command** that wraps engram with CC-specific searches, export, and digest generation (never mutates engram; it writes only to `memory/rules/*` and `memory/DRAFT.md`).

Target reductions:
- Skills: **49 → 14** (−71%)
- Commands: **21 → 11** (−48%)
- Agents: **26 → 18** (role-consolidated)
- Plugin size: **1.3 MB → ~450 KB** (−65%)
- Passive context load (frontmatter-only budget): **~18 K tokens → ~5 K tokens** (−72%)
- MCP reference tools: **15 → 22** (+7 knowledge-base tools; **zero memory tools** — engram owns that)

---

## 1. Diagnosis — Why the current design is "old"

### 1.1 Structural smells (measured)

| Smell | Evidence | Severity |
|---|---|---|
| Frontmatter rot | 22 of 49 skills have empty or template-leaked `description:` (e.g. `"{stack_name} operations"`, `"Deploy to staging/production"`, `"What this command does"`) | 🔴 Blocker |
| Skill duplication | Hooks domain spread across **3 skills** (`hooks-system`, `hook-policy-engine`, `hook-script-library`) + 1 agent (`hooks-specialist`) + 1 command (`cc-hooks`) | 🔴 Blocker |
| Skill duplication | Agent-team domain spread across **4 skills** (`agent-teams`, `agent-teams-advanced`, `agent-team-topologies`, `teams-collaboration`) + 3 agents (`team-orchestrator`, `teams-architect`, `agent-lifecycle-manager`) | 🔴 Blocker |
| Setup sprawl | 4 overlapping commands: `cc-setup`, `cc-bootstrap`, `cc-config`, `cc-sync` | 🟠 Major |
| Debug sprawl | `cc-debug`, `cc-troubleshoot`, `debugger`, `claude-code-debugger`, skill `troubleshooting`, skill `self-healing-advanced` — six entry points | 🟠 Major |
| Reference-as-skill antipattern | Median skill size 550 lines; largest 971 lines (`channels-bootstrap`). Activating one blows the budget. skill-creator guidance is ≤500 lines and push deeper content to `references/` | 🔴 Blocker |
| Knowledge in prose | Hook recipes, topology kits, channel-server TypeScript embedded as prose in skills instead of being artifact-returning MCP tools | 🟠 Major |
| CLAUDE.md as manifest | Plugin root `CLAUDE.md` is lean, but `CONTEXT_SUMMARY.md` is a ~1200-word changelog loaded as bootstrap context | 🟠 Major |
| Duplicates engram | v7 plan had its own `memory/` JSONL store + 7 memory MCP tools — **duplicates the globally-installed engram** which is already ALWAYS ACTIVE | 🔴 Blocker (new in v2) |
| No CC-scoped memory conventions | Claude saves to engram freely, but nothing teaches it to use a stable `topic_key` prefix for CC-setup work → CC knowledge is scattered and not queryable as a coherent pack | 🟠 Major |
| No consolidation for CC patterns | Anthropic's `consolidate-memory` exists but there is no CC-scoped consolidator that promotes stable CC patterns into a file that `/cc-setup` can load | 🟠 Major |

### 1.2 What is actually good — keep and amplify

| Asset | Why it's modern | Action in v8 |
|---|---|---|
| 15-tool MCP server | Queryable, cached, zero passive context cost | **Expand** to 22 tools, make it the reference spine |
| `principal-engineer-strategist` agent | Role-clear, model-deliberate (Opus), evidence-driven output contract | Keep as-is |
| `evaluator-optimizer`, `pattern-router` agents | Directly implement Anthropic's agentic-patterns taxonomy | Keep; wire into orchestration |
| `deep-code-intelligence` skill | One of the few skills that encodes *workflow*, not *reference* | Keep; slim to ~200 lines |
| `autonomy-profiles` skill + 3 gate agents | Addresses real gap (unattended mode safety) with profile + verifier pattern | Keep; move profile recipes to MCP |
| Role-based subagent packs (`implementer`, `debugger`, `migration-lead`, etc.) | Tool-restricted, model-deliberate, role-scoped | Keep all |

### 1.3 What modern Claude Code looks like (research grounding)

Evidence drawn from locally-installed reference skills (Anthropic's own):

- **`anthropic-skills:skill-creator`** — canonical skill spec. Key rules embedded below in §2.4.
- **`anthropic-skills:consolidate-memory`** — reflective pass over memory, the pattern the plugin's `memory-consolidator` will follow.
- **`engram:memory`** (installed marketplace plugin) — SQLite+FTS5 persistent store with 7 proactive-save types and `topic_key` upsert. ALWAYS ACTIVE via `UserPromptSubmit` and `SessionStart` hooks.

These three define the shape v8 must fit into.

---

## 2. Target architecture — The Second Brain

### 2.1 Five-layer model (upgrade from the 4-layer stack in `cc-setup.md`)

```
┌────────────────────────────────────────────────────────────────────┐
│  L5 — MEMORY (delegated)   engram (global MCP) for data store      │
│                            plugin adds: CC conventions + digests   │
├────────────────────────────────────────────────────────────────────┤
│  L4 — AGENTS               Tool-restricted workers, model-chosen   │
├────────────────────────────────────────────────────────────────────┤
│  L3 — HOOKS                Lifecycle guardrails + consolidation    │
├────────────────────────────────────────────────────────────────────┤
│  L2 — SKILLS (behavior)    Pushy frontmatter, workflow body,       │
│                            references/ + MCP for heavy content     │
├────────────────────────────────────────────────────────────────────┤
│  L1 — CLAUDE.md            Routing OS (≤120 lines, no reference)   │
├────────────────────────────────────────────────────────────────────┤
│  L0 — MCP SERVER (ref)     22 tools, queryable, cached             │
└────────────────────────────────────────────────────────────────────┘
```

Every layer above L0 is ≤ a few KB. All reference knowledge lives in L0 (this plugin's MCP server) and L5 (engram, global).

### 2.2 The memory layer — engram-native with a CC overlay

**Write path** (unchanged from current user workflow — Claude saves proactively to engram):
- Claude follows engram's existing protocol (ALWAYS ACTIVE from `SessionStart` hook).
- For CC-setup work, Claude uses a **CC topic_key convention** taught by the `cc-second-brain` skill:

| Domain | topic_key prefix | Example |
|---|---|---|
| Plugin config | `cc/plugin/{name}/{aspect}` | `cc/plugin/claude-code-expert/skill-consolidation` |
| Hook pack | `cc/hooks/{pack}` | `cc/hooks/protect-sensitive-files` |
| Autonomy profile | `cc/autonomy/{profile}` | `cc/autonomy/balanced` |
| Agent topology | `cc/topology/{kit}` | `cc/topology/frontend-backend-test` |
| MCP server | `cc/mcp/{server}/{aspect}` | `cc/mcp/context7/setup` |
| Workflow pack | `cc/workflow/{name}` | `cc/workflow/tdd-implementation` |
| Repo fingerprint | `cc/repo/{slug}/{aspect}` | `cc/repo/taia-a4/stack-detected` |

The skill teaches; engram stores. No parallel DB, no custom tools.

**Read path** (two modes):

1. **Runtime**: during a CC-setup session, Claude queries engram directly via `mem_search` or `mem_context` with `cc/*` prefix hints. The `cc-second-brain` skill documents these query patterns.

2. **Consolidation**: periodically (scheduled task or on-demand via `/cc-memory consolidate`), the `memory-consolidator` agent:
   - Queries engram for all observations matching `cc/*` (read-only, via `mem_search`).
   - Groups by `topic_key` prefix.
   - Counts reinforcements (how many saves for the same key).
   - For keys with **≥3 saves and no conflicting observations**, writes a condensed 1-line pattern to `memory/rules/cc-patterns.md`.
   - For conflicts, writes to `memory/rules/DRAFT.md` for human review.
   - Never mutates engram (engram `mem_update` reserved for user-initiated corrections).

**Plugin-owned memory files** (small, hand-curated or consolidator-generated):

```
memory/
├── conventions.md        # How to use engram for CC work (source: skill body)
├── rules/
│   ├── cc-always.md      # Hard rules auto-loaded by /cc-setup (user-curated)
│   ├── cc-patterns.md    # Consolidator-generated patterns (reinforced ≥3×)
│   └── DRAFT.md          # Candidate promotions + conflicts awaiting review
├── digests/              # Exported digests from /cc-memory export (humans read these)
│   └── README.md
└── consolidate.log       # Append-only log of consolidation runs
```

**Loading discipline:**
- Always auto-loaded by `/cc-setup` and `/cc-sync`: `memory/rules/cc-always.md` + `memory/rules/cc-patterns.md` (combined hard cap: 3 K tokens; consolidator enforces).
- On-demand by Claude: anything via `mem_search` / `mem_context` (engram tools, zero passive cost).
- Never auto-loaded: `digests/*`, `DRAFT.md`, `consolidate.log`.

**Write discipline (revised per advisor feedback):**
- Claude writes to engram **freely and proactively** (engram's existing model — the advisor correctly flagged that restricting this starves the system).
- Consolidator writes only to `memory/rules/cc-patterns.md`, `memory/rules/DRAFT.md`, `memory/consolidate.log`.
- `memory/rules/cc-always.md` is user-curated only (edits via `/cc-memory edit-always`).
- `/cc-memory export` writes to `memory/digests/` — never touches engram or rules files.

This gives the "second brain" deliverable the user asked for without duplicating engram: engram is the nervous system, the plugin is the cortex that *distills* engram's raw observations into reusable CC conventions.

### 2.3 MCP server v5.0 — the reference spine (no memory tools)

Expand `mcp-server/src/index.js` from 15 → **22 tools**. All knowledge moved out of verbose skills becomes a queryable tool. **No memory tools** — engram owns memory; the plugin's MCP is strictly reference-only.

| Existing (15, keep) | New in v5.0 (7, from skills) |
|---|---|
| `cc_docs_search` | `cc_kb_hook_recipe(name)` — returns one security-hardened hook script |
| `cc_docs_list_topics` | `cc_kb_topology_kit(name)` — returns one of 5 topology kits |
| `cc_docs_full_reference` | `cc_kb_workflow_pack(name)` — returns one of 7 workflow packs |
| `cc_docs_env_vars` | `cc_kb_channel_server(pattern)` — returns one channel server implementation |
| `cc_docs_settings_schema` | `cc_kb_lsp_config(language)` — returns LSP server config + install cmd |
| `cc_docs_troubleshoot` | `cc_kb_pattern_template(pattern)` — returns agentic-pattern template |
| `cc_docs_resolve_task` | `cc_kb_autonomy_profile(profile)` — returns profile + settings.json block |
| `cc_docs_model_recommend` | |
| `cc_docs_checklist` | |
| `cc_docs_compare` | |
| `cc_docs_autonomy_plan` | |
| `cc_docs_workflow_pack_recommend` | |
| `cc_docs_hook_pack_recommend` | |
| `cc_docs_team_topology_recommend` | |
| `cc_docs_schedule_recommend` | |

**Design invariant:** every KB tool returns a single artifact ≤ 2 KB. The caller names which one. No tool returns "all recipes" — callers either query the recommender first (which returns a shortlist of names) or already know the name.

**KB data layout** (server-side, not loaded into context):
```
mcp-server/
├── src/
│   ├── index.js                 # Tool router (~700 lines, was 1265)
│   └── loaders/
│       ├── hooks.js             # Reads kb/hooks/*.json
│       ├── topologies.js
│       ├── workflows.js
│       ├── channels.js
│       ├── lsp.js
│       ├── patterns.js
│       └── autonomy.js
└── kb/
    ├── hooks/*.json             # One file per hook pack (8 files)
    ├── topologies/*.json        # One per topology kit (5 files)
    ├── workflows/*.json         # One per workflow pack (7 files)
    ├── channels/*.ts.txt        # Channel server source as text (4 files)
    ├── lsp/*.json               # LSP per language (18 files)
    ├── patterns/*.json          # Agentic patterns (13 files)
    └── autonomy/*.json          # Autonomy profiles (4 files)
```

### 2.4 Skill redesign — behavior triggers (skill-creator conformant)

Every surviving skill must pass this test:
- **Description field**: action-oriented, specific triggers, "pushy" per skill-creator guidance. Must name at least 3 specific contexts. No template tokens. ≤300 chars.
- **Body**: ≤ 500 lines (skill-creator guidance). Single workflow/decision tree + MCP tool call table. Deep reference content lives in a sibling `references/` folder loaded on-demand.
- **MCP delegation**: at least one row in the "When you need X → call MCP tool Y" table (unless the skill genuinely has no reference content).

**Proposed 14 skills (down from 49):**

| # | Skill | Role | Replaces (from current 49) | references/ |
|---|---|---|---|---|
| 1 | `claude-code-setup` | Detect stack → deploy 5-layer stack | cc-setup orchestration playbook | detection-matrices.md |
| 2 | `claude-code-sync` | Idempotent update/propagation/audit | project-sync | drift-rubric.md |
| 3 | `deep-code-intelligence` | Evidence-driven deep reasoning | deep-code-intelligence, context-anchoring | evidence-table-format.md |
| 4 | `agentic-patterns` | 13 patterns → 5-layer wiring | agentic-patterns | (patterns via MCP) |
| 5 | `agent-teams` | Topology selection + lifecycle | agent-teams×3, teams-collaboration, agent-lifecycle | (kits via MCP) |
| 6 | `hooks` | Hook authoring + installing packs | hooks-system, hook-policy-engine, hook-script-library | hook-event-matrix.md |
| 7 | `mcp` | MCP integration + Prompts + channels bootstrap | mcp-servers, channels, channels-user-guide, channels-bootstrap | (servers via MCP) |
| 8 | `autonomy` | Autonomy profiles + gate agents | autonomy-profiles | (profiles via MCP) |
| 9 | `model-routing` | Task → model + cost | model-routing, cost-optimization | cost-table.md |
| 10 | `context-budgeting` | Token arithmetic + compact + analytics | context-budgeting, context-management, session-analytics | compact-strategies.md |
| 11 | `security-compliance` | Permissions + enterprise | enterprise-security, permissions-security | compliance-checklists.md |
| 12 | `plugin-development` | Build plugins | plugin-development | manifest-schema.md |
| 13 | `prompt-engineering` | CLAUDE.md + agent prompts + memory writing style | prompt-engineering, memory-instructions | claude-md-patterns.md |
| 14 | `cc-second-brain` | **NEW** · engram conventions + consolidator usage | — (new, bridges to engram) | topic-key-taxonomy.md |

**Deleted entirely** (content moved to MCP KB tools or removed as obsolete): `cli-reference`, `configuration`, `settings-deep-dive`, `tools-reference`, `slash-commands`, `git-integration`, `testing-workflows`, `ide-integrations`, `troubleshooting`, `extended-thinking`, `common-workflows`, `runtime-selection`, `computer-use`, `lsp-integration`, `worked-examples`, `research-routing`, `self-healing-advanced`, `council-review`, `checkpointing`, `scheduled-tasks`, `cicd-integration`, `agent-team-topologies`, `agent-teams-advanced`, `agent-teams`, `teams-collaboration`, `agent-lifecycle`, `channels`, `channels-user-guide`, `channels-bootstrap`, `hook-policy-engine`, `hook-script-library`, `hooks-system`, `agent-sdk`.

> **Note on `agent-sdk`:** the SDK itself ships with its own `claude-api` skill (visible in the system-reminder skills list). No plugin-local duplicate needed.

### 2.5 Command redesign — one path per intent

**Proposed 11 commands (down from 21):**

| Command | Intent | Replaces |
|---|---|---|
| `/cc-setup` | Full 5-layer deploy (first-time), `--audit` for scoring only | cc-setup, cc-bootstrap |
| `/cc-sync` | Update/propagate/fix-drift existing setup | cc-sync, cc-config |
| `/cc-memory` | Wrap engram for CC scope: search, export, consolidate, edit-always | cc-memory (refit) |
| `/cc-debug` | Diagnose CC setup issue (plugin/MCP/hook/permission) | cc-debug, cc-troubleshoot |
| `/cc-intel` | Deep analysis of a hard coding problem | cc-intel |
| `/cc-council` | Multi-agent review with chosen protocol | cc-council |
| `/cc-orchestrate` | Launch multi-agent workflow by pattern | cc-orchestrate |
| `/cc-autonomy` | Enable/configure autonomy profile + gates | cc-autonomy |
| `/cc-hooks` | Install/list/remove hook packs | cc-hooks |
| `/cc-channels` | Install event-driven channels | cc-channels |
| `/cc-help` | Plugin help with task-routing table | cc-help (upgraded) |

**Deleted/absorbed**: `cc-agent`, `cc-budget`, `cc-cicd`, `cc-config`, `cc-learn`, `cc-mcp`, `cc-perf`, `cc-schedule` (→ use native `schedule` skill + MCP `cc_docs_schedule_recommend`).

`/cc-memory` subcommands:
- `search <query>` — runs `mem_search` scoped to `cc/*` topic_keys, returns top 5
- `export [--domain hooks|autonomy|...]` — runs the consolidator in dry-run mode, writes markdown digest to `memory/digests/`
- `consolidate` — runs the consolidator agent for real (updates `memory/rules/cc-patterns.md` + `DRAFT.md`)
- `edit-always` — opens `memory/rules/cc-always.md` for hand-editing (user-curated only)
- `status` — shows: last consolidation time, pattern count, draft count, total engram observations matching `cc/*`

### 2.6 Agent redesign — role-consolidated

**Proposed 18 agents (down from 26):**

Keep (17): `principal-engineer-strategist`, `evaluator-optimizer`, `pattern-router`, `audit-reviewer`, `council-coordinator`, `research-orchestrator`, `team-orchestrator`, `implementer`, `debugger`, `migration-lead`, `dependency-auditor`, `release-coordinator`, `autonomy-planner`, `autonomy-verifier`, `autonomy-reviewer`, `plugin-architect`, `security-compliance-advisor`.

**NEW:** `memory-consolidator` — Opus, read-only on engram (`mem_search`, `mem_get_observation`), write-only on `memory/rules/cc-patterns.md`, `memory/rules/DRAFT.md`, `memory/consolidate.log`. Runs on-demand from `/cc-memory consolidate` or as a scheduled task. Promotion threshold: ≥3 saves for same `topic_key` with no conflicting observations. Never mutates engram.

Removed (role folded):
- `claude-code-architect` → absorbed by `principal-engineer-strategist` + `/cc-setup`
- `claude-code-debugger` → absorbed by `debugger` (CC-setup playbook loaded via `cc-debug` command)
- `hooks-specialist` → the `hooks` skill + MCP tools are the expert
- `ide-integration-specialist` → MCP `cc_kb_lsp_config` + skill chunk
- `mcp-configurator` → `mcp` skill + `/cc-setup --mcp-only`
- `permissions-security-advisor` → folded into `security-compliance-advisor`
- `sdk-guide` → no agent needed (external skill covers it)
- `teams-architect` → folded into `team-orchestrator` (with topology MCP tool)
- `agent-lifecycle-manager` → merged into `team-orchestrator`

---

## 3. Migration matrix (old → new, engram-aware)

Full mapping lives at `migrations/v7-to-v8.md` (generated in Phase 0). Summary excerpt:

| v7 asset | v8 destination | Transform |
|---|---|---|
| `skills/hook-script-library/SKILL.md` | MCP `cc_kb_hook_recipe` data files | Delete skill; scripts → JSON KB |
| `skills/hook-policy-engine/SKILL.md` | `skills/hooks/SKILL.md` (pack table) + MCP tool | Pack list is one table in skill; 8 pack scripts → MCP |
| `skills/hooks-system/SKILL.md` | `skills/hooks/SKILL.md` | Workflow kept; recipes → MCP |
| `skills/channels-bootstrap/SKILL.md` | MCP `cc_kb_channel_server` | 4 TypeScript server files → KB |
| `skills/cli-reference/SKILL.md` | MCP `cc_docs_full_reference` | Already exists; enrich |
| `skills/configuration/SKILL.md` | MCP `cc_docs_settings_schema` | Already exists; enrich |
| `skills/memory-instructions/SKILL.md` | `skills/prompt-engineering/SKILL.md` + `skills/cc-second-brain/SKILL.md` | Split: CLAUDE.md prose → prompt-engineering; engram conventions → cc-second-brain |
| `commands/cc-bootstrap.md` | `/cc-setup --audit` flag | |
| `commands/cc-config.md` | `/cc-sync --fix-drift` flag | |
| `commands/cc-budget.md` | Deleted; skill + MCP `cc_docs_compare` covers it | |
| **`memory/` plan from v1** | **Replaced by engram-native design** | Only `memory/rules/` + `memory/digests/` + `memory/consolidate.log` remain. No JSONL, no SQLite, no custom memory tools. |
| `CONTEXT_SUMMARY.md` | Deleted from bootstrap | Replaced with concise `plugin.json.context.summary` only |

---

## 4. Implementation phases (7 phases, ~5 working sessions)

Each phase ends with a durable commit. Every phase except Phase 6 is additive (live plugin never breaks until cutover).

### Phase 0 — Safety net (30 min)
- `git tag v7.6.0-pre-redesign` on current state
- Create branch `v8-redesign`
- Generate `migrations/v7-to-v8.md` from §3 matrix (line-per-file, every deleted/renamed/merged file → destination)
- `cp -r` current state into `archive/v7.6.0/`
- **Gate:** `git diff v7.6.0-pre-redesign` shows only new additions (no deletions, no modifications to existing files)

### Phase 1 — Expand MCP server to v5.0 (1 session)
- Implement 7 new KB tools in `mcp-server/src/index.js` + `loaders/`
- Create `mcp-server/kb/` directory hierarchy
- Extract content from 18 soon-deleted skills into `mcp-server/kb/*.json` and `kb/channels/*.ts.txt`
- Write `mcp-server/test/tools.test.js` covering all 22 tools with artifact-size assertion (≤2 KB each)
- Bump MCP server version to `5.0.0`
- **Gate:** `node mcp-server/test/tools.test.js` green; every tool returns valid JSON ≤ 2 KB

### Phase 2 — Memory overlay + consolidator (1 session)
- Create `memory/` directory with `rules/cc-always.md` (empty template), `rules/DRAFT.md` (empty), `rules/cc-patterns.md` (empty), `digests/README.md`, `conventions.md`
- Write `skills/cc-second-brain/SKILL.md` (≤200 lines) + `references/topic-key-taxonomy.md`
- Write `agents/memory-consolidator.md` (Opus, read-only engram, write-only memory/rules/)
- Write `hooks/memory-consolidate-trigger.sh` (optional; triggers consolidator on Stop after N CC-related saves)
- **Gate:** `memory-consolidator` agent dry-runs against a hand-crafted engram fixture without error; no tool call attempts to mutate engram

### Phase 3 — Skill consolidation (1 session)
- Create 14 new skills in `skills-v8/` (parallel directory — live skills untouched)
- Each skill: pushy description, ≤500-line body, MCP tool call table, optional `references/` subdir
- Run a `lint-skills.sh` script that checks: non-empty description, no template tokens, ≤300 chars, body line count
- Run `audit-reviewer` on each new skill
- **Gate:** every new skill passes lint; max body = 500 lines; every skill has non-template description

### Phase 4 — Command consolidation (0.5 session)
- Create 11 new commands in `commands-v8/`
- `/cc-setup` absorbs `cc-bootstrap` via `--audit` flag
- `/cc-sync` absorbs `cc-config` via `--fix-drift` flag
- `/cc-memory` implements 5 subcommands wrapping engram
- **Gate:** `/cc-help` table shows all 11; every flag resolves to a code path that exists

### Phase 5 — Agent consolidation (0.5 session)
- Add `memory-consolidator` agent
- Verify no surviving command/skill references a doomed agent; update refs to survivors
- Delete 9 folded agents after verification
- **Gate:** `grep -r "agents/claude-code-architect\|agents/claude-code-debugger\|...9 names..." skills-v8/ commands-v8/ agents/` returns zero matches

### Phase 6 — Cutover (0.5 session)
- `mv skills skills-old && mv skills-v8 skills`
- `mv commands commands-old && mv commands-v8 commands`
- Update `.claude-plugin/plugin.json`: version `8.0.0`, rewrite `context` block, shrink `lazyLoadSections` to ≤8, prune keywords to ≤30, update `capabilities.provides`
- Rewrite plugin root `CLAUDE.md` (≤120 lines, pure routing, engram-aware)
- Delete `CONTEXT_SUMMARY.md`; replace with concise `plugin.json.context.summary`
- Rewrite top-level `README.md` (≤300 lines)
- Update `CHANGELOG.md` with `## [8.0.0] — 2026-04-{DD}` entry
- After one session of dogfood: `rm -rf skills-old commands-old`
- **Gate:** `plugin-validator` agent scores ≥ 95/100; MCP server responds on all 22 tools; engram integration verified (save a test observation with `cc/test` topic_key, `memory-consolidator` finds it in dry-run)

### Phase 7 — Documentation + dogfood (0.5 session)
- Write `docs/MIGRATION.md` (v7 → v8, what users need to know)
- Write `docs/MEMORY_ARCHITECTURE.md` (engram + plugin overlay, write/read discipline)
- Write `docs/MCP_TOOLS.md` (22-tool reference card)
- Dogfood `/cc-setup` on a real repo; first consolidation run produces at least one promoted pattern
- **Gate:** `audit-reviewer` + `principal-engineer-strategist` both sign off

---

## 5. Success criteria

| Metric | v7.6.0 | v8.0.0 target | Measurement |
|---|---|---|---|
| Skill count | 49 | ≤ 14 | `ls skills/*/SKILL.md | wc -l` |
| Command count | 21 | ≤ 11 | `ls commands/*.md | wc -l` |
| Agent count | 26 | ≤ 18 | `ls agents/*.md | wc -l` |
| Median skill length | 550 lines | ≤ 250 lines | `lint-skills.sh` |
| Max skill length | 971 lines | ≤ 500 lines | `lint-skills.sh` (fails above) |
| Frontmatter quality | 22/49 rotten | 0 rotten | lint: description non-empty, ≤300 chars, no template tokens, names ≥3 triggers |
| MCP tool count | 15 | 22 | `cc_docs_list_topics` |
| KB artifact size | n/a (prose in skills) | ≤ 2 KB per artifact | MCP integration test |
| Bootstrap context load | ~1200 words | ≤ 400 words | `wc -w` on `plugin.json` context.summary |
| Memory infrastructure | 0 (duplicate of engram proposed) | engram-native + CC overlay | `memory/` contains rules/ + digests/; no JSONL; no custom memory MCP tools |
| CC-scoped patterns promoted | 0 | ≥ 5 after first dogfood run | `wc -l memory/rules/cc-patterns.md` |
| `/cc-help` → action | 3+ commands to disambiguate | 1 command per intent | manual walkthrough |
| Plugin validator score | unknown | ≥ 95/100 | `plugin-validator` |

---

## 6. Risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Users have muscle memory for deleted commands | Breaking change | Leave shim command files for one minor version that print a one-liner redirect + run the replacement. Remove in v8.1. |
| Skills-v8 / commands-v8 out of sync during build | Mid-migration breakage | Phases 3–5 build parallel dirs; live plugin untouched until Phase 6 cutover. |
| MCP KB JSON files balloon | Slow tool response | Per-artifact size assert (≤2 KB) in integration test; KB loaded per tool call, never into model context |
| Consolidator drops load-bearing patterns | User loses curated CC knowledge | Consolidator only touches `cc-patterns.md` + `DRAFT.md` + `consolidate.log`. `cc-always.md` is user-curated only. Promotion requires ≥3 reinforcements + no conflict. |
| Consolidator mutates engram | Corrupts global memory | Agent definition restricts engram tools to read-only (`mem_search`, `mem_get_observation`, `mem_context`). `mem_save`/`mem_update` not in allowed-tools list. |
| MCP tool misses content that was in a deleted skill | Feature regression | `migrations/v7-to-v8.md` line-by-line mapping; Phase 6 gate diffs snapshot vs. reachable artifacts to prove every recipe/topology/pack is queryable |
| Engram disabled on some user machine | Memory layer silent | `cc-second-brain` skill detects engram via presence check; if absent, falls back to `memory/rules/*` only and tells user how to install engram |
| Scope creep | Ships late / never | Hard cut: v8.0 ships with the surface in §2.4–2.6; new features = v8.1 |

---

## 7. Rollback plan

- Phase 0 tag `v7.6.0-pre-redesign` is the restore point
- Phases 1–5 are additive only — rollback = `git reset --hard v7.6.0-pre-redesign`
- Phase 6 cutover commits as `v8.0.0-rc.1`; if dogfood fails, `git revert <cutover-sha>` restores v7 surface while keeping MCP v5.0 + memory overlay (both additive)
- `archive/v7.6.0/` remains through v8.1

---

## 8. Explicit non-goals

- Not modifying, replacing, or competing with `engram:memory`. The plugin sits *on top of* engram.
- Not building a parallel memory MCP server. The plugin MCP is strictly reference.
- Not touching any other plugin in `C:\Users\MarkusAhling\pro\claude\plugins\`.
- Not migrating user-level memory/preferences outside this plugin (user's global `~/.claude/CLAUDE.md` untouched).
- Not changing the plugin's public intent surface — all user-facing command families (setup/sync/intel/council/…) remain; fewer and better-routed.
- Not adding new runtime dependencies (stays pure stdlib Node.js for MCP; pure bash for hooks).

---

## 9. Open questions for the user

Before Phase 0 kicks off, three decisions gate the build:

1. **Command shims for one minor version?** (safer, cleaner removal in v8.1) — or hard-break at v8.0? *Recommended: shims.*
2. **Consolidator cadence?** On-demand only (user runs `/cc-memory consolidate`), or also scheduled daily via the native `schedule` skill? *Recommended: on-demand at v8.0, schedule option in v8.1.*
3. **Where does `memory/rules/cc-always.md` initially populate from?** Empty on v8.0 (user curates over time), or seeded from a starter set mined from the v7 skills that were deleted? *Recommended: seed with a small hand-picked set (<20 rules) mined from `deep-code-intelligence`, `prompt-engineering`, `enterprise-security` during Phase 2, labelled `[seeded]` so the user knows what to review.*

---

## 10. Next action (on approval)

```bash
cd C:/Users/MarkusAhling/pro/claude/plugins/claude-code-expert
git tag v7.6.0-pre-redesign
git checkout -b v8-redesign
mkdir -p migrations archive/v7.6.0
# Phase 0 continues by generating migrations/v7-to-v8.md from §3
```

**Awaiting user sign-off on the three questions in §9 before destructive action.**
