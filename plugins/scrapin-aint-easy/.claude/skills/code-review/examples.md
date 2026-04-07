# Code Review Examples

## Example: Good Review

```
### BLOCK
1. `src/api/handler.ts:45` — SQL injection risk. User input concatenated directly into query string.
   Fix: Use parameterized query via Prisma `$queryRaw`.

### REQUEST
1. `src/utils/format.ts:12` — Function `fmt` is 73 lines. Extract the date formatting logic into a helper.
2. `tests/api.test.ts` — No test for the 404 case when resource not found.

### SUGGEST
1. `src/components/List.tsx:8` — Consider `useMemo` for the filtered list since `items` changes infrequently.

### PRAISE
1. Great error boundary implementation in `ErrorFallback.tsx` — clean separation of concern.
```

## Example: Using Knowledge Graph in Review

```
### Documentation Check
- `@tanstack/react-query` `useQuery` — ✅ Documented in graph (last crawled 2d ago)
- `stripe` `PaymentIntent.create` — ⚠️ Documentation updated since last code scan (stale)
- `@effect/platform` `HttpClient` — ❌ Not in graph. Recommend: /scrapin-crawl effect-ts
```
