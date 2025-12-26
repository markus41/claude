---
name: jira:work
description: Start working on a Jira issue with full 7-phase orchestration workflow including 5 quality gates. Use this when the user says "work on issue", "start JIRA-123", "work on PROJ-456", or wants to begin development on a Jira ticket with automated orchestration and quality enforcement.
version: 4.2.0
qualityGatesIntegration: code-quality-orchestrator
agentOrchestration: true
minSubAgents: 3
maxSubAgents: 13
---

# Jira Work Orchestration

Start working on a Jira issue with the full 7-phase development workflow: EXPLORE -> PLAN -> CODE -> TEST -> QUALITY GATES -> FIX -> COMMIT

**Quality Gates Integration:** This workflow is integrated with the Code Quality Orchestrator (Curator) plugin to enforce 5 quality gates before code can be committed.

## When to Use This Skill

Activate this skill when:
- User wants to work on a Jira issue (e.g., "work on LF-123")
- User mentions starting development on a ticket
- User references a Jira issue key with intent to implement
- User asks to "begin", "start", or "work on" a Jira issue

## Command Reference

The main command file is located at: `jira-orchestrator/commands/work.md`

## Usage

```
/jira:work <issue-key>
```

### Examples
- `/jira:work LF-27` - Start working on issue LF-27
- `/jira:work PROJ-123` - Start working on issue PROJ-123

---

## Agent Orchestration Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    JIRA WORK ORCHESTRATOR (Arbiter)                      │
│                         Master Controller                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐             │
│  │ PHASE 1  │──▶│ PHASE 2  │──▶│ PHASE 3  │──▶│ PHASE 4  │             │
│  │ EXPLORE  │   │  PLAN    │   │  CODE    │   │  TEST    │             │
│  │ 2 agents │   │ 2 agents │   │ 4 agents │   │ 3 agents │             │
│  └──────────┘   └──────────┘   └──────────┘   └──────────┘             │
│       │              │              │              │                    │
│       ▼              ▼              ▼              ▼                    │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                    PHASE 5: QUALITY GATES                        │   │
│  │              Code Quality Orchestrator (Curator)                 │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐        │   │
│  │  │ Static │ │Coverage│ │Security│ │Complex │ │  Deps  │        │   │
│  │  │Analysis│ │Enforcer│ │Scanner │ │Analyzer│ │ Health │        │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘        │   │
│  │        ↓         ↓         ↓          ↓          ↓              │   │
│  │              [GATE RESULTS AGGREGATOR]                          │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                              │                                          │
│                     ┌────────┴────────┐                                │
│                     ▼                  ▼                               │
│               ┌──────────┐       ┌──────────┐                         │
│               │ PHASE 6  │       │ PHASE 7  │                         │
│               │   FIX    │──────▶│  COMMIT  │                         │
│               │ 2 agents │       │ 2 agents │                         │
│               └──────────┘       └──────────┘                         │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Workflow Phases with Agent Spawning

### Phase 1: EXPLORE (2+ agents)
**Spawn Pattern:** Parallel execution

```typescript
// Use Task tool to spawn explore agents in parallel
Task({
  subagent_type: "Explore",
  model: "haiku",
  prompt: `Analyze Jira issue ${issueKey}:
    1. Fetch issue details, description, acceptance criteria
    2. Identify affected codebase areas using Grep/Glob
    3. Map component dependencies
    4. Document findings for PLAN phase`
});

Task({
  subagent_type: "Explore",
  model: "haiku",
  prompt: `Research technical context for ${issueKey}:
    1. Find related code patterns in codebase
    2. Check for existing tests covering the area
    3. Identify potential impact on other components`
});
```

**Agent Communication:** Results aggregated via structured JSON output.

### Phase 2: PLAN (1-2 agents)
**Spawn Pattern:** Sequential (depends on EXPLORE results)

```typescript
Task({
  subagent_type: "Plan",
  model: "sonnet",
  prompt: `Create implementation plan for ${issueKey}:
    Context: ${exploreResults}

    1. Design solution architecture
    2. Break into subtasks with dependencies
    3. Define test scenarios
    4. Estimate complexity per subtask
    5. Create execution DAG

    Output: Structured plan with task dependencies`
});
```

