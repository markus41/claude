#!/usr/bin/env python3
"""Validate and execute an ad hoc Fabric pipeline spec with retries."""

from __future__ import annotations

import argparse
import json
import time
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None

REQUIRED_TOP_LEVEL = [
    "pipeline_id",
    "display_name",
    "workspace_id",
    "sources",
    "transforms",
    "sinks",
    "schedule",
    "quality_rules",
    "lineage",
]


def _load_spec(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    if path.suffix.lower() == ".json":
        payload = json.loads(text)
    else:
        if yaml is None:
            raise SystemExit("PyYAML is required for YAML specs. Install with: pip install pyyaml")
        payload = yaml.safe_load(text)

    if not isinstance(payload, dict):
        raise SystemExit("Spec must deserialize to an object")
    return payload


def _validate(spec: dict) -> None:
    missing = [k for k in REQUIRED_TOP_LEVEL if k not in spec]
    if missing:
        raise SystemExit(f"Spec missing required top-level keys: {', '.join(missing)}")
    if not spec["sources"] or not spec["transforms"] or not spec["sinks"]:
        raise SystemExit("Spec must contain at least one source, transform, and sink")

    retry = spec.get("schedule", {}).get("retry", {})
    for key in ("max_attempts", "initial_backoff_seconds", "max_backoff_seconds"):
        if key not in retry:
            raise SystemExit(f"schedule.retry missing {key}")

    lineage = spec.get("lineage", {})
    for key in ("owner", "upstream", "downstream", "tags"):
        if key not in lineage:
            raise SystemExit(f"lineage missing {key}")


def _run_notebook(client, workspace_id: str, transform: dict, run_parameters: dict) -> str:
    notebook_id = transform.get("notebook_id")
    if not notebook_id:
        raise SystemExit(f"Transform {transform.get('id')} is missing notebook_id; required for execution")

    response = client.request(
        "POST",
        f"/workspaces/{workspace_id}/items/{notebook_id}/jobs/instances",
        params={"jobType": "RunNotebook"},
        json_body={"executionData": {"parameters": run_parameters}},
    )
    if response.status_code >= 300:
        raise SystemExit(f"Notebook start failed ({response.status_code}): {response.text}")
    payload = response.json()
    run_id = payload.get("id") or payload.get("runId")
    if not run_id:
        raise SystemExit(f"Notebook start response missing run id: {payload}")
    return run_id


def execute(spec: dict, dry_run: bool) -> None:
    retry = spec["schedule"]["retry"]
    if dry_run:
        print(json.dumps({"mode": "dry-run", "pipeline": spec["pipeline_id"], "transforms": spec["transforms"]}, indent=2))
        return

    import sys

    sys.path.append(str(Path(__file__).resolve().parents[1] / "api"))
    from _core import ApiClient  # noqa: WPS433

    client = ApiClient("https://api.fabric.microsoft.com/v1", token_env="FABRIC_TOKEN")
    workspace_id = spec["workspace_id"]

    for transform in spec["transforms"]:
        if transform.get("type") != "notebook":
            print(f"Skipping unsupported transform type: {transform.get('type')}")
            continue

        attempt = 1
        delay = int(retry["initial_backoff_seconds"])
        max_delay = int(retry["max_backoff_seconds"])
        max_attempts = int(retry["max_attempts"])

        while True:
            try:
                run_id = _run_notebook(client, workspace_id, transform, {"pipeline_id": spec["pipeline_id"]})
                print(f"Submitted {transform['id']} run: {run_id}")
                break
            except SystemExit as err:
                if attempt >= max_attempts:
                    raise
                print(f"Attempt {attempt}/{max_attempts} failed for {transform['id']}: {err}. Retrying in {delay}s")
                time.sleep(delay)
                delay = min(delay * 2, max_delay)
                attempt += 1

    print("Execution submitted. Enforce quality_rules and lineage registration in downstream monitoring jobs.")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--spec", required=True, help="Path to JSON or YAML pipeline spec")
    parser.add_argument("--dry-run", action="store_true", help="Validate and print actions without API execution")
    args = parser.parse_args()

    spec = _load_spec(Path(args.spec))
    _validate(spec)
    execute(spec, args.dry_run)


if __name__ == "__main__":
    main()
