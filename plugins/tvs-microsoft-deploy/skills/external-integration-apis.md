---
name: External Integration APIs for Microsoft Workloads
description: Use this skill when TAIA workflows require non-Microsoft APIs (Stripe, Firebase, Slack, DocuSign, HubSpot) synchronized with Microsoft systems.
version: 1.0.0
---

# External Integration APIs for Microsoft Workloads

## Supported API Families
- Billing: Stripe
- Legacy Data: Firebase
- Messaging fallback: Slack
- Signatures: DocuSign
- CRM enrichment: HubSpot

## Integration Contract
1. Ingest to Azure Function endpoint.
2. Normalize to Dataverse canonical model.
3. Replicate analytics to Fabric bronze zone.
4. Emit operational tasks to Planner for exceptions.

## Reliability Patterns
- Idempotency keys (per external event ID).
- Dead-letter queue for failed transformations.
- Retry with exponential backoff and max-attempt cap.
- Correlation IDs propagated to App Insights.
