---
name: aspnet-core-apis
description: ASP.NET Core API development with minimal APIs, controllers, middleware, OpenAPI, and best practices
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - aspnet api
  - minimal api
  - web api
  - controller
  - endpoint
  - middleware
  - openapi
  - swagger
---

# ASP.NET Core API Development

## Minimal APIs (.NET 10 Preferred)

### Endpoint Groups
```csharp
public static class ProductEndpoints
{
    public static RouteGroupBuilder MapProductEndpoints(this WebApplication app)
    {
        var group = app.MapGroup("/api/products")
            .WithTags("Products")
            .RequireAuthorization();

        group.MapGet("/", GetAll);
        group.MapGet("/{id:int}", GetById);
        group.MapPost("/", Create);
        group.MapPut("/{id:int}", Update);
        group.MapDelete("/{id:int}", Delete);

        return group;
    }

    private static async Task<IResult> GetAll(
        [AsParameters] ProductQuery query,
        IProductService service,
        CancellationToken ct) =>
        TypedResults.Ok(await service.GetAllAsync(query, ct));

    private static async Task<IResult> GetById(int id, IProductService service, CancellationToken ct) =>
        await service.GetByIdAsync(id, ct) is { } product
            ? TypedResults.Ok(product)
            : TypedResults.NotFound();
}
```

### Program.cs Registration
```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
builder.Services.AddOutputCache();
builder.Services.AddRateLimiter(opts => opts.AddFixedWindowLimiter("api", o =>
{
    o.Window = TimeSpan.FromMinutes(1);
    o.PermitLimit = 100;
}));

var app = builder.Build();

app.UseOutputCache();
app.UseRateLimiter();
app.MapOpenApi();

app.MapProductEndpoints();
app.MapOrderEndpoints();

app.Run();
```

## Middleware Pipeline

```
Request → UseExceptionHandler → UseHsts → UseHttpsRedirection
    → UseStaticFiles → UseRouting → UseCors → UseAuthentication
    → UseAuthorization → UseOutputCache → UseRateLimiter → Endpoints
```

### Custom Middleware
```csharp
public sealed class RequestTimingMiddleware(RequestDelegate next, ILogger<RequestTimingMiddleware> logger)
{
    public async Task InvokeAsync(HttpContext context)
    {
        var sw = Stopwatch.StartNew();
        try
        {
            await next(context);
        }
        finally
        {
            sw.Stop();
            logger.LogInformation("Request {Method} {Path} completed in {Elapsed}ms",
                context.Request.Method, context.Request.Path, sw.ElapsedMilliseconds);
        }
    }
}

// Register: app.UseMiddleware<RequestTimingMiddleware>();
```

## Endpoint Filters

```csharp
public sealed class ValidationFilter<T> : IEndpointFilter where T : class
{
    public async ValueTask<object?> InvokeAsync(
        EndpointFilterInvocationContext context,
        EndpointFilterDelegate next)
    {
        var validator = context.HttpContext.RequestServices.GetService<IValidator<T>>();
        if (validator is null) return await next(context);

        var model = context.GetArgument<T>(0);
        var result = await validator.ValidateAsync(model);

        return result.IsValid
            ? await next(context)
            : TypedResults.ValidationProblem(result.ToDictionary());
    }
}
```

## OpenAPI / Swagger

```csharp
// .NET 10 built-in OpenAPI
builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((doc, ctx, ct) =>
    {
        doc.Info.Title = "My API";
        doc.Info.Version = "v1";
        return Task.CompletedTask;
    });
});

app.MapOpenApi(); // Serves at /openapi/v1.json
app.MapScalarApiReference(); // Interactive API explorer UI
```

## Error Handling

```csharp
// Global exception handler with Problem Details
builder.Services.AddProblemDetails();

app.UseExceptionHandler(error =>
{
    error.Run(async context =>
    {
        var exception = context.Features.Get<IExceptionHandlerFeature>()?.Error;
        var problem = exception switch
        {
            NotFoundException => new ProblemDetails
            {
                Status = 404, Title = "Not Found", Detail = exception.Message
            },
            ValidationException ve => new ProblemDetails
            {
                Status = 400, Title = "Validation Error",
                Extensions = { ["errors"] = ve.Errors }
            },
            _ => new ProblemDetails
            {
                Status = 500, Title = "Internal Server Error"
            }
        };

        context.Response.StatusCode = problem.Status ?? 500;
        await context.Response.WriteAsJsonAsync(problem);
    });
});
```

## Rate Limiting (from official docs)

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Fixed Window - simple time-based limit
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 4;
        opt.Window = TimeSpan.FromSeconds(12);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    // Sliding Window - smoother rate control
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromSeconds(30);
        opt.SegmentsPerWindow = 3;
    });

    // Token Bucket - burst-friendly
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 100;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 20;
        opt.AutoReplenishment = true;
    });

    // Concurrency - limits concurrent requests, not rate
    options.AddConcurrencyLimiter("concurrency", opt =>
    {
        opt.PermitLimit = 50;
        opt.QueueLimit = 10;
    });

    // Custom rejection response
    options.OnRejected = async (context, ct) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
            context.HttpContext.Response.Headers.RetryAfter = ((int)retryAfter.TotalSeconds).ToString();
        await context.HttpContext.Response.WriteAsync("Rate limit exceeded.", ct);
    };
});

