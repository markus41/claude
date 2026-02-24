---
name: tvs:deploy-azure
description: Azure infrastructure deployment - Bicep templates for Key Vault, Functions, Static Web Apps, App Insights
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Azure Infrastructure Deployment

Deploys Azure infrastructure for TVS Holdings using Bicep templates. Provisions Key Vault (`kv-tvs-holdings`), Azure Functions (`func-tvs-ingest`), Static Web Apps (`stapp-broker-*`), and Application Insights for monitoring. All resources deployed to a single resource group with consistent tagging.

## Usage

```
/tvs:deploy-azure [--resource kv|func|stapp|insights|all] [--resource-group NAME] [--location eastus]
```

## Prerequisites

```bash
# 1. Azure CLI authenticated
az account show --query "{name:name, id:id, state:state}" -o table \
  || { echo "FAIL: az login required"; exit 1; }

# 2. Correct subscription selected
[ -z "$AZURE_SUBSCRIPTION_ID" ] && { echo "FAIL: AZURE_SUBSCRIPTION_ID not set"; exit 1; }
CURRENT_SUB=$(az account show --query "id" -o tsv)
[ "$CURRENT_SUB" != "$AZURE_SUBSCRIPTION_ID" ] && {
  echo "Switching subscription..."
  az account set --subscription "$AZURE_SUBSCRIPTION_ID"
}

# 3. Verify Bicep templates exist
[ -d "plugins/tvs-microsoft-deploy/infra/" ] || { echo "FAIL: infra/ directory missing"; exit 1; }

# 4. Resource provider registrations
for provider in Microsoft.Web Microsoft.KeyVault Microsoft.Insights Microsoft.Storage; do
  STATE=$(az provider show -n "$provider" --query "registrationState" -o tsv 2>/dev/null)
  [ "$STATE" != "Registered" ] && { echo "WARN: $provider not registered, registering..."; az provider register -n "$provider"; }
done

# 5. Verify service principal credentials for Key Vault seeding
[ -z "$AZURE_CLIENT_ID" ] && echo "WARN: AZURE_CLIENT_ID not set - Key Vault RBAC may need manual config"
```

## 6-Phase Protocol

### Phase 1: EXPLORE (2 agents)

**Agent 1 - Resource Inventory:**
- List existing resource groups: `az group list --query "[?starts_with(name,'rg-tvs')]"`
- Enumerate resources in target group: Key Vaults, Function Apps, Static Web Apps, App Insights
- Check for name availability: `az keyvault check-name --name kv-tvs-holdings`
- Verify quota availability for Function App plan and Static Web App SKU
- Check for resource locks that would prevent deployment

**Agent 2 - Network + Security Auditor:**
- Review existing network security groups and VNet configurations
- Check Key Vault access policies vs. RBAC authorization mode
- Verify managed identity availability for Function App
- Enumerate existing App Insights instances and workspace associations
- Check for Azure Policy assignments that may block deployment

### Phase 2: PLAN (1 agent)

**Agent 3 - Infrastructure Planner:**
- Design resource deployment manifest:
  - Resource Group: `rg-tvs-holdings` (East US)
  - Key Vault: `kv-tvs-holdings` (RBAC mode, soft-delete enabled)
  - Function App: `func-tvs-ingest` (Consumption plan, Node.js 20, system-assigned identity)
  - Static Web App: `stapp-broker-portal` (Standard tier, custom domain ready)
  - Static Web App: `stapp-broker-dashboard` (Standard tier)
  - App Insights: `ai-tvs-holdings` (workspace-based, Log Analytics workspace)
- Plan Bicep parameter files per environment (dev, staging, prod)
- Design Key Vault secret structure:
  - `stripe-secret-key`, `stripe-webhook-secret`
  - `dataverse-client-id`, `dataverse-client-secret`
  - `fabric-token`, `firebase-service-account`
  - `graph-api-token`
- Calculate monthly cost estimate per resource
- Plan deployment order: resource group, Key Vault, App Insights, Functions, Static Web Apps

