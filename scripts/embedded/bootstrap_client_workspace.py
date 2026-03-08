#!/usr/bin/env python3
"""Bootstrap an embedded analytics client workspace plan.

This script produces a deterministic workspace bootstrap manifest that can be fed
into downstream infrastructure automation.
"""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class WorkspaceBootstrap:
    client_code: str
    environment: str
    region: str
    workspace_name: str
    capacity_sku: str
    security_groups: list[str]
    tags: dict[str, str]


def build_bootstrap(client_code: str, environment: str, region: str, capacity_sku: str) -> WorkspaceBootstrap:
    workspace_name = f"ea-{environment}-{client_code}-{region}"
    return WorkspaceBootstrap(
        client_code=client_code,
        environment=environment,
        region=region,
        workspace_name=workspace_name,
        capacity_sku=capacity_sku,
        security_groups=[
            f"{client_code}-analytics-viewers",
            f"{client_code}-analytics-admins",
        ],
        tags={
            "owner": "embedded-analytics",
            "client": client_code,
            "environment": environment,
            "region": region,
        },
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate client workspace bootstrap manifest")
    parser.add_argument("--client-code", required=True, help="Short client code, e.g. acme")
    parser.add_argument("--environment", choices=["dev", "test", "prod"], required=True)
    parser.add_argument("--region", required=True, help="Azure/Fabric region code")
    parser.add_argument("--capacity-sku", default="F64", help="Fabric capacity SKU")
    parser.add_argument("--output", default="-", help="Output JSON path or '-' for stdout")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    manifest = build_bootstrap(
        client_code=args.client_code,
        environment=args.environment,
        region=args.region,
        capacity_sku=args.capacity_sku,
    )
    payload = json.dumps(asdict(manifest), indent=2)

    if args.output == "-":
        print(payload)
    else:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(payload + "\n", encoding="utf-8")
        print(f"Wrote bootstrap manifest to {output_path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
