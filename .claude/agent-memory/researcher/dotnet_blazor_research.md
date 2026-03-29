---
name: .NET/Blazor Comprehensive Research
description: Structured documentation on Blazor Web Apps, ASP.NET Core microservices, component patterns, and enterprise architecture for .NET 10
type: reference
---

# .NET/Blazor Comprehensive Documentation Research
**Date**: 2026-03-29
**Scope**: Blazor Web App render modes, microservices architecture, component lifecycle, authentication, and enterprise patterns

---

## 1. BLAZOR WEB APP RENDER MODES (.NET 10)

### Overview
Blazor Web Apps in .NET 10 support multiple rendering strategies for different scenarios:

#### InteractiveServer (Server-side Interactivity)
- **Best for**: Enterprise apps, real-time collaboration, complex state management
- **Architecture**: WebSocket connection to server, stateful per-user
- **Performance**: Low latency for interactive features, requires SignalR
- **Example Use**: Live dashboards, collaborative editing, real-time notifications
- **Code Pattern**:
  ```csharp
  @rendermode InteractiveServer
  @page "/dashboard"
  @implements IAsyncDisposable

  <div>@CurrentData</div>

  @code {
    private string CurrentData;
    private Timer? timer;

    protected override async Task OnInitializedAsync()
    {
      timer = new Timer(async _ => {
        CurrentData = await FetchLatestData();
        await InvokeAsync(StateHasChanged);
      }, null, 0, 1000);
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
      if (timer is not null)
        await timer.DisposeAsync();
    }
  }
  ```

#### InteractiveWebAssembly (Client-side Interactivity)
- **Best for**: Offline-capable apps, lightweight dashboards, low-latency UI
- **Architecture**: WebAssembly runtime on client, stateless from server perspective
- **Performance**: High latency after initial load, reduces server load
- **Example Use**: Static content with client-side interactions, PWAs
- **Code Pattern**:
  ```csharp
  @rendermode InteractiveWebAssembly
  @page "/calculator"

  <div>
    <input @bind="value" type="number" />
    <button @onclick="Calculate">Calculate</button>
    <p>Result: @result</p>
  </div>

  @code {
    private int value = 0;
    private int result = 0;

    private void Calculate()
    {
      result = value * 2; // Client-side only
    }
  }
  ```

#### InteractiveAuto (Adaptive Rendering)
- **Best for**: Multi-device support, hybrid applications
- **Behavior**: WebAssembly for modern browsers, Server fallback for older clients
- **Strategy**: Test capability at runtime, adapt gracefully
- **Code Pattern**:
  ```csharp
  @rendermode InteractiveAuto
  @page "/adaptive"

  @if (IsWebAssemblySupported)
  {
    <p>Running with WebAssembly interactivity (fastest)</p>
  }
  else
  {
    <p>Running with Server interactivity (fallback)</p>
  }
  ```

#### Static Rendering
- **Best for**: Content pages, SEO-critical content, public-facing sites
- **Architecture**: No interactive runtime, pure HTML/CSS
- **Performance**: Fastest initial load, no JavaScript overhead
- **Code Pattern**:
  ```csharp
  @page "/about"

  <h1>About Us</h1>
  <p>Static content rendered at build time or per-request.</p>
  ```

### Render Mode Selection Matrix
| Scenario | Recommended Mode | Rationale |
|----------|------------------|-----------|
| Real-time dashboard | InteractiveServer | Low latency, persistent connection |
| Offline-capable app | InteractiveWebAssembly | Client-side execution |
| Mixed device support | InteractiveAuto | Adaptive fallback |
| Public landing page | Static | SEO, performance |
| Form with validation | InteractiveServer | State complexity |
| SPA with light interactivity | InteractiveWebAssembly | Reduce server load |

---

## 2. BLAZOR COMPONENT LIFECYCLE

### Full Lifecycle Phases

```
Component Instance Created
    ↓
SetParametersAsync (receives parameters)
    ↓
OnInitialized / OnInitializedAsync (first-time init)
    ↓
OnParametersSet / OnParametersSetAsync (parameters changed)
    ↓
StateHasChanged triggered
    ↓
OnAfterRender / OnAfterRenderAsync (DOM rendered)
    ↓
Component Interactive
    ↓
OnParametersSet (if parameters change)
    ↓
OnAfterRender (after each render)
    ↓
Dispose / DisposeAsync (cleanup)
```