### Phase 3: CODE (2-4 agents)
**Spawn Pattern:** Parallel DAG execution

```typescript
// Spawn multiple coding agents for parallel subtasks
const codingTasks = planResult.subtasks.map(subtask =>
  Task({
    subagent_type: "general-purpose",
    model: "sonnet",
    prompt: `Implement subtask: ${subtask.description}
      Files to modify: ${subtask.files}
      Dependencies: ${subtask.dependencies}

      Follow coding standards and add inline documentation.
      Output: List of files modified with summary.`
  })
);

// Execute in parallel where dependencies allow
await Promise.all(codingTasks);
```

### Phase 4: TEST (2-3 agents)
**Spawn Pattern:** Parallel test runners

```typescript
// Spawn test agents in parallel
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Run unit tests: npm test / pytest"
});

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Run integration tests and validate acceptance criteria"
});

Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: "Run initial security scan on changed files"
});
```

### Phase 5: QUALITY GATES (5 gates via Curator)
**Spawn Pattern:** Parallel gate execution with aggregation

```typescript
// Spawn Quality Gate agents in parallel (via Curator orchestrator)
const qualityGates = [
  Task({
    subagent_type: "general-purpose",
    model: "haiku",
    prompt: `Run Static Analysis Gate:
      1. Execute ESLint with --fix
      2. Run Prettier formatting
      3. Report errors/warnings
      Output: { passed: boolean, score: number, issues: Issue[] }`
  }),

  Task({
    subagent_type: "general-purpose",
    model: "haiku",
    prompt: `Run Test Coverage Gate:
      1. Execute tests with coverage
      2. Check against 80% threshold
      3. Identify coverage gaps
      Output: { passed: boolean, coverage: number, gaps: File[] }`
  }),

  Task({
    subagent_type: "general-purpose",
    model: "sonnet",
    prompt: `Run Security Scanner Gate:
      1. Check for exposed secrets (gitleaks)
      2. Scan dependencies (npm audit)
      3. Run SAST analysis
      Output: { passed: boolean, vulnerabilities: Vuln[] }`
  }),

  Task({
    subagent_type: "general-purpose",
    model: "haiku",
    prompt: `Run Complexity Analyzer Gate:
      1. Measure cyclomatic complexity (max: 10)
      2. Measure cognitive complexity (max: 15)
      3. Check function/file lengths
      Output: { passed: boolean, violations: Violation[] }`
  }),

  Task({
    subagent_type: "general-purpose",
    model: "haiku",
    prompt: `Run Dependency Health Gate:
      1. Check for outdated packages
      2. Scan for vulnerable dependencies
      3. Verify license compliance
      Output: { passed: boolean, outdated: Pkg[], vulnerable: Pkg[] }`
  })
];

// Execute all gates in parallel
const gateResults = await Promise.all(qualityGates);

// Aggregate results
const allPassed = gateResults.every(r => r.passed);
const qualityScore = gateResults.reduce((sum, r) => sum + r.score, 0) / 5;
```

**Gate Results Aggregation:**
```json
{
  "phase": "QUALITY_GATES",
  "timestamp": "2025-12-26T12:00:00Z",
  "allPassed": true,
  "qualityScore": 87,
  "gates": {
    "staticAnalysis": { "passed": true, "score": 95 },
    "testCoverage": { "passed": true, "score": 82 },
    "securityScanner": { "passed": true, "score": 90 },
    "complexityAnalyzer": { "passed": true, "score": 78 },
    "dependencyHealth": { "passed": false, "score": 70 }
  },
  "blockers": [],
  "warnings": ["5 outdated dependencies"]
}
```

### Phase 6: FIX (1-2 agents)
**Spawn Pattern:** Conditional on failures

