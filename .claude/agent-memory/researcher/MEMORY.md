---
name: Researcher Agent Memory Index
description: Central index of research findings and documentation knowledge bases maintained by the researcher agent
type: reference
---

# Researcher Agent Memory Index

This directory maintains structured research findings and documentation knowledge bases for reuse across sessions.

## Knowledge Bases

### .NET/Blazor Comprehensive Documentation
- **File**: `dotnet_blazor_research.md`
- **Date**: 2026-03-29
- **Coverage**:
  - Blazor Web App render modes (.NET 10): InteractiveServer, InteractiveWebAssembly, InteractiveAuto, Static
  - Blazor component lifecycle: SetParametersAsync, OnInitialized, OnParametersSet, OnAfterRender, Dispose
  - ASP.NET Core microservices: gRPC, REST/HTTP, event-driven patterns
  - .NET Aspire orchestration: service discovery, configuration, health checks
  - Entity Framework Core: DbContext, relationships, queries, aggregations
  - Authentication & Authorization: JWT, claims, policies
  - JavaScript interop: JS modules, FFI patterns
  - SignalR: real-time hubs, messaging, groups
  - Syncfusion Blazor components: DataGrid, DatePicker, calendars
  - Key patterns: DI, cascading parameters, error boundaries, virtualization
  - Architecture recommendations: enterprise vs public vs hybrid

**Key Topics Covered**:
1. Render mode selection matrix (when to use each)
2. Complete component lifecycle with code examples
3. Microservices architecture patterns and communication
4. Resilience patterns (Circuit Breaker, Retry)
5. Database modeling with EF Core
6. Authentication flows and authorization policies
7. Real-time communication with SignalR
8. Professional UI components with Syncfusion

**Use for**: Architecture decisions, implementation patterns, best practices

---

### Domain-Driven Design & CQRS Patterns for .NET Microservices
- **File**: `ddd_cqrs_microservices.md`
- **Date**: 2026-03-29
- **Coverage**:
  - Domain model patterns: Entities, Value Objects, Aggregates, Aggregate Roots
  - EF Core persistence: POCO design, private fields, repository pattern, Specification pattern
  - Hi/Lo key generation, shadow properties, Fluent API configuration
  - Domain events: Design, implementation, event handlers, publishing strategies
  - Transactional boundaries: Single transaction vs eventual consistency
  - Domain validations: Exception-based, Specification, Notification patterns
  - Application layer: SOLID principles, Dependency Injection patterns
  - Simplified CQRS: Commands (writes) vs Queries (reads) separation
  - Layer integration: Request flow, decoupling between layers

**Key Topics Covered**:
1. Rich vs Anemic domain models (when to use each)
2. Complete entity & aggregate design with code examples
3. EF Core DDD-compliant patterns (private fields, read-only collections)
4. Repository & Specification patterns for queries
5. Domain events: Raising, dispatching, handling across aggregates
6. Validation strategies at domain vs application boundaries
7. CQRS separation for read/write optimization
8. Full request processing flow through all layers
9. Best practices & anti-patterns checklist

**Use for**: Microservice architecture design, DDD implementation guidance, CQRS patterns, validation strategy

---

### .NET Microservices Architecture & Fundamentals
- **File**: `dotnet_microservices_fundamentals.md`
- **Date**: 2026-03-29
- **Coverage**:
  - **API Versioning & Backward Compatibility**: Semantic versioning, additive changes, Mediator pattern, Hypermedia
  - **Composite UI / Micro-Frontends**: Monolithic vs Composite UI, Blazor integration, tradeoffs
  - **Async Messaging vs Sync Communication**: Single-receiver (commands), multi-receiver (events), event-driven patterns, message idempotence, resilient publishing (Outbox pattern, Event Sourcing)
  - **API Gateway Pattern**: Direct vs Gateway communication, BFF (Backend for Frontend), features, products (Azure API Management, Ocelot), drawbacks
  - **Data Sovereignty Per Microservice**: Database per service, Polyglot persistence, Eventual consistency, Bounded Context (DDD), integration event patterns
  - **Logical vs Physical Architecture**: 1:1, 1:many service mappings, service composition, scaling strategies
  - **C# 15 Features**: Collection expression arguments, union types, exhaustive matching
  - **C# 14 Features**: Field-backed properties, nameof for unbound generics, partial constructors, extension blocks, user-defined operators
  - **.NET 10 Major Features**: JIT improvements, NativeAOT, cryptography (post-quantum), JSON serialization, WebSocketStream, process management, container support
  - **Assemblies**: Deployment units, manifest, versioning, reference scope, side-by-side execution, for plugin systems
  - **Common Language Runtime (CLR)**: Type system, garbage collection (Workstation vs Server), metadata, managed code, assembly loading, reflection
  - **Reflection for Plugin Discovery**: Type/method inspection, attribute discovery, dynamic instantiation, performance considerations, NativeAOT limitations

