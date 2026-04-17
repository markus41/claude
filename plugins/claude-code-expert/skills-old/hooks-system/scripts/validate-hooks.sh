#!/usr/bin/env bash
# validate-hooks.sh — Validate Claude Code hooks configuration
#
# Checks that all hooks registered in .claude/settings.json are present,
# executable, syntactically valid bash, and that critical hooks are registered.
#
# Usage: bash .claude/hooks/validate-hooks.sh [--project-root /path/to/root]
#
# Output: Human-readable pass/fail report per hook, with a summary at the end.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="${PROJECT_ROOT:-$(git rev-parse --show-toplevel 2>/dev/null || pwd)}"

# Allow override via flag
while [[ $# -gt 0 ]]; do
  case "$1" in
    --project-root) PROJECT_ROOT="$2"; shift 2 ;;
    *) shift ;;
  esac
done

SETTINGS_FILE="${PROJECT_ROOT}/.claude/settings.json"
HOOKS_DIR="${PROJECT_ROOT}/.claude/hooks"

PASS=0
FAIL=0
WARN=0

# Color codes (disabled if not a terminal)
if [ -t 1 ]; then
  GREEN='\033[0;32m'
  RED='\033[0;31m'
  YELLOW='\033[0;33m'
  RESET='\033[0m'
else
  GREEN=''
  RED=''
  YELLOW=''
  RESET=''
fi

ok()   { echo -e "  ${GREEN}✓${RESET} $1"; PASS=$((PASS + 1)); }
fail() { echo -e "  ${RED}✗${RESET} $1"; FAIL=$((FAIL + 1)); }
warn() { echo -e "  ${YELLOW}⚠${RESET} $1"; WARN=$((WARN + 1)); }

echo "=== Hook Validation Report ==="
echo "Project root: ${PROJECT_ROOT}"
echo ""

# ── Step 1: settings.json exists ──────────────────────────────────────────────
echo "Checking ${SETTINGS_FILE}..."
if [ ! -f "${SETTINGS_FILE}" ]; then
  fail "settings.json not found at ${SETTINGS_FILE}"
  echo ""
  echo "=== Summary ==="
  echo "Cannot proceed — settings.json is required."
  echo "Fix: Run /cc-setup to generate .claude/settings.json"
  exit 1
fi
ok "settings.json exists"

# ── Step 2: Check jq is available ─────────────────────────────────────────────
if ! command -v jq &>/dev/null; then
  fail "jq not found — required for JSON parsing"
  echo "Fix: Install jq (brew install jq / apt-get install jq)"
  exit 1
fi
echo ""

# ── Step 3: Validate hook events ──────────────────────────────────────────────
HOOK_EVENTS=("PreToolUse" "PostToolUse" "PostToolUseFailure" "PreCompact" "Stop")
REGISTERED_SECURITY_GUARD=false
REGISTERED_LESSONS_LEARNED=false

