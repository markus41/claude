#!/usr/bin/env bash
set -euo pipefail

# Triggered on PostToolUseFailure — flag the failing tool for risk tracking
INPUT=$(cat)

TOOL_NAME=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try{
      const p=JSON.parse(d);
      process.stdout.write(p.tool_name||'unknown');
    }catch(e){process.stdout.write('unknown');}
  });
" 2>/dev/null || echo "unknown")

ERROR=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try{
      const p=JSON.parse(d);
      const e=(p.error||'').substring(0,120);
      process.stdout.write(e);
    }catch(e){process.stdout.write('');}
  });
" 2>/dev/null || echo "")

# Log to risk journal
RISK_LOG="${CLAUDE_PROJECT_DIR:-$HOME}/.claude/projects/.risk-journal.jsonl"
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"timestamp\":\"$TIMESTAMP\",\"tool\":\"$TOOL_NAME\",\"error\":\"$(echo $ERROR | sed 's/"/\\"/g')\"}" >> "$RISK_LOG" 2>/dev/null || true

echo "{}"
