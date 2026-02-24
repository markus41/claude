# Agents Guide

`exec-automator` ships specialist agents for executive operations.

## Agent Roles

- Analysis and design: `org-analyzer`, `workflow-designer`
- Governance and meetings: `meeting-facilitator`, `compliance-monitor`, `admin-coordinator`
- Finance and sponsorship: `finance-manager`, `sponsor-relations`
- Membership and communications: `membership-steward`, `communications-director`, `social-media-manager`
- Programs and events: `event-orchestrator`

## How to Select Agents

1. Match responsibility domain (finance, membership, events, governance).
2. Match automation phase (analyze/map vs generate/deploy).
3. Prefer single specialist for deterministic tasks; use multi-agent orchestration for cross-functional tasks.

## Operational Notes

- Keep human checkpoints for compliance, board-facing communication, and sensitive financial approvals.
- Track outcomes via execution logs and daily summaries in operations workflows.

## Deep References

See `agents/*.md` for behavior contracts, prompts, and handoff expectations.
