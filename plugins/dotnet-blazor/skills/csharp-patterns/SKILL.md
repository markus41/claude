---
name: csharp-patterns
description: Modern C# 13/15 patterns, LINQ mastery, async/await, records, pattern matching, .NET 10/11 features, and .NET AI integration
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

## C# 15 New Features

### Extension Members (Extension Everything)
```csharp
// Extension properties, methods, and static members
public static extension StringExtensions for string
{
    public bool IsNullOrEmpty => string.IsNullOrEmpty(this);
    public string Reversed => new(this.Reverse().ToArray());
}

// Usage: "hello".Reversed → "olleh"
```

### Field-Backed Properties
```csharp
public class Person
{
    // 'field' keyword accesses the auto-generated backing field
    public string Name
    {
        get => field;
        set => field = value?.Trim() ?? throw new ArgumentNullException(nameof(value));
    }
}
```

### Null-Conditional Assignment
```csharp
// Only assigns if left side is not null
object?.Property = value;
list?.Add(item);
```

## .NET 10 Key Features

- **AOT improvements**: Faster startup, smaller binaries for cloud-native
- **Blazor Web App enhancements**: Improved render mode handling, streaming SSR
- **Minimal API improvements**: Better parameter binding, endpoint filters
- **EF Core improvements**: Bulk operations, compiled models
- **Aspire GA**: Production-ready orchestration
- **.NET AI libraries**: Microsoft.Extensions.AI for unified AI integration

## .NET AI Integration

```csharp
// Microsoft.Extensions.AI - unified AI abstraction
using Microsoft.Extensions.AI;

// Register AI chat client (works with OpenAI, Azure OpenAI, Ollama, etc.)
builder.Services.AddChatClient(new AzureOpenAIClient(
    new Uri(builder.Configuration["AI:Endpoint"]!),
    new DefaultAzureCredential())
    .GetChatClient("gpt-4o"));

// Use in services
public sealed class SmartSearchService(IChatClient chatClient)
{
    public async Task<string> SummarizeAsync(string content, CancellationToken ct)
    {
        var response = await chatClient.GetResponseAsync(
            $"Summarize this: {content}", cancellationToken: ct);
        return response.Text;
    }
}
```

```csharp
// Semantic Kernel for AI orchestration
using Microsoft.SemanticKernel;

var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion("gpt-4o", endpoint, credential)
    .Build();

var result = await kernel.InvokePromptAsync(
    "Analyze this order data: {{$input}}", new() { ["input"] = orderJson });
```

## Reference

- C# 15 what's new: https://learn.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-15
- .NET 10 overview: https://learn.microsoft.com/en-us/dotnet/core/whats-new/dotnet-10/overview
- .NET what's new: https://learn.microsoft.com/en-us/dotnet/whats-new/
- .NET AI: https://learn.microsoft.com/en-us/dotnet/ai/
- Semantic Kernel: https://learn.microsoft.com/en-us/semantic-kernel/
