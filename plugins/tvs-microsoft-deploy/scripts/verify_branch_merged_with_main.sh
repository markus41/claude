#!/usr/bin/env bash
set -euo pipefail

TARGET_BRANCH="${1:-$(git rev-parse --abbrev-ref HEAD)}"
MAIN_BRANCH="${2:-main}"

if ! git show-ref --verify --quiet "refs/heads/${MAIN_BRANCH}"; then
  echo "ERROR: ${MAIN_BRANCH} branch does not exist locally." >&2
  echo "Hint: create or fetch it first (e.g., git branch main <sha> or git fetch origin main:main)." >&2
  exit 2
fi

MAIN_SHA=$(git rev-parse "${MAIN_BRANCH}")
TARGET_SHA=$(git rev-parse "${TARGET_BRANCH}")
BASE_SHA=$(git merge-base "${MAIN_BRANCH}" "${TARGET_BRANCH}")

if [[ "${BASE_SHA}" != "${MAIN_SHA}" ]]; then
  echo "FAIL: ${TARGET_BRANCH} does not fully contain ${MAIN_BRANCH}." >&2
  echo "main=${MAIN_SHA}" >&2
  echo "target=${TARGET_SHA}" >&2
  echo "merge-base=${BASE_SHA}" >&2
  echo "Run: git checkout ${TARGET_BRANCH} && git merge ${MAIN_BRANCH}" >&2
  exit 1
fi

echo "PASS: ${TARGET_BRANCH} contains all commits from ${MAIN_BRANCH}."
echo "main=${MAIN_SHA}"
echo "target=${TARGET_SHA}"
