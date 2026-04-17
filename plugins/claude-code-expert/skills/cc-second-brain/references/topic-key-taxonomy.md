# CC topic_key taxonomy

Stable prefix scheme for engram observations made during CC-setup work. Consolidator groups by exact `topic_key` and counts reinforcements by prefix.

## Prefix table

| Domain | Prefix | Example |
|---|---|---|
| Plugin config | `cc/plugin/{name}/{aspect}` | `cc/plugin/claude-code-expert/skill-consolidation` |
| Plugin migration | `cc/plugin/{name}/migration/{version}` | `cc/plugin/claude-code-expert/migration/v7-to-v8` |
| Hook pack | `cc/hooks/{pack}` | `cc/hooks/protect-sensitive-files` |
| Hook event | `cc/hooks/events/{event}` | `cc/hooks/events/PreToolUse` |
| Autonomy profile | `cc/autonomy/{profile}` | `cc/autonomy/balanced` |
| Autonomy gate | `cc/autonomy/gates/{agent}` | `cc/autonomy/gates/verifier` |
| Agent topology | `cc/topology/{kit}` | `cc/topology/architect-implementer-reviewer` |
| Agent role | `cc/agent/{role}` | `cc/agent/implementer` |
| MCP server | `cc/mcp/{server}/{aspect}` | `cc/mcp/context7/setup` |
| Channel pattern | `cc/channels/{pattern}` | `cc/channels/ci-webhook` |
| Workflow pack | `cc/workflow/{name}` | `cc/workflow/tdd-implementation` |
| Repo fingerprint | `cc/repo/{slug}/{aspect}` | `cc/repo/taia-a4/stack-detected` |
| Repo convention | `cc/repo/{slug}/convention/{name}` | `cc/repo/taia-a4/convention/test-dir` |
| LSP server | `cc/lsp/{language}` | `cc/lsp/typescript` |
| Cost decision | `cc/cost/{model-or-route}` | `cc/cost/opus-for-review` |
| Session lesson | `cc/lesson/{short-slug}` | `cc/lesson/hook-file-path-validation` |

## Rules

1. Lowercase, kebab-case segments. No spaces.
2. Max 4 segments (separated by `/`). Deeper nesting hurts grouping.
3. Repo slugs use `org-repo` form (e.g. `taia-a4`, not `taia/a4`).
4. Don't invent new top-level prefixes (`cc/*`) without adding them to this table.

## Anti-patterns

- `cc/notes/random-thought-1` — too loose, never consolidates.
- `cc/plugin/a/b/c/d/e/f` — too deep, consolidator can't group meaningfully.
- `CC/Plugin/...` — case-sensitive mismatch; consolidator treats as different prefix.

## When unsure

Call `mem_suggest_topic_key` first with a description of the observation; engram will suggest a stable key. Reuse that key for all follow-up saves on the same topic (engram upserts by topic_key + project + scope).
