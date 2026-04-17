# Research Tool Routing

Optimal routing of research tasks across Perplexity MCP, Firecrawl MCP, and Context7 MCP.
Each tool has distinct strengths — use the right one for each job.

## Tool Strengths at a Glance

| Tool | Best For | Cost | Speed |
|------|----------|------|-------|
| **Context7** | Library/framework docs, API reference | Free | Fast (cached <5ms) |
| **Perplexity Ask** | Knowledge Q&A, current events, fact-checking | ~$0.02/query | Fast |
| **Perplexity Research** | Deep investigations, comprehensive reports | ~$0.10/query | Slow |
| **Firecrawl Scrape** | Extract content from specific URL | 1 credit | Fast |
| **Firecrawl Map** | Discover all URLs on a site | 1 credit | Fast |
| **Firecrawl Extract** | Structured JSON from pages | 5-20 credits | Medium |
| **Firecrawl Agent** | Autonomous multi-page research | 100-1500+ credits | Slow |

## Decision Tree

```
What do you need to find out?

├─ LIBRARY DOCS?
│  "How does React useEffect work?"
│  "What's the Prisma findMany API?"
│  "Next.js App Router conventions?"
│  └─→ Context7 (resolve-library-id → query-docs)
│      Free, current, version-specific, no hallucination
│
├─ GENERAL KNOWLEDGE?
│  "What is the latest in AI?"
│  "Explain event sourcing"
│  "Compare Redis vs Memcached"
│  └─→ Perplexity Ask (perplexity_ask)
│      Fast, cheap, citations included
│
├─ CURRENT EVENTS?
│  "What happened at AWS re:Invent?"
│  "Latest security vulnerability in Log4j?"
│  └─→ Perplexity Search (perplexity_search)
│      Real-time web search with ranked results
│
├─ DEEP RESEARCH?
│  "Comprehensive comparison of 5 auth solutions"
│  "Full analysis of microservice vs monolith tradeoffs"
│  └─→ Perplexity Research (perplexity_research)
│      Deep-Research model, thorough, multiple sources
│
├─ EXTRACT FROM KNOWN URL?
│  "Get the pricing from https://example.com/pricing"
│  "Extract the API reference from this page"
│  └─→ Firecrawl Scrape (firecrawl_scrape)
│      1 credit, clean markdown or JSON output
│
├─ FIND PAGES ON A SITE?
│  "What docs pages exist on docs.example.com?"
│  "Find the webhook documentation page"
│  └─→ Firecrawl Map (firecrawl_map)
│      Discover URLs, then scrape the relevant ones
│
├─ STRUCTURED DATA EXTRACTION?
│  "Get all product prices as JSON from this catalog"
│  "Extract API endpoints with parameters"
│  └─→ Firecrawl Extract (firecrawl_extract)
│      Custom JSON schema extraction
│
└─ COMPLEX MULTI-SOURCE?
   "Research X across official docs, blogs, and forums"
   └─→ Chain: Context7 → Perplexity → Firecrawl
       1. Context7: Official library docs (free)
       2. Perplexity: Broader knowledge synthesis ($0.02)
       3. Firecrawl: Extract from specific URLs found (1 credit each)
```

## Perplexity MCP Tools

### perplexity_search
- **Best for**: Finding URLs, quick fact-checking, ranked results
- **Model**: Sonar (fast, cheap)
- **Output**: Search results with URLs, snippets, rankings

### perplexity_ask
- **Best for**: Direct Q&A, conversational answers with citations
- **Model**: Sonar-Pro (balanced speed/quality)
- **Output**: Text answer + source citations
- **Context**: 128K tokens for comprehensive analysis

### perplexity_research
- **Best for**: Deep investigations, detailed reports
- **Model**: Sonar-Deep-Research
- **Output**: Comprehensive analysis with multiple sources cited
- **Cost**: 3-5x more than perplexity_ask

### perplexity_reason
- **Best for**: Logical analysis, structured problem-solving
- **Model**: Sonar-Reasoning-Pro
- **Output**: Step-by-step reasoning with conclusions

## Firecrawl MCP Tools

### firecrawl_scrape
- **Best for**: Single page content extraction
- **Cost**: 1 credit (cheapest Firecrawl operation)
- **Formats**: markdown, JSON, HTML, screenshot, branding
- **Tip**: Use `onlyMainContent: true` to skip headers/footers
- **Tip**: For JS-rendered pages, add `waitFor: 5000`

