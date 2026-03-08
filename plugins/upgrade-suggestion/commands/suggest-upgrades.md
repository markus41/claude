---
name: suggest-upgrades
intent: Suggest 3 high-quality upgrades for the current project or recent changes
tags:
  - upgrade-suggestion
  - command
  - spark
  - improvements
inputs:
  - name: scope
    description: "What to analyze: 'project' (whole repo), 'recent' (recent changes), or a file/directory path"
    required: false
    default: "recent"
  - name: focus
    description: "Focus area: 'any', 'performance', 'ux', 'security', 'architecture', 'dx'"
    required: false
    default: "any"
risk: low
cost: low
description: >
  Analyzes your project (or recent changes) and suggests exactly 3 high-quality
  upgrades, inspired by GitHub Spark's suggestion feature. Each suggestion is
  actionable, specific to your codebase, and ranked by impact.
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
  - Agent
---

# Suggest Upgrades

Analyze the current project and suggest **exactly 3 high-quality upgrades** — like
GitHub Spark's `create_suggestions` feature. Each upgrade is concrete, actionable,
and tailored to your actual codebase.

## Usage

```bash
/suggest-upgrades                      # Analyze recent changes
/suggest-upgrades --scope project      # Analyze whole project
/suggest-upgrades --scope src/api/     # Analyze specific path
/suggest-upgrades --focus performance  # Focus on perf upgrades
/suggest-upgrades --focus security     # Focus on security
```

## How It Works

1. **Scan** — Gather context about the project or recent changes
2. **Analyze** — Identify improvement opportunities across multiple dimensions
3. **Rank** — Score each opportunity by impact, effort, and relevance
4. **Present** — Output exactly 3 suggestions in a structured, actionable format

## Analysis Dimensions

| Dimension | What it looks for |
|-----------|-------------------|
| Performance | N+1 queries, missing indexes, unoptimized renders, bundle size |
| UX/UI | Accessibility gaps, loading states, error handling, responsiveness |
| Security | Input validation, auth gaps, dependency vulnerabilities, secrets |
| Architecture | Coupling, missing abstractions, dead code, test coverage gaps |
| DX | Missing types, unclear APIs, missing docs, CI/CD improvements |
| Features | Natural extensions of existing functionality |

## Execution Steps

### Step 1: Determine Scope

Based on the `--scope` argument:

- **`recent`** (default): Run `git diff HEAD~5 --stat` and `git log --oneline -10`
  to identify recently changed files. Read the most-changed files.
- **`project`**: Use `Glob` to find key files (`package.json`, `tsconfig.json`,
  `Dockerfile`, `src/**/*.ts`, `src/**/*.tsx`). Read project config and sample
  source files. Use code health metrics if available.
- **Path**: Read files at the specified path and nearby related files.

### Step 2: Gather Signals

For each file in scope, look for:

```
- TODO/FIXME/HACK comments
- Functions longer than 50 lines
- Files with no test coverage (check for corresponding .test.* or .spec.*)
- Repeated patterns that could be abstracted
- Missing error handling (try/catch, .catch(), error boundaries)
- Hardcoded values that should be configurable
- Missing TypeScript types (any, unknown, untyped params)
- Outdated dependencies (check package.json)
- Missing accessibility attributes (aria-*, role, alt)
- Console.log statements left in production code
- Large file sizes (>300 lines)
```

### Step 3: Score and Rank

For each potential upgrade, calculate:

| Factor | Weight | Scale |
|--------|--------|-------|
| Impact | 40% | How much does this improve the project? (1-10) |
| Effort | 30% | How easy is it to implement? (1-10, higher = easier) |
| Relevance | 30% | How related is it to current work? (1-10) |

Select the top 3 by composite score.

### Step 4: Present Suggestions

Output exactly 3 suggestions in this format:

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   ✨ 3 Suggested Upgrades
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  1️⃣  [Short, action-oriented title]
      Category:  Performance | UX | Security | Architecture | DX | Feature
      Impact:    ████████░░ 8/10
      Effort:    ██████░░░░ 6/10
      Files:     src/api/handler.ts, src/utils/cache.ts

      [2-3 sentence description of what to do and why it matters.
       Be specific — reference actual files, functions, and patterns
       found in the codebase.]

  ─────────────────────────────────────────────────────────────

  2️⃣  [Short, action-oriented title]
      Category:  ...
      Impact:    ...
      Effort:    ...
      Files:     ...

      [Description...]

  ─────────────────────────────────────────────────────────────

  3️⃣  [Short, action-oriented title]
      Category:  ...
      Impact:    ...
      Effort:    ...
      Files:     ...

      [Description...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Pick one: "Implement upgrade 1", "Implement upgrade 2",
            or "Implement upgrade 3"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

### Step 5: Offer to Implement

After presenting suggestions, use the `AskUserQuestion` tool to let the user
pick which upgrade to implement (or skip). If they select one, proceed to
implement it immediately.

## Quality Rules

- **Be specific**: Reference actual files, functions, and line numbers from the codebase
- **Be actionable**: Each suggestion must be implementable in a single session
- **Be diverse**: Don't suggest 3 things in the same category — spread across dimensions
- **Be honest**: Don't invent problems. If the code is clean, say so and suggest features instead
- **No fluff**: Skip generic advice like "add more tests" — say which functions need tests and why
- **Exactly 3**: Always suggest exactly 3. No more, no less. Like GitHub Spark.

## See Also

- `/simplify` — Review changed code for reuse, quality, and efficiency
- `/review` — Full code review
- `/quick-fix` — Rapid issue identification
