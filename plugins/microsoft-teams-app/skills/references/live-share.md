# Live Share SDK Reference

## Package

```
@microsoft/live-share
```

**Platform:** Desktop and web only (no mobile support)
**Backend:** Azure Fluid Relay (no custom backend required)

## Setup

```typescript
import { LiveShareClient, LivePresence, LiveState, LiveEvent, LiveTimer } from "@microsoft/live-share";
import { LiveShareHost } from "@microsoft/teams-js";

const host = LiveShareHost.create();
const client = new LiveShareClient(host);
const { container } = await client.joinContainer({
  initialObjects: {
    presence: LivePresence,
    state: LiveState,
    events: LiveEvent,
    timer: LiveTimer,
  }
});
```

## Components

### LivePresence
Track active users, cursor positions, custom user data.

```typescript
const presence = container.initialObjects.presence as LivePresence;
await presence.initialize();
presence.on("presenceChanged", (user, local) => { /* ... */ });
await presence.update({ cursor: { x, y } }); // Custom data
```

### LiveState
Synchronized state across all clients.

```typescript
const state = container.initialObjects.state as LiveState;
await state.initialize({ slide: 0 });
state.on("stateChanged", (newState, local) => { /* ... */ });
await state.set({ slide: 1 }); // Requires appropriate role
```

### LiveEvent
One-time broadcast events.

```typescript
const events = container.initialObjects.events as LiveEvent;
await events.initialize();
events.on("received", (event, local) => { /* ... */ });
await events.send({ type: "annotation", data: { x: 100, y: 200 } });
```

### LiveTimer
Shared countdown/stopwatch.

```typescript
const timer = container.initialObjects.timer as LiveTimer;
await timer.initialize();
timer.on("started", (config) => { /* ... */ });
timer.on("paused", () => { /* ... */ });
timer.on("finished", () => { /* ... */ });
await timer.start(60000); // 60 seconds
```

## Role Verification

```typescript
const roles = await presence.getLocalUserRoles();
// Returns: ("Organizer" | "Presenter" | "Attendee")[]
const canControl = roles.includes("Organizer") || roles.includes("Presenter");
```

## Media Sync (Extended)

```
@microsoft/live-share-media
```

- Video/audio playback sync
- Transport controls (play, pause, seek)
- Role-based control (presenter only)

## Canvas (Extended)

```
@microsoft/live-share-canvas
```

- Shared inking/drawing
- Laser pointer
- Cursor sharing
