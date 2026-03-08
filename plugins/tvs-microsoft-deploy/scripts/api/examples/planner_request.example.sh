#!/usr/bin/env bash
set -euo pipefail

ENTITY="${1:-tvs}"
python3 plugins/tvs-microsoft-deploy/scripts/api/planner_request.py \
  "/plans" \
  --entity "$ENTITY"
