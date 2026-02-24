# Non-Microsoft API Matrix

| API/System | Typical TVS Workflow Use | Base URL / Protocol | Auth Pattern | Notes |
|---|---|---|---|---|
| Stripe | Subscription products, billing portal, webhook-driven entitlement sync | `https://api.stripe.com/v1` | Secret key (basic auth) + webhook signatures | Used by broker portal billing workflows |
| Firebase | Legacy/mobile ingestion hooks and event extraction | Firebase REST/Admin SDK | Service account JSON / OAuth2 | Source for A3-adjacent extracts in functions |
| Jira | Ticket orchestration for implementation and IT tracks | `https://<org>.atlassian.net/rest/api/3` | API token / OAuth2 | Used in cross-team workflow automation |
| Slack | Operational alerts and deployment notifications | `https://slack.com/api` | Bot token | Optional comms channel integration |
| HubSpot | CRM sync and lead/contact enrichment | `https://api.hubapi.com` | Private app token / OAuth2 | Used when broker workflows require marketing CRM sync |
| SFTP endpoints | Batch exchange with carriers/vendors | `sftp://<host>:22` | Key-based auth | Common for nightly file handoff pipelines |
| Paylocity | HR/payroll related synchronization | Vendor REST | OAuth2/API key | Referenced by `functions/paylocity-sync` |
| Email delivery providers (e.g., SendGrid) | Transactional messaging when Exchange not used | Provider REST | API key | Optional fallback for notification paths |

## Notes
- Keep credentials in Key Vault and never in workflow definitions.
- Cross-system orchestration should preserve tenant/entity context (`tvs`, `consulting`, `media`) to avoid data bleed.
