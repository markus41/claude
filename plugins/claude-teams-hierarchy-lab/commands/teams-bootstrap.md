# /teams-bootstrap

Scaffold a Claude Teams hierarchy from a single project objective.

## Inputs
- `goal` (required): outcome to achieve
- `domains` (optional): comma-separated manager domains
- `maxSpecialistsPerManager` (optional, default: 3)

## Behavior
1. Create one orchestrator role owned by Claude.
2. Create manager agents per domain.
3. Propose specialist sub-agents under each manager.
4. Emit a hierarchy map and initial task charter.

## Output format
- Team hierarchy tree
- Responsibility matrix (RACI-lite)
- First sprint backlog (top 10 tasks)
