---
name: Power Platform CLI (pac)
description: This skill should be used when working with *.solution files, dataverse/**, pages/**, copilot-studio/**, or *.crmsolution files. It provides Power Platform CLI operations for Dataverse solution management, Power Pages deployment, Copilot Studio bot deployment, and environment administration across TVS Holdings entities.
version: 1.0.0
---

> Docs Hub: [Skills Hub](../docs/skills/README.md#skill-index)

# Power Platform CLI (pac) Operations

Complete reference for Power Platform CLI operations across TVS Holdings environments.

## Authentication Profiles

### Create Auth Profiles

```bash
# TVS Motor Company - Production
pac auth create \
  --name "tvs-prod" \
  --environment "https://tvs-prod.crm8.dynamics.com" \
  --tenant "tvs-holdings.onmicrosoft.com" \
  --kind Admin

# TVS Motor Company - Development
pac auth create \
  --name "tvs-dev" \
  --environment "https://tvs-dev.crm8.dynamics.com" \
  --tenant "tvs-holdings.onmicrosoft.com"

# Consulting Entity - Production
pac auth create \
  --name "consulting-prod" \
  --environment "https://consulting-prod.crm.dynamics.com" \
  --tenant "tvs-holdings.onmicrosoft.com" \
  --kind Admin

# Consulting Entity - Development
pac auth create \
  --name "consulting-dev" \
  --environment "https://consulting-dev.crm.dynamics.com" \
  --tenant "tvs-holdings.onmicrosoft.com"
```

### Profile Management

```bash
# List all auth profiles
pac auth list

# Switch active profile
pac auth select --index 2

# Verify current profile
pac auth who

# Delete stale profile
pac auth delete --index 4
```

## Environment Management

```bash
# List all environments visible to current auth
pac env list

# Show environment details
pac env who --environment "https://tvs-prod.crm8.dynamics.com"

# Copy environment (for sandbox refresh)
pac env copy \
  --source-env "https://tvs-prod.crm8.dynamics.com" \
  --target-env "https://tvs-test.crm8.dynamics.com" \
  --type MinimalCopy

# Reset sandbox environment
pac env reset \
  --environment "https://tvs-test.crm8.dynamics.com" \
  --confirm
```

## Solution Transport Workflow (Dev -> Test -> Prod)

### Step 1: Export from Development

```bash
# Export as managed for deployment
pac solution export \
  --name "TVSBrokerPortal" \
  --path "./solutions/TVSBrokerPortal_managed.zip" \
  --managed true \
  --include general

# Export as unmanaged for source control
pac solution export \
  --name "TVSBrokerPortal" \
  --path "./solutions/TVSBrokerPortal_unmanaged.zip" \
  --managed false

# Unpack for source control
pac solution unpack \
  --zipfile "./solutions/TVSBrokerPortal_unmanaged.zip" \
  --folder "./solutions/TVSBrokerPortal/" \
  --packagetype Both \
  --allowDelete true
```

### Step 2: Import to Test Environment

```bash
# Switch to test auth profile
pac auth select --index 2

# Import managed solution
pac solution import \
  --path "./solutions/TVSBrokerPortal_managed.zip" \
  --activate-plugins true \
  --force-overwrite true \
  --async true

# Check import status
pac solution check \
  --path "./solutions/TVSBrokerPortal_managed.zip" \
  --outputDirectory "./solutions/check-results/"

# Publish all customizations after import
pac solution publish
```

### Step 3: Promote to Production

```bash
# Switch to production auth profile
pac auth select --index 1

# Import with holding solution pattern (staged rollout)
pac solution import \
  --path "./solutions/TVSBrokerPortal_managed.zip" \
  --import-as-holding true \
  --async true

# Apply upgrade (removes old components)
pac solution upgrade \
  --solution-name "TVSBrokerPortal" \
  --async true
```

## Canvas App Management

```bash
# Pack canvas app from source
pac canvas pack \
  --msapp "./apps/BrokerPortal.msapp" \
  --sources "./apps/BrokerPortal-src/"

# Unpack canvas app for source control
pac canvas unpack \
  --msapp "./apps/BrokerPortal.msapp" \
  --sources "./apps/BrokerPortal-src/"
```

## Power Pages Deployment

```bash
# Download Power Pages site for local editing
pac pages download \
  --path "./pages/tvs-broker-portal/" \
  --website-id "a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  --overwrite true

# Upload local changes to Power Pages
pac pages upload \
  --path "./pages/tvs-broker-portal/"

# Upload specific file type
pac pages upload \
  --path "./pages/tvs-broker-portal/" \
  --type webfiles

# Preview Power Pages locally
pac pages launch \
  --path "./pages/tvs-broker-portal/" \
  --port 8080
```

## Copilot Studio Bot Deployment

```bash
# Create new Copilot Studio bot
pac copilot-studio create \
  --name "TVSBrokerAssistant" \
  --environment "https://tvs-prod.crm8.dynamics.com" \
  --description "Broker onboarding assistant for TVS Motor"

# Export bot as solution component
pac solution export \
  --name "TVSCopilotBots" \
  --path "./solutions/TVSCopilotBots_managed.zip" \
  --managed true

# List existing bots
pac copilot-studio list \
  --environment "https://tvs-prod.crm8.dynamics.com"
```

## Model-Driven App Build

```bash
# Build model-driven app
pac modelbuilder build \
  --solutionRootPath "./solutions/TVSBrokerPortal/"

# Generate TypeScript types from Dataverse tables
pac modelbuilder generate \
  --environment "https://tvs-dev.crm8.dynamics.com" \
  --entityList "tvs_broker,tvs_commission,tvs_carrier" \
  --outputDirectory "./src/types/dataverse/"
```

## Solution Validation

```bash
# Run solution checker (static analysis)
pac solution check \
  --path "./solutions/TVSBrokerPortal_managed.zip" \
  --outputDirectory "./solutions/check-results/" \
  --geo "Asia"

# Validate solution before import
pac solution online-version \
  --solution-name "TVSBrokerPortal"
```

## Common Patterns

### Full CI/CD Export Pipeline

```bash
#!/bin/bash
set -euo pipefail

SOLUTION_NAME="${1:?Usage: export.sh <SolutionName>}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)
EXPORT_DIR="./solutions/exports/${TIMESTAMP}"
mkdir -p "${EXPORT_DIR}"

pac auth select --index 1  # dev environment

# Export both managed and unmanaged
pac solution export \
  --name "${SOLUTION_NAME}" \
  --path "${EXPORT_DIR}/${SOLUTION_NAME}_managed.zip" \
  --managed true

pac solution export \
  --name "${SOLUTION_NAME}" \
  --path "${EXPORT_DIR}/${SOLUTION_NAME}_unmanaged.zip" \
  --managed false

# Unpack for source control diff
pac solution unpack \
  --zipfile "${EXPORT_DIR}/${SOLUTION_NAME}_unmanaged.zip" \
  --folder "${EXPORT_DIR}/${SOLUTION_NAME}-src/" \
  --packagetype Both

# Run solution checker
pac solution check \
  --path "${EXPORT_DIR}/${SOLUTION_NAME}_managed.zip" \
  --outputDirectory "${EXPORT_DIR}/check-results/"

echo "Exported to ${EXPORT_DIR}"
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `AuthProfileNotFound` | No active auth profile | Run `pac auth create` or `pac auth select` |
| `SolutionImportFailed` | Missing dependencies | Check `pac solution check` output for dependency chain |
| `PublishAllXmlFailed` | Customization conflict | Export, diff, resolve conflicts, re-import |
| `EnvironmentNotFound` | Wrong region or URL | Verify URL matches `pac env list` output |
| `CanvasPackFailed` | Corrupt .msapp source | Re-unpack from known good .msapp, check for binary files |
