---
description: Define time-based escalation paths when approvals stall or SLAs breach. Use when configuring automatic escalation for insurance underwriting queues, loan processing pipelines, or compliance review workflows.
---

# Escalation Policy Design

Define escalation policies for stalled workflow items:

1. **Trigger conditions**: Time elapsed, SLA percentage consumed, or manual override
2. **Escalation path**: Who receives the escalation notification? What authority do they have?
3. **Escalation message**: Draft the escalation notification with context (item age, original assignee, business impact)
4. **Resolution recording**: How is the escalation resolved and documented for audit?

Output an escalation policy spec with trigger thresholds, notification templates, and audit requirements.
