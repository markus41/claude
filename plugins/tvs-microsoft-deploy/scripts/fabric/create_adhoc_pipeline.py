#!/usr/bin/env python3
"""Generate ad hoc Fabric pipeline specs from curated templates."""

from __future__ import annotations

import argparse
import json
from pathlib import Path

try:
    import yaml  # type: ignore
except ImportError:  # pragma: no cover
    yaml = None

ROOT = Path(__file__).resolve().parents[2]
TEMPLATE_DIR = ROOT / "fabric" / "pipelines" / "templates"


def _load_template(path: Path) -> dict:
    if yaml is None:
        raise SystemExit("PyYAML is required. Install with: pip install pyyaml")
    with path.open("r", encoding="utf-8") as fh:
        data = yaml.safe_load(fh)
    if not isinstance(data, dict):
        raise SystemExit(f"Invalid template payload in {path}")
    return data


def _apply_vars(payload: dict, pairs: list[str]) -> dict:
    for pair in pairs:
        if "=" not in pair:
            raise SystemExit(f"Invalid --set value '{pair}'. Expected key=value")
        key, raw = pair.split("=", 1)
        cursor = payload
        parts = key.split(".")
        for part in parts[:-1]:
            if part not in cursor or not isinstance(cursor[part], dict):
                cursor[part] = {}
            cursor = cursor[part]
        cursor[parts[-1]] = raw
    return payload


def _emit(payload: dict, fmt: str) -> str:
    if fmt == "json":
        return json.dumps(payload, indent=2) + "\n"
    if yaml is None:
        raise SystemExit("PyYAML is required for yaml output. Install with: pip install pyyaml")
    return yaml.safe_dump(payload, sort_keys=False)


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--template", required=True, help="Template name without extension")
    parser.add_argument("--output", required=True, help="Output path for the generated spec")
    parser.add_argument("--format", choices=["yaml", "json"], default="yaml")
    parser.add_argument("--set", action="append", default=[], metavar="KEY=VALUE", help="Override a value, supports dotted keys")
    args = parser.parse_args()

    template_path = TEMPLATE_DIR / f"{args.template}.pipeline.yaml"
    if not template_path.exists():
        available = sorted(p.stem.replace(".pipeline", "") for p in TEMPLATE_DIR.glob("*.pipeline.yaml"))
        raise SystemExit(f"Template not found: {args.template}. Available: {', '.join(available)}")

    payload = _apply_vars(_load_template(template_path), args.set)
    out = Path(args.output)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(_emit(payload, args.format), encoding="utf-8")
    print(f"Generated {out} from template {template_path.name}")


if __name__ == "__main__":
    main()
