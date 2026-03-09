# Microsoft Teams v1.25 Manifest & Modern Development Research (2026-03-09)

## Research Scope
Comprehensive research on Teams app manifest v1.25 schema, M365 Agents Toolkit, meeting extensions, message extensions, and modern Teams development patterns.

## Key Findings by Topic

### 1. MANIFEST v1.25 SCHEMA CHANGES

#### New Properties (v1.25)
- **supportsChannelFeatures** (string: "tier1")
  - Opts app into next-level channel features
  - Includes shared and private channels support
  - **Known Bug**: Dev Portal does not persist this property (save fails silently)
  - **Known Bug**: Regex validation error in schema (invalid escape sequence)

- **nestedAppAuthInfo** (object)
  - Enables prefetching of nested app authentication token when tab loads
  - Added `claims` property for specifying JSON-formatted claims capabilities
  - Enables pop-up-free iframe auth for SPAs
  - Supported in MSAL.js v3.15+

- **backgroundLoadConfiguration** (object)
  - Enables tab apps to opt-in to precaching
  - Faster initial load experience
  - Tab-specific optimization

- **agenticUserTemplates** (object)
  - References Agent 365 blueprints
  - Enables instantiation of AI agents with own Microsoft Entra Agent ID
  - Org-scoped agent identity management

#### Activity Feed Customization
- **activityIcons**: Define icon for activity feed
- **allowedIconIds**: Specify which icons appear for each activity type
- Purpose: Consistent app appearance in Outlook and M365

#### Spam Reporting Dialog Enhancements
- Added `type` property supporting radio buttons or checkboxes
- Controls spam report preprocessing dialog UI

#### Schema Location
- v1.25 JSON schema: `https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json`
- Manifest versions supported: v1.19 through v1.25

#### CRITICAL KNOWN BUGS
1. **Regex Validation Bug**: `/^(?!.*[\r\n\f\b\v\a\t])[\S]*\.xll$/` causes validation to fail with "Invalid escape (!)"
2. **Dev Portal Save Failures**: supportsChannelFeatures not persisted (appears to save but reverts)
3. **Generic Error Messages**: Portal shows success then fails on save with no error details
4. **Manifest Version Update Blocked**: Cannot update to v1.25 in Developer Portal UI

### 2. M365 AGENTS TOOLKIT (Replaces Teams Toolkit)

#### Package & CLI
- **Package**: `@microsoft/m365agentstoolkit-cli` (npm install -g)
- **Command**: `atk` (replaces `teamsfx`)
- **Configuration File**: `m365agents.yml` (replaces `teamsapp.yml`)
- **Local Config**: `m365agents.local.yml` (local development overrides)

#### Legacy Status
- **TeamsFx SDK**: Officially deprecated, community-only support until Sept 2026
- **Recommendation**: Migrate existing TeamsFx projects to M365 Agents SDK
- **New Projects**: Do not use TeamsFx

#### Key Toolkit Features
- Agent/app creation from templates
- Lifecycle management (provision, deploy, publish)
- Resource provisioning and Azure deployment
- Validation, packaging, publishing
- Environment management (dev, staging, prod)
- Collaboration/team access management

#### CLI Commands (Core)
- `atk doctor` - Prerequisite checking
- `atk new` - Create new app/agent with templates
- `atk add` - Add capabilities (spfx-web-part, action, auth-config)
- `atk auth` - Account management
- `atk provision` / `atk deploy` / `atk publish` - Lifecycle
- `atk validate` - Schema and rule validation
- `atk preview` - Local and remote preview
- `atk install` - Upload to M365
- `atk package` - Build app package
- `atk update` - Update manifest in Dev Portal

#### Template Capabilities
- `declarative-agent` - Copilot extension
- `basic-custom-engine-agent` - Custom orchestration
- `weather-agent` - Sample agent

### 3. NESTED APP AUTHENTICATION (NAA)

#### Purpose
- Simplified SSO for SPAs in Teams, Outlook, Office
- Pop-up-free iframe authentication
- Prefetch tokens for faster UX

