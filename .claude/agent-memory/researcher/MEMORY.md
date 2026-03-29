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

