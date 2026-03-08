# TVS Control Plane

Tenant-scoped control plane package that ingests Azure, Dataverse/Power Platform, Fabric, M365 collaboration, and automation manifests and emits dependency-ordered plans.

## Manifest model

- Schema: `schema/control-plane-manifest.schema.json`
- Base manifest: `manifests/base.yaml`
- Overlays: `manifests/overlays/{dev,test,prod,taia-wind-down}.yaml`

Supported resource types:

- Azure: `azure.subscription`
- Dataverse/Power Platform: `dataverse.environment`, `powerplatform.solution`
- Fabric: `fabric.workspace`, `fabric.lakehouse`, `fabric.notebook`
- Entra ID: `entra.app`, `entra.group`
- Collaboration: `teams.channel`, `sharepoint.site`
- Automation: `automation.asset`

## Planner

`planner.mjs` computes ordered phases:

1. `identity`
2. `data-platform`
3. `app-platform`
4. `collaboration-services`

### Dry-run plan

```bash
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml \
  --overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/dev.yaml \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/dry-run.dev.json
```

### Execution plan

```bash
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml \
  --overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/prod.yaml \
  --mode execute \
  --out plugins/tvs-microsoft-deploy/control-plane/out/execute.prod.json
```

### TAIA wind-down

```bash
node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml \
  --overlay plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/taia-wind-down.yaml \
  --mode execute
```
