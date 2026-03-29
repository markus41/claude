---
name: .NET Microservices Comprehensive Research
description: Complete microservices patterns, Docker Compose, RabbitMQ, circuit breaker, IHostedService, API Gateway (Ocelot), and testing strategies for ASP.NET Core
type: reference
---

# .NET Microservices Architecture - Comprehensive Research

**Date**: 2026-03-29
**Source**: Microsoft Learn - .NET Microservices Architecture for Containerized .NET Applications
**Coverage**: 13 comprehensive documentation pages

---

## 1. RESILIENCE PATTERNS

### Circuit Breaker Pattern with Polly

**Key Concept**: Prevent cascading failures by stopping requests to failing services.

**Implementation with IHttpClientFactory**:
```csharp
// Program.cs
static IAsyncPolicy<HttpResponseMessage> GetCircuitBreakerPolicy()
{
    return HttpPolicyExtensions
        .HandleTransientHttpError()
        .CircuitBreakerAsync(5, TimeSpan.FromSeconds(30));
}

builder.Services.AddHttpClient<IBasketService, BasketService>()
    .SetHandlerLifetime(TimeSpan.FromMinutes(5))
    .AddPolicyHandler(GetRetryPolicy())
    .AddPolicyHandler(GetCircuitBreakerPolicy());
```

**Configuration**:
- Opens circuit after 5 consecutive failures
- Holds open for 30 seconds
- Automatically interprets relevant HTTP status codes as faults

**Testing Circuit Breaker**:
```csharp
public class CartController : Controller
{
    public async Task<IActionResult> Index()
    {
        try
        {
            var vm = await _basketSvc.GetBasket(user);
            return View(vm);
        }
        catch (BrokenCircuitException)
        {
            HandleBrokenCircuitException();
        }
        return View();
    }
}
```

### Retry Pattern
- Use HTTP retry with Polly for transient failures
- Implement exponential backoff
- Combine with circuit breaker to prevent DoS attacks
- Use `IHttpClientFactory` for managed HttpClient lifetime

### Key Resilience Principles
1. **Handle partial failures** - Accept that failures will occur
2. **Implement health monitoring** - Track component health
3. **Use retry policies** - With exponential backoff
4. **Apply circuit breakers** - After repeated failures
5. **Design for async communication** - Reduce blocking dependencies

---

## 2. SECURITY & SECRETS MANAGEMENT

### Authentication Options

#### ASP.NET Core Identity (Local Storage)
```csharp
// Program.cs
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddDefaultIdentity<IdentityUser>(options =>
    options.SignIn.RequireConfirmedAccount = true)
    .AddEntityFrameworkStores<ApplicationDbContext>();

app.UseAuthentication();
app.UseAuthorization();
```

#### JWT Bearer Token Authentication
```csharp
// Program.cs - Service consuming tokens
builder.Services.AddAuthentication(options =>
{
    options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
}).AddJwtBearer(options =>
{
    options.Authority = identityUrl;
    options.RequireHttpsMetadata = false;
    options.Audience = "orders";
});

// In Controller
[ApiController]
[Route("api/[controller]")]
[Authorize]
public class OrderController : ControllerBase { }
```

#### OpenID Connect Integration
```csharp
// Program.cs - Web app consuming identity provider
services.AddAuthentication(options =>
{
    options.DefaultScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
})
.AddCookie()
.AddOpenIdConnect(options =>
{
    options.SignInScheme = CookieAuthenticationDefaults.AuthenticationScheme;
    options.Authority = identityUrl;
    options.ClientId = "mvc";
    options.ClientSecret = "secret";
    options.ResponseType = "code id_token";
    options.SaveTokens = true;
    options.Scope.Add("openid");
    options.Scope.Add("profile");
    options.Scope.Add("orders");
});
```

### Azure Key Vault for Secrets

**Integration**:
```csharp
// Program.cs
var keyVaultUrl = builder.Configuration["KeyVault:VaultUri"];
builder.Configuration.AddAzureKeyVault(
    new Uri(keyVaultUrl),
    new DefaultAzureCredential()
);
```

**Best Practices**:
- Store as last configuration provider to override previous values
- Use Managed Identities for Azure authentication (recommended over client secrets)
- Rotate secrets regularly
- Use Azure AD application registration

