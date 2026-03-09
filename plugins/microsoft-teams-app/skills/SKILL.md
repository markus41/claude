---
name: teams-app-dev
description: Microsoft Teams app development with manifest v1.25, meeting apps, message extensions, agents, and M365 Agents Toolkit
version: 1.0.0
triggers:
  - teams app
  - teams manifest
  - meeting app
  - message extension
  - compose extension
  - live share
  - teams agent
  - m365 agents toolkit
  - teams dialog
  - teams migration
  - teamsfx
  - teams auth
  - naa auth
  - together mode
  - stage view
  - link unfurling
  - adaptive cards teams
  - custom engine agent
  - declarative agent
  - agent 365
---

# Microsoft Teams App Development

Build Microsoft Teams apps on the modern M365 Agents Toolkit stack with manifest v1.25. Complete coverage of meeting apps, message extensions, Custom Engine Agents, Declarative Agents, Agent 365, Nested App Authentication, Live Share SDK, and migration from deprecated TeamsFx.

## Commands

| Command | Description |
|---|---|
| `/teams:manifest` | v1.25 schema reference, scaffold, validate, migrate from v1.17 |
| `/teams:meeting-app` | Meeting lifecycle — side panels, stage view, content bubbles, Live Share, Together Mode |
| `/teams:msgext` | Message extensions — search, action, link unfurling, API-based vs bot-based, Universal Actions |
| `/teams:auth` | Single-tenant enforcement, NAA (pop-up-free SSO), bot auth |
| `/teams:agent` | Custom Engine Agents, Declarative Agents, comparison table |
| `/teams:agent365` | Agent 365 blueprints, identity, MCP tools, publishing |
| `/teams:dialog` | Dialog namespace replacing deprecated tasks — URL, Adaptive Card, bot-initiated |
| `/teams:migrate` | Migration from TeamsFx/Bot Framework to M365 Agents Toolkit |

## Modern Stack (2025+)

| Component | Old (Deprecated) | New (Current) |
|---|---|---|
| Toolkit | Teams Toolkit | M365 Agents Toolkit |
| CLI | `@microsoft/teamsapp-cli` | `@microsoft/m365agentstoolkit-cli` (`atk`) |
| Config | `teamsapp.yml` | `m365agents.yml` |
| Auth SDK | `@microsoft/teamsfx` | `@azure/msal-browser` v3.15+ |
| TeamsJS | v1.x | v2.28+ |
| Manifest | v1.17 | v1.25 |
| Task Modules | `tasks.*` namespace | `dialog.*` namespace |
| Bot Testing | Bot Emulator | Agents Playground |
| Tenant Model | Multi-tenant | Single-tenant enforced |

## Manifest v1.25 New Properties

- `supportsChannelFeatures` — Shared/private channel support
- `nestedAppAuthInfo` — NAA token prefetch for pop-up-free SSO
- `backgroundLoadConfiguration` — Tab precaching
- `agenticUserTemplates` — Agent 365 user-customizable personas
- `customEngineAgents` — Bring-your-own AI agent registration
- `copilotAgents.declarativeAgents` — M365 Copilot extensions
- `activities.activityIcons` — Custom activity feed icons
- `meetingExtensionDefinition` — Anonymous guest meeting support

## Known v1.25 Bugs

1. **Regex validation** — Schema rejects valid strings; validate with CLI not Dev Portal
2. **supportsChannelFeatures** — Dev Portal silently drops on save; edit in manifest.json
3. **v1.25 upgrade** — Cannot upgrade via Dev Portal UI; edit manifestVersion in JSON

## Architecture Decision Guide

```
Building a Teams app?
│
├── Need AI agent?
│   ├── Own AI model (Claude/GPT/etc) → Custom Engine Agent
│   ├── Extend M365 Copilot → Declarative Agent
│   └── User-customizable personas → Agent 365 (agenticUserTemplates)
│
├── Need meeting integration?
│   ├── Side content → Side Panel (320px)
│   ├── Shared presentation → Stage View
│   ├── Notifications → Content Bubble
│   ├── Real-time collab → Live Share SDK
│   └── Immersive video → Together Mode (5-49 people)
│
├── Need compose box integration?
│   ├── Simple search → API-Based Message Extension
│   ├── Search + actions → Bot-Based Message Extension
│   ├── URL previews → Link Unfurling
│   └── Cross-platform actions → Universal Actions
│
├── Need modal forms?
│   └── Dialog namespace (dialog.url.open / dialog.adaptiveCard.open)
│
└── Need auth?
    ├── SPA tab in iframe → NAA (MSAL.js v3.15+)
    ├── Traditional tab → SSO (authentication.getAuthToken)
    └── Bot user context → Bot SSO (OAuth connection)
```
