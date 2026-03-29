---
name: ASP.NET Core 10 Fundamentals Comprehensive Reference
description: Complete ASP.NET Core 10 API patterns with code examples covering middleware, routing, DI, rate limiting, Native AOT, minimal APIs, options pattern, and environments
type: reference
---

# ASP.NET Core 10 Fundamentals Research

**Date**: 2026-03-29
**Coverage**: Complete implementation patterns for ASP.NET Core 10 fundamentals

## 1. Middleware Pipeline Architecture

### Request/Response Flow
- Middleware forms a request pipeline: each middleware can pass to next or terminate
- Reverse order execution: responses flow backward through the pipeline
- Terminal middleware (Run, Map) prevents further processing

### Core Middleware Methods

```csharp
// Inline middleware with next parameter
app.Use(async (context, next) =>
{
    Console.WriteLine("Before next middleware");
    await next.Invoke(context);
    Console.WriteLine("After next middleware");
});

// Terminal middleware (no next parameter)
app.Run(async context =>
{
    await context.Response.WriteAsync("Response complete");
});

// Branch by path
app.Map("/path", HandleMapPath);
private static void HandleMapPath(IApplicationBuilder app)
{
    app.Run(async context =>
    {
        await context.Response.WriteAsync("Map path handled");
    });
}

// Branch by predicate
app.MapWhen(context => context.Request.Query.ContainsKey("branch"),
    appBuilder => HandleBranchAndRejoin(appBuilder));

// Branch and rejoin (non-terminal)
app.UseWhen(context => context.Request.Query.ContainsKey("branch"),
    appBuilder => HandleBranchAndRejoin(appBuilder));
```

### Standard Middleware Order (ASP.NET Core 10)

```csharp
// Development environment
if (app.Environment.IsDevelopment())
{
    app.UseDeveloperExceptionPage();
    app.UseDatabaseErrorPage();
    app.UseWebAssemblyDebugging(); // For Blazor
}
else
{
    app.UseExceptionHandler("/Error", createScopeForErrors: true);
    app.UseHsts();
}

app.UseHttpsRedirection();
app.UseStatusCodePagesWithReExecute("/not-found", createScopeForStatusCodePages: true);

// Optional middleware
app.UseAntiforgery();
app.MapStaticAssets();

// Routing must come after exception handling
app.UseRouting();
app.UseRateLimiter();
app.UseRequestLocalization();
app.UseCors();
app.UseAuthentication(); // Called internally for Identity
app.UseAuthorization();
app.UseSession();
app.UseResponseCompression();
app.UseResponseCaching();

// Endpoints
app.MapRazorComponents<App>()
    .AddInteractiveServerRenderMode();
app.MapControllers();
app.MapRazorPages();

app.Run();
```

**Key Rules**:
- Exception handling first
- HTTPS redirection early
- Static files short-circuit
- CORS must be before UseResponseCaching
- Auth/Authz require UseRouting first
- Rate limiting after UseRouting when using endpoint-specific APIs

---

## 2. Routing System

### Basic Minimal APIs

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// HTTP methods
app.MapGet("/users/{id}", (int id) => $"User {id}");
app.MapPost("/users", (User user) => Results.Created($"/users/{user.Id}", user));
app.MapPut("/users/{id}", (int id, User user) => Results.Ok(user));
app.MapDelete("/users/{id}", (int id) => Results.NoContent());
app.MapPatch("/users/{id}", (int id, User user) => Results.Ok(user));

app.Run();
```

### Route Parameters & Constraints

```csharp
// Type constraints
app.MapGet("/products/{id:int}", (int id) => $"Product {id}");
app.MapGet("/posts/{slug:alpha}", (string slug) => $"Post: {slug}");

// Advanced constraints
app.MapGet("/ssn/{ssn:regex(^\\d{3}-\\d{2}-\\d{4}$)}", (string ssn) => ssn);
app.MapGet("/users/{id:int:min(1):max(999)}", (int id) => $"User {id}");
app.MapGet("/files/{*filePath}", (string filePath) => filePath); // Catch-all

// Optional parameters
app.MapGet("/search/{query?}", (string? query) => query ?? "all");

// Built-in constraints: int, bool, guid, alpha, minlength, maxlength, range
```

### Route Groups

```csharp
var api = app.MapGroup("/api");

var users = api.MapGroup("/users")
    .WithName("Users API")
    .WithOpenApi()
    .RequireAuthorization();

users.MapGet("/", GetAllUsers)
    .WithName("GetAllUsers")
    .WithOpenApi();

users.MapGet("/{id}", GetUser)
    .WithName("GetUser");

