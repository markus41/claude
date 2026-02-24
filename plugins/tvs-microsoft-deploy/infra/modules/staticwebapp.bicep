// ============================================================================
// Rosa Holdings - Static Web App Module
// Creates stapp-broker-portal-{env} for the broker portal SPA
// Free tier for dev, Standard for prod. API backend linked to Functions app.
// ============================================================================

@description('Name of the Static Web App')
param staticWebAppName string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('SKU tier: Free for dev, Standard for prod')
@allowed(['Free', 'Standard'])
param sku string

@description('Custom domain for the portal (empty string to skip)')
param customDomain string

@description('Resource ID of the linked Functions app for API backend')
param functionAppResourceId string

// ── Static Web App ──────────────────────────────────────────────────────────

resource staticWebApp 'Microsoft.Web/staticSites@2023-01-01' = {
  name: staticWebAppName
  location: location
  tags: union(tags, {
    'azd-service-name': 'broker-portal'
  })
  sku: {
    name: sku
    tier: sku
  }
  properties: {
    stagingEnvironmentPolicy: sku == 'Standard' ? 'Enabled' : 'Disabled'
    allowConfigFileUpdates: true
    buildProperties: {
      appLocation: '/portal'
      apiLocation: ''
      outputLocation: 'dist'
      appBuildCommand: 'npm run build'
    }
  }
}

// ── API Backend Link (Functions) ────────────────────────────────────────────

resource apiBackend 'Microsoft.Web/staticSites/linkedBackends@2023-01-01' = {
  parent: staticWebApp
  name: 'rosa-ingest-backend'
  properties: {
    backendResourceId: functionAppResourceId
    region: location
  }
}

// ── Custom Domain (conditional) ─────────────────────────────────────────────

resource domain 'Microsoft.Web/staticSites/customDomains@2023-01-01' = if (!empty(customDomain)) {
  parent: staticWebApp
  name: !empty(customDomain) ? customDomain : 'placeholder.example.com'
  properties: {
    validationMethod: 'cname-delegation'
  }
}

// ── App Settings ────────────────────────────────────────────────────────────

resource appSettings 'Microsoft.Web/staticSites/config@2023-01-01' = {
  parent: staticWebApp
  name: 'appsettings'
  properties: {
    REACT_APP_API_BASE_URL: '/api'
    REACT_APP_STRIPE_PUBLISHABLE_KEY: 'pk_placeholder'
  }
}

// ── Static Web App Configuration (routes, auth) ─────────────────────────────

// Note: Full route config should be in portal/staticwebapp.config.json
// This Bicep manages infrastructure-level settings only

// ── Outputs ─────────────────────────────────────────────────────────────────

output defaultHostName string = staticWebApp.properties.defaultHostname
output url string = 'https://${staticWebApp.properties.defaultHostname}'
output staticWebAppId string = staticWebApp.id
output staticWebAppName string = staticWebApp.name
output apiKey string = staticWebApp.listSecrets().properties.apiKey
