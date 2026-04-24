---
name: harness-automation
description: Universal Harness Code + CI/CD + Pipeline automation patterns. Uses mcp__harness__* tools when available; falls back to hc CLI. Invoke for pipeline ops, PR workflow, deployment, feature flags, GitOps, IaCM, or when user says "harness", "pipeline", "run ci", "deploy".
---

# Harness Automation

Universal patterns for Harness platform operations. Project-agnostic — all account/org/project IDs come from environment or explicit arguments.

## Tool preference order

1. `mcp__harness__*` tools (if MCP harness is installed — preferred).
2. `hc` CLI (fallback for local dev).
3. REST API via `curl` (last resort).

## MCP tool surface

```
mcp__harness__harness_list          # List resources (pipelines, PRs, deployments, repos)
mcp__harness__harness_get           # Get specific resource
mcp__harness__harness_describe      # Detailed description
mcp__harness__harness_execute       # Trigger pipeline
mcp__harness__harness_status        # Execution status
mcp__harness__harness_search        # Cross-resource search
mcp__harness__harness_create        # Create resource
mcp__harness__harness_update        # Modify
mcp__harness__harness_delete        # Remove
mcp__harness__harness_diagnose      # Troubleshoot failures
mcp__harness__harness_schema        # Pull schemas for YAML authoring
```

## Pipeline identity

Harness resource identifiers:
- `account` — tenant-wide (env `HARNESS_ACCOUNT`).
- `org` — organization (env `HARNESS_ORG`, default `default`).
- `project` — logical grouping (passed per-call).
- `identifier` — resource ID inside project.

Never hard-code these in scripts. Read from env or parameters.

## ECR tag invariant (when applicable)

For services emitting container images:
`{service}-{version}-{sanitized-branch}-{short-sha}-{YYYYMMDDHHMMSS}`

Immutable. Never `:latest`. Tag is computed by CI template, not by the caller.

## Pipeline authoring — reuse first

1. Check `repos/*/harness/templates/` (or equivalent shared-templates repo) for an existing template.
2. If found, reference via `template:` include — do not inline.
3. If not found and used in 3+ pipelines, promote the pattern to the template repo.

## Common flows

### Trigger pipeline + wait

```
mcp__harness__harness_execute
  project: <project>
  pipeline: <identifier>
  inputs: { branch: "feature/foo" }

# Poll status
mcp__harness__harness_status
  execution-id: <from previous>
```

### List recent executions

```
mcp__harness__harness_list
  resource: executions
  project: <project>
  pipeline: <identifier>
  limit: 10
```

### Create a PR

```
mcp__harness__harness_create
  resource: pull-request
  repo: <repo-identifier>
  source: <branch>
  target: main
  title: "..."
  body: "Refs <JIRA-KEY>"
```

## PR-workflow pattern

1. **Branch** — `git checkout -b <type>/<jira-key>-<slug>`.
2. **Commit** — Conventional Commits; include `Refs <JIRA-KEY>` in body.
3. **Push** — `git push -u origin <branch>`.
4. **Open PR** — via `harness_create` or `hc pr create`.
5. **CI** — triggered automatically; monitor via `harness_status`.
6. **Review** — council agents (code-reviewer + security-auditor + infra-reviewer) fan out over the diff.
7. **Merge** — after green + approvals.

## CI steps pattern

For PowerShell-based projects (e.g., tenant-management-kit):

```yaml
steps:
  - step:
      type: Run
      name: Run all tests
      spec:
        command: pwsh -File tools/run-all-tests.ps1
  - step:
      type: Run
      name: Validate policies
      spec:
        command: pwsh -File tools/validate-all-policies.ps1
```

## Safety rules

- **Never** `--no-verify`.
- **Never** force-push to `main` / `master`.
- **Never** disable signing.
- **Never** bypass hook blocks — fix the underlying issue.
- Destructive ops (delete pipeline, delete repo, purge executions) require explicit user confirmation.

## Troubleshooting

```
mcp__harness__harness_diagnose
  execution-id: <failed execution>
```

Returns structured failure analysis. For connector failures, check `mcp__harness__harness_get resource: connectors` — credentials expire silently.

## Related

- `skills/claude-code-automation` — headless mode for CI gatekeepers.
- `skills/work-unit-protocol` — Section 20 verification includes pipeline green.
- `plugin: harness-platform` — installed separately, provides richer operations.
