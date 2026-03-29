---
name: DDD/CQRS Patterns for .NET Microservices
description: Comprehensive patterns, code examples, and architectural guidance for Domain-Driven Design and CQRS in .NET microservices
type: reference
---

# DDD/CQRS Patterns for .NET Microservices - Microsoft Learn Research

## Executive Summary

This is a comprehensive knowledge base of Domain-Driven Design (DDD) and Command Query Responsibility Segregation (CQRS) patterns for .NET microservices, extracted from official Microsoft Learn documentation. Covers entity design, aggregates, repositories, EF Core persistence, domain events, validation, and practical CQRS implementation.

**Sources**:
- Microservice Domain Model Design
- Application Layer & Web API Design
- EF Core Infrastructure Implementation
- Persistence Layer Design & Repositories
- Domain Events Design & Implementation
- Domain Model Layer Validations
- Simplified CQRS/DDD Patterns Application

---

## 1. DOMAIN MODEL DESIGN PATTERNS

### 1.1 The Domain Entity Pattern

**Core Principle**: Entities are defined by identity, continuity, and persistence over time—not just their attributes.

**Key Rules**:
- Entities must implement **behavior in addition to data attributes** (avoid "anemic models")
- An entity's identity can cross microservice boundaries, but attributes and logic are bounded by context
- Each bounded context models only the attributes and behaviors it needs

**Rich vs Anemic Domain Models**:
- **Rich Model** (preferred for complex services): Entities contain both data and domain logic, business rules are encapsulated
- **Anemic Model** (acceptable for simple CRUD): Entities hold data only; logic lives in service objects
- Trade-off: Rich models are better long-term but require more upfront investment

**When to Use**:
- Rich: Complex microservices with evolving business rules
- Anemic: Simple CRUD services with minimal logic

### 1.2 The Value Object Pattern

**Definition**: An object with no conceptual identity that describes domain aspects. Focus on *what* they are, not *who*.

**Examples**: Address (might be a VO in e-commerce, but an entity in utilities company), Money, Phone Number

**Key Characteristics**:
- Immutable
- Compared by value, not identity
- Can be embedded in entities
- EF Core 2.0+: Supported via "Owned Entities" feature

**Example Use Case**:
```csharp
// Address as a Value Object (embedded in Order)
public class Address
{
    public string Line1 { get; private set; }
    public string City { get; private set; }
    public string State { get; private set; }
    public int Zip { get; private set; }
    // Immutable—no setters
}

// In EF Core configuration:
orderConfiguration.OwnsOne(o => o.Address, a => a.WithOwner());
```

### 1.3 The Aggregate Pattern

**Definition**: A cluster of entities and behaviors that can be treated as a cohesive unit. Transactions are scoped to aggregates.

**Key Rules**:
- One transaction = one aggregate (for consistency)
- Aggregates must be identified based on real transaction operations
- Only the **Aggregate Root** should be directly accessed from outside
- Child entities communicate upward through the root

**Aggregate Root Pattern**:
- Ensures consistency of the aggregate
- Only entry point for updates to child entities
- Maintains all invariants and consistency rules
- Acts as the "consistency guardian"

**Example: Order Aggregate**:
```csharp
public class Order : Entity, IAggregateRoot
{
    private DateTime _orderDate;
    private int? _buyerId;  // FK to different aggregate root
    private readonly List<OrderItem> _orderItems;

    public IReadOnlyCollection<OrderItem> OrderItems => _orderItems;

    public void AddOrderItem(int productId, string productName,
                            decimal unitPrice, decimal discount,
                            string pictureUrl, int units = 1)
    {
        // Validation logic here
        var orderItem = new OrderItem(productId, productName,
                                     unitPrice, discount,
                                     pictureUrl, units);
        _orderItems.Add(orderItem);
    }
}
```

**Critical Design Principle**: No direct navigation between aggregates. Use foreign keys only:
```csharp
// Correct—FK only, no navigation property
private int? _buyerId;

// Wrong—creates tight coupling
public Buyer Buyer { get; set; }
```

---

