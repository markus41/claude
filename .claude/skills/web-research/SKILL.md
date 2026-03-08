---
name: web-research
description: Deep web research using Perplexity and Firecrawl MCP servers. Use when researching technologies, APIs, best practices, or current information.
context: fork
agent: researcher
---

# Web Research

Research the topic: $ARGUMENTS

## Research Strategy
1. First check the codebase for existing knowledge using Grep and Glob
2. Use Perplexity MCP for knowledge queries about the topic
3. Use Firecrawl MCP to scrape specific documentation pages if needed
4. Use Context7 MCP for library-specific documentation
5. Synthesize findings into actionable recommendations

## MCP Tools Available
- `mcp__perplexity__perplexity_ask` - Ask knowledge questions
- `mcp__firecrawl__firecrawl_scrape` - Scrape a specific URL
- `mcp__firecrawl__firecrawl_search` - Search the web
- `mcp__plugin_context7_context7__resolve-library-id` - Find library docs
- `mcp__plugin_context7_context7__query-docs` - Query library documentation

## Output Format
- **Summary**: 2-3 sentence overview
- **Key Findings**: Detailed bullet points with sources
- **Code Examples**: If applicable
- **Recommendations**: Next steps and implementation guidance