---

## 3. DOCKER COMPOSE CONFIGURATION

### Multi-Container Application Example

```yaml
# docker-compose.yml (Base Configuration)
version: '3.4'

services:
  webmvc:
    image: eshop/webmvc:${TAG:-latest}
    build:
      context: .
      dockerfile: src/Web/WebMVC/Dockerfile
    depends_on:
      - catalog-api
      - ordering-api
      - basket-api

  catalog-api:
    image: eshop/catalog-api:${TAG:-latest}
    build:
      context: .
      dockerfile: src/Services/Catalog/Catalog.API/Dockerfile
    depends_on:
      - sqldata
      - rabbitmq

  ordering-api:
    image: eshop/ordering-api:${TAG:-latest}
    build:
      context: .
      dockerfile: src/Services/Ordering/Ordering.API/Dockerfile
    depends_on:
      - sqldata
      - rabbitmq

  basket-api:
    image: eshop/basket-api:${TAG:-latest}
    build:
      context: .
      dockerfile: src/Services/Basket/Basket.API/Dockerfile
    depends_on:
      - basketdata
      - rabbitmq

  sqldata:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      - ACCEPT_EULA=Y
      - SA_PASSWORD=${SA_PASSWORD}

  basketdata:
    image: redis:alpine

  rabbitmq:
    image: rabbitmq:3-management-alpine
```

### Override Files for Environments

```yaml
# docker-compose.override.yml (Development)
version: '3.4'

services:
  catalog-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ASPNETCORE_URLS=http://0.0.0.0:80
      - ConnectionString=Server=sqldata;Database=CatalogDb;User Id=sa;Password=${SA_PASSWORD}
    ports:
      - "5101:80"

  basket-api:
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionString=basketdata
    ports:
      - "5103:80"

  sqldata:
    ports:
      - "5433:1433"
    environment:
      - SA_PASSWORD=${SA_PASSWORD}

  rabbitmq:
    ports:
      - "15672:15672"
      - "5672:5672"
```

### Environment Variables with .env File

```sh
# .env file
ESHOP_EXTERNAL_DNS_NAME_OR_IP=host.docker.internal
SA_PASSWORD=YourSecurePassword123!
ESHOP_AZURE_REDIS_BASKET_DB=basketdata
ESHOP_AZURE_SERVICE_BUS=rabbitmq
```

### Multi-Environment Deployment

```bash
# Development
docker-compose -f docker-compose.yml -f docker-compose.override.yml up -d

# Production
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Testing
docker-compose -f docker-compose.yml -f docker-compose-test.override.yml up
```

---

## 4. ENTITY FRAMEWORK CORE (CRUD Microservice)

### DbContext & Entity Definition

```csharp
public class CatalogItem
{
    public int Id { get; set; }
    public string Name { get; set; }
    public string Description { get; set; }
    public decimal Price { get; set; }
    public int CatalogTypeId { get; set; }
    public CatalogType CatalogType { get; set; }
    public int CatalogBrandId { get; set; }
    public CatalogBrand CatalogBrand { get; set; }
}

public class CatalogContext : DbContext
{
    public CatalogContext(DbContextOptions<CatalogContext> options) : base(options) { }

    public DbSet<CatalogItem> CatalogItems { get; set; }
    public DbSet<CatalogBrand> CatalogBrands { get; set; }
    public DbSet<CatalogType> CatalogTypes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // Custom configurations
    }
}
```

### Web API Controller with LINQ