```typescript
if (!gateResults.allPassed) {
  // Spawn fix agents for each failed gate
  const fixTasks = gateResults
    .filter(g => !g.passed)
    .map(gate =>
      Task({
        subagent_type: "general-purpose",
        model: "sonnet",
        prompt: `Fix ${gate.name} violations:
          Issues: ${JSON.stringify(gate.issues)}

          1. Apply automatic fixes where possible
          2. Refactor complex code
          3. Add missing tests
          4. Update dependencies

          Output: Summary of fixes applied`
      })
    );

  await Promise.all(fixTasks);

  // Re-run quality gates after fixes
  await runQualityGates();
}
```

### Phase 7: COMMIT (1-2 agents)
**Spawn Pattern:** Sequential with verification

```typescript
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: `Create commit for ${issueKey}:
    1. Stage all changes: git add .
    2. Create smart commit: git commit -m "${issueKey}: ${summary}"
    3. Push to feature branch
    4. Verify push successful

    Output: { branch: string, commitSha: string, pushed: boolean }`
});

Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: `Create pull request for ${issueKey}:
    1. Use gh pr create with Jira link
    2. Add quality score to PR description
    3. Request reviewers
    4. Link PR back to Jira issue

    Output: { prUrl: string, linked: boolean }`
});
```

---

## Subagent Communication Protocol

### Message Format
```typescript
interface AgentMessage {
  id: string;
  from: string;        // Agent identifier
  to: string;          // Target agent or "orchestrator"
  phase: string;       // Current workflow phase
  type: "result" | "request" | "error" | "status";
  payload: any;
  timestamp: string;
}
```

### Result Handoff Pattern
```typescript
// Phase N agent completes and reports
const phaseResult = {
  phase: "CODE",
  status: "complete",
  artifacts: {
    filesModified: ["src/api/handler.ts", "src/utils/parser.ts"],
    linesAdded: 245,
    linesRemoved: 12
  },
  nextPhaseInput: {
    filesToTest: ["src/api/handler.ts"],
    coverageTargets: ["handler", "parser"]
  }
};

// Orchestrator receives and forwards to Phase N+1
orchestrator.handoff("TEST", phaseResult.nextPhaseInput);
```

### Error Escalation
```typescript
// Agent encounters blocking error
if (error.severity === "critical") {
  return {
    type: "error",
    escalate: true,
    message: "Security vulnerability detected - blocking commit",
    requiresHumanReview: true
  };
}
```

---

## Agent Registry (Used in Workflow)

| Phase | Agent Type | Model | Count |
|-------|------------|-------|-------|
| EXPLORE | Explore | haiku | 2 |
| PLAN | Plan | sonnet | 1-2 |
| CODE | general-purpose | sonnet | 2-4 |
| TEST | general-purpose | haiku | 2-3 |
| QUALITY | static-analysis-agent | haiku | 1 |
| QUALITY | test-coverage-agent | sonnet | 1 |
| QUALITY | security-scanner-agent | sonnet | 1 |
| QUALITY | complexity-analyzer-agent | haiku | 1 |
| QUALITY | dependency-health-agent | haiku | 1 |
| FIX | general-purpose | sonnet | 1-2 |
| COMMIT | general-purpose | haiku | 1-2 |

**Total Agents per Run:** 13-18 (depending on fixes needed)

## Jira Integration

This command automatically:
- Transitions issue to "In Progress"
- Adds progress comments
- Logs work time
- Creates smart commits
- Links PRs to issues

---

## Confluence Integration (Advanced)

The workflow integrates with Confluence for documentation:

### Auto-Generated Documentation

```typescript
// After successful commit, generate Confluence page
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: `Create Confluence documentation for ${issueKey}:
    1. Generate technical design document
    2. Document API changes (if any)
    3. Create/update runbook entries
    4. Add architecture diagrams (mermaid)

    Use mcp__MCP_DOCKER__confluence_create_page`
});
```

### Confluence Features Used

