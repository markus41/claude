---
name: .NET Microservices Architecture & Fundamentals Knowledge Base
description: Comprehensive research on microservice patterns, data architecture, API design, and .NET/C# fundamentals from Microsoft Learn documentation
type: reference
---

# .NET Microservices Architecture & Fundamentals Knowledge Base

**Research Date**: 2026-03-29
**Sources**: Microsoft Learn official documentation
**Scope**: Enterprise microservice patterns, API design, data management, and .NET/C# advancements

---

## MICROSERVICE ARCHITECTURE PATTERNS

### 1. API Versioning & Backward Compatibility

**Strategy**: Service APIs must evolve without breaking client contracts.

**Approaches**:
- **Semantic Versioning**: Embed version in URL (`/v1/endpoint`, `/v2/endpoint`) or HTTP headers
- **Additive Changes**: Add new attributes/parameters with sensible defaults; clients ignore extra response fields
- **Major Changes**: Run old and new API versions simultaneously within same or different service instances
- **Mediator Pattern** (MediatR): Decouple implementation versions into independent handlers
- **Hypermedia**: Use HAL (Hypertext Application Language) for evolvable APIs that guide clients to new endpoints

**Key Principle**: Cannot force all clients to upgrade immediately; must support multiple API versions concurrently.

**Impact on Plugin Ecosystem**: Plugin APIs should use versioning strategy from day 1 to enable plugin independence.

---

### 2. Composite UI / Micro-Frontends for Blazor

**Traditional Approach** (Monolithic UI):
- Single client app consuming backend microservices
- UI layer remains monolithic; services only handle logic/data
- Simpler for basic scenarios but couples UI to service structure

**Advanced Approach** (Composite UI - Micro-Frontends):
- UI components composed by backend microservices themselves
- Each microservice owns visual representation of its domain
- Microservices generate ViewModels → client UI components register with infrastructure microservice
- When microservice changes shape, UI updates automatically

**Blazor Integration**:
- Blazor components can implement micro-frontend patterns
- Client TypeScript/C# components register with infrastructure microservice
- Templates drive rendering; ViewModels come from each microservice
- Works best with SPA or ASP.NET MVC intermediary

**Trade-offs**:
- More complex architecture; requires distributed UI coordination
- Better autonomy when services evolve independently
- Suitable for large, complex applications; overkill for simple monolithic UI apps

---

### 3. Async Messaging vs Sync Communication Decision Matrix

**When to Use Async Messaging**:
- Event-driven architecture required
- Need eventual consistency across microservices
- Scalability more important than immediate response
- Loose coupling essential for independent deployment
- High latency acceptable (user notifications, background jobs)

**When to Use Sync (HTTP/REST)**:
- Client→API Gateway→Services: Always synchronous (latency acceptable)
- Service-to-service: Prefer async, use sync only for tight dependencies
- Need immediate feedback/validation before proceeding
- Transaction-like semantics required (though still eventual consistency)

**Message-Based Communication Types**:

1. **Single-Receiver (Point-to-Point Commands)**:
   - One consumer processes message exactly once
   - Message sent to specific service queue
   - Example: Order submission command
   - Concerns: Idempotency, retry safety, exactly-once semantics

2. **Multiple-Receiver (Publish/Subscribe Events)**:
   - Event published to event bus; many subscribers receive
   - Supports open/closed principle (new subscribers added without sender modification)
   - Example: ProductPriceChanged event → Catalog, Inventory, Marketing all react
   - Implementation: Event bus interface + message broker (RabbitMQ, Azure Service Bus)

**Event-Driven Communication**:
- Microservice publishes integration event when domain event occurs
- Other services subscribe and update own models (eventual consistency)
- Enables distributed business tasks spanning multiple services
- Critical for data consistency across system

**Messaging Infrastructure Options**:
- **Lightweight**: RabbitMQ, Azure Service Bus (transports only)
- **Higher-Level**: NServiceBus, MassTransit, Brighter (add business logic abstraction)
- **POC/Dev**: RabbitMQ in Docker sufficient
- **Production/Mission-Critical**: Azure Service Bus for hyper-scalability

