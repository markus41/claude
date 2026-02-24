---
name: tvs:deploy-embedded-analytics
description: Provision and publish Fabric/Power BI embedded analytics packages for client delivery
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Task
---

# Embedded Analytics Deployment

## Usage

```bash
/tvs:deploy-embedded-analytics --client <client-code> --package <sales|operations|finance>
```

## Sequence
1. Validate Fabric capacity and workspace state.
2. Deploy semantic model/report artifacts.
3. Configure RLS and embed service principal access.
4. Publish token endpoint config to Power Pages.
5. Run smoke checks for report rendering and data isolation.

## Scripted Path

```bash
bash plugins/tvs-microsoft-deploy/scripts/publish_embedded_analytics.sh \
  --client "$CLIENT_CODE" \
  --package "$PACKAGE"
```
