#!/usr/bin/env python3
"""Operational CLI for Planner workflow orchestration."""

from __future__ import annotations

import argparse
import importlib.util
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict

BASE = Path(__file__).resolve().parents[1]
ORCH = BASE / "planner-orchestrator"


def _load_module(name: str, file_name: str):
    spec = importlib.util.spec_from_file_location(name, ORCH / file_name)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


client_module = _load_module("planner_client", "planner_client.py")
state_module = _load_module("state_manager", "state_manager.py")
PlannerClient = client_module.PlannerClient
WorkflowStateManager = state_module.WorkflowStateManager


def _load_json(path: Path) -> Dict[str, Any]:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(path: Path, payload: Dict[str, Any]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)
        handle.write("\n")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Planner workflow orchestrator")
    parser.add_argument("operation", choices=["init-plan", "sync-workflow", "advance-phase", "blocker-report", "closeout-pack"])
    parser.add_argument("--workflow", required=True, help="Workflow JSON path")
    parser.add_argument("--output", help="Output JSON path (defaults to overwrite workflow for sync/advance)")
    parser.add_argument("--phase", help="Phase name for advance-phase")
    parser.add_argument("--group-id", help="M365 group for init-plan")
    parser.add_argument("--plan-title", help="Planner plan title for init-plan")
    parser.add_argument("--token-env", default="GRAPH_TOKEN")
    parser.add_argument("--dry-run", action="store_true")
    return parser


def main() -> int:
    args = build_parser().parse_args()
    workflow_path = Path(args.workflow)
    workflow = _load_json(workflow_path)

    token = os.getenv(args.token_env, "dry-run-token")
    client = PlannerClient(token=token, dry_run=args.dry_run)
    manager = WorkflowStateManager(client)

    if args.operation == "init-plan":
        if not args.group_id or not args.plan_title:
            raise SystemExit("init-plan requires --group-id and --plan-title")
        result = manager.init_plan(workflow, args.group_id, args.plan_title)
    elif args.operation == "sync-workflow":
        result = manager.sync_workflow(workflow)
    elif args.operation == "advance-phase":
        if not args.phase:
            raise SystemExit("advance-phase requires --phase")
        result = manager.advance_phase(workflow, args.phase)
    elif args.operation == "blocker-report":
        result = manager.blocker_report(workflow)
    else:
        result = manager.closeout_pack(workflow)

    output = Path(args.output) if args.output else workflow_path
    _write_json(output, result)
    print(f"Wrote {args.operation} output to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
