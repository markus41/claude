# .NET Blazor Expert Plugin - Routing Guide

## Quick command reference

| Command | When to use |
|---------|------------|
| `/blazor-new` | Create a new Blazor Web App, API, or microservice solution |
| `/blazor-component` | Generate Blazor components with proper render modes |
| `/blazor-api` | Create ASP.NET Core API endpoints |
| `/blazor-microservice` | Design and scaffold a microservice |
| `/blazor-deploy` | Deploy to Azure, Docker, or Kubernetes |
| `/blazor-test` | Generate and run tests |
| `/blazor-scaffold` | Scaffold CRUD pages from EF Core models |
| `/blazor-migrate` | Migrate from older .NET or other frameworks |

## Agent routing

| Agent | Activate when |
|-------|--------------|
| `blazor-architect` | Solution structure decisions, technology selection, render mode strategy |
| `aspnet-api-engineer` | API design, endpoint patterns, middleware, OpenAPI |
| `microservices-designer` | Service decomposition, inter-service communication, Aspire orchestration |
| `syncfusion-ui-specialist` | Syncfusion component integration, theming, licensing, customization |
| `dotnet-performance-engineer` | Slow queries, render bottlenecks, memory leaks, benchmarking |
| `csharp-expert` | Advanced C# patterns, LINQ optimization, async/await, source generators |

## Mandatory conventions

- Always target .NET 10 (net10.0) unless user specifies otherwise
- Use file-scoped namespaces (`namespace X;`) not block-scoped
- Use primary constructors for DI in .NET 10
- Prefer minimal APIs for new API endpoints unless user requests controllers
- Use `IResult` return types for minimal API endpoints
- Always set render mode explicitly on Blazor components: `@rendermode InteractiveServer`, `@rendermode InteractiveWebAssembly`, or `@rendermode InteractiveAuto`
- Use `[SupplyParameterFromQuery]` for query string binding
- Use `@attribute [StreamRendering]` for streaming SSR components
- EF Core: always use async methods (`ToListAsync`, `FirstOrDefaultAsync`)
- Include `global using` directives in `GlobalUsings.cs`
- Use `sealed` on classes that should not be inherited
- Nullable reference types enabled by default (`<Nullable>enable</Nullable>`)

## Prohibited actions

- Never use `Startup.cs` class (use `Program.cs` with minimal hosting)
- Never use `@page` without also considering `@rendermode`
- Never use synchronous EF Core methods in Blazor components
- Never put business logic in Blazor components (use services)
- Never store secrets in `appsettings.json` (use User Secrets or Azure Key Vault)
- Never use `HttpClient` directly in components (use typed clients via DI)
- Never disable nullable reference types

## Validation checks

Before completing any .NET task:
1. Verify `dotnet build` compiles without errors
2. Verify `dotnet test` passes (if tests exist)
3. Verify render modes are explicitly set on interactive components
4. Verify async/await is used consistently (no sync-over-async)
5. Verify no secrets in source files

## MCP and documentation tools

When researching .NET topics:
- Use `mcp__plugin_context7_context7__query-docs` for Blazor/ASP.NET/EF Core docs
- Use `mcp__de6582f3__microsoft_docs_search` for Microsoft Learn articles
- Use `mcp__de6582f3__microsoft_code_sample_search` for C# code samples
- Use `mcp__de6582f3__microsoft_docs_fetch` for full doc page content
- Check Syncfusion Blazor docs at blazor.syncfusion.com for UI components

## Context budget

- CONTEXT_SUMMARY.md is always loaded (bootstrap)
- Load specific command/agent/skill only when relevant
- Prefer skills for deep-dive knowledge, commands for actionable workflows
- Use agents for complex multi-step architectural decisions
