---
name: Power Automate REST API
description: This skill should be used when working with flows/**, or *.flow.json files. It provides Power Automate Management API operations for flow deployment across environments, connection reference management, run monitoring, error handling, and scheduled data sync patterns for TVS Holdings automation.
version: 1.0.0
---

> Docs Hub: [Skills Hub](../docs/skills/README.md#skill-index)

# Power Automate REST API Operations

Complete reference for Power Automate flow management across TVS Holdings environments.

## Authentication

```bash
# Acquire token for Power Automate Management API
TOKEN=$(curl -s -X POST \
  "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://service.flow.microsoft.com/.default" \
  -d "grant_type=client_credentials" \
  | jq -r '.access_token')

AUTH="Authorization: Bearer ${TOKEN}"
FLOW_API="https://api.flow.microsoft.com"
ENV_ID="${POWER_PLATFORM_ENV_ID}"  # e.g., Default-{tenant-id} or specific env GUID
```

## Flow Management

### List Flows

```bash
# List all flows in environment
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows?api-version=2016-11-01" \
  | jq '.value[] | {name, displayName: .properties.displayName, state: .properties.state, createdTime: .properties.createdTime}'

# List flows by creator
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows?api-version=2016-11-01&\$filter=properties/creator/userId eq '${USER_ID}'" \
  | jq '.value[] | {displayName: .properties.displayName, state: .properties.state}'
```

### Export Flow

```bash
# Export flow definition as JSON
FLOW_ID="your-flow-guid"

curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}?api-version=2016-11-01" \
  | jq '.properties.definition' > "./flows/${FLOW_ID}.flow.json"

# Export flow as package (for cross-environment transport)
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/exportPackage?api-version=2016-11-01" \
  -d '{
    "includedResourceIds": ["'"${FLOW_ID}"'"],
    "details": {
      "displayName": "TVS Broker Sync Flow Export",
      "description": "Nightly broker data sync from Dataverse to OneLake",
      "creator": "automation@tvsh.com",
      "sourceEnvironment": "'"${ENV_ID}"'"
    }
  }' | jq '{packageLink: .packageLink, status}'
```

### Import Flow

```bash
# Import flow package into target environment
TARGET_ENV_ID="${TARGET_POWER_PLATFORM_ENV_ID}"

# Step 1: Upload package
IMPORT_RESPONSE=$(curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${TARGET_ENV_ID}/importPackage?api-version=2016-11-01" \
  -d '{
    "packageLink": {
      "value": "'"${PACKAGE_DOWNLOAD_URL}"'"
    }
  }')

# Step 2: Get import suggestions (connection mappings needed)
echo "${IMPORT_RESPONSE}" | jq '.properties.resources | to_entries[] | {id: .key, type: .value.type, suggestedCreationType: .value.suggestedCreationType}'

# Step 3: Apply import with connection mappings
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${TARGET_ENV_ID}/importPackage?api-version=2016-11-01" \
  -d '{
    "packageLink": {"value": "'"${PACKAGE_DOWNLOAD_URL}"'"},
    "resources": {
      "'"${FLOW_RESOURCE_ID}"'": {
        "type": "Microsoft.Flow/flows",
        "suggestedCreationType": "Update",
        "creationType": "Update",
        "id": "'"${EXISTING_FLOW_ID_IN_TARGET}"'"
      },
      "'"${CONNECTION_RESOURCE_ID}"'": {
        "type": "Microsoft.PowerApps/apis/connections",
        "creationType": "Existing",
        "id": "'"${TARGET_CONNECTION_ID}"'"
      }
    }
  }'
```

### Create Flow from Definition

```bash
# Create new flow from JSON definition
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows?api-version=2016-11-01" \
  -d '{
    "properties": {
      "displayName": "TVS - Nightly Broker Sync",
      "state": "Stopped",
      "definition": '"$(cat ./flows/broker-sync.flow.json)"',
      "connectionReferences": {
        "shared_commondataserviceforapps": {
          "connectionName": "'"${DATAVERSE_CONNECTION_NAME}"'",
          "id": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps"
        }
      }
    }
  }'
```

## Connection Reference Management

```bash
# List connections in environment
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/connections?api-version=2016-11-01" \
  | jq '.value[] | {name, displayName: .properties.displayName, apiId: .properties.apiId, status: .properties.statuses[0].status}'

# Create new Dataverse connection
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/connections?api-version=2016-11-01" \
  -d '{
    "properties": {
      "apiId": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps",
      "displayName": "Dataverse - TVS Prod",
      "parameterValues": {
        "token:TenantId": "'"${TENANT_ID}"'"
      }
    }
  }'

# Map connections across environments
# dev-connections.json -> test-connections.json -> prod-connections.json
# Pattern: maintain a mapping file per environment
cat > "./flows/connection-map-prod.json" << 'EOF'
{
  "shared_commondataserviceforapps": {
    "connectionName": "shared-commondataserviceforapps-prod-001",
    "id": "/providers/Microsoft.PowerApps/apis/shared_commondataserviceforapps"
  },
  "shared_office365": {
    "connectionName": "shared-office365-prod-001",
    "id": "/providers/Microsoft.PowerApps/apis/shared_office365"
  },
  "shared_keyvault": {
    "connectionName": "shared-keyvault-prod-001",
    "id": "/providers/Microsoft.PowerApps/apis/shared_keyvault"
  }
}
EOF
```

## Flow Run Monitoring

```bash
# List recent flow runs
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/runs?api-version=2016-11-01&\$top=25" \
  | jq '.value[] | {name, status: .properties.status, startTime: .properties.startTime, endTime: .properties.endTime, trigger: .properties.trigger.name}'

# Get specific run details
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/runs/${RUN_ID}?api-version=2016-11-01" \
  | jq '{status: .properties.status, startTime: .properties.startTime, error: .properties.error, trigger: .properties.trigger}'

# Get run action details (step-by-step execution)
curl -s -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/runs/${RUN_ID}/actions?api-version=2016-11-01" \
  | jq '.value[] | {name, status: .properties.status, startTime: .properties.startTime, code: .properties.code, error: .properties.error}'

# Cancel a running flow
curl -s -X POST -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/runs/${RUN_ID}/cancel?api-version=2016-11-01"

# Re-submit a failed run
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/triggers/${TRIGGER_NAME}/run?api-version=2016-11-01" \
  -d '{}'
```

## Flow State Management

```bash
# Turn on flow
curl -s -X POST -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/start?api-version=2016-11-01"

# Turn off flow
curl -s -X POST -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}/stop?api-version=2016-11-01"

# Delete flow
curl -s -X DELETE -H "${AUTH}" \
  "${FLOW_API}/providers/Microsoft.ProcessSimple/environments/${ENV_ID}/flows/${FLOW_ID}?api-version=2016-11-01"
```

## Scheduled Flow Patterns for Data Sync

### Nightly Broker Sync (Dataverse to OneLake)

```json
{
  "definition": {
    "$schema": "https://schema.management.azure.com/providers/Microsoft.Logic/schemas/2016-06-01/workflowdefinition.json#",
    "triggers": {
      "Recurrence": {
        "type": "Recurrence",
        "recurrence": {
          "frequency": "Day",
          "interval": 1,
          "startTime": "2026-01-01T02:00:00Z",
          "timeZone": "Eastern Standard Time",
          "schedule": {"hours": ["2"], "minutes": ["0"]}
        }
      }
    },
    "actions": {
      "Get_Modified_Brokers": {
        "type": "OpenApiConnection",
        "inputs": {
          "host": {"connectionName": "shared_commondataserviceforapps"},
          "operationId": "ListRecordsWithOrganization",
          "parameters": {
            "entityName": "tvs_brokers",
            "$filter": "modifiedon ge @{addDays(utcNow(), -1)}",
            "$select": "tvs_brokerid,tvs_name,tvs_status,tvs_tier,modifiedon"
          }
        },
        "runAfter": {}
      },
      "Transform_to_Parquet": {
        "type": "Compose",
        "inputs": "@body('Get_Modified_Brokers')?['value']",
        "runAfter": {"Get_Modified_Brokers": ["Succeeded"]}
      },
      "Upload_to_OneLake": {
        "type": "Http",
        "inputs": {
          "method": "PUT",
          "uri": "https://onelake.dfs.fabric.microsoft.com/@{variables('workspaceId')}/@{variables('lakehouseId')}/Files/staging/brokers/@{formatDateTime(utcNow(),'yyyy-MM-dd')}/brokers.json",
          "headers": {"Authorization": "Bearer @{body('Get_Fabric_Token')?['access_token']}"},
          "body": "@outputs('Transform_to_Parquet')"
        },
        "runAfter": {"Transform_to_Parquet": ["Succeeded"]}
      }
    }
  }
}
```

### Hourly Commission Aggregation

```json
{
  "triggers": {
    "Recurrence": {
      "type": "Recurrence",
      "recurrence": {
        "frequency": "Hour",
        "interval": 1,
        "startTime": "2026-01-01T00:15:00Z",
        "timeZone": "Eastern Standard Time"
      }
    }
  }
}
```

## Error Handling Patterns

```json
{
  "actions": {
    "Try_Scope": {
      "type": "Scope",
      "actions": {
        "Main_Action": {"type": "..."}
      }
    },
    "Catch_Scope": {
      "type": "Scope",
      "runAfter": {"Try_Scope": ["Failed", "TimedOut"]},
      "actions": {
        "Send_Error_Notification": {
          "type": "OpenApiConnection",
          "inputs": {
            "host": {"connectionName": "shared_office365"},
            "operationId": "SendEmailV2",
            "parameters": {
              "emailMessage/To": "alerts@tvsh.com",
              "emailMessage/Subject": "Flow Failed: @{workflow().name}",
              "emailMessage/Body": "Run ID: @{workflow().run.name}\nError: @{result('Try_Scope')[0]?['error']?['message']}"
            }
          }
        },
        "Log_to_Application_Insights": {
          "type": "Http",
          "inputs": {
            "method": "POST",
            "uri": "https://func-tvs-ingest.azurewebsites.net/api/log-flow-error",
            "body": {
              "flowName": "@{workflow().name}",
              "runId": "@{workflow().run.name}",
              "error": "@{result('Try_Scope')[0]?['error']}",
              "timestamp": "@{utcNow()}"
            }
          }
        }
      }
    }
  }
}
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `ConnectionNotConfigured` | Missing or invalid connection | Re-create connection via management API |
| `ActionFailed` with 429 | Dataverse API throttling | Add retry policy with exponential backoff |
| `TriggerFailed` | Connection auth expired | Refresh connection credentials |
| `FlowRunTimedOut` | Run exceeded 30-day limit | Break into child flows with shorter execution |
| `ExpressionEvaluationFailed` | Bad expression syntax | Validate expressions in Power Automate designer |
| `InvalidTemplate` on import | Version mismatch | Update `apiVersion` in definition schema |
