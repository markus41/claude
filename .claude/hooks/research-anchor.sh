#!/bin/bash
# research-anchor.sh — Saves research findings to persistent file
# Hook: SubagentStop
# Extracts key findings from research subagent output and appends
# to .claude/research-findings.md with timestamp. Rotates old
# entries to keep file under 200 lines.
set -euo pipefail

# Read hook input from stdin
INPUT=$(cat)

PROJECT_DIR="${CLAUDE_PROJECT_DIR:-.}"
FINDINGS_FILE="$PROJECT_DIR/.claude/research-findings.md"

# Ensure directory exists
mkdir -p "$(dirname "$FINDINGS_FILE")"

# Extract agent info from hook input using jq (handle missing fields gracefully)
AGENT_NAME=$(echo "$INPUT" | jq -r '.agent_name // .agentName // .name // "unknown"' 2>/dev/null || echo "unknown")
AGENT_TASK=$(echo "$INPUT" | jq -r '.task // .prompt // .description // ""' 2>/dev/null || echo "")
AGENT_OUTPUT=$(echo "$INPUT" | jq -r '.output // .result // .response // ""' 2>/dev/null || echo "")

# Detect if this is a research-related subagent
IS_RESEARCH=false
for keyword in research search find look analyze investigate fetch scrape perplexity firecrawl context7; do
  if echo "$AGENT_NAME $AGENT_TASK" | grep -qi "$keyword" 2>/dev/null; then
    IS_RESEARCH=true
    break
  fi
done

LABEL="Research"
if [ "$IS_RESEARCH" = false ]; then
  LABEL="Subagent"
fi

# Initialize file if it does not exist
if [ ! -f "$FINDINGS_FILE" ]; then
  {
    echo "# Research Findings (Auto-Captured)"
    echo ""
    echo "Captured by research-anchor.sh hook. Newest entries at top."
    echo ""
  } > "$FINDINGS_FILE"
fi

# Build the new entry
TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)
TMPENTRY=$(mktemp)

{
  echo "---"
  echo "### $LABEL: $AGENT_NAME ($TIMESTAMP)"
  if [ -n "$AGENT_TASK" ]; then
    # Truncate task to 200 chars
    TASK_TRUNCATED=$(echo "$AGENT_TASK" | head -c 200)
    echo "**Task:** $TASK_TRUNCATED"
  fi
  if [ -n "$AGENT_OUTPUT" ]; then
    # Extract first 500 chars of output as key findings
    OUTPUT_TRUNCATED=$(echo "$AGENT_OUTPUT" | head -c 500)
    echo "**Key Findings:**"
    echo '```'
    echo "$OUTPUT_TRUNCATED"
    echo '```'
  fi
  echo ""
} > "$TMPENTRY"

# Prepend new entry after the header (first 4 lines)
TMPFILE=$(mktemp)
{
  head -4 "$FINDINGS_FILE"
  cat "$TMPENTRY"
  tail -n +5 "$FINDINGS_FILE"
} > "$TMPFILE"
mv "$TMPFILE" "$FINDINGS_FILE"
rm -f "$TMPENTRY"

# Rotate: keep file under 200 lines
LINE_COUNT=$(wc -l < "$FINDINGS_FILE" 2>/dev/null || echo "0")
if [ "$LINE_COUNT" -gt 200 ]; then
  TMPFILE=$(mktemp)
  head -200 "$FINDINGS_FILE" > "$TMPFILE"
  echo "" >> "$TMPFILE"
  echo "<!-- Older entries rotated out at $TIMESTAMP -->" >> "$TMPFILE"
  mv "$TMPFILE" "$FINDINGS_FILE"
fi

echo "Research findings anchored to .claude/research-findings.md" >&2
