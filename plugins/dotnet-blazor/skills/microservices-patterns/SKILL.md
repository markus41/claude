---
name: microservices-patterns
description: .NET microservices patterns including service decomposition, communication, CQRS, saga, and resilience
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - microservice
  - service decomposition
  - bounded context
  - saga pattern
  - cqrs
  - event sourcing
  - circuit breaker
  - api gateway
---

# .NET Microservices Patterns

## Service Decomposition

### By Business Capability
```
E-Commerce Platform:
├── Catalog Service (products, categories, search)
├── Order Service (orders, order processing)
├── Payment Service (payment processing, refunds)
├── Inventory Service (stock management)
├── Notification Service (email, SMS, push)
├── Identity Service (authentication, users)
└── Gateway (API gateway, BFF)
```

### Database Per Service
Each service owns its data store. No shared databases.

```csharp
// Catalog uses PostgreSQL
builder.AddNpgsqlDbContext<CatalogDbContext>("catalogdb");

// Order uses SQL Server
builder.AddSqlServerDbContext<OrderDbContext>("orderdb");

// Notification uses Cosmos DB
builder.AddCosmosDbContext<NotificationDbContext>("cosmosdb");
```

## Communication Patterns

### Synchronous (HTTP/gRPC)
- Use for queries that need immediate response
- gRPC for internal service-to-service (performance)
- REST for external APIs and BFF

### Asynchronous (Messages/Events)
- Use for commands that can be processed later
- Event-driven for loose coupling between services
- RabbitMQ or Azure Service Bus for message broker

### CQRS Pattern
```csharp
// Command side
public sealed record CreateOrderCommand(int CustomerId, List<OrderItemDto> Items);

public sealed class CreateOrderHandler(OrderDbContext db, IPublishEndpoint bus)
{
    public async Task<int> HandleAsync(CreateOrderCommand command, CancellationToken ct)
    {
        var order = Order.Create(command.CustomerId, command.Items);
        db.Orders.Add(order);
        await db.SaveChangesAsync(ct);

        await bus.Publish(new OrderCreatedEvent(order.Id, order.CustomerId), ct);
        return order.Id;
    }
}

// Query side (separate read model, possibly different DB)
public sealed class OrderQueryService(IReadOnlyDbContext readDb)
{
    public async Task<OrderDetailDto?> GetByIdAsync(int id, CancellationToken ct) =>
        await readDb.Orders
            .AsNoTracking()
            .Where(o => o.Id == id)
            .Select(o => o.ToDetailDto())
            .FirstOrDefaultAsync(ct);
}
```

### Saga Pattern (Orchestration)

```csharp
// Using MassTransit state machine
public sealed class OrderSaga : MassTransitStateMachine<OrderSagaState>
{
    public OrderSaga()
    {
        InstanceState(x => x.CurrentState);

        Event(() => OrderCreated, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => PaymentProcessed, x => x.CorrelateById(m => m.Message.OrderId));
        Event(() => InventoryReserved, x => x.CorrelateById(m => m.Message.OrderId));

        Initially(
            When(OrderCreated)
                .Then(ctx => ctx.Saga.OrderId = ctx.Message.OrderId)
                .Publish(ctx => new ProcessPaymentCommand(ctx.Saga.OrderId))
                .TransitionTo(AwaitingPayment));

        During(AwaitingPayment,
            When(PaymentProcessed)
                .Publish(ctx => new ReserveInventoryCommand(ctx.Saga.OrderId))
                .TransitionTo(AwaitingInventory),
            When(PaymentFailed)
                .Publish(ctx => new CancelOrderCommand(ctx.Saga.OrderId))
                .TransitionTo(Failed));

        During(AwaitingInventory,
            When(InventoryReserved)
                .Publish(ctx => new FulfillOrderCommand(ctx.Saga.OrderId))
                .TransitionTo(Completed));
    }
}
```

## Resilience Patterns

```csharp
// Microsoft.Extensions.Resilience + Polly v8
builder.Services.AddHttpClient<ICatalogClient>(client =>
    client.BaseAddress = new("https+http://catalog-api"))
.AddStandardResilienceHandler(); // Retry + Circuit Breaker + Timeout

// Custom pipeline
builder.Services.AddResiliencePipeline("custom", pipeline =>
{
    pipeline
        .AddRetry(new() { MaxRetryAttempts = 3, BackoffType = DelayBackoffType.Exponential })
        .AddCircuitBreaker(new() { FailureRatio = 0.5, MinimumThroughput = 10 })
        .AddTimeout(TimeSpan.FromSeconds(5));
});
```

