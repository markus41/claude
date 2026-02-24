#!/usr/bin/env python3
"""Deploy Power Automate flows for Rosa Holdings.

Imports flow packages from the flows/ directory, configures connection
references, and activates each flow via the Power Automate Management REST API.

Required env vars:
    GRAPH_TOKEN          - Bearer token with Flows.Manage.All permissions
    TVS_DATAVERSE_ENV_URL - Dataverse environment URL for connection references
    FLOW_ENVIRONMENT_ID  - Power Platform environment ID
"""

import json
import os
import sys
from pathlib import Path

import requests

PA_API = "https://api.flow.microsoft.com"


def get_headers():
    token = os.environ.get("GRAPH_TOKEN")
    if not token:
        print("ERROR: GRAPH_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def get_env_id():
    env_id = os.environ.get("FLOW_ENVIRONMENT_ID")
    if not env_id:
        print("ERROR: FLOW_ENVIRONMENT_ID is not set", file=sys.stderr)
        sys.exit(1)
    return env_id


def discover_flow_packages():
    flows_dir = Path(__file__).parent.parent / "flows"
    if not flows_dir.exists():
        print(f"WARNING: flows directory not found at {flows_dir}", file=sys.stderr)
        return []
    packages = sorted(flows_dir.glob("*.json"))
    if not packages:
        packages = sorted(flows_dir.glob("**/flow.json"))
    print(f"Found {len(packages)} flow package(s)")
    return packages


def import_flow(headers, env_id, package_path):
    name = package_path.stem
    print(f"\n  Importing flow: {name}")

    with open(package_path) as f:
        flow_def = json.load(f)

    dv_env_url = os.environ.get("TVS_DATAVERSE_ENV_URL", "")
    flow_json = json.dumps(flow_def)
    flow_json = flow_json.replace("{DATAVERSE_ENV_URL}", dv_env_url)
    flow_def = json.loads(flow_json)

    resp = requests.post(
        f"{PA_API}/providers/Microsoft.ProcessSimple/environments/{env_id}/flows",
        headers=headers,
        json={
            "properties": {
                "displayName": flow_def.get("displayName", name),
                "definition": flow_def.get("definition", flow_def),
                "state": "Stopped",
                "connectionReferences": flow_def.get("connectionReferences", {}),
            }
        },
    )
    if resp.status_code in (200, 201):
        flow = resp.json()
        flow_id = flow.get("name", flow.get("id", "unknown"))
        print(f"    Imported: {flow_id}")
        return flow_id
    else:
        print(f"    FAIL: {resp.status_code} - {resp.text}", file=sys.stderr)
        return None


def activate_flow(headers, env_id, flow_id):
    resp = requests.patch(
        f"{PA_API}/providers/Microsoft.ProcessSimple/environments/{env_id}/flows/{flow_id}",
        headers=headers,
        json={"properties": {"state": "Started"}},
    )
    if resp.status_code in (200, 204):
        print(f"    Activated: {flow_id}")
    else:
        print(f"    Activation FAIL: {resp.status_code}", file=sys.stderr)


def main():
    headers = get_headers()
    env_id = get_env_id()
    packages = discover_flow_packages()

    if not packages:
        print("No flow packages found. Exiting.")
        sys.exit(0)

    print("=== Deploying Power Automate Flows ===")
    deployed = []
    for pkg in packages:
        flow_id = import_flow(headers, env_id, pkg)
        if flow_id:
            activate_flow(headers, env_id, flow_id)
            deployed.append(flow_id)

    print(f"\n=== Summary: {len(deployed)}/{len(packages)} flows deployed ===")


if __name__ == "__main__":
    main()
