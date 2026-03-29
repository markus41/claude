---
name: MicrosoftDocs Learning Sample Repository Catalog
description: Structured inventory of Microsoft Learn sample repositories for Blazor, .NET Aspire, cloud-native patterns, and DevOps
type: reference
---

# MicrosoftDocs Learning Sample Repositories

## Blazor Interactive Components & UI

### mslearn-build-interactive-components-blazor
**Purpose**: Educational reference for Blazor interactive component architecture
**Project**: BlazingPizza (pizza-ordering application)
**Language Breakdown**: C# (27.5%), HTML (32.6%), CSS (39.9%)

**Directory Structure**:
- `Data/` - Data layer components
- `Extensions/` - Extension methods and utilities
- `Models/` - Data model definitions
- `Orders/` - Order-specific functionality
- `Pages/` - Blazor page components
- `Shared/` - Reusable component library
- `wwwroot/` - Static web assets (CSS, JavaScript, images)
- `Properties/` - Project configuration

**Key Concepts Demonstrated**:
- Building interactive components with Blazor
- Component composition and reuse
- Page organization and structure
- State management within components

---

### mslearn-use-forms-in-blazor-web-apps
**Purpose**: Blazor form handling, validation, and binding patterns
**Project**: Pizza store form application
**Language Breakdown**: C# (32.4%), HTML (28.8%), CSS (38.8%)

**Directory Structure**:
- `Model/` - Data models and entity definitions
- `Pages/` - Blazor page components
- `Shared/` - Reusable UI component library
- `wwwroot/` - Static assets
- `Properties/` - Configuration
- Database: SQLite (`pizza.db`)

**Backend Components**:
- `OrderController.cs` - Order API endpoints
- `OrderState.cs` - Order state management
- `PizzaStoreContext.cs` - Entity Framework DbContext
- `SpecialsController.cs` - Promotions/specials endpoints
- `SeedData.cs` - Database seed data
- `Program.cs` - Application startup configuration

**Key Concepts Demonstrated**:
- Form binding in Blazor
- Form validation patterns
- State management (OrderState)
- API integration with controllers
- Database context setup (EF Core)
- Data seeding for demo purposes

---

### mslearn-interact-with-data-blazor-web-apps
**Purpose**: Data access patterns and database interaction in Blazor
**Project**: Pizza store application with data layer
**Language Breakdown**: Similar ASP.NET Blazor structure

**Directory Structure**:
- `Model/` - Data entities and definitions
- `Pages/` - Blazor components with data binding
- `Shared/` - Reusable components
- `wwwroot/` - Static assets
- `Properties/` - Configuration
- Database integration (Entity Framework)

**Key Concepts Demonstrated**:
- Entity Framework Core integration
- Model-based data access
- Component data binding
- Database querying from Blazor components
- CRUD operations through data layer

---

### mslearn-blazor-navigation
**Purpose**: Routing, page navigation, and layout patterns in Blazor
**Project**: Pizza store application with navigation focus
**Language Breakdown**: C# (28.9%), HTML (20.6%), CSS (50.5%)

**Directory Structure**:
- `Pages/` - Routable Blazor page components
- `Shared/` - Shared layouts and components
- `Model/` - Data models
- `wwwroot/` - Static web assets
- Configuration: `appsettings.json`, `Program.cs`
- Database: `pizza.db`

**Key Concepts Demonstrated**:
- Blazor routing and page directives
- Layout components and organization
- Navigation UI patterns
- URL parameters and query strings
- Master-detail navigation patterns
- Shared layout structure

---

## .NET Aspire & Cloud-Native Orchestration

### aspire-docs-samples
**Purpose**: .NET Aspire orchestration patterns and service coordination
**Featured Sample**: SupportTicketApi

**Project Structure**:
- `AppHost/` - Service orchestration and coordination
- `MigrationService/` - Dedicated database migration worker
- `Api/` - ASP.NET Core Web API with CRUD
- `Shared/` - Data models and service defaults
- `sql/` - SQL Server instance

**Key Orchestration Patterns**:
1. **Service Startup Ordering**: Uses `WaitForCompletion` to ensure SQL Server and migration service complete before API starts
2. **Database Migration Separation**: Dedicated worker service handles schema migrations independently
3. **Service Dependencies**: Explicit orchestration of startup sequence
4. **Health Checks & Observability**: Service defaults configuration for health endpoints and OpenTelemetry
5. **Containerization**: SQL Server running in orchestrated Docker container

