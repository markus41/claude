#!/usr/bin/env python3
"""Generate human and machine CLI docs from markdown command contracts."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path

FRONTMATTER_RE = re.compile(r"^---\n(.*?)\n---\n", re.DOTALL)
DESC_RE = re.compile(r"^description:\s*(.*)$", re.MULTILINE)
NAME_RE = re.compile(r"^name:\s*(.*)$", re.MULTILINE)
USAGE_BLOCK_RE = re.compile(r"## Usage\s*\n\n```(?:bash)?\n(.*?)```", re.DOTALL)


def parse_command_file(path: Path) -> dict:
    text = path.read_text(encoding="utf-8")
    name = path.stem
    description = ""
    fm = FRONTMATTER_RE.search(text)
    if fm:
        body = fm.group(1)
        name_m = NAME_RE.search(body)
        desc_m = DESC_RE.search(body)
        if name_m:
            name = name_m.group(1).strip()
        if desc_m:
            description = desc_m.group(1).strip()

    usage = ""
    usage_m = USAGE_BLOCK_RE.search(text)
    if usage_m:
        usage = usage_m.group(1).strip().splitlines()[0]

    return {
        "file": path.name,
        "name": name,
        "description": description,
        "usage": usage,
        "path": str(path.as_posix()),
    }


def build_markdown(commands: list[dict]) -> str:
    lines = ["# TVS Microsoft Deploy Commands", "", "Generated from `commands/*.md`.", ""]
    lines += [
        "## Shared Arguments",
        "",
        "- `--entity <tvs|consulting|taia|all>`",
        "- `--tenant <tenant-id>`",
        "- `--strict`",
        "- `--dry-run`",
        "- `--export-json <path>`",
        "- `--plan-id <plan-id>`",
        "",
        "## Command Index",
        "",
        "| Command | Description | Usage |",
        "|---|---|---|",
    ]
    for cmd in commands:
        lines.append(f"| `{cmd['name']}` | {cmd['description']} | `{cmd['usage']}` |")
    lines.append("")
    return "\n".join(lines)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--commands-dir",
        default="plugins/tvs-microsoft-deploy/commands",
        help="Directory containing command markdown files.",
    )
    parser.add_argument("--docs-dir", default="docs/cli", help="Output documentation directory.")
    args = parser.parse_args()

    commands_dir = Path(args.commands_dir)
    docs_dir = Path(args.docs_dir)
    docs_dir.mkdir(parents=True, exist_ok=True)

    commands = [parse_command_file(p) for p in sorted(commands_dir.glob("*.md"))]
    markdown = build_markdown(commands)

    (docs_dir / "COMMANDS.md").write_text(markdown + "\n", encoding="utf-8")
    (docs_dir / "commands.json").write_text(json.dumps(commands, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
