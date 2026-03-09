---
name: teams:meeting-app
intent: Scaffold and configure Teams meeting apps with full lifecycle support
tags:
  - microsoft-teams-app
  - command
  - meeting-app
inputs:
  - name: type
    description: "Meeting surface: sidepanel | stage | content-bubble | together-mode | full"
    required: false
    default: full
  - name: framework
    description: "Framework: react | vanilla | angular"
    required: false
    default: react
risk: low
cost: low
description: Scaffold Teams meeting apps with side panels, stage view, content bubbles, Live Share SDK, Together Mode, and full lifecycle hooks
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams Meeting App

Build meeting apps that integrate into the pre-meeting, in-meeting, and post-meeting lifecycle. Supports side panels, stage view, content bubbles, Live Share collaborative experiences, and Together Mode custom scenes.

## Usage

```bash
/teams:meeting-app [--type=sidepanel|stage|content-bubble|together-mode|full] [--framework=react]
```

## Meeting Lifecycle

```
┌─────────────────────────────────────────────────────────────┐
│                    MEETING LIFECYCLE                         │
├──────────────┬──────────────────────┬───────────────────────┤
│  PRE-MEETING │    IN-MEETING        │    POST-MEETING       │
│              │                      │                       │
│  Tab in      │  Side Panel (320px)  │  Tab access after     │
│  meeting     │  Content Bubble      │  meeting ends         │
│  invite      │  Stage View (shared) │  Recording/transcript │
│  details     │  Together Mode       │  access               │
│              │  Live Share collab   │                       │
└──────────────┴──────────────────────┴───────────────────────┘
```

## Manifest v1.25 Configuration

```json
{
  "$schema": "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json",
  "manifestVersion": "1.25",
  "configurableTabs": [
    {
      "configurationUrl": "https://{baseUrl}/config",
      "canUpdateConfiguration": true,
      "scopes": ["groupChat"],
      "context": [
        "meetingChatTab",
        "meetingDetailsTab",
        "meetingSidePanel",
        "meetingStage"
      ],
      "meetingSurfaces": ["sidePanel", "stage"],
      "supportedSharePointHosts": []
    }
  ],
  "meetingExtensionDefinition": {
    "supportsAnonymousGuestUsers": true
  },
  "authorization": {
    "permissions": {
      "resourceSpecific": [
        {
          "name": "OnlineMeeting.ReadBasic.Chat",
          "type": "Delegated"
        },
        {
          "name": "OnlineMeetingParticipant.Read.Chat",
          "type": "Delegated"
        },
        {
          "name": "MeetingStage.Write.Chat",
          "type": "Delegated"
        }
      ]
    }
  }
}
```

## Protocol

### 1. Scaffold Meeting App

```bash
# Using M365 Agents Toolkit CLI
npx @microsoft/m365agentstoolkit-cli new --capability tab --interactive false

# Or manual scaffold
mkdir -p src/{components,hooks,services}
```

### 2. Side Panel Implementation (320px canvas)

The side panel appears alongside the meeting content. Maximum width is 320px.

```typescript
// src/components/MeetingSidePanel.tsx
import { app, meeting, LiveShareHost } from "@microsoft/teams-js";

export function MeetingSidePanel() {
  const [context, setContext] = useState<app.Context | null>(null);

  useEffect(() => {
    async function init() {
      await app.initialize();
      const ctx = await app.getContext();
      setContext(ctx);

      // Register handler for meeting state changes
      meeting.registerMeetingReactionReceivedHandler((reaction) => {
        console.log("Reaction:", reaction.reactionType);
      });
    }
    init();
  }, []);

  // Share content to stage view from side panel
  const shareToStage = async () => {
    await meeting.shareAppContentToStage((err, result) => {
      if (err) console.error("Share failed:", err);
    }, `https://${window.location.host}/stage?content=dashboard`);
  };

  return (
    <div style={{ maxWidth: 320, padding: 16 }}>
      <h3>Meeting Controls</h3>
      <button onClick={shareToStage}>Share to Stage</button>
    </div>
  );
}
```

### 3. Stage View (Shared Meeting Content)

Stage view shares content to the main meeting window visible to all participants.

```typescript
// src/components/MeetingStage.tsx
import { app, meeting, pages } from "@microsoft/teams-js";

export function MeetingStage() {
  useEffect(() => {
    async function init() {
      await app.initialize();

      // Notify that content is ready
      await pages.config.registerOnSaveHandler((saveEvent) => {
        saveEvent.notifySuccess();
      });
    }
    init();
  }, []);

  return (
    <div className="stage-content">
      <h2>Shared Content</h2>
      {/* Full meeting stage canvas */}
    </div>
  );
}
```

### 4. Content Bubble (In-Meeting Notification)

Targeted notifications that appear as bubbles in the meeting.

```typescript
// Bot-side: Send targeted meeting notification
// POST https://graph.microsoft.com/v1.0/chats/{chat-id}/messages
const notificationPayload = {
  body: {
    contentType: "html",
    content: "<at>User</at> your action item is due"
  },
  channelData: {
    notification: {
      alertInMeeting: true,
      externalResourceUrl:
        "https://teams.microsoft.com/l/bubble/{app-id}?url={content-url}&height=300&width=400&title=Action+Items"
    }
  }
};
```

### 5. Live Share SDK (Real-Time Collaboration)

No backend required — uses Azure Fluid Relay for real-time sync.

```typescript
// src/services/LiveShareSetup.ts
import { LiveShareClient, LivePresence, LiveState, LiveEvent, LiveTimer } from "@microsoft/live-share";
import { LiveShareHost } from "@microsoft/teams-js";

