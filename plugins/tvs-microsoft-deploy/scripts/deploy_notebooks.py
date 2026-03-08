#!/usr/bin/env python3
"""Upload Fabric notebooks and create orchestrated pipeline-aligned runs.

Reads .ipynb files from fabric/notebooks/ and uploads them to the
appropriate Fabric workspace via the REST API.

Required env vars:
    FABRIC_TOKEN      - Bearer token for Fabric REST API
    TVS_WS_ID         - TVS workspace ID (for tvs_curated_transform)
    CONSULTING_WS_ID  - Consulting workspace ID (for consulting_pipeline)
    CONSOLIDATED_WS_ID - Consolidated workspace ID (for consolidated_rollup)
    A3_ARCHIVE_WS_ID  - A3 Archive workspace ID (for a3_archive_validate)
"""

import argparse
import base64
import json
import os
import sys
from pathlib import Path

import requests

FABRIC_API = "https://api.fabric.microsoft.com/v1"

NOTEBOOK_WORKSPACE_MAP = {
    "tvs_curated_transform": "TVS_WS_ID",
    "consulting_pipeline": "CONSULTING_WS_ID",
    "consolidated_rollup": "CONSOLIDATED_WS_ID",
    "a3_archive_validate": "A3_ARCHIVE_WS_ID",
}


def get_headers():
    token = os.environ.get("FABRIC_TOKEN")
    if not token:
        print("ERROR: FABRIC_TOKEN is not set", file=sys.stderr)
        sys.exit(1)
    return {"Authorization": f"Bearer {token}", "Content-Type": "application/json"}


def discover_notebooks():
    nb_dir = Path(__file__).parent.parent / "fabric" / "notebooks"
    notebooks = sorted(nb_dir.glob("*.ipynb"))
    print(f"Found {len(notebooks)} notebook(s) in {nb_dir}")
    return notebooks


def upload_notebook(headers, workspace_id, notebook_path):
    name = notebook_path.stem
    with open(notebook_path, "rb") as f:
        content = base64.b64encode(f.read()).decode("utf-8")

    resp = requests.post(
        f"{FABRIC_API}/workspaces/{workspace_id}/notebooks",
        headers=headers,
        json={
            "displayName": name.replace("_", " ").title(),
            "definition": {
                "format": "ipynb",
                "parts": [
                    {
                        "path": f"{name}.ipynb",
                        "payload": content,
                        "payloadType": "InlineBase64",
                    }
                ],
            },
        },
    )
    if resp.status_code in (200, 201):
        nb = resp.json()
        print(f"  Uploaded: {name} -> {nb.get('id', 'ok')}")
        return nb.get("id")
    else:
        print(f"  FAIL: {name} ({resp.status_code}: {resp.text})", file=sys.stderr)
        return None


def schedule_notebook(headers, workspace_id, notebook_id, name, orchestration_metadata):
    resp = requests.post(
        f"{FABRIC_API}/workspaces/{workspace_id}/items/{notebook_id}/jobs/instances",
        headers=headers,
        json={"executionData": {"parameters": {}, "optimisticConcurrency": True}},
    )
    if resp.status_code in (200, 201, 202):
        schedule = orchestration_metadata.get("schedule", {})
        pipeline_id = orchestration_metadata.get("pipeline_id", "unmapped")
        print(
            f"    Scheduled run for: {name} "
            f"(pipeline={pipeline_id}, cron={schedule.get('cron_utc', 'n/a')})"
        )
    else:
        print(f"    Schedule skipped for {name}: {resp.status_code}", file=sys.stderr)


def get_orchestration_metadata(notebook_path):
    payload = json.loads(notebook_path.read_text(encoding="utf-8"))
    return payload.get("metadata", {}).get("tvs_orchestration", {})


def parse_args():
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--dry-run",
        action="store_true",
        help="Print orchestration metadata without uploading notebooks",
    )
    return parser.parse_args()


def main():
    args = parse_args()
    headers = get_headers()
    notebooks = discover_notebooks()

    if not notebooks:
        print("No notebooks found. Exiting.")
        sys.exit(0)

    print("=== Uploading Fabric Notebooks ===")
    for nb_path in notebooks:
        name = nb_path.stem
        ws_env_var = NOTEBOOK_WORKSPACE_MAP.get(name)
        ws_id = os.environ.get(ws_env_var, "") if ws_env_var else ""

        if not ws_id:
            print(f"  SKIP: {name} (no workspace ID in {ws_env_var})")
            continue

        orchestration_metadata = get_orchestration_metadata(nb_path)
        if not orchestration_metadata:
            print(f"  WARN: {name} missing tvs_orchestration metadata")

        if args.dry_run:
            print(f"  DRY-RUN: {name} -> {orchestration_metadata}")
            continue

        nb_id = upload_notebook(headers, ws_id, nb_path)
        if nb_id:
            schedule_notebook(headers, ws_id, nb_id, name, orchestration_metadata)

    print("\nDone.")


if __name__ == "__main__":
    main()
