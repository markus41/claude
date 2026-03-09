---
name: teams:manifest
intent: v1.25 manifest schema reference, migration from v1.17, known bugs
tags:
  - microsoft-teams-app
  - command
  - manifest
inputs:
  - name: action
    description: "Action: scaffold | validate | migrate | reference"
    required: false
    default: reference
  - name: from
    description: "Migrate from version (e.g. 1.17)"
    required: false
risk: low
cost: low
description: Teams app manifest v1.25 complete schema reference with migration guide from v1.17, new properties, and known bugs
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams App Manifest v1.25

Complete reference for the Microsoft 365 app manifest v1.25 schema, migration from v1.17, new properties, and known bugs.

## Usage

```bash
/teams:manifest [--action=scaffold|validate|migrate|reference] [--from=1.17]
```

## Schema URL

```
https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json
```

## What's New in v1.25 (vs v1.17)

```
┌─────────────────────────────────────────────────────────────┐
│              v1.17 → v1.25 CHANGES                          │
├──────────────────────────┬──────────────────────────────────┤
│  NEW PROPERTIES          │  CHANGED BEHAVIOR               │
│                          │                                  │
│  supportsChannelFeatures │  Single-tenant enforced          │
│  nestedAppAuthInfo       │  dialog.url.open() replaces      │
│  backgroundLoadConfig    │    tasks namespace               │
│  agenticUserTemplates    │  M365 Agents Toolkit replaces    │
│  activityIcons           │    Teams Toolkit                 │
│  customEngineAgents      │  Bot reg → single-tenant only    │
│  declarativeAgents       │                                  │
└──────────────────────────┴──────────────────────────────────┘
```

## Full Manifest Template (v1.25)

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
  "manifestVersion": "1.25",
  "version": "1.0.0",
  "id": "{app-guid}",
  "developer": {
    "name": "Contoso",
    "websiteUrl": "https://contoso.com",
    "privacyUrl": "https://contoso.com/privacy",
    "termsOfUseUrl": "https://contoso.com/terms"
  },
  "name": {
    "short": "My Teams App",
    "full": "My Teams App — Full Description"
  },
  "description": {
    "short": "Brief app description (max 80 chars)",
    "full": "Full app description (max 4000 chars)"
  },
  "icons": {
    "color": "color.png",
    "outline": "outline.png"
  },
  "accentColor": "#4F6BED",

  "bots": [
    {
      "botId": "{bot-app-id}",
      "scopes": ["personal", "team", "groupChat"],
      "supportsFiles": false,
      "isNotificationOnly": false,
      "commandLists": [
        {
          "scopes": ["personal"],
          "commands": [
            { "title": "help", "description": "Show help info" }
          ]
        }
      ]
    }
  ],

  "staticTabs": [
    {
      "entityId": "home",
      "name": "Home",
      "contentUrl": "https://{baseUrl}/tab/home",
      "websiteUrl": "https://{baseUrl}/tab/home",
      "scopes": ["personal"],
      "context": ["personalTab"]
    }
  ],

  "configurableTabs": [
    {
      "configurationUrl": "https://{baseUrl}/tab/config",
      "canUpdateConfiguration": true,
      "scopes": ["team", "groupChat"],
      "context": [
        "channelTab",
        "meetingSidePanel",
        "meetingStage",
        "meetingChatTab",
        "meetingDetailsTab"
      ],
      "meetingSurfaces": ["sidePanel", "stage"],
      "supportedSharePointHosts": []
    }
  ],

  "composeExtensions": [
    {
      "botId": "{bot-app-id}",
      "type": "bot",
      "commands": [
        {
          "id": "searchCmd",
          "type": "query",
          "title": "Search",
          "description": "Search items",
          "initialRun": true,
          "parameters": [
            {
              "name": "query",
              "title": "Query",
              "inputType": "text"
            }
          ]
        },
        {
          "id": "actionCmd",
          "type": "action",
          "title": "Create",
          "description": "Create an item",
          "context": ["compose", "commandBox", "message"],
          "fetchTask": true
        }
      ],
      "messageHandlers": [
        {
          "type": "link",
          "value": {
            "domains": ["*.contoso.com"]
          }
        }
      ]
    }
  ],

  "meetingExtensionDefinition": {
    "supportsAnonymousGuestUsers": true
  },

  "supportsChannelFeatures": {
    "supportsSharedChannels": true,
    "supportsPrivateChannels": true
  },

  "nestedAppAuthInfo": {
    "clientId": "{spa-client-id}",
    "resource": "api://{baseUrl}/{spa-client-id}"
  },

  "backgroundLoadConfiguration": {
    "url": "https://{baseUrl}/background"
  },

  "agenticUserTemplates": [
    {
      "id": "support-agent",
      "name": "Support Agent",
      "description": "Handles customer support queries",
      "instructions": "You are a helpful customer support agent..."
    }
  ],

  "customEngineAgents": [
    {
      "id": "custom-ai-agent",
      "type": "CustomEngine"
    }
  ],

  "activities": {
    "activityTypes": [
      {
        "type": "taskAssigned",
        "description": "A task was assigned to you",
        "templateText": "{actor} assigned {taskName} to you"
      }
    ],
    "activityIcons": {
      "taskAssigned": "https://{cdn}/icons/task-assigned.png"
    }
  },

  "permissions": [
    "identity",
    "messageTeamMembers"
  ],

  "authorization": {
    "permissions": {
      "resourceSpecific": [
        {
          "name": "ChannelMessage.Read.Group",
          "type": "Application"
        },
        {
          "name": "OnlineMeeting.ReadBasic.Chat",
          "type": "Delegated"
        }
      ]
    }
  },

  "validDomains": [
    "contoso.com",
    "*.contoso.com"
  ],

  "webApplicationInfo": {
    "id": "{aad-app-id}",
    "resource": "api://{baseUrl}/{aad-app-id}"
  }
}
```

## New Properties Deep Dive

### supportsChannelFeatures

Controls app behavior in shared and private channels.

```json
"supportsChannelFeatures": {
  "supportsSharedChannels": true,
  "supportsPrivateChannels": true
}
```

**Known Bug:** Dev Portal silently fails to persist this property. Always edit in `manifest.json` directly.

### nestedAppAuthInfo

Enables Nested App Authentication (NAA) for pop-up-free SSO in iframe-hosted tabs.

```json
"nestedAppAuthInfo": {
  "clientId": "{spa-client-id}",
  "resource": "api://{baseUrl}/{spa-client-id}"
}
```

Requires:
- Manifest v1.21+
- MSAL.js v3.15+
- Entra app registration with SPA redirect URIs

### backgroundLoadConfiguration

Pre-caches tab content before user navigates to it, improving perceived load time.

```json
"backgroundLoadConfiguration": {
  "url": "https://{baseUrl}/background"
}
```

The URL is loaded in a hidden iframe. Use it to warm caches, prefetch data, establish WebSocket connections.

### agenticUserTemplates

Define Agent 365 personas that users can customize.

```json
"agenticUserTemplates": [
  {
    "id": "sales-agent",
    "name": "Sales Assistant",
    "description": "Helps with sales pipeline and forecasting",
    "instructions": "You are a sales assistant. Help the user with..."
  }
]
```

### activityIcons

Custom icons for activity feed notifications, consistent across Teams/Outlook/M365.

```json
"activities": {
  "activityTypes": [
    {
      "type": "approvalRequired",
      "description": "An approval is required",
      "templateText": "{actor} needs your approval for {itemName}"
    }
  ],
  "activityIcons": {
    "approvalRequired": "https://{cdn}/icons/approval.png"
  }
}
```

## Migration Guide: v1.17 → v1.25

### Step 1: Update Schema and Version

```diff
- "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.17/MicrosoftTeams.schema.json",
- "manifestVersion": "1.17",
+ "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
+ "manifestVersion": "1.25",
```

### Step 2: Update Auth to Single-Tenant

```diff
  "webApplicationInfo": {
    "id": "{aad-app-id}",
-   "resource": "api://{baseUrl}/{aad-app-id}",
-   "applicationPermissions": []
+   "resource": "api://{baseUrl}/{aad-app-id}"
  }
