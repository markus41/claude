---
name: Microsoft Graph API
description: This skill should be used when working with identity/**, teams/**, entra/**, or graph-* prefixed files. It provides Microsoft Graph API operations for user lifecycle management, license assignment, YubiKey FIDO2 registration, conditional access policies, Teams workspace provisioning, and SharePoint/Exchange configuration across TVS Holdings tenancy.
version: 1.0.0
---

# Microsoft Graph API Operations

Complete reference for Microsoft Graph API operations across TVS Holdings Entra ID tenancy.

## Authentication

```bash
# Acquire token via client credentials
TOKEN=$(curl -s -X POST \
  "https://login.microsoftonline.com/${TENANT_ID}/oauth2/v2.0/token" \
  -d "client_id=${GRAPH_CLIENT_ID}" \
  -d "client_secret=${GRAPH_CLIENT_SECRET}" \
  -d "scope=https://graph.microsoft.com/.default" \
  -d "grant_type=client_credentials" \
  | jq -r '.access_token')

AUTH="Authorization: Bearer ${TOKEN}"
GRAPH="https://graph.microsoft.com/v1.0"
GRAPH_BETA="https://graph.microsoft.com/beta"
```

## License SKU Reference

| License | SKU ID | Monthly Cost | Use Case |
|---------|--------|-------------|----------|
| Microsoft 365 Business Premium | `cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46` | $22/user | Full-time staff, executives |
| Microsoft 365 Business Basic | `3b555118-da6a-4418-894f-7df1e2096870` | $6/user | PH VAs, contractors |
| Microsoft 365 F3 (Frontline) | `66b55226-6b4f-492c-910c-a3b7a3c9d993` | $8/user | Field agents, part-time |

## User Creation with License

```bash
# Create user with Business Premium license
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users" \
  -d '{
    "accountEnabled": true,
    "displayName": "Maria Santos",
    "mailNickname": "maria.santos",
    "userPrincipalName": "maria.santos@tvsh.com",
    "passwordProfile": {
      "forceChangePasswordNextSignIn": true,
      "password": "'"${TEMP_PASSWORD}"'"
    },
    "usageLocation": "US",
    "department": "TVS Motor",
    "jobTitle": "Broker Relations Manager",
    "companyName": "TVS Holdings"
  }'

# Assign Business Premium license
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users/maria.santos@tvsh.com/assignLicense" \
  -d '{
    "addLicenses": [
      {
        "skuId": "cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46",
        "disabledPlans": []
      }
    ],
    "removeLicenses": []
  }'

# Create PH VA user with Business Basic license
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users" \
  -d '{
    "accountEnabled": true,
    "displayName": "Juan Reyes (VA)",
    "mailNickname": "juan.reyes.va",
    "userPrincipalName": "juan.reyes.va@tvsh.com",
    "passwordProfile": {
      "forceChangePasswordNextSignIn": true,
      "password": "'"${TEMP_PASSWORD}"'"
    },
    "usageLocation": "PH",
    "department": "Virtual Assistants",
    "jobTitle": "Virtual Assistant"
  }'

curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users/juan.reyes.va@tvsh.com/assignLicense" \
  -d '{
    "addLicenses": [{"skuId": "3b555118-da6a-4418-894f-7df1e2096870"}],
    "removeLicenses": []
  }'
```

## User Management

```bash
# List all users with license info
curl -s -H "${AUTH}" \
  "${GRAPH}/users?\$select=displayName,userPrincipalName,department,assignedLicenses&\$top=100" \
  | jq '.value[] | {displayName, userPrincipalName, department}'

# Get user details
curl -s -H "${AUTH}" \
  "${GRAPH}/users/maria.santos@tvsh.com?\$select=displayName,department,assignedLicenses,signInActivity"

# Disable user account (offboarding)
curl -s -X PATCH -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users/departed.user@tvsh.com" \
  -d '{"accountEnabled": false}'

# Remove all licenses from user
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/users/departed.user@tvsh.com/assignLicense" \
  -d '{
    "addLicenses": [],
    "removeLicenses": ["cbdc14ab-d96c-4c30-b9f4-6ada7cdc1d46"]
  }'
```

## YubiKey FIDO2 Registration for PH VAs

```bash
# Register FIDO2 security key (begin registration - interactive flow)
# Step 1: Create FIDO2 creation options
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH_BETA}/users/${USER_ID}/authentication/fido2Methods" \
  -d '{
    "displayName": "YubiKey 5 NFC - Juan Reyes"
  }'

# Step 2: List registered FIDO2 keys
curl -s -H "${AUTH}" \
  "${GRAPH_BETA}/users/${USER_ID}/authentication/fido2Methods" \
  | jq '.value[] | {id, displayName, createdDateTime, model}'

# Step 3: Delete FIDO2 key (lost/stolen)
curl -s -X DELETE -H "${AUTH}" \
  "${GRAPH_BETA}/users/${USER_ID}/authentication/fido2Methods/${FIDO2_METHOD_ID}"

# Bulk check FIDO2 registration status
curl -s -H "${AUTH}" \
  "${GRAPH_BETA}/reports/authenticationMethods/userRegistrationDetails?\$filter=methodsRegistered/any(m:m eq 'fido2')&\$select=userPrincipalName,methodsRegistered" \
  | jq '.value[] | {userPrincipalName, methodsRegistered}'
```

## Conditional Access Policies

```bash
# Create policy: Require MFA for all users
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH_BETA}/identity/conditionalAccess/policies" \
  -d '{
    "displayName": "TVS - Require MFA for all users",
    "state": "enabledForReportingButNotEnforced",
    "conditions": {
      "users": {"includeUsers": ["All"]},
      "applications": {"includeApplications": ["All"]},
      "locations": {
        "includeLocations": ["All"],
        "excludeLocations": ["AllTrusted"]
      }
    },
    "grantControls": {
      "operator": "OR",
      "builtInControls": ["mfa"]
    }
  }'

# Create policy: Block sign-in from high-risk locations for VAs
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH_BETA}/identity/conditionalAccess/policies" \
  -d '{
    "displayName": "TVS - Block high-risk locations for VAs",
    "state": "enabled",
    "conditions": {
      "users": {
        "includeGroups": ["'"${VA_GROUP_ID}"'"]
      },
      "applications": {"includeApplications": ["All"]},
      "signInRiskLevels": ["high"]
    },
    "grantControls": {
      "operator": "OR",
      "builtInControls": ["block"]
    }
  }'

# Create policy: Require FIDO2 for admin access
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH_BETA}/identity/conditionalAccess/policies" \
  -d '{
    "displayName": "TVS - FIDO2 required for admins",
    "state": "enabled",
    "conditions": {
      "users": {
        "includeRoles": [
          "62e90394-69f5-4237-9190-012177145e10",
          "194ae4cb-b126-40b2-bd5b-6091b380977d"
        ]
      },
      "applications": {"includeApplications": ["All"]}
    },
    "grantControls": {
      "operator": "OR",
      "authenticationStrength": {
        "id": "00000000-0000-0000-0000-000000000004"
      }
    }
  }'

# List all policies
curl -s -H "${AUTH}" \
  "${GRAPH_BETA}/identity/conditionalAccess/policies" \
  | jq '.value[] | {displayName, state, id}'
```

## Teams Workspace Provisioning

```bash
# Create Team with channels
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/teams" \
  -d '{
    "template@odata.bind": "https://graph.microsoft.com/v1.0/teamsTemplates('"'"'standard'"'"')",
    "displayName": "TVS Motor - Broker Operations",
    "description": "Operations hub for TVS Motor broker management",
    "members": [
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        "roles": ["owner"],
        "user@odata.bind": "https://graph.microsoft.com/v1.0/users('"'"''"${OWNER_USER_ID}"''"'"')"
      }
    ]
  }'

# Add channel to existing team
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/teams/${TEAM_ID}/channels" \
  -d '{
    "displayName": "Broker Onboarding",
    "description": "New broker onboarding coordination",
    "membershipType": "standard"
  }'

# Add private channel
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/teams/${TEAM_ID}/channels" \
  -d '{
    "displayName": "Commission Reviews",
    "description": "Private channel for commission review discussions",
    "membershipType": "private",
    "members": [
      {
        "@odata.type": "#microsoft.graph.aadUserConversationMember",
        "roles": ["owner"],
        "user@odata.bind": "https://graph.microsoft.com/v1.0/users('"'"''"${OWNER_USER_ID}"''"'"')"
      }
    ]
  }'

# Add member to team
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/teams/${TEAM_ID}/members" \
  -d '{
    "@odata.type": "#microsoft.graph.aadUserConversationMember",
    "roles": ["member"],
    "user@odata.bind": "https://graph.microsoft.com/v1.0/users('"'"''"${MEMBER_USER_ID}"''"'"')"
  }'

# Install app to team (e.g., Planner)
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/teams/${TEAM_ID}/installedApps" \
  -d '{
    "teamsApp@odata.bind": "https://graph.microsoft.com/v1.0/appCatalogs/teamsApps/com.microsoft.teamspace.tab.planner"
  }'
```

## Group Management

```bash
# Create security group for entity
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/groups" \
  -d '{
    "displayName": "SG-TVS-TVS-Staff",
    "mailEnabled": false,
    "mailNickname": "sg-tvs-tvs-staff",
    "securityEnabled": true,
    "description": "Security group for TVS Motor full-time staff"
  }'

# Add member to group
curl -s -X POST -H "${AUTH}" \
  -H "Content-Type: application/json" \
  "${GRAPH}/groups/${GROUP_ID}/members/\$ref" \
  -d '{"@odata.id": "https://graph.microsoft.com/v1.0/users/'"${USER_ID}"'"}'
```

## Error Reference

| Error | Cause | Fix |
|-------|-------|-----|
| `Authorization_RequestDenied` | Missing API permission | Add permission in App Registration, grant admin consent |
| `Request_BadRequest` on license | Missing `usageLocation` | Set `usageLocation` on user before license assignment |
| `Directory_QuotaExceeded` | Tenant user limit | Contact Microsoft support or remove stale accounts |
| `InvalidAuthenticationToken` | Token expired (1hr) | Re-acquire token from `/oauth2/v2.0/token` |
| `ForbiddenByPolicy` | Conditional access block | Review CA policies; check user risk and location |
