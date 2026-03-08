# fullstack-iac Context Summary

## Plugin purpose
Zenith (Forerunner) - Complete full-stack development and infrastructure automation. FastAPI, React/Vite, Ansible, Terraform, Kubernetes with production-ready templates and CI/CD pipelines.

## Command index
- `commands/ansible.md`
- `commands/api.md`
- `commands/docker.md`
- `commands/frontend.md`
- `commands/infra.md`
- `commands/k8s.md`
- `commands/monorepo.md`
- `commands/new.md`

## Agent index
- `agents/api-architect.md`
- `agents/frontend-builder.md`

## Skill index
- `skills/fastapi-patterns/SKILL.md`
- `skills/react-vite/SKILL.md`

## When-to-load guidance
- Load this summary first for routing, scope checks, and high-level capability matching.
- Open specific command/agent files only when the user asks for those workflows.
- Defer `skills/**` and long `README.md` documents until implementation details are needed.

## When to open deeper docs
Use this table to decide when to move beyond this summary.

| Signal | Open docs | Why |
| --- | --- | --- |
| You need setup, install, or execution details | `README.md`, `INSTALLATION.md`, or setup guides | Captures exact commands and prerequisites. |
| You are changing implementation behavior | `CONTEXT.md` and relevant source folders | Contains architecture, conventions, and deeper implementation context. |
| You are validating security, compliance, or rollout risk | `SECURITY*.md`, workstream/review docs | Provides controls, risk notes, and release constraints. |
| The summary omits edge cases you need | Any referenced deep-dive docs linked above | Ensures decisions are based on complete plugin-specific details. |

