---
name: Cloudflare Workflows
description: Use when the user asks about Cloudflare Workflows, durable workflow engine, WorkflowEntrypoint, step.do retry, step.sleep, step.waitForEvent, long-running workflows, saga patterns, or replacing brittle queue chains with durable execution.
version: 0.1.0
---

# Cloudflare Workflows

Workflows is Cloudflare's durable execution engine — purpose-built for **multi-step tasks that must survive crashes, retry per-step, sleep for hours/days, and wait on external events**. It runs on top of Workers but is its own product.

## When to choose Workflows over alternatives

| Need | Pick |
|------|------|
| Single short request handler | Worker `fetch` |
| Stateful coordinator with sub-second latency | Durable Object |
| Multi-step: external API calls, retries, scheduled steps | **Workflows** |
| Massive fan-out with backpressure | Queues |
| Cron-driven repeating job | Cron-triggered Worker |
| Event-driven 1:1 transform | Worker (or Pipelines) |

Workflow superpowers DOs and Queues can't easily match:
- Per-step retry policy with exponential backoff
- `step.sleep('2 days')` survives Worker restarts
- `step.waitForEvent('webhook arrives', { timeout: '1 hour' })`
- Automatic state persistence between steps
- Built-in observability for the whole workflow tree

## Wrangler config

```jsonc
{
  "name": "synthesis-orchestrator",
  "main": "src/index.ts",
  "compatibility_date": "2026-04-15",
  "compatibility_flags": ["nodejs_compat"],
  "workflows": [
    {
      "name": "synthesis-workflow",
      "binding": "SYNTH_FLOW",
      "class_name": "SynthesisWorkflow"
    }
  ],
  "vectorize": [{ "binding": "VEC", "index_name": "lobbi-past-meetings" }],
  "ai": { "binding": "AI" },
  "r2_buckets": [{ "binding": "BUCKET", "bucket_name": "lobbi-deliverables" }]
}
```

## Workflow class

```typescript
// src/synthesis-workflow.ts
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

interface SynthesisParams {
  meetingId: string;
  tenantId: string;
  userId: string;
  transcriptR2Key: string;
}

export class SynthesisWorkflow extends WorkflowEntrypoint<Env, SynthesisParams> {
  async run(event: WorkflowEvent<SynthesisParams>, step: WorkflowStep) {
    const { meetingId, tenantId, transcriptR2Key } = event.payload;

    // Step 1 — fetch transcript (idempotent)
    const transcript = await step.do('load transcript', async () => {
      const obj = await this.env.BUCKET.get(transcriptR2Key);
      if (!obj) throw new Error('transcript missing');
      return await obj.text();
    });

    // Step 2 — embed in chunks (with retries)
    const embeddings = await step.do(
      'embed chunks',
      { retries: { limit: 5, delay: '5 seconds', backoff: 'exponential' }, timeout: '5 minutes' },
      async () => {
        const chunks = chunkBy(transcript, 1000);
        const results: Array<{ chunkId: string; emb: number[] }> = [];
        for (const [i, chunk] of chunks.entries()) {
          const { data } = await this.env.AI.run('@cf/baai/bge-large-en-v1.5', { text: [chunk] });
          results.push({ chunkId: `${meetingId}:${i}`, emb: data[0] });
        }
        return results;
      }
    );

    // Step 3 — upsert into Vectorize
    await step.do('upsert vectorize', async () => {
      await this.env.VEC.upsert(embeddings.map((e) => ({
        id: e.chunkId,
        values: e.emb,
        metadata: { meetingId, tenantId },
        namespace: tenantId,
      })));
    });

    // Step 4 — wait for human approval (or timeout in 24 hours, then continue with auto-publish)
    let approval: { approvedBy: string } | null = null;
    try {
      approval = await step.waitForEvent<{ approvedBy: string }>(
        'await human approval',
        { type: 'meeting-approved', timeout: '24 hours' }
      );
    } catch {
      // timeout — auto-publish
    }

    // Step 5 — synthesize document via Workers AI
    const synthesisText = await step.do(
      'synthesize',
      { retries: { limit: 3, delay: '10 seconds', backoff: 'exponential' }, timeout: '2 minutes' },
      async () => {
        const out = await this.env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
          messages: [
            { role: 'system', content: 'You synthesize meeting transcripts into 1-page briefs.' },
            { role: 'user', content: transcript },
          ],
        });
        return out.response as string;
      }
    );

    // Step 6 — write deliverable
    const deliverableKey = `${tenantId}/${meetingId}/synthesis.md`;
    await step.do('write deliverable', async () => {
      await this.env.BUCKET.put(deliverableKey, synthesisText, {
        httpMetadata: { contentType: 'text/markdown' },
        customMetadata: { approvedBy: approval?.approvedBy ?? 'auto', meetingId },
      });
    });

    // Step 7 — notify (cooldown after the heavy stuff)
    await step.sleep('cooldown', '30 seconds');
    await step.do('notify', async () => {
      await fetch(`${this.env.NOTIFY_URL}/notify`, {
        method: 'POST',
        body: JSON.stringify({ tenantId, meetingId, deliverableKey }),
      });
    });

    return { meetingId, deliverableKey, approvedBy: approval?.approvedBy };
  }
}
```

