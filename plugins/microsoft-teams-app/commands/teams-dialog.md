---
name: teams:dialog
intent: Dialog namespace replacing deprecated tasks for modal interactions
tags:
  - microsoft-teams-app
  - command
  - dialog
inputs:
  - name: type
    description: "Dialog type: url | adaptive-card | bot | full"
    required: false
    default: full
risk: low
cost: low
description: Implement Teams dialogs (formerly task modules) using the modern dialog namespace with URL, Adaptive Card, and bot-initiated patterns
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams Dialogs (Formerly Task Modules)

The `dialog` namespace replaces the deprecated `tasks` namespace for modal interactions in Teams apps. Backward-compatible but all new code should use `dialog.*`.

## Usage

```bash
/teams:dialog [--type=url|adaptive-card|bot|full]
```

## Migration from tasks → dialog

```
┌───────────────────────────────────────────────────────┐
│           tasks (deprecated)  →  dialog (current)      │
├───────────────────────┬───────────────────────────────┤
│  tasks.startTask()    │  dialog.url.open()            │
│  tasks.submitTask()   │  dialog.url.submit()          │
│                       │  dialog.adaptiveCard.open()   │
│                       │  dialog.url.bot.open()        │
│                       │  dialog.adaptiveCard.bot.open()│
├───────────────────────┼───────────────────────────────┤
│  TeamsJS v1.x         │  TeamsJS v2.0.0+ (URL)       │
│                       │  TeamsJS v2.8.0+ (Adaptive)   │
└───────────────────────┴───────────────────────────────┘
```

## URL-Based Dialog

Opens a web page in a modal dialog.

### Opening a URL Dialog (Tab/App)

```typescript
// src/components/DialogLauncher.tsx
import { dialog, app } from "@microsoft/teams-js";

export function DialogLauncher() {

  const openFormDialog = async () => {
    await app.initialize();

    const dialogInfo: dialog.UrlDialogInfo = {
      url: `${window.location.origin}/dialogs/create-item`,
      title: "Create New Item",
      size: { height: 500, width: 600 },
      fallbackUrl: `${window.location.origin}/dialogs/create-item`,
    };

    dialog.url.open(dialogInfo, (result: dialog.ISdkResponse) => {
      if (result.err) {
        console.error("Dialog error:", result.err);
        return;
      }
      // result.result contains the submitted data as JSON string
      const data = JSON.parse(result.result as string);
      console.log("Dialog submitted:", data);
    });
  };

  return (
    <button onClick={openFormDialog}>Create Item</button>
  );
}
```

### Dialog Content Page

```typescript
// src/pages/CreateItemDialog.tsx
import { dialog, app } from "@microsoft/teams-js";
import { useState } from "react";

export function CreateItemDialog() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = async () => {
    await app.initialize();

    // Submit data back to the calling app
    dialog.url.submit(
      JSON.stringify({ title, description }),
      undefined  // appIds (optional, restrict which apps receive)
    );
  };

  const handleCancel = async () => {
    await app.initialize();
    dialog.url.submit(undefined); // Close without data
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Create New Item</h2>
      <input
        placeholder="Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
      />
      <div>
        <button onClick={handleSubmit}>Create</button>
        <button onClick={handleCancel}>Cancel</button>
      </div>
    </div>
  );
}
```

## Adaptive Card Dialog

Opens an Adaptive Card in a modal dialog (TeamsJS v2.8.0+).

### From Tab/App

```typescript
import { dialog, app } from "@microsoft/teams-js";

const openAdaptiveCardDialog = async () => {
  await app.initialize();

  const dialogInfo: dialog.AdaptiveCardDialogInfo = {
    card: JSON.stringify({
      type: "AdaptiveCard",
      version: "1.5",
      body: [
        {
          type: "TextBlock",
          text: "Submit Feedback",
          weight: "Bolder",
          size: "Large"
        },
        {
          type: "Input.Text",
          id: "feedback",
          label: "Your Feedback",
          isMultiline: true,
          isRequired: true,
          errorMessage: "Feedback is required"
        },
        {
          type: "Input.ChoiceSet",
          id: "rating",
          label: "Rating",
          choices: [
            { title: "Excellent", value: "5" },
            { title: "Good", value: "4" },
            { title: "Average", value: "3" },
            { title: "Poor", value: "2" },
            { title: "Terrible", value: "1" }
          ],
          value: "4"
        }
      ],
      actions: [
        {
          type: "Action.Submit",
          title: "Submit Feedback",
          data: { action: "submitFeedback" }
        }
      ]
    }),
    title: "Feedback Form",
    size: { height: 400, width: 500 }
  };

  dialog.adaptiveCard.open(dialogInfo, (result: dialog.ISdkResponse) => {
    if (result.err) {
      console.error("Dialog error:", result.err);
      return;
    }
    const data = JSON.parse(result.result as string);
    console.log("Feedback:", data);
  });
};
```

