#!/usr/bin/env python3
"""Create a semantic model deployment payload for embedded analytics tenants."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class SemanticModelDeployment:
    tenant_code: str
    workspace_name: str
    model_name: str
    source_mode: str
    lakehouse_name: str
    rls_role: str
    refresh_frequency: str


def build_payload(args: argparse.Namespace) -> SemanticModelDeployment:
    return SemanticModelDeployment(
        tenant_code=args.tenant_code,
        workspace_name=args.workspace_name,
        model_name=args.model_name,
        source_mode=args.source_mode,
        lakehouse_name=args.lakehouse_name,
        rls_role=args.rls_role,
        refresh_frequency=args.refresh_frequency,
    )


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build semantic model deployment payload")
    parser.add_argument("--tenant-code", required=True)
    parser.add_argument("--workspace-name", required=True)
    parser.add_argument("--model-name", required=True)
    parser.add_argument("--source-mode", default="directlake", choices=["directlake", "import", "directquery"])
    parser.add_argument("--lakehouse-name", required=True)
    parser.add_argument("--rls-role", default="TenantScopedViewer")
    parser.add_argument("--refresh-frequency", default="hourly")
    parser.add_argument("--output", default="-")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    payload = json.dumps(asdict(build_payload(args)), indent=2)

    if args.output == "-":
        print(payload)
    else:
        path = Path(args.output)
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(payload + "\n", encoding="utf-8")
        print(f"Deployment payload written to {path}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
