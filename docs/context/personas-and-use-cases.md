# Personas and Use Cases

## Personas

### Platform Developer

- **Role:** Maintains the core platform (src/, build, CI, MCP servers)
- **Goals:** Keep the runtime stable, improve developer experience, add canvas features
- **Pain points:** <!-- Fill in: What frustrates platform devs today? -->
- **Key workflows:** `pnpm dev`, `pnpm test`, type-check, lint, PR review

### Plugin Author

- **Role:** Creates or maintains domain plugins under `plugins/`
- **Goals:** Ship self-contained plugins with agents, skills, commands, and hooks
- **Pain points:** <!-- Fill in: What makes plugin development hard? -->
- **Key workflows:** Scaffold plugin, write manifest, register commands, test in isolation

### End User (Operator)

- **Role:** Uses the visual workflow builder and slash commands to automate tasks
- **Goals:** Compose workflows without writing code, invoke agents for domain tasks
- **Pain points:** <!-- Fill in -->
- **Key workflows:** Drag nodes on canvas, configure node properties, run workflow

## Core Use Cases

| ID | Persona | Use Case | Status |
|----|---------|----------|--------|
| UC-01 | End User | Build a workflow by dragging nodes onto the canvas | <!-- Fill in --> |
| UC-02 | End User | Invoke a slash command to trigger a plugin action | <!-- Fill in --> |
| UC-03 | Plugin Author | Create a new plugin with agents and commands | <!-- Fill in --> |
| UC-04 | Platform Dev | Add a new MCP server to the runtime | <!-- Fill in --> |
| UC-05 | Platform Dev | Debug a failing CI workflow | <!-- Fill in --> |
<!-- Fill in: Add more use cases as needed -->

## User Journey Maps

<!-- Fill in: Link to or embed journey maps for key flows -->