## Health Checks

```csharp
builder.Services.AddHealthChecks()
    .AddNpgSql(connectionString, name: "database")
    .AddRedis(redisConnection, name: "cache")
    .AddRabbitMQ(rabbitConnection, name: "messaging")
    .AddCheck<CustomHealthCheck>("custom");

app.MapHealthChecks("/health/ready", new() { Predicate = check => check.Tags.Contains("ready") });
app.MapHealthChecks("/health/live", new() { Predicate = _ => false }); // Just checks app is running
```

## API Gateway vs Direct Communication

| Pattern | Use when | Trade-offs |
|---------|----------|------------|
| **Direct client-to-service** | Few services, internal apps | Simple but couples clients to services |
| **API Gateway (YARP/Ocelot)** | Many services, external clients | Single entry point, adds latency |
| **BFF (Backend for Frontend)** | Multiple client types (web, mobile) | Client-optimized APIs, more gateways |

```csharp
// YARP reverse proxy (Microsoft's recommended API gateway)
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));
app.MapReverseProxy();
```

## Data Sovereignty Per Microservice

Each service owns its data. Cross-service data needs are resolved via:
- **API calls** for real-time queries
- **Integration events** for eventual consistency
- **Materialized views** for read-heavy cross-service queries

```
Order Service ──(event)──> Catalog Service
  │ OrderDB                    │ CatalogDB
  │ (orders, items)            │ (products, stock)
  │                            │
  └──(HTTP)──> Payment Service
                  │ PaymentDB
                  │ (payments, refunds)
```

## Asynchronous Message-Based Communication

```csharp
// Integration events cross service boundaries
public abstract record IntegrationEvent
{
    public Guid Id { get; } = Guid.NewGuid();
    public DateTime CreatedAt { get; } = DateTime.UtcNow;
}

public sealed record OrderSubmittedIntegrationEvent(
    int OrderId, int BuyerId, decimal Total) : IntegrationEvent;

// Publish via outbox pattern for reliability
public sealed class OutboxPublisher(AppDbContext db, IEventBus bus)
{
    public async Task PublishPendingEventsAsync(CancellationToken ct)
    {
        var pending = await db.OutboxMessages
            .Where(m => !m.Published)
            .OrderBy(m => m.CreatedAt)
            .Take(50)
            .ToListAsync(ct);

        foreach (var message in pending)
        {
            await bus.PublishAsync(message.Event, ct);
            message.Published = true;
            message.PublishedAt = DateTime.UtcNow;
        }
        await db.SaveChangesAsync(ct);
    }
}
```

## Composite UI (Micro-Frontends with Blazor)

Each service can own a UI fragment:
```razor
@* Main Blazor app composes service-specific components *@
<CatalogProductList />      @* Owned by Catalog team *@
<OrderStatusWidget />       @* Owned by Order team *@
<CartSummary />             @* Owned by Cart team *@
```

Pattern options:
- **Server-side composition**: Aggregate HTML from multiple services
- **Client-side composition**: Load Blazor components from different assemblies
- **API composition**: BFF aggregates data, single Blazor app renders

## Microservice Security

```csharp
// JWT validation at API gateway
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority = "https://identity-service";
        options.Audience = "catalog-api";
    });

// Azure Key Vault for secrets
builder.Configuration.AddAzureKeyVault(
    new Uri("https://myvault.vault.azure.net/"),
    new DefaultAzureCredential());
```

## Reference Documentation

- Architecture patterns: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/
- API Gateway pattern: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/direct-client-to-microservice-communication-versus-the-api-gateway-pattern
- Data sovereignty: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/data-sovereignty-per-microservice
- Async messaging: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/asynchronous-message-based-communication
- Resilient apps: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/
- Circuit breaker: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/implement-resilient-applications/implement-circuit-breaker-pattern
- Microservice security: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/
- Key Vault secrets: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/secure-net-microservices-web-applications/azure-key-vault-protects-secrets
- Composite UI: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/architect-microservice-container-applications/microservice-based-composite-ui-shape-layout
- DDD no-nonsense guide: https://particular.net/webinars/ddd-design-no-nonsense-implementation-guide
