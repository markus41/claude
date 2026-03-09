---
name: teams:agent365
intent: Agent 365 blueprint — identity, MCP tools, and M365 Copilot integration
tags:
  - microsoft-teams-app
  - command
  - agent365
inputs:
  - name: action
    description: "Action: scaffold | identity | mcp-tools | publish"
    required: false
    default: scaffold
risk: low
cost: low
description: Build Agent 365 apps with user-customizable agent blueprints, Entra identity, MCP tool integration, and M365 Copilot publishing
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Agent 365

Build AI agents that run in M365 Copilot with customizable blueprints, enterprise identity, and external tool integration.

## Usage

```bash
/teams:agent365 [--action=scaffold|identity|mcp-tools|publish]
```

## Architecture

```
┌──────────────────────────────────────────────────────┐
│                   M365 COPILOT                        │
│                                                       │
│  ┌─────────────────────────────────────────────────┐ │
│  │         AGENT 365 RUNTIME                        │ │
│  │                                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │Blueprint │  │Knowledge │  │  API Plugins  │  │ │
│  │  │(manifest)│  │(SharePt) │  │  (OpenAPI)    │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  │                                                  │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │ │
│  │  │ Identity │  │  MCP     │  │  Graph       │  │ │
│  │  │ (Entra)  │  │  Tools   │  │  Connectors  │  │ │
│  │  └──────────┘  └──────────┘  └──────────────┘  │ │
│  └─────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────┘
```

## Scaffold Agent 365 Project

```bash
# Using M365 Agents Toolkit
npx @microsoft/m365agentstoolkit-cli new \
  --template declarative-agent \
  --folder ./my-agent365

cd my-agent365
```

### Project Structure

```
my-agent365/
├── m365agents.yml
├── m365agents.local.yml
├── appPackage/
│   ├── manifest.json
│   ├── declarativeAgent.json
│   ├── apiPlugin.json         # API plugin definition
│   ├── openapi.json           # OpenAPI spec for external APIs
│   ├── color.png
│   └── outline.png
├── env/
│   ├── .env.dev
│   └── .env.local
└── README.md
```

## Manifest with Agent Blueprint

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
  "manifestVersion": "1.25",
  "id": "{app-guid}",
  "version": "1.0.0",
  "name": { "short": "Project Manager Agent", "full": "AI Project Manager for Teams" },
  "description": {
    "short": "AI-powered project management assistant",
    "full": "Manages tasks, tracks deadlines, generates reports, and coordinates team activities."
  },
  "icons": { "color": "color.png", "outline": "outline.png" },
  "developer": {
    "name": "Contoso",
    "websiteUrl": "https://contoso.com",
    "privacyUrl": "https://contoso.com/privacy",
    "termsOfUseUrl": "https://contoso.com/terms"
  },
  "copilotAgents": {
    "declarativeAgents": [
      {
        "id": "projectManager",
        "file": "declarativeAgent.json"
      }
    ]
  },
  "agenticUserTemplates": [
    {
      "id": "pm-agent",
      "name": "Project Manager",
      "description": "Tracks projects, deadlines, and team coordination",
      "instructions": "You are a project manager. Help the user track tasks, set deadlines, coordinate with team members, and generate status reports. Use the project management API to fetch and update data."
    },
    {
      "id": "scrum-master",
      "name": "Scrum Master",
      "description": "Runs standups, sprint planning, and retrospectives",
      "instructions": "You are a scrum master. Facilitate daily standups, sprint planning, and retrospectives. Track velocity, identify blockers, and suggest process improvements."
    }
  ],
  "validDomains": ["contoso.com", "*.contoso.com"],
  "webApplicationInfo": {
    "id": "{aad-app-id}",
    "resource": "api://contoso.com/{aad-app-id}"
  }
}
```

## Declarative Agent Definition

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.3/schema.json",
  "version": "v1.3",
  "name": "Project Manager",
  "description": "AI project management assistant with access to Jira, GitHub, and team calendar",
  "instructions": "You are an expert project manager. When users ask about project status, use the getProjects and getTasks functions. When they need to create tasks, use createTask. Always provide context about deadlines and dependencies. Format responses with clear headers and bullet points.",
  "conversation_starters": [
    { "text": "What are my open tasks for this sprint?" },
    { "text": "Show me the project status dashboard" },
    { "text": "Create a task for the API migration" },
    { "text": "Who is blocked and on what?" },
    { "text": "Generate a sprint retrospective summary" }
  ],
  "capabilities": [
    {
      "name": "WebSearch",
      "is_enabled": false
    },
    {
      "name": "CodeInterpreter",
      "is_enabled": true
    },
    {
      "name": "OneDriveAndSharePoint",
      "items_by_url": [
        { "url": "https://contoso.sharepoint.com/sites/Engineering/ProjectDocs" }
      ]
    },
    {
      "name": "GraphConnectors",
      "connections": [
        { "connection_id": "jiraConnector" },
        { "connection_id": "githubConnector" }
      ]
    }
  ],
  "actions": [
    {
      "id": "projectApi",
      "file": "apiPlugin.json"
    }
  ]
}
```

