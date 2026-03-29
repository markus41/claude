---
name: Microsoft Azure & .NET Deployment Comprehensive Guide
description: Complete reference for Azure App Service deployment, SDK usage, migration strategies, cross-platform targeting, and microservices architecture for .NET applications
type: reference
---

# Microsoft Azure & .NET Deployment Comprehensive Guide

**Source Documents**: Microsoft Learn official documentation (March 2026)
**Coverage**: Azure App Service, SDK patterns, migration, cross-platform targeting, microservices architecture

---

## 1. Azure App Service Deployment (.NET 10 Quickstart)

### Prerequisites & Setup

**Visual Studio 2026 Required Components**:
- ASP.NET and web development workload
- .NET Framework project templates (if targeting .NET Framework 4.8)
- Azure Tools extension (for VS Code)
- .NET 10.0 SDK

**Installation Check**:
```bash
# Verify .NET SDK
dotnet --version

# Check VS installation
# Help → Check for Updates (Visual Studio 2026)
```

### Create ASP.NET Web App

**Option 1: Visual Studio (Recommended)**
```bash
# .NET 10 Template
# File → New Project → Blazor Web App
# Select .NET 10.0 (Long Term Support)
# Authentication: None
```

**Option 2: CLI**
```dotnetcli
# Create Blazor app (.NET 10)
dotnet new blazor -n MyFirstAzureWebApp --framework net10.0
cd MyFirstAzureWebApp

# Run locally
dotnet run --urls=https://localhost:5001/
```

**Option 3: Azure Developer CLI (Fastest)**
```bash
mkdir dotnetcore-quickstart
cd dotnetcore-quickstart
azd init --template https://github.com/Azure-Samples/quickstart-deploy-aspnet-core-app-service.git
azd up

# Cleanup
azd down
```

### Publish to Azure App Service

#### Visual Studio Publish Flow
```
Solution Explorer → Right-click project → Publish
→ Select Azure → Next
→ Choose target (Linux or Windows)
→ Sign in to Azure
→ Create new → New App Service
→ Configure resource group, hosting plan, location, pricing tier
→ Finish → Publish
```

#### CLI Deployment
```azurecli
# One-command deployment
az login
az webapp up \
  --sku F1 \
  --name <app-name> \
  --os-type linux  # or windows

# Options:
# --sku F1          # Free tier (slowest)
# --sku B1          # Basic tier
# --location westeurope  # Region selection
```

**Valid app-name characters**: `a-z`, `0-9`, `-` (must be globally unique across Azure)

#### PowerShell Deployment
```powershell
# Step 1: Sign in
Connect-AzAccount

# Step 2: Create web app
New-AzWebApp -ResourceGroupName myResourceGroup \
  -Name <app-name> \
  -Location westeurope

# Step 3: Build release package
dotnet publish --configuration Release
cd bin\Release\net10.0\publish
Compress-Archive -Path * -DestinationPath deploy.zip

# Step 4: Deploy ZIP
Publish-AzWebApp -ResourceGroupName myResourceGroup \
  -Name <app-name> \
  -ArchivePath (Get-Item .\deploy.zip).FullName \
  -Force
```

#### Azure Portal (GitHub Actions)
```yaml
# Steps:
1. Type "app services" in portal search
2. Create → Web App
3. Basics tab:
   - Resource group: Create new (myResourceGroup)
   - Name: Globally unique name
   - Publish: Code
   - Runtime stack: .NET 8 (LTS) or .NET Framework 4.8
   - OS: Windows (required for .NET Framework 4.8)
   - Region: Your choice
   - App Service Plan: Create new

4. Deployment tab:
   - Continuous deployment: Enable
   - GitHub Actions: Authenticate
   - Organization: Your fork
   - Repository: dotnetcore-docs-hello-world or app-service-web-dotnet-get-started
   - Branch: main

5. Review + create → Create
```

### Key Configuration Settings

**Supported Port Bindings**:
- HTTP: Port 80
- HTTPS: Port 443
- WebSocket support must be enabled for duplex WCF services

**WCF Bindings Supported**:
- BasicHttp, WSHttp, BasicHttpContextBinding, WebHttpBinding
- WSDualHttpBinding, NetHttpBinding, NetHttpsBinding, WSHttpContextBinding
- (All duplex bindings require WebSocket support enabled)

**Unsupported Features**:
- GAC (Global Assembly Cache) - use `\bin` folder instead
- Custom MSI installations
- COM/COM+ components - must rewrite in managed code
- Physical drive access - use Azure Files (SMB) or Blob Storage (HTTPS)
- ISAPI filters (except those in web.config)
- SharePoint/FrontPage extensions