```csharp
[Route("api/v1/[controller]")]
public class CatalogController : ControllerBase
{
    private readonly CatalogContext _catalogContext;
    private readonly ICatalogIntegrationEventService _eventService;

    public CatalogController(CatalogContext context,
        ICatalogIntegrationEventService eventService)
    {
        _catalogContext = context ?? throw new ArgumentNullException(nameof(context));
        _eventService = eventService ?? throw new ArgumentNullException(nameof(eventService));
        context.ChangeTracker.QueryTrackingBehavior = QueryTrackingBehavior.NoTracking;
    }

    [HttpGet]
    [Route("items")]
    [ProducesResponseType(typeof(PaginatedItemsViewModel<CatalogItem>), (int)HttpStatusCode.OK)]
    public async Task<IActionResult> ItemsAsync(
        [FromQuery]int pageSize = 10,
        [FromQuery]int pageIndex = 0,
        string ids = null)
    {
        if (!string.IsNullOrEmpty(ids))
        {
            var items = await GetItemsByIdsAsync(ids);
            if (!items.Any())
                return BadRequest("ids value invalid");
            return Ok(items);
        }

        var totalItems = await _catalogContext.CatalogItems.LongCountAsync();
        var itemsOnPage = await _catalogContext.CatalogItems
            .OrderBy(c => c.Name)
            .Skip(pageSize * pageIndex)
            .Take(pageSize)
            .ToListAsync();

        return Ok(new PaginatedItemsViewModel<CatalogItem>(
            pageIndex, pageSize, totalItems, itemsOnPage));
    }
}
```

### Dependency Injection & Connection Resiliency

```csharp
// Program.cs
builder.Services.AddDbContext<CatalogContext>(options =>
{
    options.UseSqlServer(builder.Configuration["ConnectionString"],
        sqlServerOptionsAction: sqlOptions =>
        {
            sqlOptions.MigrationsAssembly(
                typeof(Program).GetTypeInfo().Assembly.GetName().Name);

            // Connection Resiliency
            sqlOptions.EnableRetryOnFailure(
                maxRetryCount: 5,
                maxRetryDelay: TimeSpan.FromSeconds(30),
                errorNumbersToAdd: null);
        });
});
```

### API Versioning

```csharp
[Route("api/v1/[controller]")]
public class CatalogController : ControllerBase { }

[Route("api/v2/[controller]")]
public class CatalogControllerV2 : ControllerBase { }
```

### Swagger/Swashbuckle Auto-Documentation

```csharp
// Program.cs
builder.Services.AddSwaggerGen(options =>
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "eShopOnContainers - Catalog HTTP API",
        Version = "v1",
        Description = "The Catalog Microservice HTTP API"
    });
});

app.UseSwagger();
if (app.Environment.IsDevelopment())
{
    app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "My API V1"));
}
```

---

## 5. EVENT-DRIVEN COMMUNICATION & INTEGRATION EVENTS

### Integration Event Definition

```csharp
public class IntegrationEvent
{
    public Guid Id { get; protected set; }
    public DateTime CreationDate { get; protected set; }

    public IntegrationEvent()
    {
        Id = Guid.NewGuid();
        CreationDate = DateTime.UtcNow;
    }
}

public class ProductPriceChangedIntegrationEvent : IntegrationEvent
{
    public int ProductId { get; private set; }
    public decimal NewPrice { get; private set; }
    public decimal OldPrice { get; private set; }

    public ProductPriceChangedIntegrationEvent(int productId, decimal newPrice, decimal oldPrice)
    {
        ProductId = productId;
        NewPrice = newPrice;
        OldPrice = oldPrice;
    }
}
```

### Event Bus Interface

```csharp
public interface IEventBus
{
    void Publish(IntegrationEvent @event);

    void Subscribe<T, TH>()
        where T : IntegrationEvent
        where TH : IIntegrationEventHandler<T>;

    void SubscribeDynamic<TH>(string eventName)
        where TH : IDynamicIntegrationEventHandler;

    void UnsubscribeDynamic<TH>(string eventName)
        where TH : IDynamicIntegrationEventHandler;

    void Unsubscribe<T, TH>()
        where TH : IIntegrationEventHandler<T>
        where T : IntegrationEvent;
}

public interface IIntegrationEventHandler<in TIntegrationEvent> where TIntegrationEvent : IntegrationEvent
{
    Task Handle(TIntegrationEvent @event);
}
```

---

## 6. RABBITMQ EVENT BUS IMPLEMENTATION

### RabbitMQ Publish Method

