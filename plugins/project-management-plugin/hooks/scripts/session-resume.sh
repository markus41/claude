#!/usr/bin/env bash
set -euo pipefail

# Read hook context from stdin
INPUT=$(cat)
PROJECTS_DIR="${CLAUDE_PROJECT_DIR:-$HOME}/.claude/projects"

# Scan for any IN_PROGRESS projects
if [ ! -d "$PROJECTS_DIR" ]; then
  exit 0
fi

ACTIVE=""
for meta_file in "$PROJECTS_DIR"/*/meta.json; do
  [ -f "$meta_file" ] || continue
  STATUS=$(node -e "try{const d=require('$meta_file');process.stdout.write(d.status||'')}catch(e){}" 2>/dev/null || true)
  if [ "$STATUS" = "IN_PROGRESS" ]; then
    NAME=$(node -e "try{const d=require('$meta_file');process.stdout.write(d.name||'')}catch(e){}" 2>/dev/null || true)
    ID=$(node -e "try{const d=require('$meta_file');process.stdout.write(d.id||'')}catch(e){}" 2>/dev/null || true)
    ACTIVE="$ID ($NAME)"
    break
  fi
done

if [ -n "$ACTIVE" ]; then
  echo "{\"notification\": \"Active project: $ACTIVE — run /pm:status $ACTIVE to resume\"}"
else
  echo "{}"
fi
