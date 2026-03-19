---
name: Firecrawl Research Findings
description: Comprehensive analysis of Firecrawl strengths, capabilities, pricing, and best practices for Claude Code research
type: reference
---

# Firecrawl: Strengths & Best Use Cases

**Date**: 2026-03-19

## What Firecrawl Excels At

### vs Other Web Scraping Tools
- **LLM-optimized output**: Converts messy web pages into clean Markdown or JSON specifically designed for AI consumption, stripping headers, footers, navigation (reduces token usage significantly)
- **JavaScript handling**: 96% web coverage with automatic JS rendering; no custom scripting required for dynamic sites
- **Single API call**: Provides scrape, crawl, search, map, and agent endpoints all in one service
- **Managed infrastructure**: Handles proxies, caching, rate limits, anti-bot protection automatically
- **API-first design**: Simpler integration than Playwright/Puppeteer for AI applications

### When to Choose Firecrawl
- Research tasks requiring clean, structured data from web pages
- JavaScript-heavy sites or single-page applications (SPAs)
- Need for AI-ready output (markdown or JSON) with minimal preprocessing
- Multi-step workflows (search → scrape → extract)

### When to Skip It
- Budget-critical: Crawl4AI is free open-source alternative with 50K+ GitHub stars
- Data sovereignty requirements: Local-only processing needed
- Highly specialized scraping: Apify offers 10,000+ pre-built task marketplace

---

## Scraping Capabilities

### Single Page Scraping (`/scrape`)
- Converts URL to clean Markdown, HTML, JSON, or screenshots
- Handles JavaScript-rendered content automatically
- Supports multiple output formats simultaneously
- Can perform browser actions (click, write, press, wait, screenshot)
- Location/language settings with country code support
- Cache control: `maxAge`, `storeInCache`, `minAge` parameters
- **Cost**: 1 credit per page (base)

### Advanced Scraping Features
- **Enhanced mode**: For complex websites (costs extra)
- **JSON extraction**: 4 additional credits per page
- **PDF parsing**: 1 credit per page
- **Zero Data Retention**: 1 credit per page (for enterprise privacy)

### Batch Scraping
- Multiple URLs in single request
- Efficient for bulk operations

---

## Crawling Capabilities

### Site Crawling (`/crawl`)
- Recursively discovers and scrapes every reachable subpage
- Automatic sitemap handling
- Returns clean Markdown or structured data
- **Default limit**: 10,000 pages

### Crawl Scope Control Parameters
| Parameter | Purpose |
|-----------|---------|
| `sitemap` | "include" (default), "skip", or "only" |
| `limit` | Max pages to crawl |
| `maxDiscoveryDepth` | Link-discovery hops from root |
| `includePaths` / `excludePaths` | URL pathname regex filters |
| `crawlEntireDomain` | Follow sibling and parent paths |
| `allowSubdomains` | Include subdomain links |
| `allowExternalLinks` | Follow external site links |

**Key**: By default, crawl stays within children of provided URL; use `crawlEntireDomain` for broader scope.

---

## Search Functionality (`/search`)

### Capabilities
- Web search with sources and categories
- **scrapeResults option**: Returns full page content alongside search results in single call (no separate fetch round-trip needed)
- Designed to reduce latency for agent workflows

### Use Case
Ideal when agents need both search results and scraped page content together.

---

## Structured Data Extraction

### Two Extraction Approaches
1. **Schema-based**: Define JSON schema (OpenAI format) specifying exact data needed
2. **Prompt-based**: Natural language instructions like "Extract company mission" without rigid schema

### Key Capabilities
- AI-powered extraction: Semantic analysis of page content, not CSS selectors
- Returns data matching user-defined schema
- Includes metadata (page title, description, source URL)
- **Limitation**: HTML attributes not available (only visible text preserved in markdown conversion)

### Best Practices for Extraction
- Keep prompts focused and concise
- Use concise property names in schemas
- Leverage `enum` arrays for constrained fields
- Split large schemas (30+ fields) into multiple requests

---

## Browser Automation & JavaScript Features

### Browser Sandbox
- Secure, fully managed browser environment
- Python, JavaScript, and Bash execution capabilities
- Pre-installed with agent-browser CLI and Playwright
- No local setup required (no Chromium installs, no driver compatibility)
- Isolated, disposable sessions that scale automatically

### JavaScript Execution
- Automatic JS rendering and execution
- Waits for dynamic content to load
- Excellent for modern SPAs and dynamically rendered sites
- Built-in headless browser technology handles all rendering

---

## Autonomous Agent Feature (`/agent`)

### Capabilities
- **Natural language control**: Describe requirements ("find competitor pricing") without manual API orchestration
- **End-to-end autonomy**: Single instruction like "find top 5 CRM pricing and return comparison table" handles search, navigation, extraction, and data return
- **Complex task handling**: JS-heavy sites, multi-step flows, modal navigation, form filling, dynamic content waiting

