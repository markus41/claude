---
name: agent-teams-advanced
description: Advanced patterns for Claude Code Agent Teams — topology design, cross-team communication, worktree coordination, failure handling, and cost management
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
triggers:
  - agent teams
  - team topology
  - parallel agents
  - multi-agent coordination
  - worktree
  - teammate
  - mesh network
---

# Agent Teams Advanced Patterns

Claude Code Agent Teams enable parallel multi-agent coordination within a shared task context. This skill covers production-grade patterns for designing, scaling, and debugging agent team topologies.

## Agent Teams Mechanics

**Enablement:**
- Set environment variable: `CLAUDE_ENABLE_TEAMS=true`
- Or pass `--enable-teams` flag to Claude Code CLI
- Each teammate gets an independent context window and git worktree

**How teams differ from subagents:**
- **Subagents** are sequential, fire-and-forget workers. Main agent waits for results then continues.
- **Teammates** run in parallel with peer-to-peer messaging. All teammates share a task list and can see each other's progress in real-time.
- **Independent sessions**: Each teammate maintains its own conversation state and can recover if it fails without blocking other teammates.
- **Shared responsibility**: Teammates collectively own the goal, not individual subtasks assigned by a parent.

## Team Topology Patterns

### Hub-and-Spoke (Lead-Driven)
One lead assigns work to teammates and collects results.

- **Best for**: Hierarchical workflows, clear task decomposition, reporting requirements
- **Lead responsibilities**: Break work into tasks, assign to teammates, merge results
- **Teammates**: Execute assigned tasks, report status and blockers
- **Cost**: 1 lead (Opus) + N teammates (Sonnet/Haiku)

```
      ┌─────────┐
      │  Lead   │
      └────┬────┘
      ┌────┴────┬─────────┬─────────┐
      │    │    │    │    │    │    │
      ▼    ▼    ▼    ▼    ▼    ▼    ▼
   Team1 Team2 Team3 Team4 Team5 Team6
```

### Mesh Network (Peer-to-Peer)
All teammates can message each other directly. Useful for truly parallel, interdependent work.

- **Best for**: Feature branches, cross-domain coordination, research teams
- **Communication**: Direct peer messaging, no bottleneck at lead
- **Self-organization**: Teammates claim tasks from shared queue
- **Cost**: N agents (all Sonnet for parity)

```
   ┌──────────────────────────┐
   │                          │
   ▼                          ▼
Team1 ◄──────────────────► Team2
   │                          │
   │ ◄──────────────────►     │
   │                          │
   └──────────►Team3◄─────────┘
      ◄────────┐ │ ┌───────────►
               │ │ │
            Self-Claim Queue
```

### Pipeline (Sequential Handoff)
Work moves through stages. Each stage completes before passing to the next.

- **Best for**: Transformations, migrations, multi-phase analysis
- **Stages**: Analyzer → Implementer → Validator → Deployer
- **Blocking**: Each stage waits for previous to complete
- **Cost**: 4+ agents (Opus-Sonnet-Sonnet-Sonnet typically)

### Hierarchy (Multi-Level Teams)
Team leads manage sub-teams. Useful for large organizations.

- **Best for**: Enterprise projects, scaled parallel work
- **Structure**: Main team + 3-4 sub-teams, each with lead
- **Complexity**: Coordination overhead increases at each level
- **Cost**: Scales quadratically (main lead + leads × members)

## Cross-Team Communication

### Shared Task List
All teammates can view, claim, and complete tasks from a shared queue.

- **Self-claiming**: Teammates ask "who's claiming this?" and pick up the next unclaimed task
- **Status visibility**: All teammates see what everyone else is working on
- **Prevents duplicate work**: Task locks prevent two teammates from claiming the same work

### Peer-to-Peer Messaging
Direct messages between teammates for synchronous coordination.

```
Teammate1 → "Finished schema, Team2 can now generate tests"
Teammate2 → "Tests running, Team3 estimate for performance review?"
Teammate3 → "Ready when schema is final—what's your ETA?"
```

### Status Broadcasting
Periodic updates visible to entire team (every 5-10 minutes).

