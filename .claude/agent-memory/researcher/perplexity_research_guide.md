---
name: Perplexity API & MCP Research Guide
description: Comprehensive research on Perplexity API strengths, models, pricing, and best practices for Claude Code integration
type: reference
---

# Perplexity API & MCP Research Guide
**Last Updated:** 2026-03-19

## Executive Summary

Perplexity Sonar API is a real-time web search engine that combines live crawling with LLM synthesis to deliver cited answers with verified sources. It excels at:
- Current information retrieval (market trends, recent events, API changes)
- Synthesized, cited answers with source links
- Fast turnaround (1200 tokens/second with Cerebras infrastructure)
- Lower cost than traditional web scraping at scale

**Best for:** Research queries, documentation lookups, current events, market intelligence
**Not for:** Structured data extraction, complex form navigation, specific page parsing

---

## Sonar Models & Capabilities

### Model Lineup (2026)

| Model | Use Case | Speed | Cost | Key Feature |
|-------|----------|-------|------|-------------|
| **Sonar** | General search, fast QA | 1200 tokens/sec | $0.2-1/M tokens | Baseline speed & cost |
| **Sonar Pro** | Advanced reasoning, synthesis | Fast | $3/M input, $15/M output | Better summarization |
| **Sonar Reasoning Pro** | Complex analytical queries | Fast | Higher | Step-by-step reasoning |
| **Sonar Deep Research** | Comprehensive multi-source reports | Slower | $5/1000 searches | Exhaustive research, autonomous refinement |

### Search Depth Modes (Added Jan 2026)

Applied to Sonar, Sonar Pro, and Sonar Reasoning Pro:
- **High**: Maximum depth, complex queries, thorough context (higher cost)
- **Medium**: Balanced approach for moderately complex questions (recommended default)
- **Low**: Cost-optimized for straightforward queries (lowest cost)

Deep Research does not support search modes—it always runs exhaustive multi-search approach.

### Performance Metrics
- **Speed**: 1200 tokens/second (Cerebras infrastructure) - ~10x faster than GPT-4o
- **Quality**: Outperforms Claude 3.5 Sonnet, approaches GPT-4o performance
- **Cost**: Fraction of typical web scraping tools

---

## Citation & Source Reliability