### Lifecycle Hooks Reference

#### SetParametersAsync
```csharp
public override async Task SetParametersAsync(ParameterView parameters)
{
  // Validate or transform parameters before assignment
  if (parameters.TryGetValue<int>("UserId", out var userId))
  {
    if (userId <= 0)
      throw new ArgumentException("UserId must be positive");
  }

  await base.SetParametersAsync(parameters);
}
```

#### OnInitialized / OnInitializedAsync
```csharp
protected override async Task OnInitializedAsync()
{
  // Called once when component first initializes
  // Perfect for loading data, setting up subscriptions
  Users = await UserService.GetAllAsync();

  // Subscribe to events
  EventBus.Subscribe("UserUpdated", OnUserUpdated);
}
```

#### OnParametersSet / OnParametersSetAsync
```csharp
protected override async Task OnParametersSetAsync()
{
  // Called when parameters change (including initial set)
  if (UserId > 0 && UserId != previousUserId)
  {
    CurrentUser = await UserService.GetByIdAsync(UserId);
    previousUserId = UserId;
  }
}

private int previousUserId;
```

#### OnAfterRender / OnAfterRenderAsync
```csharp
protected override async Task OnAfterRenderAsync(bool firstRender)
{
  if (firstRender)
  {
    // Only after first render to DOM
    await JsInterop.InitializeChartAsync(chartRef);
  }

  // Called after every render
  if (dataChanged)
  {
    await JsInterop.UpdateChartAsync(newData);
  }
}
```

#### StateHasChanged
```csharp
private async Task UpdateData()
{
  Data = await Service.FetchAsync();

  // Manually trigger re-render if automatic detection doesn't work
  StateHasChanged();
}
```

#### Dispose / DisposeAsync
```csharp
public void Dispose()
{
  EventBus.Unsubscribe("UserUpdated", OnUserUpdated);
}

public async ValueTask DisposeAsync()
{
  // Async cleanup (e.g., database connections)
  await DisposeJsInteropAsync();

  if (this is IAsyncDisposable asyncDisposable)
    await asyncDisposable.DisposeAsync();
}
```

### Common Lifecycle Patterns

**Pattern 1: Data Loading with Caching**
```csharp
[Parameter] public int UserId { get; set; }

private User? cachedUser;
private int cachedUserId;

protected override async Task OnParametersSetAsync()
{
  if (UserId != cachedUserId)
  {
    cachedUser = await UserService.GetByIdAsync(UserId);
    cachedUserId = UserId;
  }
}
```

**Pattern 2: Parameter Validation with Feedback**
```csharp
[Parameter] public string? Filter { get; set; }

public override async Task SetParametersAsync(ParameterView parameters)
{
  var filter = (string?)parameters.GetValueOrDefault("Filter");

  if (filter?.Length > 100)
  {
    ErrorMessage = "Filter too long";
    return;
  }

  await base.SetParametersAsync(parameters);
}
```

---

## 3. ASP.NET CORE MICROSERVICES ARCHITECTURE

### Microservices Communication Patterns

#### 1. gRPC (Recommended for Internal Services)
**Use when**: Services are internal, performance-critical, need streaming

```csharp
// Proto definition (greeter.proto)
syntax = "proto3";

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc StreamGreetings (HelloRequest) returns (stream HelloReply);
}

message HelloRequest {
  string name = 1;
}

message HelloReply {
  string message = 1;
}

// Server implementation
public class GreeterService : Greeter.GreeterBase
{
  public override Task<HelloReply> SayHello(
    HelloRequest request, ServerCallContext context)
  {
    return Task.FromResult(new HelloReply
    {
      Message = $"Hello {request.Name}"
    });
  }

  public override async Task StreamGreetings(
    HelloRequest request, IServerStreamWriter<HelloReply> responseStream,
    ServerCallContext context)
  {
    for (int i = 0; i < 10; i++)
    {
      await responseStream.WriteAsync(new HelloReply
      {
        Message = $"Hello {request.Name} #{i}"
      });
      await Task.Delay(1000);
    }
  }
}

// Client usage
var channel = GrpcChannel.ForAddress("https://localhost:5001");
var client = new Greeter.GreeterClient(channel);

var reply = await client.SayHelloAsync(new HelloRequest { Name = "Alice" });
Console.WriteLine(reply.Message);
```

