#!/usr/bin/env python3
import argparse
import json
from zipfile import ZipFile


def profile_xlsx(path: str) -> dict:
    with ZipFile(path) as z:
        names = z.namelist()
        sheet_files = [n for n in names if n.startswith("xl/worksheets/") and n.endswith(".xml")]
        shared_strings = "xl/sharedStrings.xml" in names
        calc_chain = "xl/calcChain.xml" in names
        external_links = [n for n in names if n.startswith("xl/externalLinks/")]
    return {
        "file": path,
        "sheetCount": len(sheet_files),
        "hasSharedStrings": shared_strings,
        "hasCalcChain": calc_chain,
        "externalLinkCount": len(external_links),
        "riskLevel": "high" if len(external_links) > 0 or len(sheet_files) > 40 else "normal",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Profile xlsx workbook structure")
    parser.add_argument("workbook")
    args = parser.parse_args()
    print(json.dumps(profile_xlsx(args.workbook), indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
