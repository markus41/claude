---
name: Context7 MCP Server Research
description: Complete understanding of Context7 MCP capabilities, tools, supported libraries, strengths vs direct scraping, and integration patterns for code quality
type: reference
---

# Context7 MCP Server - Complete Reference

## What Context7 Does

Context7 is an MCP (Model Context Protocol) server by Upstash that provides **real-time, version-specific documentation and code examples** directly to AI coding assistants. It solves the core problem: LLMs rely on outdated training data, leading to outdated code examples and hallucinated APIs.

**Core value proposition:**
- Prevents hallucinations from stale information
- Fetches the latest official docs and code examples from source
- Maintains version-specific documentation matching
- Seamlessly embeds into agent/LLM workflows

---

## How It Works: The Two Tools

### 1. resolve-library-id
**Purpose:** Convert human-readable library names to Context7-compatible IDs

**Inputs:**
- `libraryName` (required): Name of library (e.g., "react", "next.js", "mongodb")
- `query` (required): The user's question or task (used to rank results by relevance)

**Output:** Returns:
- Library ID (e.g., `/facebook/react`, `/vercel/next.js`)
- Name and description
- Code snippet count
- Source reputation (High/Medium)
- Benchmark score (target 80+)
- Available versions

**Key feature:** LLM-powered search and ranking to identify the most relevant library based on intent.

---

### 2. query-docs (formerly get-library-docs)
**Purpose:** Retrieve and query up-to-date documentation and code examples

**Inputs:**
- `libraryId` (required): Context7-compatible ID (e.g., `/vercel/next.js/v15.0.0`)
- `query` (required): The question or task
- `topic` (optional): Focus on specific topic (e.g., "middleware", "authentication")
- `tokens` (optional, default 5000): Max tokens to return

**Important constraint:** Do not call more than 3 times per question. If insufficient after 3 calls, use best available info.

**Version-specific queries:** Simply specify version in prompt (e.g., "Next.js 14 middleware") or use slash syntax (`/vercel/next.js/v14.0.0`).

---

## Libraries & Frameworks Supported

**Coverage:** 9,000+ libraries indexed

**Major categories:**
- **Frontend:** React, Next.js, Vue, Angular, Svelte, Tailwind CSS
- **Backend:** Node.js, Django, FastAPI, Rails, Spring Boot, Go modules
- **Databases:** MongoDB, PostgreSQL, Supabase, Firebase
- **Languages:** JavaScript, TypeScript, Python, Go, Rust, Java, C#, PHP, Ruby
- **Frameworks:** Any library with official online documentation

**Best results with:**
- Fast-moving libraries (React, Next.js, Zod, Tailwind, React Query)
- Libraries with frequent breaking changes
- Framework-specific patterns and best practices
- Authentication and security implementation

---

## Context7 vs Direct Documentation Scraping

| Aspect | Direct Scraping | Context7 |
|--------|-----------------|----------|
| **Parsing** | Basic HTML extraction | Intelligent documentation parsing (private engine) |
| **Freshness** | Static snapshots | Continuously crawled, always current |
| **Matching** | String-based search | Query-aware relevance ranking |
| **Version Management** | Manual tracking | Automatic version detection and matching |
| **Integration** | Manual copying into context | Seamless MCP embedding |
| **Indexing** | One-time snapshot | Real-time indexed database |
| **Accuracy** | Inconsistent extraction | High-quality parsed documentation |
| **API Support** | Limited | Full API reference with examples |

**Key advantage:** Context7's private parsing engine understands semantic structure of documentation, not just HTML extraction.

---

## Strengths for Code Quality Audits & Planning

### Primary Strengths

1. **Authoritative Standards:** Always references current, official documentation — no guessing at best practices
2. **Version-Aware Recommendations:** Can suggest migration paths and breaking changes
3. **Quality Gate Input:** Audits can cross-check code against current library recommendations
4. **Dependency Analysis:** When auditing dependencies, fetch current API to verify usage patterns
5. **Architecture Validation:** Verify custom patterns against current framework capabilities

