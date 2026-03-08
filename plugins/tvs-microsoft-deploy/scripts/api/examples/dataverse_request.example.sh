#!/usr/bin/env bash
set -euo pipefail

ENTITY="${1:-tvs}"
TABLE="${2:-tvs_accounts}"
python3 plugins/tvs-microsoft-deploy/scripts/api/dataverse_request.py \
  "/${TABLE}" \
  --params '{"$top": 5}' \
  --entity "$ENTITY"