**Resilient Publishing Pattern** (Critical):
- Challenge: Update service state AND publish event atomically
- Solutions:
  - **Outbox Pattern**: Write event to transactional DB table; separate component publishes to bus
  - **Transaction Log Mining**: Replay DB logs as events
  - **Event Sourcing**: Store only events; rebuild state from event stream
  - **Legacy**: MSMQ with DTC (now discouraged)

**Message Idempotence**: Crucial for at-least-once delivery; server must deduplicate on retry.

---

### 4. API Gateway Pattern vs Direct Client-to-Microservice

**Direct Client-to-Microservice (Problematic for large apps)**:
- Client calls services directly
- Each service has public endpoint
- Works: Small apps, monolithic client, server-side rendering (ASP.NET MVC)
- Breaks: Large apps, mobile/SPA clients, dozens of service types

**Problems with Direct Approach**:
- **Coupling**: Clients know all service endpoints; refactoring breaks clients
- **Chattiness**: Single page needs 5+ service calls → latency spikes
- **Security**: All services exposed; larger attack surface
- **Cross-cutting Concerns**: Auth/SSL on every service (duplicated)
- **Protocol Mismatch**: Services use AMQP/binary; clients need HTTP

**API Gateway Pattern (Facade/BFF - Backend for Frontend)**:
- Single entry point for related microservice groups
- Acts as reverse proxy + router + facade
- Aggregates multiple service responses
- Handles auth, SSL termination, rate limiting, logging

**Features**:
- **Reverse Proxy/Routing**: Maps client URLs to internal service endpoints
- **Request Aggregation**: Client makes 1 request → gateway calls 5 services → aggregates response (reduces latency for remote clients)
- **Cross-Cutting Concerns**:
  - Authentication/authorization
  - SSL termination
  - Rate limiting, throttling, QoS
  - Response caching
  - Retry policies, circuit breaker
  - Request/response transformation
  - IP allowlisting, logging, tracing

**Critical Design Principle**: **Don't create single monolithic gateway for all microservices**.

**Backend for Frontend (BFF)** pattern:
- Multiple API Gateways, one per client type (web, mobile, etc.)
- Each gateway optimized for specific client needs
- Mobile gateway: Compressed responses, aggregated data
- Web gateway: Full data, slower clients acceptable
- Also split by business boundaries in large apps

**Products**:
- **Azure API Management**: Enterprise, full API lifecycle, analytics, rate limiting, security
- **Ocelot**: Lightweight, open-source, .NET Core, good for containerized deployments
- Others: Kong, Apigee, MuleSoft, Linkerd, Istio (service mesh)

**Drawbacks**:
- Single point of failure (mitigation: replicate across regions)
- Added latency (usually acceptable vs chatty direct calls)
- Development bottleneck if single team owns gateway (use multiple gateways)
- Coupling risk if gateway becomes monolithic aggregator

---

### 5. Data Sovereignty Per Microservice

**Core Principle**: Each microservice owns its domain data exclusively.

**Traditional Monolithic Approach**:
- Single centralized relational database
- All subsystems share tables
- Huge tables with unrelated columns/attributes
- Enables ACID transactions, SQL joins across domains

**Microservice Approach**:
- **Database per Service**: Each microservice has own database (SQL or NoSQL)
- **Data Private**: Only accessible via service API (REST/gRPC/SOAP/messaging)
- **No Direct Database Sharing**: No cross-service SQL joins
- **Polyglot Persistence**: Catalog uses PostgreSQL; Orders use MongoDB; Cache uses Redis

**Why Separation**:
- **Autonomy**: Services evolve independently without schema coordination
- **Scalability**: Can optimize each DB for specific workload (denormalize, index differently)
- **Performance**: Local queries faster than distributed transactions
- **Technology Mix**: Right tool per domain (SQL for transactional, NoSQL for analytics, etc.)

**Challenges**:
- **No ACID Across Services**: Distributed transactions not possible
- **Eventual Consistency**: Business processes spanning services must accept eventual consistency
- **Data Consistency**: Reconcile differences across microservice models using:
  - Integration events (event-driven)
  - Saga pattern (distributed transaction coordinator)
  - Compensating transactions (rollback on failure)