**Key Topics Covered**:
1. Complete API versioning strategy with Mediator pattern example
2. Composite UI patterns for Blazor micro-frontends
3. Decision matrix for async vs sync communication
4. Event-driven architecture with idempotence and resilient publishing
5. API Gateway design principles and BFF pattern
6. Database per service strategy and Bounded Contexts
7. Multi-service deployment patterns (logical vs physical separation)
8. C# 15 union types for type-safe plugin contracts
9. .NET 10 post-quantum cryptography and container support
10. Reflection techniques for dynamic plugin discovery and instantiation
11. CLR fundamentals for plugin isolation and versioning

**Use for**: Plugin architecture design, microservice patterns, API contract evolution, data management strategy, C# modernization, reflection-based discovery, assembly versioning, cross-version compatibility

---

### .NET AI Extensions: Chat, Embeddings, MCP, Vector Stores, Tokenization
- **File**: `dotnet_ai_extensions_comprehensive.md`
- **Date**: 2026-03-29
- **Coverage**:
  - **NuGet Packages**: Microsoft.Extensions.AI, Microsoft.Extensions.AI.OpenAI, Microsoft.Extensions.VectorData, ModelContextProtocol, Microsoft.ML.Tokenizers, Azure.AI.OpenAI
  - **IChatClient**: OpenAI/Azure OpenAI integration, streaming, function invocation, middleware pipeline
  - **ChatClientBuilder**: Middleware composition (function invocation, caching, telemetry, OpenTelemetry)
  - **IEmbeddingGenerator**: Embedding generation, vector creation, rate-limiting middleware, custom implementations
  - **Vector Stores**: VectorData attributes, CRUD operations, semantic search, distance functions (cosine, euclidean, dot product)
  - **RAG Implementation**: Complete end-to-end vector search example with OpenAI embeddings
  - **MCP Protocol**: Server implementation with tools, stdio/HTTP transport, tool discovery, client integration
  - **MCP Servers**: Tool definition, environment variable configuration, NuGet publishing, server.json schema
  - **MCP Clients**: StdioClientTransport, McpClient initialization, tool listing, chat client integration
  - **Tokenization**: Tiktoken (GPT-4/5), Llama, BPE tokenizers; counting, encoding, decoding, trimming text
  - **Agent Concepts**: Reasoning + decision-making, tool usage, context awareness
  - **Workflow Orchestration**: Sequential, concurrent, handoff, group chat, magentic patterns

**Key Code Examples Included**:
1. Basic chat client creation (OpenAI + Azure OpenAI)
2. Function invocation with AIFunctionFactory
3. ChatClientBuilder with middleware pipeline
4. Embedding generation (basic + with caching middleware)
5. Custom rate-limiting embedding generator
6. Complete vector search RAG application
7. MCP server with RandomNumber + Weather tools
8. MCP client with chat integration
9. Tiktoken, Llama, and BPE tokenizers with all operations
10. VectorStore model definitions with attributes

**Installation Commands**:
- Minimal chat: `Microsoft.Extensions.AI`, `Microsoft.Extensions.AI.OpenAI --prerelease`
- Function calling: same as above
- Vector search: add `Microsoft.SemanticKernel.Connectors.InMemory --prerelease`
- MCP server: `dotnet new install Microsoft.McpServer.ProjectTemplates` + template generation
- MCP client: add `ModelContextProtocol --prerelease`
- Tokenization: `Microsoft.ML.Tokenizers` + `Microsoft.ML.Tokenizers.Data.O200kBase` (for Tiktoken)

**API Surface Summary**:
- IChatClient: `GetResponseAsync()`, `GetStreamingResponseAsync()`
- IEmbeddingGenerator: `GenerateAsync()`, `GenerateVectorAsync()`
- VectorStore: `UpsertAsync()`, `SearchAsync()`, `GetAsync()`, `DeleteAsync()`
- MCP: `McpClient.CreateAsync()`, `ListToolsAsync()`, tool invocation via chat middleware
- Tokenizers: `CountTokens()`, `EncodeToIds()`, `Decode()`, `EncodeToTokens()`, `GetIndexByTokenCount()`

**Use for**: Chat client implementation, function calling setup, embedding generation for search, vector database/RAG, MCP server/client development, token counting and management, agent architecture guidance

---

