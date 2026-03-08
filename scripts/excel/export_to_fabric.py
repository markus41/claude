#!/usr/bin/env python3
"""Export workbook chunks to Fabric staging JSON files."""

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
    parser.add_argument("--output-dir", required=True)
    args = parser.parse_args()

    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    for chunk in parse_sheet_in_chunks(args.workbook, args.sheet, chunk_size=500):
        part_path = out_dir / f"{args.sheet.lower()}_part_{chunk.row_offset:06d}.json"
        part_path.write_text(json.dumps(chunk.rows, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
