# Meeting APIs & Surfaces Reference

## Meeting Surfaces

| Surface | Max Width | Trigger | Manifest Key |
|---|---|---|---|
| Side Panel | 320px | User opens panel | `meetingSurfaces: ["sidePanel"]` |
| Stage View | Full meeting canvas | `meeting.shareAppContentToStage()` | `context: ["meetingStage"]` |
| Content Bubble | 400×300 overlay | Bot notification | Bot channelData |
| Together Mode | Full video grid | Organizer activates | Scene Studio |

## TeamsJS Meeting APIs

```typescript
import { meeting } from "@microsoft/teams-js";

// Get meeting details
meeting.getMeetingDetails(): Promise<MeetingDetails>

// Get participant info (limit: 350)
meeting.getMeetingParticipant(meetingId, participantId, tenantId): Promise<Participant>

// Share content to stage
meeting.shareAppContentToStage(callback, appContentUrl): void

// Event handlers
meeting.registerRaiseHandStateChangedHandler(handler)
meeting.registerSpeakingStateChangedHandler(handler)
meeting.registerMeetingReactionReceivedHandler(handler)
```

## Live Share SDK Components

| Component | Purpose | Import |
|---|---|---|
| `LiveShareClient` | Container connection | `@microsoft/live-share` |
| `LivePresence` | User activity tracking | `@microsoft/live-share` |
| `LiveState` | Synchronized app state | `@microsoft/live-share` |
| `LiveEvent` | One-time event broadcast | `@microsoft/live-share` |
| `LiveTimer` | Shared countdown | `@microsoft/live-share` |
| `LiveFollowMode` | Follow presenter (beta) | `@microsoft/live-share` |
| `LiveShareHost` | Teams host adapter | `@microsoft/teams-js` |

## Live Share Roles

- `Organizer` — Meeting organizer
- `Presenter` — Presenter role
- `Attendee` — Standard attendee

## Together Mode Requirements

- Teams Premium license
- 5-49 participants
- Desktop/web only (no mobile initiation)
- Scene created in Microsoft Scene Studio
- Organizer/presenter reserved seats supported

## Content Bubble Notification Schema

```json
{
  "channelData": {
    "notification": {
      "alertInMeeting": true,
      "externalResourceUrl": "https://teams.microsoft.com/l/bubble/{app-id}?url={encoded-url}&height=300&width=400&title={title}"
    }
  }
}
```

## RSC Permissions for Meetings

| Permission | Type | Purpose |
|---|---|---|
| `OnlineMeeting.ReadBasic.Chat` | Delegated | Read meeting details |
| `OnlineMeetingParticipant.Read.Chat` | Delegated | Read participant info |
| `MeetingStage.Write.Chat` | Delegated | Share to stage |
