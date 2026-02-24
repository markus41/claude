# Architecture Hub

## Agent Topology

Agents in `agents/` map to bounded responsibilities (identity, data, analytics, comms, platform).

## Platform Diagrams

- Control plane orchestrates phased deployments.
- Azure hosts compute + secrets + portal experiences.
- Power Platform and Fabric provide data + workflow + reporting layers.

## Dependency Graphs

- Identity is a hard prerequisite for all mutable deployments.
- Data platform resources are prerequisites for analytics and reporting.
- Collaboration automation depends on identity + data contracts.

## Tenant Model

- Single management tenant with entity-scoped resource partitioning.
- Shared governance controls with per-entity policy overlays.
- TAIA wind-down overlays run in constrained mode with archival safeguards.
