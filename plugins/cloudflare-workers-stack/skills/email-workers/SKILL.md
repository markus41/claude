---
name: Email Workers
description: Use when the user asks about Cloudflare Email Workers, email-triggered processing, email routing rules, sending email from a Worker via send_email binding, or building inbound mail handlers.
version: 0.1.0
---

# Email Workers

Cloudflare Email Workers turn inbound email into a Worker invocation. Use when:

- A product needs an inbox (`support@example.com`, `intake@example.com`)
- You want LLMs to triage incoming email
- Customer integrations send updates via email (the lowest-common-denominator API)
- You forward only after applying business logic (anti-spam, classification, signature verification)

## Receive: route inbound mail to a Worker

In the Cloudflare dashboard for your zone:
1. Email → Routing → Email Workers
2. Map an address pattern (e.g. `intake@example.com`) to your Worker

The Worker handles inbound via the `email` event:

```typescript
import PostalMime from 'postal-mime';

export interface Env {
  EMAIL_BUCKET: R2Bucket;
  AI: Ai;
  TICKETS_DB: D1Database;
  REPLY: SendEmail;        // optional: for replying via send_email binding
}

export default {
  async email(message: ForwardableEmailMessage, env: Env, ctx: ExecutionContext) {
    // Parse the raw RFC822 message
    const raw = await new Response(message.raw).arrayBuffer();
    const parsed = await PostalMime.parse(raw);

    const subject = parsed.subject ?? '';
    const text = parsed.text ?? '';
    const html = parsed.html ?? '';
    const from = parsed.from?.address ?? message.from;

    // 1. Optional: reject (bounce) at the gate
    if (await isSpam(parsed, env)) {
      return message.setReject('Spam detected');
    }

    // 2. Classify with Workers AI
    const cls = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [
        { role: 'system', content: 'Classify the email into: support, sales, billing, abuse, other. Reply with the single label.' },
        { role: 'user', content: `Subject: ${subject}\n\n${text}` },
      ],
    });
    const label = (cls.response as string).trim().toLowerCase();

    // 3. Persist
    const ticketId = crypto.randomUUID();
    await env.TICKETS_DB.prepare('INSERT INTO tickets (id, label, from_addr, subject, body) VALUES (?, ?, ?, ?, ?)')
      .bind(ticketId, label, from, subject, text).run();

    // 4. Stash raw message in R2 for legal hold / debugging
    await env.EMAIL_BUCKET.put(`raw/${ticketId}.eml`, raw, {
      customMetadata: { from, subject, label },
    });

    // 5. Optional: forward only support to a human inbox
    if (label === 'support') {
      await message.forward('humans@example.com');
    }

    // 6. Optional: auto-reply via send_email binding
    if (label === 'sales') {
      await env.REPLY.send(buildSalesAutoReply(from, subject));
    }
  }
};
```

## Forward / reject

```typescript
await message.forward('triage@example.com');                    // forward as-is
await message.forward('archive@example.com', new Headers({       // forward with custom headers
  'X-Triage-Label': 'auto',
}));

return message.setReject('Mail not accepted from this domain.'); // bounce with reason
```

You can both record AND forward — useful for shadow archival.

## Send: outbound email via `send_email` binding

```jsonc
"send_email": [
  { "name": "REPLY", "destination_address": "intake@example.com" }
]
```

```typescript
import { EmailMessage } from 'cloudflare:email';
import { createMimeMessage } from 'mimetext';

export async function sendReply(env: Env, to: string, subject: string, body: string) {
  const msg = createMimeMessage();
  msg.setSender({ name: 'Support', addr: 'support@example.com' });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: 'text/plain', data: body });

  const message = new EmailMessage('support@example.com', to, msg.asRaw());
  await env.REPLY.send(message);
}
```

The `destination_address` in wrangler restricts which addresses your Worker may send to. For broader sending (transactional email to arbitrary users), pair with a transactional provider (Resend, Postmark, SendGrid via fetch) instead.

## Combine with Workflows for long-form processing

For complex flows ("classify → human approve → reply"), pair Email Workers with **Cloudflare Workflows**. The email handler kicks off a workflow:

```typescript
async email(message, env, ctx) {
  const ticketId = crypto.randomUUID();
  // Persist immediately, then hand off
  await env.TICKETS_DB.prepare('...').run();
  await env.WF.create({ id: ticketId, params: { ticketId, from, subject, text } });
}
```

The workflow can `step.waitForEvent('human-approved', { timeout: '24 hours' })` then send a reply via `send_email` binding when ready.

## Authentication checks

Workers receive emails post-DKIM/SPF/DMARC checks performed by Cloudflare email infrastructure. Read the headers on the parsed message to enforce additional policy:

```typescript
const auth = parsed.headers.get('authentication-results') ?? '';
if (!auth.includes('dkim=pass')) {
  return message.setReject('DKIM verification failed');
}
```

## Rate limits

Default per-zone email volume is throttled. For high-volume inboxes, request increased limits or split inboxes by purpose. For outbound, lean on a provider — `send_email` binding is for the "reply lane" model, not bulk.

## Pitfalls

- **Parsing raw with `Response(message.raw).text()`**: may misinterpret encodings. Use `PostalMime` (or `mailparser` via `nodejs_compat`) for reliable RFC822 parsing.
- **Replying from a `noreply@` mailbox without proper SPF/DKIM**: ends up in spam. Configure DNS for the sending domain.
- **Forwarding a message that includes attachments**: Cloudflare passes them through, but be aware of size limits per provider downstream.
- **Holding the worker on synchronous external calls**: `email` handlers have CPU/wall-time budgets just like `fetch`. Long classification = use `ctx.waitUntil(...)` + a queue.
- **Storing every email in R2 forever**: configure lifecycle rules to age out by class (`raw/*` after 90 days, etc.).
- **Forgetting `nodejs_compat`**: most MIME parsers need `Buffer` polyfill.