### firecrawl_map
- **Best for**: Discovering URLs on a site before scraping
- **Tip**: Use `search` parameter to find specific pages
- **Workflow**: Map → identify relevant URLs → Scrape each

### firecrawl_search
- **Best for**: Web search with optional content extraction
- **Alternative to**: Perplexity search (but costs credits)
- **Tip**: Prefer Perplexity for pure search; Firecrawl for search+extract

### firecrawl_extract
- **Best for**: Structured JSON extraction with custom schemas
- **Cost**: 5-20 credits per extraction
- **Required**: JSON schema defining expected output structure
- **Tip**: Only use when you need structured data, not just text

### firecrawl_crawl
- **Best for**: Multi-page bulk extraction
- **Cost**: Variable (1 credit per page crawled)
- **Warning**: Can exceed token limits — set `limit` and `maxDiscoveryDepth`

### firecrawl_agent
- **Cost**: 100-1,500+ credits per task (UNPREDICTABLE)
- **Use**: ONLY as last resort when map+scrape fails
- **Warning**: Async — requires polling `firecrawl_agent_status`

### firecrawl_browser_*
- **Best for**: Interactive automation (forms, clicks, JavaScript)
- **Workflow**: browser_create → browser_execute → browser_delete
- **Use**: Only when scrape fails on highly interactive pages

## Context7 MCP Tools

### resolve-library-id
- **Purpose**: Map library name to Context7 ID
- **Input**: Library name (e.g., "react", "prisma", "next.js")
- **Output**: Library ID (e.g., "/facebook/react")
- **Cache**: 1hr (very fast on repeat calls)

### query-docs
- **Purpose**: Fetch documentation for a resolved library
- **Input**: Library ID + specific question
- **Output**: Relevant docs, API reference, examples
- **Cache**: 30min for docs content
- **Tip**: Be specific — "useCallback hook" not just "React"

## Chaining Strategies

### Strategy 1: Knowledge → Extraction
1. **Perplexity Ask**: "What's the best library for X? Give me the official URL"
2. **Firecrawl Scrape**: Extract clean content from the official page
3. **Benefit**: Perplexity finds the best source; Firecrawl gets clean content

### Strategy 2: Docs → Knowledge → Validation
1. **Context7**: Get official library docs for the framework
2. **Perplexity Ask**: "Common patterns for using X with Y"
3. **Context7**: Verify patterns against official docs
4. **Benefit**: Official docs + community knowledge, validated

### Strategy 3: Map → Scrape → Synthesize
1. **Firecrawl Map**: Discover all pages on a documentation site
2. **Firecrawl Scrape**: Extract content from relevant pages
3. **Perplexity Ask**: Synthesize findings into actionable answer
4. **Benefit**: Comprehensive coverage + clean synthesis

### Strategy 4: Avoid Agent Costs
1. **Perplexity Research**: Get comprehensive answer with sources
2. **Only use Firecrawl Agent** if structured JSON from 5+ sources is required
3. **Benefit**: Cut 90% of autonomous browsing costs

## Mandatory Context7 Usage

**Quality audits and planners MUST use Context7.**

### For Quality Audits
```
Before auditing code:
  1. Identify libraries used in the code under review
  2. Context7: resolve-library-id for each library
  3. Context7: query-docs for current best practices
  4. Compare code against official patterns
  5. Flag deviations as audit findings with doc links
```

### For Planning Agents
```
Before designing architecture:
  1. List all proposed libraries/frameworks
  2. Context7: verify API compatibility for each
  3. Context7: check for breaking changes between versions
  4. Context7: find recommended integration patterns
  5. Include doc-backed justifications in plan
```

### For Code Review
```
During review:
  1. Identify library API calls in changed code
  2. Context7: verify correct API usage
  3. Context7: check for deprecated methods
  4. Flag incorrect usage with links to official docs
```

## Cost Budget Guidelines

For a typical research task:

| Approach | Cost | When to Use |
|----------|------|-------------|
| Context7 only | Free | Library docs, API reference |
| Perplexity only | ~$0.02 | Knowledge Q&A, current events |
| Context7 + Perplexity | ~$0.02 | Library + broader context |
| Perplexity + Firecrawl Scrape | ~$0.03 | Knowledge + extraction |
| Full chain (all 3) | ~$0.05 | Comprehensive research |
| Firecrawl Agent | $0.08-$1.20 | AVOID — use chain instead |

**Rule**: Start cheap (Context7 → Perplexity → Firecrawl Scrape). Only escalate if cheaper tools don't have the answer.
