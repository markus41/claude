# TVS API Helper Scripts

Reusable request wrappers for tenant-scoped calls used by deployment commands.

## Helpers
- `graph_request.py`
- `fabric_request.py`
- `dataverse_request.py`
- `azure_rest_request.py`
- `planner_request.py`
- `_core.py` shared auth/token cache/retry logic

## Usage
```bash
python3 plugins/tvs-microsoft-deploy/scripts/api/graph_request.py "/me" --entity tvs
```

`--entity` is logged in output for safe multi-entity operations.
