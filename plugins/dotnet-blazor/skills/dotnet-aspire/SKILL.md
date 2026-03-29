---
name: dotnet-aspire
description: .NET Aspire for cloud-native app orchestration, service discovery, telemetry, and component integrations
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - aspire
  - cloud native
  - service discovery
  - aspire dashboard
  - distributed application
  - aspire component
---

# .NET Aspire

## What is Aspire?

.NET Aspire is an opinionated, cloud-ready stack for building observable, production-ready, distributed applications. It provides:
- **Orchestration** - Coordinate multi-service apps with AppHost
- **Components** - Pre-configured NuGet packages for common services (Redis, PostgreSQL, RabbitMQ, etc.)
- **Tooling** - Dashboard for logs, traces, metrics; CLI for management
- **Service Defaults** - Shared configuration for health checks, telemetry, resilience

## AppHost (Orchestrator)

```csharp
// MyApp.AppHost/Program.cs
var builder = DistributedApplication.CreateBuilder(args);

// Infrastructure resources
var postgres = builder.AddPostgres("postgres").WithDataVolume().WithPgAdmin();
var redis = builder.AddRedis("redis").WithRedisInsight();
var rabbitmq = builder.AddRabbitMQ("messaging").WithManagementPlugin();

// Databases
var appDb = postgres.AddDatabase("appdb");

// Projects (services)
var api = builder.AddProject<Projects.Api>("api")
    .WithReference(appDb)
    .WithReference(redis)
    .WithReference(rabbitmq)
    .WithExternalHttpEndpoints();

var web = builder.AddProject<Projects.Web>("web")
    .WithReference(api)
    .WithReference(redis)
    .WithExternalHttpEndpoints();

var worker = builder.AddProject<Projects.Worker>("worker")
    .WithReference(rabbitmq)
    .WithReference(appDb);

builder.Build().Run();
```

## Service Defaults

```csharp
// ServiceDefaults/Extensions.cs (shared project)
public static IHostApplicationBuilder AddServiceDefaults(this IHostApplicationBuilder builder)
{
    builder.ConfigureOpenTelemetry();
    builder.AddDefaultHealthChecks();
    builder.Services.AddServiceDiscovery();

    builder.Services.ConfigureHttpClientDefaults(http =>
    {
        http.AddStandardResilienceHandler();
        http.AddServiceDiscovery();
    });

    return builder;
}
```

## Component Integrations

| Component | NuGet Package | AddXxx Method |
|-----------|--------------|---------------|
| PostgreSQL (EF) | `Aspire.Npgsql.EntityFrameworkCore.PostgreSQL` | `AddNpgsqlDbContext<T>()` |
| SQL Server (EF) | `Aspire.Microsoft.EntityFrameworkCore.SqlServer` | `AddSqlServerDbContext<T>()` |
| Redis Cache | `Aspire.StackExchange.Redis.DistributedCaching` | `AddRedisDistributedCache()` |
| Redis Output Cache | `Aspire.StackExchange.Redis.OutputCaching` | `AddRedisOutputCache()` |
| RabbitMQ | `Aspire.RabbitMQ.Client` | `AddRabbitMQClient()` |
| Azure Service Bus | `Aspire.Azure.Messaging.ServiceBus` | `AddAzureServiceBusClient()` |
| Azure Blob Storage | `Aspire.Azure.Storage.Blobs` | `AddAzureBlobClient()` |
| Cosmos DB | `Aspire.Microsoft.Azure.Cosmos` | `AddAzureCosmosClient()` |

## Dashboard

The Aspire dashboard provides:
- **Structured logs** from all services
- **Distributed traces** across service boundaries
- **Metrics** (request rates, latencies, error rates)
- **Resource status** and health checks

Access at: `https://localhost:18888` (default)

## Deployment

```bash
# Deploy to Azure Container Apps
azd init
azd provision  # Creates Azure resources
azd deploy     # Deploys all services

# Or use Aspire CLI
aspire publish --publisher azure
```

## Key Patterns

- Every service project calls `builder.AddServiceDefaults()`
- Use `WithReference()` to establish service dependencies
- Use `WithExternalHttpEndpoints()` for publicly accessible services
- Service discovery uses `https+http://service-name` URIs
- All telemetry is automatically correlated across services
