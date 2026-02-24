---
name: Azure CLI (az)
description: This skill should be used when working with *.bicep files, infra/**, *.arm templates, rg-tvs-* resource groups, or az-* prefixed resources. It provides Azure CLI operations for infrastructure provisioning, Key Vault secrets management, Azure Functions deployment, Static Web App hosting, and monitoring across TVS Holdings Azure tenancy.
version: 1.0.0
---

# Azure CLI (az) Operations

Complete reference for Azure resource management across TVS Holdings entities.

## Resource Group Naming Convention

Pattern: `rg-tvs-{entity}-{env}`

| Entity | Dev | Test | Prod |
|--------|-----|------|------|
| TVS Motor | rg-tvs-tvs-dev | rg-tvs-tvs-test | rg-tvs-tvs-prod |
| Consulting | rg-tvs-consulting-dev | rg-tvs-consulting-test | rg-tvs-consulting-prod |
| Lobbi Platform | rg-tvs-lobbi-dev | rg-tvs-lobbi-test | rg-tvs-lobbi-prod |
| Media | rg-tvs-media-dev | rg-tvs-media-test | rg-tvs-media-prod |
| A3 Archive | rg-tvs-a3archive-dev | rg-tvs-a3archive-test | rg-tvs-a3archive-prod |
| Consolidated | rg-tvs-consolidated-dev | rg-tvs-consolidated-test | rg-tvs-consolidated-prod |

## Resource Group Management

```bash
# Create resource group
az group create \
  --name "rg-tvs-tvs-prod" \
  --location "eastus2" \
  --tags "entity=tvs" "env=prod" "managed-by=claude-deploy"

# List resource groups by entity
az group list \
  --query "[?starts_with(name, 'rg-tvs-tvs')]" \
  --output table

# Tag all resources in a group
az group update \
  --name "rg-tvs-tvs-prod" \
  --set tags.costCenter="TVS-IT-001"
```

## Bicep / ARM Deployments

```bash
# Deploy Bicep template
az deployment group create \
  --resource-group "rg-tvs-tvs-prod" \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/parameters/tvs-prod.json" \
  --name "deploy-$(date +%Y%m%d%H%M%S)" \
  --mode Incremental

# Validate before deploying
az deployment group validate \
  --resource-group "rg-tvs-tvs-prod" \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/parameters/tvs-prod.json"

# What-if analysis (dry run)
az deployment group what-if \
  --resource-group "rg-tvs-tvs-prod" \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/parameters/tvs-prod.json"

# Export ARM template from existing resources
az group export \
  --name "rg-tvs-tvs-prod" \
  --output-folder "./infra/exported/"
```

## Key Vault Operations (kv-tvs-holdings)

```bash
# Create Key Vault
az keyvault create \
  --name "kv-tvs-holdings" \
  --resource-group "rg-tvs-consolidated-prod" \
  --location "eastus2" \
  --sku standard \
  --enabled-for-deployment true \
  --enabled-for-template-deployment true

# Set secrets
az keyvault secret set \
  --vault-name "kv-tvs-holdings" \
  --name "stripe-api-key-tvs" \
  --value "${STRIPE_SECRET_KEY}"

az keyvault secret set \
  --vault-name "kv-tvs-holdings" \
  --name "fabric-client-secret" \
  --value "${FABRIC_CLIENT_SECRET}"

az keyvault secret set \
  --vault-name "kv-tvs-holdings" \
  --name "firebase-service-account" \
  --file "./secrets/firebase-sa.json" \
  --encoding utf-8

# Retrieve secrets
az keyvault secret show \
  --vault-name "kv-tvs-holdings" \
  --name "stripe-api-key-tvs" \
  --query "value" \
  --output tsv

# List all secrets (names only)
az keyvault secret list \
  --vault-name "kv-tvs-holdings" \
  --query "[].name" \
  --output tsv

# Set access policy for Function App managed identity
az keyvault set-policy \
  --name "kv-tvs-holdings" \
  --object-id "${FUNC_APP_IDENTITY_ID}" \
  --secret-permissions get list

# Rotate secret and update version
az keyvault secret set \
  --vault-name "kv-tvs-holdings" \
  --name "graph-api-client-secret" \
  --value "${NEW_CLIENT_SECRET}" \
  --tags "rotated=$(date -I)" "entity=consolidated"
```

## Azure Functions Deployment (func-tvs-ingest)

```bash
# Create Function App
az functionapp create \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod" \
  --storage-account "sttvsconsolidated" \
  --consumption-plan-location "eastus2" \
  --runtime "node" \
  --runtime-version "20" \
  --functions-version "4" \
  --os-type "Linux" \
  --assign-identity "[system]"

# Deploy function code
az functionapp deployment source config-zip \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod" \
  --src "./functions/func-tvs-ingest.zip"

# Configure app settings
az functionapp config appsettings set \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod" \
  --settings \
    "FABRIC_WORKSPACE_ID=ws-consolidated-prod-id" \
    "STRIPE_WEBHOOK_SECRET=@Microsoft.KeyVault(VaultName=kv-tvs-holdings;SecretName=stripe-webhook-secret)" \
    "FIREBASE_PROJECT_ID=a3-archive-legacy"

# Enable Key Vault references
az functionapp identity assign \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod"

# List function keys
az functionapp keys list \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod"

# View function logs (live tail)
az functionapp log tail \
  --name "func-tvs-ingest" \
  --resource-group "rg-tvs-consolidated-prod"
```

## Static Web App (Broker Portal)

```bash
# Create Static Web App
az staticwebapp create \
  --name "swa-tvs-broker-portal" \
  --resource-group "rg-tvs-tvs-prod" \
  --location "eastus2" \
  --sku "Standard" \
  --source "https://github.com/tvs-holdings/broker-portal" \
  --branch "main" \
  --app-location "/app" \
  --output-location "/dist" \
  --api-location "/api"

# Deploy from local build
az staticwebapp deploy \
  --name "swa-tvs-broker-portal" \
  --resource-group "rg-tvs-tvs-prod" \
  --app-location "./dist" \
  --api-location "./api/dist"

# Configure custom domain
az staticwebapp hostname set \
  --name "swa-tvs-broker-portal" \
  --resource-group "rg-tvs-tvs-prod" \
  --hostname "broker.tvs.tvsh.com"

# Set environment variables
az staticwebapp appsettings set \
  --name "swa-tvs-broker-portal" \
  --resource-group "rg-tvs-tvs-prod" \
  --setting-names \
    "VITE_API_URL=https://func-tvs-ingest.azurewebsites.net" \
    "VITE_STRIPE_PK=pk_live_xxxx"

# Create staging environment from PR
az staticwebapp environment list \
  --name "swa-tvs-broker-portal" \
  --resource-group "rg-tvs-tvs-prod"
```

## Application Insights & Monitoring

```bash
# Create Application Insights
az monitor app-insights component create \
  --app "ai-tvs-consolidated" \
  --location "eastus2" \
  --resource-group "rg-tvs-consolidated-prod" \
  --kind "web" \
  --application-type "web"

# Query logs (KQL)
az monitor app-insights query \
  --app "ai-tvs-consolidated" \
  --analytics-query "
    requests
    | where timestamp > ago(1h)
    | where resultCode >= 400
    | summarize count() by name, resultCode
    | order by count_ desc
  "

# Create alert rule
az monitor metrics alert create \
  --name "alert-func-tvs-ingest-errors" \
  --resource-group "rg-tvs-consolidated-prod" \
  --scopes "/subscriptions/{sub-id}/resourceGroups/rg-tvs-consolidated-prod/providers/Microsoft.Web/sites/func-tvs-ingest" \
  --condition "count requests/failed > 10" \
  --window-size "5m" \
  --evaluation-frequency "1m" \
  --severity 2

# Get live metrics stream connection string
az monitor app-insights component show \
  --app "ai-tvs-consolidated" \
  --resource-group "rg-tvs-consolidated-prod" \
  --query "connectionString" \
  --output tsv
```

## Azure AD App Registration

```bash
# Create app registration for Fabric API access
az ad app create \
  --display-name "tvs-fabric-automation" \
  --sign-in-audience "AzureADMyOrg" \
  --required-resource-accesses '[{
    "resourceAppId": "00000003-0000-0000-c000-000000000000",
    "resourceAccess": [
      {"id": "e1fe6dd8-ba31-4d61-89e7-88639da4683d", "type": "Scope"},
      {"id": "7ab1d382-f21e-4acd-a863-ba3e13f7da61", "type": "Role"}
    ]
  }]'

# Create client secret
az ad app credential reset \
  --id "${APP_ID}" \
  --display-name "fabric-automation-secret" \
  --years 1 \
  --query "password" \
  --output tsv

# Create service principal
az ad sp create --id "${APP_ID}"

# Assign role to resource group
az role assignment create \
  --assignee "${APP_ID}" \
  --role "Contributor" \
  --scope "/subscriptions/{sub-id}/resourceGroups/rg-tvs-consolidated-prod"
```

## Common Deployment Script

```bash
#!/bin/bash
set -euo pipefail

ENTITY="${1:?Usage: deploy.sh <entity> <env>}"
ENV="${2:?Usage: deploy.sh <entity> <env>}"
RG="rg-tvs-${ENTITY}-${ENV}"
TIMESTAMP=$(date +%Y%m%d%H%M%S)

echo "Deploying to ${RG}..."

# Validate
az deployment group validate \
  --resource-group "${RG}" \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/parameters/${ENTITY}-${ENV}.json"

# Deploy
az deployment group create \
  --resource-group "${RG}" \
  --template-file "./infra/main.bicep" \
  --parameters "./infra/parameters/${ENTITY}-${ENV}.json" \
  --name "deploy-${TIMESTAMP}" \
  --mode Incremental \
  --no-wait false

echo "Deployment ${TIMESTAMP} complete for ${RG}"
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `AuthorizationFailed` | Insufficient RBAC | `az role assignment create` for the identity |
| `ResourceGroupNotFound` | RG doesn't exist | Create with `az group create` first |
| `DeploymentFailed` | Bicep/ARM error | Check `az deployment group show --name <name>` |
| `KeyVaultAccessDenied` | Missing access policy | `az keyvault set-policy` for the caller |
| `QuotaExceeded` | Subscription limit | Request quota increase or use different region |