### Use Cases in Audits

- **Security audits:** Fetch current security best practices from framework docs
- **Architecture audits:** Validate patterns against framework-recommended approaches
- **Dependency audits:** Check if usage of older library APIs still valid in current versions
- **Quality checks:** Ensure code follows current best practices (e.g., React hooks patterns, async handling)
- **Migration planning:** Query breaking changes and migration guides between versions

### Cost-Benefit for Auditing

- **Reduced false positives:** Authority comes from official sources, not heuristics
- **Contextual recommendations:** Can say "Next.js 15 recommends this pattern, you're using an older approach"
- **Efficiency:** No need to manually scrape and parse multiple doc sites during audit

---

## Installation & Setup

### MCP Server Installation
```bash
npx @upstash/context7-mcp [--api-key YOUR_KEY]
```

### Scopes (Claude Code)
- Can be registered at **user**, **project**, or **local** scope in `.mcp.json`
- Free tier available (maintained by Upstash)

### Quick Activation
In any prompt, simply write: **"use context7"** or **"with context7"**

---

## Best Practices for Integration

### 1. Library Selection
- Use `resolve-library-id` first with a clear `query` parameter
- Prioritize results with:
  - Exact name matches
  - High source reputation
  - Benchmark score 80+
  - High snippet coverage

### 2. Documentation Queries
- Be specific about what you're asking (improves ranking)
- Mention version if relevant
- Use `topic` parameter to narrow scope for complex libraries
- Example good query: "How do I implement custom middleware in Next.js 15?" (vs. vague "Next.js middleware")

### 3. Version Strategy
- For version-specific needs, use slash syntax: `/org/project/version`
- For flexible needs, let Context7 auto-match
- Query can override version: "Show me Next.js 14 approach" overrides version-agnostic ID

### 4. Integration Patterns
- **Pre-audit research:** Use Context7 to establish current best practices BEFORE auditing code
- **As-you-audit:** When questioning a pattern, fetch current docs to validate
- **Post-audit recommendations:** Reference Context7 docs when suggesting improvements
- **Planning:** Query future versions for migration guidance

### 5. Constraint Management
- Max 3 `query-docs` calls per question (efficiency limit)
- Use `tokens` parameter to control response size
- For broad topics, use `topic` to narrow first call

---

## Comparison to Other Tools

### vs. WebSearch/WebFetch
- **Context7:** Understands semantic structure, version-aware, indexed database
- **WebSearch:** General web search, can include outdated/community content
- **WebFetch:** Raw HTML scraping, no semantic understanding

### vs. Firecrawl MCP
- **Context7:** Specialized for library docs, version-matched, relevance-ranked
- **Firecrawl:** General-purpose web scraping, works for any URL

### vs. Manual Docs Review
- **Context7:** Real-time, always current, searchable by intent
- **Manual:** Time-consuming, subject to reviewer knowledge gaps

---

## Known Limitations

1. Only covers libraries with official online documentation
2. Private-sector/proprietary libraries may have limited coverage
3. Very new libraries may not be indexed yet
4. No offline capability (requires Upstash API access)
5. Rate limiting on free tier (check current limits on GitHub)

---

## Integration with Claude Code Workflow

### Recommended Pattern for Audits

```
1. Start audit → identify dependencies
2. For each dependency: resolve-library-id
3. Query current best practices: query-docs with audit-relevant topics
4. Compare code against fetched standards
5. Reference documentation in recommendations
6. Document version context for future reference
```

### In Rules/Hooks
- Add Context7 lookup to code quality check hooks
- Cache library IDs to avoid repeated resolve calls
- Include "use context7" in agent prompts for audit subagents

---

## Sources & Documentation

- **GitHub Repository:** https://github.com/upstash/context7
- **Official Blog:** https://upstash.com/blog/context7-mcp
- **MCP Registry:** https://smithery.ai/servers/upstash/context7-mcp
- **Documentation:** https://context7.com/docs/overview
- **Stacklok Guide:** https://docs.stacklok.com/toolhive/guides-mcp/context7