---

## 2. Azure SDK for .NET (Patterns & Usage)

### SDK Overview

**Azure SDK for .NET** is a collection of NuGet packages supporting .NET Standard 2.0+
- Consistent, familiar interface across all Azure services
- Supports both synchronous and asynchronous methods
- Integrated logging and diagnostics

### 4-Step SDK Implementation Pattern

#### Step 1: Locate Package
```bash
# Search: https://learn.microsoft.com/en-us/dotnet/azure/sdk/azure-sdk-for-dotnet/packages

# Example services:
# - Blob Storage: Azure.Storage.Blobs
# - Key Vault: Azure.Security.KeyVault.Secrets
# - Service Bus: Azure.Messaging.ServiceBus
```

#### Step 2: Install NuGet Package
```bash
dotnet add package Azure.Storage.Blobs
dotnet add package Azure.Security.KeyVault.Secrets
dotnet add package Azure.Messaging.ServiceBus
```

#### Step 3: Configure Authentication
```csharp
// Pattern: Create client → Call methods

// Example: Blob Storage
using Azure.Storage.Blobs;

var client = new BlobContainerClient(
    new Uri("https://<storage-account>.blob.core.windows.net/<container>"),
    new DefaultAzureCredential());

// Upload file
await client.UploadBlobAsync("file.txt", File.OpenRead("local.txt"));

// Download file
BlobDownloadInfo download = await client.DownloadAsync();
```

#### Step 4: Configure Logging (Optional)
```csharp
// Enable SDK logging for diagnostics
using Azure.Core.Diagnostics;
using System.Diagnostics.Tracing;

// Enable verbose logging
var listener = new AzureEventSourceListener(
    (args) => Console.WriteLine($"{args.Level}: {args.Message}"),
    level: EventLevel.Verbose);
```

### Authentication Patterns

**Three Authentication Approaches**:

1. **DefaultAzureCredential** (Recommended - Production)
   ```csharp
   var credential = new DefaultAzureCredential();
   var client = new BlobContainerClient(uri, credential);
   // Works with: App Service Managed Identity, local CLI login, Azure Powershell
   ```

2. **Connection String** (Development)
   ```csharp
   var connectionString = "DefaultEndpointsProtocol=https;...";
   var client = new BlobContainerClient(new Uri(connectionString), null);
   ```

3. **Access Keys** (Quick Testing)
   ```csharp
   var credential = new StorageSharedKeyCredential(
       "<account-name>", "<account-key>");
   var client = new BlobContainerClient(uri, credential);
   ```

---

## 3. Key Azure Services for .NET Developers

### Primary Services Matrix

| Service | Use Case | NuGet Package | Key Features |
|---------|----------|---------------|--------------|
| **App Service** | Web apps, APIs | N/A (deployment target) | Auto-scaling, load balancing, free tier available |
| **Container Apps** | Microservices, containerized apps | N/A | Serverless containers, keda scaling, no orchestration complexity |
| **Azure Functions** | Serverless, event-driven | Azure.Functions | Scales to zero, pay-per-execution, multiple triggers |
| **Azure SQL** | Relational databases | Azure.Data.SqlClient | Managed SQL Server, auto patching, HA included |
| **Cosmos DB** | NoSQL, globally distributed | Azure.Cosmos | Single-digit latency, multi-region, MongoDB API |
| **Blob Storage** | File storage (objects) | Azure.Storage.Blobs | Massive scale, redundant, HTTPS access |
| **Service Bus** | Messaging, queues, pub/sub | Azure.Messaging.ServiceBus | Enterprise messaging, FIFO, deduplication, sessions |
| **Key Vault** | Secrets management | Azure.Security.KeyVault.Secrets | Encrypted storage, access control, audit logging |
| **Foundry Tools (AI)** | AI/ML capabilities | Azure.AI.OpenAI, Azure.AI.Vision | LLMs, vision, speech, language services |

### Service Selection Decision Tree

```
Deploy Web App?
├─ Traditional ASP.NET MVC/Core → App Service
├─ Containerized microservices → Container Apps (easier than K8s)
└─ Serverless event-driven → Azure Functions

Store Data?
├─ Relational (structured) → Azure SQL
├─ NoSQL (flexible schema) → Cosmos DB
└─ Files/Objects (unstructured) → Blob Storage

Inter-service Communication?
├─ Queue-based async → Service Bus
├─ Pub/Sub with multiple subscribers → Service Bus Topics
└─ Point-to-point → Service Bus Queues

Secrets/Configuration?
└─ API keys, connection strings → Key Vault
```

