// ============================================================================
// Rosa Holdings - Azure Functions Module
// Creates func-rosa-ingest-{env} on Linux Consumption plan with Node.js 20
// System-assigned managed identity for Key Vault access
// ============================================================================

@description('Name of the Function App')
param functionAppName string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Key Vault name for secret references')
param keyVaultName string

@description('Application Insights connection string')
param appInsightsConnectionString string

@description('Application Insights instrumentation key')
param appInsightsInstrumentationKey string

@description('CORS allowed origins for broker portal')
param corsOrigins array

// ── Variables ───────────────────────────────────────────────────────────────

var hostingPlanName = 'asp-rosa-ingest-${environment}'
var storageAccountName = replace('strosa${environment}${take(uniqueString(resourceGroup().id), 4)}', '-', '')

// ── Storage Account (required for Functions) ────────────────────────────────

resource storageAccount 'Microsoft.Storage/storageAccounts@2023-01-01' = {
  name: storageAccountName
  location: location
  tags: tags
  kind: 'StorageV2'
  sku: {
    name: 'Standard_LRS'
  }
  properties: {
    supportsHttpsTrafficOnly: true
    minimumTlsVersion: 'TLS1_2'
    allowBlobPublicAccess: false
    defaultToOAuthAuthentication: true
  }
}

// ── Consumption Plan ────────────────────────────────────────────────────────

resource hostingPlan 'Microsoft.Web/serverfarms@2023-01-01' = {
  name: hostingPlanName
  location: location
  tags: tags
  kind: 'linux'
  sku: {
    name: 'Y1'
    tier: 'Dynamic'
  }
  properties: {
    reserved: true
  }
}

// ── Function App ────────────────────────────────────────────────────────────

resource functionApp 'Microsoft.Web/sites@2023-01-01' = {
  name: functionAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'rosa-ingest'
  })
  kind: 'functionapp,linux'
  identity: {
    type: 'SystemAssigned'
  }
  properties: {
    serverFarmId: hostingPlan.id
    httpsOnly: true
    publicNetworkAccess: 'Enabled'
    siteConfig: {
      linuxFxVersion: 'NODE|20'
      ftpsState: 'Disabled'
      minTlsVersion: '1.2'
      http20Enabled: true
      cors: {
        allowedOrigins: corsOrigins
        supportCredentials: true
      }
      appSettings: [
        {
          name: 'AzureWebJobsStorage'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTAZUREFILECONNECTIONSTRING'
          value: 'DefaultEndpointsProtocol=https;AccountName=${storageAccount.name};EndpointSuffix=${az.environment().suffixes.storage};AccountKey=${storageAccount.listKeys().keys[0].value}'
        }
        {
          name: 'WEBSITE_CONTENTSHARE'
          value: functionAppName
        }
        {
          name: 'FUNCTIONS_EXTENSION_VERSION'
          value: '~4'
        }
        {
          name: 'FUNCTIONS_WORKER_RUNTIME'
          value: 'node'
        }
        {
          name: 'WEBSITE_NODE_DEFAULT_VERSION'
          value: '~20'
        }
        {
          name: 'APPLICATIONINSIGHTS_CONNECTION_STRING'
          value: appInsightsConnectionString
        }
        {
          name: 'APPINSIGHTS_INSTRUMENTATIONKEY'
          value: appInsightsInstrumentationKey
        }
        {
          name: 'ENVIRONMENT'
          value: environment
        }
        {
          name: 'KEY_VAULT_NAME'
          value: keyVaultName
        }
        // Key Vault references for secrets
        {
          name: 'STRIPE_SECRET_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=STRIPE-SECRET-KEY)'
        }
        {
          name: 'STRIPE_WEBHOOK_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=STRIPE-WEBHOOK-SECRET)'
        }
        {
          name: 'FIREBASE_SERVICE_ACCOUNT'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=FIREBASE-SERVICE-ACCOUNT)'
        }
        {
          name: 'PAYLOCITY_API_KEY'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=PAYLOCITY-API-KEY)'
        }
        {
          name: 'GRAPH_CLIENT_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=GRAPH-CLIENT-SECRET)'
        }
        {
          name: 'FABRIC_TOKEN'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=FABRIC-TOKEN)'
        }
        {
          name: 'DATAVERSE_CLIENT_SECRET'
          value: '@Microsoft.KeyVault(VaultName=${keyVaultName};SecretName=DATAVERSE-CLIENT-SECRET)'
        }
        // Dataverse configuration
        {
          name: 'DATAVERSE_TVS_URL'
          value: 'https://org-tvs-${environment}.crm.dynamics.com'
        }
        {
          name: 'DATAVERSE_CONSULTING_URL'
          value: 'https://org-consulting-${environment}.crm.dynamics.com'
        }
        // OneLake / Fabric configuration
        {
          name: 'ONELAKE_ACCOUNT'
          value: 'onelake'
        }
        {
          name: 'FABRIC_WORKSPACE_TVS'
          value: 'Rosa Holdings - TVS'
        }
        {
          name: 'FABRIC_WORKSPACE_A3'
          value: 'Rosa Holdings - A3 Archive'
        }
      ]
    }
  }
}

// ── Outputs ─────────────────────────────────────────────────────────────────

output functionAppId string = functionApp.id
output defaultHostName string = functionApp.properties.defaultHostName
output principalId string = functionApp.identity.principalId
output functionAppName string = functionApp.name
