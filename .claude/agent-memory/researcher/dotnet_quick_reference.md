---
name: .NET/Blazor Quick Reference
description: One-page cheat sheet for common .NET/Blazor patterns and setup
type: reference
---

# .NET/Blazor Quick Reference

## Render Mode Selection (Blazor Web Apps)

| Mode | Use When | Latency | Server Load |
|------|----------|---------|------------|
| **InteractiveServer** | Real-time, complex state | Low | High |
| **InteractiveWebAssembly** | Offline, light interactivity | High (initial) | Low |
| **InteractiveAuto** | Mixed devices, adaptive | Variable | Variable |
| **Static** | Content pages, SEO | N/A | Low |

## Component Lifecycle One-Liner Reference

```csharp
SetParametersAsync → OnInitialized → OnParametersSet → [StateHasChanged] → OnAfterRender → [Event Loop] → Dispose
```

## Dependency Injection Quick Setup

```csharp
// Register
builder.Services.AddScoped<IService, Service>();  // Per circuit/session
builder.Services.AddSingleton<ICache, Cache>();    // Single instance
builder.Services.AddTransient<IEmail, Email>();    // New per injection

// Use
@inject IService Service
```

## Minimal API (ASP.NET Core)

```csharp
app.MapGet("/users/{id}", async (int id, IUserService svc) =>
  await svc.GetAsync(id) is User u ? Results.Ok(u) : Results.NotFound())
.WithName("GetUser").WithOpenApi();

app.MapPost("/users", async (CreateUserRequest req, IUserService svc) =>
  Results.Created($"/users/{id}", await svc.CreateAsync(req)));
```

## gRPC Service Setup

```csharp
// Server
public class MyService : MyProto.MyProtoBase
{
  public override async Task<Response> MyMethod(Request req, ServerCallContext context)
  {
    return new Response { Result = "Done" };
  }
}

// Client
var client = new MyProto.MyProtoClient(channel);
var response = await client.MyMethodAsync(new Request());
```

## Entity Framework Core Query

```csharp
var users = await context.Users
  .Include(u => u.Posts)
  .Where(u => u.IsActive)
  .OrderByDescending(u => u.CreatedAt)
  .ToListAsync();
```

## Authentication Setup

```csharp
builder.Services
  .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
  .AddJwtBearer(opt => opt.TokenValidationParameters = new()
  {
    ValidIssuer = "issuer",
    ValidAudience = "audience",
    IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes("secret"))
  });

builder.Services.AddAuthorization(opt =>
  opt.AddPolicy("Admin", p => p.RequireRole("Admin")));
```

## Component Authentication Check

```csharp
@page "/admin"
@attribute [Authorize(Roles = "Admin")]

@if (User?.Identity?.IsAuthenticated ?? false)
{
  <p>Welcome, @User.Identity.Name</p>
}
```

## SignalR Hub Usage

```csharp
// Hub
public class ChatHub : Hub
{
  public async Task SendMessage(string user, string message)
  {
    await Clients.All.SendAsync("ReceiveMessage", user, message);
  }
}

// Component
hubConnection = new HubConnectionBuilder()
  .WithUrl(Navigation.ToAbsoluteUri("/chathub"))
  .Build();

hubConnection.On<string, string>("ReceiveMessage", (u, m) =>
{
  messages.Add($"{u}: {m}");
  InvokeAsync(StateHasChanged);
});

await hubConnection.StartAsync();
```

## JavaScript Interop

```csharp
// C# to JS
await JsRuntime.InvokeVoidAsync("functionName", param1, param2);
var result = await JsRuntime.InvokeAsync<string>("getFunctionName", param);

// JS file
export function functionName(param1, param2) { /* ... */ }
export function getFunctionName(param) { return "result"; }
```

## Error Handling - Error Boundary

```csharp
<ErrorBoundary @ref="boundary">
  <ChildContent>
    @* Component content *@
  </ChildContent>
  <ErrorContent Context="ex">
    <p>Error: @ex.Message</p>
    <button @onclick="() => boundary?.Recover()">Retry</button>
  </ErrorContent>
</ErrorBoundary>
```

## Two-Way Binding

```csharp
@* Basic *@
<input @bind="name" />

@* With event *@
<input @bind="name" @bind:event="oninput" />

@* Dropdown *@
<select @bind="selectedId">
  @foreach (var opt in Options)
  {
    <option value="@opt.Id">@opt.Label</option>
  }
</select>

@code {
  private string name = "";
  private int selectedId = 0;
}
```

## Cascading Parameters

```csharp
// Parent
<CascadingValue Value="this">
  @ChildContent
</CascadingValue>

// Child
@code {
  [CascadingParameter]
  private ParentComponent Parent { get; set; } = null!;
}
```

## Syncfusion DataGrid

```csharp
@using Syncfusion.Blazor.Grids

<SfGrid DataSource="@Items" AllowPaging="true" AllowSorting="true">
  <GridColumns>
    <GridColumn Field="@nameof(Item.Id)" Width="100"></GridColumn>
    <GridColumn Field="@nameof(Item.Name)" Width="200"></GridColumn>
  </GridColumns>
</SfGrid>

@code {
  private List<Item> Items = new();

  protected override async Task OnInitializedAsync()
  {
    Items = await Service.GetAllAsync();
  }
}
```

## .NET Aspire Project Setup

```csharp
// AppHost
var builder = DistributedApplication.CreateBuilder(args);

var db = builder.AddPostgres("postgres")
  .AddDatabase("mydb");

var api = builder.AddProject<Projects.Api>("api")
  .WithReference(db);

builder.Build().Run();

// Service Startup
var builder = Host.CreateApplicationBuilder(args);
builder.AddServiceDefaults();
builder.Services.AddNpgsqlDataSource("mydb");
var app = builder.Build();
app.UseServiceDefaults();
app.Run();
```

## Circuit Breaker Pattern (Polly)

```csharp
var policy = Policy
  .Handle<HttpRequestException>()
  .CircuitBreaker(3, TimeSpan.FromSeconds(30));

var response = await policy.ExecuteAsync(
  () => httpClient.GetAsync("https://api.example.com/data"));
```

## File Locations Reference

| Component | Location |
|-----------|----------|
| Blazor components | `Components/` |
| Services | `Services/` |
| DbContext | `Data/AppDbContext.cs` |
| Models | `Models/` or `Entities/` |
| API endpoints | `Program.cs` or `Endpoints/` |
| Styles | `Styles/` or `wwwroot/css/` |
| JavaScript | `wwwroot/js/` |

---

**See Full Documentation**: `dotnet_blazor_research.md`
