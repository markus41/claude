# .NET Blazor Expert - Extended Context

## Architecture Overview

This plugin provides comprehensive .NET 10 development expertise across the full stack:

```
┌─────────────────────────────────────────────────────┐
│                    Blazor Web App                     │
│  (Components, Pages, Layouts, Forms, JS Interop)     │
│  Render Modes: Server | WebAssembly | Auto | SSR     │
├──────────────────────┬──────────────────────────────┤
│   Syncfusion UI      │      Fluent UI / MudBlazor   │
│   100+ Components    │      Alternative UI libs      │
├──────────────────────┴──────────────────────────────┤
│              ASP.NET Core                             │
│  (Minimal APIs, Controllers, Middleware, SignalR)     │
├─────────────────────────────────────────────────────┤
│              Application Layer                        │
│  (Services, CQRS, Validation, Mapping)               │
├─────────────────────────────────────────────────────┤
│              Domain Layer                             │
│  (Entities, Value Objects, Domain Events)             │
├─────────────────────────────────────────────────────┤
│              Infrastructure                           │
│  (EF Core, Redis, RabbitMQ, gRPC, External APIs)     │
├─────────────────────────────────────────────────────┤
│              .NET Aspire                              │
│  (Orchestration, Service Discovery, Telemetry)       │
├─────────────────────────────────────────────────────┤
│              Deployment                               │
│  (Azure Container Apps, Docker, K8s, GitHub Actions) │
└─────────────────────────────────────────────────────┘
```

## Technology Decision Matrix

| Scenario | Recommended Stack |
|----------|------------------|
| Internal admin app | Blazor Server + Syncfusion DataGrid + SQL Server + EF Core |
| Public web app | Blazor Web App (Auto mode) + SSR pages + Redis cache |
| SaaS multi-tenant | Blazor + ASP.NET Core + EF Core (schema-per-tenant) + Entra ID |
| Microservices platform | .NET Aspire + gRPC (internal) + REST (external) + RabbitMQ |
| Real-time dashboard | Blazor Server + SignalR + Redis pub/sub |
| E-commerce | Blazor Web App + Syncfusion + Stripe + EF Core + Azure |

## Documentation Reference URLs

### Official Blazor Documentation
- Blazor overview: https://dotnet.microsoft.com/en-us/apps/aspnet/web-apps/blazor
- Blazor tutorials: https://learn.microsoft.com/en-us/aspnet/core/blazor/tutorials/?view=aspnetcore-10.0
- Blazor fundamentals: https://learn.microsoft.com/en-us/aspnet/core/blazor/fundamentals/?view=aspnetcore-10.0
- Blazor forms: https://learn.microsoft.com/en-us/aspnet/core/blazor/forms/?view=aspnetcore-10.0
- Blazor security: https://learn.microsoft.com/en-us/aspnet/core/blazor/security/?view=aspnetcore-10.0
- Blazor performance: https://learn.microsoft.com/en-us/aspnet/core/blazor/performance/?view=aspnetcore-10.0
- Blazor JS interop: https://learn.microsoft.com/en-us/aspnet/core/blazor/javascript-interoperability/?view=aspnetcore-10.0
- First Blazor app tutorial: https://dotnet.microsoft.com/en-us/learn/aspnet/blazor-tutorial/intro
- Blazor learning path: https://learn.microsoft.com/en-us/training/paths/build-web-apps-with-blazor/

### ASP.NET Core
- ASP.NET Core 10 docs: https://learn.microsoft.com/en-us/aspnet/core/?view=aspnetcore-10.0
- ASP.NET overview: https://dotnet.microsoft.com/en-us/apps/aspnet
- ASP.NET APIs: https://dotnet.microsoft.com/en-us/apps/aspnet/apis
- ASP.NET MVC: https://dotnet.microsoft.com/en-us/apps/aspnet/mvc
- Microservices: https://dotnet.microsoft.com/en-us/apps/aspnet/microservices
- Architecture guides: https://dotnet.microsoft.com/en-us/learn/dotnet/architecture-guides
- Get started: https://learn.microsoft.com/en-us/aspnet/core/get-started?view=aspnetcore-10.0

### .NET Core and C#
- .NET documentation hub: https://learn.microsoft.com/en-us/dotnet/?WT.mc_id=dotnet-35129-website
- C# language docs: https://learn.microsoft.com/en-us/dotnet/csharp/
- C# learning hub: https://dotnet.microsoft.com/en-us/learn/csharp
- C# tutorials: https://learn.microsoft.com/en-us/dotnet/csharp/tour-of-csharp/tutorials/
- .NET learning center: https://dotnet.microsoft.com/en-us/learn
- .NET getting started: https://learn.microsoft.com/en-us/dotnet/core/get-started
- .NET tutorials: https://learn.microsoft.com/en-us/dotnet/core/tutorials/
- Hello World tutorial: https://dotnet.microsoft.com/en-us/learn/dotnet/hello-world-tutorial/intro