users.MapPost("/", CreateUser)
    .WithName("CreateUser");

users.MapPut("/{id}", UpdateUser);
users.MapDelete("/{id}", DeleteUser);

// Nested groups
var org = app.MapGroup("{org}");
var team = org.MapGroup("{team}");
team.MapGet("", (string org, string team) => $"{org}/{team}");
```

### Endpoint Filters

```csharp
app.MapGroup("/api/todos")
    .AddEndpointFilter(async (context, next) =>
    {
        // Pre-processing
        var result = await next(context);
        // Post-processing
        return result;
    })
    .MapGet("/", () => "todos");
```

### URL Generation

```csharp
public class ProductsMiddleware
{
    private readonly LinkGenerator _linkGenerator;

    public ProductsMiddleware(RequestDelegate next, LinkGenerator linkGenerator)
    {
        _linkGenerator = linkGenerator;
    }

    public async Task InvokeAsync(HttpContext httpContext)
    {
        var url = _linkGenerator.GetPathByAction("Products", "Store");
        await httpContext.Response.WriteAsync($"Go to {url}");
    }
}
```

---

## 3. Dependency Injection

### Service Registration

```csharp
var builder = WebApplication.CreateBuilder(args);

// Lifetimes: Transient (new each time), Scoped (per request), Singleton (once)
builder.Services.AddTransient<ITransientService, TransientService>();
builder.Services.AddScoped<IScopedService, ScopedService>();
builder.Services.AddSingleton<ISingletonService, SingletonService>();

// Factory registration
builder.Services.AddScoped<IMyService>(sp =>
    new MyService(sp.GetRequiredService<IDependency>()));

// Keyed services (multiple implementations)
builder.Services.AddKeyedSingleton<ICache, Cache1>("cache1");
builder.Services.AddKeyedSingleton<ICache, Cache2>("cache2");
```

### Injection Points

```csharp
// Constructor injection (preferred)
public class MyController(IMyService service)
{
    public void DoWork() => service.Execute();
}

// Minimal APIs
app.MapGet("/", (IMyService service) => service.Execute());

// Keyed injection
app.MapGet("/cache1", ([FromKeyedServices("cache1")] ICache cache) => cache.Get());

// Middleware constructor + method injection
internal class MyMiddleware
{
    private readonly RequestDelegate _next;

    public MyMiddleware(RequestDelegate next, ISingletonService singleton)
    {
        _next = next;
    }

    public async Task InvokeAsync(HttpContext context, IScopedService scoped)
    {
        await _next(context);
    }
}
```

### Extension Methods Pattern

```csharp
namespace Microsoft.Extensions.DependencyInjection;

public static class MyServiceCollectionExtensions
{
    public static IServiceCollection AddMyServices(
        this IServiceCollection services, IConfiguration config)
    {
        services.Configure<MyOptions>(config.GetSection("MyOptions"));
        services.AddScoped<IMyService, MyService>();
        services.AddScoped<IMyRepository, MyRepository>();

        return services;
    }
}

// Usage
builder.Services.AddMyServices(builder.Configuration);
```

### Service Disposal

```csharp
// Scoped: disposed at end of request
// Singleton: disposed when app shuts down
// Container disposes automatically - never manually dispose

// Resolve at startup (scoped service example)
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var service = scope.ServiceProvider.GetRequiredService<IMyService>();
    service.Initialize();
}
```

---

## 4. Rate Limiting

### Configuration

```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddRateLimiter(options =>
{
    // Global limiter (applies to all endpoints automatically)
    options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? context.Request.Headers.Host.ToString(),
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10,
                Window = TimeSpan.FromMinutes(1)
            }));

    // Custom rejection handler
    options.OnRejected = async (context, cancellationToken) =>
    {
        context.HttpContext.Response.StatusCode = StatusCodes.Status429TooManyRequests;
        if (context.Lease.TryGetMetadata(MetadataName.RetryAfter, out var retryAfter))
        {
            context.HttpContext.Response.Headers.RetryAfter =
                ((int)retryAfter.TotalSeconds).ToString();
        }
        await context.HttpContext.Response.WriteAsync(
            "Rate limit exceeded. Please try again later.", cancellationToken);
    };
});

var app = builder.Build();