### .NET MAUI & Data API Builder Comprehensive Research
- **File**: `dotnet_maui_data_api_research.md`
- **Date**: 2026-03-29
- **Coverage**:
  - **.NET MAUI Local Data**: SQLite with sqlite-net-pcl (ORM) or Microsoft.Data.Sqlite (ADO.NET); lazy initialization, async CRUD, repository pattern
  - **.NET MAUI REST API**: HttpClient setup, JSON serialization, GET/POST/PUT/DELETE patterns, streaming large responses, error handling
  - **.NET MAUI Shell Navigation**: URI-based routing, absolute/relative routes, query parameters, object navigation, IQueryAttributable, navigation events, deferral
  - **.NET MAUI MVVM**: INotifyPropertyChanged interface, two-way binding, command binding (ICommand/RelayCommand), interactive examples
  - **Community Toolkit.Mvvm**: ObservableObject (replaces boilerplate), source generators ([ObservableProperty]), RelayCommand, messaging, IoC
  - **Data API Builder (DAB)**: Configuration-based REST/GraphQL generator; zero-code APIs; supports SQL/Cosmos/PostgreSQL/MySQL; authentication, security, deployment
  - **Pattern Overlap**: Identical MVVM in MAUI and Blazor; shared HttpClient API; REST consumption; DI patterns; async-first design
  - **SQLite Patterns**: Lazy async initialization, ORM object mapping, write-ahead logging, database copying/backup
  - **Shell Navigation Patterns**: Route hierarchy, contextual navigation, parameter passing (string vs object), navigation interception
  - **Authentication**: Entra ID, JWT, App Service EasyAuth, simulator for dev

**Key Code Examples Included**:
1. SQLite configuration constants and entity models
2. Database access class with lazy async initialization
3. Complete CRUD operations (async/await)
4. REST service class with HttpClient setup
5. GET/POST/PUT/DELETE with error handling
6. Large response streaming pattern
7. Shell route registration and GoToAsync patterns
8. Query parameter passing and receiving
9. IQueryAttributable implementation
10. Navigation event handling and deferral
11. INotifyPropertyChanged with CallerMemberName
12. Two-way binding in XAML
13. ICommand and RelayCommand with CanExecute
14. ObservableObject with source generators
15. Data API Builder configuration structure

**Decision Matrices Included**:
- SQLite package choice (sqlite-net-pcl vs Microsoft.Data.Sqlite)
- Navigation approach (absolute vs relative vs contextual)
- Data passing strategy (query strings vs object navigation vs single-use)
- MVVM implementation (manual INotifyPropertyChanged vs Community Toolkit)

**Use for**: .NET MAUI local data storage, REST API consumption, Shell navigation architecture, MVVM patterns, Data API Builder integration, comparison with Blazor patterns

---

### Blazor .NET 10 Comprehensive Documentation
- **File**: `blazor_net10_comprehensive.md`
- **Date**: 2026-03-29
- **Coverage**:
  - Component fundamentals: Structure, naming, implementation patterns (single-file, partial class, base class)
  - Component parameters: Basic, required, tuple, child content (RenderFragment), component references
  - Render modes (.NET 8+): InteractiveServer, InteractiveWebAssembly, InteractiveAuto, Static SSR selection matrix
  - Prerendering: Enable/disable strategies, handling client-side services, state persistence
  - State management: StateContainer, cascading values, root-level notifications
  - Routing: Templates, parameters, optional/catch-all, constraints, focus, async navigation events
  - Web API calls: HttpClient usage, error handling, POST requests with JSON
  - CSS isolation: Scoped CSS files, child component styling with `::deep`, custom scope identifiers
  - Blazor Hybrid: MAUI/WPF/Windows Forms integration, BlazorWebView, native interop, unhandled exceptions
  - Authentication: Microsoft Entra (Azure AD) setup, AuthorizeView, protected components
  - Progressive Web Apps: Creation, offline support, service workers, manifest, caching strategies
  - Advanced .NET 10: Static vs interactive routing, multiple assembly routing, lifecycle methods, MarkupString

**Key Topics Covered**:
1. Component patterns for different code organization styles
2. Render mode decision matrix with use cases
3. Prerendering configuration and client service resolution
4. In-memory state management with change notifications
5. Routing patterns including catch-all and constraints
6. HttpClient configuration and error handling
7. CSS isolation with deep selector for child components
8. Blazor Hybrid setup for MAUI/WPF/Windows Forms
9. Azure AD authentication integration
10. PWA offline-first architecture with cache strategies
11. Service worker configuration and update mechanisms