// IMPORTANT: UseRouting MUST come before UseRateLimiter for endpoint-specific limiters
app.UseRouting();
app.UseRateLimiter();

// Apply to endpoints
app.MapGet("/api/limited", () => "OK").RequireRateLimiting("fixed");

// Partitioned by API key with tiered limits
options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
{
    string apiKey = context.Request.Headers["X-API-Key"].ToString() ?? "default";
    return apiKey switch
    {
        "premium-key" => RateLimitPartition.GetFixedWindowLimiter(apiKey,
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 1000, Window = TimeSpan.FromMinutes(1) }),
        _ => RateLimitPartition.GetFixedWindowLimiter(apiKey,
            _ => new FixedWindowRateLimiterOptions { PermitLimit = 100, Window = TimeSpan.FromMinutes(1) })
    };
});
```

## Dependency Injection Patterns (from official docs)

```csharp
// Lifetimes
builder.Services.AddTransient<ITransientService, TransientService>();  // New each time
builder.Services.AddScoped<IScopedService, ScopedService>();          // Per request
builder.Services.AddSingleton<ISingletonService, SingletonService>(); // Once

// Factory registration
builder.Services.AddScoped<IMyService>(sp =>
    new MyService(sp.GetRequiredService<IDependency>()));

// Keyed services (multiple implementations of same interface)
builder.Services.AddKeyedSingleton<ICache, RedisCache>("redis");
builder.Services.AddKeyedSingleton<ICache, MemoryCache>("memory");

// Inject keyed service in minimal API
app.MapGet("/data", ([FromKeyedServices("redis")] ICache cache) => cache.Get("key"));

// Extension method pattern for clean DI registration
public static class MyServiceExtensions
{
    public static IServiceCollection AddMyServices(this IServiceCollection services, IConfiguration config)
    {
        services.Configure<MyOptions>(config.GetSection("MyOptions"));
        services.AddScoped<IMyService, MyService>();
        return services;
    }
}
```

## Middleware Pipeline Order (from official docs)

```csharp
// Correct order for ASP.NET Core 10:
if (app.Environment.IsDevelopment())
    app.UseDeveloperExceptionPage();
else
    app.UseExceptionHandler("/Error", createScopeForErrors: true);

app.UseHttpsRedirection();
app.UseStaticFiles();       // or app.MapStaticAssets()
app.UseRouting();            // MUST come before rate limiter
app.UseRateLimiter();
app.UseCors();               // MUST come before auth and after routing
app.UseAuthentication();
app.UseAuthorization();
app.UseAntiforgery();        // After auth
app.UseResponseCaching();    // After CORS
app.UseResponseCompression();

// Endpoints last
app.MapRazorComponents<App>().AddInteractiveServerRenderMode();
app.MapControllers();
```

## Native AOT Support

```csharp
// Use CreateSlimBuilder for AOT-compatible apps
var builder = WebApplication.CreateSlimBuilder(args);

// JSON source generator required for AOT
builder.Services.ConfigureHttpJsonOptions(options =>
    options.SerializerOptions.TypeInfoResolverChain.Insert(0, AppJsonSerializerContext.Default));

var app = builder.Build();
app.MapGet("/todos", () => new Todo(1, "Walk dog", false));
app.Run();

[JsonSerializable(typeof(Todo[]))]
[JsonSerializable(typeof(Todo))]
internal partial class AppJsonSerializerContext : JsonSerializerContext { }

public record Todo(int Id, string Title, bool IsComplete);
```

```xml
<!-- In .csproj for AOT publishing -->
<PublishAot>true</PublishAot>
```

## Options Pattern (from official docs)

```csharp
// Bind configuration to strongly-typed class
public sealed class SmtpOptions
{
    public const string SectionName = "Smtp";
    [Required] public string Host { get; set; } = "";
    [Range(1, 65535)] public int Port { get; set; } = 587;
    public string? Username { get; set; }
}

// Register with validation
builder.Services.AddOptions<SmtpOptions>()
    .BindConfiguration(SmtpOptions.SectionName)
    .ValidateDataAnnotations()  // Validates [Required], [Range], etc.
    .ValidateOnStart();          // Fail fast at startup if invalid

// Inject: IOptions<T> (singleton), IOptionsSnapshot<T> (scoped, reloads),
//         IOptionsMonitor<T> (singleton, notifies on change)
public sealed class EmailService(IOptions<SmtpOptions> options)
{
    private readonly SmtpOptions _smtp = options.Value;
}
```

## Best Practices

- Use `TypedResults` for compile-time response type checking
- Always pass and respect `CancellationToken`
- Use `[AsParameters]` for complex query objects
- Group endpoints by feature/resource with `MapGroup()`
- Use endpoint filters instead of controller action filters
- Prefer `IResult` return type for all handlers
- Add OpenAPI annotations for documentation
- Use output caching for read-heavy endpoints
- UseRouting MUST come before UseRateLimiter
- CORS MUST come before UseResponseCaching
- Use `CreateSlimBuilder` + JSON source generators for Native AOT
- Use `ValidateOnStart()` with Options pattern to fail fast