### C# Learning Paths
- First C# code part 1: https://learn.microsoft.com/en-us/training/paths/get-started-c-sharp-part-1/
- Build .NET apps with C#: https://learn.microsoft.com/en-us/training/paths/build-dotnet-applications-csharp/
- C# for Beginners video: https://learn.microsoft.com/en-us/shows/csharp-for-beginners/
- C# Fundamentals series: https://learn.microsoft.com/en-us/shows/c-fundamentals-for-absolute-beginners/
- .NET training: https://learn.microsoft.com/en-us/training/dotnet/

### .NET Aspire
- Aspire docs: https://aspire.dev/docs/
- What is Aspire: https://aspire.dev/get-started/what-is-aspire/
- Aspire get started: https://aspire.dev/docs/get-started/
- Aspire prerequisites: https://aspire.dev/docs/get-started/prerequisites/
- Install Aspire CLI: https://aspire.dev/docs/get-started/install-cli/
- Build first Aspire app: https://aspire.dev/docs/get-started/build-your-first-app/
- First Aspire app tutorial: https://aspire.dev/get-started/first-app/
- Aspire architecture: https://aspire.dev/architecture/overview/
- AppHost: https://aspire.dev/architecture/app-host/
- Aspire components: https://aspire.dev/architecture/components/
- Aspire dashboard: https://aspire.dev/architecture/dashboard/
- Aspire docs samples: https://github.com/MicrosoftDocs/aspire-docs-samples
- Aspire videos: https://aka.ms/aspire/videos
- Cloud learning: https://dotnet.microsoft.com/en-us/learn/cloud
- Cloud apps with .NET: https://dotnet.microsoft.com/en-us/apps/cloud

### Syncfusion Blazor
- Essential UI Kit blocks: https://blazor.syncfusion.com/essential-ui-kit/blocks
- Grid blocks: https://blazor.syncfusion.com/essential-ui-kit/blocks/grid
- ThemeStudio: https://blazor.syncfusion.com/themestudio/

### Entity Framework Core
- EF Core docs: https://learn.microsoft.com/en-us/ef/

### Microservices Architecture (DDD/CQRS)
- DDD-oriented microservice: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
- Domain model design: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model
- Application layer design: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-application-layer-web-api-design
- Simplified CQRS/DDD: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/apply-simplified-microservice-cqrs-ddd-patterns
- Domain events: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation
- Domain validations: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-model-layer-validations
- EF Core persistence: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-implementation-entity-framework-core
- Persistence layer design: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-design
- NoSQL persistence: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/nosql-database-persistence-infrastructure
- Resilient applications: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/
- Circuit breaker pattern: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/implement-circuit-breaker-pattern
- Microservice security: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/
- Azure Key Vault secrets: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/azure-key-vault-protects-secrets
- Multi-container apps: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/
- Application design: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/microservice-application-design
- CRUD microservice: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/data-driven-crud-microservice
- Docker Compose: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/multi-container-applications-docker-compose
- Integration events: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/integration-event-based-microservice-communications
- RabbitMQ event bus: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/rabbitmq-event-bus-development-test-environment
- Testing microservices: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/test-aspnet-core-services-web-apps
- Background tasks: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/background-tasks-with-ihostedservice
- API gateways: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/implement-api-gateways-with-ocelot
- API versioning: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/maintain-microservice-apis
- Composite UI: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/microservice-based-composite-ui-shape-layout
- Async messaging: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/asynchronous-message-based-communication
- API Gateway pattern: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/direct-client-to-microservice-communication-versus-the-api-gateway-pattern
- Data sovereignty: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/data-sovereignty-per-microservice
- Logical vs physical architecture: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/logical-versus-physical-architecture
- DDD no-nonsense guide: https://particular.net/webinars/ddd-design-no-nonsense-implementation-guide

