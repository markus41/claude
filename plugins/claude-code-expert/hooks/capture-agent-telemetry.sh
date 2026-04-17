#!/usr/bin/env bash
#
# capture-agent-telemetry.sh — SubagentStop hook that records per-spawn
# telemetry for the Agent-tool. Output lands at:
#
#   .claude/orchestration/telemetry/agents.jsonl
#
# One JSONL record per subagent completion. Query via the claude-code-expert
# MCP server's cc_telemetry_recent_agents tool or the cc://telemetry/agents
# resource.
#
# Hook contract: receive JSON on stdin with the SubagentStop event payload;
# emit JSON on stdout (decision=approve); exit 0 on success.
#
# Safety: never fail the subagent due to telemetry write errors — capture
# failures are logged to stderr but the hook always approves.

set -euo pipefail

INPUT=$(cat)

LOG_DIR=".claude/orchestration/telemetry"
LOG_FILE="${LOG_DIR}/agents.jsonl"

mkdir -p "${LOG_DIR}"

# All fields are optional — extract what the runtime provides. Missing fields
# become JSON null via jq's `// empty` semantics.
#
# Expected-but-not-guaranteed keys in the SubagentStop payload (names may
# evolve with runtime versions):
#   subagent_type, agent_id, status, reject_reason, duration_ms,
#   input_tokens, output_tokens, tool_uses, run_id

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%SZ)

RECORD=$(
  printf '%s' "$INPUT" | jq -c \
    --arg ts "$TIMESTAMP" \
    '{
      ts: $ts,
      run_id: (.run_id // .runId // null),
      agent_id: (.agent_id // .agentId // null),
      subagent_type: (.subagent_type // .subagentType // null),
      status: (.status // "ok"),
      reject_reason: (.reject_reason // .rejectReason // null),
      duration_ms: (.duration_ms // .durationMs // null),
      input_tokens: (.input_tokens // .usage.input_tokens // null),
      output_tokens: (.output_tokens // .usage.output_tokens // null),
      tool_uses: (.tool_uses // .usage.tool_uses // null)
    }' 2>/dev/null || true
)

if [ -n "${RECORD}" ] && [ "${RECORD}" != "null" ]; then
  printf '%s\n' "${RECORD}" >> "${LOG_FILE}" || {
    printf 'capture-agent-telemetry: failed to append to %s\n' "${LOG_FILE}" >&2
  }
fi

# Always approve — we never want telemetry capture to fail the actual work.
printf '{"decision":"approve"}\n'
