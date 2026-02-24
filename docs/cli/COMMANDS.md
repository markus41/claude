# TVS Microsoft Deploy Commands

Generated from `commands/*.md`.

## Shared Arguments

- `--entity <tvs|consulting|taia|all>`
- `--tenant <tenant-id>`
- `--strict`
- `--dry-run`
- `--export-json <path>`
- `--plan-id <plan-id>`

## Command Index

| Command | Description | Usage |
|---|---|---|
| `tvs:browser-fallback` | Manual browser automation fallback using Playwright for portal operations lacking CLI/API coverage | `/tvs:browser-fallback --portal=ppac|fabric|azure --action=<action> [--tenant=tvs|consulting]` |
| `tvs:cost-report` | Cost analysis across all TVS Holdings entities with tier projections | `/tvs:cost-report [--tier=1|2|3|all] [--format=markdown|json|csv]` |
| `tvs:deploy-all` | Full platform deployment orchestrated from control-plane manifests and overlays | `/tvs:deploy-all [--env dev|test|prod] [--overlay <path>] [--dry-run] [--taia-wind-down]` |
| `tvs:deploy-azure` | Azure infrastructure deployment - Bicep templates for Key Vault, Functions, Static Web Apps, App Insights | `/tvs:deploy-azure [--resource kv|func|stapp|insights|all] [--resource-group NAME] [--location eastus]` |
| `tvs:deploy-dataverse` | Dataverse schema + Power Platform ALM deployment (pack/unpack, managed promotion, env vars, connection refs, release gates, Copilot Studio) | `/tvs:deploy-dataverse [--env dev|test|prod] [--action precheck|unpack|pack|import|promote] [--mode managed|unmanaged]` |
| `tvs:deploy-fabric` | Fabric workspace provisioning - creates workspaces, lakehouses, deploys notebooks, creates Dataverse shortcuts | `/tvs:deploy-fabric [--workspace NAME] [--notebooks-only] [--shortcuts-only] [--dry-run]` |
| `tvs:deploy-identity` | Entra ID deployment - users, licenses, conditional access, app registrations, FIDO2 configuration | `/tvs:deploy-identity [--entity tvs|consulting|media|all] [--users-only] [--apps-only]` |
| `tvs:deploy-portal` | Power Pages and Copilot Studio deployment - broker portal, Stripe billing widget, conversational bots | `/tvs:deploy-portal [--component portal|copilot|stripe|all] [--env dev|staging|prod]` |
| `tvs:deploy-teams` | Teams workspace provisioning for VAs with HIPAA-aware configuration | `/tvs:deploy-teams [--entity=tvs|consulting|all] [--dry-run]` |
| `tvs:extract-a3` | A3 Firebase extraction - bulk extract brokers, commissions, carriers, contacts, activities to OneLake. CRITICAL PATH WEEK 1. | `/tvs:extract-a3 [--collection brokers|commissions|carriers|contacts|activities|all] [--batch-size 500] [--since DATE]` |
| `tvs:identity-attestation` | Generate periodic access attestation packets for TAIA transition governance and due diligence | `/tvs:identity-attestation --input exports/role-assignments.json --period 2026-Q1` |
| `tvs:identity-drift` | Detect Entra identity drift and produce remediation recommendations | `/tvs:identity-drift --inventory identity-inventory.json --output reports/identity-drift.json` |
| `tvs:normalize-carriers` | Carrier normalization sprint for TAIA FMO sale preparation | `/tvs:normalize-carriers [--dry-run] [--collection=carriers|commissions|all]` |
| `tvs:quick-start` | End-to-end bootstrap for TVS Microsoft Deploy that can initialize a fresh repo or configure an existing repo to the required baseline | `/tvs:quick-start [--repo <path>] [--create-repo <path>] [--env dev|test|prod] [--tenant <tenant-id>] [--entity tvs|consulting|taia|all] [--dry-run]` |
| `tvs:status-check` | Health check using control-plane dry-run outputs as the verification source of truth | `/tvs:status-check [--env dev|test|prod] [--taia-wind-down]` |
| `tvs:taia-readiness` | TAIA transition readiness check driven by control-plane wind-down overlay | `/tvs:taia-readiness [--env dev|test|prod]` |

