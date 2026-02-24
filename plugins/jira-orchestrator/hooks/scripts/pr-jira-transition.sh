#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PLUGIN_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"

if ! command -v npx >/dev/null 2>&1; then
  echo "[pr-jira-transition] npx is required to execute PR transition routing" >&2
  exit 1
fi

npx --yes tsx "$PLUGIN_ROOT/hooks/scripts/pr-jira-transition.ts" "$@"