## 2. ENTITY FRAMEWORK CORE PERSISTENCE PATTERNS

### 2.1 DDD-Compliant EF Core Design

**Core Principles**:
- Use **POCO (Plain Old CLR Objects)** entities—persistence-ignorant
- Leverage **private fields** for encapsulation (EF Core 1.1+)
- Expose **IReadOnlyCollection<T>** instead of ICollection<T>
- Use **Fluent API** (not data annotations) to keep model clean

**Private Fields & Collections**:
```csharp
public class Order : Entity
{
    private DateTime _orderDate;  // Private field
    private readonly List<OrderItem> _orderItems;

    // Expose as read-only
    public IReadOnlyCollection<OrderItem> OrderItems => _orderItems;

    protected Order() { }  // For EF

    public Order(int buyerId, int paymentMethodId, Address address)
    {
        // Initialization
    }
}
```

**EF Core Configuration (Fluent API)**:
```csharp
class OrderEntityTypeConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> orderConfiguration)
    {
        orderConfiguration.ToTable("orders", "ordering");
        orderConfiguration.HasKey(o => o.Id);

        // Map private fields
        orderConfiguration
            .Property<int?>("_buyerId")
            .UsePropertyAccessMode(PropertyAccessMode.Field)
            .HasColumnName("BuyerId")
            .IsRequired(false);

        // Map collections through field
        var navigation = orderConfiguration.Metadata
            .FindNavigation(nameof(Order.OrderItems));
        navigation.SetPropertyAccessMode(PropertyAccessMode.Field);

        // Owned value objects
        orderConfiguration.OwnsOne(o => o.Address, a => a.WithOwner());
    }
}
```

### 2.2 Repository Pattern Implementation

**One Repository Per Aggregate**:
```csharp
public interface IOrderRepository : IRepository<Order>
{
    Order Add(Order order);
    Order Update(Order order);
    Task<Order> FindAsync(int orderId);
}

public class OrderRepository : IOrderRepository
{
    private readonly OrderingContext _context;

    public IUnitOfWork UnitOfWork => _context;

    public OrderRepository(OrderingContext context)
    {
        _context = context;
    }

    public Order Add(Order order)
    {
        return _context.Orders.Add(order).Entity;
    }

    public async Task<Order> FindAsync(int orderId)
    {
        return await _context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId);
    }
}
```

**Generic Repository Base**:
```csharp
public interface IRepository<T> where T : IAggregateRoot
{
    T Add(T entity);
    void Update(T entity);
    Task<T> FindAsync(int id);
}
```

**Key Design Decision**:
- Custom repositories provide abstraction layer for testing and decoupling
- However, repositories are optional; DbContext alone can work for CRUD services
- Trade-off: Extra abstraction vs. simplicity

### 2.3 Query Specification Pattern

**Purpose**: Encapsulate query logic with criteria, includes, and paging—DDD-compliant queries.

```csharp
public interface ISpecification<T>
{
    Expression<Func<T, bool>> Criteria { get; }
    List<Expression<Func<T, object>>> Includes { get; }
    List<string> IncludeStrings { get; }
}

public abstract class BaseSpecification<T> : ISpecification<T>
{
    public BaseSpecification(Expression<Func<T, bool>> criteria)
    {
        Criteria = criteria;
    }

    public Expression<Func<T, bool>> Criteria { get; }
    public List<Expression<Func<T, object>>> Includes { get; } = new();
    public List<string> IncludeStrings { get; } = new();

    protected virtual void AddInclude(Expression<Func<T, object>> expr)
    {
        Includes.Add(expr);
    }

    protected virtual void AddInclude(string include)
    {
        IncludeStrings.Add(include);
    }
}

// Implementation
public class BasketWithItemsSpec : BaseSpecification<Basket>
{
    public BasketWithItemsSpec(int basketId)
        : base(b => b.Id == basketId)
    {
        AddInclude(b => b.Items);
    }
}

// Repository usage
public IEnumerable<T> List(ISpecification<T> spec)
{
    var queryable = spec.Includes
        .Aggregate(_dbContext.Set<T>().AsQueryable(),
            (current, include) => current.Include(include));

    return queryable
        .Where(spec.Criteria)
        .AsEnumerable();
}
```

