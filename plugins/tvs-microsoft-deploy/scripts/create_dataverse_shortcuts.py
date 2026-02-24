#!/usr/bin/env python3
"""Create OneLake shortcuts pointing to Dataverse tables via Fabric REST API.

Maps TVS and Consulting Dataverse tables to their respective lakehouses
as OneLake shortcuts for unified data access.

Required env vars:
    FABRIC_TOKEN          - Bearer token for Fabric REST API
    TVS_WS_ID             - TVS workspace ID
    TVS_LAKEHOUSE_ID      - TVS operational lakehouse ID
    TVS_DATAVERSE_ENV_URL - TVS Dataverse environment URL (e.g., org-tvs-prod.crm.dynamics.com)
    CONSULTING_WS_ID      - Consulting workspace ID (optional)
    CONSULTING_LAKEHOUSE_ID - Consulting lakehouse ID (optional)
    CONSULTING_DATAVERSE_ENV_URL - Consulting Dataverse env URL (optional)
"""

import os
import sys

import requests

FABRIC_API = "https://api.fabric.microsoft.com/v1"

TVS_TABLES = [
    {"name": "dv_accounts", "table": "tvs_account", "path": "Tables/dv_accounts"},
    {"name": "dv_contacts", "table": "tvs_contact", "path": "Tables/dv_contacts"},
    {"name": "dv_subscriptions", "table": "tvs_subscription", "path": "Tables/dv_subscriptions"},
    {"name": "dv_tasks", "table": "tvs_task", "path": "Tables/dv_tasks"},
    {"name": "dv_timeentries", "table": "tvs_timeentry", "path": "Tables/dv_timeentries"},
    {"name": "dv_deliverables", "table": "tvs_deliverable", "path": "Tables/dv_deliverables"},
    {"name": "dv_automationlog", "table": "tvs_automationlog", "path": "Tables/dv_automationlog"},
]

CONSULTING_TABLES = [
    {"name": "dv_accounts", "table": "tvs_consultingaccount", "path": "Tables/dv_accounts"},
    {"name": "dv_contacts", "table": "tvs_consultingcontact", "path": "Tables/dv_contacts"},
    {"name": "dv_engagements", "table": "tvs_engagement", "path": "Tables/dv_engagements"},
    {"name": "dv_activities", "table": "tvs_activity", "path": "Tables/dv_activities"},
    {"name": "dv_sharedprospects", "table": "tvs_sharedprospect", "path": "Tables/dv_sharedprospects"},
    {"name": "dv_implementations", "table": "tvs_implementation", "path": "Tables/dv_implementations"},
]


def get_headers():
    token = os.environ.get("FABRIC_TOKEN")
    if not token:
        print("ERROR: FABRIC_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def create_shortcut(headers, ws_id, lh_id, name, env_url, table_name, target_path):
    resp = requests.post(
        f"{FABRIC_API}/workspaces/{ws_id}/lakehouses/{lh_id}/shortcuts",
        headers=headers,
        json={
            "name": name,
            "target": {
                "Dataverse": {
                    "environmentUrl": env_url,
                    "tableName": table_name,
                }
            },
            "path": target_path,
        },
    )
    if resp.status_code in (200, 201):
        print(f"  OK: {name} -> {target_path}")
    else:
        print(f"  FAIL: {name} ({resp.status_code}: {resp.text})", file=sys.stderr)


def main():
    headers = get_headers()

    tvs_ws = os.environ.get("TVS_WS_ID")
    tvs_lh = os.environ.get("TVS_LAKEHOUSE_ID")
    tvs_env = os.environ.get("TVS_DATAVERSE_ENV_URL")

    if tvs_ws and tvs_lh and tvs_env:
        print("=== Creating TVS Dataverse Shortcuts ===")
        for t in TVS_TABLES:
            create_shortcut(headers, tvs_ws, tvs_lh, t["name"], tvs_env, t["table"], t["path"])
    else:
        print("SKIP: TVS shortcuts (missing TVS_WS_ID, TVS_LAKEHOUSE_ID, or TVS_DATAVERSE_ENV_URL)")

    con_ws = os.environ.get("CONSULTING_WS_ID")
    con_lh = os.environ.get("CONSULTING_LAKEHOUSE_ID")
    con_env = os.environ.get("CONSULTING_DATAVERSE_ENV_URL")

    if con_ws and con_lh and con_env:
        print("\n=== Creating Consulting Dataverse Shortcuts ===")
        for t in CONSULTING_TABLES:
            create_shortcut(headers, con_ws, con_lh, t["name"], con_env, t["table"], t["path"])
    else:
        print("SKIP: Consulting shortcuts (missing CONSULTING_WS_ID/LAKEHOUSE_ID/DATAVERSE_ENV_URL)")

    print("\nDone.")


if __name__ == "__main__":
    main()
