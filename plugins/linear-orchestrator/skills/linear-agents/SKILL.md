---
name: Linear Agents (AIG, Signals, Interaction)
description: This skill should be used when building or registering an agent that operates inside Linear — agent signals, agent interaction, OAuth actor mode, AIG (Agent Intelligence Gateway). Activates on "linear agent", "agent signal", "agent interaction", "linear aig", "agents in linear".
version: 1.0.0
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Linear Agents

References:
- Agents in Linear (user docs): https://linear.app/docs/agents-in-linear
- Agents (developer): https://linear.app/developers/agents
- Agent interaction: https://linear.app/developers/agent-interaction
- Agent signals: https://linear.app/developers/agent-signals
- AIG: https://linear.app/developers/aig

## Agent model

A Linear agent is an OAuth app with the `agents:create` and `agents:signal` scopes that:
- Can be **assigned** to issues (treated as a first-class assignee)
- **Posts** comments / status changes on behalf of users (via OAuth actor authorization)
- **Emits signals** — short status messages rendered inline on the issue ("running tests", "75% complete", "needs input")
- **Receives interaction events** — when a user @-mentions the agent or assigns it

## Registration

Settings → API → Agents → New agent. Or via API once granted `agents:create`. Capture:
- `agentId`
- `agent_oauth_token` (long-lived)
- Webhook URL for interaction events

## Agent interaction

When a user assigns the agent to an issue:
- Linear sends a webhook event of type `Agent` with action `interaction`
- Body includes `issue.id`, `actor` (user who triggered), `kind` (assigned, mentioned, replied)
- Agent should respond by:
  1. Acknowledging via `agentSignalCreate({ kind: "progress", message: "Working on it…" })`
  2. Doing the work
  3. Reporting completion via `agentSignalCreate({ kind: "completion", message: "Done — see comment" })`
  4. Posting a comment with the result

## Agent signals

Signals are lightweight status pings that render in the Linear UI as a small badge:
- `progress` — "Running tests..." (yellow)
- `completion` — "Tests passed" (green)
- `request_input` — "Need approval" (blue, with button)
- `error` — "Failed: ..." (red)

```ts
await client.agentSignalCreate({
  agentId,
  issueId,
  kind: "progress",
  message: "Compiling…",
  metadata: { jobId: "..." }
});
```

Signals are NOT comments — they're ephemeral. Use them for in-progress updates; use comments for permanent results.

## AIG (Agent Intelligence Gateway)

The AIG (https://linear.app/developers/aig) is Linear's gateway for agent-to-agent communication. Use cases:
- Pass context between agents (e.g. linear-issue-curator hands off to harness-linear-bridge)
- Negotiate which agent should handle a multi-agent task
- Aggregate signals from multiple sub-agents

The plugin's `lib/aig.ts` provides:
```ts
export async function aigPublish(channel: string, msg: AIGMessage): Promise<void>;
export function aigSubscribe(channel: string, handler: (msg: AIGMessage) => void): () => void;
```

## Actor authorization in agents

When an agent posts on behalf of a user:
1. Mint an actor token via your backend (signs a JWT with `userId`, 5-min expiry)
2. Include in `Linear-Actor-Token` header
3. The action shows up in Linear's UI as performed by the user, with a small "via Agent: <name>" badge

```ts
const headers = { "Linear-Actor-Token": actorToken };
await fetch("https://api.linear.app/graphql", {
  method: "POST",
  headers: { ...headers, Authorization: `Bearer ${agentToken}` },
  body: JSON.stringify({ query, variables })
});
```

## Best practices

- **Idempotency**: agents may receive the same interaction event twice (e.g. on retry). Dedupe by event ID.
- **Timeouts**: emit a `progress` signal at least every 30s if the work is long-running, otherwise Linear shows "Agent unresponsive".
- **Failure surfaces**: on error, emit `agentSignalCreate({ kind: "error" })` AND post a comment with the failure details. Don't silently fail.
- **Scope minimisation**: don't request `admin` scope unless you genuinely manage workflows.
