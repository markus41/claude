---
name: Planner Orchestration Engine
description: Use this skill when implementing Jira-orchestrator-style workflow management using Microsoft Planner as the execution backbone.
version: 1.0.0
---

# Planner Orchestration Engine

## Objective
Replicate Jira-style orchestration patterns using Planner objects: Plan -> Buckets -> Tasks -> Checklist -> Labels -> Comments.

## Canonical Mapping
- Workflow = Planner Plan
- Phase = Bucket
- Ticket = Task
- Sub-task = Checklist item
- Priority = Label set
- Status transitions = Bucket movement + percentComplete update

## Required Task Metadata
Store JSON in task description:
- `workflowId`
- `phase`
- `ownerAgent`
- `riskLevel`
- `dependsOn[]`
- `evidenceLinks[]`

## Standard Buckets
- Backlog
- Explore
- Plan
- Build
- Validate
- Remediate
- Done

## Integration Paths
- `commands/deploy-planner.md`
- `scripts/create_planner_plan.py`
- `agents/planner-orchestrator-agent.md`