### 2.4 Advanced EF Core Features

**Hi/Lo Algorithm for Key Generation**:
```csharp
// Generates unique IDs in batches without round-trips to DB
orderConfiguration.Property(o => o.Id)
    .UseHiLo("orderseq", "ordering");

// Benefits:
// - Unique identifiers before commit
// - Batch generation reduces DB calls
// - Human-readable (not GUIDs)
// - No Unit of Work pattern violation
```

**Shadow Properties**:
```csharp
// Properties not in entity class, maintained by ChangeTracker
// Useful for audit fields, timestamps
modelBuilder.Entity<Order>()
    .Property<DateTime>("CreatedAt")
    .HasDefaultValueSql("GETUTCDATE()");
```

### 2.5 DbContext Lifetime & Service Registration

**Critical**: DbContext must be **Scoped** (per HTTP request).

```csharp
builder.Services.AddDbContext<OrderingContext>(options =>
{
    options.UseSqlServer(Configuration["ConnectionString"],
        sqlOptions => sqlOptions.MigrationsAssembly("Ordering.Infrastructure"));
},
ServiceLifetime.Scoped);  // Default, but shown for clarity

// Repositories also scoped
builder.RegisterType<OrderRepository>()
    .As<IOrderRepository>()
    .InstancePerLifetimeScope();
```

**Why Scoped?**
- Multiple repositories in same HTTP request share DbContext
- Unit of Work pattern: All changes commit together in SaveChanges()
- Single transaction scope per request

---

## 3. DOMAIN EVENTS DESIGN & IMPLEMENTATION

### 3.1 Domain Events vs Integration Events

| Aspect | Domain Events | Integration Events |
|--------|--------------|-------------------|
| Scope | In-process, same domain | Cross-service, async |
| Communication | Synchronous/in-memory | Asynchronous (Service Bus, RabbitMQ) |
| Consistency | Atomic transaction | Eventual consistency |
| Use Case | Side effects across aggregates | Propagate state to other microservices |

### 3.2 Implementing Domain Events

**Event Class** (immutable, past-tense naming):
```csharp
public class OrderStartedDomainEvent : INotification
{
    public string UserId { get; }
    public string UserName { get; }
    public int CardTypeId { get; }
    public string CardNumber { get; }
    public string CardSecurityNumber { get; }
    public string CardHolderName { get; }
    public DateTime CardExpiration { get; }
    public Order Order { get; }

    public OrderStartedDomainEvent(Order order, string userId, string userName,
                                   int cardTypeId, string cardNumber,
                                   string cardSecurityNumber, string cardHolderName,
                                   DateTime cardExpiration)
    {
        Order = order;
        UserId = userId;
        UserName = userName;
        // ... assign others
    }
    // Read-only properties—immutable
}
```

**Base Entity Class** (deferred event publishing):
```csharp
public abstract class Entity
{
    private List<INotification> _domainEvents;

    public List<INotification> DomainEvents => _domainEvents;

    public void AddDomainEvent(INotification eventItem)
    {
        _domainEvents = _domainEvents ?? new List<INotification>();
        _domainEvents.Add(eventItem);
    }

    public void RemoveDomainEvent(INotification eventItem)
    {
        _domainEvents?.Remove(eventItem);
    }
}
```

**Raising Events in Aggregate**:
```csharp
public class Order : Entity, IAggregateRoot
{
    public void SetPaymentMethod(int cardTypeId, string cardNumber, ...)
    {
        // Business logic

        // Raise event (deferred)
        var domainEvent = new OrderStartedDomainEvent(this, userId, userName, ...);
        this.AddDomainEvent(domainEvent);
    }
}
```

### 3.3 Event Publishing & Dispatching