#### 2. REST/HTTP (Recommended for Public APIs)
**Use when**: Public API, third-party integration, web clients

```csharp
// Minimal API approach (.NET 10)
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<IUserService, UserService>();

var app = builder.Build();

// GET /users
app.MapGet("/users", async (IUserService service) =>
  await service.GetAllAsync())
  .WithName("GetUsers")
  .WithOpenApi();

// GET /users/{id}
app.MapGet("/users/{id}", async (int id, IUserService service) =>
{
  var user = await service.GetByIdAsync(id);
  return user is not null ? Results.Ok(user) : Results.NotFound();
})
.WithName("GetUserById")
.WithOpenApi();

// POST /users
app.MapPost("/users", async (CreateUserRequest req, IUserService service) =>
{
  var user = await service.CreateAsync(req);
  return Results.Created($"/users/{user.Id}", user);
})
.WithName("CreateUser")
.WithOpenApi();

app.Run();
```

#### 3. Message Queue/Event Bus (For Async Operations)
**Use when**: Decoupled services, eventual consistency, background jobs

```csharp
// Event definition
public record UserCreatedEvent(int UserId, string Email, DateTime CreatedAt);

// Publisher (User Service)
public class UserService
{
  private readonly IPublisher _publisher;

  public async Task<User> CreateAsync(CreateUserRequest request)
  {
    var user = new User { Email = request.Email };
    await _context.Users.AddAsync(user);
    await _context.SaveChangesAsync();

    // Publish event
    await _publisher.Publish(new UserCreatedEvent(
      user.Id, user.Email, DateTime.UtcNow));

    return user;
  }
}

// Subscriber (Notification Service)
public class UserCreatedEventHandler : INotificationHandler<UserCreatedEvent>
{
  private readonly IEmailService _emailService;

  public async Task Handle(UserCreatedEvent notification,
    CancellationToken cancellationToken)
  {
    await _emailService.SendWelcomeEmailAsync(notification.Email);
  }
}
```

### Microservices Architecture Pattern
```
┌─────────────────────────────────────────────────────┐
│ API Gateway (Ocelot / Azure APIM)                  │
└────────────┬────────────┬────────────┬──────────────┘
             │            │            │
    ┌────────▼─────┐ ┌────▼────┐ ┌───▼──────┐
    │ User Service │ │ Product  │ │ Order    │
    │              │ │ Service  │ │ Service  │
    │ gRPC port    │ │ REST API │ │ gRPC     │
    │ :5001        │ │ :5002    │ │ :5003    │
    └────────┬─────┘ └────┬────┘ └───┬──────┘
             │            │          │
    ┌────────▼────────────▼──────────▼─────┐
    │      Event Bus / Message Queue       │
    │   (RabbitMQ, Azure Service Bus)      │
    └──────────────────────────────────────┘
             │
    ┌────────▼──────────┐
    │ Service Discovery │
    │ (Consul, k8s)     │
    └───────────────────┘
```

### Resilience Patterns

**Circuit Breaker Pattern** (Polly)
```csharp
var policy = Policy
  .Handle<HttpRequestException>()
  .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
  .CircuitBreaker(
    handledEventsAllowedBeforeBreaking: 3,
    durationOfBreak: TimeSpan.FromSeconds(30))
  .Wrap(Policy.Timeout<HttpResponseMessage>(TimeSpan.FromSeconds(10)));

var response = await policy.ExecuteAsync(async () =>
  await httpClient.GetAsync("https://api.example.com/data"));
```

**Retry Policy**
```csharp
var retryPolicy = Policy
  .Handle<HttpRequestException>()
  .Or<TimeoutRejectedException>()
  .WaitAndRetryAsync(
    retryCount: 3,
    sleepDurationProvider: attempt =>
      TimeSpan.FromMilliseconds(Math.Pow(2, attempt) * 100),
    onRetry: (outcome, timespan, retryCount, context) =>
    {
      Console.WriteLine($"Retry {retryCount} after {timespan.TotalMilliseconds}ms");
    });
```

---

## 4. .NET ASPIRE ORCHESTRATION

### Purpose
.NET Aspire simplifies multi-service development with service discovery, configuration, and health checks.

