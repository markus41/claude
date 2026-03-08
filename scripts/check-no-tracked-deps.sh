#!/usr/bin/env bash
set -euo pipefail

patterns=(
  '**/node_modules/**'
  '**/.pnpm/**'
  '**/.yarn/**'
)

artifact_patterns=(
  '**/dist/**'
  '**/build/**'
)

tracked_deps=""
for pattern in "${patterns[@]}"; do
  matches=$(git ls-files "$pattern")
  if [ -n "$matches" ]; then
    tracked_deps+=$'\n'
    tracked_deps+="$matches"
  fi
done

if [ -n "$tracked_deps" ]; then
  echo "❌ Tracked dependency directories detected. Remove them from git and rely on lockfiles + npm ci:" >&2
  echo "$tracked_deps" | sed '/^$/d' >&2
  exit 1
fi

tracked_artifacts=""
for pattern in "${artifact_patterns[@]}"; do
  matches=$(git ls-files "$pattern")
  if [ -n "$matches" ]; then
    tracked_artifacts+=$'\n'
    tracked_artifacts+="$matches"
  fi
done

if [ -n "$tracked_artifacts" ]; then
  echo "⚠️ Tracked build artifacts detected (dist/build). Prefer release artifacts instead of committing generated output:" >&2
  echo "$tracked_artifacts" | sed '/^$/d' >&2
  exit 1
fi

echo "✅ No tracked dependency directories or generated build artifacts detected."