#### Scope Configuration
- **Single-tenant**: Configure specific tenant authority
- **Multi-tenant**: Use "common" endpoint
- Default: `initMsal()` with authority: "common"

#### Requirements
- MSAL.js v3.15 or higher
- Manifest v1.21+ for custom engine agents
- nestedAppAuthInfo property in manifest

#### Supported Platforms
- Teams desktop, mobile, web
- Outlook desktop, mobile, web
- Office web
- Office Add-ins

### 4. MEETING EXTENSIONS - FULL COVERAGE

#### Meeting Lifecycle
1. **Pre-Meeting**: Tab configured in meeting invite
2. **In-Meeting**: Side panel, content bubble, stage view
3. **Post-Meeting**: Tab accessible after meeting

#### Key Interfaces

**Side Panel**
- Open at any time during meeting
- 320px canvas for custom experiences
- Real-time collaboration with Live Share

**Content Bubble (In-Meeting Dialog)**
- Pop-up notifications
- Feedback/prompt collection
- Focused user interactions

**Meeting Stage / Share to Stage**
- Share app content to main meeting view
- Full-screen or windowed mode
- Presenter/organizer role restrictions

**meetingExtensionDefinition in Manifest**
```json
{
  "meetingExtensionDefinition": {
    "supportsAnonymousGuestUsers": true
  }
}
```

#### APIs & Events
- **GetParticipant API**: Fetch participant info (limit 350 participants)
- **Meeting Events**: Participant join/leave, role changes
- **Notification APIs**: Send in-meeting bubbles
- **Context APIs**: Meeting ID, organizer, participants, roles

#### Tabs in Meetings
- Configurable tabs with context: `["meetingChatTab", "meetingDetailsTab", "meetingSidePanel", "meetingStage"]`
- Pre, in, post-meeting access patterns
- Anonymous guest support (schema v1.16+)

### 5. LIVE SHARE SDK

#### Purpose
Real-time collaborative experiences in meetings without dedicated backend.

#### Core Components
- **LiveShareClient**: Fluid container connection
- **LivePresence**: User tracking and awareness
- **LiveState**: Shared state synchronization
- **LiveTimer**: Collaborative countdowns
- **LiveEvent**: Stateless value broadcasting
- **LiveFollowMode** (beta): Presenter/following features

#### Media Extensions
- Video/audio synchronization
- Turn-key inking, laser pointers, cursor sharing
- Role verification (respects meeting privileges)

#### Context Support
- Chat tabs, channel tabs, configurable tabs
- Desktop and web clients (mobile NOT supported)
- Collaborative Stageview

### 6. TOGETHER MODE & CUSTOM SCENES

#### Overview
- Immersive digital environment combining participants
- 5-49 participant video seats per scene
- Requires Teams Premium license for use

#### Implementation
- Created with Microsoft Scene Studio
- Bitmap images, sprites, rectangles for video placement
- Role-based seat reservation (organizer, presenter)
- Custom backgrounds for meeting types

#### Limitations
- Cannot initiate on mobile (but appear on desktop if enabled)
- Requires minimum 5 participants
- Maximum 49 visible participants

### 7. MESSAGE EXTENSIONS

#### Types

**API-Based Message Extensions**
- Uses OpenAPI Description (OAD) document
- No bot infrastructure required
- Simpler development, faster creation
- Supports: Search commands only
- No link unfurling
- Private traffic (not through Azure bot infra)

**Bot-Based Message Extensions**
- Uses Bot Framework
- Full bot capabilities available
- Supports: Action, search, link unfurling
- Better for complex logic/state management
- Multi-service communication

#### Command Types
1. **Search Commands**: Query external system, embed results as cards
2. **Action Commands**: Modal/dialog for user input, insert to compose or conversation
3. **Link Unfurling**: Trigger on specific URL patterns, expand with rich card

