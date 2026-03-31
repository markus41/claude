# Project Overview

## What

**Neural Orchestration Platform (Golden Armada)** is a plugin-based AI orchestration
platform with a visual workflow builder. It coordinates 137 agents, 54 skills, and
100+ slash commands across 19 domain plugins.

## Package

- **Name:** `@accos/frontend` v1.0.0
- **Type:** Private, ES module

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 18, TypeScript 5.3 strict |
| Bundler | Vite 5 |
| State | Zustand 4.5, TanStack Query 5 |
| Styling | Tailwind CSS 3.4, class-variance-authority |
| Animation | Framer Motion 11 |
| Visual Builder | ReactFlow 11 |
| Forms | React Hook Form 7, Zod 3 |
| Editor | Monaco Editor |
| Realtime | Socket.io Client 4 |
| Testing | Vitest 1.2, Playwright 1.40, Testing Library |
| CI | GitHub Actions (12 workflows) |

## Repository Structure

```
src/           Frontend source (components, hooks, stores, types, utils, workflows, lib)
plugins/       19 installed domain plugins (each with .claude-plugin/plugin.json)
.claude/       Platform config: rules, skills, agents, hooks, MCP servers, registry
.github/       CI workflows and Jira integrations
docs/          Architecture docs, planning, governance, testing, security
scripts/       Build-time validation and generation scripts
```

## MCP Servers (7)

perplexity, firecrawl, deploy-intelligence, lessons-learned,
project-metrics, code-quality-gate, workflow-bridge

## Zustand Stores

- `workflowStore` -- workflow graph state
- `paletteStore` -- node palette / drag-and-drop

## Non-Goals

<!-- Fill in: List things this platform explicitly does NOT try to do -->

## Team

<!-- Fill in: Maintainers, contributors, communication channels -->