### Basic Setup
```csharp
// AppHost project (orchestration)
var builder = DistributedApplication.CreateBuilder(args);

var cache = builder.AddRedis("cache");
var postgres = builder.AddPostgres("postgres")
  .AddDatabase("mydb");

var apiService = builder.AddProject<Projects.ApiService>("api")
  .WithReference(cache)
  .WithReference(postgres)
  .WithHttpEndpoint(port: 5001, name: "http");

var webApp = builder.AddProject<Projects.Web>("web")
  .WithReference(apiService)
  .WithHttpEndpoint(port: 5000, name: "http");

builder.Build().Run();

// Service startup (in individual services)
var builder = Host.CreateApplicationBuilder(args);

builder.AddServiceDefaults(); // .NET Aspire defaults
builder.Services.AddRedisClient("cache");
builder.Services.AddNpgsqlDataSource("mydb");

var app = builder.Build();
app.UseServiceDefaults(); // Health checks, etc.
app.Run();
```

### Key Components
1. **Service Discovery**: Automatic hostname resolution
2. **Health Checks**: Automatic aggregation and monitoring
3. **Distributed Tracing**: OpenTelemetry integration
4. **Configuration**: Centralized secrets and config

---

## 5. ENTITY FRAMEWORK CORE (.NET 10)

### DbContext Setup
```csharp
public class AppDbContext : DbContext
{
  public DbSet<User> Users => Set<User>();
  public DbSet<Post> Posts => Set<Post>();

  public AppDbContext(DbContextOptions<AppDbContext> options)
    : base(options) { }

  protected override void OnModelCreating(ModelBuilder modelBuilder)
  {
    // User-Post relationship
    modelBuilder.Entity<User>()
      .HasMany(u => u.Posts)
      .WithOne(p => p.Author)
      .HasForeignKey(p => p.AuthorId)
      .OnDelete(DeleteBehavior.Cascade);

    // Unique constraint
    modelBuilder.Entity<User>()
      .HasIndex(u => u.Email)
      .IsUnique();

    // Value conversion
    modelBuilder.Entity<User>()
      .Property(u => u.Role)
      .HasConversion(v => v.ToString(), v => Enum.Parse<UserRole>(v));
  }
}

public class User
{
  public int Id { get; set; }
  public string Email { get; set; } = "";
  public string PasswordHash { get; set; } = "";
  public UserRole Role { get; set; }
  public ICollection<Post> Posts { get; set; } = new List<Post>();
}

public class Post
{
  public int Id { get; set; }
  public string Title { get; set; } = "";
  public string Content { get; set; } = "";
  public int AuthorId { get; set; }
  public User Author { get; set; } = null!;
}

public enum UserRole { User, Admin }
```

### Common Queries
```csharp
// Filtering and projection
var activeUsers = await context.Users
  .Where(u => u.IsActive)
  .Select(u => new { u.Id, u.Email })
  .ToListAsync();

// Include related data
var postsWithAuthors = await context.Posts
  .Include(p => p.Author)
  .Where(p => p.CreatedAt > DateTime.UtcNow.AddDays(-7))
  .OrderByDescending(p => p.CreatedAt)
  .ToListAsync();

// Aggregation
var userPostCounts = await context.Users
  .Select(u => new
  {
    u.Email,
    PostCount = u.Posts.Count()
  })
  .ToListAsync();

// Raw SQL with parameterization
var users = await context.Users
  .FromSqlInterpolated(
    $"SELECT * FROM users WHERE email = {email}")
  .ToListAsync();
```

---

## 6. BLAZOR AUTHENTICATION & AUTHORIZATION

### Setup with JWT
```csharp
// Startup configuration
var builder = WebApplicationBuilder.CreateBuilder(args);

builder.Services.AddAuthentication(options =>
{
  options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
  options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddJwtBearer(options =>
{
  options.TokenValidationParameters = new TokenValidationParameters
  {
    ValidateIssuer = true,
    ValidIssuer = builder.Configuration["Jwt:Issuer"],
    ValidateAudience = true,
    ValidAudience = builder.Configuration["Jwt:Audience"],
    ValidateLifetime = true,
    IssuerSigningKey = new SymmetricSecurityKey(
      Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]))
  };
});

builder.Services.AddAuthorization(options =>
{
  options.AddPolicy("AdminOnly", policy =>
    policy.RequireRole("Admin"));

  options.AddPolicy("CanModifyUsers", policy =>
    policy.RequireClaim("permission", "user:modify"));
});

var app = builder.Build();
app.UseAuthentication();
app.UseAuthorization();
```