```csharp
public class EventBusRabbitMQ : IEventBus, IDisposable
{
    private const string BROKER_NAME = "eshop_event_bus";
    private readonly string _connectionString;

    public void Publish(IntegrationEvent @event)
    {
        var eventName = @event.GetType().Name;
        var factory = new ConnectionFactory() { HostName = _connectionString };

        using (var connection = factory.CreateConnection())
        using (var channel = connection.CreateModel())
        {
            channel.ExchangeDeclare(exchange: BROKER_NAME, type: "direct");

            string message = JsonConvert.SerializeObject(@event);
            var body = Encoding.UTF8.GetBytes(message);

            channel.BasicPublish(
                exchange: BROKER_NAME,
                routingKey: eventName,
                basicProperties: null,
                body: body);
        }
    }
}
```

### RabbitMQ Subscribe Method

```csharp
public void Subscribe<T, TH>()
    where T : IntegrationEvent
    where TH : IIntegrationEventHandler<T>
{
    var eventName = _subsManager.GetEventKey<T>();
    var containsKey = _subsManager.HasSubscriptionsForEvent(eventName);

    if (!containsKey)
    {
        if (!_persistentConnection.IsConnected)
        {
            _persistentConnection.TryConnect();
        }

        using (var channel = _persistentConnection.CreateModel())
        {
            channel.QueueBind(
                queue: _queueName,
                exchange: BROKER_NAME,
                routingKey: eventName);
        }
    }

    _subsManager.AddSubscription<T, TH>();
}
```

### Docker Compose RabbitMQ Configuration

```yaml
rabbitmq:
  image: rabbitmq:3-management-alpine
  ports:
    - "15672:15672"  # Management UI
    - "5672:5672"    # AMQP port
  environment:
    - RABBITMQ_DEFAULT_USER=guest
    - RABBITMQ_DEFAULT_PASS=guest
```

### Production Alternatives
- **Azure Service Bus** - Enterprise messaging in cloud
- **NServiceBus** - Rich distributed system patterns
- **MassTransit** - Open-source message bus abstraction
- **Brighter** - Command dispatcher and event publisher

---

## 7. IHOSTEDSERVICE FOR BACKGROUND TASKS

### BackgroundService Base Class Implementation

```csharp
public class GracePeriodManagerService : BackgroundService
{
    private readonly ILogger<GracePeriodManagerService> _logger;
    private readonly OrderingBackgroundSettings _settings;
    private readonly IEventBus _eventBus;

    public GracePeriodManagerService(
        IOptions<OrderingBackgroundSettings> settings,
        IEventBus eventBus,
        ILogger<GracePeriodManagerService> logger)
    {
        _settings = settings?.Value ?? throw new ArgumentNullException(nameof(settings));
        _eventBus = eventBus ?? throw new ArgumentNullException(nameof(eventBus));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogDebug("GracePeriodManagerService is starting");

        stoppingToken.Register(() =>
            _logger.LogDebug("GracePeriod background task is stopping"));

        while (!stoppingToken.IsCancellationRequested)
        {
            _logger.LogDebug("GracePeriod task doing background work");

            // Query database and publish events
            CheckConfirmedGracePeriodOrders();

            try
            {
                await Task.Delay(_settings.CheckUpdateTime, stoppingToken);
            }
            catch (TaskCanceledException ex)
            {
                _logger.LogCritical(ex, "TaskCanceledException Error");
            }
        }

        _logger.LogDebug("GracePeriod background task is stopping");
    }

    private void CheckConfirmedGracePeriodOrders()
    {
        // Implementation: query orders with grace period and publish events
    }
}
```

### Service Registration in Program.cs

```csharp
// Program.cs
builder.Services.AddHostedService<GracePeriodManagerService>();
builder.Services.AddHostedService<MyHostedServiceB>();
builder.Services.AddHostedService<MyHostedServiceC>();

// Optional: Configure shutdown timeout
WebHost.CreateDefaultBuilder(args)
    .UseShutdownTimeout(TimeSpan.FromSeconds(10))
```

### IHostedService Lifecycle

```
App Start → StartAsync() invoked
    ↓
ExecuteAsync(cancellationToken) runs
    ↓
App Shutdown → StopAsync() invoked
    ↓
Graceful cleanup / cancellation
```

### Deployment Scenarios
- **WebHost**: Background tasks in ASP.NET Core web app (IIS, Docker, App Service)
- **Host**: Background tasks in console app (.NET Core 2.1+)
- **Kubernetes**: Pod lifecycle controls instance count
- **Azure Functions**: Timer triggers or event-driven
- **Windows Service**: Always-on execution (on-premises)

