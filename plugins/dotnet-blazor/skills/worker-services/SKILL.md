---
name: worker-services
description: Background tasks and worker services with IHostedService, BackgroundService, and .NET hosted service patterns
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - worker service
  - background task
  - IHostedService
  - BackgroundService
  - hosted service
  - background job
  - queue processor
  - scheduled task
---

# Worker Services and Background Tasks

## BackgroundService (Preferred)

```csharp
public sealed class OrderProcessingWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<OrderProcessingWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        logger.LogInformation("Order processing worker started");

        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var orderService = scope.ServiceProvider.GetRequiredService<IOrderService>();

                var pendingOrders = await orderService.GetPendingOrdersAsync(stoppingToken);
                foreach (var order in pendingOrders)
                {
                    await orderService.ProcessOrderAsync(order.Id, stoppingToken);
                    logger.LogInformation("Processed order {OrderId}", order.Id);
                }
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Error processing orders");
            }

            await Task.Delay(TimeSpan.FromSeconds(30), stoppingToken);
        }
    }
}

// Registration
builder.Services.AddHostedService<OrderProcessingWorker>();
```

## Queue-Based Worker (Channel)

```csharp
// Shared queue
public sealed class BackgroundTaskQueue
{
    private readonly Channel<Func<IServiceScopeFactory, CancellationToken, ValueTask>> _queue;

    public BackgroundTaskQueue(int capacity = 100)
    {
        _queue = Channel.CreateBounded<Func<IServiceScopeFactory, CancellationToken, ValueTask>>(
            new BoundedChannelOptions(capacity) { FullMode = BoundedChannelFullMode.Wait });
    }

    public async ValueTask QueueAsync(
        Func<IServiceScopeFactory, CancellationToken, ValueTask> workItem,
        CancellationToken ct = default)
    {
        await _queue.Writer.WriteAsync(workItem, ct);
    }

    public async ValueTask<Func<IServiceScopeFactory, CancellationToken, ValueTask>> DequeueAsync(
        CancellationToken ct) =>
        await _queue.Reader.ReadAsync(ct);
}

// Worker that processes the queue
public sealed class QueuedBackgroundWorker(
    BackgroundTaskQueue taskQueue,
    IServiceScopeFactory scopeFactory,
    ILogger<QueuedBackgroundWorker> logger) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            var workItem = await taskQueue.DequeueAsync(stoppingToken);
            try
            {
                await workItem(scopeFactory, stoppingToken);
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Error executing queued work item");
            }
        }
    }
}

// Enqueue from API endpoint
app.MapPost("/api/reports/generate", async (
    ReportRequest request, BackgroundTaskQueue queue) =>
{
    await queue.QueueAsync(async (scopeFactory, ct) =>
    {
        using var scope = scopeFactory.CreateScope();
        var reportService = scope.ServiceProvider.GetRequiredService<IReportService>();
        await reportService.GenerateAsync(request, ct);
    });

    return TypedResults.Accepted();
});
```

## Timed Background Service

```csharp
public sealed class CleanupWorker(
    IServiceScopeFactory scopeFactory,
    ILogger<CleanupWorker> logger) : BackgroundService
{
    private readonly PeriodicTimer _timer = new(TimeSpan.FromHours(1));

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        while (await _timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                using var scope = scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

                var cutoff = DateTime.UtcNow.AddDays(-30);
                var deleted = await db.TempFiles
                    .Where(f => f.CreatedAt < cutoff)
                    .ExecuteDeleteAsync(stoppingToken);

                logger.LogInformation("Cleaned up {Count} expired temp files", deleted);
            }
            catch (Exception ex) when (ex is not OperationCanceledException)
            {
                logger.LogError(ex, "Cleanup failed");
            }
        }
    }

    public override void Dispose()
    {
        _timer.Dispose();
        base.Dispose();
    }
}
```

## Standalone Worker Service

```csharp
// Program.cs for a standalone worker (not a web app)
var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults(); // Aspire integration

builder.Services.AddHostedService<EventConsumerWorker>();
builder.Services.AddDbContext<AppDbContext>(opts =>
    opts.UseNpgsql(builder.Configuration.GetConnectionString("Default")));

var host = builder.Build();
host.Run();
```

## Key Patterns

- **Always use `IServiceScopeFactory`** to create scopes in workers (hosted services are singletons, scoped services like DbContext need their own scope)
- **Use `PeriodicTimer`** instead of `Task.Delay` for scheduled work (more accurate, respects cancellation)
- **Use `Channel<T>`** for producer/consumer queues (thread-safe, backpressure support)
- **Handle exceptions** in the loop body, not outside (prevents worker from stopping on error)
- **Check `stoppingToken`** in all loops and pass it to async operations
- **Log lifecycle events** (started, stopped, errors) for observability

## Reference

- Worker services: https://learn.microsoft.com/en-us/dotnet/core/extensions/workers
- Background tasks: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/background-tasks-with-ihostedservice