**Deferred Approach** (dispatch before/after SaveChanges):
```csharp
public class OrderingContext : DbContext, IUnitOfWork
{
    public async Task<bool> SaveEntitiesAsync(
        CancellationToken cancellationToken = default)
    {
        // BEFORE SaveChanges: Single transaction, atomic
        await _mediator.DispatchDomainEventsAsync(this);

        // SaveChanges commits everything
        var result = await base.SaveChangesAsync();

        return result > 0;
    }
}
```

**Key Design Decision**:
- **Before commit**: Single atomic transaction (simpler, safer)
- **After commit**: Eventual consistency (better scalability, needs compensatory actions)

### 3.4 Domain Event Handlers

**Handler Implementation** (application layer):
```csharp
public class ValidateOrAddBuyerAggregateWhenOrderStartedDomainEventHandler
    : INotificationHandler<OrderStartedDomainEvent>
{
    private readonly ILogger _logger;
    private readonly IBuyerRepository _buyerRepository;
    private readonly IOrderingIntegrationEventService _integrationEventService;

    public async Task Handle(OrderStartedDomainEvent domainEvent,
                            CancellationToken cancellationToken)
    {
        // Get or create buyer
        var buyer = await _buyerRepository.FindAsync(domainEvent.UserId);

        if (buyer == null)
        {
            buyer = new Buyer(domainEvent.UserId, domainEvent.UserName);
        }

        // Verify or add payment method
        buyer.VerifyOrAddPaymentMethod(
            domainEvent.CardTypeId,
            $"Payment Method on {DateTime.UtcNow}",
            domainEvent.CardNumber,
            domainEvent.CardSecurityNumber,
            domainEvent.CardHolderName,
            domainEvent.CardExpiration,
            domainEvent.Order.Id);

        // Persist
        await _buyerRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        // Optionally publish integration event for other microservices
        var integrationEvent = new OrderStatusChangedToSubmittedIntegrationEvent(
            domainEvent.Order.Id, domainEvent.Order.OrderStatus.Name, buyer.Name);
        await _integrationEventService.AddAndSaveEventAsync(integrationEvent);
    }
}
```

### 3.5 Single Transaction vs Eventual Consistency

**Single Transaction** (before SaveChanges):
```
✓ Simpler, atomic
✓ No compensatory actions needed
✗ Less scalable (more DB locks)
✓ Use when: operations on multiple aggregates must be atomic
```

**Eventual Consistency** (after SaveChanges):
```
✓ More scalable
✓ Less DB lock contention
✗ Needs compensatory actions for failures
✗ More complex
✓ Use when: slight eventual delay is acceptable
```

---

## 4. DOMAIN MODEL LAYER VALIDATIONS

### 4.1 Validation Patterns

**Pattern 1: Exception-Based Validation** (simplest):
```csharp
public void SetAddress(Address address)
{
    _shippingAddress = address ?? throw new ArgumentNullException(nameof(address));
}

public class Order : Entity
{
    public Order(int buyerId, Address address, ...)
    {
        if (buyerId <= 0) throw new ArgumentException("Invalid buyer");
        if (address == null) throw new ArgumentNullException(nameof(address));

        // ... initialize
    }
}
```

**Caveat**: Ensure all-or-nothing mutation to avoid partial states:
```csharp
// Wrong—partial state if validation fails midway
public void SetAddress(string line1, string line2, string city, string state, int zip)
{
    _address.line1 = line1 ?? throw new ...;
    _address.line2 = line2;  // Assigned if line1 invalid!
    _address.city = city ?? throw new ...;
}
```

**Pattern 2: Specification Pattern** (advanced):
```csharp
public abstract class Specification<T>
{
    public abstract bool IsSatisfiedBy(T candidate);
    public virtual bool IsSatisfiedBy(T candidate, out string reason)
    {
        reason = "";
        return IsSatisfiedBy(candidate);
    }
}

public class ValidOrderSpec : Specification<Order>
{
    public override bool IsSatisfiedBy(Order order)
    {
        return order.OrderItems.Count > 0 &&
               order.TotalAmount > 0;
    }
}
```

