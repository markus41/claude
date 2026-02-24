#!/usr/bin/env python3
"""Power Platform ALM orchestrator for Dataverse, Automate, and Copilot Studio assets."""

import argparse
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PP_ROOT = ROOT / "power-platform"


def load_json(path: Path):
    with path.open() as handle:
        return json.load(handle)


def run(cmd):
    print("$", " ".join(cmd))
    subprocess.run(cmd, check=True)


def collect_manifests():
    return [load_json(path) for path in sorted((PP_ROOT / "manifests").glob("*.json"))]


def pack_unpack(profile, mode):
    artifacts_dir = ROOT / profile["packagePath"]
    artifacts_dir.mkdir(parents=True, exist_ok=True)
    for manifest in collect_manifests():
        solution = manifest["name"]
        solution_zip = artifacts_dir / f"{solution}.zip"
        solution_src = ROOT / "solutions" / solution
        if mode == "unpack":
            run(["pac", "solution", "unpack", "--zipfile", str(solution_zip), "--folder", str(solution_src), "--allowDelete", "true"])
        else:
            package_type = "Managed" if profile["solutionMode"] == "managed" else "Unmanaged"
            run(["pac", "solution", "pack", "--zipfile", str(solution_zip), "--folder", str(solution_src), "--packagetype", package_type])


def import_solutions(profile):
    artifacts_dir = ROOT / profile["packagePath"]
    for manifest in collect_manifests():
        solution_zip = artifacts_dir / f"{manifest['name']}.zip"
        if not solution_zip.exists():
            print(f"WARN: Skipping missing package {solution_zip}")
            continue
        run([
            "pac",
            "solution",
            "import",
            "--path",
            str(solution_zip),
            "--environment",
            profile["dataverseUrl"],
            "--publish-changes",
            "true",
        ])




def validate_schema_rules():
    rules = load_json(PP_ROOT / "validation" / "dataverse-schema-rules.json")
    tvs_tables = load_json(ROOT / "schemas" / "tvs_tables.json")
    consulting_tables = load_json(ROOT / "schemas" / "consulting_tables.json")

    all_tables = {}
    all_tables.update(tvs_tables.get("tables", {}))
    all_tables.update(consulting_tables.get("tables", {}))

    by_logical = {table.get("logicalName"): table for table in all_tables.values()}
    missing_tables = [name for name in rules.get("requiredColumns", {}) if name not in by_logical]
    if missing_tables:
        raise RuntimeError(f"Schema drift detected, missing canonical tables: {', '.join(missing_tables)}")

    missing_columns = []
    for logical_name, required_cols in rules.get("requiredColumns", {}).items():
        actual = set(by_logical[logical_name].get("columns", {}).keys())
        absent = [column for column in required_cols if column not in actual]
        if absent:
            missing_columns.append(f"{logical_name}({', '.join(absent)})")

    if missing_columns:
        raise RuntimeError("Schema drift detected, missing required columns: " + "; ".join(missing_columns))


def validate_connector_auth(profile):
    refs = profile.get("connectionReferences", {})
    invalid = [name for name, cfg in refs.items() if cfg.get("auth") != "servicePrincipal"]
    if invalid:
        raise RuntimeError(f"Connection references without service principal auth: {', '.join(invalid)}")


def validate_flow_owners():
    manifest = load_json(PP_ROOT / "manifests" / "tvs-automations.solution.json")
    policy = manifest.get("flowOwnerPolicy", {})
    owners = set(filter(None, os.environ.get("FLOW_OWNER_OBJECT_IDS", "").split(",")))
    required = set(policy.get("servicePrincipalIds", []))
    if policy.get("requireServicePrincipal") and not required.issubset(owners):
        raise RuntimeError("Flow owner policy check failed: missing approved service principals")


def validate_capacity(profile):
    limits = profile.get("capacityLimits", {})
    observed = {
        "databasePct": float(os.environ.get("PP_CAPACITY_DATABASE_PCT", "0")),
        "filePct": float(os.environ.get("PP_CAPACITY_FILE_PCT", "0")),
        "logPct": float(os.environ.get("PP_CAPACITY_LOG_PCT", "0")),
    }
    exceeded = [name for name, value in observed.items() if value and value > float(limits.get(name, 100))]
    if exceeded:
        raise RuntimeError(f"Environment capacity limits exceeded: {', '.join(exceeded)}")


def validate_release_gates():
    gates = load_json(PP_ROOT / "validation" / "release-gates.json")
    missing = []
    for gate in gates.get("criticalAutomations", []):
        rollback = ROOT / Path(gate["rollbackPackage"]).relative_to("plugins/tvs-microsoft-deploy")
        if not rollback.exists():
            missing.append(gate["name"])
    if missing:
        raise RuntimeError(f"Missing rollback packages for release gates: {', '.join(missing)}")


def validate_copilot_assets():
    manifest = load_json(PP_ROOT / "manifests" / "tvs-copilot-studio.solution.json")
    missing = [asset for asset in manifest.get("botAssets", []) if not (ROOT / Path(asset).relative_to("plugins/tvs-microsoft-deploy")).exists()]
    if missing:
        raise RuntimeError(f"Missing Copilot Studio assets: {', '.join(missing)}")


def promote_version():
    for path in sorted((PP_ROOT / "manifests").glob("*.json")):
        manifest = load_json(path)
        major, minor, patch = [int(part) for part in manifest["version"].split(".")]
        manifest["version"] = f"{major}.{minor}.{patch + 1}"
        path.write_text(json.dumps(manifest, indent=2) + "\n")
        print(f"Promoted {manifest['name']} to {manifest['version']}")


def main():
    parser = argparse.ArgumentParser(description="Power Platform ALM lifecycle helper")
    parser.add_argument("--profile", default="dev", choices=["dev", "test", "prod"])
    parser.add_argument("--action", required=True, choices=["precheck", "pack", "unpack", "import", "promote"])
    args = parser.parse_args()

    profile = load_json(PP_ROOT / "profiles" / f"{args.profile}.json")

    if args.action == "precheck":
        validate_schema_rules()
        validate_connector_auth(profile)
        validate_flow_owners()
        validate_capacity(profile)
        validate_release_gates()
        validate_copilot_assets()
        print("Pre-promotion checks passed")
    elif args.action == "pack":
        pack_unpack(profile, "pack")
    elif args.action == "unpack":
        pack_unpack(profile, "unpack")
    elif args.action == "import":
        import_solutions(profile)
    elif args.action == "promote":
        promote_version()
    else:
        print("Unknown action", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
