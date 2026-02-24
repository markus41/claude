# Week 1 -- Critical Path Foundation

> **Workflow:** tvs-microsoft-deploy / week1-critical-path
> **Duration:** 5 business days
> **Owner:** Markus (#10, Global Admin)
> **Prerequisites:** Azure tenant access, Firebase admin credentials, GitHub org ownership

---

## Dependency Graph

```
[1] /tvs:extract-a3 ──────────────────────────────────────┐
         │                                                  │
         ├── blocks [6] /tvs:normalize-carriers            │
         ├── blocks taia-sale-prep.md (entire workflow)     │
         └── blocks full-platform.md (Fabric notebooks)     │
                                                            │
[2] Provision Key Vault ────────────────────────────────────┤
         │                                                  │
         ├── blocks [4] Entra baseline (secret storage)     │
         └── blocks tvs-foundation.md (env variables)       │
                                                            │
[3] GitHub monorepo scaffold ───────────────────────────────┤
         │                                                  │
         └── blocks tvs-foundation.md (CI/CD pipelines)     │
                                                            │
[4] Entra baseline ─────────────────────────────────────────┤
         │                                                  │
         ├── blocks [5] YubiKey FIDO2 provisioning          │
         └── blocks tvs-foundation.md (app registrations)   │
                                                            │
[5] YubiKey FIDO2 provisioning ─────────────────────────────┤
         │                                                  │
         └── blocks tvs-foundation.md (VA workforce access) │
                                                            │
[6] /tvs:normalize-carriers ───────────────────────────────┘
         │
         ├── blocks taia-sale-prep.md (buyer report)
         └── blocks full-platform.md (Dataverse schema)
```

**Parallel tracks:** Steps 1, 2, and 3 can run concurrently on Day 1.
Steps 4 and 6 can run concurrently once their prerequisites complete.

---

## Step 1: Extract All A3 Firebase Data

**Command:** `/tvs:extract-a3`
**Agent:** platform-agent (FORGE)
**Day:** 1-2
**Duration estimate:** 4-8 hours (depends on collection sizes)

### CRITICAL -- This step blocks everything downstream

The A3 Firebase collections are the single source of truth for TAIA broker and commission data.
Until this extraction completes, carrier normalization, TAIA sale prep, and Fabric archive
notebooks cannot proceed.

### Prerequisites
- Firebase admin service account key for project `taia-a3-firebase`
- Azure Storage account `sttvsdata` provisioned (or use temporary Blob container)
- `firebase-admin` SDK installed in functions/firebase-extract environment

### Execution Sequence
1. Authenticate to Firebase project `taia-a3-firebase`
2. Extract all five collections in order:
   - `brokers` -- agent records, licensing, contact info
   - `commissions` -- commission statements, splits, overrides
   - `carriers` -- carrier names, codes, product lines
   - `contacts` -- broker contacts, beneficiaries, referrals
   - `activities` -- CRM activity log, notes, call records
3. Export each collection as newline-delimited JSON to Azure Blob Storage
4. Generate row counts and SHA-256 checksums per collection
5. Validate: compare source document counts against export file line counts

### Success Criteria
- All 5 collections exported with zero missing documents
- SHA-256 checksums recorded in `extraction-manifest.json`
- Source vs. export row count delta = 0 for each collection
- Export files accessible in `sttvsdata/a3-extract/` container

### Rollback Plan
- Firebase is read-only during extraction; no rollback needed for source
- If export is partial: delete the incomplete Blob container, re-run from scratch
- If checksums mismatch: re-export individual collection, do not proceed to normalization

---

## Step 2: Provision Key Vault

**Command:** `/tvs:deploy-azure` (subset: Key Vault module only)
**Agent:** identity-agent (SHIELD)
**Day:** 1
**Duration estimate:** 30-60 minutes

### Prerequisites
- Azure subscription with Owner or Contributor role
- Resource group `rg-tvs-holdings` created (or include in this step)

### Execution Sequence
1. Create resource group `rg-tvs-holdings` in East US 2 (if not exists)
2. Deploy Key Vault `kv-tvs-holdings` via Bicep module:
   ```bash
   az keyvault create \
     --name kv-tvs-holdings \
     --resource-group rg-tvs-holdings \
     --location eastus2 \
     --sku standard \
     --enable-rbac-authorization true
   ```
3. Assign RBAC roles:
   - Markus: Key Vault Administrator
   - `app-tvs-ingest` service principal: Key Vault Secrets User
   - `app-fabric-pipeline` service principal: Key Vault Secrets User
4. Seed initial secrets:
   - `breakglass-taia-1`, `breakglass-taia-2` (emergency access credentials)
   - `firebase-sa-key` (Firebase service account for extraction)
   - `stripe-api-key-test` (Stripe test mode key)
5. Enable diagnostic logging to Log Analytics workspace

### Success Criteria
- `az keyvault show --name kv-tvs-holdings` returns 200
- RBAC assignments verified: `az role assignment list --scope /subscriptions/.../kv-tvs-holdings`
- All 5 initial secrets stored and retrievable by authorized principals
- Soft-delete and purge protection enabled

### Rollback Plan
- `az keyvault delete --name kv-tvs-holdings` (soft-delete retains 90 days)
- If RBAC misconfigured: re-run role assignments; Key Vault remains intact
- Secrets can be rotated post-provisioning without redeployment

---

## Step 3: GitHub Monorepo Scaffold

**Day:** 1
**Duration estimate:** 1-2 hours

### Prerequisites
- GitHub organization `tvs-holdings` created
- Markus has org Owner role

### Execution Sequence
1. Create repository `tvs-holdings/platform` (private)
2. Initialize monorepo structure:
   ```
   platform/
     apps/
       broker-portal/         # React SPA (Vite + TypeScript)
       admin-dashboard/       # Internal admin React app
     functions/
       firebase-extract/      # A3 extraction Azure Function
       stripe-webhook/        # Stripe event handler
       paylocity-sync/        # Paylocity HR sync
     infra/
       modules/               # Bicep modules (Key Vault, App Service, etc.)
       environments/          # Per-environment parameter files
     fabric/
       notebooks/             # Fabric/Spark notebooks
     solutions/
       TVSCore/               # Power Platform solution source
       ConsultingCore/        # Consulting solution source
     scripts/                 # Deployment and utility scripts
     .github/
       workflows/             # GitHub Actions CI/CD
   ```
3. Configure branch protection on `main`:
   - Require PR review (1 approver)
   - Require status checks (lint, typecheck, test)
   - No force pushes
4. Create `develop` branch as default working branch
5. Add `.gitignore` for Node, Python, .NET, and secrets patterns
6. Add `CODEOWNERS` file mapping paths to responsible team members

### Success Criteria
- Repository accessible at `github.com/tvs-holdings/platform`
- Branch protection rules active on `main`
- `develop` branch exists and is set as default
- CI workflow stub runs successfully on push to `develop`

### Rollback Plan
- Delete and recreate repository (no production data at this point)
- Branch protection can be reconfigured via GitHub API

---

## Step 4: Entra ID Baseline Configuration

**Agent:** identity-agent (SHIELD)
**Day:** 2-3
**Duration estimate:** 3-5 hours
**Depends on:** Step 2 (Key Vault must exist for secret storage)

### Prerequisites
- Key Vault `kv-tvs-holdings` provisioned (Step 2)
- Markus Global Admin credentials verified
- Tenant: `tvs-holdings.onmicrosoft.com`

### Execution Sequence
1. **Global Admin verification**
   - Confirm Markus eligible Global Admin via PIM
   - Activate role with 1-hour window for setup tasks
   - Verify break-glass accounts exist and are excluded from CA policies
2. **App registrations** (3 applications):
   - `app-tvs-ingest`: Application permissions for Dataverse + Graph API
   - `app-broker-portal`: SPA registration for Static Web Apps
   - `app-fabric-pipeline`: Service principal for Fabric workspace
   - Store all client secrets in `kv-tvs-holdings`
3. **Base conditional access policies**:
   - `CA001-RequireMFA-AllUsers`: MFA for all users, all cloud apps
   - `CA002-BlockLegacyAuth`: Block legacy authentication protocols
   - `CA003-RequireCompliantDevice-Premium`: Compliant device for Business Premium users
   - `CA004-PHVARestricted`: Geo-restrict + FIDO2 required for Philippines VAs
   - `CA005-SessionLifetime`: 12h stateside, 8h Philippines
4. **Security defaults**: Disable (replaced by explicit CA policies above)
5. **Named locations**: Create US office IPs and Philippines VA IP ranges
6. **Password policy**: 14-char minimum, no expiry, banned password list

### Success Criteria
- `az rest --method GET --url "https://graph.microsoft.com/v1.0/identity/conditionalAccess/policies"` returns 5 policies
- All 3 app registrations visible in Entra portal
- App secrets stored in Key Vault and retrievable
- Security defaults OFF, CA policies ON (report-only mode first 48h, then enforce)

### Rollback Plan
- CA policies: Switch to report-only mode, then delete if misconfigured
- App registrations: Delete and recreate (no downstream dependencies yet)
- Named locations: Edit IP ranges in-place

---

## Step 5: YubiKey FIDO2 Provisioning for Philippines VAs

**Agent:** identity-agent (SHIELD)
**Day:** 3-4
**Duration estimate:** 2-3 hours (registration); shipping logistics separate
**Depends on:** Step 4 (Entra baseline and CA policies must be active)

### Prerequisites
- 11 YubiKey 5 NFC devices procured and inventoried
- Entra ID CA policy `CA004-PHVARestricted` active in report-only mode
- PH VA user accounts created and assigned to `PH-VirtualAssistants` group
- Frontline F3 licenses assigned via group-based licensing

### Execution Sequence
1. **Create VA accounts** (11 users):
   - Naming: `va-{firstname}.{lastname}@trustedvirtual.solutions`
   - Assign to `PH-VirtualAssistants` security group
   - License: SPE_F3 (Microsoft 365 F3) via group-based licensing
2. **Generate Temporary Access Pass (TAP)** for each VA:
   ```bash
   az rest --method POST \
     --url "https://graph.microsoft.com/v1.0/users/{userId}/authentication/temporaryAccessPassMethods" \
     --body '{"lifetimeInMinutes": 480, "isUsableOnce": true}'
   ```
3. **Ship YubiKeys** with TAP codes to Philippines team lead
4. **Remote registration session** (coordinated with PH team lead):
   - VA signs in with TAP
   - Registers YubiKey as FIDO2 credential
   - Disables SMS/phone fallback for each account
5. **Verify key registration**:
   ```bash
   az rest --method GET \
     --url "https://graph.microsoft.com/v1.0/users/{userId}/authentication/fido2Methods"
   ```
6. **Enforce CA policy**: Switch `CA004-PHVARestricted` from report-only to enforce

### Success Criteria
- All 11 VAs have FIDO2 method registered in Entra
- No SMS/phone fallback methods remain on PH VA accounts
- `CA004-PHVARestricted` in enforce mode with no blocked sign-ins
- Key inventory spreadsheet updated with serial numbers and user mappings

### Rollback Plan
- If key registration fails: Issue new TAP, retry registration
- If CA policy blocks legitimate access: Revert to report-only, investigate sign-in logs
- Emergency: Break-glass account bypass if all PH VAs locked out

---

## Step 6: Start Carrier Normalization Sprint

**Command:** `/tvs:normalize-carriers`
**Agent:** platform-agent (FORGE)
**Day:** 3-5
**Duration estimate:** 8-16 hours (depends on carrier data quality)
**Depends on:** Step 1 (A3 Firebase extraction must be complete)

### Prerequisites
- A3 `carriers` collection extracted to Azure Blob Storage (Step 1)
- A3 `commissions` collection extracted (needed for carrier-commission cross-reference)
- Carrier master list from TAIA operations team (if available)

### Execution Sequence
1. **Load raw carrier data** from `sttvsdata/a3-extract/carriers.ndjson`
2. **Deduplicate carriers**:
   - Normalize names (trim, case-fold, remove punctuation variants)
   - Match on NAIC codes where available
   - Flag ambiguous matches for manual review
3. **Build canonical carrier table**:
   - `carrier_id` (new UUID)
   - `display_name` (normalized)
   - `naic_code` (if available)
   - `a3_original_ids` (array of source IDs)
   - `product_lines` (extracted from commission data)
   - `status` (active / inactive / unknown)
4. **Cross-reference with commissions**: Map commission records to canonical carrier IDs
5. **Generate normalization report**:
   - Total raw carrier records
   - Deduplicated count
   - Auto-matched count
   - Manual review queue count
   - Commission coverage percentage
6. **Export** canonical carrier table as CSV and JSON for downstream use

### Success Criteria
- Deduplication reduces carrier count by at least 15% (typical for insurance data)
- Commission-to-carrier mapping coverage exceeds 95%
- Manual review queue is under 50 records
- Canonical carrier table exported and validated

### Rollback Plan
- Normalization is a derived dataset; source data in Blob Storage is untouched
- If normalization logic is wrong: Re-run with corrected rules from scratch
- Manual review queue can be revisited at any point before TAIA sale prep

---

## Week 1 Daily Schedule

| Day | Morning (9am-12pm) | Afternoon (1pm-5pm) |
|-----|---------------------|----------------------|
| Mon | Steps 1+2+3 kick off (parallel) | Step 1 extraction continues; Step 2+3 complete |
| Tue | Step 1 validation; Step 4 begins | Step 4 continues (app regs, CA policies) |
| Wed | Step 4 completes; Step 5 begins; Step 6 begins | Step 5 TAP generation; Step 6 dedup running |
| Thu | Step 5 remote registration session (PH timezone) | Step 6 normalization continues |
| Fri | Step 5 CA enforcement; Step 6 report review | Week 1 checkpoint: all steps validated |

## Week 1 Exit Criteria

All of the following must be true before proceeding to subsequent workflows:

- [ ] All 5 A3 collections extracted with checksum validation
- [ ] Key Vault provisioned with RBAC and initial secrets
- [ ] GitHub monorepo scaffold with branch protection active
- [ ] 5 Entra CA policies in enforce mode
- [ ] 3 app registrations with secrets in Key Vault
- [ ] 11 PH VAs registered with FIDO2 YubiKeys
- [ ] Carrier normalization sprint in progress (completion not required for all downstream)
- [ ] No critical blockers logged in Jira

## Escalation Contacts

| Issue | Contact | Channel |
|-------|---------|---------|
| Firebase access denied | TAIA admin (legacy) | Email + Teams |
| Azure subscription limits | Markus (Global Admin) | Direct Teams DM |
| YubiKey shipping delay | PH team lead | WhatsApp group |
| GitHub org access | Markus | Direct Teams DM |
