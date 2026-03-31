# Performance

## Context Window Budget

The AI runtime operates within a token budget:

| Component | Estimated Tokens | Notes |
|-----------|-----------------|-------|
| System prompt + rules | ~10k | Loaded every session |
| Plugin manifests (19) | ~15k | Indexed at startup |
| Active skill context | ~5-20k | Per invocation |
| Conversation history | ~50-150k | Grows during session |
| **Total budget** | **~200k** | Model-dependent |

Use `/compact` to reduce conversation context when approaching limits.

## MCP Server Token Cost

| Server | Avg response tokens | Notes |
|--------|-------------------|-------|
| lessons-learned | ~500-2k | Depends on search results |
| code-quality-gate | ~1-5k | Full lint output can be large |
| project-metrics | ~1-3k | |
<!-- Fill in: Measure actual token costs per tool -->

## Plugin Lazy Loading

- Plugin indexes are generated at build time, not loaded eagerly at runtime
- Only the active plugin's commands/agents/skills are loaded into context
- Use `profile:plugin-context` to measure per-plugin context size

## Frontend Performance

<!-- Fill in: Bundle size, lighthouse scores, key metrics -->

| Metric | Current | Target |
|--------|---------|--------|
| Bundle size (gzipped) | <!-- Fill in --> | < 500KB |
| First contentful paint | <!-- Fill in --> | < 1.5s |
| Canvas render (100 nodes) | <!-- Fill in --> | < 16ms/frame |

## Optimization Strategies

- Code-split large plugin UIs with React.lazy
- Use `React.memo` for ReactFlow custom nodes
- Debounce property panel updates (300ms)
<!-- Fill in: Additional strategies -->