---

## 4. App Service Migration (.NET Framework → Azure)

### Pre-Migration Checklist

#### 1. Dependency Assessment
```
On-premises Resources:
□ SQL Server databases      → Migrate to Azure SQL or Cosmos DB
□ File shares               → Use Azure Files (SMB) or Blob Storage
□ Custom services           → Containerize or rewrite
□ COM/COM+ components       → Rewrite in managed code
```

#### 2. Connectivity Patterns
| Scenario | Solution | Notes |
|----------|----------|-------|
| Access on-prem SQL | Azure VPN + Virtual Networks | Latency cost |
| Access on-prem services | Azure Relay | No firewall changes needed |
| Migrate to cloud | Rewrite as cloud-native | Recommended |

#### 3. Configuration Mapping

**Old (on-premises IIS)**:
```xml
<!-- applicationHost.config -->
<system.applicationHost>
  <applicationPool name="MyAppPool">
    <processModel identityType="ApplicationPoolIdentity" />
  </applicationPool>
</system.applicationHost>
```

**New (Azure App Service)**:
```csharp
// Azure Portal: Configuration → Application Settings
// Or in code:
var connectionString = Environment.GetEnvironmentVariable("SQLCONNECTION");
var apiKey = await GetFromKeyVault("api-key");
```

**Configuration Storage**:
- **Development**: `appsettings.json`
- **Staging/Production**: Azure Key Vault (secured)
  ```csharp
  using Azure.Security.KeyVault.Secrets;
  var client = new SecretClient(
      new Uri("https://<vault-name>.vault.azure.net/"),
      new DefaultAzureCredential());
  var secret = await client.GetSecretAsync("my-secret");
  ```

### Migration Steps

#### Step 1: Compatibility Verification
```
✓ Code runs on .NET Core/.NET 5+ (no .NET Framework 4.8 Windows APIs)
✓ All dependencies have NuGet packages (no GAC assemblies)
✓ No COM/COM+ components
✓ No ISAPI filters (except those in web.config)
✓ No custom IIS module installations
```

#### Step 2: Port Binding Changes
**Before**: `net.tcp://localhost:8080` (multiple protocols)
**After**: HTTPS (443) or HTTP (80) only

```csharp
// Check if your WCF service uses supported bindings
var binding = new WSHttpBinding();  // ✓ Supported
var binding = new NetTcpBinding();  // ✗ Use HTTP/HTTPS instead
```

#### Step 3: Database Migration Path
```csharp
// Option A: Azure SQL (drop-in replacement for SQL Server)
var connectionString = "Server=tcp:myserver.database.windows.net,1433;" +
    "Database=mydb;User ID=sqladmin@myserver;Password=...";
using var conn = new SqlConnection(connectionString);

// Option B: Cosmos DB (if flexible schema + global distribution needed)
var client = new CosmosClient("https://account.documents.azure.com:443/",
    "primary-key");
```

#### Step 4: Authentication Configuration
```csharp
// For Azure AD integration (required for AAD)
// Must use paid tier (Free tier doesn't support AAD)

services.AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(configuration.GetSection("AzureAd"));
```

**Free Tier Limitations**:
- Site size: max 1 GB
- No AAD integration
- Limited scaling

### Known Incompatibilities & Solutions

| Issue | Solution | Workaround |
|-------|----------|-----------|
| Windows Authentication | Use Azure AD/ADFS | Integrate on-prem AD with AAD |
| GAC assemblies | Copy to `\bin` | Include DLLs in deployment |
| COM components | Rewrite in managed code | Use interop if Windows Container |
| Physical filesystem | Use Azure Files/Blob Storage | Store files in cloud |
| HTTPS (SSL certs) | Upload manually | Generate/renew in Azure |
| DNS | Configure custom domain | Add domain mapping in portal |

---

## 5. Cross-Platform Targeting for .NET Libraries

### .NET Target Framework Selection

#### Modern Approach (Recommended)
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- Single target - modern .NET -->
    <TargetFramework>net8.0</TargetFramework>
    <!-- or net9.0, net10.0 -->
  </PropertyGroup>
</Project>
```

**Benefits**:
- Latest APIs and performance
- Cross-platform (Windows, Linux, macOS)
- AOT compilation support
- Trimming for smaller deployments

#### Broad Compatibility (Multiple Frameworks)
```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- Target multiple frameworks -->
    <TargetFrameworks>net8.0;netstandard2.0;net462</TargetFrameworks>
  </PropertyGroup>
