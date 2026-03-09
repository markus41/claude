---
name: teams:agent
intent: Scaffold Custom Engine Agents, Declarative Agents, and Agent 365 blueprints
tags:
  - microsoft-teams-app
  - command
  - agents
inputs:
  - name: type
    description: "Agent type: custom-engine | declarative | agent365 | full"
    required: false
    default: full
risk: low
cost: low
description: Build Teams Custom Engine Agents with your own AI, Declarative Agents for M365 Copilot, and Agent 365 blueprints with identity and MCP tools
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams Agents

Build AI-powered agents for Microsoft Teams — Custom Engine Agents with full orchestration control, Declarative Agents for M365 Copilot, and Agent 365 blueprints.

## Usage

```bash
/teams:agent [--type=custom-engine|declarative|agent365|full]
```

## Agent Types

```
┌──────────────────────────────────────────────────────────────┐
│                    TEAMS AGENT TYPES                          │
├────────────────┬──────────────────┬──────────────────────────┤
│  CUSTOM ENGINE │  DECLARATIVE     │  AGENT 365               │
│                │                  │                          │
│  Full control  │  Extend Copilot  │  User-customizable       │
│  Bring own AI  │  M365 Graph      │  Template-based          │
│  Any LLM/model │  grounding       │  Identity + MCP          │
│  Bot Framework │  Low-code config │  agenticUserTemplates    │
│  Manifest v1.21│  API plugins     │  in manifest             │
│  + teams-js    │  + knowledge     │                          │
└────────────────┴──────────────────┴──────────────────────────┘
```

## Custom Engine Agents

Full orchestration control with your own AI backend (Claude, GPT, Gemini, Ollama, etc.).

### Manifest Configuration

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
  "manifestVersion": "1.25",
  "bots": [
    {
      "botId": "{bot-app-id}",
      "scopes": ["personal", "team", "groupChat"],
      "commandLists": [
        {
          "scopes": ["personal"],
          "commands": [
            { "title": "ask", "description": "Ask the AI agent" },
            { "title": "summarize", "description": "Summarize conversation" }
          ]
        }
      ]
    }
  ],
  "customEngineAgents": [
    {
      "id": "ai-assistant",
      "type": "CustomEngine"
    }
  ]
}
```

**Critical:** The `botId` in `bots` must match the bot registration used by `customEngineAgents`.

### Scaffold with M365 Agents Toolkit

```bash
# Create custom engine agent project
npx @microsoft/m365agentstoolkit-cli new \
  --template basic-custom-engine-agent \
  --folder ./my-agent

cd my-agent

# Project structure
# ├── m365agents.yml
# ├── m365agents.local.yml
# ├── appPackage/
# │   ├── manifest.json
# │   ├── color.png
# │   └── outline.png
# ├── src/
# │   ├── index.ts
# │   ├── bot.ts
# │   └── ai/
# │       ├── orchestrator.ts
# │       └── prompts/
# └── env/
#     ├── .env.dev
#     └── .env.local
```

### Custom Engine Agent with Claude

```typescript
// src/ai/orchestrator.ts
import Anthropic from "@anthropic-ai/sdk";
import {
  TeamsActivityHandler,
  TurnContext,
  ActivityTypes,
} from "botbuilder";

const anthropic = new Anthropic();

export class ClaudeAgent extends TeamsActivityHandler {
  private conversationHistory: Map<string, Array<{ role: string; content: string }>> = new Map();

  constructor() {
    super();
    this.onMessage(async (context: TurnContext, next) => {
      const userId = context.activity.from.aadObjectId || context.activity.from.id;
      const userMessage = context.activity.text?.trim();

      if (!userMessage) {
        await next();
        return;
      }

      // Maintain conversation history per user
      const history = this.conversationHistory.get(userId) || [];
      history.push({ role: "user", content: userMessage });

      // Send typing indicator
      await context.sendActivity({ type: ActivityTypes.Typing });

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 4096,
          system: `You are a helpful assistant in Microsoft Teams.
                   User: ${context.activity.from.name}
                   Team context: ${context.activity.channelData?.team?.name || "personal chat"}
                   Keep responses concise and formatted for chat.`,
          messages: history as any,
        });

        const assistantMessage = response.content[0].type === "text"
          ? response.content[0].text
          : "I couldn't generate a response.";

        history.push({ role: "assistant", content: assistantMessage });
        this.conversationHistory.set(userId, history.slice(-20)); // Keep last 20 turns

        await context.sendActivity(assistantMessage);
      } catch (error) {
        await context.sendActivity("Sorry, I encountered an error. Please try again.");
      }

