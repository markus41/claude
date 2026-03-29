---
name: cloud-native-deploy
description: Deploying .NET apps to Azure Container Apps, App Service, Docker, and Kubernetes with CI/CD
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
triggers:
  - deploy
  - azure
  - docker
  - container
  - kubernetes
  - ci cd
  - github actions
  - azure devops
---

# Cloud-Native Deployment

## Azure Container Apps (via Aspire)

```bash
# Install Azure Developer CLI
winget install microsoft.azd  # Windows
brew install azd              # macOS

# Initialize and deploy
azd init
azd provision   # Creates Azure resources from Aspire manifest
azd deploy      # Deploys all services
```

## Dockerfile (Multi-stage)

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copy and restore
COPY *.sln .
COPY */*.csproj ./
RUN for file in *.csproj; do mkdir -p ${file%.*}/ && mv $file ${file%.*}/; done
RUN dotnet restore

# Build and publish
COPY . .
RUN dotnet publish src/MyApp.Web/MyApp.Web.csproj -c Release -o /app/publish --no-restore

# Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "MyApp.Web.dll"]
```

## Docker Compose

```yaml
services:
  web:
    build:
      context: .
      dockerfile: src/MyApp.Web/Dockerfile
    ports:
      - "8080:8080"
    environment:
      - ConnectionStrings__Default=Host=db;Database=myapp;Username=postgres;Password=postgres
      - ASPNETCORE_ENVIRONMENT=Development
    depends_on:
      db:
        condition: service_healthy

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: myapp
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

## GitHub Actions CI/CD

```yaml
name: CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

env:
  DOTNET_VERSION: '10.0.x'
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-dotnet@v4
        with:
          dotnet-version: ${{ env.DOTNET_VERSION }}

      - run: dotnet restore
      - run: dotnet build --no-restore -c Release -warnaserror
      - run: dotnet test --no-build -c Release --logger trx --results-directory TestResults
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: test-results
          path: TestResults

  deploy:
    needs: build-and-test
    if: github.ref == 'refs/heads/main'
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: azure/login@v2
        with:
          creds: ${{ secrets.AZURE_CREDENTIALS }}
      - run: |
          dotnet publish -c Release -o ./publish
          az webapp deploy --resource-group myapp-rg --name myapp-web --src-path ./publish
```

## Environment Configuration

```csharp
// Program.cs - environment-specific config
builder.Configuration
    .AddJsonFile("appsettings.json")
    .AddJsonFile($"appsettings.{builder.Environment.EnvironmentName}.json", optional: true)
    .AddEnvironmentVariables()
    .AddUserSecrets<Program>(optional: true); // Development only

// Health check endpoint for load balancer
app.MapHealthChecks("/health");
```

## Azure App Service Deployment (from official docs)

### Azure CLI (one command)
```bash
az login
az webapp up --sku F1 --name <app-name> --os-type linux
# --sku: F1 (free), B1 (basic), S1 (standard), P1v3 (premium)
# app-name must be globally unique (a-z, 0-9, -)
```

### Azure Developer CLI (fastest)
```bash
azd init --template https://github.com/Azure-Samples/quickstart-deploy-aspnet-core-app-service.git
azd up      # Provisions + deploys
azd down    # Cleanup all resources
```

### PowerShell Deployment
```powershell
Connect-AzAccount
dotnet publish --configuration Release
Compress-Archive -Path bin\Release\net10.0\publish\* -DestinationPath deploy.zip
Publish-AzWebApp -ResourceGroupName myRG -Name <app-name> -ArchivePath deploy.zip -Force
```

## Azure SDK Pattern (from official docs)

```csharp
// 4-step pattern: Locate → Install → Create client → Call methods

// Blob Storage
using Azure.Storage.Blobs;
var client = new BlobContainerClient(
    new Uri("https://<account>.blob.core.windows.net/<container>"),
    new DefaultAzureCredential());
await client.UploadBlobAsync("file.txt", File.OpenRead("local.txt"));

// Key Vault
using Azure.Security.KeyVault.Secrets;
var kvClient = new SecretClient(
    new Uri("https://<vault>.vault.azure.net/"),
    new DefaultAzureCredential());
var secret = await kvClient.GetSecretAsync("my-secret");

// Service Bus
using Azure.Messaging.ServiceBus;
var sbClient = new ServiceBusClient("<connection-string>");
var sender = sbClient.CreateSender("queue-name");
await sender.SendMessageAsync(new ServiceBusMessage("Hello"));
```

## Key Azure Services for .NET (from official docs)

| Use Case | Azure Service | NuGet Package |
|----------|--------------|---------------|
| Web apps, APIs | App Service | - |
| Serverless microservices | Container Apps | - |
| Event-driven functions | Azure Functions | Azure.Functions |
| Relational data | Azure SQL | Microsoft.Data.SqlClient |
| Global NoSQL | Cosmos DB | Azure.Cosmos |
| File/blob storage | Blob Storage | Azure.Storage.Blobs |
| Messaging queues | Service Bus | Azure.Messaging.ServiceBus |
| Secrets management | Key Vault | Azure.Security.KeyVault.Secrets |
| Authentication | Entra ID | Microsoft.Identity.Web |
| Caching | Redis | StackExchange.Redis |

## App Service Migration Gotchas (from official docs)

- Only HTTP (80) and HTTPS (443) ports supported - remove custom ports
- No GAC support - deploy dependencies in `\bin` folder
- No COM/COM+ - rewrite in managed code
- No physical filesystem - use Azure Files (SMB) or Blob Storage
- Azure AD requires paid tier (Basic+) - free tier doesn't support it
- Move connection strings to Azure Key Vault in production

## Cross-Platform Targeting (from official docs)

```xml
<!-- Single target (recommended for apps) -->
<TargetFramework>net10.0</TargetFramework>

<!-- Multi-target (for NuGet libraries needing broad reach) -->
<TargetFrameworks>net10.0;netstandard2.0;net462</TargetFrameworks>
```

**Anti-pattern**: Don't target `netstandard1.x` - creates massive dependency graph.
