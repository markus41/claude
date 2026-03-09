# Message Extension Patterns Reference

## Type Decision Tree

```
Need message extension?
├── Simple external search → API-Based (OpenAPI spec, no bot)
├── Search + rich results → Bot-Based, type: query
├── Create/modify from message → Bot-Based, type: action
├── URL preview in compose → Bot-Based, messageHandlers (link unfurl)
└── Cross-platform card actions → Universal Actions (Action.Execute)
```

## Bot Handler Methods

| Handler | Trigger | Use Case |
|---|---|---|
| `handleTeamsMessagingExtensionQuery` | User types in search box | Search commands |
| `handleTeamsMessagingExtensionFetchTask` | User clicks action button | Open action form |
| `handleTeamsMessagingExtensionSubmitAction` | User submits action form | Process action data |
| `handleTeamsAppBasedLinkQuery` | User pastes matching URL | Link unfurling |
| `handleTeamsCardActionInvoke` | User clicks Action.Execute | Universal Actions |

## API-Based Requirements

- OpenAPI 3.0.1 spec in `apiSpecificationFile/`
- Response rendering template in `responseTemplates/`
- Manifest `composeExtensionType: "apiBased"`
- Search commands only (no action/link unfurl)
- No bot registration needed

## Response Types

| `attachmentLayout` | Display |
|---|---|
| `list` | Vertical list of results |
| `grid` | Grid layout (image-heavy) |

## Command Contexts

| Context | Location | Trigger |
|---|---|---|
| `compose` | Compose box | User invokes from compose |
| `commandBox` | Top search bar | User types in command bar |
| `message` | Message menu | User right-clicks/overflow on message |

## Universal Actions Pattern

1. Card includes `Action.Execute` with `verb` and `data`
2. Bot receives `handleTeamsCardActionInvoke`
3. Bot returns updated card (user-specific view)
4. `refresh.userIds` controls which users get auto-refresh
5. Just-in-Time bot install if user doesn't have bot

## inputType Options

- `text` — Free-form text input
- `textarea` — Multi-line text
- `number` — Numeric input
- `date` — Date picker
- `time` — Time picker
- `toggle` — Boolean toggle
- `choiceset` — Dropdown with `choices` array
