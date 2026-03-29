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

