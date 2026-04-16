---
description: Interview-driven project setup that generates complete Claude Code configuration
model: opus
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# Project Setup Skill

This skill conducts a thorough, interactive interview with the user to understand their
project deeply, then generates a tailored Claude Code configuration.

## Core Philosophy

**The interview IS the product.** The generated configuration is only as good as the
understanding gained during the interview. Rush the interview → mediocre config.

## Interview Protocol

1. **One question at a time** — never batch questions
2. **No dates or timelines** — unless the user specifically asks
3. **Adapt dynamically** — each answer spawns new questions
4. **Minimum 15 questions** — but don't count, just be thorough
5. **Confirm understanding** — summarize periodically
6. **End with synthesis** — present full understanding, ask what was missed

## Coverage Areas

- Project identity and purpose
- Tech stack and architecture decisions
- Team structure and development workflow
- Testing philosophy and quality expectations
- Security and compliance needs
- Deployment and infrastructure
- Domain concepts, entities, business rules
- Code conventions and standards
- Current pain points and tooling gaps
- Goals and priorities (NOT timelines)

## Output Structure

After interview completion, generate the full `.claude/` and `docs/context/` structure
as described in `/scrapin-setup` command.
