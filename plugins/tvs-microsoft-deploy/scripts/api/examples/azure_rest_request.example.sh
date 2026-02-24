#!/usr/bin/env bash
set -euo pipefail

ENTITY="${1:-tvs}"
SUB_ID="${2:?subscription id required}"
python3 plugins/tvs-microsoft-deploy/scripts/api/azure_rest_request.py \
  "/subscriptions/${SUB_ID}/resourcegroups" \
  --params '{"api-version":"2021-04-01"}' \
  --entity "$ENTITY"
