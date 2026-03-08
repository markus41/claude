# Fabric Architecture Blueprint (TAIA Sale Readiness)

This folder defines the governed medallion architecture for TAIA sale preparation across three functional lanes:

1. **TAIA A3 archive lane** - immutable historical extracts from Firebase and external archive drops.
2. **Commission normalization lane** - canonical commission facts and carrier mapping from Dataverse/Firebase.
3. **Cross-entity consolidated reporting lane** - buyer-facing consolidated KPIs across TVS entities.

## Bronze/Silver/Gold zones

- **Bronze**: Source-aligned raw ingestion with immutable append-only contracts.
- **Silver**: Standardized conformed entities with schema drift handling and quality scoring.
- **Gold**: Certified semantic-serving tables for due-diligence reporting and board-level metrics.

Authoritative zone and contract definitions are versioned in:

- `medallion-zones.yaml`
- `ingestion-contracts.yaml`
- `schema-evolution-policy.yaml`
