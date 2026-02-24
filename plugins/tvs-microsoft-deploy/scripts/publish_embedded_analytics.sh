#!/usr/bin/env bash
set -euo pipefail

CLIENT=""
PACKAGE=""

while [[ $# -gt 0 ]]; do
  case "$1" in
    --client) CLIENT="$2"; shift 2 ;;
    --package) PACKAGE="$2"; shift 2 ;;
    *) echo "Unknown argument: $1" >&2; exit 2 ;;
  esac
done

[[ -n "$CLIENT" ]] || { echo "--client is required" >&2; exit 2; }
[[ -n "$PACKAGE" ]] || { echo "--package is required" >&2; exit 2; }
[[ -n "${FABRIC_TOKEN:-}" ]] || { echo "FABRIC_TOKEN is required" >&2; exit 2; }

WORKSPACE="client-${CLIENT}-prod"
REPORT="${PACKAGE}-embed-report"

cat <<JSON
{
  "workspace": "${WORKSPACE}",
  "report": "${REPORT}",
  "status": "prepared",
  "next": [
    "deploy semantic model",
    "configure RLS",
    "publish embed token endpoint",
    "update Power Pages configuration"
  ]
}
JSON