// UseRouting MUST come before UseRateLimiter for endpoint-specific limiters
app.UseRouting();
app.UseRateLimiter();
```

### Named Rate Limiting Policies

```csharp
builder.Services.AddRateLimiter(options =>
{
    // Fixed Window
    options.AddFixedWindowLimiter("fixed", opt =>
    {
        opt.PermitLimit = 4;
        opt.Window = TimeSpan.FromSeconds(12);
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 2;
    });

    // Sliding Window
    options.AddSlidingWindowLimiter("sliding", opt =>
    {
        opt.PermitLimit = 100;
        opt.Window = TimeSpan.FromSeconds(30);
        opt.SegmentsPerWindow = 3;
        opt.QueueLimit = 5;
    });

    // Token Bucket
    options.AddTokenBucketLimiter("token", opt =>
    {
        opt.TokenLimit = 100;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 0;
        opt.ReplenishmentPeriod = TimeSpan.FromSeconds(10);
        opt.TokensPerPeriod = 20;
        opt.AutoReplenishment = true;
    });

    // Concurrency (concurrent requests only, not time-based)
    options.AddConcurrencyLimiter("concurrency", opt =>
    {
        opt.PermitLimit = 50;
        opt.QueueProcessingOrder = QueueProcessingOrder.OldestFirst;
        opt.QueueLimit = 10;
    });
});

var app = builder.Build();
app.UseRouting();
app.UseRateLimiter();

// Apply to endpoints
app.MapGet("/api/limited", () => "Limited")
    .RequireRateLimiting("fixed");

// Apply to groups
app.MapGroup("/admin")
    .RequireRateLimiting("sliding")
    .MapGet("/", () => "Admin");
```

### Partitioned Rate Limiting

```csharp
// By IP Address
options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 50,
            Window = TimeSpan.FromMinutes(1)
        }));

// By User Identity
options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
    RateLimitPartition.GetFixedWindowLimiter(
        partitionKey: context.User.Identity?.Name ?? "anonymous",
        factory: _ => new FixedWindowRateLimiterOptions
        {
            PermitLimit = 100,
            Window = TimeSpan.FromMinutes(1)
        }));

// By API Key with tiered limits
options.GlobalLimiter = PartitionedRateLimiter.Create<HttpContext, string>(context =>
{
    string apiKey = context.Request.Headers["X-API-Key"].ToString() ?? "default";

    return apiKey switch
    {
        "premium-key" => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: apiKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 1000,
                Window = TimeSpan.FromMinutes(1)
            }),
        _ => RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: apiKey,
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            })
    };
});

// Chained limiters (multiple limiters apply)
options.GlobalLimiter = PartitionedRateLimiter.CreateChained(
    // Per-user limit
    PartitionedRateLimiter.Create<HttpContext, string>(context =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: context.User.Identity?.Name ?? "anon",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 100,
                Window = TimeSpan.FromMinutes(1)
            })),

    // Global limit
    PartitionedRateLimiter.Create<HttpContext, string>(_ =>
        RateLimitPartition.GetFixedWindowLimiter(
            partitionKey: "global",
            factory: _ => new FixedWindowRateLimiterOptions
            {
                PermitLimit = 10000,
                Window = TimeSpan.FromMinutes(1)
            })));
```

---

## 5. Native AOT Support

### Configuration

```xml
<!-- .csproj -->
<PropertyGroup>
    <PublishAot>true</PublishAot>
    <EmitCompilerGeneratedFiles>true</EmitCompilerGeneratedFiles>
</PropertyGroup>
```

### WebApplication Setup

```csharp
using System.Text.Json.Serialization;

var builder = WebApplication.CreateSlimBuilder(args);
builder.Logging.AddConsole();

// Configure JSON serialization with source generation
builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.TypeInfoResolverChain.Insert(
        0, AppJsonSerializerContext.Default);
});

var app = builder.Build();

var todos = new[] { new Todo { Id = 1, Title = "Learn AOT" } };

var todosApi = app.MapGroup("/todos");
todosApi.MapGet("/", () => todos);
todosApi.MapGet("/{id}", (int id) =>
    todos.FirstOrDefault(t => t.Id == id) is { } todo
        ? Results.Ok(todo)
        : Results.NotFound());

app.Run();

// Source generated JSON serializer context
[JsonSerializable(typeof(Todo[]))]
[JsonSerializable(typeof(Todo))]
internal partial class AppJsonSerializerContext : JsonSerializerContext
{
}

public class Todo
{
    public int Id { get; set; }
    public string? Title { get; set; }
    public bool IsComplete { get; set; }
}
```

### Key Differences: CreateSlimBuilder vs CreateBuilder

`CreateSlimBuilder`:
- Minimal dependencies (no MVC, no IIS support, no Windows EventLog)
- Includes JSON config, user secrets, console logging
- Optimized for trimming and AOT
- No HTTPS/HTTP3 by default (behind TLS termination)

```csharp
// Enable HTTPS if needed
builder.WebHost.UseKestrelHttpsConfiguration();