**Bounded Context (DDD Connection)**:
- Each Bounded Context = one business microservice
- Same entity (e.g., "Customer") has different meanings in different BCs:
  - CRM BC: Customer with relationship history, preferences
  - Ordering BC: Customer with payment/delivery addresses
  - Support BC: Customer with ticket history, SLA tier
- Each BC has own model and database

**Example Data Model**:
```
eShop Application:
- Catalog BC: Product, Category, Price (SQL Server optimized for reads)
- Ordering BC: Order, OrderItem, Payment (SQL optimized for ACID)
- Customer BC: Customer, Account, Loyalty (PostgreSQL with denormalization)
- Shipping BC: Shipment, Route, Tracking (Document DB for flexible schemas)
```

**Impact on Plugin Architecture**: Plugins should assume they own their data; provide APIs for data exchange, not direct DB access.

---

### 6. Logical vs Physical Architecture

**Logical Microservice**: Business domain with independent lifecycle (versioning, deployment, scaling)

**Physical Service**: Single ASP.NET Core Web API or process implementing that microservice

**Key Insight**: Logical ≠ Physical (1:1 mapping not required)

**Scenarios**:

1. **1:1 Mapping** (Common for simplicity):
   - Logical: Catalog microservice
   - Physical: Single Catalog.API service

2. **1:Many Mapping** (Optimize scaling/performance):
   - Logical: Catalog microservice
   - Physical: Catalog.WebAPI (REST) + Catalog.Search (Elasticsearch indexing)
   - Both share same data model; split by functional load
   - Scale Search independently if needed

3. **Service Composition**:
   - Logical: Order microservice
   - Physical: Order.API (orchestration) + Order.Processor (background work)
   - Different deployment, different scaling strategies

**Benefits**:
- **Autonomy**: Logical boundary (Bounded Context) independent from physical deployment
- **Scale**: Scale hot services (Search) separately
- **Evolution**: Can later split one service into many, or consolidate many into one
- **Flexibility**: No rigid 1:1 rule limits architecture

---

## .NET 10/11 & C# FUNDAMENTALS

### C# 15 New Features (Ships with .NET 11)

**1. Collection Expression Arguments**
```csharp
// Pass constructor args via with(...) in collection expressions
List<string> names = [with(capacity: 100), "Alice", "Bob"];
HashSet<string> unique = [with(StringComparer.OrdinalIgnoreCase), "hello", "HELLO"];
// Enables capacity hints, custom comparers directly in syntax
```

**2. Union Types**
```csharp
public record class Cat(string Name);
public record class Dog(string Name);
public record class Bird(string Name);

public union Pet(Cat, Dog, Bird);

// Compiler ensures exhaustiveness
Pet pet = new Dog("Rex");
string name = pet switch
{
    Dog d => d.Name,
    Cat c => c.Name,
    Bird b => b.Name,
};
```
- Represents value as one of several case types
- Implicit conversions from each case type
- Compiler-enforced exhaustive matching
- Early in preview; some features (member providers) still coming

---

### .NET 10 Major Features

**Runtime Improvements**:
- JIT inlining enhancements
- Method devirtualization (inline virtual calls)
- Improved struct argument code generation
- AVX10.2 support for vectorization
- Enhanced loop inversion optimizations
- NativeAOT improvements

**Libraries**:
- **Cryptography**: Post-quantum (ML-DSA, Composite ML-DSA), AES KeyWrap with Padding, Windows CNG support
- **JSON Serialization**: Disallow duplicate properties, strict mode, PipeReader support
- **Collections**: New APIs
- **Networking**: WebSocketStream, TLS 1.3 for macOS
- **Globalization & Numerics**: Expanded APIs
- **Process Management**: Windows process group support

**SDK**:
- Microsoft.Testing.Platform integration in `dotnet test`
- Standardized CLI command order
- Native container image creation for console apps
- Platform-specific .NET tools support
- One-shot tool execution with `dotnet tool exec`
- Enhanced file-based apps with native AOT publish

**ASP.NET Core 10.0**:
- Blazor WebAssembly preloading
- Automatic memory pool eviction
- Enhanced form validation
- Improved diagnostics
- Passkey support for Identity

