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

