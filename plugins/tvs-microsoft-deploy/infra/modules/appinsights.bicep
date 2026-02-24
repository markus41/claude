// ============================================================================
// Rosa Holdings - Application Insights Module
// Creates appi-rosa-holdings-{env} with Log Analytics workspace
// Alert rules for function failures, 5xx responses, and high latency
// ============================================================================

@description('Name of the Application Insights resource')
param appInsightsName string

@description('Name of the Log Analytics workspace')
param logAnalyticsName string

@description('Azure region')
param location string

@description('Resource tags')
param tags object

@description('Deployment environment')
@allowed(['dev', 'staging', 'prod'])
param environment string

// ── Variables ───────────────────────────────────────────────────────────────

var retentionDays = environment == 'prod' ? 90 : 30
var actionGroupName = 'ag-rosa-${environment}'
var alertEmail = environment == 'prod' ? 'ops@rosaholdings.com' : 'dev@rosaholdings.com'

// ── Log Analytics Workspace ─────────────────────────────────────────────────

resource logAnalytics 'Microsoft.OperationalInsights/workspaces@2022-10-01' = {
  name: logAnalyticsName
  location: location
  tags: tags
  properties: {
    sku: {
      name: 'PerGB2018'
    }
    retentionInDays: retentionDays
    features: {
      enableLogAccessUsingOnlyResourcePermissions: true
    }
    workspaceCapping: {
      dailyQuotaGb: environment == 'prod' ? 5 : 1
    }
  }
}

// ── Application Insights ────────────────────────────────────────────────────

resource appInsights 'Microsoft.Insights/components@2020-02-02' = {
  name: appInsightsName
  location: location
  tags: tags
  kind: 'web'
  properties: {
    Application_Type: 'web'
    WorkspaceResourceId: logAnalytics.id
    RetentionInDays: retentionDays
    IngestionMode: 'LogAnalytics'
    publicNetworkAccessForIngestion: 'Enabled'
    publicNetworkAccessForQuery: 'Enabled'
    DisableIpMasking: false
  }
}

// ── Action Group (for alert notifications) ──────────────────────────────────

resource actionGroup 'Microsoft.Insights/actionGroups@2023-01-01' = {
  name: actionGroupName
  location: 'global'
  tags: tags
  properties: {
    groupShortName: 'RosaOps'
    enabled: true
    emailReceivers: [
      {
        name: 'OpsTeam'
        emailAddress: alertEmail
        useCommonAlertSchema: true
      }
    ]
  }
}

// ── Alert: Function Failures ────────────────────────────────────────────────

resource functionFailureAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'alert-func-failures-${environment}'
  location: location
  tags: tags
  properties: {
    displayName: 'Function Execution Failures - ${environment}'
    description: 'Triggers when Azure Function executions fail more than 5 times in 15 minutes'
    severity: environment == 'prod' ? 1 : 3
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [appInsights.id]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where success == false
            | where cloud_RoleName startswith "func-rosa-ingest"
            | summarize failureCount = count() by bin(timestamp, 15m), operation_Name
            | where failureCount > 5
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

// ── Alert: 5xx Responses ────────────────────────────────────────────────────

resource serverErrorAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'alert-5xx-responses-${environment}'
  location: location
  tags: tags
  properties: {
    displayName: 'Server Errors (5xx) - ${environment}'
    description: 'Triggers when 5xx server error responses exceed threshold in 10 minutes'
    severity: environment == 'prod' ? 1 : 3
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [appInsights.id]
    windowSize: 'PT10M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where resultCode startswith "5"
            | where cloud_RoleName startswith "func-rosa-ingest"
            | summarize errorCount = count() by bin(timestamp, 10m)
            | where errorCount > 10
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 1
            minFailingPeriodsToAlert: 1
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

// ── Alert: High Latency ─────────────────────────────────────────────────────

resource highLatencyAlert 'Microsoft.Insights/scheduledQueryRules@2023-03-15-preview' = {
  name: 'alert-high-latency-${environment}'
  location: location
  tags: tags
  properties: {
    displayName: 'High Latency (>10s avg) - ${environment}'
    description: 'Triggers when average request duration exceeds 10 seconds over 15 minutes'
    severity: 2
    enabled: true
    evaluationFrequency: 'PT5M'
    scopes: [appInsights.id]
    windowSize: 'PT15M'
    criteria: {
      allOf: [
        {
          query: '''
            requests
            | where cloud_RoleName startswith "func-rosa-ingest"
            | summarize avgDuration = avg(duration) by bin(timestamp, 15m)
            | where avgDuration > 10000
          '''
          timeAggregation: 'Count'
          operator: 'GreaterThan'
          threshold: 0
          failingPeriods: {
            numberOfEvaluationPeriods: 2
            minFailingPeriodsToAlert: 2
          }
        }
      ]
    }
    actions: {
      actionGroups: [actionGroup.id]
    }
  }
}

// ── Outputs ─────────────────────────────────────────────────────────────────

output connectionString string = appInsights.properties.ConnectionString
output instrumentationKey string = appInsights.properties.InstrumentationKey
output appInsightsId string = appInsights.id
output logAnalyticsWorkspaceId string = logAnalytics.id
