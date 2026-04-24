---
description: Build email and Microsoft Teams notification templates for workflow events. Use when creating approval request notifications, escalation alerts, SLA breach warnings, or workflow completion confirmations.
---

# Notification Template Design

Create notification templates for workflow events:

1. **Event type**: What triggers this notification? (new item, approval needed, SLA warning, escalation, completion)
2. **Recipients**: Who receives it? (requester, approver, escalation target, compliance team)
3. **Channel**: Email, Microsoft Teams adaptive card, or both?
4. **Content**: Subject/title, body with relevant data fields, action buttons (Approve/Reject), link to item
5. **Branding**: The Lobbi client branding requirements (logo, color, footer)

Output: email HTML template and/or Teams Adaptive Card JSON with placeholder variables using `{{variable_name}}` syntax.
