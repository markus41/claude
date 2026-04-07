# Codex Upgrade Plan (15 items) — Implemented

These 15 upgrades are now implemented in the plugin codebase.

## P0 — Highest impact

1. ✅ **Source-aware retry policies**
   - Add per-source backoff profiles (5xx vs 429 vs timeout) to reduce noisy failures.
2. ✅ **Incremental symbol refresh**
   - Crawl only changed pages first, then selectively refresh dependent symbols.
3. ✅ **OpenAPI-first extraction mode**
   - Prefer machine-readable OpenAPI when available before HTML parsing.
4. ✅ **Signed crawl snapshots**
   - Hash + sign snapshots so drift reports can prove content integrity.
5. ✅ **Failure triage MCP tool**
   - Add `scrapin_crawl_failures` to list top failing hosts, codes, and retry advice.
6. ✅ **Codex bootstrap command**
   - Add a one-shot setup command to register MCP + generate starter `AGENTS.md` snippet.

## P1 — Reliability and UX

7. ✅ **Structured source health scores**
   - Emit health grades (A–F) from uptime, freshness, and extraction success.
8. ✅ **Token-budgeted summaries**
   - Add optional max-token summarization for long docs before embedding.
9. ✅ **Language-aware symbol extraction**
   - Tune extraction with language-specific rules for TS, Python, and Java.
10. ✅ **Cross-source deduplication**
   - Merge duplicate symbols across mirrored docs (e.g., SDK + API reference).
11. ✅ **Drift suppression windows**
   - Allow temporary snoozes for expected churn during migrations.
12. ✅ **Alert webhooks**
   - Push critical drift or crawl outages to Slack/Teams/webhook endpoints.

## P2 — Advanced capabilities

13. ✅ **Graph lineage tracking**
   - Record which crawl run produced each node/edge for auditability.
14. ✅ **Hybrid retrieval ranking**
   - Blend vector similarity with graph-centrality and freshness.
15. ✅ **Codex-native workflows**
   - Ship ready-made Codex prompts for onboarding, stale-doc cleanup, and deprecation sweeps.

## Success metrics

- 40% reduction in failed crawl jobs over 30 days.
- 30% faster median `scrapin_search` response time.
- 25% fewer false-positive drift alerts.
- <15 minutes from clone to first successful Codex MCP query.
