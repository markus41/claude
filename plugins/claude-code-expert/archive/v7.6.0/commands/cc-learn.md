---
name: cc-learn
intent: Browse and run interactive tutorials that demonstrate Claude Code workflows step-by-step
tags:
  - claude-code-expert
  - command
  - tutorials
  - learning
  - onboarding
arguments:
  - name: tutorial
    description: Name of the tutorial to start, or omit to list all available tutorials
    required: false
    type: string
flags:
  - name: topic
    description: Filter tutorials by topic
    type: choice
    choices: [setup, hooks, review, agents, optimization, debugging, memory, ci-cd]
  - name: difficulty
    description: Filter by difficulty level
    type: choice
    choices: [beginner, intermediate, advanced]
  - name: list
    description: Just list tutorials without starting one
    type: boolean
    default: false
risk: low
cost: low
---

# /cc-learn — Interactive Tutorial Runner

Use `/cc-learn` to browse and follow step-by-step tutorials for common Claude Code workflows.

## What it does

Provides guided, hands-on tutorials that walk you through real Claude Code workflows with concrete commands and expected outputs.

## Usage

```bash
/cc-learn                          # List all tutorials
/cc-learn setup                    # Start the project setup tutorial
/cc-learn hooks                    # Start the hooks tutorial
/cc-learn --topic review           # List review tutorials
/cc-learn --difficulty beginner    # List beginner tutorials
```

## Available tutorials

| Name | Topic | Difficulty | Description |
|------|-------|------------|-------------|
| `setup` | setup | Beginner | Configure Claude Code for a new project from scratch |
| `hooks` | hooks | Intermediate | Build a pre-commit security hook end-to-end |
| `review` | review | Intermediate | Run a multi-agent code review with council |
| `agents` | agents | Intermediate | Create a custom research agent |
| `optimize` | optimization | Advanced | Complete a large task within context limits |
| `self-healing` | debugging | Intermediate | Debug recurring mistakes with the self-healing system |
| `memory` | memory | Beginner | Set up persistent memory across sessions |
| `ci-cd` | ci-cd | Advanced | Automate PR review with GitHub Actions |

## Operating protocol

### Phase 1 — Select tutorial
If no tutorial specified:
- Show the available tutorials table
- Ask user to pick one

### Phase 2 — Load tutorial content
Load the `worked-examples` skill and navigate to the selected tutorial section.

### Phase 3 — Guide interactively
Walk the user through each step:
1. Explain what the step does and why
2. Show the command or action
3. Wait for user to execute
4. Verify the result
5. Move to next step

### Phase 4 — Summary
After completing the tutorial:
- Recap what was configured
- Suggest related tutorials or commands
- Point to relevant skills for deeper learning
