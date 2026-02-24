// ============================================================================
// TVS Holdings - Key Vault Module
// Creates Azure Key Vault with RBAC authorization, soft delete, purge protection
// Stores secrets for Stripe, Firebase, Paylocity, Graph API, Fabric
// ============================================================================

@description('Name of the Key Vault')
param keyVaultName string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Principal ID of the Functions app managed identity')
param functionAppPrincipalId string

// ── Variables ───────────────────────────────────────────────────────────────

var softDeleteRetentionDays = environment == 'prod' ? 90 : 30
var enablePurgeProtection = environment == 'prod' ? true : false

// Secret names that must be populated via seed_keyvault.sh or CI/CD
var secretNames = [
  'STRIPE-SECRET-KEY'
  'STRIPE-WEBHOOK-SECRET'
  'FIREBASE-SERVICE-ACCOUNT'
  'PAYLOCITY-API-KEY'
  'GRAPH-CLIENT-SECRET'
  'FABRIC-TOKEN'
  'DATAVERSE-CLIENT-SECRET'
  'SENDGRID-API-KEY'
]

// ── Key Vault ───────────────────────────────────────────────────────────────

resource keyVault 'Microsoft.KeyVault/vaults@2023-07-01' = {
  name: keyVaultName
  location: location
  tags: tags
  properties: {
    tenantId: subscription().tenantId
    sku: {
      family: 'A'
      name: 'standard'
    }
    enableRbacAuthorization: true
    enableSoftDelete: true
    softDeleteRetentionInDays: softDeleteRetentionDays
    enablePurgeProtection: enablePurgeProtection ? true : null
    enabledForDeployment: false
    enabledForDiskEncryption: false
    enabledForTemplateDeployment: true
    publicNetworkAccess: environment == 'prod' ? 'Disabled' : 'Enabled'
    networkAcls: environment == 'prod' ? {
      bypass: 'AzureServices'
      defaultAction: 'Deny'
      ipRules: []
      virtualNetworkRules: []
    } : {
      bypass: 'AzureServices'
      defaultAction: 'Allow'
    }
  }
}

// ── RBAC: Functions App -> Key Vault Secrets User ───────────────────────────

// Key Vault Secrets User role: 4633458b-17de-408a-b874-0445c86b69e6
resource functionAppSecretsRole 'Microsoft.Authorization/roleAssignments@2022-04-01' = {
  name: guid(keyVault.id, functionAppPrincipalId, '4633458b-17de-408a-b874-0445c86b69e6')
  scope: keyVault
  properties: {
    roleDefinitionId: subscriptionResourceId('Microsoft.Authorization/roleDefinitions', '4633458b-17de-408a-b874-0445c86b69e6')
    principalId: functionAppPrincipalId
    principalType: 'ServicePrincipal'
  }
}

// ── Placeholder Secrets (empty, to be populated by seed_keyvault.sh) ────────

resource secrets 'Microsoft.KeyVault/vaults/secrets@2023-07-01' = [for secretName in secretNames: {
  parent: keyVault
  name: secretName
  properties: {
    value: 'PLACEHOLDER-POPULATE-VIA-SEED-SCRIPT'
    contentType: 'text/plain'
    attributes: {
      enabled: true
    }
  }
}]

// ── Diagnostic Settings ─────────────────────────────────────────────────────

resource diagnosticSettings 'Microsoft.Insights/diagnosticSettings@2021-05-01-preview' = if (environment == 'prod') {
  name: '${keyVaultName}-diagnostics'
  scope: keyVault
  properties: {
    logs: [
      {
        category: 'AuditEvent'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 365
        }
      }
    ]
    metrics: [
      {
        category: 'AllMetrics'
        enabled: true
        retentionPolicy: {
          enabled: true
          days: 90
        }
      }
    ]
  }
}

// ── Outputs ─────────────────────────────────────────────────────────────────

output keyVaultUri string = keyVault.properties.vaultUri
output keyVaultId string = keyVault.id
output keyVaultName string = keyVault.name
