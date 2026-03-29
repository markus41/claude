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
