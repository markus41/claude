# Hierarchy Rules

## Core Topology
1. Claude remains the sole orchestrator.
2. Manager agents coordinate domains; they do not perform specialist-only leaf execution unless in fallback mode.
3. Specialist agents execute bounded leaf tasks only.

## Delegation Constraints
1. Default max delegation depth is 2 (`orchestrator -> manager -> specialist`).
2. Any depth >2 requires explicit rationale and risk note.
3. Each task must have exactly one owner at any level.

## Escalation Rules
1. Blockers older than one SLA window escalate specialist -> manager.
2. Cross-domain blockers escalate manager -> orchestrator.
3. Escalations must include context, options, and recommendation.

## Governance Rules
1. No duplicate specialist roles with overlapping ownership unless load balancing is intentional.
2. Every spawned specialist must include objective, constraints, and retirement condition.
3. Session close requires a brief unresolved dependency and escalation summary.
