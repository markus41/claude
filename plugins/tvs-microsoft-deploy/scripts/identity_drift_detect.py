#!/usr/bin/env python3
"""Identity drift detection and remediation recommendations."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def parse_date(value: str) -> datetime:
    return datetime.fromisoformat(value.replace("Z", "+00:00")).astimezone(timezone.utc)


def age_days(created: str) -> int:
    return (datetime.now(timezone.utc) - parse_date(created)).days


def load_inventory(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text())


def detect_drift(inventory: dict[str, Any], secret_days: int, cert_days: int) -> list[dict[str, Any]]:
    findings: list[dict[str, Any]] = []

    for app in inventory.get("appCredentials", []):
        if app.get("type") == "secret" and age_days(app["createdDateTime"]) > secret_days:
            findings.append({
                "type": "stale_secret",
                "appId": app["appId"],
                "credentialId": app["credentialId"],
                "recommendation": "Rotate client secret and remove prior credential after cutover.",
            })
        if app.get("type") == "certificate" and age_days(app["createdDateTime"]) > cert_days:
            findings.append({
                "type": "stale_certificate",
                "appId": app["appId"],
                "credentialId": app["credentialId"],
                "recommendation": "Issue new cert, upload public key, then retire old certificate.",
            })

    for sp in inventory.get("servicePrincipals", []):
        if not sp.get("appId"):
            findings.append({
                "type": "orphaned_service_principal",
                "servicePrincipalId": sp["id"],
                "recommendation": "Review ownership and disable/delete orphaned service principal.",
            })

    for perm in inventory.get("graphPermissions", []):
        if perm.get("scope", "").endswith(".ReadWrite.All"):
            findings.append({
                "type": "overprivileged_scope",
                "principalId": perm["principalId"],
                "scope": perm["scope"],
                "recommendation": "Replace write-all scope with least-privilege alternatives where possible.",
            })

    return findings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", required=True, help="Path to exported identity inventory JSON")
    parser.add_argument("--secret-days", type=int, default=180)
    parser.add_argument("--cert-days", type=int, default=365)
    parser.add_argument("--output", help="Optional output path for machine-readable report JSON")
    args = parser.parse_args()

    inventory = load_inventory(Path(args.inventory))
    findings = detect_drift(inventory, args.secret_days, args.cert_days)
    report = {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "findingCount": len(findings),
        "findings": findings,
    }

    print(json.dumps(report, indent=2))
    if args.output:
        Path(args.output).write_text(json.dumps(report, indent=2))

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