| Feature | Purpose | Trigger |
|---------|---------|---------|
| **Page Creation** | Auto-create tech docs | After COMMIT phase |
| **Page Update** | Update existing docs | If page exists |
| **Search** | Find related docs in EXPLORE | mcp__MCP_DOCKER__confluence_search |
| **Attachment** | Quality reports, diagrams | After QUALITY phase |
| **Labels** | Categorize documentation | Auto-tagged |
| **Macro Insertion** | Jira issue embed, code blocks | Tech docs |

### Documentation Templates

```typescript
// Technical Design Document Template
const techDocTemplate = {
  title: `[${issueKey}] Technical Design - ${summary}`,
  space: projectSpace,
  labels: ["tech-doc", "auto-generated", projectKey],
  sections: [
    "Overview", "Problem Statement", "Solution Architecture",
    "API Changes", "Database Changes", "Testing Strategy",
    "Quality Metrics", "Deployment Notes"
  ]
};
```

### Confluence Search in EXPLORE Phase

```typescript
// Search for related documentation
Task({
  subagent_type: "Explore",
  model: "haiku",
  prompt: `Search Confluence for context:
    Use mcp__MCP_DOCKER__confluence_search with query "${issueKey} OR ${component}"
    1. Find related architecture docs
    2. Locate existing runbooks
    3. Check for similar implementations
    4. Gather ADRs (Architecture Decision Records)`
});
```

---

## GitHub Integration (Advanced)

The workflow integrates deeply with GitHub:

### Branch Strategy

```typescript
// Create feature branch with Jira issue key
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: `Create feature branch:
    git checkout -b feature/${issueKey.toLowerCase()}-${slugify(summary)}
    git push -u origin feature/${issueKey}-description`
});
```

### Pull Request Features

```typescript
// Create PR with full quality integration
Task({
  subagent_type: "general-purpose",
  model: "sonnet",
  prompt: `Create comprehensive PR for ${issueKey}:

    1. Create PR: gh pr create --title "${issueKey}: ${summary}"
    2. Add quality report to description
    3. Add labels: gh pr edit --add-label "quality-passed"
    4. Request reviewers: gh pr edit --add-reviewer "@team/code-owners"
    5. Link to Jira in description
    6. Post status check via gh api`
});
```

### GitHub Features Used

| Feature | Purpose | Command |
|---------|---------|---------|
| **Branch Creation** | Feature branches | git checkout -b |
| **PR Creation** | With quality report | gh pr create |
| **Status Checks** | Quality gate status | gh api /statuses |
| **Labels** | Categorize PRs | gh pr edit --add-label |
| **Reviewers** | Auto-assign | gh pr edit --add-reviewer |
| **Projects** | Track in board | gh project item-add |
| **Actions** | Trigger workflows | gh workflow run |
| **Releases** | Auto-generate notes | gh release create |

### GitHub Actions Integration

```typescript
// Trigger quality workflow on PR
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: `Trigger GitHub Actions workflow:
    gh workflow run quality-gates.yml \\
      --ref feature/${issueKey} \\
      -f issue_key=${issueKey}`
});
```

### PR Description with Quality Report

```markdown
## Summary
${summary}

**Jira Issue:** [${issueKey}](https://jira.company.com/browse/${issueKey})

## Quality Report
| Gate | Score | Status |
|------|-------|--------|
| Static Analysis | ${staticScore} | ${staticStatus} |
| Test Coverage | ${coverage}% | ${coverageStatus} |
| Security | ${securityScore} | ${securityStatus} |
| Complexity | ${complexityScore} | ${complexityStatus} |
| Dependencies | ${depsScore} | ${depsStatus} |

**Overall:** ${qualityScore}/100 (Grade: ${grade})

## Confluence Docs
- [Technical Design](${confluenceLink})
```

### GitHub Commit Status API

```typescript
// Post quality results as commit status
Task({
  subagent_type: "general-purpose",
  model: "haiku",
  prompt: `Update GitHub commit status:
    gh api --method POST /repos/{owner}/{repo}/statuses/{sha} \\
      -f state="${allPassed ? 'success' : 'failure'}" \\
      -f description="Quality Score: ${qualityScore}/100" \\
      -f context="quality-gates/curator"`
});
```

---

