# Memory Query Cache

This directory stores SQLite databases for Memory MCP query caching.

## Files

- `memory-query.db` - SQLite cache for search_nodes and read_graph queries
  - TTL: 5 minutes for search queries, 1 minute for graph reads
  - Reduces query latency by up to 85%
  - Automatically cleaned on write operations

## Maintenance

Cache is automatically managed by `MemoryQueryOptimizer`:
- Expired entries cleaned periodically
- Full invalidation on write operations
- Statistics tracked for monitoring

## Configuration

See `config/mcps/memory.json` for cache settings:
- `cacheTtlMs` - Cache time-to-live in milliseconds
- `maxResultsPerQuery` - Result pagination limit
- `enabled` - Toggle caching on/off
