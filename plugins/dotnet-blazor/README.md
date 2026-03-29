# .NET Blazor Expert Plugin

Comprehensive .NET 10, Blazor, ASP.NET Core, C#, and Syncfusion expert plugin for building modern web apps, microservices, and cloud-native solutions.

## What's Included

| Type | Count | Coverage |
|------|-------|---------|
| **Commands** | 8 | blazor-new, blazor-component, blazor-api, blazor-microservice, blazor-deploy, blazor-test, blazor-scaffold, blazor-migrate |
| **Agents** | 6 | blazor-architect, aspnet-api-engineer, microservices-designer, syncfusion-ui-specialist, dotnet-performance-engineer, csharp-expert |
| **Skills** | 19 | Blazor components, forms, auth, performance, JS interop, ASP.NET APIs, microservices, DDD/CQRS, .NET Aspire, EF Core, Syncfusion, C# patterns, SignalR, gRPC, testing, deployment, Docker, worker services, .NET AI |
| **References** | 310+ | Microsoft Learn docs, Syncfusion docs, GitHub repos, community resources |

## Key Features

- **Blazor Web App** - Server, WebAssembly, Auto render modes, streaming SSR, prerendering
- **ASP.NET Core APIs** - Minimal APIs, controllers, middleware, rate limiting, Native AOT
- **Microservices** - .NET Aspire orchestration, gRPC, RabbitMQ, saga patterns, API gateways
- **DDD/CQRS** - Aggregates, value objects, domain events, MediatR, repository pattern
- **Syncfusion UI** - DataGrid, Charts, Scheduler, 80+ components, Agentic UI Builder, MCP
- **Entity Framework Core** - Migrations, query optimization, bulk operations, DDD mapping
- **C# 13/15** - Primary constructors, records, pattern matching, collection expressions
- **.NET AI** - Microsoft.Extensions.AI, Semantic Kernel, MCP servers, vector search
- **Authentication** - ASP.NET Core Identity, Entra ID, JWT, policy-based authorization
- **Deployment** - Azure App Service, Container Apps, Docker, Kubernetes, GitHub Actions

## MCP Integration

This plugin leverages:
- **Syncfusion Blazor MCP** (`@syncfusion/blazor-assistant`) - Component code generation and docs
- **Microsoft Learn MCP** - Official .NET documentation search and fetch
- **Context7 MCP** - Library documentation for Blazor/ASP.NET/EF Core

## Commands

| Command | Description |
|---------|-------------|
| `/blazor-new` | Scaffold new Blazor Web App, API, or microservice solution |
| `/blazor-component` | Generate components with proper render modes and lifecycle |
| `/blazor-api` | Create ASP.NET Core API endpoints (minimal or controller) |
| `/blazor-microservice` | Design microservice with Aspire integration |
| `/blazor-deploy` | Deploy to Azure, Docker, or Kubernetes |
| `/blazor-test` | Generate xUnit, bUnit, and integration tests |
| `/blazor-scaffold` | Scaffold CRUD pages from EF Core models |
| `/blazor-migrate` | Migrate from older .NET or other frameworks |

## Agents

| Agent | Model | Specialty |
|-------|-------|-----------|
| `blazor-architect` | opus | Solution structure, render mode strategy, technology selection |
| `aspnet-api-engineer` | sonnet | API design, OpenAPI, validation, caching, rate limiting |
| `microservices-designer` | opus | Service decomposition, Aspire, gRPC, messaging |
| `syncfusion-ui-specialist` | sonnet | Syncfusion components, theming, Essential UI Kit |
| `dotnet-performance-engineer` | sonnet | Profiling, caching, render optimization |
| `csharp-expert` | sonnet | Modern C# patterns, LINQ, async/await |

## Installation

This plugin is included in the `markus41/claude` repository under `plugins/dotnet-blazor/`.

To activate the Syncfusion MCP, set the `SYNCFUSION_API_KEY` environment variable.

## Version

**v2.0.0** - Full-stack .NET 10 expert with 19 skills, verified documentation from Microsoft Learn.
