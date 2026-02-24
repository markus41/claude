---
name: tvs:taia-readiness
description: TAIA transition readiness check driven by control-plane wind-down overlay
allowed-tools:
  - Bash
  - Read
  - Grep
---

# TAIA Readiness

Assesses TAIA wind-down and target-state readiness using the same control-plane manifest model.

## Usage

```bash
/tvs:taia-readiness [--env dev|test|prod]
```

## Plan generation

```bash
BASE=plugins/tvs-microsoft-deploy/control-plane/manifests/base.yaml
ENV_OVERLAY=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/${ENV:-prod}.yaml
WIND_DOWN=plugins/tvs-microsoft-deploy/control-plane/manifests/overlays/taia-wind-down.yaml

node plugins/tvs-microsoft-deploy/control-plane/planner.mjs \
  --manifest "$BASE" \
  --overlay "$ENV_OVERLAY" \
  --overlay "$WIND_DOWN" \
  --mode dry-run \
  --out plugins/tvs-microsoft-deploy/control-plane/out/taia-readiness.json
```

## Readiness gates

- All resources tagged/affected by wind-down have explicit `pause` or `decommission` operations.
- Non-TAIA core resources remain in planned `create`/`update` operations.
- No dependency cycles or cross-phase violations.

Use `taia-readiness.json` as the readiness artifact for sale-prep reviews.