#### Manifest Configuration
```json
{
  "composeExtensions": [
    {
      "botId": "...",
      "commands": [
        { "id": "search", "type": "query", "title": "Search..." },
        { "id": "action", "type": "action", "title": "Create..." }
      ],
      "messageHandlers": [
        { "type": "link", "value": { "domains": ["*.domain.com"] } }
      ]
    }
  ]
}
```

#### Locations
- Compose message area
- Command box
- Message (search only, not actions)

### 8. UNIVERSAL ACTIONS FOR ADAPTIVE CARDS

#### Purpose
Enable Adaptive Card interactivity across Teams, Outlook, web with consistent UX.

#### Key Features
- **Action.Execute**: Cross-platform action handling
- **User-Specific Views**: Different card states per user
- **Automatic Refresh**: Keep data current (define userIds in refresh property)
- **Just-In-Time Installation**: Auto-add bot to conversation on card action

#### Requirements
- Conversational or notification-only bot in manifest
- Search-based message extension (for message extensions)
- Same bot used as in message extension

#### Formats
- userIds: `29:<ID>` or `8:orgid:<AAD ID>`

### 9. DIALOG NAMESPACE (Replaces tasks)

#### Deprecation Timeline
- **HTML Dialogs**: TeamsJS v2.0.0+ (tasks still supported for compat)
- **Adaptive Card Dialogs**: TeamsJS v2.8.0+ (tasks still supported for compat)
- **Current Status**: tasks namespace functional, dialog recommended

#### New API
```typescript
// Old (deprecated but still works)
tasks.startTask(...)

// New (recommended)
dialog.url.open(...)  // HTML
dialog.adaptiveCard.open(...)  // Adaptive Card
dialog.url.bot.open(...)  // Bot-based
dialog.adaptiveCard.bot.open(...)  // Bot-based Adaptive Card
```

#### No End-of-Life Date Announced
- Tasks namespace still supported for backward compatibility
- No 2026 deprecation deadline found

### 10. CUSTOM ENGINE AGENTS

#### Vs. Declarative Agents
- **Declarative**: Metadata-only, limited flexibility
- **Custom Engine**: Full orchestration control, bring own AI services
- **Manifest Support**: v1.21 and later

#### Manifest Configuration
```json
{
  "copilotAgents": {
    "customEngineAgents": [
      {
        "id": "agent-id",
        "file": "agent.json"
      }
    ]
  }
}
```

#### Bot ID Matching
- `customEngineAgents` node bot ID must match `bot` node bot ID
- Identity and endpoint coordination

### 11. AGENTS PLAYGROUND

#### Purpose
Local debugging of bot and agent apps without tunneling or registration.

#### Key Advantages
- No M365 developer account required
- No Azure tunneling service needed
- Local server on machine
- Real-time view of messages and Adaptive Cards

#### Usage
```bash
agentsplayground -e "http://localhost:3978/api/messages" -c "emulator"
```

#### Channel Testing
- Default channel: `emulator`
- Teams-specific testing: Set channel ID to `msteams`
- Supports different channel-specific behaviors

#### Integration
- Launched via M365 Agents Toolkit
- Auto-detects bot endpoint
- Simulates Teams, Outlook, other channels

---

## RESEARCH SOURCES

All information sourced from official Microsoft documentation (learn.microsoft.com) as of 2026-03-09:
- Microsoft 365 app manifest schema reference (v1.25)
- Microsoft Teams platform documentation
- Microsoft 365 Agents Toolkit CLI guide
- Teams meeting extensions and Live Share SDKs
- Message extensions documentation
- Authentication and authorization guides

## WARNINGS & CAVEATS

1. **v1.25 Known Issues**: Schema has regex bug, Dev Portal has property persistence issues
2. **Migration Path**: TeamsFx → M365 Agents SDK (Teams Toolkit deprecated)
3. **Mobile Limitations**: Live Share not supported on mobile, Together Mode cannot initiate on mobile
4. **NAA Only for SPAs**: Not applicable to traditional iframe or backend-rendered apps
5. **Thread-Safe Validation**: Always validate manifest locally before Dev Portal (Dev Portal validation unreliable)

