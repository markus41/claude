#!/usr/bin/env bash
set -euo pipefail

# Triggered on Write|Edit PostToolUse — check if the written file matches an artifact
# for an IN_PROGRESS task; if so, notify Claude to consider checking it off
INPUT=$(cat)

# Extract tool input file path from hook context
FILE_PATH=$(echo "$INPUT" | node -e "
  let d='';
  process.stdin.on('data',c=>d+=c);
  process.stdin.on('end',()=>{
    try{
      const p=JSON.parse(d);
      const fp=(p.tool_input||{}).file_path||(p.tool_input||{}).path||'';
      process.stdout.write(fp);
    }catch(e){process.stdout.write('');}
  });
" 2>/dev/null || true)

[ -z "$FILE_PATH" ] && echo "{}" && exit 0

# Check if path is under any project's artifacts directory
PROJECTS_DIR="${CLAUDE_PROJECT_DIR:-$HOME}/.claude/projects"
[ -d "$PROJECTS_DIR" ] || { echo "{}"; exit 0; }

for meta_file in "$PROJECTS_DIR"/*/meta.json; do
  [ -f "$meta_file" ] || continue
  PROJECT_DIR=$(dirname "$meta_file")
  if [[ "$FILE_PATH" == *"$PROJECT_DIR/artifacts"* ]]; then
    TASK_ID=$(echo "$FILE_PATH" | grep -oE 'T-[0-9]+' | head -1 || true)
    if [ -n "$TASK_ID" ]; then
      echo "{\"notification\": \"Artifact written for $TASK_ID — run validation or /pm:task complete $TASK_ID\"}"
      exit 0
    fi
  fi
done

echo "{}"
