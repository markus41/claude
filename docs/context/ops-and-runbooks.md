# Ops and Runbooks

## Common Operations

### Start Local Development

```bash
pnpm install
pnpm dev          # Vite dev server on localhost:5173
```

### Run Full Validation

```bash
pnpm type-check && pnpm lint && pnpm test && pnpm check:plugin-schema
```

### Regenerate Plugin Indexes

```bash
pnpm generate:plugin-indexes
```

## Runbooks

### MCP Server Not Responding

<!-- Fill in: Diagnostic steps, restart procedure -->

1. Check `.mcp.json` for correct server path
2. Verify environment variables are set
3. <!-- Fill in: restart command -->

### CI Workflow Failure

<!-- Fill in: How to debug failed GitHub Actions runs -->

### Plugin Install Failure

<!-- Fill in: Steps to diagnose and fix broken plugin installs -->

### Context Window Exceeded

1. Run `/compact` to reduce conversation history
2. If still too large, use `/clear` and restart the task
3. Check plugin context size with `pnpm profile:plugin-context`

## Monitoring

<!-- Fill in: What is monitored, alerting thresholds, dashboards -->

## Incident Response

<!-- Fill in: Escalation path, severity levels, communication channels -->
