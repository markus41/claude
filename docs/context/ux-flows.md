# UX Flows

## Plugin Install Flow

```
User browses marketplace UI
  -> Selects plugin
  -> Reviews manifest (commands, agents, skills)
  -> Clicks "Install"
  -> Plugin copied to plugins/
  -> Registry indexes regenerated
  -> Commands available in slash-command palette
```

<!-- Fill in: Error states, rollback on failed install -->

## Workflow Creation Flow

```
User opens Workflow Builder
  -> Drags node from Palette onto Canvas
  -> Connects nodes with edges
  -> Selects node -> configures in Properties panel
  -> Saves workflow (persisted in workflowStore)
  -> Runs workflow
```

<!-- Fill in: Validation feedback, save behavior, undo/redo -->

## Agent Invocation Flow

```
User types slash command (e.g., /cc-setup)
  -> Command resolved via registry
  -> Matching agent or skill loaded
  -> Agent executes with tool access
  -> Results displayed to user
```

<!-- Fill in: Subagent spawning, context handoff, result formatting -->

## Key Screens

<!-- Fill in: List primary views/pages and their purpose -->

| Screen | Path | Purpose |
|--------|------|---------|
| Workflow Builder | `/` | Visual canvas for composing workflows |
<!-- Fill in: Other screens -->