</Project>
```

**When to multi-target**:
- Legacy .NET Framework dependencies
- Support both new and old consumers
- Complex dependency chains

### Framework Selection Matrix

| Goal | Target | Benefits | Tradeoffs |
|------|--------|----------|-----------|
| New library | `net8.0+` | Latest APIs, AOT, trim | Breaks .NET Framework consumers |
| Support .NET Fx | `net8.0;netstandard2.0` | Broad reach | Package size increases |
| Max compatibility | `net8.0;netstandard2.0;net462` | Universal | Complex builds, testing burden |
| Old target (avoid) | `netstandard1.x` | Backward compatible | Large dependency graph, slow builds |

### Conditional Compilation (Platform-Specific APIs)

```csharp
public static class GpsLocation
{
    public static async Task<(double lat, double lon)> GetCoordinatesAsync()
    {
#if NET462
        return CallDotNetFrameworkApi();
#elif NET8_0_OR_GREATER
        return CallModernNetApi();
#else
        throw new PlatformNotSupportedException();
#endif
    }

    // Capability detection (preferred pattern)
    public static bool IsSupported
    {
        get
        {
#if NET462 || NET8_0_OR_GREATER
            return true;
#else
            return false;
#endif
        }
    }
}
```

### Platform Compatibility Analyzer

```bash
# Install analyzer
dotnet add package Microsoft.DotNet.PlatformCompat.Analyzer

# Identifies at compile-time:
# - PlatformNotSupportedException calls
# - Unsupported APIs on target platforms
# - Behavioral differences (reflection on AOT, etc.)
```

### NuGet Distribution Best Practices

```xml
<!-- Multi-target project file -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net8.0;netstandard2.0</TargetFrameworks>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <PackageId>MyLibrary</PackageId>
    <Version>1.0.0</Version>
  </PropertyGroup>
</Project>
```

**Package Output Structure**:
```
MyLibrary.1.0.0.nupkg
├── lib/
│   ├── net8.0/
│   │   └── MyLibrary.dll
│   └── netstandard2.0/
│       └── MyLibrary.dll
└── MyLibrary.nuspec
```

**NuGet Selection Algorithm**:
1. Consumer targets `net8.0` → uses `net8.0` assembly (best match)
2. Consumer targets `net6.0` → uses `netstandard2.0` assembly (fallback)
3. Consumer targets `.NET Framework 4.7.2` → uses `net462` if available, else error

---

## 6. Microservices Architecture for .NET

### Microservices Definition & Benefits

**Core Concept**: Independently deployable, loosely coupled services

```
Monolith                          Microservices
┌──────────────────────────┐     ┌─────────┐  ┌─────────┐  ┌─────────┐
│  UI Layer                │     │Service 1│  │Service 2│  │Service 3│
│  Business Logic          │     │  (Order)│  │(Payment)│  │(Shipping)│
│  Data Layer              │     └─────────┘  └─────────┘  └─────────┘
└──────────────────────────┘     (Independent versions, deployments, scaling)
(Single version, deployment)
```

**Benefits**:
- Independent deployment cycles
- Isolated scaling (scale payment service without scaling orders)
- Technology flexibility (use different languages/DBs per service)
- Team autonomy (team owns service end-to-end)

### Docker Container Deployment

```dockerfile
# Dockerfile for .NET 8 microservice
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["OrderService.csproj", "."]
RUN dotnet restore "OrderService.csproj"
COPY . .
RUN dotnet build "OrderService.csproj" -c Release -o /app/build

FROM mcr.microsoft.com/dotnet/runtime:8.0
WORKDIR /app
COPY --from=build /app/build .
ENTRYPOINT ["dotnet", "OrderService.dll"]
```

**Docker Compose (Local Development)**:
```yaml
version: '3.8'
services:
  order-service:
    build: ./OrderService
    ports:
      - "5001:80"
    environment:
      - ConnectionStrings__OrderDb=Server=sqldb:1433;...
    depends_on:
      - sqldb

  payment-service:
    build: ./PaymentService
    ports:
      - "5002:80"
    depends_on:
      - rabbitmq

  sqldb:
    image: mcr.microsoft.com/mssql/server:2019-latest
    environment:
      SA_PASSWORD: "Your_Password123!"
    ports:
      - "1433:1433"

  rabbitmq:
    image: rabbitmq:3.8-management
    ports:
      - "5672:5672"
      - "15672:15672"
