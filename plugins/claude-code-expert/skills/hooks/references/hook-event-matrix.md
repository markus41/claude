# Hook Event Matrix

Complete input/output contract for each hook event. All inputs are JSON on stdin (max 64 KB); all outputs are single-line JSON on stdout.

## PreToolUse

**Fires**: before any tool call (after Claude decides to call, before the tool runs).
**Input**:
```json
{
  "tool_name": "Write|Edit|Bash|Read|...",
  "tool_input": { /* tool-specific */ }
}
```
**Output**:
```json
{ "decision": "approve" }
// or
{ "decision": "block", "reason": "human-readable reason shown to Claude" }
```
**Latency budget**: <100ms. Hook runs in the critical path.

## PostToolUse

**Fires**: after a tool completes successfully.
**Input**:
```json
{
  "tool_name": "...",
  "tool_input": { /* ... */ },
  "tool_output": "..."
}
```
**Output**: same as PreToolUse. `block` here annotates the result — it does not undo the tool call.
**Latency budget**: <500ms.

## PostToolUseFailure

**Fires**: after a tool fails (exception, non-zero exit, validation error).
**Input**:
```json
{
  "tool_name": "...",
  "tool_input": { /* ... */ },
  "error": "error message"
}
```
**Output**: usually `{"decision":"approve"}`. Useful for error capture / lessons-learned logging.

## Notification

**Fires**: when Claude needs user input (e.g. permission prompt, clarification).
**Input**: `{"message": "..."}`
**Output**: `{"decision":"approve"}`
**Use**: send to Slack/Discord/PagerDuty, play a sound, etc.

## Stop

**Fires**: when Claude finishes a response turn.
**Input**: `{"stop_reason": "end_turn|max_tokens|..."}`
**Output**: `{"decision":"approve"}`
**Use**: end-of-turn reminders, test gates, memory consolidation triggers.

## UserPromptSubmit

**Fires**: when user submits a prompt.
**Input**: `{"prompt": "..."}`
**Output**: `{"decision":"approve"}` — optionally modify the prompt by writing to stderr, which gets shown to Claude as additional context.
**Use**: inject dynamic context (branch, uncommitted count, date), enforce conventions on user input.

## SessionStart

**Fires**: once when a new session begins.
**Input**: `{}`
**Output**: `{"decision":"approve"}`
**Use**: load memory context, print session header, check for stale rules.

## Matcher patterns

In `.claude/settings.json`, each event array has entries with `matcher` (regex) + `hooks` array.

| Matcher | Fires on |
|---|---|
| `Write` | Write tool only |
| `Write\|Edit` | Write or Edit |
| `Bash` | Bash tool |
| `*` or missing | All tools |
| `(Write\|Edit\|MultiEdit)` | Any file-write tool |

## Tool input keys you'll commonly extract

- `tool_input.file_path` — Write, Edit, Read
- `tool_input.path` — some file tools
- `tool_input.command` — Bash
- `tool_input.pattern` — Grep, Glob
- `tool_input.query` — WebSearch

Use `jq -r '.tool_input.file_path // .tool_input.path // ""'` to cover variants safely.