## Triggering a workflow

```typescript
// src/index.ts (Worker that exposes the workflow)
export default {
  async fetch(req: Request, env: Env): Promise<Response> {
    const params = await req.json<SynthesisParams>();
    const instance = await env.SYNTH_FLOW.create({ params });
    return Response.json({ id: instance.id, status: await instance.status() });
  }
};
```

You can also `create({ id: 'custom-id', params })` for idempotent creation. Sending the same id twice returns the existing instance.

## Sending an event to a waiting workflow

```typescript
// in some other Worker, when the user clicks "approve":
await env.SYNTH_FLOW.sendEvent({
  instanceId: 'wf_abc',
  event: { type: 'meeting-approved', payload: { approvedBy: userId } }
});
```

## Inspecting / managing instances

```typescript
const instance = await env.SYNTH_FLOW.get('wf_abc');
const status = await instance.status();   // 'queued' | 'running' | 'paused' | 'errored' | 'complete' | 'terminated'
await instance.pause();
await instance.resume();
await instance.terminate();
await instance.restart();                  // re-run from scratch
```

CLI:
```bash
wrangler workflows list
wrangler workflows describe synthesis-workflow
wrangler workflows instances list synthesis-workflow
wrangler workflows instances describe synthesis-workflow <instance-id>
wrangler workflows instances terminate synthesis-workflow <instance-id>
```

## Step semantics

- **Each `step.do()` is checkpointed**. If the Worker crashes mid-step, on restart the workflow resumes from the *last completed step*. The current step re-runs.
- **Return values from `step.do` are persisted** — must be JSON-serializable. No functions, classes with prototypes, circular refs.
- **Throwing inside `step.do`**: triggers retries per the step's `retries` config. After exhausting retries, the workflow itself errors out (you can `restart`).
- **`step.sleep('2 days')`**: workflow goes to `paused`, no Workers compute until wake. Cheap.
- **`step.waitForEvent`**: same as sleep; awakens when matching event arrives or timeout passes.

## Saga / compensation pattern

```typescript
async run(event, step) {
  let chargeId: string | null = null;
  let shipmentId: string | null = null;
  try {
    chargeId = await step.do('charge', () => stripe.charge(event.payload));
    shipmentId = await step.do('ship', () => fulfillment.create(event.payload));
    return { chargeId, shipmentId };
  } catch (e) {
    // Compensate already-done steps
    if (shipmentId) await step.do('cancel shipment', () => fulfillment.cancel(shipmentId!));
    if (chargeId) await step.do('refund charge', () => stripe.refund(chargeId!));
    throw e;
  }
}
```

Compensations themselves are checkpointed, so even a crash during cleanup completes correctly on restart.

## Comparing to Durable Objects

| Aspect | DO | Workflows |
|--------|----|-----------|
| State persistence | KV/SQLite per instance | Per-step automatic |
| Long sleep | `setAlarm` (effectively sleep) | `step.sleep` (idiomatic) |
| Per-step retry | Manual | Built-in |
| Crash resume | Re-init from storage | Automatic from last step |
| Wait for external event | Custom routing | `step.waitForEvent` |
| Best for | High-frequency stateful coordinator | Long, branching, fault-tolerant pipelines |

DOs and Workflows compose: a Workflow can call methods on a DO via service binding, and a DO can `create` a Workflow.

## Observability

The dashboard shows every step, its duration, retry attempts, and inputs/outputs. For high-volume workflows, log events to Logpush in addition (otherwise you pay for retention beyond the dashboard window).

## Pitfalls

- **Mutating state outside `step.do`**: not persisted, won't replay. All side effects belong in steps.
- **Reading time directly** (`Date.now()` inside `run`): non-deterministic on replay. Capture inside a step: `const t = await step.do('now', async () => Date.now())`.
- **Using `Math.random()` directly**: same problem — wrap in a step.
- **Heavy synchronous CPU work inside `run`** (between steps): counts against Worker CPU; you'll hit limits. Move into a step.
- **Persisting huge payloads as step return values**: blows the per-step state limit. Stash big data in R2 and persist only the key.
- **Forgetting that `step.waitForEvent` is named-typed**: `type` matched on the literal string. Mismatched and the event is ignored.
- **Triggering a workflow per request**: workflows are for multi-step long-running work. For high-frequency short work, prefer Queues + Workers.