## Bot-Initiated Dialog

Bot sends a dialog to the user via invoke response.

### From Bot (URL)

```typescript
// src/bot/dialogBot.ts
import {
  TeamsActivityHandler,
  TurnContext,
  TaskModuleRequest,
  TaskModuleResponse,
  CardFactory,
} from "botbuilder";

export class DialogBot extends TeamsActivityHandler {

  // When user triggers a dialog from a card action
  async handleTeamsTaskModuleFetch(
    context: TurnContext,
    taskModuleRequest: TaskModuleRequest
  ): Promise<TaskModuleResponse> {
    const action = taskModuleRequest.data?.action;

    switch (action) {
      case "editItem":
        return {
          task: {
            type: "continue",
            value: {
              url: `https://${process.env.TAB_DOMAIN}/dialogs/edit?id=${taskModuleRequest.data.itemId}`,
              title: "Edit Item",
              height: 500,
              width: 600,
              fallbackUrl: `https://${process.env.TAB_DOMAIN}/dialogs/edit?id=${taskModuleRequest.data.itemId}`
            }
          }
        };

      case "quickFeedback":
        // Return Adaptive Card dialog
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
                    id: "comment",
                    label: "Quick Comment",
                    isMultiline: true
                  }
                ],
                actions: [
                  {
                    type: "Action.Submit",
                    title: "Send"
                  }
                ]
              }),
              title: "Quick Feedback",
              height: 200,
              width: 400
            }
          }
        };

      default:
        return { task: { type: "message", value: "Unknown action" } };
    }
  }

  // When dialog submits data back
  async handleTeamsTaskModuleSubmit(
    context: TurnContext,
    taskModuleRequest: TaskModuleRequest
  ): Promise<TaskModuleResponse> {
    const data = taskModuleRequest.data;
    console.log("Dialog submitted:", data);

    // Process the submitted data
    await this.processSubmission(data);

    // Return a completion message or chain another dialog
    return {
      task: {
        type: "message",
        value: "Item updated successfully!"
      }
    };
  }
}
```

### Trigger Dialog from Adaptive Card

```json
{
  "type": "AdaptiveCard",
  "version": "1.5",
  "body": [
    {
      "type": "TextBlock",
      "text": "Project Status: Active",
      "weight": "Bolder"
    }
  ],
  "actions": [
    {
      "type": "Action.Submit",
      "title": "Edit Details",
      "data": {
        "msteams": {
          "type": "task/fetch"
        },
        "action": "editItem",
        "itemId": "PROJ-001"
      }
    },
    {
      "type": "Action.Submit",
      "title": "Add Comment",
      "data": {
        "msteams": {
          "type": "task/fetch"
        },
        "action": "quickFeedback"
      }
    }
  ]
}
```

## Dialog Size Presets

| Size | Height | Width |
|---|---|---|
| Small | 250 | 350 |
| Medium | 500 | 600 |
| Large | 700 | 900 |
| Custom | 50-700 | 280-900 |

Minimum: 50×280. Maximum: 700×900.

## Dialog vs. Stage View vs. Side Panel

| Feature | Dialog | Stage View | Side Panel |
|---|---|---|---|
| Scope | Any Teams surface | Meetings only | Meetings only |
| Modal | Yes (blocks interaction) | No (shared content) | No (side content) |
| Size | Configurable | Full meeting stage | Fixed 320px |
| Initiated by | Tab, bot, card | Side panel share | Manifest config |
| Namespace | `dialog.*` | `meeting.*` | Tab context |

## See Also

- `/teams:meeting-app` — Dialogs within meeting context
- `/teams:msgext` — Action message extensions use fetchTask dialogs
- `/teams:manifest` — Valid domains for dialog URLs