### Component Usage
```csharp
@page "/admin"
@attribute [Authorize(Roles = "Admin")]
@using System.Security.Claims

<h1>Admin Dashboard</h1>

@if (User?.Identity?.IsAuthenticated ?? false)
{
  <p>Welcome, @User.Identity.Name</p>

  <p>Your roles:</p>
  <ul>
    @foreach (var claim in User.FindAll(ClaimTypes.Role))
    {
      <li>@claim.Value</li>
    }
  </ul>
}
else
{
  <p>You are not authenticated.</p>
}

@code {
  [CascadingParameter]
  private Task<AuthenticationState>? authenticationStateTask { get; set; }

  private ClaimsPrincipal? User;

  protected override async Task OnInitializedAsync()
  {
    if (authenticationStateTask != null)
    {
      var state = await authenticationStateTask;
      User = state.User;
    }
  }
}
```

---

## 7. BLAZOR JAVASCRIPT INTEROP

### Calling JavaScript from C#
```csharp
@page "/js-interop"
@inject IJSRuntime JsRuntime

<div @ref="chartRef"></div>
<button @onclick="InitializeChart">Init Chart</button>

@code {
  private ElementReference chartRef;

  private async Task InitializeChart()
  {
    // Call JS function
    await JsRuntime.InvokeVoidAsync(
      "initChart", chartRef, new { /* options */ });
  }

  // With return value
  private async Task GetData()
  {
    var data = await JsRuntime.InvokeAsync<string>(
      "getLocalStorageData", "myKey");
  }
}
```

### JavaScript Module (.js file)
```javascript
export function initChart(element, options) {
  console.log('Initializing chart with options:', options);
  // Use Chart.js, D3, etc.
}

export function getLocalStorageData(key) {
  return localStorage.getItem(key);
}
```

---

## 8. SIGNALR REAL-TIME BLAZOR

### Hub Setup
```csharp
public class NotificationHub : Hub
{
  public override async Task OnConnectedAsync()
  {
    await Clients.All.SendAsync("UserConnected",
      Context.ConnectionId);
    await base.OnConnectedAsync();
  }

  public async Task SendMessage(string user, string message)
  {
    await Clients.All.SendAsync("ReceiveMessage", user, message);
  }

  public async Task SendToUser(string userId, string message)
  {
    await Clients.User(userId).SendAsync(
      "ReceivePrivateMessage", message);
  }

  public async Task NotifyGroup(string group, string message)
  {
    await Clients.Group(group).SendAsync(
      "GroupMessage", message);
  }
}

// Startup
app.MapHub<NotificationHub>("/notification-hub");
```

### Component Usage
```csharp
@page "/notifications"
@implements IAsyncDisposable
@inject NavigationManager Navigation

<div>
  @foreach (var msg in Messages)
  {
    <p>@msg</p>
  }
</div>

<input @bind="input" />
<button @onclick="SendMessage">Send</button>

@code {
  private List<string> Messages = new();
  private string input = "";
  private HubConnection? hubConnection;

  protected override async Task OnInitializedAsync()
  {
    hubConnection = new HubConnectionBuilder()
      .WithUrl(Navigation.ToAbsoluteUri("/notification-hub"))
      .WithAutomaticReconnect()
      .Build();

    hubConnection.On<string, string>("ReceiveMessage",
      (user, message) =>
      {
        Messages.Add($"{user}: {message}");
        InvokeAsync(StateHasChanged);
      });

    await hubConnection.StartAsync();
  }

  private async Task SendMessage()
  {
    if (hubConnection is not null)
    {
      await hubConnection.SendAsync("SendMessage",
        "CurrentUser", input);
      input = "";
    }
  }

  async ValueTask IAsyncDisposable.DisposeAsync()
  {
    if (hubConnection is not null)
      await hubConnection.DisposeAsync();
  }
}
```

---

## 9. SYNCFUSION BLAZOR COMPONENTS

### Installation & Setup
```bash
# NuGet
dotnet add package Syncfusion.Blazor.Core
dotnet add package Syncfusion.Blazor.Grids
dotnet add package Syncfusion.Blazor.Calendars
```