---

## 8. API GATEWAY WITH OCELOT

### Ocelot Configuration (configuration.json)

```json
{
  "Routes": [
    {
      "DownstreamPathTemplate": "/api/{version}/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "catalog-api",
          "Port": 80
        }
      ],
      "UpstreamPathTemplate": "/api/{version}/c/{everything}",
      "UpstreamHttpMethod": ["POST", "PUT", "GET"]
    },
    {
      "DownstreamPathTemplate": "/api/{version}/{everything}",
      "DownstreamScheme": "http",
      "DownstreamHostAndPorts": [
        {
          "Host": "basket-api",
          "Port": 80
        }
      ],
      "UpstreamPathTemplate": "/api/{version}/b/{everything}",
      "UpstreamHttpMethod": ["POST", "PUT", "GET"],
      "AuthenticationOptions": {
        "AuthenticationProviderKey": "IdentityApiKey",
        "AllowedScopes": []
      }
    }
  ],
  "GlobalConfiguration": {
    "RequestIdKey": "OcRequestId",
    "AdministrationPath": "/administration"
  }
}
```

### Ocelot Startup Configuration

```csharp
// Program.cs
var builder = WebHost.CreateDefaultBuilder(args);

builder.ConfigureServices(s => s.AddSingleton(builder))
    .ConfigureAppConfiguration(ic =>
        ic.AddJsonFile(Path.Combine("configuration", "configuration.json")))
    .UseStartup<Startup>();

var host = builder.Build();
host.Run();
```

### Startup Class with Authentication

```csharp
public class Startup
{
    private readonly IConfiguration _cfg;

    public Startup(IConfiguration configuration) => _cfg = configuration;

    public void ConfigureServices(IServiceCollection services)
    {
        var identityUrl = _cfg.GetValue<string>("IdentityUrl");
        var authenticationProviderKey = "IdentityApiKey";

        services.AddOcelot(_cfg);
        services.AddAuthentication()
            .AddJwtBearer(authenticationProviderKey, x =>
            {
                x.Authority = identityUrl;
                x.RequireHttpsMetadata = false;
                x.TokenValidationParameters = new TokenValidationParameters()
                {
                    ValidAudiences = new[] {
                        "orders", "basket", "locations", "marketing",
                        "mobileshoppingagg", "webshoppingagg"
                    }
                };
            });
    }

    public async void Configure(IApplicationBuilder app, IWebHostEnvironment env)
    {
        app.UseRouting();
        app.UseAuthentication();
        app.UseAuthorization();
        app.UseEndpoints(endpoints =>
        {
            endpoints.MapControllers();
        });

        await app.UseOcelot();
    }
}
```

### Multiple API Gateways with Docker Compose

```yaml
mobileshoppingapigw:
  image: eshop/ocelotapigw:${TAG:-latest}
  build:
    context: .
    dockerfile: src/ApiGateways/ApiGw-Base/Dockerfile
  ports:
    - "5200:80"
  volumes:
    - ./src/ApiGateways/Mobile.Bff.Shopping/apigw:/app/configuration
  environment:
    - ASPNETCORE_ENVIRONMENT=Development
    - IdentityUrl=http://identity-api

webshoppingapigw:
  image: eshop/ocelotapigw:${TAG:-latest}
  ports:
    - "5202:80"
  volumes:
    - ./src/ApiGateways/Web.Bff.Shopping/apigw:/app/configuration
```

### Advanced Ocelot Features
- **Rate limiting** - Control traffic
- **Caching** - Reduce downstream requests
- **Service discovery** - Consul/Eureka integration
- **Logging** - Request/response tracking
- **Quality of Service** - Retries, timeouts, circuit breakers

---

## 9. MICROSERVICE TESTING STRATEGIES

### Unit Testing with xUnit