**Pattern 3: Notification Pattern** (collect errors):
```csharp
public class ValidationResult
{
    public List<string> Errors { get; } = new();
    public bool IsValid => Errors.Count == 0;

    public void Add(string error) => Errors.Add(error);
}

public class Order : Entity
{
    public ValidationResult Validate()
    {
        var result = new ValidationResult();
        if (OrderItems.Count == 0) result.Add("Order must have items");
        if (TotalAmount <= 0) result.Add("Order amount must be positive");
        return result;
    }
}
```

### 4.2 Validation Boundaries

**Domain Layer**:
- Invariants (rules that must always be true)
- State constraints
- Cross-entity relationships

**Application Layer**:
- Field-level validation (DTOs, commands)
- Data annotations
- Business rule validation

**Example**:
```csharp
// Domain: Invariant validation
public class Order : Entity
{
    public void AddItem(OrderItem item)
    {
        if (item == null) throw new ArgumentNullException(nameof(item));
        if (item.Quantity <= 0)
            throw new InvalidOperationException("Quantity must be positive");
        _items.Add(item);
    }
}

// Application: Command validation
public class CreateOrderCommand
{
    [Required]
    public int BuyerId { get; set; }

    [Range(1, int.MaxValue)]
    public int[] ProductIds { get; set; }
}
```

### 4.3 Two-Step Validation

1. **Field validation** (DTOs/Commands): Use data annotations, runs client + server
2. **Domain validation** (Entities): Use invariants, domain logic

---

## 5. APPLICATION LAYER & WEB API DESIGN

### 5.1 SOLID Principles Application

**Single Responsibility**: Each class has one reason to change
**Open/Closed**: Open for extension, closed for modification
**Liskov Substitution**: Derived classes can substitute base classes
**Interface Segregation**: Clients depend on specific interfaces
**Dependency Inversion**: Depend on abstractions, not implementations

### 5.2 Dependency Injection Pattern

**Constructor-Based DI** (explicit dependencies):
```csharp
public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand>
{
    private readonly IOrderRepository _orderRepository;
    private readonly IOrderingIntegrationEventService _integrationEventService;
    private readonly IMediator _mediator;

    public CreateOrderCommandHandler(
        IOrderRepository orderRepository,
        IOrderingIntegrationEventService integrationEventService,
        IMediator mediator)
    {
        _orderRepository = orderRepository;
        _integrationEventService = integrationEventService;
        _mediator = mediator;
    }

    public async Task<bool> Handle(CreateOrderCommand command,
                                   CancellationToken cancellationToken)
    {
        // Command handling logic
    }
}
```

**Service Registration** (ASP.NET Core):
```csharp
builder.Services.AddScoped<IOrderRepository, OrderRepository>();
builder.Services.AddScoped<IOrderingIntegrationEventService, OrderingIntegrationEventService>();
builder.Services.AddMediatR(cfg => cfg.RegisterServicesFromAssembly(typeof(Program).Assembly));
```

### 5.3 Application Layer Responsibilities

- Command/Query handling
- Orchestration of domain logic
- Application services
- DTO transformation
- Integration event publishing

---

## 6. SIMPLIFIED CQRS PATTERN

### 6.1 CQRS Basics

**Command Query Responsibility Segregation**: Separate read and write models.

```
┌─────────────────────────────────────────────────┐
│        Ordering Microservice                    │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────────┐  ┌──────────────────┐   │
│  │   WRITE MODEL    │  │   READ MODEL     │   │
│  │  (Commands)      │  │  (Queries)       │   │
│  │                  │  │                  │   │
│  │ - Aggregates     │  │ - ViewModels     │   │
│  │ - Domain Logic   │  │ - Dapper         │   │
│  │ - DDD Patterns   │  │ - Flexible SQL   │   │
│  │                  │  │ - No constraints │   │
│  └──────────────────┘  └──────────────────┘   │
│         │                       │              │
│         │ SaveChanges           │ Queries      │
│         └───────────────────────┘              │
│                   │                            │
│                   v                            │
│          ┌─────────────────┐                   │
│          │  Single Database│                   │
│          │  (Ordering DB)  │                   │
│          └─────────────────┘                   │
└─────────────────────────────────────────────────┘
```

### 6.2 Simplified CQRS Implementation

