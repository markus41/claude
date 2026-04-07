# Infrastructure Rules

## Build & Packaging

- Build with `tsup` — ESM output only, targeting Node.js 20
- External dependencies: `kuzu`, `puppeteer`, `hnswlib-node` (native modules)
- Bundle splitting enabled for tree-shaking

## Data Directory

- `data/` directory is runtime state — never commit to git
- Subdirectories created on demand: `graph.db/`, `embeddings/`, `snapshots/`, `drift-reports/`, `logs/`
- Snapshot files are gzip-compressed when > 100KB

## MCP Server

- Transport: stdio only (no network exposure)
- Process lifecycle: start with Claude Code, stop when session ends
- Logs to `data/logs/` — structured JSON via pino

## Cron Scheduler

- Global semaphore: max 3 concurrent jobs
- Job state persisted in `data/logs/cron-log.jsonl`
- On restart: reconstruct last-run times from log, detect missed jobs
- Cron drift threshold: 2x expected interval

## Graph Database

- Default: Kùzu embedded (zero config, data in `data/graph.db/`)
- Optional: Neo4j via `NEO4J_URI` environment variable
- Schema migrations are additive and idempotent — safe to run multiple times
