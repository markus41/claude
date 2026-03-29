---
name: docker-containers
description: Multi-container .NET applications with Docker Compose, container orchestration, and development environments
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Grep
triggers:
  - docker compose
  - multi-container
  - docker
  - container
  - containerize
  - docker development
---

# Multi-Container .NET Applications

## Multi-Stage Dockerfile (.NET 10)

```dockerfile
# Build stage
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy solution and project files for layer caching
COPY *.sln .
COPY Directory.Build.props Directory.Packages.props ./
COPY src/MyApp.Web/MyApp.Web.csproj src/MyApp.Web/
COPY src/MyApp.Api/MyApp.Api.csproj src/MyApp.Api/
COPY src/MyApp.Domain/MyApp.Domain.csproj src/MyApp.Domain/
COPY src/MyApp.Infrastructure/MyApp.Infrastructure.csproj src/MyApp.Infrastructure/
RUN dotnet restore

# Copy source and publish
COPY . .
RUN dotnet publish src/MyApp.Web/MyApp.Web.csproj -c Release -o /app/publish --no-restore

# Runtime stage (minimal image)
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

# Non-root user for security
USER $APP_UID

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MyApp.Web.dll"]
```

## Docker Compose (Development)

```yaml
services:
  # Blazor Web App
  webapp:
    build:
      context: .
      dockerfile: src/MyApp.Web/Dockerfile
    ports:
      - "5000:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Host=postgres;Database=myapp;Username=postgres;Password=devpass
      - ConnectionStrings__Redis=redis:6379
      - RabbitMQ__Host=rabbitmq
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_started
    volumes:
      - ~/.aspnet/https:/https:ro  # Dev HTTPS certs
    networks:
      - backend

  # API Service
  api:
    build:
      context: .
      dockerfile: src/MyApp.Api/Dockerfile
    ports:
      - "5001:8080"
    environment:
      - ASPNETCORE_ENVIRONMENT=Development
      - ConnectionStrings__Default=Host=postgres;Database=myapp;Username=postgres;Password=devpass
      - ConnectionStrings__Redis=redis:6379
    depends_on:
      postgres:
        condition: service_healthy
    networks:
      - backend

  # Worker Service
  worker:
    build:
      context: .
      dockerfile: src/MyApp.Worker/Dockerfile
    environment:
      - ConnectionStrings__Default=Host=postgres;Database=myapp;Username=postgres;Password=devpass
      - RabbitMQ__Host=rabbitmq
    depends_on:
      postgres:
        condition: service_healthy
      rabbitmq:
        condition: service_healthy
    networks:
      - backend

  # PostgreSQL
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: devpass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # Redis
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    networks:
      - backend

  # RabbitMQ
  rabbitmq:
    image: rabbitmq:3-management-alpine
    ports:
      - "5672:5672"   # AMQP
      - "15672:15672" # Management UI
    environment:
      RABBITMQ_DEFAULT_USER: guest
      RABBITMQ_DEFAULT_PASS: guest
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "check_port_connectivity"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks:
      - backend

  # SQL Server (alternative to PostgreSQL)
  # sqlserver:
  #   image: mcr.microsoft.com/mssql/server:2022-latest
  #   environment:
  #     ACCEPT_EULA: "Y"
  #     MSSQL_SA_PASSWORD: "YourStrong!Password"
  #   ports:
  #     - "1433:1433"

volumes:
  postgres_data:
  redis_data:

networks:
  backend:
    driver: bridge
```

## Integration Event Bus (RabbitMQ)

```csharp
// Integration event (crosses service boundaries)
public sealed record OrderPaymentSucceededIntegrationEvent(
    int OrderId, DateTime PaymentDate) : IntegrationEvent;

// Event bus interface
public interface IEventBus
{
    Task PublishAsync<T>(T @event, CancellationToken ct = default) where T : IntegrationEvent;
    void Subscribe<T, THandler>() where T : IntegrationEvent where THandler : IIntegrationEventHandler<T>;
}

// Integration event handler
public sealed class OrderPaymentSucceededHandler(
    IOrderRepository orderRepo,
    ILogger<OrderPaymentSucceededHandler> logger)
    : IIntegrationEventHandler<OrderPaymentSucceededIntegrationEvent>
{
    public async Task Handle(OrderPaymentSucceededIntegrationEvent @event, CancellationToken ct)
    {
        logger.LogInformation("Payment succeeded for order {OrderId}", @event.OrderId);
        var order = await orderRepo.GetAsync(@event.OrderId, ct);
        order?.SetPaidStatus();
        await orderRepo.UnitOfWork.SaveEntitiesAsync(ct);
    }
}
```

## API Gateway Pattern

```csharp
// Using YARP (Yet Another Reverse Proxy) - Microsoft's recommended gateway
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddReverseProxy()
    .LoadFromConfig(builder.Configuration.GetSection("ReverseProxy"));

var app = builder.Build();
app.MapReverseProxy();
app.Run();
```

```json
// appsettings.json for YARP
{
  "ReverseProxy": {
    "Routes": {
      "catalog-route": {
        "ClusterId": "catalog-cluster",
        "Match": { "Path": "/api/catalog/{**catch-all}" }
      },
      "ordering-route": {
        "ClusterId": "ordering-cluster",
        "Match": { "Path": "/api/orders/{**catch-all}" }
      }
    },
    "Clusters": {
      "catalog-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://catalog-api:8080/" }
        }
      },
      "ordering-cluster": {
        "Destinations": {
          "destination1": { "Address": "http://ordering-api:8080/" }
        }
      }
    }
  }
}
```

## .NET Docker Images

| Image | Use for | Size |
|-------|---------|------|
| `mcr.microsoft.com/dotnet/sdk:10.0` | Build stage only | ~800MB |
| `mcr.microsoft.com/dotnet/aspnet:10.0` | Web apps, APIs | ~220MB |
| `mcr.microsoft.com/dotnet/runtime:10.0` | Console/worker apps | ~190MB |
| `mcr.microsoft.com/dotnet/runtime-deps:10.0` | Self-contained AOT | ~110MB |

## Best Practices

- Use multi-stage builds (build with SDK, run with aspnet/runtime)
- Copy .csproj files first for Docker layer caching on restore
- Use health checks in docker-compose for dependency ordering
- Run as non-root user in production containers
- Use `.dockerignore` to exclude bin/, obj/, .git/
- Pin image versions (never use `:latest` alone in production)
- Use named volumes for persistent data

## Reference

- Multi-container apps: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/
- Docker Compose: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/multi-container-applications-docker-compose
- Official Docker images: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/net-core-net-framework-containers/official-net-docker-images
- RabbitMQ event bus: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/rabbitmq-event-bus-development-test-environment
- API gateways: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/multi-container-microservice-net-applications/implement-api-gateways-with-ocelot
