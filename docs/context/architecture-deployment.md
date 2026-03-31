# Architecture: Deployment

## Environments

| Environment | URL | Purpose |
|-------------|-----|---------|
| Local dev | `localhost:5173` | Vite dev server |
<!-- Fill in: staging, production, preview environments -->

## Build Pipeline

```
pnpm install
  -> generate:plugin-indexes
  -> tsc (type check)
  -> vite build
  -> output: dist/
```

## CI Workflows (GitHub Actions)

| Workflow | File | Trigger |
|----------|------|---------|
| Plugin preflight | `plugin-preflight.yml` | PR to main |
| Plugin context check | `plugin-context-check.yml` | PR to main |
| No tracked node_modules | `no-tracked-node-modules.yml` | Push |
| Jira PR sync | `jira-pr-sync.yml` | PR events |
| Jira auto-create | `jira-auto-create.yml` | Issue events |
| Jira build status | `jira-build-status.yml` | Workflow run |
| Jira deployment track | `jira-deployment-track.yml` | Deployment |
| HA registry check | `home-assistant-architect-registry-check.yml` | PR |

<!-- Fill in: Deployment targets, container registry, infrastructure -->

## Infrastructure

<!-- Fill in: Hosting, CDN, DNS, secrets management -->

## Rollback Procedure

<!-- Fill in: How to roll back a bad deploy -->