### .NET Fundamentals
- .NET what's new: https://learn.microsoft.com/en-us/dotnet/whats-new/
- C# 15 what's new: https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-15
- .NET 10 overview: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview
- .NET 11 libraries: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-11/libraries
- ASP.NET Core 11 release notes: https://learn.microsoft.com/en-us/aspnet/core/release-notes/aspnetcore-11?view=aspnetcore-10.0&tabs=minimal-apis
- .NET app types: https://learn.microsoft.com/en-us/dotnet/core/apps
- .NET languages: https://learn.microsoft.com/en-us/dotnet/fundamentals/languages
- Class libraries: https://learn.microsoft.com/en-us/dotnet/standard/class-libraries
- .NET Standard: https://learn.microsoft.com/en-us/dotnet/standard/net-standard?tabs=net-standard-1-0
- Common Type System: https://learn.microsoft.com/en-us/dotnet/standard/base-types/common-type-system
- CLR overview: https://learn.microsoft.com/en-us/dotnet/standard/clr
- Assemblies: https://learn.microsoft.com/en-us/dotnet/standard/assembly/
- Reflection: https://learn.microsoft.com/en-us/dotnet/fundamentals/reflection/overview
- Worker services: https://learn.microsoft.com/en-us/dotnet/core/extensions/workers
- Runtime config: https://learn.microsoft.com/en-us/dotnet/core/runtime-config/
- AssemblyLoadContext: https://learn.microsoft.com/en-us/dotnet/core/dependency-loading/understanding-assemblyloadcontext
- MEF (extensibility): https://learn.microsoft.com/en-us/dotnet/standard/mef/
- File globbing: https://learn.microsoft.com/en-us/dotnet/core/extensions/file-globbing
- .NET glossary: https://learn.microsoft.com/en-us/dotnet/standard/glossary

### AI and ML with .NET
- .NET AI overview: https://dotnet.microsoft.com/en-us/apps/ai
- .NET AI docs: https://learn.microsoft.com/en-us/dotnet/ai/
- .NET AI overview article: https://learn.microsoft.com/en-us/dotnet/ai/overview
- .NET AI ecosystem: https://learn.microsoft.com/en-us/dotnet/ai/dotnet-ai-ecosystem
- Microsoft.Extensions.AI: https://learn.microsoft.com/en-us/dotnet/ai/microsoft-extensions-ai
- .NET Agent Framework: https://learn.microsoft.com/en-us/agent-framework/overview/?toc=%2Fdotnet%2Fai%2Ftoc.json&bc=%2Fdotnet%2Fai%2Ftoc.json&pivots=programming-language-csharp
- IEmbeddingGenerator: https://learn.microsoft.com/en-us/dotnet/ai/iembeddinggenerator
- Prompt a model: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/prompt-model?pivots=openai
- Function calling: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/use-function-calling?pivots=openai
- Vector search app: https://learn.microsoft.com/en-us/dotnet/ai/vector-stores/how-to/build-vector-search-app?pivots=openai
- How GenAI/LLMs work: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/how-genai-and-llms-work
- AI Agents concept: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/agents
- Prompt engineering for .NET: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/prompt-engineering-dotnet
- Zero-shot learning: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/zero-shot-learning
- AI tools concept: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/ai-tools
- Tokenizers: https://learn.microsoft.com/en-us/dotnet/ai/how-to/use-tokenizers
- Azure AI resources: https://learn.microsoft.com/en-us/dotnet/ai/resources/azure-ai
- MCP in .NET: https://learn.microsoft.com/en-us/dotnet/ai/get-started-mcp
- Build MCP client: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-client
- Build MCP server: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-server?pivots=visualstudio
- MCP servers list: https://learn.microsoft.com/en-us/dotnet/ai/resources/mcp-servers
- Semantic Kernel docs: https://learn.microsoft.com/en-us/semantic-kernel/
- Semantic Kernel GitHub: https://github.com/dotnet/semantic-kernel
- ML.NET docs: https://learn.microsoft.com/en-us/dotnet/machine-learning/
- Azure AI services: https://azure.microsoft.com/en-us/products/ai-services/
- Azure AI Search: https://azure.microsoft.com/en-us/products/ai-search/

### Tooling
- C# Dev Kit for VS Code: https://marketplace.visualstudio.com/items?itemName=ms-dotnettools.csdevkit
- Azure Developer CLI: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/overview
- azd templates: https://learn.microsoft.com/en-us/azure/developer/azure-developer-cli/azd-templates

### NuGet Package Management
- NuGet documentation: https://learn.microsoft.com/en-us/nuget/
- NuGet package search: https://www.nuget.org/
- Central package management: https://learn.microsoft.com/en-us/nuget/consume-packages/Central-Package-Management

### Community Resources
- Awesome Blazor (curated list): https://github.com/AdrienTorris/awesome-blazor
- Awesome Blazor libraries & extensions: https://github.com/AdrienTorris/awesome-blazor?WT.mc_id=dotnet-35129-website#libraries--extensions
- Blazor Extensions ChartJS: https://github.com/BlazorExtensions/ChartJS
- Fluent UI Blazor: https://www.fluentui-blazor.net/InputFile
- Aspire deep dive blog: https://codewithmukesh.com/blog/aspire-for-dotnet-developers-deep-dive/
- Cloud design patterns with Aspire: https://developersvoice.com/blog/cloud-design-patterns/dotnet-aspire-cloud-native/

