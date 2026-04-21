#!/usr/bin/env bash
set -euo pipefail

# Triggered on Stop event — save checkpoint for any IN_PROGRESS projects
INPUT=$(cat)
PROJECTS_DIR="${CLAUDE_PROJECT_DIR:-$HOME}/.claude/projects"

[ -d "$PROJECTS_DIR" ] || exit 0

for meta_file in "$PROJECTS_DIR"/*/meta.json; do
  [ -f "$meta_file" ] || continue
  STATUS=$(node -e "try{const d=require('$meta_file');process.stdout.write(d.status||'')}catch(e){}" 2>/dev/null || true)
  if [ "$STATUS" = "IN_PROGRESS" ]; then
    PROJECT_DIR=$(dirname "$meta_file")
    CHECKPOINTS_DIR="$PROJECT_DIR/checkpoints"
    mkdir -p "$CHECKPOINTS_DIR"
    TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    CHECKPOINT_FILE="$CHECKPOINTS_DIR/${TIMESTAMP}.json"
    # Write minimal checkpoint: timestamp + project metadata snapshot
    node -e "
      const meta = require('$meta_file');
      const tasks = (() => { try { return require('$PROJECT_DIR/tasks.json'); } catch(e) { return []; } })();
      const statuses = tasks.map(t => ({id: t.id, status: t.status, blocked_reason: t.blocked_reason || null}));
      const cp = { timestamp: '$TIMESTAMP', meta_snapshot: meta, task_statuses: statuses, resume_from: 'Phase 1' };
      require('fs').writeFileSync('$CHECKPOINT_FILE', JSON.stringify(cp, null, 2));
    " 2>/dev/null || true
  fi
done

echo "{}"