**Complete Code Examples**:
- Component structures (single-file, partial class, base class)
- Parameter patterns (basic, required, tuple, RenderFragment)
- Component references and lifecycle management
- All render mode configurations
- State container with event notifications
- Routing templates with constraints and catch-all
- HttpClient GET/POST with error handling
- CSS isolation with child component styling
- MAUI/WPF/Windows Forms BlazorWebView setup
- Azure AD authentication flow
- PWA manifest and service worker registration
- Cache-first strategy implementation

**Use for**: Blazor component design, render mode selection, state management architecture, routing implementation, CSS organization, hybrid mobile/desktop apps, authentication setup, offline-first PWA development, .NET 10 patterns

---

### ASP.NET Core 10.0 Comprehensive Reference
- **File**: `aspnet_core_comprehensive_guide.md`
- **Date**: 2026-03-29
- **Coverage**:
  - **Best Practices**: Caching, async patterns, blocking calls, pagination, large object allocation, data access optimization, HttpClientFactory, hot code paths, long-running tasks, client asset minification, response compression
  - **Performance**: IAsyncEnumerable patterns, HttpContext safety, response headers management, async void anti-pattern, form data handling, Content-Length null safety
  - **Security**: Authentication vs authorization, managed identities, never-store secrets, XSS prevention, SQL injection prevention, CSRF protection, open redirect prevention
  - **Localization**: Culture concepts, IStringLocalizer, resource files, culture selection (query string, cookies, Accept-Language), culture fallback, DataAnnotations localization
  - **Hosting & Deployment**: Publish process, self-contained vs framework-dependent, process managers (IIS, Windows Service, systemd), reverse proxy (Nginx), health checks
  - **Model Binding**: Binding sources, [FromQuery/FromBody/FromRoute] attributes, complex types, collections, simple type conversion, IParsable<T>, record types, JSON configuration, custom converters
  - **APIs**: Minimal APIs (recommended), controller-based APIs, routing, handlers, OpenAPI, authorization, custom validation, form data, dependency injection

**Key Code Examples Included**:
1. Async/await patterns (correct and wrong)
2. Pagination implementation
3. Large object and buffer pooling
4. HttpContext safety patterns
5. Fire-and-forget tasks with IServiceScopeFactory
6. Response header management
7. Authentication flows and secret management
8. XSS, SQL injection, CSRF, open redirect prevention
9. Localization setup with multiple cultures
10. Model binding with complex types and collections
11. IParsable<T> custom type conversion
12. Record type binding with validation
13. Minimal API complete CRUD example
14. Controller-based API with dependency injection
15. Health check implementation

**Decision Matrices**:
- Cache strategies (when to use memory vs distributed)
- Async patterns (when to use async/await vs Task.Run)
- Culture selection method (query string vs cookie vs header)
- API approach (Minimal APIs vs Controllers)
- Authentication method (managed identities vs OAuth2 vs direct)

**Pitfalls & Prevention**:
- Performance: Blocking calls, HttpClient creation, sync enumeration, stored HttpContext, large allocations
- Security: Untrusted ContentLength, unescaped HTML, SQL concatenation, open redirects, password exposure
- Binding: Null ContentLength, [FromBody] ignoring nested attributes, wrong prefix, missing validation

**Complete Patterns**:
- Async/pagination for collections
- HttpContext access during request scope only
- Background tasks with scoped services
- Multi-culture request handling
- Complex model binding with prefixes
- Minimal API handler patterns with DI
- Response compression and asset minification

**Use for**: Performance optimization, security hardening, localization implementation, model binding patterns, API design decisions, deployment configuration, best practices reference

---

### Microsoft Azure & .NET Deployment Comprehensive Guide
- **File**: `microsoft_azure_dotnet_deployment_guide.md`
- **Date**: 2026-03-29
- **Coverage**:
  - **Azure App Service Deployment**: .NET 10 quickstart, Visual Studio/CLI/PowerShell/Portal workflows, publish profiles, port bindings
  - **Azure SDK for .NET**: Package installation, authentication patterns (DefaultAzureCredential, connection strings), 4-step SDK implementation
  - **Key Azure Services**: App Service, Container Apps, Functions, SQL, Cosmos DB, Blob Storage, Service Bus, Key Vault, Foundry Tools (AI)
  - **App Service Migration**: On-premises to cloud, dependency assessment, port binding changes, database migration, AAD integration, configuration mapping
  - **Cross-Platform Targeting**: Framework selection (net8.0, netstandard2.0, net462), multi-targeting, conditional compilation, NuGet distribution
  - **Microservices Architecture**: Docker containers, synchronous (HTTP/gRPC) vs asynchronous (queues) communication, Kubernetes/Container Apps/App Service deployments
  - **Resilience Patterns**: Circuit Breaker, retry with exponential backoff, timeout protection (Polly library)
  - **Deployment Checklist**: Pre-deployment, configuration, post-deployment verification

