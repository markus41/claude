#!/usr/bin/env python3
"""Export workbook chunks to Dataverse-ready NDJSON payloads."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[2] / "plugins" / "tvs-microsoft-deploy"
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from excel.parsers import parse_sheet_in_chunks


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", required=True)
    parser.add_argument("--sheet", required=True)
    parser.add_argument("--table", required=True, help="Dataverse target table")
    parser.add_argument("--output", required=True)
    args = parser.parse_args()

    out_path = Path(args.output)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    with out_path.open("w", encoding="utf-8") as handle:
        for chunk in parse_sheet_in_chunks(args.workbook, args.sheet, chunk_size=300):
            for row in chunk.rows:
                handle.write(json.dumps({"table": args.table, "payload": row}) + "\n")


if __name__ == "__main__":
    main()