```csharp
[Fact]
public async Task Get_order_detail_success()
{
    // Arrange
    var fakeOrderId = "12";
    var fakeOrder = GetFakeOrder();
    var orderServiceMock = new Mock<IOrderService>();
    orderServiceMock.Setup(x => x.GetOrderAsync(fakeOrderId))
        .ReturnsAsync(fakeOrder);

    // Act
    var orderController = new OrderController(
        orderServiceMock.Object,
        _basketServiceMock.Object,
        _identityParserMock.Object);

    orderController.ControllerContext.HttpContext = _contextMock.Object;
    var actionResult = await orderController.Detail(fakeOrderId);

    // Assert
    var viewResult = Assert.IsType<ViewResult>(actionResult);
    Assert.IsAssignableFrom<Order>(viewResult.ViewData.Model);
}
```

### Integration Testing with TestServer

```csharp
public class PrimeWebDefaultRequestShould
{
    private readonly TestServer _server;
    private readonly HttpClient _client;

    public PrimeWebDefaultRequestShould()
    {
        // Arrange
        _server = new TestServer(new WebHostBuilder()
            .UseStartup<Startup>());
        _client = _server.CreateClient();
    }

    [Fact]
    public async Task ReturnHelloWorld()
    {
        // Act
        var response = await _client.GetAsync("/");
        response.EnsureSuccessStatusCode();
        var responseString = await response.Content.ReadAsStringAsync();

        // Assert
        Assert.Equal("Hello World!", responseString);
    }
}
```

### Testing Multi-Container Applications

```bash
# Start test infrastructure
docker-compose -f docker-compose-test.yml -f docker-compose-test.override.yml up

# Run tests
dotnet test

# Cleanup
docker-compose -f docker-compose-test.yml -f docker-compose-test.override.yml down
```

### Test Docker Compose Files

```yaml
# docker-compose-test.yml
version: '3.4'

services:
  redis.data:
    image: redis:alpine
  rabbitmq:
    image: rabbitmq:3-management-alpine
  sqldata:
    image: mcr.microsoft.com/mssql/server:2017-latest
    environment:
      - SA_PASSWORD=YourPassword123!
      - ACCEPT_EULA=Y
  nosqldata:
    image: mongo
```

### Test Categories
1. **Unit Tests** - Individual components (fast)
2. **Functional/Integration Tests** - Service + infrastructure (medium speed)
3. **Application Functional Tests** - Multi-service scenarios (slow)
4. **Load Tests** - Performance under stress

---

## 10. MICROSERVICE ARCHITECTURE DESIGN

### Domain-Driven Design (DDD) Patterns
- **Bounded Contexts** - Service boundaries defined by domains
- **Aggregate Roots** - Entity clusters with consistency boundaries
- **Repositories** - Data access abstractions
- **Domain Events** - Events published for state changes

### Polyglot Microservices Architecture
- **Simple CRUD** - Single-tier, data-driven
- **N-Layered** - Application, Domain, Data layers
- **Domain-Driven Design** - Complex business logic
- **Clean Architecture** - Business rules independence
- **CQRS** - Command Query Responsibility Segregation
- **Event-Driven Architecture** - Async pub/sub

### Benefits of Microservices
✓ Independent scaling of services
✓ Team autonomy per service
✓ Technology flexibility (polyglot)
✓ Easier to understand and modify
✓ Isolated failure domains

### Challenges
✗ Distributed system complexity
✗ Deployment orchestration
✗ No distributed transactions (eventual consistency)
✗ Increased infrastructure requirements
✗ Network latency and partition risks

---

## 11. OPTIMIZED DOCKERFILE PRACTICES

### Multi-Stage Build for ASP.NET Core

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["Catalog.API.csproj", ""]
RUN dotnet restore "Catalog.API.csproj"
COPY . .
RUN dotnet build "Catalog.API.csproj" -c Release -o /app/build
RUN dotnet publish "Catalog.API.csproj" -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app
EXPOSE 80
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Catalog.API.dll"]
```

### Image Variants
- **sdk** - Development and build scenarios
- **aspnet** - ASP.NET production runtime
- **runtime** - Console app production runtime
- **runtime-deps** - Self-contained deployment

### Best Practices
- Use multi-stage builds to reduce image size
- Don't compile at runtime (use pre-compiled binaries)
- Avoid `:latest` tag in production
- Set specific framework versions
- Use `imagePullPolicy: Always` in Kubernetes
- Apply `--no-cache` to prod builds

---

## 12. KUBERNETES DEPLOYMENT CONSIDERATIONS

### Kubernetes Ingress with Ocelot API Gateways

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: eshop-ingress
spec:
  rules:
    - host: eshop.example.com
      http:
        paths:
          - path: /
            pathType: Prefix
            backend:
              service:
                name: webmvc
                port:
                  number: 80
          - path: /api/v1/c/
            pathType: Prefix
            backend:
              service:
                name: webshoppingapigw
                port:
                  number: 80
```

