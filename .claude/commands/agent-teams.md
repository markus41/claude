# Agent Teams Orchestration

Launch coordinated Claude Code Agent Teams with pre-configured team structures for complex tasks.

## Usage

```
/agent-teams <template> [options]
```

## Templates

### deliberation-council
Multi-agent code review with 20 deliberation protocols.
```
Create an agent team for code review deliberation:
- Security Reviewer (Sonnet): Review for security vulnerabilities, auth issues, injection risks
- Performance Reviewer (Sonnet): Check performance impact, memory leaks, N+1 queries
- Architecture Reviewer (Opus): Evaluate design patterns, SOLID principles, coupling
- Test Coverage Reviewer (Haiku): Validate test completeness, edge cases, mocking
- Devils Advocate (Sonnet): Challenge all assumptions, find edge cases, probe weaknesses

Use Red/Blue Team protocol for security-sensitive code.
Use Six Thinking Hats for architecture decisions.
Require plan approval before any teammate makes changes.
Have teammates share findings and challenge each other.
Synthesize into a verdict: APPROVE, APPROVE_WITH_CHANGES, REQUEST_CHANGES, or REJECT.
```

### pipeline-stages
Sequential release pipeline with parallel within stages.
```
Create an agent team for release pipeline:
- Code Reviewer (Sonnet): Review all changes since last release for quality and standards
- Test Runner (Haiku): Execute unit, integration, and E2E test suites in parallel
- Security Scanner (Sonnet): Run security audit, check dependencies, scan for vulnerabilities
- Deployment Engineer (Sonnet): Build artifacts, deploy to staging, run smoke tests, promote to production

Tasks have dependencies: Review must complete before Testing, Testing before Security, Security before Deploy.
Wait for all teammates to finish their stage before the next stage begins.
Post results to Jira and notify via Slack when complete.
```

### research-squad
Parallel research and investigation team.
```
Create an agent team to research this problem from multiple angles:
- Codebase Explorer (Haiku): Search and map all relevant code, dependencies, and entry points
- Hypothesis Tester (Sonnet): Form and test theories about the root cause or best approach
- Impact Analyzer (Sonnet): Analyze blast radius - what files, services, and tests are affected
- Solution Architect (Opus): Design the solution based on gathered evidence
- Knowledge Synthesizer (Sonnet): Combine all findings into an actionable implementation plan

Have teammates communicate directly and challenge each other's findings.
Require plan approval from the architect before implementation begins.
```

### debugging-hypotheses
Competing hypothesis investigation for complex bugs.
```
Create an agent team to debug with competing hypotheses:
- Hypothesis A (Sonnet): Investigate theory 1 - [describe first theory]
- Hypothesis B (Sonnet): Investigate theory 2 - [describe second theory]
- Hypothesis C (Sonnet): Investigate theory 3 - [describe third theory]
- Evidence Judge (Opus): Evaluate evidence from all hypotheses, determine root cause
- Fix Implementer (Sonnet): Implement the fix based on the winning hypothesis

Have teammates actively try to disprove each other's theories.
The Evidence Judge makes the final determination based on evidence quality.
```

### sprint-planning
Autonomous sprint planning and coordination.
```
Create an agent team for sprint planning:
- Backlog Analyzer (Haiku): Pull and prioritize backlog items from Jira, assess value vs effort
- Capacity Planner (Sonnet): Calculate team velocity, available capacity, and sprint load
- Risk Assessor (Sonnet): Identify blockers, dependencies, and risks for candidate stories
- Task Decomposer (Sonnet): Break selected stories into implementable subtasks with estimates
- Sprint Architect (Opus): Design final sprint plan with task ordering and dependency graph

Fetch data from Jira using Atlassian MCP. Update sprint board when plan is approved.
Require plan approval before committing the sprint.
```

## Options

| Flag | Description |
|------|-------------|
| `--team-size N` | Override default team size (3-8) |
| `--model MODEL` | Set model for all teammates |
| `--plan-approval` | Require plan approval before implementation |
| `--split-panes` | Use tmux split panes (requires tmux) |
| `--protocol PROTOCOL` | Set deliberation protocol (for council) |

## Integration with Plugins

Agent Teams automatically integrate with installed plugins:
- **Agent Review Council** (Tribunal): Provides 20 deliberation protocols for the deliberation-council template
- **Cognitive Code Reasoner** (Didact): Enables extended thinking for hypothesis-driven debugging
- **Predictive Failure Engine** (Cassandra): Feeds risk predictions to sprint planning team
- **Multi-Model Orchestration** (Conductor): Routes each teammate to the optimal model
- **Notification Hub** (Messenger): Sends team results via Slack/Teams/Discord
- **Autonomous Sprint AI** (Strategos): Powers autonomous sprint planning decisions
- **Code Knowledge Graph** (Librarian): Provides codebase intelligence to research and review teams

## Configuration

Enable Agent Teams in settings.json:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "auto"
}
```

## Best Practices

1. **Size tasks appropriately** - 5-6 tasks per teammate keeps everyone productive
2. **Avoid file conflicts** - Assign different files to different teammates
3. **Give enough context** - Include task-specific details in spawn prompts
4. **Start with research** - Use research-squad for unfamiliar codebases
5. **Monitor and steer** - Check teammate progress and redirect as needed
6. **Use plan approval** - For risky changes, require lead approval of plans

## Hooks

Configure quality gates with hooks:
- `TeammateIdle`: Auto-assign unclaimed tasks when a teammate finishes
- `TaskCompleted`: Validate review completeness before marking tasks done

## Examples

### Quick Code Review
```
/agent-teams deliberation-council
Review PR #142 with focus on security and performance
```

### Debug Production Issue
```
/agent-teams debugging-hypotheses
Users report 500 errors on /api/auth/login since last deploy.
Theory A: JWT token validation regression
Theory B: Database connection pool exhaustion
Theory C: Redis session store timeout
```

### Plan Next Sprint
```
/agent-teams sprint-planning
Plan sprint 24 for project LOBBI. Team of 6 engineers.
Focus on authentication epic and tech debt reduction.
```
