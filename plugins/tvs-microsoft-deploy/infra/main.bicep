// ============================================================================
// Rosa Holdings - Main Bicep Deployment
// Deploys all Azure infrastructure for the Rosa Holdings multi-entity platform
// Resource Group: rg-rosa-holdings-{env}
// ============================================================================

targetScope = 'resourceGroup'

// ── Parameters ──────────────────────────────────────────────────────────────

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string

@description('Azure region for all resources')
param location string = resourceGroup().location

@description('Base name prefix for all resources')
param baseName string = 'rosa-holdings'

@description('Tags applied to all resources')
param tags object = {
  'entity': 'rosa-holdings'
  'managed-by': 'bicep'
  'environment': environment
  'project': 'rosa-microsoft-deploy'
}

@description('Broker portal custom domain (optional)')
param portalCustomDomain string = ''

@description('Static Web App SKU - Free for dev, Standard for prod')
@allowed(['Free', 'Standard'])
param staticWebAppSku string = environment == 'prod' ? 'Standard' : 'Free'

@description('Functions app allowed CORS origins')
param corsOrigins array = environment == 'prod'
  ? ['https://broker.rosaholdings.com']
  : ['http://localhost:3000', 'https://stapp-broker-portal-${environment}.azurestaticapps.net']

// ── Variables ───────────────────────────────────────────────────────────────

var keyVaultName = 'kv-rosa-holdings-${environment}'
var functionAppName = 'func-rosa-ingest-${environment}'
var staticWebAppName = 'stapp-broker-portal-${environment}'
var appInsightsName = 'appi-rosa-holdings-${environment}'
var logAnalyticsName = 'log-rosa-holdings-${environment}'

// ── Modules ─────────────────────────────────────────────────────────────────

module appInsights 'modules/appinsights.bicep' = {
  name: 'deploy-appinsights-${environment}'
  params: {
    appInsightsName: appInsightsName
    logAnalyticsName: logAnalyticsName
    location: location
    tags: tags
    environment: environment
  }
}

module keyVault 'modules/keyvault.bicep' = {
  name: 'deploy-keyvault-${environment}'
  params: {
    keyVaultName: keyVaultName
    location: location
    tags: tags
    environment: environment
    functionAppPrincipalId: functions.outputs.principalId
  }
}

module functions 'modules/functions.bicep' = {
  name: 'deploy-functions-${environment}'
  params: {
    functionAppName: functionAppName
    location: location
    tags: tags
    environment: environment
    keyVaultName: keyVaultName
    appInsightsConnectionString: appInsights.outputs.connectionString
    appInsightsInstrumentationKey: appInsights.outputs.instrumentationKey
    corsOrigins: corsOrigins
  }
}

module staticWebApp 'modules/staticwebapp.bicep' = {
  name: 'deploy-staticwebapp-${environment}'
  params: {
    staticWebAppName: staticWebAppName
    location: location
    tags: tags
    sku: staticWebAppSku
    customDomain: portalCustomDomain
    functionAppResourceId: functions.outputs.functionAppId
  }
}

// ── Outputs ─────────────────────────────────────────────────────────────────

output keyVaultUri string = keyVault.outputs.keyVaultUri
output functionAppHostname string = functions.outputs.defaultHostName
output functionAppPrincipalId string = functions.outputs.principalId
output staticWebAppHostname string = staticWebApp.outputs.defaultHostName
output staticWebAppUrl string = staticWebApp.outputs.url
output appInsightsConnectionString string = appInsights.outputs.connectionString
output logAnalyticsWorkspaceId string = appInsights.outputs.logAnalyticsWorkspaceId
