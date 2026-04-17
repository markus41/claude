# Agent Team Composition Template

Use this template when spinning up a multi-agent team with the `agent-teams-advanced` skill.
Fill in each section before launching agents. The coordinator agent reads this document as its
operating context.

---

## Mission Brief

| Field | Value |
|-------|-------|
| **Task** | [One-sentence description of what the team must accomplish] |
| **Scope** | [What is in scope — files, systems, concerns] |
| **Out of Scope** | [What agents must NOT touch or modify] |
| **Success Criteria** | [Measurable definition of done — e.g., "All tests pass, PR description written, no security findings"] |
| **Deadline** | [e.g., "Complete within one session — no background tasks"] |
| **Coordinator** | [Agent name or "principal-engineer-strategist"] |

---

## Team Roster

| Agent | Role | Model | Scope | Output Contract |
|-------|------|-------|-------|-----------------|
| [e.g., `security-auditor`] | [e.g., Security analysis] | [e.g., opus] | [e.g., `src/auth/`, `src/api/`, all hook scripts] | [e.g., Structured report: `{ findings: Finding[], blockers: string[] }`] |
| [e.g., `correctness-reviewer`] | [e.g., Logic and correctness] | [e.g., sonnet] | [e.g., Core business logic files listed in diff] | [e.g., List of bugs with file:line, severity H/M/L] |
| [e.g., `performance-analyst`] | [e.g., Performance review] | [e.g., sonnet] | [e.g., Hot paths identified by profiler or review request] | [e.g., Table: location, issue, estimated impact, fix] |
| [e.g., `style-enforcer`] | [e.g., Code style and conventions] | [e.g., haiku] | [e.g., All changed TypeScript files] | [e.g., List of violations with auto-fix suggestions] |
| [Add rows as needed] | | | | |

---

## Coordination Protocol

**Reports to**: [Agent name or "main conversation"]

**Reporting format**: Each agent writes findings to a structured markdown block with a header matching its role name. The coordinator collects all blocks.

**Merge order**:
1. [e.g., Security agent runs first — blockers stop the review]
2. [e.g., Correctness agent runs in parallel with Performance agent]
3. [e.g., Style agent runs last — only if no blockers from steps 1-2]
4. [e.g., Coordinator aggregates and writes final report]

**Conflict resolution**: If two agents report contradictory findings on the same file:line, the coordinator must cite both and mark the finding as "Disputed — requires human judgment."

---

## Shared Context

All agents have read access to:

- `[e.g., The PR diff / list of changed files]`
- `[e.g., docs/context/architecture.md]`
- `[e.g., .claude/rules/security.md]`
- `[e.g., The original task description from the issue/ticket]`

No agent may modify shared context files during execution.

---

## Independent Scopes

Each agent owns its scope exclusively. No two agents should analyze the same concern for the same file.

| Agent | Owns | Must NOT touch |
|-------|------|----------------|
| [e.g., `security-auditor`] | [e.g., Auth flows, input validation, secrets handling] | [e.g., Performance characteristics, style violations] |
| [e.g., `correctness-reviewer`] | [e.g., Business logic, error handling, edge cases] | [e.g., Security analysis, style] |
| [e.g., `performance-analyst`] | [e.g., Algorithmic complexity, I/O patterns, rendering cost] | [e.g., Security, correctness, style] |
| [e.g., `style-enforcer`] | [e.g., Naming, formatting, TypeScript conventions] | [e.g., Any substantive logic concerns] |

---

## Merge Protocol

The coordinator agent aggregates results using this structure:

```markdown
## Consolidated Review

### BLOCK — Must fix before merge
[All H-severity findings from all agents]

### REQUEST — Should fix before merge
[All M-severity findings from all agents]

### SUGGEST — Optional
[All L-severity / style findings]

### PRAISE
[Notable good patterns identified by any agent]

### Agent Confidence
| Agent | Confidence | Notes |
|-------|------------|-------|
| security-auditor | High/Medium/Low | [why] |
| correctness-reviewer | High/Medium/Low | [why] |
```

---

## Quality Gate

Before declaring the team mission complete, the coordinator verifies:

- [ ] Every agent produced output matching its Output Contract
- [ ] No disputed findings left unresolved
- [ ] All BLOCK findings are either confirmed real issues or explicitly dismissed with rationale
- [ ] Final report references at least one file:line citation per finding
- [ ] Report does not contain placeholder text from this template
