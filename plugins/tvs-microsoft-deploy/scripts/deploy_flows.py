#!/usr/bin/env python3
"""Deploy Power Automate flows for TVS Holdings.

Imports flow packages from the flows/ directory, configures connection
references, and activates each flow via the Power Automate Management REST API.

Optional env vars:
    PP_DEPLOY_PROFILE      - dev|test|prod profile under power-platform/profiles
    FLOW_OWNER_OBJECT_IDS  - comma-separated object ids for owner policy validation

Required env vars:
    GRAPH_TOKEN            - Bearer token with Flows.Manage.All permissions
    FLOW_ENVIRONMENT_ID    - Power Platform environment ID (or supplied by profile)
"""

import json
import os
import sys
from pathlib import Path

import requests

PA_API = "https://api.flow.microsoft.com"
ROOT = Path(__file__).parent.parent


def load_profile():
    name = os.environ.get("PP_DEPLOY_PROFILE", "dev")
    profile_path = ROOT / "power-platform" / "profiles" / f"{name}.json"
    if not profile_path.exists():
        return {}
    with profile_path.open() as handle:
        return json.load(handle)


def load_release_gates():
    path = ROOT / "power-platform" / "validation" / "release-gates.json"
    with path.open() as handle:
        return json.load(handle)


def get_headers():
    token = os.environ.get("GRAPH_TOKEN")
    if not token:
        print("ERROR: GRAPH_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def get_env_id(profile):
    env_id = os.environ.get("FLOW_ENVIRONMENT_ID") or profile.get("flowEnvironmentId")
    if not env_id:
        print("ERROR: FLOW_ENVIRONMENT_ID is not set", file=sys.stderr)
        sys.exit(1)
    return env_id


def discover_flow_packages():
    flows_dir = ROOT / "flows"
    if not flows_dir.exists():
        print(f"WARNING: flows directory not found at {flows_dir}", file=sys.stderr)
        return []
    packages = sorted(flows_dir.glob("*.json"))
    if not packages:
        packages = sorted(flows_dir.glob("**/flow.json"))
    print(f"Found {len(packages)} flow package(s)")
    return packages


def validate_owner_policy():
    manifest_path = ROOT / "power-platform" / "manifests" / "tvs-automations.solution.json"
    with manifest_path.open() as handle:
        policy = json.load(handle).get("flowOwnerPolicy", {})

    approved = set(policy.get("servicePrincipalIds", []))
    actual = set(filter(None, os.environ.get("FLOW_OWNER_OBJECT_IDS", "").split(",")))
    if policy.get("requireServicePrincipal") and not approved.issubset(actual):
        print("ERROR: Flow owner/service principal policy failed", file=sys.stderr)
        sys.exit(1)


def import_flow(headers, env_id, package_path, profile):
    name = package_path.stem
    print(f"\n  Importing flow: {name}")

    with open(package_path) as f:
        flow_def = json.load(f)

    flow_json = json.dumps(flow_def)
    flow_json = flow_json.replace("{DATAVERSE_ENV_URL}", profile.get("dataverseUrl", ""))
    flow_def = json.loads(flow_json)

    refs = profile.get("connectionReferences", {})
    flow_refs = flow_def.get("connectionReferences", {})
    for ref_name, ref_value in refs.items():
        if ref_name in flow_refs:
            flow_refs[ref_name].update(ref_value)

    resp = requests.post(
        f"{PA_API}/providers/Microsoft.ProcessSimple/environments/{env_id}/flows",
        headers=headers,
        json={
            "properties": {
                "displayName": flow_def.get("displayName", name),
                "definition": flow_def.get("definition", flow_def),
                "state": "Stopped",
                "connectionReferences": flow_refs,
            }
        },
    )
    if resp.status_code in (200, 201):
        flow = resp.json()
        flow_id = flow.get("name", flow.get("id", "unknown"))
        print(f"    Imported: {flow_id}")
        return flow_id

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


def run_post_deploy_gates(deployed_names):
    gates = load_release_gates()
    critical = {gate["name"] for gate in gates.get("criticalAutomations", [])}
    missing = sorted(critical - deployed_names)
    if missing:
        print(f"ERROR: Missing critical automations in deployment: {', '.join(missing)}", file=sys.stderr)
        sys.exit(1)
    print("Release gates passed for critical automations")


def main():
    headers = get_headers()
    profile = load_profile()
    env_id = get_env_id(profile)
    validate_owner_policy()
    packages = discover_flow_packages()

    if not packages:
        print("No flow packages found. Exiting.")
        sys.exit(0)

    print("=== Deploying Power Automate Flows ===")
    deployed = []
    deployed_names = set()
    for pkg in packages:
        flow_id = import_flow(headers, env_id, pkg, profile)
        if flow_id:
            activate_flow(headers, env_id, flow_id)
            deployed.append(flow_id)
            deployed_names.add(pkg.stem)

    run_post_deploy_gates(deployed_names)
    print(f"\n=== Summary: {len(deployed)}/{len(packages)} flows deployed ===")


if __name__ == "__main__":
    main()