**C# 14 Features** (Released with .NET 10):
- Field-backed properties (access backing field with `field` keyword)
- Nameof for unbound generics: `nameof(List<>)` → "List"
- First-class Span/ReadOnlySpan conversions
- Parameter modifiers in lambda without types: `(ref x, in y) => ...`
- Partial instance constructors and partial events
- Extension blocks for static extension methods/properties
- Null-conditional assignment: `obj?.Property = value`
- User-defined `+=`, `-=`, `++`, `--` operators
- Improved overload resolution for Span-based overloads

**EF Core 10**:
- LINQ enhancements
- Performance optimizations
- Better Azure Cosmos DB support
- Named query filters (multiple per entity with selective disabling)

---

### C# 14 Highlights for Plugin Development

1. **Partial Instance Constructors**: Initialize parts of object via multiple partial constructors
2. **Extension Blocks**: Add static/instance extension properties in `extension` blocks
3. **Field-Backed Properties**: `public string Name { get { return field; } set { field = value; } }`
4. **User-Defined Operators**: Can now overload `+=`, `-=`, `++`, `--` for custom types
5. **Span Conversions**: More implicit conversions improve array/span performance

---

## .NET FUNDAMENTALS FOR PLUGIN SYSTEMS

### Assemblies (Deployment & Plugin Units)

**Definition**: Collection of types and resources compiled to work together; deployed as .exe or .dll

**Key Properties**:
- **Fundamental deployment unit**: Versioned, deployed, scaled as a unit
- **Security boundary**: Permissions granted per assembly
- **Type boundary**: Assembly name is part of type identity (MyType in AssemblyA ≠ MyType in AssemblyB)
- **Version boundary**: Smallest versionable unit; all types versioned together
- **Reference-scope boundary**: Manifest lists dependencies and exposed types
- **Side-by-side execution**: Multiple versions can run simultaneously

**Assembly Structure**:
- **Assembly Manifest**: Table of contents (name, version, file table, dependencies, entry point)
- **Type Definitions**: CIL code + metadata
- **Resources**: Bitmaps, strings, etc.
- **Modules**: .NET Framework only; .NET has single implicit module per assembly

**For Plugin Systems**:
- Plugin = one or more assemblies
- Each plugin assembly has own manifest listing dependencies
- Plugin can depend on shared runtime assemblies
- Version mismatches detected at runtime via manifest comparison
- Isolation achieved via separate AppDomain (.NET Framework) or AssemblyLoadContext (.NET Core)

**Loading & Discovery**:
- Static: Referenced in project file, loaded at startup
- Dynamic: AssemblyLoadContext.LoadFromAssemblyPath(), dynamically discover plugins at runtime
- Metadata-only: MetadataLoadContext (new way) for reflection without execution
- NativeAOT impact: Dynamic loading restricted; must pre-declare types

---

### Common Language Runtime (CLR)

**Definition**: Runtime environment that executes managed code and provides services

**Key Services**:
- **Type System**: Common type system enables cross-language integration
- **Garbage Collection**: Automatic memory management, prevents leaks
- **Metadata**: Runtime interprets metadata to bind types, enforce security, layout memory
- **Execution Verification**: Verifies managed code safety before execution

**Core Concepts**:

1. **Managed Code**: Code compiled to IL, executed by runtime with services
   - Automatic memory management
   - Cross-language compatibility
   - Type safety verification
   - Exception handling, security boundaries

2. **Type System**:
   - All types inherit from System.Object
   - Value types (struct, enum) vs Reference types (class, interface, delegate)
   - Interfaces enable polymorphism
   - Generic types <T> for type safety without boxing

3. **Garbage Collection**:
   - Automatic: GC marks unused objects, frees memory
   - Generational: Gen0 (short-lived), Gen1, Gen2 (long-lived)
   - Workstation vs Server GC mode
   - Impact: Pause times, throughput, memory overhead

4. **Metadata**:
   - Embedded in assemblies alongside IL
   - Describes types, methods, fields, attributes
   - Enables reflection, serialization, data binding
   - Enables tools to understand code without execution

5. **Assembly Loading**:
   - JIT compilation: IL compiled to native code on first call
   - Lazy loading: Referenced assemblies loaded on demand
   - Versioning: Runtime checks manifest for correct version
   - Probing: Looks in bin folder, then GAC (.NET Framework)

