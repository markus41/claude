---
name: Agentic Design Patterns Research
description: Complete coverage of 21 agentic design patterns from the Mathews-Tom/Agentic-Design-Patterns GitHub repo (Gulli & Sauco book, 424 pages, MIT license)
type: reference
---

# Agentic Design Patterns Research

**Source**: https://github.com/Mathews-Tom/Agentic-Design-Patterns
**Authors**: Antonio Gulli and Mauro Sauco (compiled by Tom Mathews)
**Date researched**: 2026-03-26

## File Path Pattern
All chapter files have encoded hash suffixes, e.g.:
`01-Part_One/Chapter_1-Prompt_Chaining-1flxKGrbnF2g8yh3F-oVD5Xx7ZumId56HbFpIiPdkqLI.md`
Fetch raw via: `https://raw.githubusercontent.com/Mathews-Tom/Agentic-Design-Patterns/main/<path>`

## Frameworks Covered
- LangChain / LangGraph / LCEL
- Google ADK (Agent Development Kit)
- CrewAI
- Microsoft AutoGen
- LlamaIndex
- FastMCP
- OpenAI Deep Research API

## 21 Patterns Summary

### Part 1: Foundational (Ch 1-7)
1. Prompt Chaining — divide-and-conquer sequential pipelines; structured JSON handoffs
2. Routing — conditional dispatch (LLM-based, embedding-based, rule-based, ML classifier)
3. Parallelization — concurrent independent tasks; RunnableParallel / ParallelAgent
4. Reflection — producer-critic loops; iterative quality refinement
5. Tool Use / Function Calling — 6-step cycle; LangChain @tool, CrewAI @tool, ADK FunctionTool
6. Planning — goal decomposition; adaptable plans; DeepResearch example
7. Multi-Agent Collaboration — 5 topologies: sequential, parallel, debate, hierarchical, expert teams

### Part 2: Advanced (Ch 8-11)
8. Memory Management — short-term (context window) + long-term (vector DB); ADK State scopes
9. Learning and Adaptation — RL, supervised, few-shot, online, memory-based; SICA self-improving agent
10. Model Context Protocol (MCP) — client-server; resources/tools/prompts; FastMCP; A2A complement
11. Goal Setting and Monitoring — SMART goals; feedback loops; multi-agent evaluator separation

### Part 3: Production (Ch 12-14)
12. Exception Handling and Recovery — detect/handle/recover; layered fallback agents
13. Human-in-the-Loop — oversight/intervention/escalation; scalability trade-offs
14. Knowledge Retrieval (RAG) — standard RAG, GraphRAG, Agentic RAG; vector DBs; chunking

### Part 4: Advanced Architectures (Ch 15-21)
15. Inter-Agent Communication (A2A) — open HTTP/JSON-RPC 2.0 standard; Agent Cards; mTLS
16. Resource-Aware Optimization — dynamic model routing; cost tiering (Flash vs Pro)
17. Reasoning Techniques — CoT, ToT, ReAct, PALMs, CoD (Chain of Debates), GoD (Graph of Debates)
18. Guardrails/Safety Patterns — layered defense; input validation + output filtering + behavioral constraints
19. Evaluation and Monitoring — trajectory analysis; LLM-as-judge; contractor model framework
20. Prioritization — criteria definition → task evaluation → selection → dynamic re-prioritization
21. Exploration and Discovery — Google Co-Scientist model; generate/debate/evolve cycles; hypothesis validation