- **Progress**: "Completed 3/8 unit tests"
- **Blockers**: "Waiting on Team4's API changes"
- **Handoff signals**: "Feature branch ready for review"

### Conflict Resolution
When two teammates claim the same task:

1. **Task lock**: First to claim gets exclusive lock (60 sec default)
2. **Conflict detection**: System alerts second claimer
3. **Graceful degradation**: Second teammate picks next task or supports first with parallel work

## Git Worktree Coordination

Each teammate gets an isolated git worktree, preventing merge conflicts during work.

**Worktree naming**:
```bash
# Automatic naming by team ID and teammate index
.git/worktrees/team-{team_id}-{teammate_index}/
```

**Merge strategy on completion**:
1. **Squash and merge**: Default. Reduces commit graph noise
2. **Rebase and merge**: Preserves linear history, good for pipelines
3. **Three-way merge**: Default for independent branches, may have conflicts

**Conflict handling**:
- **Auto-resolvable**: Same file, different sections → merge succeeds
- **Conflict markers**: Both teammates edit same section → manual resolution required
- **Fallback**: Team lead (or designated resolver) reviews and resolves conflicts

**Branch naming conventions**:
```
feature/{team-id}/{teammate-role}
  examples: feature/cce-001/frontend, feature/cce-001/backend

bugfix/{team-id}/{issue-number}
  examples: bugfix/cce-002/123, bugfix/cce-002/456
```

## Team Sizing Guidance

| Size | Characteristics | Best For | Cost |
|------|---|---|---|
| 2 | Minimal coordination overhead. Ideal split: frontend + backend, or analyzer + implementer. | Feature branches, migrations | 2x single-agent cost |
| 3-4 | Sweet spot for most projects. Independent parallel tracks. Light coordination. | Full-stack features, multi-phase analysis | 3-4x single-agent cost |
| 5+ | Coordination overhead grows. Task switching between teammates. Diminishing returns. | Enterprise projects, research teams | 5x+ but not linearly valuable |

**Cost scaling**:
- Each teammate is a separate Opus/Sonnet session
- 2 Sonnet agents = ~2x cost, but work completes in ~50-60% of sequential time (depends on parallelization efficiency)
- 5 agents = 5x cost, but work may complete in ~30-40% of sequential time (coordination tax increases)

**Cost-benefit formula**:
```
TeamCost = (team_size × hourly_rate_per_agent)
Speedup = 100% / (1 + coordination_overhead)
ROI = (sequential_time - (team_time × speedup)) / TeamCost
→ ROI > 0 when team_time * speedup < sequential_time
```

## Failure Handling

### Single Teammate Failure
- **Detection**: No heartbeat for 30 seconds, or task marked as failed
- **Impact**: Other teammates continue. Orphaned work reassigned to next available teammate.
- **Recovery**: Failed teammate wakes up in a fresh session, picks next available task
- **Max retries**: 2 per task by default. After 2 failures, escalate to team lead.

### Cascading Failure
When teammate A's failure blocks teammate B (dependency).

- **Timeout**: After 60 seconds of blockage, attempt workaround or parallel path
- **Escalation**: Involve team lead to decide: retry, skip, or reassign work
- **Partial success**: Mark work as "completed with warnings," document blockers

### Team-Wide Failure
All teammates down or unresponsive.

- **Fallback**: Team lead takes over work sequentially
- **Graceful degradation**: Resume from last successful checkpoint (git commit)
- **Monitoring**: Alert user after 2 minutes of team inactivity

### Monitoring Teammate Health
```bash
# Check teammate status
claude-code teams status --team-id cce-001

# Output:
# ┌─────────────┬────────────┬──────┬─────────────┐
# │ Teammate    │ Status     │ Task │ Last Update │
# ├─────────────┼────────────┼──────┼─────────────┤
# │ Frontend    │ RUNNING    │ 5/12 │ 2m ago      │
# │ Backend     │ COMPLETED  │ 8/8  │ 5m ago      │
# │ Tests       │ STALLED    │ 2/6  │ 10m ago     │
# └─────────────┴────────────┴──────┴─────────────┘
```

