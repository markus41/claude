# /teams-decompose

Turn an initiative backlog into hierarchical work packages.

## Flags
- `--profile`: `conservative | balanced | aggressive`
- `--max-depth`: delegation depth (default: 2)
- `--parallelism`: max concurrent specialist tasks per manager

## Behavior
1. Group work by manager domain.
2. Split tasks into specialist-sized units.
3. Mark dependencies and merge points.
4. Generate escalation triggers when blockers exceed threshold.

## Output format
- Manager work queues
- Specialist task bundles
- Dependency graph
- Escalation matrix
