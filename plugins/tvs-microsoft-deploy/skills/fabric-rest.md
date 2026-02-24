---
name: Microsoft Fabric REST API
description: This skill should be used when working with fabric/**, *.ipynb notebooks, onelake/**, or notebooks/** paths. It provides Microsoft Fabric REST API patterns for workspace management, lakehouse operations, notebook deployment, OneLake shortcut creation, and capacity management across TVS Holdings Fabric tenancy.
version: 1.0.0
---

> Docs Hub: [Skills Hub](../docs/skills/README.md#skill-index)

# Microsoft Fabric REST API Operations

Complete reference for Fabric REST API operations across TVS Holdings workspaces.

## Workspace IDs

| Entity | Workspace Name | Workspace ID | Purpose |
|--------|---------------|--------------|---------|
| TVS Motor | tvs-prod | `ws-tvs-prod-00000001` | Broker, commission, carrier data |
| Consulting | consulting-prod | `ws-consulting-prod-00000002` | Consulting project data |
| Lobbi Platform | lobbi-platform-prod | `ws-lobbi-prod-00000003` | Property management data |
| Media | media-prod | `ws-media-prod-00000004` | Content and campaign data |
| A3 Archive | a3-archive-prod | `ws-a3archive-prod-00000005` | Legacy Firebase data migration |
| Consolidated | consolidated-prod | `ws-consolidated-prod-00000006` | Cross-entity analytics hub |

## Authentication

```bash
# Acquire token via service principal
TOKEN=$(curl -s -X POST \
  "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "client_id=${CLIENT_ID}" \
  -d "client_secret=${CLIENT_SECRET}" \
  -d "scope=https://api.fabric.microsoft.com/.default" \
  -d "grant_type=client_credentials" \
  | jq -r '.access_token')

# Common header for all requests
AUTH_HEADER="Authorization: Bearer ${TOKEN}"
BASE_URL="https://api.fabric.microsoft.com/v1"
```

## Workspace Management

```bash
# List workspaces
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/workspaces" \
  | jq '.value[] | {id, displayName, type}'

# Create workspace
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces" \
  -d '{
    "displayName": "tvs-staging",
    "description": "TVS Motor staging workspace",
    "capacityId": "'"${CAPACITY_ID}"'"
  }'

# Assign workspace to capacity
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/assignToCapacity" \
  -d '{"capacityId": "'"${CAPACITY_ID}"'"}'

# Add workspace member
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/roleAssignments" \
  -d '{
    "principal": {
      "id": "'"${USER_OBJECT_ID}"'",
      "type": "User"
    },
    "role": "Contributor"
  }'
```

## Lakehouse Management

```bash
# Create lakehouse
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses" \
  -d '{
    "displayName": "lh_tvs_brokers",
    "description": "TVS Motor broker data lakehouse"
  }'

# List lakehouses in workspace
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses" \
  | jq '.value[] | {id, displayName}'

# List tables in lakehouse
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses/${LAKEHOUSE_ID}/tables" \
  | jq '.data[] | {name, format, location}'

# Load data into table (from OneLake path)
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses/${LAKEHOUSE_ID}/tables/${TABLE_NAME}/load" \
  -d '{
    "relativePath": "Files/staging/brokers/",
    "pathType": "File",
    "mode": "Overwrite",
    "recursive": true,
    "formatOptions": {
      "format": "Parquet",
      "header": true
    }
  }'
```

## Notebook Deployment

```bash
# Upload notebook (base64 encoded .ipynb)
NOTEBOOK_B64=$(base64 -w0 "./notebooks/broker_etl.ipynb")

curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/notebooks" \
  -d '{
    "displayName": "broker_etl",
    "description": "ETL pipeline for broker data ingestion",
    "definition": {
      "format": "ipynb",
      "parts": [
        {
          "path": "notebook-content.ipynb",
          "payload": "'"${NOTEBOOK_B64}"'",
          "payloadType": "InlineBase64"
        }
      ]
    }
  }'

# Update existing notebook
curl -s -X PATCH -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/notebooks/${NOTEBOOK_ID}" \
  -d '{
    "definition": {
      "format": "ipynb",
      "parts": [
        {
          "path": "notebook-content.ipynb",
          "payload": "'"${NOTEBOOK_B64}"'",
          "payloadType": "InlineBase64"
        }
      ]
    }
  }'

# Execute notebook (on-demand run)
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/items/${NOTEBOOK_ID}/jobs/instances?jobType=RunNotebook" \
  -d '{
    "executionData": {
      "parameters": {
        "entity": "tvs",
        "extract_date": "2026-02-24",
        "batch_size": 500
      }
    }
  }'

# Check notebook run status
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/items/${NOTEBOOK_ID}/jobs/instances/${RUN_ID}" \
  | jq '{status, startTimeUtc, endTimeUtc, failureReason}'
```

## OneLake Shortcut Creation

```bash
# Create shortcut to Dataverse table
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses/${LAKEHOUSE_ID}/shortcuts" \
  -d '{
    "name": "dataverse_brokers",
    "path": "Tables",
    "target": {
      "type": "Dataverse",
      "dataverse": {
        "environmentDomain": "tvs-prod.crm8.dynamics.com",
        "tableName": "tvs_broker",
        "connectionId": "'"${DATAVERSE_CONNECTION_ID}"'"
      }
    }
  }'

# Create shortcut to Azure Data Lake Storage
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses/${LAKEHOUSE_ID}/shortcuts" \
  -d '{
    "name": "a3_archive_export",
    "path": "Files",
    "target": {
      "type": "AzureDataLakeStorageGen2",
      "azureDataLakeStorageGen2": {
        "location": "https://sttvsconsolidated.dfs.core.windows.net",
        "subpath": "/a3-archive/exports/",
        "connectionId": "'"${ADLS_CONNECTION_ID}"'"
      }
    }
  }'

# Create cross-workspace shortcut (consolidated -> tvs)
curl -s -X POST -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "${BASE_URL}/workspaces/ws-consolidated-prod-00000006/lakehouses/${CONSOLIDATED_LH_ID}/shortcuts" \
  -d '{
    "name": "tvs_brokers",
    "path": "Tables",
    "target": {
      "type": "OneLake",
      "oneLake": {
        "workspaceId": "ws-tvs-prod-00000001",
        "itemId": "'"${TVS_LAKEHOUSE_ID}"'",
        "path": "Tables/brokers"
      }
    }
  }'

# List shortcuts
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/workspaces/${WORKSPACE_ID}/lakehouses/${LAKEHOUSE_ID}/shortcuts" \
  | jq '.value[] | {name, path, target}'
```

## Capacity Management

```bash
# List capacities
curl -s -H "${AUTH_HEADER}" \
  "${BASE_URL}/capacities" \
  | jq '.value[] | {id, displayName, sku, state}'

# Resume capacity (start from paused)
curl -s -X POST -H "${AUTH_HEADER}" \
  "https://management.azure.com/subscriptions/${SUB_ID}/resourceGroups/rg-tvs-consolidated-prod/providers/Microsoft.Fabric/capacities/${CAPACITY_NAME}/resume?api-version=2023-11-01"

# Suspend capacity (auto-pause for cost savings)
curl -s -X POST -H "${AUTH_HEADER}" \
  "https://management.azure.com/subscriptions/${SUB_ID}/resourceGroups/rg-tvs-consolidated-prod/providers/Microsoft.Fabric/capacities/${CAPACITY_NAME}/suspend?api-version=2023-11-01"

# Scale capacity
curl -s -X PATCH -H "${AUTH_HEADER}" \
  -H "Content-Type: application/json" \
  "https://management.azure.com/subscriptions/${SUB_ID}/resourceGroups/rg-tvs-consolidated-prod/providers/Microsoft.Fabric/capacities/${CAPACITY_NAME}?api-version=2023-11-01" \
  -d '{"sku": {"name": "F64", "tier": "Fabric"}}'
```

## OneLake File Operations

```bash
# Upload file to OneLake (via ADLS Gen2 API)
curl -s -X PUT \
  -H "${AUTH_HEADER}" \
  -H "Content-Type: application/octet-stream" \
  "https://onelake.dfs.fabric.microsoft.com/${WORKSPACE_ID}/${LAKEHOUSE_ID}/Files/staging/brokers.parquet" \
  --data-binary @"./data/brokers.parquet"

# List files in OneLake path
curl -s -H "${AUTH_HEADER}" \
  "https://onelake.dfs.fabric.microsoft.com/${WORKSPACE_ID}/${LAKEHOUSE_ID}/Files/staging/?resource=filesystem&recursive=false" \
  | jq '.paths[] | {name, contentLength, lastModified}'
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `401 Unauthorized` | Token expired or invalid | Re-acquire token from `/oauth2/v2.0/token` |
| `403 Forbidden` | Missing workspace role | Add principal via `roleAssignments` endpoint |
| `404 ItemNotFound` | Wrong workspace or item ID | Verify IDs with list endpoints |
| `409 Conflict` | Duplicate name | Use unique `displayName` or update existing |
| `429 TooManyRequests` | Rate limit hit | Implement exponential backoff (start 1s, max 60s) |
| `CapacityNotActive` | Capacity is paused | Resume capacity before operations |