### Model Options (Spark Family)
- **Spark 1 Fast**: Instant retrieval for simple lookups
- **Spark 1 Mini**: Complex research queries (default, 60% cheaper)
- **Spark 1 Pro**: Advanced extraction tasks requiring maximum accuracy
- **Intelligent waterfall**: Tries instant retrieval first, auto-upgrades to Mini/Pro only when needed

### Advanced Capability: Parallel Agents
- Execute thousands of /agent queries simultaneously
- Automatic failure handling
- Intelligent waterfall execution

---

## Pricing & Rate Limits

### Pricing Plans (2026)
| Plan | Cost | Details |
|------|------|---------|
| Free | $0 | 500 one-time credits |
| Hobby | TBD | Starting tier |
| Standard | $83/mo | Billed yearly |
| Growth | $333/mo | Billed yearly |
| Scale | $599/mo | Billed yearly |
| Enterprise | Custom | Custom credits + support |

### Credits System
- **Basic scrape/crawl**: 1 credit per page
- **JSON extraction**: +4 credits per page
- **PDF parsing**: 1 credit per page
- **Zero Data Retention**: +1 credit per page
- **No rollover**: Credits don't carry to next billing period (except auto-recharge credits)

### Rate Limits
- Vary by plan
- Based on concurrent request capacity
- Higher-tier plans get more concurrent browsers and priority support
- **Failed requests**: Generally not charged

---

## Best Practices for Claude Code Research

### 1. Token Efficiency (Critical)
- Firecrawl's primary strength for AI: maximum token efficiency
- Output is pre-processed (ads, navigation, footers removed)
- Use Markdown output for simpler cases, JSON for structured extraction
- Saves significant tokens vs. raw HTML

### 2. Model Selection for Cost
- Start with **Spark 1 Mini** (default) for most tasks
- Switch to **Spark 1 Pro** only for complex multi-domain research or accuracy-critical work
- Mini handles typical extraction tasks at 60% lower cost

### 3. Extraction Strategy
- Define clear JSON schemas or prompts upfront
- Avoid HTML attribute dependencies (not available)
- Split large schemas (30+ fields) into separate requests
- Use `enum` for constrained fields (improves accuracy)

### 4. Workflow Optimization
- Use `/search` with `scrapeResults=true` to combine search + scrape (single round-trip)
- Batch multiple URLs together when possible
- Use `/agent` for complex multi-step research (handles orchestration automatically)
- Implement retry logic with exponential backoff

### 5. Caching & Performance
- Leverage `maxAge` and `storeInCache` parameters
- Use asynchronous crawling for large crawls (don't block)
- Monitor rate limits by plan tier

### 6. MCP Integration in Claude Code
- Easy setup: `claude mcp add firecrawl --url https://mcp.firecrawl.dev/your-api-key/v2/mcp`
- Or local: `claude mcp add firecrawl -e FIRECRAWL_API_KEY=key -- npx -y firecrawl-mcp`
- Available tools: FIRECRAWL_SCRAPE_EXTRACT_DATA_LLM, FIRECRAWL_CRAWL_URLS, etc.
- Natural language prompts work: "Scrape this URL" or "Search for documentation"

---

## When Firecrawl Shines for Research

✓ **Document research**: Convert technical docs to structured data
✓ **Competitive analysis**: Extract pricing, features, positioning
✓ **API documentation scraping**: Build structured references
✓ **News/blog monitoring**: Extract articles with metadata
✓ **Multi-page aggregation**: Crawl entire sites for comprehensive data
✓ **Real-time web context**: Latest docs, pricing, updates for code generation
✓ **Language model training data**: Clean, pre-processed content ready for LLMs

---

## Performance Notes

- **Benchmark**: Measured 50x faster than Apify for agent workflows
- **Success rate**: 96% web coverage; Scrapfly (alternative) claims 98% on anti-bot sites
- **Integration time**: Single line of code with MCP

---

## Sources & Documentation

- [Firecrawl Main Docs](https://docs.firecrawl.dev)
- [Firecrawl MCP Server](https://docs.firecrawl.dev/mcp-server)
- [Agent Documentation](https://docs.firecrawl.dev/features/agent)
- [Scrape Endpoint](https://docs.firecrawl.dev/features/scrape)
- [LLM Extract (JSON Mode)](https://docs.firecrawl.dev/features/llm-extract)
- [Crawl Feature](https://docs.firecrawl.dev/features/crawl)
- [Rate Limits](https://docs.firecrawl.dev/rate-limits)
- [GitHub: Firecrawl MCP Server](https://github.com/firecrawl/firecrawl-mcp-server)
