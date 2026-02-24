---
name: tvs:deploy-identity
description: Entra ID deployment - users, licenses, conditional access, app registrations, FIDO2 configuration
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Entra ID Identity Deployment

Provisions and configures Microsoft Entra ID (Azure AD) for TVS Holdings entities. Creates users, assigns Microsoft 365 licenses, configures conditional access policies, registers service principal applications, and sets up FIDO2 passwordless authentication.

## Usage

```
/tvs:deploy-identity [--entity tvs|consulting|media|all] [--users-only] [--apps-only]
```

## Prerequisites

```bash
# 1. Graph API token or service principal credentials
if [ -z "$GRAPH_TOKEN" ] && [ -z "$AZURE_CLIENT_ID" ]; then
  echo "FAIL: GRAPH_TOKEN or AZURE_CLIENT_ID+AZURE_CLIENT_SECRET required"; exit 1
fi

# 2. Tenant ID
[ -z "$TVS_TENANT_ID" ] && { echo "FAIL: TVS_TENANT_ID not set"; exit 1; }

# 3. Validate Graph API access
python3 plugins/tvs-microsoft-deploy/scripts/api/graph_request.py "/organization" --entity "${TVS_ENTITY:-tvs}" > /dev/null \
  || { echo "FAIL: Graph API token invalid or expired"; exit 1; }

# 4. Confirm sufficient admin privileges
ROLES=$(python3 plugins/tvs-microsoft-deploy/scripts/api/graph_request.py "/me/memberOf" --entity "${TVS_ENTITY:-tvs}" \
  | jq -r '.value[].displayName')
echo "$ROLES" | grep -q "Global Administrator" \
  || echo "WARN: Global Admin role recommended for full provisioning"
```

## Mandatory Pre-Deploy Identity Policy Checks

Run policy validation before starting any deploy phase:

```bash
python3 plugins/tvs-microsoft-deploy/scripts/identity_policy_checks.py --json
```

The centralized `hooks/identity-policy-engine.sh` also enforces these checks and blocks unsafe operations with machine-readable denial reasons.

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Tenant Auditor:**
- Query `GET /organization` for tenant details, verified domains
- List existing users via `GET /users` with `$select=displayName,mail,accountEnabled`
- Enumerate current app registrations via `GET /applications`
- Check existing conditional access policies via `GET /identity/conditionalAccess/policies`
- Inventory assigned licenses via `GET /subscribedSkus`

**Agent 2 - License Calculator:**
- Count users per entity: TVS (primary), Lobbi Consulting, Medicare Consulting, Media Company
- Map license requirements: M365 Business Basic, Business Standard, E3/E5 by role
- Calculate license delta: needed minus already assigned
- Identify users from TAIA wind-down that need license transfer to TVS
- Estimate monthly license cost impact per tier

### Phase 2: PLAN (1 agent)

**Agent 3 - Identity Planner:**
- Build user provisioning manifest from entity roster CSVs
- Plan app registrations: `app-tvs-dataverse`, `app-tvs-fabric`, `app-tvs-ingest`, `app-tvs-portal`
- Design conditional access policies:
  - MFA required for all users
  - Block legacy authentication
  - Require compliant device for Dataverse access
  - FIDO2 preferred for admin accounts
- Map group structure: `sg-tvs-users`, `sg-consulting-users`, `sg-media-users`, `sg-tvs-admins`
- Generate deployment sequence: groups, users, licenses, apps, CA policies, FIDO2

### Phase 3: CODE (2 agents)

**Agent 4 - User + Group Provisioner:**
- Create security groups via `POST /groups`
- Create/update users via `POST /users` with password profile
- Assign users to groups via `POST /groups/{id}/members/$ref`
- Assign licenses via `POST /users/{id}/assignLicense`
- Set usage location for license assignment compliance
- Configure user manager relationships

**Agent 5 - App + Policy Deployer:**
- Register applications via `POST /applications` with required API permissions
- Create service principals via `POST /servicePrincipals`
- Grant admin consent for Dataverse and Graph API permissions
- Create client secrets, store in Key Vault `kv-tvs-holdings`
- Deploy conditional access policies via `POST /identity/conditionalAccess/policies`
- Configure FIDO2 authentication method policy via `PATCH /policies/authenticationMethodsPolicy`
- Register FIDO2 keys for admin accounts

### Phase 4: TEST (2 agents)

**Agent 6 - Auth Tester:**
- Verify each created user can be queried via Graph API
- Confirm group memberships are correct per entity
- Validate license assignments show active status
- Test app registration client credentials flow: request token, verify scopes
- Confirm Key Vault secrets are accessible for stored client secrets

**Agent 7 - Policy Validator:**
- Verify conditional access policies are in `enabledForReportingButNotEnforced` mode
- Simulate sign-in via `POST /identity/conditionalAccess/evaluate`
- Confirm MFA policy triggers for standard users
- Confirm legacy auth block fires for test request
- Validate FIDO2 method is registered and available for admin accounts

### Phase 5: FIX (1 agent)

**Agent 8 - Identity Remediator:**
- Re-process any failed user creations (duplicate UPN conflicts, license unavailability)
- Fix app permission grant failures by re-requesting admin consent
- Adjust conditional access policy scope if blocking legitimate access
- Handle license assignment failures due to usage location missing
- Reference `orchestration-protocol-enforcer` hook for retry logic

### Phase 6: DOCUMENT (1 agent)

**Agent 9 - Identity Documenter:**
- Generate identity deployment report listing all created/modified objects
- Record app registration IDs and service principal object IDs
- Document conditional access policy names and states
- Output license utilization summary (assigned vs. available)
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 5 sub-agents enforced. Identity deployment must complete before downstream commands (dataverse, fabric, portal) can reference created service principals.

## Entity-Specific Notes

- **TVS:** Primary tenant, all infrastructure apps registered here
- **Lobbi Consulting:** Guest users from consulting tenant, B2B collaboration
- **Medicare Consulting:** HIPAA-aware conditional access (stricter device compliance)
- **Media Company:** Minimal licensing, content contributor roles only
- **TAIA:** Wind-down only -- disable accounts, transfer licenses, do NOT create new users

## Unified Command Contract

### Contract
- **Schema:** `../cli/command.schema.json`
- **Required shared arguments:** `--entity`, `--tenant`
- **Optional shared safety arguments:** `--strict`, `--dry-run`, `--export-json`, `--plan-id`
- **Error catalog:** `../cli/error-codes.json`
- **Operator remediation format:** `../cli/operator-remediation.md`

### Shared argument patterns
```text
--entity <tvs|consulting|taia|all>
--tenant <tenant-id>
--strict
--dry-run
--export-json <path>
--plan-id <plan-id>
```

### Unified examples
```bash
# TVS
/tvs:deploy-identity --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:deploy-identity --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:deploy-identity --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:deploy-identity --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/deploy-identity.json --plan-id PLAN-SAFE-001
```

