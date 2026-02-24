---
name: tvs:deploy-dataverse
description: Dataverse schema + Power Platform ALM deployment (pack/unpack, managed promotion, env vars, connection refs, release gates, Copilot Studio)
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Dataverse + Power Platform ALM Deployment

Deploys Microsoft Dataverse schema, Power Automate flows, and Copilot Studio assets through a governed ALM lifecycle. Includes unpack/pack/import operations, managed/unmanaged strategy, environment-variable and connection-reference validation, version promotion, and release gates.

## Usage

```bash
/tvs:deploy-dataverse [--env dev|test|prod] [--action precheck|unpack|pack|import|promote] [--mode managed|unmanaged]
```

Primary automation entrypoint:

```bash
python3 plugins/tvs-microsoft-deploy/scripts/power_platform_alm.py --profile <dev|test|prod> --action <precheck|unpack|pack|import|promote>
```

## Prerequisites

```bash
# 1. PAC CLI authentication
pac auth list | grep -q "Active" || { echo "FAIL: pac auth required. Run: pac auth create"; exit 1; }

# 2. Dataverse and tenant variables
[ -z "$TVS_DATAVERSE_ENV_URL" ] && { echo "FAIL: TVS_DATAVERSE_ENV_URL not set"; exit 1; }
[ -z "$CONSULTING_DATAVERSE_ENV_URL" ] && { echo "FAIL: CONSULTING_DATAVERSE_ENV_URL not set"; exit 1; }
[ -z "$POWER_PLATFORM_TENANT_ID" ] && { echo "FAIL: POWER_PLATFORM_TENANT_ID not set"; exit 1; }

# 3. Flow owner policy + capacity telemetry for pre-promotion checks
[ -z "$FLOW_OWNER_OBJECT_IDS" ] && { echo "FAIL: FLOW_OWNER_OBJECT_IDS not set"; exit 1; }
[ -z "$PP_CAPACITY_DATABASE_PCT" ] && { echo "FAIL: PP_CAPACITY_DATABASE_PCT not set"; exit 1; }
[ -z "$PP_CAPACITY_FILE_PCT" ] && { echo "FAIL: PP_CAPACITY_FILE_PCT not set"; exit 1; }
[ -z "$PP_CAPACITY_LOG_PCT" ] && { echo "FAIL: PP_CAPACITY_LOG_PCT not set"; exit 1; }

# 4. Validate connectivity
pac org who --environment "$TVS_DATAVERSE_ENV_URL" || { echo "FAIL: Cannot reach TVS Dataverse"; exit 1; }
pac org who --environment "$CONSULTING_DATAVERSE_ENV_URL" || { echo "FAIL: Cannot reach Consulting Dataverse"; exit 1; }

# 5. Canonical ALM directories must exist
[ -d "plugins/tvs-microsoft-deploy/power-platform/manifests" ] || { echo "FAIL: manifests missing"; exit 1; }
[ -d "plugins/tvs-microsoft-deploy/power-platform/profiles" ] || { echo "FAIL: profiles missing"; exit 1; }
[ -d "plugins/tvs-microsoft-deploy/power-platform/validation" ] || { echo "FAIL: validation rules missing"; exit 1; }
```

## Full ALM Lifecycle

1. **Pre-promotion checks (required)**
   - `python3 .../power_platform_alm.py --profile <env> --action precheck`
   - Validates schema drift against canonical table rules.
   - Validates connector authentication health via connection reference auth mode.
   - Validates flow ownership/service principals against owner policy.
   - Enforces environment capacity limits (database/file/log).
   - Verifies rollback package presence for release gates.
   - Ensures Copilot Studio bot assets are present and versioned.

2. **Unpack (developer branch only)**
   - `python3 .../power_platform_alm.py --profile dev --action unpack`
   - Converts solution zip packages into source-controlled folders for review.

3. **Pack (build artifact generation)**
   - `python3 .../power_platform_alm.py --profile <env> --action pack`
   - Produces managed or unmanaged artifacts according to deployment profile.

4. **Import (environment deployment)**
   - `python3 .../power_platform_alm.py --profile <env> --action import`
   - Imports Dataverse, Automations, and Copilot Studio solution packages and publishes customizations.

5. **Version promotion**
   - `python3 .../power_platform_alm.py --profile <env> --action promote`
   - Increments manifest versions for controlled release promotion.

## Managed vs Unmanaged Strategy

- **dev profile:** unmanaged imports for rapid iteration and debugging.
- **test/prod profiles:** managed imports only to enforce release immutability.
- Profile defaults are stored in `plugins/tvs-microsoft-deploy/power-platform/profiles/*.json`.

## Release Gates (Business-Critical Automations)

All promotions must pass release gates defined in `power-platform/validation/release-gates.json`:

- `commission-processing`
- `identity-offboarding`
- `taia-archival`

Each gate requires:
- rollback package staged under `power-platform/rollback-packages/`
- successful post-deploy smoke check execution (flow run + expected status)
- included Copilot Studio smoke checks for conversational handoff paths

## Post-Deploy Smoke Checks

Run after `--action import`:

```bash
PP_DEPLOY_PROFILE=prod python3 plugins/tvs-microsoft-deploy/scripts/deploy_flows.py
```

Smoke checks verify:
- critical flows are deployed and activatable
- release gates are satisfied
- conversational bots can invoke backed automations

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 6 sub-agents enforced. Dataverse deployment depends on `tvs:deploy-identity` completing first (service principals needed for app-level access).

