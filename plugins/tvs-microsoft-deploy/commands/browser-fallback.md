---
name: tvs:browser-fallback
description: Manual browser automation fallback using Playwright for portal operations lacking CLI/API coverage
allowed-tools:
  - Bash
  - Read
  - Write
  - Task
---

> Docs Hub: [CLI Hub](../docs/cli/README.md#command-index)

# Browser Fallback

Uses Playwright to perform Microsoft portal operations that lack CLI or API coverage. Captures screenshots for audit trail and verification.

## Usage

```bash
/tvs:browser-fallback --portal=ppac|fabric|azure --action=<action> [--tenant=tvs|consulting]
```

## Prerequisites

```bash
# Verify Playwright is installed
npx playwright --version || echo "Install: npx playwright install chromium"

# Verify auth state exists
ls .auth/*_state.json 2>/dev/null || echo "Run browser login first to cache auth"
```

## 6-Phase Protocol

> Hook: orchestration-protocol-enforcer.sh validates phase compliance
> Hook: tenant-isolation-validator.sh validates target tenant

### Phase 1: EXPLORE (2 agents)

**Agent 1: browser-fallback-agent** (haiku)
- Check Playwright installation and browser availability
- Verify cached authentication state for target portal
- Identify target portal URL and navigation path

**Agent 2: platform-agent** (sonnet)
- Confirm the operation cannot be done via CLI/API
- Document why browser fallback is needed
- Identify the specific portal location

### Phase 2: PLAN (1 agent)

**Agent: browser-fallback-agent** (haiku)
- Map portal navigation steps
- Identify form fields, buttons, and confirmation dialogs
- Plan screenshot capture points (before, during, after)

### Phase 3: CODE (2 agents)

**Agent 1: browser-fallback-agent** (haiku)
- Execute Playwright script against target portal
- Navigate to correct page, fill forms, click buttons
- Capture screenshots at each step

**Agent 2: platform-agent** (sonnet)
- Monitor for errors during browser execution
- Provide selector fallbacks if primary selectors fail

### Phase 4: TEST (2 agents)

**Agent 1: browser-fallback-agent** (haiku)
- Verify operation completed via portal state
- Compare before/after screenshots

**Agent 2: platform-agent** (sonnet)
- Verify via CLI/API that the portal change is reflected
- Check for any unintended side effects

### Phase 5: FIX (1 agent)

**Agent: browser-fallback-agent** (haiku)
- Retry failed portal operations with alternative selectors
- Handle session expiration and re-authenticate

### Phase 6: DOCUMENT (1 agent)

**Agent: browser-fallback-agent** (haiku)
- Save screenshots to screenshots/ directory
- Log portal operations performed
- Record any CLI/API gaps found for future development

## Supported Portals

| Portal | URL | Common Operations |
|--------|-----|-------------------|
| Power Platform Admin | admin.powerplatform.microsoft.com | Capacity, DLP, env settings |
| Fabric Portal | app.fabric.microsoft.com | Capacity assignment, gateway config |
| Azure Portal | portal.azure.com | Marketplace, complex configs |
| Teams Admin | admin.teams.microsoft.com | Policy assignment, phone system |

## Screenshot Convention

```
screenshots/{portal}_{action}_{resource}_{YYYYMMDD_HHMMSS}.png
```

## See Also

- All other `/tvs:deploy-*` commands — Browser fallback is last resort
- `agents/browser-fallback-agent.md` — Agent documentation

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
/tvs:browser-fallback --entity tvs --tenant tvs-prod --plan-id PLAN-TVS-001

# Consulting
/tvs:browser-fallback --entity consulting --tenant consulting-prod --plan-id PLAN-CONSULTING-001

# TAIA
/tvs:browser-fallback --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001

# Cross-entity safe mode
/tvs:browser-fallback --entity all --tenant shared-ops --strict --dry-run --export-json docs/cli/browser-fallback.json --plan-id PLAN-SAFE-001
```

