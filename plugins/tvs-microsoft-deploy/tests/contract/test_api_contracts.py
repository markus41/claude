"""Contract tests for external APIs used by tvs-microsoft-deploy.

These tests validate a narrow response shape for critical platform APIs:
- Microsoft Graph
- Microsoft Fabric
- Dataverse Web API
- Microsoft Planner
- Stripe
- Firebase

To run these tests, export environment variables for each provider:
  GRAPH_BASE_URL, GRAPH_TOKEN
  FABRIC_BASE_URL, FABRIC_TOKEN
  DATAVERSE_BASE_URL, DATAVERSE_TOKEN
  PLANNER_BASE_URL, PLANNER_TOKEN
  STRIPE_BASE_URL, STRIPE_TOKEN
  FIREBASE_BASE_URL, FIREBASE_TOKEN
"""

from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass

import pytest


@dataclass(frozen=True)
class Contract:
    name: str
    base_url_env: str
    token_env: str
    path: str
    expected_any_keys: tuple[str, ...]


CONTRACTS: tuple[Contract, ...] = (
    Contract(
        name="graph",
        base_url_env="GRAPH_BASE_URL",
        token_env="GRAPH_TOKEN",
        path="/v1.0/organization",
        expected_any_keys=("value",),
    ),
    Contract(
        name="fabric",
        base_url_env="FABRIC_BASE_URL",
        token_env="FABRIC_TOKEN",
        path="/v1/workspaces",
        expected_any_keys=("value", "data", "items"),
    ),
    Contract(
        name="dataverse",
        base_url_env="DATAVERSE_BASE_URL",
        token_env="DATAVERSE_TOKEN",
        path="/api/data/v9.2/WhoAmI",
        expected_any_keys=("UserId", "BusinessUnitId", "OrganizationId"),
    ),
    Contract(
        name="planner",
        base_url_env="PLANNER_BASE_URL",
        token_env="PLANNER_TOKEN",
        path="/v1.0/planner/plans",
        expected_any_keys=("value",),
    ),
    Contract(
        name="stripe",
        base_url_env="STRIPE_BASE_URL",
        token_env="STRIPE_TOKEN",
        path="/v1/customers?limit=1",
        expected_any_keys=("object", "data"),
    ),
    Contract(
        name="firebase",
        base_url_env="FIREBASE_BASE_URL",
        token_env="FIREBASE_TOKEN",
        path="/v1beta1/projects",
        expected_any_keys=("results", "projects", "value"),
    ),
)


def _read_env(contract: Contract) -> tuple[str, str]:
    base_url = os.getenv(contract.base_url_env, "").strip()
    token = os.getenv(contract.token_env, "").strip()
    if not base_url or not token:
        pytest.skip(
            f"Missing {contract.base_url_env} or {contract.token_env}; "
            f"skipping {contract.name} contract check."
        )
    return base_url.rstrip("/"), token


def _auth_header(contract: Contract, token: str) -> str:
    if contract.name == "stripe":
        return f"Bearer {token}"
    return f"Bearer {token}"


@pytest.mark.parametrize("contract", CONTRACTS, ids=[c.name for c in CONTRACTS])
def test_api_contract_response_shape(contract: Contract) -> None:
    base_url, token = _read_env(contract)
    request = urllib.request.Request(
        url=f"{base_url}{contract.path}",
        headers={
            "Authorization": _auth_header(contract, token),
            "Accept": "application/json",
        },
        method="GET",
    )

    try:
        with urllib.request.urlopen(request, timeout=20) as response:
            status_code = response.status
            payload = json.loads(response.read().decode("utf-8") or "{}")
    except urllib.error.HTTPError as exc:
        body = exc.read().decode("utf-8", errors="ignore")
        pytest.fail(f"{contract.name} returned HTTP {exc.code}: {body}")
    except urllib.error.URLError as exc:
        pytest.fail(f"{contract.name} network error: {exc.reason}")

    assert 200 <= status_code < 300, f"Unexpected status from {contract.name}: {status_code}"
    assert isinstance(payload, dict), f"{contract.name} did not return a JSON object"
    assert any(key in payload for key in contract.expected_any_keys), (
        f"{contract.name} response missing expected keys {contract.expected_any_keys}; "
        f"got keys={sorted(payload.keys())}"
    )
