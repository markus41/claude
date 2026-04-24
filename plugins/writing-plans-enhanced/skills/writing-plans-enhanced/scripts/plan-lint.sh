#!/usr/bin/env bash
# plan-lint.sh — validate a plan document against writing-plans skill rules.
#
# Usage:  plan-lint.sh <plan-file.md>
# Exit:   0 = clean, 1 = issues found, 2 = usage error
#
# Checks:
#   - Placeholders (TBD, TODO, FIXME, "fill in", "implement later",
#     "add appropriate", "handle edge cases")
#   - Missing **Context:** block in plan header
#   - Per-task metadata (Type / Depends on / Parallel-safe / Risk)
#   - Forward dependency: `Depends on: Task M` where M >= current task N
#   - Vague commit messages (wip, update, misc, "fix stuff", <10 chars)
#
# Portable bash + POSIX awk. No external deps beyond grep/awk/mktemp.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "Usage: $0 <plan-file.md>" >&2
  exit 2
fi

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "Not found: $FILE" >&2
  exit 2
fi

findings="$(mktemp)"
trap 'rm -f "$findings"' EXIT

# --- Check 1: Placeholders ----------------------------------------
# grep -n gives "line:content"; we emit "FILE:line: placeholder: <snippet>"
grep -niE '\b(TBD|TODO|FIXME|implement later|add appropriate|handle edge cases)\b|fill in' "$FILE" 2>/dev/null \
  | awk -v f="$FILE" -F: '{
      ln=$1
      $1=""
      sub(/^:/,"",$0)
      sub(/^ */,"",$0)
      print f":"ln": placeholder: "$0
    }' >> "$findings" || true

# --- Check 2: Context block ---------------------------------------
if ! grep -qE '^\*\*Context:\*\*' "$FILE"; then
  echo "$FILE:0: missing **Context:** block in plan header" >> "$findings"
fi

# --- Check 3: Per-task metadata, forward deps, vague commits ------
awk -v f="$FILE" '
function flag(line, msg) {
  print f":"line": "msg
}

function check_task_close(   _) {
  if (!in_task) return
  if (!has_type)     flag(task_line, "task missing **Type:** metadata")
  if (!has_deps)     flag(task_line, "task missing **Depends on:** metadata")
  if (!has_parallel) flag(task_line, "task missing **Parallel-safe:** metadata")
  if (!has_risk)     flag(task_line, "task missing **Risk:** metadata")
}

/^### Task [0-9]+:/ {
  check_task_close()
  tmp=$0
  sub(/^### Task /, "", tmp)
  sub(/:.*/, "", tmp)
  task_num = tmp + 0
  task_line = NR
  in_task = 1
  has_type = 0; has_deps = 0; has_parallel = 0; has_risk = 0
  next
}

/^\*\*Type:\*\*/          { if (in_task) has_type = 1 }
/^\*\*Parallel-safe:\*\*/ { if (in_task) has_parallel = 1 }
/^\*\*Risk:\*\*/          { if (in_task) has_risk = 1 }

/^\*\*Depends on:\*\*/ {
  if (in_task) {
    has_deps = 1
    tmp = $0
    # Extract number after the first "Task " (if present)
    if (sub(/.*Task /, "", tmp) && tmp ~ /^[0-9]+/) {
      sub(/[^0-9].*/, "", tmp)
      dep = tmp + 0
      if (dep >= task_num) {
        flag(NR, "forward dep: Task "task_num" depends on Task "dep)
      }
    }
  }
}

/git commit -m/ {
  tmp = $0
  # Extract content between the first pair of double quotes
  if (sub(/^[^"]*"/, "", tmp)) {
    sub(/".*/, "", tmp)
    msg = tmp
    lower = tolower(msg)
    if (lower == "wip" || lower == "update" || lower == "misc" ||
        lower == "fixes" || lower == "updates" || lower == "changes" ||
        lower == "fix stuff" || length(msg) < 10) {
      flag(NR, "vague commit message: \""msg"\"")
    }
  }
}

END { check_task_close() }
' "$FILE" >> "$findings"

# --- Report -------------------------------------------------------
if [[ -s "$findings" ]]; then
  cat "$findings"
  exit 1
fi

exit 0