**Production Pattern Value**:
- Demonstrates independent control of database migrations from application deployments
- Shows coordination of multiple service lifecycles
- Illustrates service discovery and dependency injection patterns

---

## Cloud-Native .NET Microservices

### mslearn-dotnet-cloudnative
**Purpose**: Cloud-native patterns and microservices architecture with .NET
**Learning Path**: "Create Microservices with .NET"

**Estimated Coverage** (based on Microsoft Learn path):
- Microservices architecture principles
- ASP.NET Core service implementation
- Service communication patterns
- Resilience patterns (Circuit Breaker, Retry)
- Data management across services
- API design for microservices
- Container deployment

**Setup Instructions** (from docs):
- Use GitHub Codespaces for cloud-based development
- Configure `appsettings.json` for environment-specific settings
- Multiple example microservices referenced

---

### mslearn-dotnet-cloudnative-devops
**Purpose**: DevOps, CI/CD, and cloud deployment for .NET microservices
**Learning Path**: "Microservices DevOps with ASP.NET Core"

**Key Pattern Coverage**:

1. **CI/CD Automation**:
   - GitHub Actions workflow configuration
   - Container image building and registry authentication
   - Automated deployment triggered by commits
   - Secret management in CI/CD pipelines

2. **Kubernetes & Azure**:
   - Azure Kubernetes Service (AKS) cluster deployment
   - Helm chart configuration and modification
   - Infrastructure-as-code practices
   - Rollback capabilities

3. **Container Orchestration**:
   - Container image building for microservices
   - Registry authentication and credential management
   - Deployment automation

**Technologies**:
- GitHub Actions (workflow automation)
- Azure Container Registry (image storage)
- Azure Kubernetes Service (orchestration)
- Helm (Kubernetes package manager)
- .NET microservices target architecture

---

## Cross-Cutting Themes

### Common Application Pattern: Pizza Store
Multiple repositories (forms, navigation, data interaction) use a pizza-ordering application as the domain model. This consistent domain allows learners to:
- Focus on Blazor/data patterns rather than learning a new business domain
- Compare how different concerns (forms, routing, data) interact in same app
- Build understanding progressively through the learning path

### Technology Stack Consistency
All Blazor samples use:
- **Language**: C# with Razor syntax
- **Database**: SQLite for development (pizza.db)
- **Architecture**: Standard ASP.NET Core Blazor Web App structure
- **Frontend**: CSS (38-51% of repos), modern Blazor components
- **Backend**: EF Core for ORM, Controllers for APIs, State management patterns

### Entity Framework Core Integration
Consistent use of EF Core across data interaction samples:
- DbContext pattern (PizzaStoreContext)
- Model-based approach
- Seed data for development
- Migration patterns (demonstrated in Aspire sample)

---

## Recommended Learning Sequence

1. **Start with**: `mslearn-build-interactive-components-blazor` → Understand component architecture
2. **Then**: `mslearn-blazor-navigation` → Learn routing and page organization
3. **Then**: `mslearn-use-forms-in-blazor-web-apps` → Add form handling and state
4. **Then**: `mslearn-interact-with-data-blazor-web-apps` → Integrate data access
5. **Parallel**: `aspire-docs-samples` → Learn service orchestration for multi-service apps
6. **Advanced**: `mslearn-dotnet-cloudnative` → Microservices architecture patterns
7. **Advanced**: `mslearn-dotnet-cloudnative-devops` → Production deployment and DevOps

---

## Key Implementation Notes

### BlazingPizza Domain
- Order models with items and selections
- Controller-based API endpoints (Orders, Specials)
- OrderState for client-side state management
- Seed data with database initialization

### Service Startup Patterns
- AppHost orchestrates dependencies
- WaitForCompletion enforces startup ordering
- Database migrations complete before application starts
- Health checks and observability built in

### Repository Metadata
All repositories:
- Licensed under MIT (code), Creative Commons 4.0 (docs)
- Require CLA for contributions
- Adopt Microsoft Open Source Code of Conduct
- Maintained by MicrosoftDocs organization