**CLI Commands Included**:
- Azure: login, webapp up, config appsettings set, log tail, group delete
- .NET: new, restore, build, run, publish, test, add package
- Docker: build, run, push
- PowerShell: Connect-AzAccount, New-AzWebApp, Publish-AzWebApp

**Code Examples**:
1. Blazor Web App creation (CLI & Visual Studio)
2. Azure SDK client initialization (Blob Storage, Key Vault, Service Bus)
3. DefaultAzureCredential authentication pattern
4. WCF binding compatibility checks
5. App Service migration configuration mapping
6. Multi-target project files (net8.0;netstandard2.0;net462)
7. Conditional compilation for platform-specific APIs (#if NET462 patterns)
8. Docker microservice Dockerfile
9. Docker Compose multi-service setup
10. Synchronous & asynchronous service communication patterns
11. Circuit Breaker/Retry/Timeout resilience patterns
12. Kubernetes Deployment manifests
13. Azure Container Apps deployment commands

**Decision Matrices**:
- Service selection (App Service vs Container Apps vs Functions)
- Data storage choice (SQL vs Cosmos vs Storage)
- Communication pattern (sync HTTP vs async queues)
- Framework targeting (net8.0, net462, netstandard2.0)
- Deployment orchestration (K8s, Container Apps, App Service)

**Gotchas & Solutions**:
- Port binding restrictions (80/443 only)
- Free tier AAD limitations
- Database connection timeouts
- Multi-target dependency hell
- Large deployment slowness

**Use for**: Azure App Service deployment steps, SDK authentication patterns, cross-platform library design, microservices deployment, migration planning, framework selection, resilience pattern implementation, CLI command reference

---

### MicrosoftDocs Learning Sample Repository Catalog
- **File**: `microsoftdocs_learning_samples.md`
- **Date**: 2026-03-29
- **Coverage**:
  - Blazor interactive components (BlazingPizza pizza-ordering app)
  - Blazor forms, validation, and state management patterns
  - Data access and Entity Framework Core integration
  - Routing, navigation, and layout in Blazor
  - .NET Aspire service orchestration (SupportTicketApi, migrations)
  - Cloud-native microservices patterns (.NET)
  - DevOps, CI/CD, Kubernetes deployment (GitHub Actions, AKS, Helm)

**Key Repository Inventory**:
1. `mslearn-build-interactive-components-blazor` — Component architecture (27.5% C#, 32.6% HTML, 39.9% CSS)
2. `mslearn-use-forms-in-blazor-web-apps` — Form binding, validation, OrderState, Controllers
3. `mslearn-interact-with-data-blazor-web-apps` — EF Core integration, model-based access
4. `mslearn-blazor-navigation` — Routing, pages, layouts (28.9% C#, 20.6% HTML, 50.5% CSS)
5. `aspire-docs-samples` — Service orchestration, migration pattern (SupportTicketApi)
6. `mslearn-dotnet-cloudnative` — Microservices architecture learning path
7. `mslearn-dotnet-cloudnative-devops` — GitHub Actions, AKS, Helm, CI/CD patterns

**Common Pattern**: Pizza store application used across multiple repos for consistent domain model
**Technology Stack**: C#, Razor, SQLite, EF Core, ASP.NET Core, Helm, Azure Kubernetes Service
**Learning Sequence**: Components → Navigation → Forms → Data → Orchestration → Microservices → DevOps

**Use for**: Understanding official Microsoft learning samples, Blazor component patterns, service orchestration architecture, microservices deployment strategies

---

## How to Use This Memory

When researching .NET/Blazor topics:
1. Check if topic is in `dotnet_blazor_research.md`
2. If found, use the documented patterns and examples
3. If new patterns discovered, add to the knowledge base
4. Keep examples focused and practical

When recommending approaches:
- Cite the specific section (e.g., "Render Mode Selection Matrix")
- Quote or reference the code pattern
- Explain why it applies to the user's scenario

---

## Future Research Priorities

- [ ] Advanced Blazor patterns (custom components, form validation, state management)
- [ ] .NET 10 performance optimizations
- [ ] Cloud deployment (Azure App Service, Azure Container Apps)
- [ ] Testing strategies (unit, integration, E2E)
- [ ] Security hardening (HTTPS, CORS, CSP, rate limiting)
- [ ] Observability (OpenTelemetry, Application Insights)