### Phase 3: CODE (2 agents)

**Agent 4 - Bicep Deployer:**
- Validate Bicep templates: `az bicep build --file infra/main.bicep`
- Deploy resource group: `az group create --name rg-tvs-holdings --location eastus`
- Deploy infrastructure via Bicep:
  ```bash
  az deployment group create \
    --resource-group rg-tvs-holdings \
    --template-file plugins/tvs-microsoft-deploy/infra/main.bicep \
    --parameters plugins/tvs-microsoft-deploy/infra/parameters.prod.json
  ```
- Enable Key Vault RBAC authorization
- Assign Function App managed identity Key Vault Secrets Reader role
- Configure App Insights connection string in Function App settings

**Agent 5 - Function + Static App Deployer:**
- Deploy Function App code from `plugins/tvs-microsoft-deploy/functions/`
- Configure function app settings:
  - `STRIPE_SECRET_KEY` -> Key Vault reference `@Microsoft.KeyVault(SecretUri=...)`
  - `DATAVERSE_URL` -> `$TVS_DATAVERSE_ENV_URL`
  - `APPLICATIONINSIGHTS_CONNECTION_STRING` -> from App Insights deployment
- Deploy function endpoints:
  - `stripe-webhook` - receives Stripe subscription events, updates Dataverse
  - `dataverse-sync` - timer-triggered sync between Dataverse and OneLake
  - `health` - health check endpoint for monitoring
- Configure Static Web App deployment: link to GitHub repo or deploy from local build
- Set up custom domain configuration (if domain available)
- Configure CORS for portal and dashboard origins

### Phase 4: TEST (2 agents)

**Agent 6 - Infrastructure Tester:**
- Verify resource group exists with correct tags
- Test Key Vault: create and retrieve a test secret
- Verify Function App responds: `curl https://func-tvs-ingest.azurewebsites.net/api/health`
- Confirm Static Web Apps return 200 on root URL
- Verify App Insights is receiving telemetry from Function App
- Check managed identity can read Key Vault secrets

**Agent 7 - Integration Tester:**
- Send test Stripe webhook to `func-tvs-ingest/api/stripe-webhook`
- Verify function processes event and logs to App Insights
- Test Key Vault reference resolution in Function App settings
- Confirm Static Web App serves portal assets correctly
- Verify CORS headers allow portal domain to call function endpoints
- Test diagnostic logging flows to Log Analytics workspace

### Phase 5: FIX (1 agent)

**Agent 8 - Azure Remediator:**
- Fix deployment failures from naming conflicts (append unique suffix)
- Resolve Key Vault soft-delete conflicts (purge if necessary with confirmation)
- Handle Function App cold start issues by configuring always-on or pre-warm
- Fix CORS misconfigurations preventing portal-to-function calls
- Resolve managed identity permission propagation delays (wait and retry)
- Reference `orchestration-protocol-enforcer` hook for retry policy

### Phase 6: DOCUMENT (1 agent)

**Agent 9 - Azure Documenter:**
- Generate infrastructure report: resource IDs, URLs, SKUs, costs
- Document Key Vault secret inventory (names only, not values)
- Record Function App endpoints and expected request/response formats
- List Static Web App URLs and deployment status
- Log deployment via `mcp__deploy-intelligence__deploy_record_build`

## Orchestration Hook

Governed by `orchestration-protocol-enforcer` hook. Minimum 5 sub-agents enforced. Azure deployment depends on `tvs:deploy-identity` for service principal secrets to seed in Key Vault.

## Cost Estimates

| Resource | SKU | Est. Monthly |
|----------|-----|-------------|
| Key Vault | Standard | ~$5 |
| Function App | Consumption | ~$0 (free tier) - $20 |
| Static Web App x2 | Standard | ~$18 |
| App Insights | Pay-as-you-go | ~$10-30 |
| Log Analytics | Pay-as-you-go | ~$5-15 |
| **Total Azure** | | **~$38-88/mo** |
