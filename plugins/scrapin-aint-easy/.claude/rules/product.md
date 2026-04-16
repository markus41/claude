# Product & UX Principles

## Core Product Values

1. **Accuracy over speed** — wrong documentation is worse than slow documentation
2. **Transparency** — always show where information came from (source, timestamp, cache status)
3. **Non-intrusive monitoring** — drift detection runs in background, only alerts on significant changes
4. **Interview before assumptions** — never generate project configuration without thorough user interview

## MCP Tool Responses

- Every response includes metadata: source, timestamp, cache-hit status
- Results are ranked by relevance score
- Truncated responses include `continue_token` for pagination
- Error messages are actionable — tell the user what to do, not just what went wrong

## Drift Detection UX

- Low-severity drift (0-2): informational, no interruption
- Medium-severity drift (3-5): report in status checks, suggest review
- High-severity drift (6-7): proactive alert, recommend action
- Critical drift (8-10): HALT and require user resolution before continuing

## Interview UX

- One question at a time — never overwhelm with multiple questions
- Adapt follow-ups based on each answer — show you listened
- Periodically summarize understanding — build confidence
- End with synthesis — let user correct before generating
- NEVER generate dates or timelines unprompted
