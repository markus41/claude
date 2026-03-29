---
name: csharp-patterns
description: Modern C# 13 patterns, LINQ mastery, async/await, records, pattern matching, and .NET 10 features
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
triggers:
  - csharp pattern
  - c# pattern
  - linq
  - async await
  - record type
  - pattern matching
  - source generator
  - dependency injection
---

# Modern C# Patterns

## Dependency Injection Patterns

### Primary Constructors (.NET 10)
```csharp
public sealed class OrderService(
    IOrderRepository repo,
    IPaymentGateway payments,
    ILogger<OrderService> logger) : IOrderService
{
    public async Task<OrderResult> ProcessAsync(CreateOrderCommand cmd, CancellationToken ct)
    {
        logger.LogInformation("Processing order for customer {CustomerId}", cmd.CustomerId);
        var order = await repo.CreateAsync(cmd, ct);
        var payment = await payments.ChargeAsync(order.Total, ct);
        return new OrderResult(order.Id, payment.TransactionId);
    }
}
```

### Options Pattern
```csharp
public sealed class EmailOptions
{
    public const string SectionName = "Email";
    public required string SmtpHost { get; init; }
    public required int SmtpPort { get; init; }
    public required string FromAddress { get; init; }
}

// Registration
builder.Services.Configure<EmailOptions>(builder.Configuration.GetSection(EmailOptions.SectionName));

// Usage
public sealed class EmailService(IOptions<EmailOptions> options)
{
    private readonly EmailOptions _config = options.Value;
}
```

## Result Pattern (instead of exceptions for expected failures)

```csharp
public abstract record Result<T>
{
    public sealed record Success(T Value) : Result<T>;
    public sealed record Failure(string Error) : Result<T>;

    public TOut Match<TOut>(Func<T, TOut> onSuccess, Func<string, TOut> onFailure) =>
        this switch
        {
            Success s => onSuccess(s.Value),
            Failure f => onFailure(f.Error),
            _ => throw new InvalidOperationException()
        };
}

// Usage
public async Task<Result<OrderDto>> CreateOrderAsync(CreateOrderCommand cmd)
{
    if (await _repo.ExistsAsync(cmd.Sku))
        return new Result<OrderDto>.Failure("Duplicate SKU");

    var order = await _repo.CreateAsync(cmd);
    return new Result<OrderDto>.Success(order.ToDto());
}
```

## Repository Pattern with Specification

```csharp
public interface IRepository<T> where T : class
{
    Task<T?> GetByIdAsync(int id, CancellationToken ct = default);
    Task<IReadOnlyList<T>> ListAsync(ISpecification<T> spec, CancellationToken ct = default);
    Task<T> AddAsync(T entity, CancellationToken ct = default);
    Task UpdateAsync(T entity, CancellationToken ct = default);
    Task DeleteAsync(T entity, CancellationToken ct = default);
}

public interface ISpecification<T>
{
    Expression<Func<T, bool>>? Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    Expression<Func<T, object>>? OrderBy { get; }
    int? Take { get; }
    int? Skip { get; }
}
```

## Guard Clauses

```csharp
public static class Guard
{
    public static T NotNull<T>(T? value, [CallerArgumentExpression(nameof(value))] string? name = null)
        where T : class =>
        value ?? throw new ArgumentNullException(name);

    public static string NotEmpty(string? value, [CallerArgumentExpression(nameof(value))] string? name = null) =>
        string.IsNullOrWhiteSpace(value)
            ? throw new ArgumentException("Cannot be empty", name)
            : value;
}
```

## Extension Methods
```csharp
public static class EnumerableExtensions
{
    public static IEnumerable<IEnumerable<T>> Batch<T>(this IEnumerable<T> source, int size)
    {
        var batch = new List<T>(size);
        foreach (var item in source)
        {
            batch.Add(item);
            if (batch.Count == size)
            {
                yield return batch;
                batch = new List<T>(size);
            }
        }
        if (batch.Count > 0) yield return batch;
    }
}
```

## Async Patterns

```csharp
// Parallel execution
var (users, products) = await (GetUsersAsync(ct), GetProductsAsync(ct));

// Async streams
await foreach (var item in GetItemsAsync(ct))
{
    await ProcessAsync(item, ct);
}

// Channel for producer/consumer
var channel = Channel.CreateBounded<WorkItem>(100);

// Producer
await channel.Writer.WriteAsync(new WorkItem(...), ct);

// Consumer
await foreach (var item in channel.Reader.ReadAllAsync(ct))
{
    await HandleAsync(item, ct);
}
```