## Custom Team Templates

Define team compositions beyond built-in templates using a team configuration file.

**Example: Custom 3-person migration team**
```yaml
version: 1
name: "Database Migration"
description: "Schema analyzer, data migrator, validator"
team:
  - name: "analyzer"
    role: "Database schema analysis"
    model: "claude-sonnet-4-6"
    skills:
      - sql-analysis
      - schema-design
    timeout_seconds: 1800

  - name: "migrator"
    role: "Data migration execution"
    model: "claude-sonnet-4-6"
    skills:
      - data-migration
      - transformation-engine
    timeout_seconds: 3600

  - name: "validator"
    role: "Post-migration verification"
    model: "claude-haiku-4-5"
    skills:
      - data-validation
      - integrity-checking
    timeout_seconds: 900

communication: "mesh"
task_strategy: "shared_queue"
parallelization: "full"
```

## Real-World Patterns

### 1. Feature Branch Team (3 agents)
- **Frontend** (Sonnet): UI components, styling, state management
- **Backend** (Sonnet): API endpoints, database schema changes
- **Tests** (Haiku): Unit, integration, and E2E tests

→ Parallel development with synchronized handoffs

### 2. Migration Team (4 agents)
- **Analyzer** (Sonnet): Audit old codebase, create migration plan
- **Migrator** (Sonnet): Execute refactoring
- **Validator** (Haiku): Verify no regressions
- **Lead** (Opus): Coordinate, resolve conflicts, review PRs

→ High confidence, rapid migrations

### 3. Incident Response Team (3 agents)
- **Triager** (Haiku): Investigate error signals, classify severity
- **Fixer** (Sonnet): Implement hotfix
- **Verifier** (Haiku): Confirm fix resolves issue, no side effects

→ Fast incident turnaround

### 4. Research Team (4 agents + synthesizer)
- **Researcher 1-3** (Haiku): Parallel investigation of 3 topics
- **Synthesizer** (Sonnet): Combines findings, creates coherent summary

→ Cover more ground in parallel research

### 5. Review Board (3 agents)
- **Security Reviewer** (Sonnet): Audit for vulnerabilities
- **Performance Reviewer** (Haiku): Check for bottlenecks, inefficient patterns
- **Quality Reviewer** (Haiku): Code style, maintainability, test coverage

→ Parallel review perspectives

## Cost Management

### Estimating Team Cost
```
Base cost = (num_teammates × model_cost_per_hour) × estimated_duration_hours
Example: 3 Sonnet agents × $15/hour × 2 hours = $90

vs.

Sequential cost = 1 Sonnet × $15/hour × 6 hours = $90
Speedup: 3 agents complete in 2 hours vs. 6 sequential → 3x faster, same cost
```

### Model Assignment Per Teammate
- **Opus** (team lead): Complex architecture, conflict resolution, synthesis
- **Sonnet** (implementation): Main work — features, refactoring, migrations
- **Haiku** (research, validation): Lightweight tasks — checking, summarizing, testing edge cases

### When Teams Are Worth the Cost
- **YES, use teams if**:
  - Work is truly parallelizable (frontend + backend, not cascading dependencies)
  - Task duration > 1 hour (coordination overhead justified)
  - Deadline is critical (2-3x faster worth the cost)
  - Risk is high (parallel review + validation worth extra cost)

- **NO, use sequential if**:
  - Tasks are cascading (B waits for A, C waits for B)
  - Work is < 30 minutes (coordination overhead too high)
  - Budget is fixed and limited (sequential is cheaper)
  - High variance in teammate performance (uneven completion)

### Cost Optimization Tips
1. **Use Haiku for validation** instead of Sonnet — 75% cheaper, similar quality
2. **Limit team size** to 3-4 unless truly independent tracks exist
3. **Batch small tasks** instead of assigning individually (reduced coordination overhead)
4. **Set aggressive timeouts** (900 seconds) to fail fast on stuck teammates
5. **Monitor actual speedup** — if actual duration > 50% of sequential, reduce team size

---

**See also**: [teams-architect agent](../agents/teams-architect.md) for interactive team design assistance.