## API Plugin Definition

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.2/schema.json",
  "schema_version": "v2.2",
  "name_for_human": "Project Management API",
  "description_for_human": "Manage projects, tasks, and team assignments",
  "namespace": "projects",
  "functions": [
    {
      "name": "getProjects",
      "description": "Get all active projects with their status and health metrics",
      "capabilities": {
        "response_semantics": {
          "data_path": "$.projects",
          "properties": {
            "title": "$.name",
            "subtitle": "$.status",
            "url": "$.dashboardUrl"
          }
        }
      }
    },
    {
      "name": "getTasks",
      "description": "Get tasks filtered by project, assignee, or sprint",
      "capabilities": {
        "response_semantics": {
          "data_path": "$.tasks",
          "properties": {
            "title": "$.title",
            "subtitle": "$.assignee.name"
          }
        }
      }
    },
    {
      "name": "createTask",
      "description": "Create a new task in the specified project",
      "capabilities": {
        "confirmation": {
          "type": "AdaptiveCard",
          "title": "Confirm Task Creation",
          "body": "Create task '${title}' assigned to ${assignee} in ${project}?"
        }
      }
    },
    {
      "name": "updateTaskStatus",
      "description": "Update the status of an existing task"
    }
  ],
  "runtimes": [
    {
      "type": "OpenApi",
      "auth": {
        "type": "OAuthPluginVault",
        "reference_id": "{oauth-connection-id}"
      },
      "spec": {
        "url": "openapi.json"
      },
      "run_for_functions": ["getProjects", "getTasks", "createTask", "updateTaskStatus"]
    }
  ]
}
```

## Identity Setup (Entra ID)

```bash
# 1. Create app registration (single-tenant)
az ad app create \
  --display-name "Project Manager Agent" \
  --sign-in-audience "AzureADMyOrg" \
  --enable-id-token-issuance true

# 2. Set identifier URI
az ad app update \
  --id {app-id} \
  --identifier-uris "api://contoso.com/{app-id}"

# 3. Add API permissions
az ad app permission add \
  --id {app-id} \
  --api 00000003-0000-0000-c000-000000000000 \
  --api-permissions \
    e1fe6dd8-ba31-4d61-89e7-88639da4683d=Scope \  # User.Read
    570282fd-fa5c-430d-a7fd-fc8dc98a9dca=Scope     # Mail.Read

# 4. Grant admin consent
az ad app permission admin-consent --id {app-id}

# 5. Create client secret
az ad app credential reset \
  --id {app-id} \
  --display-name "agent365-secret" \
  --years 2
```

## MCP Tool Integration

Connect external tools via Model Context Protocol for agent capabilities.

```json
// mcp-tools-config.json
{
  "tools": [
    {
      "name": "jira_search",
      "description": "Search Jira issues by JQL query",
      "inputSchema": {
        "type": "object",
        "properties": {
          "jql": {
            "type": "string",
            "description": "JQL query string"
          },
          "maxResults": {
            "type": "number",
            "default": 20
          }
        },
        "required": ["jql"]
      }
    },
    {
      "name": "github_pr_list",
      "description": "List pull requests for a repository",
      "inputSchema": {
        "type": "object",
        "properties": {
          "repo": { "type": "string" },
          "state": { "type": "string", "enum": ["open", "closed", "all"] }
        },
        "required": ["repo"]
      }
    }
  ]
}
```

## Publishing to M365 Admin Center

```bash
# 1. Validate
atk validate --manifest-path appPackage/manifest.json

# 2. Package
atk package --manifest-path appPackage/manifest.json \
  --output-zip-path ./appPackage/build/agent365.zip

# 3. Publish to org app catalog
atk publish --file-path ./appPackage/build/agent365.zip

# 4. Admin approval required in M365 Admin Center
# https://admin.microsoft.com → Teams apps → Manage apps
```

## Testing

```bash
# Local preview
atk preview --local

# Remote preview (after provision + deploy)
atk preview --remote

# Agents Playground (for Custom Engine variant)
npx agentsplayground -e "http://localhost:3978/api/messages"
```

## See Also

- `/teams:agent` — Custom Engine Agents vs Declarative comparison
- `/teams:auth` — Identity and SSO for Agent 365 apps
- `/teams:manifest` — agenticUserTemplates schema details
- `/teams:migrate` — Migrating existing apps to Agent 365
