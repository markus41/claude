#!/usr/bin/env python3
"""Generate Power Pages embed configuration for a client tenant."""

from __future__ import annotations

import argparse
import json
from dataclasses import asdict, dataclass
from pathlib import Path


@dataclass
class PowerPagesEmbedConfig:
    tenant_code: str
    site_name: str
    report_id: str
    workspace_id: str
    embed_api_url: str
    allowed_origins: list[str]
    web_role: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Build Power Pages embed configuration")
    parser.add_argument("--tenant-code", required=True)
    parser.add_argument("--site-name", required=True)
    parser.add_argument("--report-id", required=True)
    parser.add_argument("--workspace-id", required=True)
    parser.add_argument("--embed-api-url", required=True)
    parser.add_argument(
        "--allowed-origin",
        action="append",
        dest="allowed_origins",
        default=[],
        help="Allowed origin. Repeat for multiple domains.",
    )
    parser.add_argument("--web-role", default="analytics-viewer")
    parser.add_argument("--output", default="-")
    return parser.parse_args()


def build_config(args: argparse.Namespace) -> PowerPagesEmbedConfig:
    origins = args.allowed_origins or [f"https://analytics.{args.tenant_code}.example.com"]
    return PowerPagesEmbedConfig(
        tenant_code=args.tenant_code,
        site_name=args.site_name,
        report_id=args.report_id,
        workspace_id=args.workspace_id,
        embed_api_url=args.embed_api_url,
        allowed_origins=origins,
        web_role=args.web_role,
    )


def main() -> int:
    args = parse_args()
    payload = json.dumps(asdict(build_config(args)), indent=2)

    if args.output == "-":
        print(payload)
    else:
        output = Path(args.output)
        output.parent.mkdir(parents=True, exist_ok=True)
        output.write_text(payload + "\n", encoding="utf-8")
        print(f"Embed config written to {output}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
