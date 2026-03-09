---
name: teams:msgext
intent: Build message extensions — search, action, link unfurling, Adaptive Cards
tags:
  - microsoft-teams-app
  - command
  - message-extensions
inputs:
  - name: type
    description: "Extension type: search | action | link-unfurling | api-based | full"
    required: false
    default: full
  - name: backend
    description: "Backend type: bot | api"
    required: false
    default: bot
risk: low
cost: low
description: Build Teams message extensions with search commands, action commands, link unfurling, Adaptive Cards, and Universal Actions
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams Message Extensions

Build message extensions that let users search external services, take actions, and share rich cards — all from the compose box, command bar, or directly on messages.

## Usage

```bash
/teams:msgext [--type=search|action|link-unfurling|api-based|full] [--backend=bot|api]
```

## API-Based vs Bot-Based

```
┌─────────────────────────────────────────────────────────┐
│              MESSAGE EXTENSION TYPES                     │
├────────────────────────┬────────────────────────────────┤
│     API-BASED          │     BOT-BASED                  │
│                        │                                │
│  • OpenAPI spec only   │  • Full Bot Framework          │
│  • Search commands     │  • Search + Action + Link      │
│  • No bot required     │  • Complex business logic      │
│  • Simpler setup       │  • Multi-service integration   │
│  • Private traffic     │  • Conversation flow           │
│  • Manifest v1.17+     │  • State management            │
│                        │  • Proactive messaging         │
└────────────────────────┴────────────────────────────────┘
```

## Manifest v1.25 — composeExtensions