      await next();
    });
  }
}
```

### Local Testing with Agents Playground

```bash
# Start local bot server
npm run dev  # Starts on http://localhost:3978

# Launch Agents Playground (no M365 account required)
npx agentsplayground \
  -e "http://localhost:3978/api/messages" \
  -c "emulator"

# For Teams-specific channel behavior
npx agentsplayground \
  -e "http://localhost:3978/api/messages" \
  -c "msteams"
```

## Declarative Agents (M365 Copilot Extension)

Extend M365 Copilot with custom instructions, knowledge, and API plugins.

### Declarative Agent Manifest

```json
// declarativeAgent.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/declarative-agent/v1.3/schema.json",
  "version": "v1.3",
  "name": "HR Assistant",
  "description": "Helps employees with HR policies and benefits",
  "instructions": "You are an HR assistant. Answer questions about company policies, benefits, PTO, and onboarding. Always reference the official policy documents when answering.",
  "conversation_starters": [
    { "text": "What is the PTO policy?" },
    { "text": "How do I submit an expense report?" },
    { "text": "What are the health insurance options?" }
  ],
  "capabilities": [
    {
      "name": "WebSearch",
      "is_enabled": false
    },
    {
      "name": "GraphicArt",
      "is_enabled": false
    },
    {
      "name": "CodeInterpreter",
      "is_enabled": false
    },
    {
      "name": "OneDriveAndSharePoint",
      "items_by_url": [
        { "url": "https://contoso.sharepoint.com/sites/HR/Policies" }
      ]
    }
  ],
  "actions": [
    {
      "id": "hrisLookup",
      "file": "apiPlugin.json"
    }
  ]
}
```

### API Plugin for Declarative Agent

```json
// apiPlugin.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/copilot/plugin/v2.2/schema.json",
  "schema_version": "v2.2",
  "name_for_human": "HR System",
  "description_for_human": "Look up employee records and benefits",
  "namespace": "hris",
  "functions": [
    {
      "name": "getEmployee",
      "description": "Get employee details by email",
      "capabilities": {
        "response_semantics": {
          "data_path": "$.employee",
          "properties": {
            "title": "$.name",
            "subtitle": "$.department"
          }
        }
      }
    }
  ],
  "runtimes": [
    {
      "type": "OpenApi",
      "auth": { "type": "OAuthPluginVault" },
      "spec": { "url": "openapi.json" },
      "run_for_functions": ["getEmployee"]
    }
  ]
}
```

### App Manifest for Declarative Agent

```json
{
  "manifestVersion": "1.25",
  "copilotAgents": {
    "declarativeAgents": [
      {
        "id": "hrAssistant",
        "file": "declarativeAgent.json"
      }
    ]
  }
}
```

## Agent 365 Blueprints

User-customizable agent templates defined via `agenticUserTemplates` in manifest.

### Manifest Configuration

```json
{
  "agenticUserTemplates": [
    {
      "id": "customer-support",
      "name": "Customer Support Agent",
      "description": "Handles tier-1 customer support with product knowledge",
      "instructions": "You are a customer support agent for Contoso. Help customers with product questions, order status, and returns. Escalate complex issues to human agents. Always be polite and professional."
    },
    {
      "id": "sales-assistant",
      "name": "Sales Pipeline Agent",
      "description": "Assists sales team with pipeline management and forecasting",
      "instructions": "You help the sales team manage their pipeline. Track deals, suggest follow-ups, and generate forecasts based on historical data."
    },
    {
      "id": "onboarding-buddy",
      "name": "Onboarding Buddy",
      "description": "Guides new employees through their first 90 days",
      "instructions": "You are an onboarding buddy. Help new hires navigate company tools, introduce them to key processes, and answer common questions about the workplace."
    }
  ]
}
```

## Comparison Table

| Feature | Custom Engine | Declarative | Agent 365 |
|---|---|---|---|
| AI Model | Any (Claude, GPT, etc.) | M365 Copilot | M365 Copilot |
| Code Required | Yes (Bot Framework) | No (config only) | No (manifest only) |
| M365 Copilot License | No | Yes | Yes |
| Custom Knowledge | Via your code | SharePoint/OneDrive | Via instructions |
| API Integration | Full control | API plugins | Limited |
| Conversation History | You manage | Copilot manages | Copilot manages |
| Local Testing | Agents Playground | Copilot chat | Copilot chat |
| Manifest Required | v1.21+ | v1.25 | v1.25 |

## See Also

- `/teams:manifest` — customEngineAgents and agenticUserTemplates schema
- `/teams:auth` — Bot auth and SSO for agent apps
- `/teams:migrate` — Migrating existing bots to Custom Engine Agents
- `/teams:dialog` — Dialog interactions within agent conversations
