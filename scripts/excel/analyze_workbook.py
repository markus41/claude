#!/usr/bin/env python3
"""Analyze workbook quality using TVS excel validation profiles."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

PLUGIN_ROOT = Path(__file__).resolve().parents[2] / "plugins" / "tvs-microsoft-deploy"
if str(PLUGIN_ROOT) not in sys.path:
    sys.path.insert(0, str(PLUGIN_ROOT))

from excel.validation_engine import validate_workbook


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--workbook", required=True, help="Path to workbook .xlsx file")
    parser.add_argument("--profile", required=True, help="Profile id")
    parser.add_argument("--output", help="Optional JSON output path")
    args = parser.parse_args()

    result = validate_workbook(args.workbook, args.profile)
    rendered = json.dumps(result, indent=2)
    if args.output:
        Path(args.output).write_text(rendered + "\n", encoding="utf-8")
    print(rendered)
    if not result["passed"]:
        raise SystemExit(1)


if __name__ == "__main__":
    main()