### Video Tutorials
- Demystify cloud-native with Aspire: https://www.youtube.com/watch?v=jVILDZtuUrI
- Aspire new features: https://www.youtube.com/watch?v=vAtGEoOf9WY
- Aspire CLI tutorial: https://www.youtube.com/watch?v=nP_1aWobD3w
- Getting started with Aspire: https://www.youtube.com/watch?v=cuOTZuKrO04
- Extending Aspire: https://www.youtube.com/watch?v=UQiL3nbQbtM
- Aspire in Action: https://www.youtube.com/watch?v=7RnRks0Bg6k
- Beginner's guide to Aspire: https://www.youtube.com/watch?v=e36NEWqO7GQ
- Beginner Blazor tutorial: https://www.youtube.com/watch?v=5dveF5Ctrho
- Blazor in .NET 9 intro: https://www.youtube.com/watch?v=MPFFLMautHw

## MCP Tool Usage

When working on .NET projects, use these MCP tools for documentation:

### Context7 (Library Docs)
```
mcp__plugin_context7_context7__resolve-library-id → Find library ID
mcp__plugin_context7_context7__query-docs → Get current docs
```

### Microsoft Learn Docs
```
mcp__de6582f3__microsoft_docs_search → Search MS Learn
mcp__de6582f3__microsoft_code_sample_search → Find C# code samples
mcp__de6582f3__microsoft_docs_fetch → Fetch full doc pages
```

### Firecrawl (External Docs)
```
mcp__firecrawl__firecrawl_scrape → Scrape Syncfusion docs, blog posts
mcp__firecrawl__firecrawl_search → Search for .NET tutorials
```

## NuGet Package Reference

### Core
| Package | Purpose |
|---------|---------|
| `Microsoft.AspNetCore.Components.WebAssembly` | Blazor WASM runtime |
| `Microsoft.AspNetCore.Identity.EntityFrameworkCore` | Identity with EF Core |
| `Microsoft.Identity.Web` | Entra ID / Azure AD auth |
| `Microsoft.EntityFrameworkCore.SqlServer` | SQL Server provider |
| `Npgsql.EntityFrameworkCore.PostgreSQL` | PostgreSQL provider |
| `Microsoft.EntityFrameworkCore.Cosmos` | Cosmos DB provider |

### UI Frameworks
| Package | Purpose |
|---------|---------|
| `Syncfusion.Blazor.Core` | Syncfusion base |
| `Syncfusion.Blazor.Grid` | DataGrid component |
| `Syncfusion.Blazor.Charts` | Chart components |
| `Syncfusion.Blazor.Schedule` | Scheduler |
| `Syncfusion.Blazor.Themes` | Built-in themes |
| `Microsoft.FluentUI.AspNetCore.Components` | Fluent UI for Blazor |
| `MudBlazor` | Material Design UI |

### Microservices & Communication
| Package | Purpose |
|---------|---------|
| `Grpc.AspNetCore` | gRPC server |
| `Grpc.Net.Client` | gRPC client |
| `MassTransit.RabbitMQ` | RabbitMQ via MassTransit |
| `MassTransit.Azure.ServiceBus.Core` | Azure Service Bus |
| `Microsoft.Extensions.Http.Resilience` | HTTP resilience (Polly v8) |

### Aspire Components
| Package | Purpose |
|---------|---------|
| `Aspire.Hosting` | AppHost orchestration |
| `Aspire.Npgsql.EntityFrameworkCore.PostgreSQL` | PostgreSQL integration |
| `Aspire.StackExchange.Redis.DistributedCaching` | Redis caching |
| `Aspire.RabbitMQ.Client` | RabbitMQ integration |

### Testing
| Package | Purpose |
|---------|---------|
| `bunit` | Blazor component testing |
| `xunit` | Test framework |
| `FluentAssertions` | Assertion library |
| `NSubstitute` | Mocking library |
| `Microsoft.AspNetCore.Mvc.Testing` | API integration tests |
| `Testcontainers.PostgreSql` | Real DB in tests |
| `Microsoft.Playwright` | E2E browser testing |

### Utilities
| Package | Purpose |
|---------|---------|
| `FluentValidation.AspNetCore` | Model validation |
| `AutoMapper` | Object mapping |
| `Serilog.AspNetCore` | Structured logging |
| `BenchmarkDotNet` | Performance benchmarking |
| `Bogus` | Fake data generation for tests |