```

In your Entra app registration:
- Change "Supported account types" to "Accounts in this organizational directory only"
- Set `APP_TENANTID` to your actual tenant ID (not `common` or `organizations`)

### Step 3: Add New Properties (Optional)

```diff
+ "supportsChannelFeatures": {
+   "supportsSharedChannels": true,
+   "supportsPrivateChannels": true
+ },
+ "nestedAppAuthInfo": {
+   "clientId": "{spa-client-id}",
+   "resource": "api://{baseUrl}/{spa-client-id}"
+ },
```

### Step 4: Update Tooling Config

```diff
- teamsapp.yml
+ m365agents.yml

- teamsapp.local.yml
+ m365agents.local.yml
```

### Step 5: Update CLI

```diff
- npx @microsoft/teamsapp-cli validate
+ npx @microsoft/m365agentstoolkit-cli validate

- npx @microsoft/teamsapp-cli provision
+ npx @microsoft/m365agentstoolkit-cli provision
```

### Step 6: Replace tasks Namespace

```diff
- import { tasks } from "@microsoft/teams-js";
- tasks.startTask(taskInfo);
+ import { dialog } from "@microsoft/teams-js";
+ dialog.url.open(dialogInfo);
```

## Validation

```bash
# Validate with M365 Agents Toolkit CLI
npx @microsoft/m365agentstoolkit-cli validate --manifest-path ./appPackage/manifest.json

# Validate locally with schema
npx ajv validate -s teams-v1.25-schema.json -d manifest.json
```

## Known Bugs (v1.25)

### 1. Regex Validation Error
The v1.25 schema has a regex pattern for certain string fields that incorrectly rejects valid values. Workaround: validate locally before uploading to Dev Portal.

### 2. Dev Portal Save Issue
The Dev Portal UI silently fails to persist `supportsChannelFeatures`. Always edit this field directly in `manifest.json`, not through the portal UI.

### 3. Dev Portal v1.25 Upgrade
Cannot upgrade manifest to v1.25 through Dev Portal UI. Must edit `manifestVersion` in JSON directly.

**Recommendation:** Always work with `manifest.json` in source control and use CLI for validation. Do not rely on Dev Portal for v1.25 features.

## See Also

- `/teams:auth` — Single-tenant enforcement, NAA deep dive
- `/teams:meeting-app` — Meeting extension manifest configuration
- `/teams:msgext` — composeExtensions schema details
- `/teams:agent` — customEngineAgents and agenticUserTemplates
- `/teams:migrate` — Full migration from TeamsFx to M365 Agents Toolkit
