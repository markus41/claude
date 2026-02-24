#!/usr/bin/env bash
set -euo pipefail

ENTITY="${1:-tvs}"
python3 plugins/tvs-microsoft-deploy/scripts/api/graph_request.py \
  "/organization" \
  --entity "$ENTITY"