for EVENT in "${HOOK_EVENTS[@]}"; do
  # Extract array of commands for this event
  COMMANDS=$(jq -r --arg event "${EVENT}" \
    '.hooks[$event][]?.command // .hooks[$event][]?.bash // empty' \
    "${SETTINGS_FILE}" 2>/dev/null)

  COMMAND_COUNT=$(echo "${COMMANDS}" | grep -c . 2>/dev/null || echo 0)

  if [ "${COMMAND_COUNT}" -eq 0 ]; then
    # Not all events are required
    case "${EVENT}" in
      "PreToolUse"|"PostToolUseFailure")
        warn "${EVENT}: no hooks registered (recommended)" ;;
      *)
        echo "  — ${EVENT}: not configured (optional)" ;;
    esac
    continue
  fi

  echo "${EVENT}:"

  while IFS= read -r CMD; do
    [ -z "${CMD}" ] && continue

    # Extract script path from command (first token that looks like a .sh file)
    SCRIPT_PATH=""
    for TOKEN in ${CMD}; do
      if [[ "${TOKEN}" == *.sh ]]; then
        SCRIPT_PATH="${TOKEN}"
        break
      fi
    done

    # Resolve relative paths against project root and hooks dir
    if [ -n "${SCRIPT_PATH}" ]; then
      if [[ "${SCRIPT_PATH}" != /* ]]; then
        # Try as-is from project root first
        if [ -f "${PROJECT_ROOT}/${SCRIPT_PATH}" ]; then
          SCRIPT_PATH="${PROJECT_ROOT}/${SCRIPT_PATH}"
        elif [ -f "${HOOKS_DIR}/${SCRIPT_PATH##*/}" ]; then
          SCRIPT_PATH="${HOOKS_DIR}/${SCRIPT_PATH##*/}"
        fi
      fi
    fi

    LABEL="${CMD:0:60}"
    [ ${#CMD} -gt 60 ] && LABEL="${LABEL}..."

    # Detect critical hook types
    if echo "${CMD}" | grep -qi "security.guard\|security-guard\|pre.tool"; then
      REGISTERED_SECURITY_GUARD=true
    fi
    if echo "${CMD}" | grep -qi "lessons.learned\|lessons-learned\|error.capture\|capture"; then
      REGISTERED_LESSONS_LEARNED=true
    fi

    # ── Check 1: Script file exists ──────────────────────────────────────────
    if [ -n "${SCRIPT_PATH}" ] && [ ! -f "${SCRIPT_PATH}" ]; then
      fail "${LABEL} — script not found: ${SCRIPT_PATH}"
      continue
    fi

    # ── Check 2: Executable ──────────────────────────────────────────────────
    if [ -n "${SCRIPT_PATH}" ] && [ ! -x "${SCRIPT_PATH}" ]; then
      fail "${LABEL} — not executable (run: chmod +x ${SCRIPT_PATH})"
      continue
    fi

    # ── Check 3: Valid bash syntax ───────────────────────────────────────────
    if [ -n "${SCRIPT_PATH}" ] && [ -x "${SCRIPT_PATH}" ]; then
      SYNTAX_ERR=$(bash -n "${SCRIPT_PATH}" 2>&1)
      if [ $? -ne 0 ]; then
        fail "${LABEL} — syntax error: ${SYNTAX_ERR}"
        continue
      fi
    fi

    # ── Check 4: Produces valid JSON output (if script takes stdin) ──────────
    if [ -n "${SCRIPT_PATH}" ] && [ -x "${SCRIPT_PATH}" ]; then
      JSON_OUT=$(echo '{"tool_name":"test","tool_input":{}}' | \
        timeout 3s bash "${SCRIPT_PATH}" 2>/dev/null || true)
      if [ -n "${JSON_OUT}" ]; then
        if echo "${JSON_OUT}" | jq . &>/dev/null; then
          ok "${LABEL} — file exists, executable, valid syntax, JSON output OK"
        else
          warn "${LABEL} — file exists, executable, valid syntax, but output is not valid JSON"
        fi
      else
        ok "${LABEL} — file exists, executable, valid syntax"
      fi
    elif [ -z "${SCRIPT_PATH}" ]; then
      # Inline command (not a .sh file) — just note it's registered
      ok "${LABEL} — inline command registered"
    fi

  done <<< "${COMMANDS}"

  echo ""
done

# ── Step 4: Critical hook coverage ────────────────────────────────────────────
echo "Critical Hook Coverage:"

if [ "${REGISTERED_SECURITY_GUARD}" = true ]; then
  ok "PreToolUse security guard is registered"
else
  warn "No PreToolUse security guard found — recommended for blocking dangerous operations"
fi

if [ "${REGISTERED_LESSONS_LEARNED}" = true ]; then
  ok "PostToolUseFailure lessons-learned capture is registered"
else
  warn "No PostToolUseFailure error capture found — recommended for self-healing loop"
fi

echo ""

# ── Summary ───────────────────────────────────────────────────────────────────
TOTAL=$((PASS + FAIL))
echo "=== Summary ==="
echo -e "Pass: ${GREEN}${PASS}${RESET}/${TOTAL}"
if [ "${FAIL}" -gt 0 ]; then
  echo -e "Fail: ${RED}${FAIL}${RESET}/${TOTAL}"
fi
if [ "${WARN}" -gt 0 ]; then
  echo -e "Warn: ${YELLOW}${WARN}${RESET} (non-blocking)"
fi
echo ""

if [ "${FAIL}" -gt 0 ]; then
  echo "Fixes:"
  echo "  • Create missing hook files with: /cc-setup --hooks-only"
  echo "  • Make scripts executable:        chmod +x .claude/hooks/*.sh"
  echo "  • Fix syntax errors with:         bash -n .claude/hooks/<script>.sh"
  exit 1
elif [ "${WARN}" -gt 0 ]; then
  echo "Warnings are non-blocking. To add recommended hooks: /cc-setup --hooks-only"
  exit 0
else
  echo "All hooks valid."
  exit 0
fi
