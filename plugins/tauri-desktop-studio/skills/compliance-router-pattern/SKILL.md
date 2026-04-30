---
name: ComplianceRouter Pattern
description: Use when the user asks how to gate Anthropic / Deepgram / OpenAI SDK calls behind a single audit point, route by tenant compliance tier, or enforce SDK usage via custom ESLint rules (eslint-plugin-import, eslint-plugin-local).
version: 0.1.0
---

# ComplianceRouter: Single-Point Gating for LLM/STT SDK Calls

In regulated workloads (legal, healthcare, finance, defense), every external AI call needs:
- Tenant-scoped routing (e.g. EU tenants → EU region only)
- Audit logging (request hash, model, byte counts, redactions)
- Pre-flight redaction (PII scrubbing before send)
- Post-flight policy (block disallowed responses)
- Provider fallback (Deepgram → Whisper, Anthropic → AI Gateway secondary)

The pattern: **one module is the only allowed caller** of every external SDK. Every other module imports a thin wrapper. Static analysis (custom ESLint plugin) blocks direct SDK imports anywhere except the router.

## Module layout

```
src/
├── compliance/
│   ├── router.ts              # The ONLY file that imports @anthropic-ai/sdk, @deepgram/sdk, etc.
│   ├── audit.ts               # Append-only audit log (file or remote sink)
│   ├── redact.ts              # PII regexes, allow/deny lists
│   ├── policy.ts              # Per-tenant policy lookup
│   └── types.ts
├── lib/
│   └── ai/
│       ├── chat.ts            # exports chat() — calls into compliance/router
│       └── transcribe.ts      # exports transcribe() — calls into compliance/router
└── eslint-rules/
    └── no-direct-sdk-import.js   # custom rule
```

## The router

```typescript
// src/compliance/router.ts
import Anthropic from '@anthropic-ai/sdk';
import { DeepgramClient } from '@deepgram/sdk';
import { audit } from './audit';
import { redact } from './redact';
import { policyFor } from './policy';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
const deepgram = new DeepgramClient({ apiKey: process.env.DEEPGRAM_API_KEY! });

export type ChatRequest = {
  tenantId: string;
  userId: string;
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  model?: string;
};

export async function chat(req: ChatRequest): Promise<string> {
  const policy = await policyFor(req.tenantId);
  if (!policy.allowedProviders.includes('anthropic')) {
    throw new Error(`tenant ${req.tenantId} blocked from anthropic`);
  }

  // Pre-flight redaction
  const redactedMessages = req.messages.map((m) => ({
    ...m,
    content: redact(m.content, policy.redactionRules),
  }));

  // Audit BEFORE the call — guarantees we record attempts even on failure
  const auditId = await audit({
    kind: 'chat.request',
    tenantId: req.tenantId,
    userId: req.userId,
    provider: 'anthropic',
    model: req.model ?? policy.defaultChatModel,
    bytesIn: JSON.stringify(redactedMessages).length,
  });

  let response: Anthropic.Messages.Message;
  try {
    response = await anthropic.messages.create({
      model: req.model ?? policy.defaultChatModel,
      max_tokens: 1024,
      messages: redactedMessages,
    });
  } catch (e) {
    await audit({ kind: 'chat.error', auditId, error: String(e) });
    throw e;
  }

  const text = response.content
    .filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');

  // Post-flight policy
  if (policy.responseFilter && !policy.responseFilter(text)) {
    await audit({ kind: 'chat.blocked', auditId });
    throw new Error('response blocked by tenant policy');
  }

  await audit({ kind: 'chat.response', auditId, bytesOut: text.length, stopReason: response.stop_reason });
  return text;
}

export async function transcribeLive(opts: { tenantId: string; userId: string }) {
  const policy = await policyFor(opts.tenantId);
  if (!policy.allowedProviders.includes('deepgram')) {
    throw new Error(`tenant ${opts.tenantId} blocked from deepgram`);
  }
  const auditId = await audit({ kind: 'stt.session', tenantId: opts.tenantId, userId: opts.userId });
  const conn = await deepgram.listen.v1.connect(policy.deepgramParams);

  conn.on('message', async (data) => {
    if (data.type === 'Results' && data.is_final) {
      await audit({ kind: 'stt.utterance', auditId, length: data.channel?.alternatives?.[0]?.transcript.length ?? 0 });
    }
  });

  return conn;
}
```