```html
<!-- _Host.cshtml -->
<link href="_content/Syncfusion.Blazor.Core/styles/bootstrap5.css" rel="stylesheet" />
<script src="_content/Syncfusion.Blazor.Core/scripts/syncfusion-blazor.min.js"></script>
```

### Common Components

**DataGrid**
```csharp
@using Syncfusion.Blazor.Grids

<SfGrid DataSource="@Orders" AllowPaging="true" AllowSorting="true">
  <GridColumns>
    <GridColumn Field="@nameof(Order.OrderID)" Width="100"></GridColumn>
    <GridColumn Field="@nameof(Order.CustomerName)" Width="200"></GridColumn>
    <GridColumn Field="@nameof(Order.TotalAmount)" Width="150"></GridColumn>
  </GridColumns>
</SfGrid>

@code {
  private List<Order> Orders = new();

  protected override async Task OnInitializedAsync()
  {
    Orders = await OrderService.GetAllAsync();
  }
}
```

**DatePicker**
```csharp
@using Syncfusion.Blazor.Calendars

<SfDatePicker @bind-Value="SelectedDate"
  Placeholder="Select Date">
</SfDatePicker>

@code {
  private DateTime SelectedDate = DateTime.Now;
}
```

---

## 10. KEY PATTERNS & BEST PRACTICES

### 1. Dependency Injection
```csharp
// Registration
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddSingleton<ICache, RedisCache>();
builder.Services.AddTransient<IEmailService, EmailService>();

// Usage in component
@inject IUserService UserService

@code {
  protected override async Task OnInitializedAsync()
  {
    Users = await UserService.GetAllAsync();
  }
}
```

### 2. Component Cascading Parameters
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

### 3. Error Boundaries
```csharp
@page "/error-demo"

<ErrorBoundary @ref="errorBoundary">
  <ChildContent>
    @if (somethingWrong)
      throw new InvalidOperationException("Demo error");
  </ChildContent>
  <ErrorContent Context="ex">
    <p>Error: @ex.Message</p>
    <button @onclick="() => errorBoundary?.Recover()">
      Try Again
    </button>
  </ErrorContent>
</ErrorBoundary>

@code {
  private ErrorBoundary? errorBoundary;
  private bool somethingWrong = false;
}
```

### 4. Virtualization (Large Lists)
```csharp
@using Microsoft.AspNetCore.Components.Web.Virtualization

<Virtualize Items="@LargeDataSet" Context="item">
  <ItemContent>
    <div>@item.Name</div>
  </ItemContent>
  <Placeholder>
    <p>Loading...</p>
  </Placeholder>
</Virtualize>

@code {
  private List<Item> LargeDataSet = new();
}
```

### 5. Two-Way Binding (@bind)
```csharp
<input @bind="name" />
<input @bind="name" @bind:event="oninput" />

<select @bind="selectedOption">
  @foreach (var opt in Options)
  {
    <option value="@opt.Id">@opt.Label</option>
  }
</select>

@code {
  private string name = "";
  private int selectedOption = 0;
}
```

---

## ARCHITECTURE RECOMMENDATIONS

### For Enterprise Applications
1. **Use InteractiveServer** for stateful, complex UIs
2. **Implement gRPC** for internal service communication
3. **Use .NET Aspire** for orchestration
4. **Add SignalR** for real-time features
5. **Implement circuit breakers** with Polly for resilience
6. **Use EF Core** with proper async patterns
7. **Implement JWT authentication** with role-based access

### For Public/High-Scale Applications
1. **Use InteractiveWebAssembly** or InteractiveAuto for client-heavy UIs
2. **Implement REST/HTTP** for public APIs
3. **Use async message queues** for decoupled operations
4. **Implement comprehensive caching** (Redis)
5. **Use Syncfusion** for professional UI components
6. **Implement distributed tracing** for observability

### For Hybrid Applications
1. **Use InteractiveAuto** render mode
2. **Combine gRPC and REST** based on client type
3. **Implement offline support** with service workers
4. **Use .NET Aspire** for local development

---

## ADDITIONAL RESOURCES

- Official: learn.microsoft.com/aspnet/blazor
- Patterns: docs.microsoft.com/architecture/microservices
- EF Core: learn.microsoft.com/ef/core
- SignalR: learn.microsoft.com/aspnet/signalr
- gRPC: learn.microsoft.com/aspnet/grpc
- Syncfusion: syncfusion.com/blazor-components