// Enable HTTP/3
builder.WebHost.UseQuic();
```

### AOT Compatibility Status

| Feature | Support |
|---------|---------|
| Minimal APIs | Partial |
| gRPC | Full |
| JWT Auth | Full |
| CORS | Full |
| Health Checks | Full |
| Rate Limiting | Full |
| MVC | Not Supported |
| Blazor Server | Not Supported |
| Other Auth | Not Supported |

---

## 6. Minimal APIs & WebApplication

### Basic WebApplication

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Automatic middleware injection in .NET 7+:
// - UseDeveloperExceptionPage (if Development)
// - UseRouting (if endpoints configured)
// - UseAuthentication/UseAuthorization (if configured)
// - UseEndpoints (if endpoints configured)

app.MapGet("/", () => "Hello World!");
app.Run();
```

### WebApplicationBuilder Customization

```csharp
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    Args = args,
    ApplicationName = typeof(Program).Assembly.FullName,
    ContentRootPath = Directory.GetCurrentDirectory(),
    EnvironmentName = Environments.Staging,
    WebRootPath = "customwwwroot"
});

// Environment configuration
Console.WriteLine($"Environment: {builder.Environment.EnvironmentName}");
Console.WriteLine($"Content Root: {builder.Environment.ContentRootPath}");

// Configure services
builder.Services.AddControllers();
builder.Services.AddScoped<IMyService, MyService>();
builder.Services.Configure<MyOptions>(
    builder.Configuration.GetSection("MySection"));

var app = builder.Build();

// Conditional middleware
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

app.MapControllers();
app.Run();
```

### Port Configuration

```csharp
// Multiple ports
app.Urls.Add("http://localhost:3000");
app.Urls.Add("http://localhost:4000");

// Listen on all interfaces
app.Urls.Add("http://*:3000");
app.Urls.Add("http://+:3000");
app.Urls.Add("http://0.0.0.0:3000");

// Custom certificate
using System.Security.Cryptography.X509Certificates;

builder.WebHost.ConfigureKestrel(options =>
{
    options.ConfigureHttpsDefaults(httpsOptions =>
    {
        var certPath = Path.Combine(builder.Environment.ContentRootPath, "cert.pem");
        var keyPath = Path.Combine(builder.Environment.ContentRootPath, "key.pem");
        httpsOptions.ServerCertificate = X509Certificate2.CreateFromPemFile(
            certPath, keyPath);
    });
});

app.Urls.Add("https://localhost:3000");
app.Run();
```

### Configuration & DI Access

```csharp
var builder = WebApplication.CreateBuilder(args);

// Access configuration
var message = builder.Configuration["HelloKey"] ?? "Default";
var dbConnection = builder.Configuration.GetConnectionString("DefaultConnection");

// Register services
builder.Services.AddControllers();
builder.Services.AddScoped<SampleService>();

var app = builder.Build();

// Access configuration in app
var appMessage = app.Configuration["HelloKey"];

// Access DI services at startup
using (var scope = app.Services.CreateScope())
{
    var sampleService = scope.ServiceProvider.GetRequiredService<SampleService>();
    sampleService.Initialize();
}

app.Logger.LogInformation("App started");
app.MapControllers();
app.Run();
```

---

## 7. Options Pattern

### Basic Options Class

```csharp
public class PositionOptions
{
    public const string Position = "Position";

    public string? Name { get; set; }
    public string? Title { get; set; }
}
```

### JSON Configuration

```json
{
  "Position": {
    "Name": "Joe Smith",
    "Title": "Editor"
  }
}
```

### Registration and Usage

```csharp
var builder = WebApplication.CreateBuilder(args);

// Register and bind options
builder.Services.Configure<PositionOptions>(
    builder.Configuration.GetSection(PositionOptions.Position));

var app = builder.Build();

// Use IOptions<T> - read once, doesn't update
app.MapGet("/position", (IOptions<PositionOptions> options) =>
{
    return $"Name: {options.Value.Name}, Title: {options.Value.Title}";
});

// Use IOptionsSnapshot<T> - reads per request
app.MapGet("/position-snapshot", (IOptionsSnapshot<PositionOptions> options) =>
{
    return options.Value;
});

// Use IOptionsMonitor<T> - live updates, best for dynamic config
app.MapGet("/position-monitor", (IOptionsMonitor<PositionOptions> options) =>
{
    return options.CurrentValue;
});

app.Run();
```

### Options Validation

