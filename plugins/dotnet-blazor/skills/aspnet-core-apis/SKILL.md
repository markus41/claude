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

## Best Practices

- Use `TypedResults` for compile-time response type checking
- Always pass and respect `CancellationToken`
- Use `[AsParameters]` for complex query objects
- Group endpoints by feature/resource with `MapGroup()`
- Use endpoint filters instead of controller action filters
- Prefer `IResult` return type for all handlers
- Add OpenAPI annotations for documentation
- Use output caching for read-heavy endpoints
