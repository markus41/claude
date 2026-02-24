#!/usr/bin/env python3
"""Automated identity policy checks for pre-deploy guardrails."""

from __future__ import annotations

import argparse
import json
import re
from pathlib import Path
from typing import Any


DEPLOY_PATTERNS = (
    "deploy-identity",
    "deploy-all",
    "az deployment",
    "pac solution import",
)


def load_config(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def flatten_permissions(entity: dict[str, Any]) -> list[tuple[str, str, str]]:
    entries: list[tuple[str, str, str]] = []
    perms = entity.get("permissions", {})
    for mode in ("delegated", "application"):
        for row in perms.get(mode, []):
            principal = row.get("principal", "")
            for scope in row.get("scopes", []):
                entries.append((mode, principal, scope))
    return entries


def run_checks(config: dict[str, Any]) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []
    entities = config.get("entities", {})
    high_risk = set(config.get("defaults", {}).get("high_privilege_graph_scopes", []))
    max_breakglass = int(config.get("defaults", {}).get("breakglass_max_accounts", 2))

    tenant_ids: dict[str, str] = {}
    for entity_name, entity in entities.items():
        tenant_id = entity.get("tenantId", "")
        if tenant_id in tenant_ids and tenant_id:
            findings.append(
                {
                    "policy": "tenant_isolation",
                    "severity": "deny",
                    "entity": entity_name,
                    "reason": f"tenantId collides with {tenant_ids[tenant_id]}",
                }
            )
        tenant_ids[tenant_id] = entity_name

        required_ca = set(entity.get("conditionalAccess", {}).get("requiredPolicies", []))
        missing = {"ca-require-mfa-all-users", "ca-block-legacy-auth"} - required_ca
        if missing:
            findings.append(
                {
                    "policy": "conditional_access",
                    "severity": "deny",
                    "entity": entity_name,
                    "reason": f"missing required CA policies: {sorted(missing)}",
                }
            )

        breakglass_accounts = [u for u in entity.get("users", []) if u.get("accountType") == "breakglass"]
        exclusions = set(entity.get("conditionalAccess", {}).get("breakglassExclusions", []))

        if len(breakglass_accounts) > max_breakglass:
            findings.append(
                {
                    "policy": "breakglass_control",
                    "severity": "deny",
                    "entity": entity_name,
                    "reason": f"{len(breakglass_accounts)} breakglass accounts exceeds max {max_breakglass}",
                }
            )

        for acct in breakglass_accounts:
            if acct.get("upn") not in exclusions:
                findings.append(
                    {
                        "policy": "breakglass_control",
                        "severity": "deny",
                        "entity": entity_name,
                        "reason": f"breakglass account {acct.get('upn')} missing CA exclusion",
                    }
                )

        for mode, principal, scope in flatten_permissions(entity):
            if scope in high_risk:
                findings.append(
                    {
                        "policy": "least_privilege",
                        "severity": "deny",
                        "entity": entity_name,
                        "reason": f"{principal} requests high-risk {mode} Graph scope {scope}",
                    }
                )

            if re.search(r"\.ReadWrite\.All$", scope):
                findings.append(
                    {
                        "policy": "admin_consent_boundary",
                        "severity": "warn",
                        "entity": entity_name,
                        "reason": f"{principal} has write-all scope {scope}; require CAB approval",
                    }
                )

    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--config", default="plugins/tvs-microsoft-deploy/identity/identity-as-code.json")
    parser.add_argument("--command", default="", help="Optional command being evaluated")
    parser.add_argument("--json", action="store_true", help="Emit machine-readable JSON")
    args = parser.parse_args()

    config = load_config(Path(args.config))
    findings = run_checks(config)

    if args.command and any(p in args.command for p in DEPLOY_PATTERNS) and findings:
        for finding in findings:
            if finding["severity"] == "deny":
                finding["deploy_block"] = True

    if args.json:
        print(json.dumps({"findings": findings}, indent=2))
    else:
        for finding in findings:
            print(f"[{finding['severity'].upper()}] {finding['policy']}: {finding['entity']} - {finding['reason']}")

    return 2 if any(f["severity"] == "deny" for f in findings) else 0


if __name__ == "__main__":
    raise SystemExit(main())
