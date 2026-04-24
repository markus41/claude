---
description: Generate SLA measurement configurations and breach-alert rules. Use when defining service level agreements for workflow steps, queue processing times, or customer response commitments.
---

# SLA Tracker Configuration

Define SLA measurement and alerting:

1. **SLA definition**: What is the commitment? (e.g., "Claims acknowledged within 24 business hours")
2. **Measurement points**: When does the SLA clock start/stop? (submission receipt, first touch, resolution)
3. **Business hours**: Define business calendar (timezone, working hours, holidays)
4. **Alert thresholds**: At what % of SLA consumed do you alert? (e.g., 50%, 75%, 90%, breach)
5. **Breach actions**: What happens on breach? (escalate, notify management, create incident)

Output a complete SLA configuration YAML and a dashboard spec for SLA monitoring.
