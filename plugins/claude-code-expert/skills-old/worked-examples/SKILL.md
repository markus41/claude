---
name: worked-examples
description: Step-by-step tutorials and worked examples for common Claude Code workflows — setup, debugging, code review, agent teams, hooks, memory, optimization, and CI/CD
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Agent
triggers:
  - tutorial
  - example
  - walkthrough
  - how to
  - getting started
  - show me how
  - step by step
  - learn
disable-model-invocation: true
---

# Worked Examples & Tutorials

Step-by-step walkthroughs of real Claude Code workflows. Each tutorial shows the exact commands, expected output, and decision points.

## Tutorial 1: Set Up Claude Code for a New Project

**Goal:** Configure Claude Code from scratch for a TypeScript/React project.

**Steps:**

1. **Generate starter CLAUDE.md**
```bash
/init
```
Claude analyzes your codebase and generates CLAUDE.md with build commands, test instructions, and detected conventions.

2. **Review and customize CLAUDE.md**
Open the generated file. Keep it under 200 lines. Focus on:
- Build/test commands: `pnpm install`, `pnpm test`, `npx tsc --noEmit`
- Coding standards: "Use 2-space indentation", "Prefer named exports"
- Architecture notes: "API routes in src/api/, components in src/components/"

3. **Create path-scoped rules**
```bash
mkdir -p .claude/rules
```
Create `code-style.md` with paths frontmatter for `**/*.ts`, `**/*.tsx`.
Create `testing.md` with paths frontmatter for `**/*.test.*`.

4. **Configure MCP servers**
```bash
/cc-mcp add context7    # Library documentation
/cc-mcp add perplexity  # Web research
```

5. **Set up hooks**
```bash
/cc-hooks create auto-format     # Format on file write
/cc-hooks create security-guard  # Block dangerous commands
```

6. **Validate configuration**
```bash
/cc-setup --audit
```
Check the audit score. Fix any warnings.

**Expected outcome:** Audit score > 80, all checks green.

---

## Tutorial 2: Build a Pre-Commit Security Hook

**Goal:** Create a hook that blocks commits containing secrets.

**Steps:**

1. **Create the hook script**
Create `.claude/hooks/scripts/secret-scanner.sh`:
```bash
#!/usr/bin/env bash
set -euo pipefail

input=$(cat)
tool_name=$(echo "$input" | jq -r '.tool_name // empty')

if [[ "$tool_name" != "Bash" ]]; then
  echo '{"decision":"passthrough"}'
  exit 0
fi

command=$(echo "$input" | jq -r '.tool_input.command // empty')

# Block git commits that might contain secrets
if echo "$command" | grep -qE 'git (add|commit)'; then
  # Check staged files for secret patterns
  if git diff --cached --name-only 2>/dev/null | xargs grep -lE '(API_KEY|SECRET|PASSWORD|TOKEN)=[^$]' 2>/dev/null; then
    echo '{"decision":"block","reason":"Staged files contain potential secrets. Remove them before committing."}'
    exit 0
  fi
fi

echo '{"decision":"passthrough"}'
```

2. **Make it executable**
```bash
chmod +x .claude/hooks/scripts/secret-scanner.sh
```

3. **Register in settings.json**
Add to `.claude/settings.json` under `hooks.PreToolUse`:
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "command": ".claude/hooks/scripts/secret-scanner.sh"
      }
    ]
  }
}
```

4. **Test the hook**
```bash
/cc-hooks test secret-scanner
```

**Expected outcome:** Hook blocks commits with hardcoded secrets, passes clean commits.

---

## Tutorial 3: Run a Multi-Agent Code Review

**Goal:** Review a PR using the council with expert-panel protocol.

**Steps:**

1. **Identify the review target**
```bash
/cc-council src/auth/ --preset security --depth deep
```

2. **Observe the council process**
The council spawns multiple expert agents:
- Security specialist examines auth patterns
- Quality reviewer checks error handling
- Performance analyst reviews efficiency

3. **Read the scoring output**
Each scope gets an independent score:
```
Security:    7.2/10 (2 HIGH, 1 MEDIUM findings)
Quality:     8.5/10 (1 MEDIUM finding)
Performance: 9.1/10 (no significant findings)
```

4. **Address findings**
Start with HIGH severity findings. Fix them, then re-run:
```bash
/cc-council src/auth/ --preset security --changed-only
```

5. **Get final verdict**
Once all HIGH findings are resolved, the council issues APPROVE or APPROVE_WITH_CONDITIONS.

**Expected outcome:** Security findings identified and resolved, final score > 8.0.

---

## Tutorial 4: Create a Custom Research Agent

**Goal:** Build a specialized agent for researching library APIs.

**Steps:**

1. **Define the agent**
```bash
/cc-agent create library-researcher
```

2. **Configure the agent file**
In `.claude/agents/library-researcher.md`:
```yaml
---
name: library-researcher
description: Researches library APIs and produces usage guides
model: claude-haiku-4-5-20251001
tools:
  - Read
  - Grep
  - Glob
  - WebFetch