## Consumer modules

```typescript
// src/lib/ai/chat.ts
import { chat as routerChat, type ChatRequest } from '../../compliance/router';

export async function ask(req: ChatRequest): Promise<string> {
  return routerChat(req);
}
```

Anywhere in the app, you import `ask` from `lib/ai/chat`. Importing `@anthropic-ai/sdk` directly is a build error.

## Custom ESLint rule (`eslint-plugin-local`)

Create a local plugin in your repo so you can ship internal rules without publishing.

```json
// package.json
{
  "devDependencies": {
    "eslint-plugin-import": "^2",
    "eslint-plugin-local": "^1"
  }
}
```

```javascript
// eslint-rules/no-direct-sdk-import.js
/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: { description: 'Direct external AI SDK imports are forbidden outside compliance/router.ts' },
    schema: [{
      type: 'object',
      properties: {
        bannedPackages: { type: 'array', items: { type: 'string' } },
        allowedFile: { type: 'string' },
      },
      additionalProperties: false,
    }],
  },
  create(context) {
    const opts = context.options[0] ?? {};
    const banned = new Set(opts.bannedPackages ?? []);
    const allowed = opts.allowedFile ?? 'src/compliance/router.ts';
    return {
      ImportDeclaration(node) {
        const filename = context.filename ?? context.getFilename();
        if (filename.endsWith(allowed)) return;
        if (banned.has(node.source.value)) {
          context.report({
            node,
            message: `Import of '${node.source.value}' is forbidden here. Use src/lib/ai/* instead.`,
          });
        }
      },
    };
  },
};
```

```javascript
// eslint.config.js  (ESLint 9 flat config)
import local from 'eslint-plugin-local';
import noDirectSdk from './eslint-rules/no-direct-sdk-import.js';

export default [
  {
    plugins: {
      local: { rules: { 'no-direct-sdk-import': noDirectSdk } },
    },
    rules: {
      'local/no-direct-sdk-import': ['error', {
        bannedPackages: [
          '@anthropic-ai/sdk',
          '@deepgram/sdk',
          'openai',
          '@google/generative-ai',
        ],
        allowedFile: 'src/compliance/router.ts',
      }],
    },
  },
];
```

`pnpm lint` now fails if anyone tries to import an SDK directly.

## Audit sink choices

| Sink | When |
|------|------|
| Local file (`$APPLOG/audit.ndjson`) | Desktop offline-first |
| Cloudflare Workers Logpush → R2 | Centralized, cheap, queryable |
| Cloudflare D1 + scheduled compaction | Queryable from app |
| External SIEM (Datadog, Splunk) | Enterprise compliance |

Append-only NDJSON is the right primitive — easy to ship, easy to compact later.

## Per-tenant policy shape

```typescript
type TenantPolicy = {
  allowedProviders: Array<'anthropic' | 'deepgram' | 'openai' | 'workers-ai'>;
  defaultChatModel: string;
  region: 'us' | 'eu' | 'apac';
  redactionRules: RedactionRule[];
  responseFilter?: (text: string) => boolean;
  deepgramParams: { model: string; language: string; /* ... */ };
};
```

Policies live in D1 or KV; cache locally with TTL.

## Pitfalls

- **Bypass via `require`**: lint rule above catches `ImportDeclaration` only. Add a corresponding `CallExpression` matcher for `require()` if you allow CommonJS.
- **Audit failures swallowing user requests**: audit calls should never throw user-visible. Wrap audit sink in `try/catch` that logs locally on failure.
- **Routing logic in the consumer**: keep all decisions inside the router. Consumers pass `tenantId`; that's it.
- **Caching policy too long**: policy changes need to take effect quickly; TTL ≤ 60s is typical.
- **Streaming responses**: for SSE chat, audit the *start* event up front, then audit chunks/final at the end. Don't await the full stream before the user sees the first token.
