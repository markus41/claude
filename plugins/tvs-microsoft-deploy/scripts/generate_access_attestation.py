#!/usr/bin/env python3
"""Generate periodic access attestations and exportable TAIA governance audit reports."""

from __future__ import annotations

import argparse
import csv
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def load_json(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def create_attestation_rows(data: dict[str, Any], period: str) -> list[dict[str, str]]:
    rows: list[dict[str, str]] = []
    for row in data.get("assignments", []):
        rows.append(
            {
                "period": period,
                "entity": row.get("entity", "unknown"),
                "principal": row.get("principal", ""),
                "principalType": row.get("principalType", ""),
                "role": row.get("role", ""),
                "scope": row.get("scope", ""),
                "attestationStatus": "pending",
                "reviewer": row.get("reviewer", ""),
                "notes": "",
            }
        )
    return rows


def write_csv(path: Path, rows: list[dict[str, str]]) -> None:
    fieldnames = [
        "period",
        "entity",
        "principal",
        "principalType",
        "role",
        "scope",
        "attestationStatus",
        "reviewer",
        "notes",
    ]
    with path.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--input", required=True, help="JSON identity role assignment export")
    now=datetime.now(timezone.utc)
    quarter=((now.month-1)//3)+1
    parser.add_argument("--period", default=f"{now.year}-Q{quarter}")
    parser.add_argument("--csv-output", required=True)
    parser.add_argument("--json-output", required=True)
    args = parser.parse_args()

    data = load_json(Path(args.input))
    rows = create_attestation_rows(data, args.period)
    write_csv(Path(args.csv_output), rows)

    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "period": args.period,
        "totalAssignments": len(rows),
        "taiaTransitionAssignments": len([r for r in rows if r["entity"].lower() == "taia"]),
        "rows": rows,
    }
    Path(args.json_output).write_text(json.dumps(report, indent=2))
    print(json.dumps(report, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