### Search-Based (Bot)

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
  "manifestVersion": "1.25",
  "composeExtensions": [
    {
      "botId": "{bot-app-id}",
      "type": "bot",
      "commands": [
        {
          "id": "searchProducts",
          "type": "query",
          "title": "Search Products",
          "description": "Search the product catalog",
          "initialRun": true,
          "parameters": [
            {
              "name": "query",
              "title": "Search query",
              "description": "Enter product name or SKU",
              "inputType": "text"
            },
            {
              "name": "category",
              "title": "Category",
              "description": "Filter by category",
              "inputType": "choiceset",
              "choices": [
                { "title": "Electronics", "value": "electronics" },
                { "title": "Clothing", "value": "clothing" },
                { "title": "Books", "value": "books" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Action-Based (Bot)

```json
{
  "composeExtensions": [
    {
      "botId": "{bot-app-id}",
      "type": "bot",
      "commands": [
        {
          "id": "createTicket",
          "type": "action",
          "title": "Create Ticket",
          "description": "Create a support ticket from this message",
          "context": ["compose", "commandBox", "message"],
          "fetchTask": true,
          "parameters": [
            {
              "name": "title",
              "title": "Ticket Title",
              "inputType": "text"
            },
            {
              "name": "priority",
              "title": "Priority",
              "inputType": "choiceset",
              "choices": [
                { "title": "Critical", "value": "P1" },
                { "title": "High", "value": "P2" },
                { "title": "Medium", "value": "P3" },
                { "title": "Low", "value": "P4" }
              ]
            }
          ]
        }
      ]
    }
  ]
}
```

### Link Unfurling

```json
{
  "composeExtensions": [
    {
      "botId": "{bot-app-id}",
      "type": "bot",
      "messageHandlers": [
        {
          "type": "link",
          "value": {
            "domains": [
              "*.example.com",
              "app.myservice.io"
            ]
          }
        }
      ],
      "commands": []
    }
  ]
}
```

### API-Based (No Bot)

```json
{
  "composeExtensions": [
    {
      "composeExtensionType": "apiBased",
      "apiSpecificationFile": "apiSpecificationFile/openapi.json",
      "commands": [
        {
          "id": "searchItems",
          "type": "query",
          "title": "Search Items",
          "context": ["compose", "commandBox"],
          "parameters": [
            {
              "name": "query",
              "title": "Search",
              "description": "Search term",
              "inputType": "text"
            }
          ],
          "apiResponseRenderingTemplateFile": "responseTemplates/searchItems.json"
        }
      ]
    }
  ]
}
```

## Bot-Based Implementation

### Search Command Handler

```typescript
// src/searchHandler.ts
import {
  TeamsActivityHandler,
  CardFactory,
  MessagingExtensionQuery,
  MessagingExtensionResponse,
  TurnContext
} from "botbuilder";

export class SearchHandler extends TeamsActivityHandler {

  async handleTeamsMessagingExtensionQuery(
    context: TurnContext,
    query: MessagingExtensionQuery
  ): Promise<MessagingExtensionResponse> {
    const searchQuery = query.parameters?.[0]?.value || "";
    const category = query.parameters?.[1]?.value || "all";

    // Query your external service
    const results = await this.searchProducts(searchQuery, category);

    const attachments = results.map((item) => {
      const card = CardFactory.adaptiveCard({
        type: "AdaptiveCard",
        $schema: "http://adaptivecards.io/schemas/adaptive-card.json",
        version: "1.5",
        body: [
          {
            type: "TextBlock",
            text: item.name,
            weight: "Bolder",
            size: "Medium"
          },
          {
            type: "TextBlock",
            text: item.description,
            wrap: true
          },
          {
            type: "FactSet",
            facts: [
              { title: "Price", value: `$${item.price}` },
              { title: "SKU", value: item.sku },
              { title: "Stock", value: `${item.stock} units` }
            ]
          }
        ],
        actions: [
          {
            type: "Action.Execute",
            title: "Add to Cart",
            verb: "addToCart",
            data: { productId: item.id }
          },
          {
            type: "Action.OpenUrl",
            title: "View Details",
            url: item.detailUrl
          }
        ]
      });

      return {
        ...CardFactory.heroCard(item.name, item.description),
        preview: CardFactory.heroCard(
          item.name,
          item.description,
          [item.thumbnailUrl]
        )
      };
    });

    return {
      composeExtension: {
        type: "result",
        attachmentLayout: "list",
        attachments
      }
    };
  }
}
```

### Action Command Handler

```typescript
// src/actionHandler.ts
async handleTeamsMessagingExtensionFetchTask(
  context: TurnContext,
  action: any
): Promise<any> {
  // Return Adaptive Card as task module
  return {
    task: {
      type: "continue",
      value: {
        card: CardFactory.adaptiveCard({
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "Input.Text",
              id: "title",
              label: "Ticket Title",
              isRequired: true,
              errorMessage: "Title is required"
            },
            {
              type: "Input.ChoiceSet",
              id: "priority",
              label: "Priority",
              choices: [
                { title: "Critical", value: "P1" },
                { title: "High", value: "P2" },
                { title: "Medium", value: "P3" }
              ],
              value: "P3"
            },
            {
              type: "Input.Text",
              id: "description",
              label: "Description",
              isMultiline: true
            }
          ],
          actions: [
            {
              type: "Action.Submit",
              title: "Create Ticket"
            }
          ]
        }),
        title: "Create Support Ticket",
        height: 400,
        width: 500
      }
    }
  };
}

async handleTeamsMessagingExtensionSubmitAction(
  context: TurnContext,
  action: any
): Promise<any> {
  const { title, priority, description } = action.data;

  // Create ticket in external system
  const ticket = await this.createTicket({ title, priority, description });

  // Return confirmation card to chat
  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [
        CardFactory.adaptiveCard({
          type: "AdaptiveCard",
          version: "1.5",
          body: [
            {
              type: "TextBlock",
              text: `✅ Ticket Created: ${ticket.id}`,
              weight: "Bolder"
            },
            {
              type: "FactSet",
              facts: [
                { title: "Title", value: title },
                { title: "Priority", value: priority },
                { title: "Status", value: "Open" }
              ]
            }
          ]
        })
      ]
    }
  };
}
```

### Link Unfurling Handler

```typescript
// src/linkUnfurlHandler.ts
async handleTeamsAppBasedLinkQuery(
  context: TurnContext,
  query: any
): Promise<any> {
  const url = query.url;

  // Parse the URL and fetch metadata
  const metadata = await this.fetchUrlMetadata(url);

  const card = CardFactory.adaptiveCard({
    type: "AdaptiveCard",
    version: "1.5",
    body: [
      {
        type: "ColumnSet",
        columns: [
          {
            type: "Column",
            width: "auto",
            items: [
              {
                type: "Image",
                url: metadata.thumbnailUrl,
                size: "Medium"
              }
            ]
          },
          {
            type: "Column",
            width: "stretch",
            items: [
              {
                type: "TextBlock",
                text: metadata.title,
                weight: "Bolder",
                wrap: true
              },
              {
                type: "TextBlock",
                text: metadata.description,
                wrap: true,
                isSubtle: true
              }
            ]
          }
        ]
      }
    ],
    actions: [
      {
        type: "Action.OpenUrl",
        title: "Open",
        url: url
      }
    ]
  });

  return {
    composeExtension: {
      type: "result",
      attachmentLayout: "list",
      attachments: [{ ...card, preview: card }]
    }
  };
}
```

## API-Based Implementation

### OpenAPI Specification

```json
// apiSpecificationFile/openapi.json
{
  "openapi": "3.0.1",
  "info": {
    "title": "Product Search API",
    "version": "1.0.0"
  },
  "servers": [
    { "url": "https://api.example.com" }
  ],
  "paths": {
    "/search": {
      "get": {
        "operationId": "searchProducts",
        "summary": "Search products",
        "parameters": [
          {
            "name": "query",
            "in": "query",
            "required": true,
            "schema": { "type": "string" }
          }
        ],
        "responses": {
          "200": {
            "description": "Search results",
            "content": {
              "application/json": {
                "schema": {
                  "type": "object",
                  "properties": {
                    "results": {
                      "type": "array",
                      "items": {
                        "$ref": "#/components/schemas/Product"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  "components": {
    "schemas": {
      "Product": {
        "type": "object",
        "properties": {
          "name": { "type": "string" },
          "description": { "type": "string" },
          "price": { "type": "number" },
          "imageUrl": { "type": "string" }
        }
      }
    }
  }
}
```

### Response Rendering Template

```json
// responseTemplates/searchItems.json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/vDevPreview/MicrosoftTeams.ResponseRenderingTemplate.schema.json",
  "version": "1.0",
  "jsonPath": "results",
  "responseLayout": "list",
  "responseCardTemplate": {
    "$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
    "type": "AdaptiveCard",
    "version": "1.5",
    "body": [
      {
        "type": "TextBlock",
        "text": "${name}",
        "weight": "Bolder"
      },
      {
        "type": "TextBlock",
        "text": "${description}",
        "wrap": true
      }
    ]
  },
  "previewCardTemplate": {
    "title": "${name}",
    "subtitle": "$${price}"
  }
}
```

## Universal Actions for Adaptive Cards

Cross-platform interactivity with user-specific views and automatic refresh.

```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "refresh": {
    "action": {
      "type": "Action.Execute",
      "title": "Refresh",
      "verb": "refreshCard",
      "data": { "ticketId": "T-1234" }
    },
    "userIds": [
      "${userId1}",
      "${userId2}"
    ]
  },
  "body": [
    {
      "type": "TextBlock",
      "text": "Approval Request: Budget Increase",
      "weight": "Bolder"
    }
  ],
  "actions": [
    {
      "type": "Action.Execute",
      "title": "Approve",
      "verb": "approve",
      "data": { "requestId": "REQ-001" },
      "style": "positive"
    },
    {
      "type": "Action.Execute",
      "title": "Reject",
      "verb": "reject",
      "data": { "requestId": "REQ-001" },
      "style": "destructive"
    }
  ]
}
```

### Handle Universal Action on Bot

```typescript
async handleTeamsCardActionInvoke(
  context: TurnContext
): Promise<any> {
  const verb = context.activity.value?.action?.verb;
  const data = context.activity.value?.action?.data;
  const userId = context.activity.from.aadObjectId;

  switch (verb) {
    case "approve":
      await this.approveRequest(data.requestId, userId);
      // Return updated card (user-specific view)
      return {
        statusCode: 200,
        type: "application/vnd.microsoft.card.adaptive",
        value: this.buildApprovedCard(data.requestId, userId)
      };

    case "reject":
      await this.rejectRequest(data.requestId, userId);
      return {
        statusCode: 200,
        type: "application/vnd.microsoft.card.adaptive",
        value: this.buildRejectedCard(data.requestId, userId)
      };

    case "refreshCard":
      const status = await this.getRequestStatus(data.ticketId);
      return {
        statusCode: 200,
        type: "application/vnd.microsoft.card.adaptive",
        value: this.buildStatusCard(status, userId)
      };

    default:
      return { statusCode: 200 };
  }
}
```

## Context Options

| Context | Where it appears |
|---|---|
| `compose` | Compose box (default) |
| `commandBox` | Top command bar |
| `message` | Right-click/overflow menu on messages |

## Choosing API-Based vs Bot-Based

| Factor | API-Based | Bot-Based |
|---|---|---|
| Setup complexity | Lower (OpenAPI spec) | Higher (Bot Framework) |
| Command types | Search only | Search + Action + Link Unfurl |
| Auth | API key / OAuth | Bot auth + SSO |
| Business logic | External API handles | Bot code handles |
| State management | Stateless | Stateful via bot storage |
| Proactive messaging | No | Yes |
| Best for | Simple lookups | Complex workflows |

## See Also

- `/teams:manifest` — Full v1.25 manifest schema
- `/teams:dialog` — Dialog namespace for action task modules
- `/teams:auth` — SSO and NAA for message extension auth
- `/teams:meeting-app` — Message extensions in meeting chat