**Commands** (write operations):
```csharp
public class CreateOrderCommand : ICommand
{
    public int BuyerId { get; set; }
    public int[] ProductIds { get; set; }
    public Address ShippingAddress { get; set; }
}

public class CreateOrderCommandHandler : ICommandHandler<CreateOrderCommand, bool>
{
    private readonly IOrderRepository _orderRepository;

    public async Task<bool> Handle(CreateOrderCommand command,
                                   CancellationToken cancellationToken)
    {
        // Validate
        // Create aggregate (Order with OrderItems)
        // Add domain event
        // Save via repository

        var order = new Order(command.BuyerId, command.ShippingAddress, ...);
        _orderRepository.Add(order);
        await _orderRepository.UnitOfWork.SaveEntitiesAsync(cancellationToken);

        return true;
    }
}
```

**Queries** (read operations—no DDD constraints):
```csharp
public class GetOrderQuery : IQuery<OrderViewModel>
{
    public int OrderId { get; set; }
}

public class GetOrderQueryHandler : IQueryHandler<GetOrderQuery, OrderViewModel>
{
    private readonly IDbConnection _connection;

    public async Task<OrderViewModel> Handle(GetOrderQuery query,
                                            CancellationToken cancellationToken)
    {
        // Direct SQL/Dapper—no aggregates, no constraints
        var sql = @"
            SELECT o.Id, o.OrderDate, o.OrderStatus, b.FullName,
                   oi.ProductId, oi.ProductName, oi.UnitPrice
            FROM Orders o
            JOIN OrderItems oi ON o.Id = oi.OrderId
            LEFT JOIN Buyers b ON o.BuyerId = b.Id
            WHERE o.Id = @OrderId
        ";

        using (var conn = new SqlConnection(_connectionString))
        {
            return await conn.QuerySingleOrDefaultAsync<OrderViewModel>(
                sql, new { OrderId = query.OrderId });
        }
    }
}
```

### 6.3 When to Use Simplified CQRS

| Use Simplified CQRS | Don't Use CQRS |
|-------------------|-------------|
| Complex queries needed | Simple CRUD service |
| Read/write scaling differs | Single database, simple logic |
| Different read/write concerns | No performance bottlenecks |
| Microservice optimization needed | Limited query patterns |

---

## 7. LAYER INTEGRATION FLOW

### 7.1 Request Processing Flow

```
HTTP Request (POST /api/orders)
    │
    ├─> ASP.NET Core Controller
    │   └─> Validates DTO (data annotations)
    │
    ├─> Command Handler (Application Layer)
    │   ├─> Deserialize DTO → Command
    │   ├─> Retrieve aggregate via Repository
    │   │
    │   ├─> Call Aggregate Methods (Domain Layer)
    │   │   ├─> Validate (invariants)
    │   │   ├─> Execute business logic
    │   │   ├─> Add domain events
    │   │   └─> Return modified aggregate
    │   │
    │   ├─> Persist via Repository (Infrastructure Layer)
    │   │   └─> Repository.Update(aggregate)
    │   │
    │   ├─> Save to Database (EF Core, Unit of Work)
    │   │   ├─> DbContext.SaveChangesAsync()
    │   │   │   ├─> Generate SQL
    │   │   │   ├─> Dispatch domain events
    │   │   │   └─> Execute transaction
    │   │   │
    │   │   ├─> Domain Event Handlers (Application Layer)
    │   │   │   ├─> Validate/Add related aggregates
    │   │   │   ├─> Persist updates
    │   │   │   └─> Publish integration events
    │   │   │
    │   │   └─> Commit transaction
    │
    └─> HTTP Response (201 Created)
```

### 7.2 Decoupling Between Layers

