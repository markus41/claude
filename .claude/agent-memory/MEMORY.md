# Researcher Agent Memory Index

## Overview
This directory contains cross-session knowledge for the researcher agent. Memory files help avoid repeating research and provide context for ongoing investigations.

## Memory Files

### Reference Materials
- [claude_agent_sdk_comprehensive.md](./claude_agent_sdk_comprehensive.md) — Complete Claude Agent SDK documentation from official docs. Covers: architecture, subagents with context isolation, hooks system, MCP integration (external + in-process custom tools), sessions (continue/resume/fork), plugins, permissions, Python & TypeScript APIs, custom tools pattern, built-in tools, tool search for scale. Includes code examples, class definitions, and relevance analysis for Golden Armada orchestration platform.
- [aspnetcore_10_fundamentals.md](./aspnetcore_10_fundamentals.md) — Complete ASP.NET Core 10 fundamentals from 8 Microsoft Learn pages. Covers: middleware pipeline architecture, routing system with constraints/groups/filters, dependency injection, rate limiting (fixed/sliding/token/concurrency), Native AOT configuration, minimal APIs, options pattern with validation, runtime environments. Includes complete Program.cs examples, endpoint definitions, partitioned rate limiting strategies, and environment-specific configuration patterns.
- [dotnet_microservices_comprehensive.md](./dotnet_microservices_comprehensive.md) — Complete .NET microservices architecture patterns from 13 Microsoft Learn pages. Covers: Circuit Breaker/Polly, Auth (Identity/JWT/OIDC/IdentityServer), Azure Key Vault, Docker Compose multi-environment, EF Core CRUD, RabbitMQ event-driven patterns, IHostedService background tasks, Ocelot API Gateways, testing strategies, microservice design, Dockerfile optimization, K8s Ingress. Includes code examples, configuration templates, testing patterns, and scenario checklists.
- [context7_mcp_research.md](./context7_mcp_research.md) — Complete Context7 MCP capabilities, supported libraries (9000+), documentation retrieval, integration patterns for quality audits and planning agents. Key findings: two-tool system (resolve-library-id + query-docs), 100x performance improvement with caching, best practices for audit/planning/review workflows.

## How to Use This Memory

1. **Check this index** at the start of research tasks to see what has been investigated
2. **Read relevant files** to understand prior findings before starting new research
3. **Update files** when new information becomes available or findings change
4. **Add new files** for new research topics (use descriptive names)

## Research Topics Covered

- **ASP.NET Core 10 Fundamentals**: 8 Microsoft Learn pages covering middleware, routing, DI, rate limiting, Native AOT, minimal APIs, options pattern, and environments
- **.NET Microservices Architecture**: 13 Microsoft Learn pages covering resilience patterns, security, Docker Compose, EF Core, event-driven communication, RabbitMQ, background tasks, API Gateways, testing, and Kubernetes
- **Context7 MCP**: Complete research on capabilities, integration, performance
- (More topics will be added as research expands)

## Last Updated
2026-03-29 — Added comprehensive ASP.NET Core 10 fundamentals research from 8 Microsoft Learn pages with complete middleware pipeline, routing, DI, rate limiting, Native AOT, minimal APIs patterns and code examples

