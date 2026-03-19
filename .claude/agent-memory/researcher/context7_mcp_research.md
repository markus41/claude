---
name: Context7 MCP Capabilities & Integration Research
description: Complete research on Context7 MCP server capabilities for Claude Code, supported libraries, documentation quality, and integration patterns
type: reference
date: 2026-03-19
---

# Context7 MCP: Complete Research Summary

## Overview

Context7 is a Model Context Protocol (MCP) server that delivers **up-to-date, version-specific documentation** directly into AI coding assistants and LLM prompts. It solves the fundamental problem of LLMs having stale training data that leads to hallucinated APIs and deprecated code patterns.

**Current Status:** Production-ready, actively used in Claude Code ecosystem
**Package:** `@upstash/context7-mcp`
**Installation:** `claude mcp add context7 -- npx -y @upstash/context7-mcp@latest`

---

## What Context7 Does

### Core Capability
Context7 automatically fetches and injects current, version-specific documentation from official sources into your prompt context **before** the AI generates responses. This ensures code suggestions are based on actual current APIs rather than training-data assumptions.

### The Problem It Solves
- LLMs trained on data cutoff generate hallucinated API patterns that don't exist
- Library APIs change frequently; training data becomes stale within months
- Developers waste time debugging "magical" code that looks correct but isn't
- Version mismatches between suggested patterns and installed packages

### The Solution
```
[User's question] + [Current docs from Context7] → Claude → [Accurate code]
```

---

## Supported Libraries

### Scale
- **9,000+** public libraries and frameworks indexed
- Major categories: JavaScript/TypeScript, Python, Go, Java, Rust, and more
- Examples: React, Next.js, TypeScript, MongoDB, PostgreSQL, FastAPI, Django, Vue, Angular, Svelte

### Library Resolution
Context7 has a two-step lookup:
1. **resolve-library-id** tool: Maps library name (e.g., "react") to library ID (e.g., "/facebook/react")
2. **query-docs** tool: Retrieves documentation for the resolved library ID

### Adding New Libraries
- Site: https://context7.com/add-library
- Users can submit libraries not yet indexed
- Platform prioritizes libraries with high usage, active maintenance, and good documentation

---

## How Context7 Works

### Architecture

```
┌─────────────────┐
│  Your Prompt    │
│  (question)     │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│      Context7 MCP Server                 │
│  (npx -y @upstash/context7-mcp)         │
├──────────────────────────────────────────┤
│  Tool 1: resolve-library-id              │
│  (Match "react" → "/facebook/react")     │
├──────────────────────────────────────────┤
│  Tool 2: query-docs                      │
│  (Fetch docs for "/facebook/react")      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│  Context7 Backend                        │
│  • Parsing & Crawling Engines            │
│  • Live Documentation Sources            │
│  • Version-Specific Indexing             │
└────────┬─────────────────────────────────┘
         │
         ▼
┌────────────────────────────────────────────┐
│  [Current API docs] → Injected into        │
│  Claude's prompt → [Accurate code]         │
└────────────────────────────────────────────┘
```

### Three Layers
1. **Public MCP Server** — Open-source tool implementations
2. **Private Backend** — API operations, request routing, caching
3. **Parsing/Crawling** — Extract and index library docs (proprietary)

### Documentation Freshness
- Docs are pulled from **official sources** in near-real-time
- Version-specific documentation is maintained
- No stale training data — always current to latest released version

---

## Context7 MCP Tools

### Tool 1: resolve-library-id
**Purpose:** Map library name to Context7-compatible ID

```typescript
Input:
  libraryName: string  // e.g., "react", "next.js", "lodash"
  query: string        // e.g., "How do I use hooks?"

Output:
  libraryId: string    // e.g., "/facebook/react"
```

**When to use:** First step before querying docs, unless you have the library ID

### Tool 2: query-docs
**Purpose:** Retrieve documentation for a specific library

```typescript
Input:
  libraryId: string    // e.g., "/facebook/react"
  query: string        // e.g., "useState hook usage"

Output:
  docs: string         // Structured documentation + examples
  metadata: {...}      // Version, last updated, source
```

**When to use:** After resolving library ID to get specific documentation

---

## Documentation Returned by Context7

### Content Types
- **API Reference** — Function/method signatures, parameters, return types
- **Code Examples** — Real-world usage patterns from official docs
- **Best Practices** — Recommended patterns and anti-patterns
- **Migration Guides** — Breaking changes between versions
- **Setup/Configuration** — Installation and initial setup
- **Troubleshooting** — Common issues and solutions
- **Performance Tips** — Optimization guidance

### Format
Structured markdown with:
- Syntax-highlighted code blocks
- Clear parameter documentation
- Real working examples
- Links to official sources
- Version compatibility notes

### Accuracy
- Source: Official documentation (not AI-generated)
- Version: Matches current/specified version
- Currency: Updated with each library release
- Validation: Context7 tests against live documentation sources

---

## Performance & Caching (Jira Orchestrator Implementation)

### SQLite-Based Caching
```
Query Type          Before  After    Improvement
─────────────────────────────────────────────────
Cached query        200-500ms  <5ms    100x faster
Concurrent queries  10s        ~2s     5x faster
Library ID match    300ms      <5ms    60x faster
```