**For Plugin Systems**:
- Multiple plugin assemblies run in same CLR process
- GC shared across all plugins
- Version conflicts detected at load time
- Reflection enables plugin discovery by interface/attribute
- Custom AppDomains (Framework) or AssemblyLoadContext (Core) provide isolation

---

### Reflection for Plugin Discovery

**Key Capabilities**:

1. **Assembly Inspection**:
   ```csharp
   Assembly asm = Assembly.LoadFrom("plugin.dll");
   Type[] types = asm.GetTypes();
   ```

2. **Type Discovery**:
   ```csharp
   Type[] interfaces = type.GetInterfaces();
   MethodInfo[] methods = type.GetMethods();
   PropertyInfo[] props = type.GetProperties();
   ```

3. **Attribute Inspection**:
   ```csharp
   var attr = type.GetCustomAttribute<PluginAttribute>();
   ```

4. **Dynamic Instantiation**:
   ```csharp
   var instance = Activator.CreateInstance(type, parameters);
   ```

5. **Member Access**:
   ```csharp
   method.Invoke(instance, args);
   property.SetValue(instance, value);
   ```

**Use Cases for Plugins**:
- Discover all classes implementing ICommand interface
- Load plugins by attribute: [PluginMetadata("name", version)]
- Create instances dynamically based on config
- Call plugin methods via reflection
- Extract metadata: Plugin name, version, author, dependencies

**Performance Considerations**:
- Reflection is slower than direct calls (10-100x slower for invoke)
- Cache Type/MethodInfo lookups; don't reflect on hot path
- Use delegates or Expression trees for repeated invokes
- JIT inline/JIT optimization less effective on reflected calls

**Limitations**:
- NativeAOT: Must pre-declare all types used via reflection (no dynamic discovery)
- Security: Reflection can bypass visibility; mark sensitive members carefully
- Versioning: Renamed/removed members cause reflection to fail (use TryGetMethod patterns)

---

## PLUGIN ARCHITECTURE RECOMMENDATIONS

### Data Management
- **Per-plugin database**: Each plugin owns its data store
- **API-based communication**: Don't share databases; use service APIs
- **Event subscriptions**: Plugins subscribe to domain events for data synchronization
- **Backward compatibility**: Version your plugin APIs from day 1

### API Design
- **Semantic versioning**: v1/, v2/ in URLs or headers
- **Additive changes**: New fields with defaults; ignore unknown fields
- **Mediator pattern**: Route requests through handlers (MediatR, custom)
- **Error codes**: Standard error response format for all versions

### Async Communication
- **Command handlers**: Plugin processes async commands (one publisher, one handler)
- **Event publishing**: Plugin publishes events; others subscribe
- **Idempotent operations**: Safe to retry; no duplicate side effects
- **Circuit breaker**: Resilience patterns for plugin-to-plugin calls

### Type Safety
- **Strong-named assemblies**: Sign plugin DLLs for tamper protection
- **AssemblyLoadContext**: Isolate plugins; control unloading
- **Dependency injection**: Register plugin services; inject interfaces
- **Generics**: Use <T> constraints for type-safe plugin contracts

### Deployment & Versioning
- **Side-by-side**: Run multiple plugin versions simultaneously
- **Feature flags**: Control plugin behavior without redeployment
- **Health checks**: Monitor plugin status; isolate failures
- **Rollback**: Support previous version; seamless migration

---

## KEY TAKEAWAYS FOR PLUGIN SKILL UPGRADES

1. **Microservice Patterns**: API versioning, async messaging, data sovereignty apply to plugin architecture
2. **Composite UIs**: Blazor plugins can use micro-frontend patterns for UI composition
3. **BFF Pattern**: Plugin controllers act as facades (aggregating data from multiple services)
4. **Event-Driven**: Use integration events for loosely-coupled plugin communication
5. **Eventual Consistency**: Accept async data sync across plugins (no distributed transactions)
6. **C# 14/15**: Union types, field-backed properties, extension blocks improve plugin APIs
7. **.NET 10**: Cryptography, JSON serialization, process management enhancements
8. **Reflection**: Power plugin discovery; cache Type/MethodInfo for performance
9. **Assemblies**: Each plugin is one or more assemblies; version/load independently
10. **CLR Services**: Leverage GC, metadata, type system for plugin isolation and interop

