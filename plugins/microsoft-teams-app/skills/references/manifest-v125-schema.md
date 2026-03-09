# Manifest v1.25 Schema Reference

Schema URL: `https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json`

## New Properties (v1.25 vs v1.17)

| Property | Type | Description |
|---|---|---|
| `supportsChannelFeatures` | Object | `{ supportsSharedChannels: bool, supportsPrivateChannels: bool }` |
| `nestedAppAuthInfo` | Object | `{ clientId: string, resource: string }` — NAA token prefetch |
| `backgroundLoadConfiguration` | Object | `{ url: string }` — Tab precaching in hidden iframe |
| `agenticUserTemplates` | Array | Agent 365 persona definitions with id, name, description, instructions |
| `customEngineAgents` | Array | `[{ id: string, type: "CustomEngine" }]` |
| `copilotAgents.declarativeAgents` | Array | `[{ id: string, file: string }]` — path to declarativeAgent.json |
| `activities.activityIcons` | Object | Map of activityType → icon URL for Outlook/M365 feed |
| `meetingExtensionDefinition` | Object | `{ supportsAnonymousGuestUsers: bool }` |

## Required Root Properties

| Property | Description |
|---|---|
| `$schema` | Must reference v1.25 schema URL |
| `manifestVersion` | `"1.25"` |
| `version` | Semver string (e.g. `"1.0.0"`) |
| `id` | GUID — matches Entra app registration |
| `developer` | Object with name, websiteUrl, privacyUrl, termsOfUseUrl |
| `name` | Object with short (≤30 chars), full (≤100 chars) |
| `description` | Object with short (≤80 chars), full (≤4000 chars) |
| `icons` | Object with color (192×192), outline (32×32 transparent) |

## Tab Context Values

| Context | Surface |
|---|---|
| `personalTab` | Personal app tab |
| `channelTab` | Channel tab |
| `privateChatTab` | 1:1 or group chat tab |
| `meetingChatTab` | Pre/post meeting chat tab |
| `meetingDetailsTab` | Meeting details (pre-meeting) |
| `meetingSidePanel` | In-meeting side panel (320px) |
| `meetingStage` | In-meeting shared stage |

## Bot Scopes

- `personal` — 1:1 chat
- `team` — Channel messages
- `groupChat` — Group chat messages

## composeExtensions.commands.type

- `query` — Search command
- `action` — Action command (fetchTask)

## composeExtensions.commands.context

- `compose` — Compose box
- `commandBox` — Top command bar
- `message` — Message overflow menu