```

### Service Communication Patterns

#### Pattern 1: Synchronous (Direct HTTP/gRPC)
```csharp
// OrderService calls PaymentService directly
public class OrderService
{
    private readonly HttpClient _httpClient;

    public async Task PlaceOrderAsync(Order order)
    {
        // Direct call - tight coupling, fast response
        var response = await _httpClient.PostAsync(
            "http://payment-service:5002/api/pay",
            new StringContent(JsonSerializer.Serialize(order)));

        if (!response.IsSuccessStatusCode)
            throw new PaymentFailedException();
    }
}
```

**Tradeoff**: Tight coupling, but simple & immediate response

#### Pattern 2: Asynchronous (Message Queue)
```csharp
// OrderService publishes event, PaymentService subscribes
public class OrderService
{
    private readonly IServiceBusClient _serviceBus;

    public async Task PlaceOrderAsync(Order order)
    {
        // Send event - loose coupling, eventual consistency
        await _serviceBus.PublishAsync("order.placed", new OrderPlacedEvent
        {
            OrderId = order.Id,
            Amount = order.Total
        });
    }
}

// PaymentService (independent)
public class PaymentService
{
    public async Task OnOrderPlacedAsync(OrderPlacedEvent evt)
    {
        // Process asynchronously, with retries
        await ProcessPaymentAsync(evt.OrderId, evt.Amount);
    }
}
```

**Tradeoff**: Loose coupling, but eventual consistency needed

### Deployment Orchestration

#### Option 1: Kubernetes (K8s)
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: order-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: order-service
  template:
    metadata:
      labels:
        app: order-service
    spec:
      containers:
      - name: order-service
        image: myregistry.azurecr.io/order-service:1.0
        ports:
        - containerPort: 80
        env:
        - name: ConnectionStrings__OrderDb
          valueFrom:
            secretKeyRef:
              name: db-secret
              key: connectionstring
        resources:
          limits:
            memory: "256Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: order-service
spec:
  selector:
    app: order-service
  ports:
  - protocol: TCP
    port: 80
    targetPort: 80
  type: ClusterIP
```

**Best for**: Large-scale, complex orchestration needs

#### Option 2: Azure Container Apps (Easier K8s Alternative)
```bash
# Deploy microservice to Container Apps
az containerapp create \
  --name order-service \
  --resource-group mygroup \
  --image myregistry.azurecr.io/order-service:1.0 \
  --environment myenv \
  --target-port 80 \
  --environment-variables \
    ConnectionStrings__OrderDb="Server=..." \
  --min-replicas 1 \
  --max-replicas 5 \
  --enable-autoscaling
```

**Best for**: Microservices without K8s complexity

#### Option 3: App Service Slots (Simpler Scenario)
```bash
# Canary deployment: route 10% to new version
az webapp traffic-routing set \
  --resource-group mygroup \
  --name order-service \
  --distribution staging=10
```

**Best for**: Simpler apps, blue-green deployments

### Resilience Patterns

#### Circuit Breaker (Polly Library)
```csharp
using Polly;
using Polly.CircuitBreaker;

var policy = Policy.Handle<HttpRequestException>()
    .OrResult<HttpResponseMessage>(r => !r.IsSuccessStatusCode)
    .CircuitBreaker(
        handledEventsAllowedBeforeBreaking: 3,
        durationOfBreak: TimeSpan.FromSeconds(30));

var response = await policy.ExecuteAsync(async () =>
    await _httpClient.GetAsync("http://payment-service/status"));
```

**Behavior**:
1. **Closed** (normal): Requests pass through
2. **Open** (after 3 failures): Fast fail without calling service
3. **Half-open** (after 30s): Try 1 request to see if service recovered

#### Retry with Exponential Backoff
```csharp
var policy = Policy.Handle<HttpRequestException>()
    .WaitAndRetryAsync(
        retryCount: 3,
        sleepDurationProvider: retryAttempt =>
            TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
        onRetry: (outcome, timeout) =>
            _logger.LogWarning($"Retry after {timeout.TotalSeconds}s"));

await policy.ExecuteAsync(async () =>
    await _httpClient.GetAsync(url));
```

**Backoff**: 1s, 2s, 4s delays between retries

#### Timeout Protection
```csharp
var timeoutPolicy = Policy.TimeoutAsync(
    TimeSpan.FromSeconds(5));

try
{
    await timeoutPolicy.ExecuteAsync(async () =>
        await _httpClient.GetAsync(url));
}
catch (OperationCanceledException)
{
    _logger.LogError("Request timed out after 5 seconds");
}
```