### Caching Strategy
- **Library IDs:** 1 hour TTL (cached after first resolution)
- **Docs:** 30 minute TTL (refreshes regularly)
- **Deduplication:** 5s window coalesces identical requests
- **Retry:** Exponential backoff (1s, 2s, 4s)
- **Timeout:** 30s per request

### Request Deduplication
When multiple agents ask for the same library docs:
- First request goes to Context7 API
- Subsequent requests in 5s window wait for first result
- All share the same response
- Result: 5x faster for concurrent queries

---

## Integration Patterns for Claude Code

### Pattern 1: Single Agent with Context7

```typescript
class MyAgent {
  async queryLibrary(libraryName: string, question: string) {
    // Step 1: Resolve library ID
    const libId = await context7.resolveLibraryId(libraryName, question);

    // Step 2: Query documentation
    const docs = await context7.queryDocs(libId.libraryId, question);

    // Use docs in your implementation
    return docs.docs;
  }
}
```

### Pattern 2: Multi-Agent System with Shared Deduplicator

```typescript
class AgentSystem {
  private deduplicator: RequestDeduplicator;
  private context7: Context7Client;

  constructor() {
    // Shared deduplicator across all agents
    this.deduplicator = new RequestDeduplicator({
      defaultWindowMs: 5000,
      maxWaiters: 100,
    });

    this.context7 = new Context7Client({
      cachePath: './cache/context7.db',
      deduplicator: this.deduplicator,
    });
  }

  async spawnAgents(tasks: Task[]) {
    // Multiple agents query in parallel — deduplication handles it
    return Promise.all(
      tasks.map(task => this.runAgent(task))
    );
  }
}
```

### Pattern 3: Auto-Triggering on Keywords

**Best Practices:**
```yaml
autoTriggers:
  - library
  - docs
  - documentation
  - api-reference
  - how-to
  - example
  - upgrade
  - migration
```

When these keywords appear in user input, automatically invoke Context7.

---

## Use Cases for Quality Audits & Planning

### 1. Quality Audit Agents

**Before audit:** Call `context7.queryDocs()` for library best practices
- Verify code follows current API patterns
- Check for deprecated methods
- Validate parameter usage against current version
- Catch breaking changes from version mismatches

**Example:**
```
Audit Question: "Is this React code following current hooks best practices?"
→ Query Context7 for React hooks best practices (v18.x)
→ Compare code against official patterns
→ Report violations with official documentation links
```

### 2. Planning Agents

**Before designing architecture:** Query for current patterns
- Check API compatibility before suggesting architecture
- Find correct integration patterns for current versions
- Validate plugin/middleware patterns against live docs
- Identify version-specific feature availability

**Example:**
```
Planning Question: "Design authentication for a Next.js app"
→ Query Context7 for Next.js 15 auth patterns
→ Get current middleware/route handler patterns
→ Review official examples and deprecations
→ Build plan using current best practices
```

### 3. Code Review Agents

**During review:** Verify API usage correctness
- Check if APIs exist and haven't been deprecated
- Validate parameter types and function signatures
- Verify return value handling
- Catch breaking change violations from version upgrades

**Example:**
```
Review Check: "Is this MongoDB query using the correct method signature?"
→ Query Context7 for current MongoDB API
→ Verify method name, parameters, return type
→ Suggest fixes if outdated pattern detected
```

### 4. Refactoring/Migration Agents

**Before suggesting changes:** Check migration path
- Query docs for breaking changes between versions
- Find migration patterns from official guides
- Identify deprecated APIs that need updates
- Validate new version compatibility

**Example:**
```
Migration Question: "How to upgrade from TypeScript 4.x to 5.x?"
→ Query Context7 for TypeScript 5 migration guide
→ Get list of breaking changes
→ Retrieve examples of syntax updates needed
```

---

## Best Practices for Effective Context7 Usage

### ✅ DO

1. **Be Specific in Queries**
   - ❌ "How do I use React?"
   - ✅ "How do I use useCallback hook to memoize a handler?"

2. **Include Version Information**
   - Include version numbers in queries when relevant
   - Context7 prioritizes exact version matches
   - Example: "How do I set up server components in Next.js 15?"

3. **Always Resolve Before Querying**
   - Call `resolve-library-id` before `query-docs`
   - Unless you already know the library ID (e.g., "/facebook/react")

4. **Limit Queries to 3 per Question**
   - More than 3 indicates overly broad or poorly scoped questions
   - Refactor into specific, targeted queries

5. **Include Context in Questions**
   - Tell Context7 what you're building
   - Example: "How do I set up authentication for a multi-tenant SaaS using Next.js?"

### ❌ DON'T

1. **Don't assume knowledge** — Always query for current patterns
2. **Don't skip library resolution** — Exact library ID improves relevance
3. **Don't use overly broad questions** — Specificity = better results
4. **Don't ignore version mismatches** — Always specify version if relevant

---

## Integration in This Codebase

### Existing Implementations

