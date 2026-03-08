#!/usr/bin/env bash
set -euo pipefail

ENTITY="${1:-tvs}"
WS_ID="${2:?workspace id required}"
python3 plugins/tvs-microsoft-deploy/scripts/api/fabric_request.py \
  "/workspaces/${WS_ID}/lakehouses" \
  --entity "$ENTITY"
