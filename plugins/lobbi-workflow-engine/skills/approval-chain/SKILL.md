---
description: Design multi-step approval workflows with supervisor, manager, and executive levels. Use when the user needs to automate document approvals, contract sign-offs, or policy exceptions for insurance or mortgage operations.
---

# Approval Chain Design

Given the business requirement, design a complete approval chain:

1. **Identify approval levels**: Who must approve (role + fallback)? What triggers each level?
2. **Define conditions**: What attributes route to each approver (amount, risk score, policy type)?
3. **Set timeouts**: How long before the approval auto-escalates?
4. **Specify actions**: What happens on approve/reject/timeout (notify, route, archive)?

Output a structured approval chain spec:

```yaml
approval_chain:
  name: [descriptive name]
  trigger: [what initiates the chain]
  levels:
    - role: Supervisor
      condition: amount < 10000
      timeout_hours: 24
      fallback_role: Manager
    - role: Manager
      condition: amount >= 10000 AND amount < 50000
      timeout_hours: 48
      fallback_role: VP
  on_approve: [next workflow step]
  on_reject: [rejection notification + reason capture]
  audit_events: [list all events to log for compliance]
```

Ask clarifying questions if the business context, approval roles, or dollar thresholds are ambiguous.
