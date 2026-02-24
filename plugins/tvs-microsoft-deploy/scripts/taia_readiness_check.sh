#!/usr/bin/env bash
set -euo pipefail

ENTITY="taia"
FORMAT="table"
STRICT=0

while [[ $# -gt 0 ]]; do
  case "$1" in
    --entity) ENTITY="$2"; shift 2 ;;
    --format) FORMAT="$2"; shift 2 ;;
    --strict) STRICT=1; shift ;;
    *) echo "Unknown arg: $1" >&2; exit 2 ;;
  esac
done

if [[ "$ENTITY" != "taia" ]]; then
  echo "This script currently supports only --entity taia" >&2
  exit 2
fi

require_var() {
  local name="$1"
  if [[ -z "${!name:-}" ]]; then
    echo "missing:$name"
    return 1
  fi
}

score=100
fails=()
checks=()

for v in TAIA_TENANT_ID AZURE_TENANT_ID GRAPH_TOKEN FABRIC_TOKEN; do
  if ! require_var "$v" >/dev/null; then
    fails+=("$v not set")
    score=$((score-15))
  fi
done

if [[ -n "${TAIA_TENANT_ID:-}" && -n "${AZURE_TENANT_ID:-}" && "$TAIA_TENANT_ID" != "$AZURE_TENANT_ID" ]]; then
  fails+=("active tenant does not match TAIA_TENANT_ID")
  score=$((score-20))
fi

for f in \
  "plugins/tvs-microsoft-deploy/workflows/taia-sale-prep.md" \
  "plugins/tvs-microsoft-deploy/workflows/week1-critical-path.md" \
  "plugins/tvs-microsoft-deploy/fabric/notebooks/a3_archive_validate.ipynb"; do
  if [[ ! -f "$f" ]]; then
    fails+=("missing artifact: $f")
    score=$((score-10))
  fi
  checks+=("artifact:$f")
done

if [[ $score -lt 0 ]]; then score=0; fi

if [[ "$FORMAT" == "json" ]]; then
  printf '{"entity":"%s","score":%d,"strict":%d,"failCount":%d}\n' "$ENTITY" "$score" "$STRICT" "${#fails[@]}"
else
  echo "TAIA readiness score: $score/100"
  if [[ ${#fails[@]} -eq 0 ]]; then
    echo "Status: GREEN"
  else
    echo "Status: YELLOW"
    for f in "${fails[@]}"; do echo " - $f"; done
  fi
fi

if [[ $STRICT -eq 1 && ${#fails[@]} -gt 0 ]]; then
  exit 1
fi
