# Claude Teams Hierarchy Lab

Experimental marketplace plugin template for Claude Teams that bootstraps **hierarchical decomposition**:

- **Claude** acts as the global orchestrator
- **Teammate agents** act as domain managers
- **Specialist sub-agents** execute leaf tasks with focused prompts and tools

This template includes commands, hooks, skills, agents, and rules to help you prototype orchestrated team topologies quickly.

## What This Template Provides

- **4 manager/expert agents** for orchestration and governance
- **3 decomposition-focused skills**
- **3 slash commands** to scaffold, decompose, and govern team plans
- **Hook automation** to enforce hierarchy contracts and closure summaries
- **Rules pack** for role boundaries, delegation depth, and escalation paths

---

## Three Implementation Plans

### Plan A — Fast MVP (1–2 days)
Best for validating the idea quickly in the marketplace.

1. **Install template as-is** and register the plugin card metadata.
2. Use `/teams-bootstrap` to generate initial org chart:
   - Orchestrator (Claude)
   - 3 manager agents (product, engineering, quality)
   - 6–9 specialist sub-agents
3. Keep delegation depth to 2 levels and enforce a single shared task board.
4. Add lightweight telemetry (task count, completion rate, handoff failures).
5. Pilot on 1 workflow (e.g., feature spec -> implementation -> review).

**Exit criteria:** team structure compiles, commands run, and one end-to-end workflow succeeds.

### Plan B — Production-Ready Core (1–2 weeks)
Best for teams wanting reliable repeatability and governance.

1. Extend manager-agent prompts with strict I/O contracts.
2. Introduce `/teams-decompose` policy profiles:
   - conservative (few agents, low fan-out)
   - balanced
   - aggressive (max parallel specialist spawning)
3. Add governance checks from hooks:
   - role-boundary validation
   - duplicate sub-agent detection
   - unresolved dependency alerts
4. Add scoring dashboard fields (cycle time, rework ratio, escalation count).
5. Add rollback strategy: collapse to manager-only execution if specialist churn is high.

**Exit criteria:** 3+ workflows run consistently with measurable quality improvements.

### Plan C — Adaptive Autonomy (2–4 weeks)
Best for advanced experiments with dynamic sub-agent creation.

1. Add runtime agent factory logic that spawns specialists from capability gaps.
2. Let managers request temporary sub-agents with TTL and explicit budget caps.
3. Add hierarchical memory model:
   - orchestrator memory (global priorities)
   - manager memory (domain plans)
   - specialist memory (short-lived execution context)
4. Add conflict-resolution protocol for cross-manager dependencies.
5. Add meta-agent review loop that tunes decomposition policy per sprint.

**Exit criteria:** autonomous spawning improves throughput without reducing quality or controllability.

---

## Commands

- `/teams-bootstrap` — scaffold a hierarchy from a project goal
- `/teams-decompose` — convert backlog items into manager/sub-agent work plans
- `/teams-govern` — run governance checks and escalation recommendations

## Agents

- `orchestrator-architect` — defines global orchestration strategy
- `manager-agent-designer` — designs manager role boundaries and contracts
- `specialist-spawner` — creates specialist sub-agent specs from leaf tasks
- `hierarchy-governor` — audits delegation quality, risk, and policy compliance

## Skills

- `hierarchical-decomposition` — tree-of-work decomposition patterns
- `manager-orchestration` — manager-agent coordination and handoff design
- `specialist-subagents` — creation and lifecycle management of specialist agents

## Rules

See `rules/hierarchy-rules.md` for mandatory constraints around delegation depth, ownership, escalation, and shutdown behavior.

## Suggested First Run

```bash
/teams-bootstrap Build a Claude Teams plugin for hierarchical decomposition
/teams-decompose --profile balanced --max-depth 2
/teams-govern --report
```