### Service Discovery
- Use **DNS** (default Kubernetes)
- Use **Consul** with Ocelot client-side discovery
- Use **Eureka** for Spring-based patterns

### ConfigMap for Ocelot Configuration

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: ocelot
data:
  configuration.json: |
    {
      "Routes": [
        {
          "DownstreamPathTemplate": "/api/v1/catalog/...",
          "UpstreamPathTemplate": "/api/v1/c/..."
        }
      ]
    }
```

---

## 13. KEY ARCHITECTURAL PATTERNS SUMMARY

| Pattern | Use Case | Example |
|---------|----------|---------|
| **Saga** | Distributed transactions | Order placement across multiple services |
| **CQRS** | Read/write separation | Query cache, command DB updates |
| **Event Sourcing** | Event audit trail | Order history replay |
| **API Gateway** | Client aggregation | Ocelot, Envoy proxy |
| **Service Mesh** | Cross-cutting concerns | Istio, Linkerd (transparent retries/timeouts) |
| **Circuit Breaker** | Failure cascade prevention | Polly library implementation |
| **Eventual Consistency** | Async consistency | RabbitMQ event bus between services |

---

## QUICK REFERENCE: COMMON SCENARIOS

### Scenario 1: Add New Microservice
1. Create ASP.NET Core Web API project
2. Define entities & DbContext (EF Core)
3. Create controllers with CRUD endpoints
4. Add Swashbuckle for documentation
5. Create Dockerfile with multi-stage build
6. Add service to docker-compose.yml
7. Create route in API Gateway configuration.json
8. Implement IIntegrationEventHandler for events
9. Write unit/integration tests
10. Configure CI/CD pipeline

### Scenario 2: Handle Transient Failures
1. Use Polly `IHttpClientFactory` with retry policy
2. Add circuit breaker for protection
3. Test with Chaos Monkey or manual failure injection
4. Monitor with Application Insights
5. Set up alerting for repeated failures

### Scenario 3: Secure Service-to-Service Communication
1. Implement JWT bearer tokens via IdentityServer/Duende
2. Configure OAuth 2.0 / OpenID Connect flows
3. Validate tokens at API Gateway level
4. Store secrets in Azure Key Vault
5. Implement claims-based authorization
6. Use HTTPS/TLS for transport

### Scenario 4: Background Job Processing
1. Inherit from `BackgroundService`
2. Implement `ExecuteAsync(CancellationToken)`
3. Register with `AddHostedService<T>()`
4. Subscribe to integration events via IEventBus
5. Handle graceful shutdown with cancellation token
6. Use structured logging for monitoring

---

## CONFIGURATION CHECKLIST

- [ ] Set up docker-compose.yml with all dependencies
- [ ] Configure environment-specific overrides (.override.yml, .prod.yml)
- [ ] Create .env file with secrets
- [ ] Implement EF Core DbContext with retry policy
- [ ] Set up Swagger/Swashbuckle documentation
- [ ] Configure Ocelot API Gateway routes
- [ ] Implement JWT authentication/authorization
- [ ] Add Polly resilience policies
- [ ] Create RabbitMQ event bus infrastructure
- [ ] Implement IHostedService background tasks
- [ ] Write unit and integration tests
- [ ] Configure Docker image builds
- [ ] Set up Application Insights monitoring
- [ ] Create Kubernetes manifests (if using K8s)

---

## REFERENCES

- **Microsoft Learn**: .NET Microservices Architecture for Containerized .NET Applications
- **eShopOnContainers**: Reference implementation (GitHub)
- **Polly**: Resilience library (pollydocs.org)
- **Ocelot**: API Gateway library
- **RabbitMQ**: Message broker documentation
- **Entity Framework Core**: ORM documentation