async function initLiveShare() {
  const host = LiveShareHost.create();
  const client = new LiveShareClient(host);
  const { container } = await client.joinContainer({
    initialObjects: {
      presence: LivePresence,       // Who's active, cursor positions
      sharedState: LiveState,       // Synchronized app state
      notifications: LiveEvent,     // One-time events
      timer: LiveTimer,             // Shared countdown
    }
  });

  // Presence: track who's active
  const presence = container.initialObjects.presence as LivePresence;
  await presence.initialize();
  presence.on("presenceChanged", (user, local) => {
    console.log(`${user.displayName} ${user.state === "online" ? "joined" : "left"}`);
  });

  // Shared State: synchronized across all clients
  const state = container.initialObjects.sharedState as LiveState;
  await state.initialize({ slide: 0, annotations: [] });
  state.on("stateChanged", (newState, local) => {
    renderSlide(newState.slide);
  });

  // Role verification for presenter-only actions
  const roles = await presence.getLocalUserRoles();
  const canControl = roles.includes("Organizer") || roles.includes("Presenter");

  return { presence, state, canControl };
}
```

### 6. Together Mode (Custom Scenes)

Immersive video experience for 5-49 participants.

```json
// scenes.json — created with Microsoft Scene Studio
{
  "scenes": [
    {
      "id": "boardroom",
      "name": "Virtual Boardroom",
      "backgroundImageUrl": "https://{cdn}/scenes/boardroom-bg.png",
      "seats": [
        {
          "id": "seat1",
          "x": 100, "y": 200, "width": 120, "height": 160,
          "reservedFor": "organizer"
        },
        {
          "id": "seat2",
          "x": 250, "y": 200, "width": 120, "height": 160,
          "reservedFor": "presenter"
        }
      ]
    }
  ]
}
```

**Requirements:**
- Teams Premium license
- Desktop/web only (cannot initiate on mobile)
- 5-49 participant range
- Scene created via Microsoft Scene Studio

### 7. Meeting Events & APIs

```typescript
// Meeting participant API (limit: 350 participants)
const participant = await meeting.getMeetingParticipant(
  meetingId,
  participantId,
  tenantId
);

// Register for meeting events
meeting.registerRaiseHandStateChangedHandler((state) => {
  // Handle raise hand
});

meeting.registerSpeakingStateChangedHandler((state) => {
  // Handle speaking state
});

// Get meeting details
const details = await meeting.getMeetingDetails();
console.log(details.scheduledStartTime);
console.log(details.type); // Scheduled, Recurring, OneToOne, GroupCall
```

## m365agents.yml Configuration

```yaml
version: v1.0
provision:
  - uses: teamsApp/create
    with:
      name: my-meeting-app-${{TEAMSFX_ENV}}
  - uses: aadApp/create
    with:
      name: my-meeting-app-${{TEAMSFX_ENV}}
      generateClientSecret: true
      signInAudience: AzureADMyOrg  # Single-tenant enforced
  - uses: teamsApp/validateManifest
    with:
      manifestPath: ./appPackage/manifest.json
  - uses: teamsApp/zipAppPackage
    with:
      manifestPath: ./appPackage/manifest.json
      outputZipPath: ./appPackage/build/appPackage.${{TEAMSFX_ENV}}.zip
  - uses: teamsApp/update
    with:
      appPackagePath: ./appPackage/build/appPackage.${{TEAMSFX_ENV}}.zip
deploy:
  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.env
      envs:
        TAB_DOMAIN: ${{TAB_DOMAIN}}
        TAB_ENDPOINT: ${{TAB_ENDPOINT}}
```

## Context Values for Meeting Surfaces

| Context String | Surface |
|---|---|
| `meetingChatTab` | Pre/post-meeting tab in chat |
| `meetingDetailsTab` | Pre-meeting details tab |
| `meetingSidePanel` | In-meeting 320px side panel |
| `meetingStage` | In-meeting shared stage |

## Limitations

- Side panel fixed at **320px** width
- GetParticipant API limit: **350 participants**
- Together Mode: **5-49 participants**, desktop/web only
- Live Share: desktop/web only (no mobile)
- Anonymous guest support requires `meetingExtensionDefinition.supportsAnonymousGuestUsers: true`
- Meeting apps require **groupChat** scope in configurableTabs
- Content bubble requires bot to send targeted notification

## See Also

- `/teams:manifest` — Full v1.25 schema reference
- `/teams:auth` — NAA and single-tenant SSO for meeting tabs
- `/teams:msgext` — Message extensions that work in meeting chat
- `/teams:dialog` — Dialog namespace for modal interactions