```
┌────────────────────────────────────────────────────────┐
│                  API Layer                             │
│        (Controllers, DTOs, Input Validation)           │
└─────────────────────┬──────────────────────────────────┘
                      │ Commands/Queries
                      │
┌─────────────────────▼──────────────────────────────────┐
│              Application Layer                         │
│   (Command Handlers, Queries, Application Services)    │
│   (Uses DI to depend on abstractions below)            │
└─────────────────────┬──────────────────────────────────┘
                      │ Repository Interface
                      │ Event Publishing
                      │
┌─────────────────────▼──────────────────────────────────┐
│                Domain Layer                            │
│      (Entities, Aggregates, Value Objects,             │
│       Repository Interfaces, Domain Events)            │
│    (ZERO dependencies on infrastructure layer)         │
└─────────────────────┬──────────────────────────────────┘
                      │ Implements interfaces
                      │
┌─────────────────────▼──────────────────────────────────┐
│           Infrastructure Layer                         │
│    (EF Core DbContext, Repository Implementations,     │
│     Event Dispatchers, External Service Calls)         │
└────────────────────────────────────────────────────────┘
```

---

## 8. BEST PRACTICES & ANTI-PATTERNS

### 8.1 Best Practices

✓ **One aggregate = one repository**
✓ **Use private fields + IReadOnlyCollection** for child entity protection
✓ **Deferred domain event dispatch** (synchronous, before SaveChanges)
✓ **Fluent API** for EF Core configuration (keeps model clean)
✓ **Specification pattern** for complex queries
✓ **Two-step validation**: DTOs (field) + Entities (invariants)
✓ **Async/await** for all I/O operations
✓ **Scoped DbContext & repositories** (per HTTP request)
✓ **Rich domain models** for complex services

### 8.2 Anti-Patterns to Avoid

✗ **Anemic domain models** (data bags with no logic) — use only for CRUD
✗ **Direct navigation between aggregates** — use FKs only
✗ **Public collections** on entities — use IReadOnlyCollection
✗ **Data annotations on domain entities** — use Fluent API instead
✗ **Mocking DbContext** — mock repositories instead
✗ **Repositories for CRUD services** — DbContext directly is simpler
✗ **Service lifetimes wrong** — DbContext must be Scoped
✗ **Raising events directly** — use deferred approach via base entity
✗ **Business logic in service classes** — put it in aggregates
✗ **Running unit tests against real DB** — mock repositories

---

## 9. QUICK REFERENCE: CQRS/DDD CHECKLIST

### Entity Design
- [ ] Has identity/continuity (not just data)
- [ ] Encapsulates domain logic
- [ ] Private fields with IReadOnlyCollection
- [ ] Validation in constructor & methods
- [ ] Raises domain events

### Aggregate Design
- [ ] One transaction per aggregate
- [ ] Only access via aggregate root
- [ ] Child entities can't be modified directly
- [ ] All invariants enforced by root

### Repository Design
- [ ] One per aggregate root
- [ ] Implements repository interface (domain layer)
- [ ] Query methods for needed operations
- [ ] No public DbContext exposure

### Domain Events
- [ ] Named in past tense
- [ ] Immutable properties
- [ ] Added to entity, not dispatched immediately
- [ ] Dispatched before SaveChanges (atomic)
- [ ] Handled in application layer

### Validation
- [ ] Invariants in entity constructors
- [ ] Constraints in aggregate methods
- [ ] Field validation in DTOs
- [ ] Two-step: DTO → Entity

### CQRS
- [ ] Write path: Commands → Aggregates → Repository → SaveChanges
- [ ] Read path: Queries → Dapper/Direct SQL → ViewModels
- [ ] Single database (simplified CQRS)
- [ ] No DDD constraints on queries

---

## 10. KEY REFERENCES

- **Domain-Driven Design**: Eric Evans, "Domain-Driven Design: Tackling Complexity in the Heart of Software"
- **Effective Aggregate Design**: Vaughn Vernon (3-part series)
- **CQRS**: Greg Young, Martin Fowler, Udi Dahan
- **Microsoft eShopOnContainers**: Reference application using these patterns
- **Specification Pattern**: Steve Smith, DevIQ
- **Repository Pattern**: Martin Fowler's Patterns of Enterprise Application Architecture

---

**Research Date**: 2026-03-29
**Status**: Complete (8/9 URLs processed; 2 certificate errors documented in lessons-learned.md)