---
```

3. **Write the system prompt**
Define: role, mandatory workflow, output format.
The agent should:
- Accept a library name
- Search for official documentation using Context7
- Extract key APIs, patterns, and gotchas
- Return a concise summary

4. **Use the agent**
Invoke in conversation:
```
Use the library-researcher agent to research the latest Prisma ORM query patterns
```

**Expected outcome:** Agent returns a focused summary of Prisma query patterns with code examples.

---

## Tutorial 5: Optimize a Context-Limited Session

**Goal:** Complete a large task without hitting context limits.

**Steps:**

1. **Check current budget**
```bash
/cc-budget audit
```
See how much context is consumed by CLAUDE.md, rules, skills, MCP schemas.

2. **Plan the session**
If working budget < 100k tokens:
- Disconnect unused MCP servers: `/mcp`
- Disable non-essential skills
- Use subagents for research

3. **Delegate research**
```
Research the auth module architecture using a Haiku subagent
```
The subagent explores files in its own context, returns only a summary.

4. **Compact proactively**
At 70% context utilization:
```bash
/compact Focus on the auth refactor: keep the API contract changes, test plan, and file paths
```

5. **Switch models as needed**
```bash
/model claude-haiku-4-5-20251001   # For file searches
/model claude-sonnet-4-6            # For implementation
```

6. **Monitor costs**
```bash
/cost
/cc-perf tips
```

**Expected outcome:** Complex task completed within budget, no auto-compact interruptions.

---

## Tutorial 6: Debug Recurring Mistakes with Self-Healing

**Goal:** Stop Claude from repeating the same error across sessions.

**Steps:**

1. **Check existing lessons**
```bash
# Review current lessons-learned.md
/cc-help lessons-learned
```

2. **When an error occurs**
The PostToolUseFailure hook automatically captures it:
```
### Error: Read failure
- Tool: Read
- Input: /path/to/directory
- Error: EISDIR: illegal operation on a directory
- Status: NEEDS_FIX
```

3. **Fix and document**
After fixing the issue, update the lesson:
```
- Status: RESOLVED
- Fix: Use `ls` or `Glob` for directories, `Read` for files only
- Prevention: Always check if path is a file before using Read tool
```

4. **Promote patterns to rules**
If the same error appears 3+ times:
Create a new rule in `.claude/rules/` with the prevention strategy.

5. **Verify in next session**
The fix is loaded as a rule. Claude reads it and avoids the mistake.

**Expected outcome:** Error never recurs. Lessons-learned.md grows into a project-specific knowledge base.

---

## Tutorial 7: Set Up Persistent Memory

**Goal:** Configure the three-tier memory system for cross-session learning.

**Steps:**

1. **Tier 1: CLAUDE.md and Rules**
Already set up in Tutorial 1. These are your explicit, team-shared instructions.

2. **Tier 2: Auto Memory**
Enable in settings (on by default since v2.1.59):
```json
{ "autoMemoryEnabled": true }
```
Claude automatically saves useful findings to `~/.claude/projects/<project>/memory/`.

3. **Tell Claude to remember things**
```
Remember that the API tests require a local Redis instance on port 6380
```
Claude saves this to auto memory. Next session, it knows.

4. **Review auto memory**
```bash
/memory
```
Browse saved memories. Edit or delete as needed.

5. **Tier 3: MCP-Backed Memory (Optional)**
For semantic search across memories, add an MCP memory server:
```bash
/cc-mcp add memory
```

6. **Verify persistence**
Start a new session. Ask about Redis. Claude should recall the port without prompting.

**Expected outcome:** Knowledge persists across sessions. Build commands, preferences, and project quirks are remembered.

---

## Tutorial 8: Automate PR Review in GitHub Actions

**Goal:** Set up Claude Code as an automated PR reviewer in CI.

**Steps:**

1. **Generate the workflow**
```bash
/cc-cicd generate github-actions --template pr-review
```

2. **Review the generated workflow**
`.github/workflows/claude-review.yml`:
```yaml
name: Claude Code Review
on:
  pull_request:
    types: [opened, synchronize]

jobs:
  review:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
      - uses: anthropics/claude-code-action@v1
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
          model: claude-haiku-4-5-20251001
          prompt: |
            Review this PR for security issues, code quality, and test coverage.
            Focus on: input validation, error handling, and edge cases.
            Output a structured review with severity ratings.
```

3. **Add secrets**
In GitHub repo settings → Secrets → Add `ANTHROPIC_API_KEY`.

4. **Test with a PR**
Create a test PR. The action runs and posts review comments.

5. **Tune the prompt**
Adjust the review prompt based on results. Add project-specific guidance.

**Expected outcome:** Every PR gets an automated Claude review within minutes.

---

## Quick Reference

| Tutorial | Topic | Difficulty | Time |
|----------|-------|------------|------|
| 1 | Project setup | Beginner | 10 min |
| 2 | Security hooks | Intermediate | 15 min |
| 3 | Code review council | Intermediate | 10 min |
| 4 | Custom agents | Intermediate | 15 min |
| 5 | Context optimization | Advanced | 20 min |
| 6 | Self-healing | Intermediate | 10 min |
| 7 | Persistent memory | Beginner | 10 min |
| 8 | CI/CD integration | Advanced | 20 min |
