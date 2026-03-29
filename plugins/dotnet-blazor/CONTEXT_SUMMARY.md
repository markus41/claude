# .NET Blazor Expert - Context Summary

Full-stack .NET 10 expert plugin (v1.0.0) with 8 commands, 6 agents, and 15 skills covering Blazor Web Apps, ASP.NET Core APIs, C# microservices, Syncfusion UI, .NET Aspire orchestration, Entity Framework Core, gRPC, SignalR, and cloud-native deployment.

## What this plugin is best at

- Scaffolding complete Blazor Web App solutions with proper render mode configuration (Server, WebAssembly, Auto)
- Building ASP.NET Core minimal APIs and controller-based APIs with OpenAPI support
- Designing C# microservices with .NET Aspire service orchestration
- Integrating Syncfusion Blazor UI components (DataGrid, Charts, Scheduler, RichTextEditor, PDF Viewer)
- Implementing Entity Framework Core data access with migrations, relationships, and performance tuning
- Setting up authentication/authorization with ASP.NET Core Identity, Entra ID, and JWT
- Building real-time features with SignalR and Blazor Server
- Creating gRPC services for inter-service communication
- Writing comprehensive tests with xUnit, bUnit, and integration testing
- Deploying to Azure with .NET Aspire, Docker containers, and CI/CD pipelines

## Core assets

| Asset | Purpose |
|-------|---------|
| `commands/blazor-new.md` | Scaffold new Blazor Web App, API, or microservice solution |
| `commands/blazor-component.md` | Generate Blazor components with proper render modes and lifecycle |
| `commands/blazor-api.md` | Create ASP.NET Core API endpoints (minimal or controller) |
| `commands/blazor-microservice.md` | Design and scaffold microservice with Aspire integration |
| `commands/blazor-deploy.md` | Deploy to Azure, Docker, or Kubernetes |
| `commands/blazor-test.md` | Generate and run tests (xUnit, bUnit, integration) |
| `commands/blazor-scaffold.md` | Scaffold CRUD pages, forms, and data grids from EF models |
| `commands/blazor-migrate.md` | Migrate from older .NET versions or other frameworks |
| `agents/blazor-architect.md` | Solution architecture and technology selection |
| `agents/aspnet-api-engineer.md` | API design, implementation, and optimization |
| `agents/microservices-designer.md` | Microservice decomposition and communication patterns |
| `agents/syncfusion-ui-specialist.md` | Syncfusion component selection, configuration, and theming |
| `agents/dotnet-performance-engineer.md` | Performance profiling, optimization, and benchmarking |
| `agents/csharp-expert.md` | Advanced C# patterns, LINQ, async/await, source generators |

## Key technology coverage

- **Blazor**: Web App unified model, Server/WASM/Auto render modes, components, forms, routing, JS interop
- **ASP.NET Core**: Minimal APIs, controllers, middleware, filters, OpenAPI, rate limiting, output caching
- **Microservices**: .NET Aspire, gRPC, message queues, saga patterns, API gateways, health checks
- **Data**: Entity Framework Core, Dapper, SQL Server, PostgreSQL, Cosmos DB, Redis caching
- **UI**: Syncfusion Blazor (100+ components), Fluent UI Blazor, MudBlazor, CSS isolation
- **Auth**: ASP.NET Core Identity, Entra ID/Azure AD, JWT Bearer, OAuth2/OIDC, policy-based authorization
- **Testing**: xUnit, bUnit, WebApplicationFactory, Testcontainers, Playwright for E2E
- **Cloud**: .NET Aspire, Azure App Service, Azure Container Apps, Docker, Kubernetes, GitHub Actions

## When to open deeper docs

| Signal | Open docs | Why |
|--------|-----------|-----|
| User creates new project | `commands/blazor-new.md` | Correct solution structure and render mode setup |
| User builds UI components | `skills/blazor-components/SKILL.md` + `skills/syncfusion-blazor/SKILL.md` | Component patterns and Syncfusion integration |
| User designs API layer | `commands/blazor-api.md` + `agents/aspnet-api-engineer.md` | Proper API patterns and best practices |
| User plans microservices | `agents/microservices-designer.md` + `skills/microservices-patterns/SKILL.md` | Decomposition strategies and communication |
| User needs data access | `skills/entity-framework/SKILL.md` | EF Core patterns, migrations, performance |
| User needs auth | `skills/blazor-auth-security/SKILL.md` | Identity, Entra ID, JWT, policies |
| User needs performance help | `agents/dotnet-performance-engineer.md` + `skills/blazor-performance/SKILL.md` | Profiling, caching, render optimization |
| User deploys | `commands/blazor-deploy.md` + `skills/cloud-native-deploy/SKILL.md` | Aspire, Docker, Azure deployment |
| User writes tests | `commands/blazor-test.md` + `skills/blazor-testing/SKILL.md` | xUnit, bUnit, integration testing |
| User migrates | `commands/blazor-migrate.md` | Version upgrades and framework migration |
