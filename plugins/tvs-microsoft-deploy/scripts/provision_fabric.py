#!/usr/bin/env python3
"""Provision Microsoft Fabric workspaces, lakehouses, and shortcuts for Rosa Holdings.

Reads workspace definitions from schemas/fabric_workspaces.json and creates
6 workspaces (tvs, consulting, lobbi_platform, media, a3_archive, consolidated)
via the Fabric REST API.

Required env vars:
    FABRIC_TOKEN       - Bearer token for Fabric REST API
    FABRIC_CAPACITY_ID - Fabric capacity ID to assign workspaces
"""

import json
import os
import sys
from pathlib import Path

import requests

FABRIC_API = "https://api.fabric.microsoft.com/v1"

def get_headers():
    token = os.environ.get("FABRIC_TOKEN")
    if not token:
        print("ERROR: FABRIC_TOKEN environment variable is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}

def load_workspace_config():
    config_path = Path(__file__).parent.parent / "schemas" / "fabric_workspaces.json"
    with open(config_path) as f:
        return json.load(f)

def create_workspace(headers, display_name, description, capacity_id):
    resp = requests.post(f"{FABRIC_API}/workspaces", headers=headers, json={
        "displayName": display_name,
        "description": description,
        "capacityId": capacity_id,
    })
    resp.raise_for_status()
    ws = resp.json()
    print(f"  Created workspace: {display_name} -> {ws['id']}")
    return ws["id"]

def create_lakehouse(headers, workspace_id, display_name, description):
    resp = requests.post(f"{FABRIC_API}/workspaces/{workspace_id}/lakehouses", headers=headers, json={
        "displayName": display_name,
        "description": description,
    })
    resp.raise_for_status()
    lh = resp.json()
    print(f"    Created lakehouse: {display_name} -> {lh['id']}")
    return lh["id"]

def create_shortcut(headers, workspace_id, lakehouse_id, shortcut_def):
    resp = requests.post(
        f"{FABRIC_API}/workspaces/{workspace_id}/lakehouses/{lakehouse_id}/shortcuts",
        headers=headers,
        json={
            "name": shortcut_def["name"],
            "target": {
                shortcut_def["type"]: shortcut_def["source"],
            },
            "path": shortcut_def["targetPath"],
        },
    )
    resp.raise_for_status()
    print(f"      Shortcut: {shortcut_def['name']} -> {shortcut_def['targetPath']}")

def main():
    capacity_id = os.environ.get("FABRIC_CAPACITY_ID")
    if not capacity_id:
        print("ERROR: FABRIC_CAPACITY_ID environment variable is not set", file=sys.stderr)
        sys.exit(1)

    headers = get_headers()
    config = load_workspace_config()
    results = {}

    for ws_key, ws_def in config["workspaces"].items():
        print(f"\nProvisioning workspace: {ws_key}")
        ws_id = create_workspace(headers, ws_def["displayName"], ws_def["description"], capacity_id)
        results[ws_key] = {"workspace_id": ws_id, "lakehouses": {}}

        for lh_key, lh_def in ws_def.get("lakehouses", {}).items():
            lh_id = create_lakehouse(headers, ws_id, lh_def["displayName"], lh_def["description"])
            results[ws_key]["lakehouses"][lh_key] = lh_id

            for shortcut in lh_def.get("shortcuts", []):
                create_shortcut(headers, ws_id, lh_id, shortcut)

    print("\n=== Provisioning Summary ===")
    for ws_key, ws_data in results.items():
        print(f"{ws_key}: workspace_id={ws_data['workspace_id']}")
        for lh_key, lh_id in ws_data["lakehouses"].items():
            print(f"  {lh_key}: lakehouse_id={lh_id}")

    output_path = Path(__file__).parent.parent / "fabric" / "provision_output.json"
    with open(output_path, "w") as f:
        json.dump(results, f, indent=2)
    print(f"\nOutput written to {output_path}")

if __name__ == "__main__":
    main()
