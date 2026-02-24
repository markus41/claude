#!/usr/bin/env python3
import argparse
import json
import os
import sys
from urllib import request

BASE_URL = "https://graph.microsoft.com/v1.0"
DEFAULT_BUCKETS = ["Backlog", "Explore", "Plan", "Build", "Validate", "Remediate", "Done"]


def graph_call(method: str, path: str, token: str, payload: dict | None = None):
    req = request.Request(f"{BASE_URL}{path}", method=method)
    req.add_header("Authorization", f"Bearer {token}")
    req.add_header("Content-Type", "application/json")
    data = None
    if payload is not None:
        data = json.dumps(payload).encode("utf-8")
    with request.urlopen(req, data=data) as resp:
        return json.loads(resp.read().decode("utf-8"))


def main() -> int:
    parser = argparse.ArgumentParser(description="Create Planner plan and standard buckets")
    parser.add_argument("--workflow", required=True)
    parser.add_argument("--group-id", required=True)
    parser.add_argument("--dry-run", action="store_true")
    args = parser.parse_args()

    token = os.environ.get("GRAPH_TOKEN")
    if not token:
      print("ERROR: GRAPH_TOKEN is required", file=sys.stderr)
      return 2

    plan_title = f"{args.workflow}-orchestration"

    if args.dry_run:
        print(json.dumps({"workflow": args.workflow, "groupId": args.group_id, "planTitle": plan_title, "buckets": DEFAULT_BUCKETS}, indent=2))
        return 0

    plan = graph_call("POST", "/planner/plans", token, {"owner": args.group_id, "title": plan_title})
    plan_id = plan["id"]

    created = []
    for name in DEFAULT_BUCKETS:
        bucket = graph_call("POST", "/planner/buckets", token, {"name": name, "planId": plan_id, "orderHint": " !"})
        created.append({"id": bucket["id"], "name": name})

    print(json.dumps({"planId": plan_id, "planTitle": plan_title, "buckets": created}, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
