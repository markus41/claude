# API Contract Tests

This suite validates high-level response contracts for the platform APIs consumed by `tvs-microsoft-deploy`:

- Microsoft Graph
- Microsoft Fabric
- Dataverse Web API
- Microsoft Planner
- Stripe
- Firebase

## Run

```bash
pytest plugins/tvs-microsoft-deploy/tests/contract/test_api_contracts.py -q
```

## Required environment variables

- `GRAPH_BASE_URL`, `GRAPH_TOKEN`
- `FABRIC_BASE_URL`, `FABRIC_TOKEN`
- `DATAVERSE_BASE_URL`, `DATAVERSE_TOKEN`
- `PLANNER_BASE_URL`, `PLANNER_TOKEN`
- `STRIPE_BASE_URL`, `STRIPE_TOKEN`
- `FIREBASE_BASE_URL`, `FIREBASE_TOKEN`

## Evidence artifacts

For audit/client assurance, capture and archive:

1. `pytest` console output (timestamped)
2. CI run URL
3. Sanitized API response samples (remove secrets/PII)
4. Any contract failure triage ticket IDs
