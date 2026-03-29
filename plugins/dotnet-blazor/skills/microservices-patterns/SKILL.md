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