## Full Workflow Integration Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         JIRA WORK ORCHESTRATOR v4.2.0                        │
│              Integrated with Confluence, GitHub, and Curator                 │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌───────────┐                                                               │
│  │   JIRA    │◀──────────────────────────────────────────────────────────┐  │
│  │  Arbiter  │                                                            │  │
│  └─────┬─────┘                                                            │  │
│        │                                                                   │  │
│        ▼                                                                   │  │
│  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  PHASE 1: EXPLORE                                                  │   │  │
│  │  ┌──────────┐    ┌──────────────┐    ┌──────────────┐            │   │  │
│  │  │ Jira API │    │  Confluence  │    │   Codebase   │            │   │  │
│  │  │  Fetch   │    │   Search     │    │   Analysis   │            │   │  │
│  │  └──────────┘    └──────────────┘    └──────────────┘            │   │  │
│  └───────────────────────────────────────────────────────────────────┘   │  │
│        │                                                                   │  │
│        ▼                                                                   │  │
│  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  PHASE 2-4: PLAN → CODE → TEST                                    │   │  │
│  └───────────────────────────────────────────────────────────────────┘   │  │
│        │                                                                   │  │
│        ▼                                                                   │  │
│  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  PHASE 5: QUALITY GATES (Curator)                                 │   │  │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐         │   │  │
│  │  │ Static │ │Coverage│ │Security│ │Complex │ │  Deps  │         │   │  │
│  │  └────────┘ └────────┘ └────────┘ └────────┘ └────────┘         │   │  │
│  └───────────────────────────────────────────────────────────────────┘   │  │
│        │                                                                   │  │
│        ▼                                                                   │  │
│  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  PHASE 6-7: FIX → COMMIT                                          │   │  │
│  │  ┌──────────────┐    ┌───────────────────────────────────────┐   │   │  │
│  │  │  Auto-Fix    │    │          GitHub Integration           │   │   │  │
│  │  │   Agent      │───▶│  Branch → Commit → PR → Status Check  │   │   │  │
│  │  └──────────────┘    └───────────────────────────────────────┘   │   │  │
│  └───────────────────────────────────────────────────────────────────┘   │  │
│        │                                                                   │  │
│        ▼                                                                   │  │
│  ┌───────────────────────────────────────────────────────────────────┐   │  │
│  │  POST-COMMIT: Documentation                                        │───┘  │
│  │  ┌──────────────────┐    ┌──────────────────┐                     │      │
│  │  │    Confluence    │    │      Jira        │                     │      │
│  │  │  - Tech Docs     │    │  - Comment       │                     │      │
│  │  │  - Runbooks      │    │  - Link PR       │                     │      │
│  │  └──────────────────┘    └──────────────────┘                     │      │
│  └───────────────────────────────────────────────────────────────────┘      │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Related Commands

### Jira Commands
- `/jira:status` - Check current work session status
- `/jira:sync` - Sync changes with Jira
- `/jira:pr` - Create pull request
- `/jira:commit` - Create smart commit

### Confluence Commands
- `/confluence-publish` - Publish tech doc to Confluence
- `/atlassian-sync` - Sync with Jira/Confluence

### GitHub Commands
- Create PR with quality report via gh cli
- Update commit status via gh api
- Trigger workflows via gh workflow run

### Quality Gate Commands (from Curator)
- `/quality-check` - Run all 5 quality gates
- `/quality-fix` - Auto-fix issues where possible
- `/coverage-check` - Check test coverage (80% min)
- `/security-scan` - Run security vulnerability scan
- `/complexity-audit` - Check code complexity
- `/dependency-audit` - Check dependency health

## Quality Gate Thresholds

| Gate | Metric | Threshold |
|------|--------|-----------|
| Static Analysis | Errors | 0 |
| Test Coverage | Line Coverage | ≥ 80% |
| Security Scanner | Critical/High CVEs | 0 |
| Complexity | Cyclomatic | ≤ 10 |
| Complexity | Cognitive | ≤ 15 |
| Dependencies | Critical Vulns | 0 |
