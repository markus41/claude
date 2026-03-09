---
name: Teams App Development
description: Use for building, configuring, testing, and deploying Microsoft Teams apps with manifest v1.25, M365 Agents Toolkit, meeting apps, message extensions, and agents.
version: 1.0.0
---

# Teams App Development

Use this skill when users need to build, configure, or troubleshoot Microsoft Teams applications on the modern v1.25 manifest and M365 Agents Toolkit stack.

## Fast Path

1. Classify request (scaffold, manifest, auth, meeting, message extension, agent, dialog, migration).
2. Select appropriate surface(s) and auth model.
3. Generate code/config using v1.25 patterns.
4. Validate manifest and test with Agents Playground or Teams preview.

## Capability Matrix

| Surface | Manifest Key | Auth Model | Testing |
|---|---|---|---|
| Personal Tab | `staticTabs` | NAA / SSO | Browser preview |
| Channel Tab | `configurableTabs` | NAA / SSO | Teams sideload |
| Meeting Panel | `configurableTabs` + `meetingSurfaces` | NAA | Meeting sideload |
| Meeting Stage | `configurableTabs` + context `meetingStage` | NAA | Meeting sideload |
| Bot | `bots` | Bot SSO | Agents Playground |
| Search ME | `composeExtensions` (query) | Bot auth / API key | Teams sideload |
| Action ME | `composeExtensions` (action) | Bot auth | Teams sideload |
| Link Unfurl | `composeExtensions` (messageHandlers) | Bot auth | Teams sideload |
| Custom Engine Agent | `customEngineAgents` + `bots` | Bot SSO | Agents Playground |
| Declarative Agent | `copilotAgents` | Entra | Copilot chat |
| Agent 365 | `agenticUserTemplates` | Entra | Copilot chat |

## References

- Manifest v1.25 schema: `references/manifest-v125-schema.md`
- Meeting APIs and surfaces: `references/meeting-apis.md`
- Message extension patterns: `references/msgext-patterns.md`
- Auth flows (NAA, SSO, bot): `references/auth-flows.md`
- Live Share SDK: `references/live-share.md`
- M365 Agents Toolkit CLI: `references/m365-toolkit-cli.md`
- Known bugs and workarounds: `references/known-bugs.md`