```csharp
builder.Services.Configure<ApiSettings>(
    builder.Configuration.GetSection("Api"))
    .ValidateDataAnnotations()
    .ValidateOnStart();

// Custom validator
builder.Services.AddOptions<ApiSettings>()
    .Configure(settings =>
    {
        // Manual configuration
    })
    .Validate(settings =>
    {
        return settings.Timeout > 0 && settings.Timeout < 60;
    }, "Timeout must be between 1 and 60 seconds")
    .ValidateOnStart();

public class ApiSettings
{
    [Range(1, 60)]
    public int Timeout { get; set; }

    [Required]
    [EmailAddress]
    public string? ContactEmail { get; set; }
}
```

---

## 8. Runtime Environments

### Setting the Environment

```csharp
// Option 1: Environment variables
// ASPNETCORE_ENVIRONMENT=Staging (takes precedence)
// DOTNET_ENVIRONMENT=Staging (fallback)

// Option 2: launchSettings.json
{
  "profiles": {
    "https": {
      "commandName": "Project",
      "environmentVariables": {
        "ASPNETCORE_ENVIRONMENT": "Staging"
      }
    }
  }
}

// Option 3: Code
var builder = WebApplication.CreateBuilder(new WebApplicationOptions
{
    EnvironmentName = Environments.Staging
});

// Option 4: Command line
// dotnet run -e Staging
// dotnet run -lp "https"

// Option 5: Docker
// ENV ASPNETCORE_ENVIRONMENT=Production
// docker run -e ASPNETCORE_ENVIRONMENT=Staging image
```

### Conditional Middleware

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Check during service configuration
if (app.Environment.IsDevelopment())
{
    builder.Services.AddDatabaseDeveloperPageExceptionFilter();
}

// Check during middleware configuration
if (!app.Environment.IsDevelopment())
{
    app.UseExceptionHandler("/Error");
    app.UseHsts();
}

// Built-in checks
if (app.Environment.IsDevelopment()) { }
if (app.Environment.IsProduction()) { }
if (app.Environment.IsStaging()) { }
if (app.Environment.IsEnvironment("Custom")) { }

app.MapGet("/", () => $"Environment: {app.Environment.EnvironmentName}");
app.Run();
```

### Environment-Specific Startup Classes (Legacy)

```csharp
public class StartupDevelopment
{
    public void ConfigureServices(IServiceCollection services)
    {
        services.AddDatabaseDeveloperPageExceptionFilter();
    }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseDeveloperExceptionPage();
        app.UseRouting();
        app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
}

public class StartupProduction
{
    public void ConfigureServices(IServiceCollection services) { }

    public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseExceptionHandler("/Error");
        app.UseHsts();
        app.UseRouting();
        app.UseEndpoints(endpoints => endpoints.MapControllers());
    }
}

public class Startup
{
    // Fallback if no environment-specific class exists
}

// In Program.cs or Startup method
public static IHostBuilder CreateHostBuilder(string[] args)
{
    var assemblyName = typeof(Startup).Assembly.FullName;
    return Host.CreateDefaultBuilder(args)
        .ConfigureWebHostDefaults(webBuilder =>
        {
            webBuilder.UseStartup(assemblyName);
        });
}
```

### Access Environment in Razor Components

```razor
@inject IHostEnvironment Env

@if (Env.IsDevelopment())
{
    <div>Development environment</div>
}

@if (Env.IsProduction())
{
    <div>Production environment</div>
}

@if (Env.IsEnvironment("Staging"))
{
    <div>Staging environment</div>
}

@code {
    private void LogEnvironment()
    {
        Console.WriteLine($"Current: {Env.EnvironmentName}");
    }
}
```

---

## Key Differences from Earlier Versions

### .NET 10 Enhancements
- **Middleware**: UseAntiforgery added, middleware order more strict
- **Rate Limiting**: Enhanced partitioning, chained limiters, better metrics
- **Minimal APIs**: Improved endpoint filtering, better metadata support
- **Native AOT**: More features supported (SignalR partial, Minimal APIs partial)
- **Options**: Better validation with ValidateOnStart
- **Environments**: DOTNET_ENVIRONMENT takes precedence for WebApplication

### Breaking Changes to Watch
- CORS must come before UseResponseCaching
- UseRouting required for endpoint-specific rate limiting
- Some authentication methods not AOT-compatible
- Regex constraints not fully AOT-compatible

---

## Testing Checklist

Before deploying ASP.NET Core 10 code:
- [ ] Test middleware order under load
- [ ] Verify rate limiting behavior with stress tests
- [ ] Check options are updated when using IOptionsMonitor
- [ ] Validate environment-specific config loads correctly
- [ ] Test AOT compilation if PublishAot=true
- [ ] Verify JSON serialization works (check source generators)
- [ ] Test DI scope lifetime expectations
- [ ] Validate routing constraints for special characters

