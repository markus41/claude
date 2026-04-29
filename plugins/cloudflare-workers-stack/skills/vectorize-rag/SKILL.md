---
name: Vectorize + RAG
description: Use when the user asks about Cloudflare Vectorize, vector embeddings, semantic search, RAG pipelines, or hybrid retrieval at the edge.
version: 0.1.0
---

# Vectorize: RAG at the Edge

Vectorize is Cloudflare's managed vector index — backed by their global edge network, sub-100ms reads from anywhere.

## Create an index

```bash
wrangler vectorize create lobbi-past-meetings \
  --dimensions 1024 \
  --metric cosine
```

Dimension must match your embedding model:

| Model | Dim |
|-------|-----|
| `@cf/baai/bge-small-en-v1.5` | 384 |
| `@cf/baai/bge-base-en-v1.5` | 768 |
| `@cf/baai/bge-large-en-v1.5` | 1024 |
| OpenAI `text-embedding-3-small` | 1536 |
| OpenAI `text-embedding-3-large` | 3072 |

Choose **cosine** for normalized embeddings (the common case), **euclidean** for distance-meaningful spaces.

## Bind it

```jsonc
"vectorize": [
  { "binding": "PAST_MEETINGS", "index_name": "lobbi-past-meetings" }
]
```

## Insert / upsert

```typescript
await env.PAST_MEETINGS.upsert([
  {
    id: 'meeting-42',
    values: emb1024,                            // number[] of correct dim
    metadata: {
      tenantId: 'acme',
      date: '2026-04-15',
      title: 'Q1 review'
    },
    namespace: 'acme'                           // logical partition
  }
]);
```

## Query

```typescript
const result = await env.PAST_MEETINGS.query(queryEmb, {
  topK: 5,
  returnMetadata: 'all',                        // or 'indexed' or 'none'
  returnValues: false,
  namespace: 'acme',
  filter: { tenantId: { $eq: 'acme' } }
});
// result.matches: { id, score, metadata?, values? }[]
```

`filter` supports `$eq`, `$ne`, `$in`, `$nin`, `$lt`, `$lte`, `$gt`, `$gte`.

## Metadata indexes (for fast filtering)

```bash
wrangler vectorize create-metadata-index lobbi-past-meetings \
  --property-name tenantId --type string
wrangler vectorize create-metadata-index lobbi-past-meetings \
  --property-name date --type string
```
Without indexes, filtered queries are slow on large indexes. Index every field you'll filter on.

## Full RAG pipeline pattern

```typescript
async function answer(query: string, tenantId: string, env: Env): Promise<string> {
  // 1. Embed the query (Workers AI)
  const { data } = await env.AI.run('@cf/baai/bge-large-en-v1.5', { text: query });
  const queryEmb = data[0];

  // 2. Retrieve top-K from Vectorize
  const { matches } = await env.PAST_MEETINGS.query(queryEmb, {
    topK: 5,
    returnMetadata: 'all',
    namespace: tenantId,
    filter: { tenantId: { $eq: tenantId } }
  });

  // 3. Pull source text from R2 (kept out of the vector index for cost)
  const contextChunks = await Promise.all(
    matches.map(async (m) => {
      const obj = await env.MEETINGS_BUCKET.get(`${m.id}.txt`);
      return await obj!.text();
    })
  );
  const context = contextChunks.join('\n\n---\n\n');

  // 4. Generate (LLM via AI Gateway)
  const completion = await env.AI.run('@cf/meta/llama-3.1-70b-instruct', {
    messages: [
      { role: 'system', content: `Answer using ONLY the context.\n\nContext:\n${context}` },
      { role: 'user', content: query }
    ]
  });
  return completion.response;
}
```

## Hybrid retrieval (vector + keyword)

Vectorize alone misses exact-keyword matches (entity names, error codes). Hybrid pattern:
```typescript
const [vecMatches, ftsMatches] = await Promise.all([
  env.PAST_MEETINGS.query(queryEmb, { topK: 10, namespace: tenantId }),
  env.DB.prepare('SELECT id, snippet FROM transcripts_fts WHERE transcripts_fts MATCH ? LIMIT 10')
    .bind(query).all()
]);

// Reciprocal rank fusion
const scores = new Map<string, number>();
[...vecMatches.matches].forEach((m, i) => scores.set(m.id, (scores.get(m.id) ?? 0) + 1 / (60 + i)));
[...ftsMatches.results].forEach((r, i) =>
  scores.set(r.id as string, (scores.get(r.id as string) ?? 0) + 1 / (60 + i))
);

const ranked = [...scores.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);
```

## Pitfalls

- **Wrong dimension**: returns `400 Bad Request` on insert. Re-create the index — dim is immutable.
- **Tens of thousands of matches per query without filter**: cap your `topK` (max 100). Filter by metadata for tenant isolation.
- **Putting full text in metadata**: metadata has a 10 KB cap per vector. Store text in R2, reference by id.
- **Embedding drift**: changing models = re-embed everything. Plan a migration if you switch.
- **Using cosine on un-normalized vectors**: scores are nonsense. The `@cf/baai/bge-*` models output normalized vectors; OpenAI does not — normalize before insert.