### Citation Coverage
- **Edge over ChatGPT**: 78% of complex research had every claim tied to a specific source (vs ChatGPT's 62%)
- **Format**: Numbered citations with clickable links to original sources
- **No Citation Token Charges** (2026 improvement): Citation tokens no longer billed for standard Sonar models

### Accuracy & Limitations

**Strengths:**
- Best among tested AI search engines for citation accuracy
- Excellent for open-access, recent, well-documented sources (policy papers, government PDFs, news)
- Direct links to primary documents for clear information

**Concerns:**
- ~37% of answers contain errors or misattributed claims (worse accuracy than raw facts, but cites sources consistently)
- Citations sometimes point to homepages instead of specific articles
- May link to mirrors/secondary blogs rather than publisher of record
- Sometimes quotes cannot be located in cited source
- Struggles with paywalled/proprietary information (academic journals, subscription databases)

**Note:** Reported citation discrepancy between Web UI and API responses (needs verification in current builds)

### When Reliability Declines
- Paywalled academic journals
- Proprietary research reports
- Non-English or niche-language sources
- Highly specialized technical topics with few public sources

---

## Pricing & Rate Limits (2026)

### Pricing Model
- **Structure**: Pay-as-you-go credit system (no monthly subscription for API)
- **Sonar**: $1/M tokens
- **Sonar Pro**: $3/M input tokens, $15/M output tokens
- **Sonar Deep Research**: $5/1000 searches
- **Pro Subscriber Benefit**: $5/month recurring credit
- **Citation tokens**: No longer billed (major 2026 cost improvement)

### Rate Limits
- Based on **Requests Per Minute (RPM)**, **Tokens Per Day (TPD)**, and **bandwidth**
- Throttling/queueing on overage (requests queued, not rejected with error fees)
- Custom agreements for enterprise API usage

### Cost Comparison
- **Firecrawl**: ~$0.83/100K pages (structured extraction focus)
- **Perplexity Sonar**: $1/M tokens (synthesis & citations focus)

---

## Perplexity vs Firecrawl: Decision Matrix

### Use Perplexity When
- ✅ Need synthesized answers with verified citations
- ✅ Research current events, markets, recent developments
- ✅ Users need source links (legal, healthcare, academic work)
- ✅ Speed is critical (raw answer generation)
- ✅ Information is well-documented and public

### Use Firecrawl When
- ✅ Need structured data extraction from specific sites
- ✅ Form submission, pagination, JavaScript interaction needed
- ✅ Complex multi-step navigation required
- ✅ Schema/format control is essential
- ✅ Building RAG with specific website data

### Hybrid Approach
- Perplexity for research → find credible sources
- Firecrawl for deep extraction → get specific data from identified sources
- Use both in agentic workflows for thorough coverage

---

## Perplexity MCP Integration with Claude Code

### Setup

**One-click Option:**
- Available in Cursor/VS Code extensions

**Manual Setup:**
```bash
claude mcp add perplexity --env PERPLEXITY_API_KEY="your_key" -- \
  npx -y @perplexity-ai/mcp-server
```

Or add to `.mcp.json`:
```json
{
  "mcpServers": {
    "perplexity": {
      "command": "npx",
      "args": ["-y", "@perplexity-ai/mcp-server"],
      "env": {
        "PERPLEXITY_API_KEY": "your_key"
      }
    }
  }
}
```

### Best Practices for Claude Code

**Do:**
- Use Sonar (default) for general documentation and current library info
- Switch to Sonar-reasoning-pro for step-by-step technical analysis
- Use Medium search depth as default (balanced cost/quality)
- Use High depth for critical decisions
- Use Low depth for confirmation queries on known topics

**Don't:**
- Use for code generation (training data sufficient)
- Use for business logic (no added value)
- Use for test generation (not web-dependent)
- Use for refactoring (training data covers existing code patterns)

### Recommended Model Selection Strategy
```
Default (most queries):        sonar (Medium mode)
Complex debugging/analysis:    sonar-reasoning-pro (Medium/High)
Straightforward lookups:       sonar (Low mode)
Comprehensive research:        sonar-deep-research (when need thorough)
```

### Network Considerations
- If behind corporate firewall/proxy: configure `PERPLEXITY_PROXY`
- Most reliable for enterprise: proxy environment variable setup

---

## Real-Time Information Access

### Strengths
- **Live web crawling**: Accesses current information, not training-data-limited
- **Recent developments**: API changes, framework updates (last 6 months)
- **Trending topics**: Market movements, news, emerging research
- **Library releases**: Documentation for packages released after model cutoff

### Latency
- Answers generated at 1200 tokens/second
- Total response time: seconds (not minutes)

### Coverage
- Optimized for indexed web content
- May miss very recent (< 24 hour) or obscure sources
- Best with widely-reported information

---

## When to Use Perplexity vs Other Tools

### Perplexity Sonar (Regular)
```
Why: Fast, cost-effective, cited synthesis
When: "What are the top 3 ways to optimize React performance?"
      "Has the Next.js 15 API changed since my knowledge cutoff?"
      "What are current market trends in AI?"
```

### Perplexity Deep Research
```
Why: Exhaustive multi-source analysis
When: "Comprehensive competitive analysis of payment providers"
      "Market research spanning 3+ countries"
      "Deep historical context needed"
```

### Firecrawl
```
Why: Structured extraction, form handling
When: "Extract pricing table from 50 SaaS websites"
      "Auto-fill form and get result page"
      "Parse specific HTML structure into JSON"
```

### WebSearch/WebFetch
```
Why: One-off, non-critical lookups
When: General browsing, entertainment, non-critical context
Note: Claude Code rules recommend MCP tools instead
```

---

## Known Issues & Workarounds (2026)

1. **Citation discrepancy**: Web UI and API may return different citations for same query
   - Workaround: Use API directly for consistent citation behavior

2. **Paywall handling**: Struggles with subscription-gated academic content
   - Workaround: Use alternative sources or direct institutional access

3. **Quote attribution**: Some direct quotes don't match cited source exactly
   - Workaround: Always verify quotes against original source for critical use

4. **Mirror/secondary sites**: May cite blog posts instead of original publisher
   - Workaround: Check citation URL, adjust search terms for specificity

---

## Optimization Tips

### Cost Optimization
- Use Low search depth for confirmation/verification queries
- Use Medium for standard research (sweet spot)
- Reserve High for critical decisions only
- Batch multiple questions into single query when possible
- Citations no longer charged (2026) - cite liberally

### Quality Optimization
- Be specific in queries: "What's the new feature in Next.js 15?" vs "Tell me about Next.js"
- Specify search depth based on query complexity
- For deep research, use Sonar Deep Research instead of multiple Sonar calls

### Integration Optimization
- Set Sonar as default MCP tool for research
- Route code generation to Claude, research to Perplexity
- Use in parallel: Claude generates while Perplexity researches
- Cache Deep Research results (expensive, slow)

---

## References & Additional Resources

- [Perplexity API Documentation](https://docs.perplexity.ai)
- [Sonar Models Overview](https://docs.perplexity.ai/getting-started/models/models/sonar)
- [Perplexity MCP Server](https://docs.perplexity.ai/docs/getting-started/integrations/mcp-server)
- [Pricing Documentation](https://docs.perplexity.ai/docs/getting-started/pricing)
- [GitHub: Perplexity MCP](https://github.com/perplexityai/modelcontextprotocol)

---

## Related Memory Files
- `perplexity_vs_firecrawl_decision.md` - Quick decision matrix
- `research_tools_comparison.md` - MCP research tools (Perplexity, Firecrawl, Context7)
