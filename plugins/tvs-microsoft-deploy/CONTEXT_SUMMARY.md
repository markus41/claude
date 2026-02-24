# tvs-microsoft-deploy Context Summary

## Plugin purpose
Consul (Forerunner) - Enterprise Microsoft ecosystem orchestrator for TVS (Trusted Virtual Solutions) multi-entity multi-tenant deployment. 19 agents, 18 commands, 17 skills, 14 hooks, 5 workflows. MCP server for Graph API, Dataverse, Fabric, and Planner.

## Command index
- `commands/browser-fallback.md`
- `commands/cost-report.md`
- `commands/deploy-all.md`
- `commands/deploy-azure.md`
- `commands/deploy-dataverse.md`
- `commands/deploy-fabric.md`
- `commands/deploy-identity.md`
- `commands/deploy-portal.md`
- `commands/deploy-teams.md`
- `commands/extract-a3.md`
- `commands/health.md`
- `commands/identity-attestation.md`
- _... 6 more entries omitted for bootstrap brevity; lazy-load on demand._

## Agent index
- `agents/analytics-agent.md`
- `agents/azure-agent.md`
- `agents/browser-fallback-agent.md`
- `agents/carrier-normalization-agent.md`
- `agents/client-solution-architect-agent.md`
- `agents/comms-agent.md`
- `agents/consulting-crm-agent.md`
- `agents/data-agent.md`
- `agents/embedded-analytics-agent.md`
- `agents/excel-automation-agent.md`
- `agents/fabric-pipeline-agent.md`
- `agents/github-agent.md`
- _... 7 more entries omitted for bootstrap brevity; lazy-load on demand._

## Skill index
- `skills/az-cli.md`
- `skills/dataverse-architecture.md`
- `skills/embedded-analytics-go-to-market.md`
- `skills/excel-enterprise-automation.md`
- `skills/fabric-engineering.md`
- `skills/fabric-pipeline-authoring.md`
- `skills/fabric-rest.md`
- `skills/firebase-extract.md`
- `skills/graph-api.md`
- `skills/microsoft-graph-admin.md`
- `skills/pac-cli.md`
- `skills/planner-orchestration.md`
- _... 42 more entries omitted for bootstrap brevity; lazy-load on demand._

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