**1. Context7-Docs-Fetcher Agent** (`.claude/agents/documentation/context7-docs-fetcher.md`)
- Specialized agent for library documentation retrieval
- Mandatory best practices enforced
- Cache strategy with update commands
- Integration with dependency tracking

**2. Jira Orchestrator Plugin** (`plugins/jira-orchestrator/`)
- High-performance Context7Client with SQLite caching
- Request deduplicator for multi-agent systems
- Retry logic with exponential backoff
- Comprehensive metrics and monitoring
- Files:
  - `lib/context7-client.ts` — Client implementation
  - `lib/request-deduplicator.ts` — Deduplication logic
  - `lib/context7-integration-example.ts` — Usage patterns
  - `config/mcps/context7.json` — MCP configuration
  - Tests in `tests/context7-client.test.ts`

**3. MCP Configuration** (`plugins/jira-orchestrator/config/mcps/context7.json`)
- Timeout: 30s with warnings at 5s, critical at 15s
- Retry: 3 attempts (1s, 2s, 4s backoff)
- Cache: 1hr for library IDs, 30min for docs
- Deduplication: 5s window

### Auto-Activating Triggers
Context7 activates automatically when prompts mention:
- `library`, `docs`, `documentation`, `api-reference`
- `how-to`, `example`, `upgrade`, `migration`

---

## Recommendation Summary

### For Quality Audits
✅ **Use Context7** before every code audit that touches external libraries
- Call early in audit workflow (before rules checking)
- Fetch docs for each library in the codebase
- Cache results for performance
- Use findings to validate against current best practices

### For Planning Agents
✅ **Query Context7** during architecture design
- Resolve library IDs for all planned dependencies
- Verify API compatibility before suggesting patterns
- Get official examples of integration patterns
- Document findings for implementation guidance

### For Code Review
✅ **Validate API usage** against Context7 docs
- Check method signatures before marking violations
- Catch deprecated methods with official URLs
- Verify parameter types and return handling
- Identify version mismatches

### For Refactoring
✅ **Query migration guides** from Context7
- Get breaking changes for version upgrades
- Find official migration patterns
- Validate compatibility before suggesting changes

---

## Performance Metrics (Observed)

| Metric | Value |
|--------|-------|
| First query | 200-500ms |
| Cached query | <5ms |
| Cache hit rate | 70-90% (typical) |
| Concurrent query coalescing | 5x faster |
| Deduplication window | 5 seconds |
| Cache TTL (library IDs) | 1 hour |
| Cache TTL (docs) | 30 minutes |
| Timeout per request | 30 seconds |
| Retry attempts | 3 (with exponential backoff) |

---

## Comparison to Alternatives

### vs. Manual Web Search
- **Context7:** Official docs injected into prompt automatically
- **Web Search:** Tab-switching, risk of finding outdated StackOverflow posts
- **Winner:** Context7 for accuracy and current versions

### vs. LLM Training Data
- **Context7:** Real-time docs, always current
- **LLM Training Data:** Stale (cutoff 6+ months ago), hallucinations
- **Winner:** Context7 for preventing hallucinations

### vs. Local Documentation Copies
- **Context7:** Auto-updated, version-specific, no maintenance burden
- **Local Copy:** Must be manually updated, versions can drift
- **Winner:** Context7 for maintainability

---

## Key Takeaways

1. **Context7 is production-ready** — Used extensively in Claude Code ecosystem
2. **Covers 9,000+ libraries** — Includes all major frameworks and tools
3. **Always current** — Docs updated as libraries release new versions
4. **High performance** — 100x faster queries with caching/deduplication
5. **Two simple tools** — resolve-library-id + query-docs = complete workflow
6. **Perfect for quality audits** — Validate code against current best practices
7. **Critical for planning** — Prevent architecture decisions based on stale patterns
8. **Improves code review** — Catch API mismatches with authoritative sources

---

## Implementation Checklist

For agents implementing Context7:

- [ ] Always call `resolve-library-id` before `query-docs` (or use known library ID)
- [ ] Include version numbers in queries when relevant
- [ ] Keep queries specific (max 3 queries per question)
- [ ] Cache results for performance (1hr for IDs, 30min for docs)
- [ ] Deduplicate concurrent requests (5s window)
- [ ] Implement retry logic (3 attempts, exponential backoff)
- [ ] Monitor metrics (cache hit rate, slow queries)
- [ ] Provide links to official docs in output

---

## Resources

### Official Documentation
- Context7 Overview: https://context7.com/docs/overview
- GitHub Repository: https://github.com/upstash/context7
- NPM Package: https://www.npmjs.com/package/@upstash/context7-mcp
- Add Library: https://context7.com/add-library

### Integration Guides
- Claude Code MCP Setup: https://code.claude.com/docs/en/mcp
- Smithery Registry: https://smithery.ai/server/@upstash/context7-mcp
- Integration Pattern: See jira-orchestrator plugin

### This Codebase
- Docs fetcher agent: `.claude/agents/documentation/context7-docs-fetcher.md`
- High-performance client: `plugins/jira-orchestrator/lib/context7-client.ts`
- Configuration: `plugins/jira-orchestrator/config/mcps/context7.json`