### Reference Implementation

**eShopOnContainers** (Microsoft reference app):
```bash
# Clone reference microservice architecture
git clone https://github.com/dotnet-architecture/eShopOnContainers.git

# Services included:
# - OrderingService (C#)
# - CatalogService (C#)
# - PaymentService (C#)
# - ShippingService
# - IdentityService (IdentityServer)
# - APIGateway (Ocelot)

# Deploy with Docker Compose
docker-compose -f docker-compose.yml up

# Access: http://localhost:5100
```

---

## 7. Deployment Checklist

### Pre-Deployment

- [ ] Code compiles without warnings (`dotnet build`)
- [ ] Tests pass (`dotnet test`)
- [ ] Security dependencies updated (`dotnet list package --outdated`)
- [ ] Configuration externalized (no secrets in code)
- [ ] Database migrations prepared (if needed)
- [ ] Logging configured (Application Insights or similar)
- [ ] Health checks implemented (`/health` endpoint)

### Deployment Configuration

- [ ] Environment variables set (connection strings, API keys)
- [ ] HTTPS enabled (required for production)
- [ ] CORS configured correctly
- [ ] Authentication/Authorization tested
- [ ] Auto-scaling policies set (if microservices)
- [ ] Monitoring/Alerts configured
- [ ] Backup strategy in place (databases)

### Post-Deployment

- [ ] Smoke tests pass against live environment
- [ ] Error logs monitored (first 24 hours)
- [ ] Performance baseline established
- [ ] Rollback procedure documented
- [ ] Documentation updated (API changes, deployment notes)

---

## 8. Quick Command Reference

### Azure CLI
```bash
# Login
az login

# Create App Service
az webapp up --sku F1 --name <app-name> --os-type linux

# Configure settings
az webapp config appsettings set \
  --resource-group <rg> \
  --name <app-name> \
  --settings key1=value1 key2=value2

# View logs
az webapp log tail --resource-group <rg> --name <app-name>

# Delete resources
az group delete --name <resource-group>
```

### .NET CLI
```bash
# Create project
dotnet new blazor -n MyApp --framework net10.0

# Restore dependencies
dotnet restore

# Build
dotnet build

# Run
dotnet run

# Publish (Release)
dotnet publish --configuration Release

# Test
dotnet test

# Add package
dotnet add package Azure.Storage.Blobs
```

### Docker
```bash
# Build image
docker build -t myregistry.azurecr.io/myservice:1.0 .

# Run locally
docker run -p 5000:80 myregistry.azurecr.io/myservice:1.0

# Push to registry
docker push myregistry.azurecr.io/myservice:1.0
```

---

## 9. Key Decision Matrix

### "Should I use...?"

| Technology | When YES | When NO |
|-----------|----------|---------|
| **App Service** | Web apps, simple scaling needs | Complex orchestration, custom Docker networking |
| **Container Apps** | Microservices, serverless containers | Massive Kubernetes complexity not needed |
| **Azure Functions** | Event-driven, pay-per-execution | Always-running services, low latency critical |
| **Service Bus** | Decoupled services, 1+ min latency OK | Real-time sync (< 100ms), direct HTTP better |
| **Cosmos DB** | Global distribution, flexible schema | Relational, ACID transactions needed (use SQL) |
| **Managed Identity** | Production auth to Azure services | Development, testing (use access keys) |
| **.NET 10** | New projects, cross-platform | Legacy system upgrades, .NET Framework hard requirement |
| **multi-target** | Library/SDK for broad ecosystem | Internal tool/service, no .NET Framework users |

---

## 10. Common Gotchas & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| "App not found" deployment | HTTPS cert issues, DNS not configured | Check portal Overview page, add custom domain |
| Port binding fails | App Service only supports 80/443 | Remove hardcoded port binding, use `PORT` env var |
| Auth fails on App Service | Free tier doesn't support AAD | Upgrade to Basic tier or use custom auth |
| Database timeout | Connection string not updated | Use Azure Key Vault for connection strings |
| Large deployment slow | Uploading 500MB+ package | Use smaller base images, enable compression |
| Multi-target NuGet dependency hell | Different versions per framework | Multi-target dependencies too, test each combination |
| Service can't reach database | Network isolation | Add Database Firewall rule for App Service IP |

---

**Last Updated**: March 29, 2026
**Microsoft Learn Version**: Current (2026-Q1)
