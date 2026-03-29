---
name: ddd-cqrs-patterns
description: Domain-Driven Design and CQRS patterns for .NET microservices including aggregates, value objects, domain events, repositories, and application layer design
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - domain driven design
  - ddd
  - cqrs
  - aggregate
  - value object
  - domain event
  - bounded context
  - repository pattern
  - domain model
  - application layer
  - mediator pattern
---

# Domain-Driven Design & CQRS Patterns

## DDD Layered Architecture

```
┌──────────────────────────────────────────┐
│           Presentation Layer              │
│  (Blazor Web App / API Controllers)       │
├──────────────────────────────────────────┤
│           Application Layer               │
│  (Commands, Queries, Handlers, DTOs)      │
│  (MediatR, Validation, Mapping)           │
├──────────────────────────────────────────┤
│            Domain Layer                   │
│  (Entities, Value Objects, Aggregates)    │
│  (Domain Events, Domain Services)         │
│  (Repository Interfaces, Specifications)  │
├──────────────────────────────────────────┤
│         Infrastructure Layer              │
│  (EF Core, Repositories, Event Bus)       │
│  (External Services, Messaging)           │
└──────────────────────────────────────────┘
```

**Key rule**: Dependencies point inward. Domain has zero external dependencies.

## Entity Base Class

```csharp
public abstract class Entity
{
    private int? _requestedHashCode;
    private int _id;

    public virtual int Id
    {
        get => _id;
        protected set => _id = value;
    }

    private readonly List<INotification> _domainEvents = [];
    public IReadOnlyCollection<INotification> DomainEvents => _domainEvents.AsReadOnly();

    public void AddDomainEvent(INotification eventItem) => _domainEvents.Add(eventItem);
    public void RemoveDomainEvent(INotification eventItem) => _domainEvents.Remove(eventItem);
    public void ClearDomainEvents() => _domainEvents.Clear();

    public bool IsTransient() => Id == default;

    public override bool Equals(object? obj)
    {
        if (obj is not Entity other) return false;
        if (ReferenceEquals(this, other)) return true;
        if (GetType() != other.GetType()) return false;
        if (other.IsTransient() || IsTransient()) return false;
        return Id == other.Id;
    }

    public override int GetHashCode()
    {
        if (!IsTransient())
        {
            _requestedHashCode ??= Id.GetHashCode() ^ 31;
            return _requestedHashCode.Value;
        }
        return base.GetHashCode();
    }

    public static bool operator ==(Entity? left, Entity? right) => Equals(left, right);
    public static bool operator !=(Entity? left, Entity? right) => !Equals(left, right);
}
```

## Value Objects

```csharp
public abstract class ValueObject
{
    protected abstract IEnumerable<object?> GetEqualityComponents();

    public override bool Equals(object? obj)
    {
        if (obj is null || obj.GetType() != GetType()) return false;
        var other = (ValueObject)obj;
        return GetEqualityComponents().SequenceEqual(other.GetEqualityComponents());
    }

    public override int GetHashCode() =>
        GetEqualityComponents()
            .Select(x => x?.GetHashCode() ?? 0)
            .Aggregate((x, y) => x ^ y);

    public static bool operator ==(ValueObject? left, ValueObject? right) =>
        Equals(left, right);
    public static bool operator !=(ValueObject? left, ValueObject? right) =>
        !Equals(left, right);
}

// Example: Address value object
public sealed class Address : ValueObject
{
    public string Street { get; }
    public string City { get; }
    public string State { get; }
    public string Country { get; }
    public string ZipCode { get; }

    public Address(string street, string city, string state, string country, string zipCode)
    {
        Street = street;
        City = city;
        State = state;
        Country = country;
        ZipCode = zipCode;
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Street;
        yield return City;
        yield return State;
        yield return Country;
        yield return ZipCode;
    }
}

// Example: Money value object
public sealed class Money : ValueObject
{
    public decimal Amount { get; }
    public string Currency { get; }

    public Money(decimal amount, string currency)
    {
        if (amount < 0) throw new ArgumentException("Amount cannot be negative");
        Amount = amount;
        Currency = currency ?? throw new ArgumentNullException(nameof(currency));
    }

    public Money Add(Money other)
    {
        if (Currency != other.Currency) throw new InvalidOperationException("Cannot add different currencies");
        return new Money(Amount + other.Amount, Currency);
    }

    protected override IEnumerable<object?> GetEqualityComponents()
    {
        yield return Amount;
        yield return Currency;
    }
}
```

## Aggregate Root

```csharp
public abstract class AggregateRoot : Entity, IAggregateRoot { }

// Example: Order aggregate
public sealed class Order : AggregateRoot
{
    private readonly List<OrderItem> _orderItems = [];
    public IReadOnlyCollection<OrderItem> OrderItems => _orderItems.AsReadOnly();

    public DateTime OrderDate { get; private set; }
    public Address ShippingAddress { get; private set; } = null!;
    public OrderStatus Status { get; private set; }
    public int? BuyerId { get; private set; }

    // Private constructor for EF Core
    private Order() { }

    // Factory method enforces invariants
    public Order(int buyerId, Address shippingAddress)
    {
        BuyerId = buyerId;
        ShippingAddress = shippingAddress ?? throw new ArgumentNullException(nameof(shippingAddress));
        Status = OrderStatus.Submitted;
        OrderDate = DateTime.UtcNow;

        // Raise domain event
        AddDomainEvent(new OrderStartedDomainEvent(this, buyerId));
    }

    public void AddOrderItem(int productId, string productName, decimal unitPrice, int units)
    {
        var existingItem = _orderItems.SingleOrDefault(o => o.ProductId == productId);

        if (existingItem is not null)
        {
            existingItem.AddUnits(units);
        }
        else
        {
            var orderItem = new OrderItem(productId, productName, unitPrice, units);
            _orderItems.Add(orderItem);
        }
    }

    public void SetShippedStatus()
    {
        if (Status != OrderStatus.Paid)
            throw new OrderingDomainException("Cannot ship an order that is not paid.");

        Status = OrderStatus.Shipped;
        AddDomainEvent(new OrderShippedDomainEvent(this));
    }

    public void SetPaidStatus()
    {
        if (Status != OrderStatus.Submitted)
            throw new OrderingDomainException("Cannot pay for an order that is not submitted.");

        Status = OrderStatus.Paid;
        AddDomainEvent(new OrderPaidDomainEvent(Id));
    }

    public void SetCancelledStatus()
    {
        if (Status == OrderStatus.Shipped)
            throw new OrderingDomainException("Cannot cancel a shipped order.");

        Status = OrderStatus.Cancelled;
        AddDomainEvent(new OrderCancelledDomainEvent(this));
    }

    public decimal GetTotal() => _orderItems.Sum(i => i.UnitPrice * i.Units);
}
```

## Enumeration Class (Smart Enum)

```csharp
public abstract class Enumeration : IComparable
{
    public string Name { get; }
    public int Id { get; }

    protected Enumeration(int id, string name) => (Id, Name) = (id, name);

    public override string ToString() => Name;

    public static IEnumerable<T> GetAll<T>() where T : Enumeration =>
        typeof(T).GetFields(BindingFlags.Public | BindingFlags.Static | BindingFlags.DeclaredOnly)
            .Select(f => f.GetValue(null))
            .Cast<T>();

    public int CompareTo(object? other) => Id.CompareTo(((Enumeration)other!).Id);
}

public sealed class OrderStatus : Enumeration
{
    public static readonly OrderStatus Submitted = new(1, nameof(Submitted));
    public static readonly OrderStatus AwaitingValidation = new(2, nameof(AwaitingValidation));
    public static readonly OrderStatus StockConfirmed = new(3, nameof(StockConfirmed));
    public static readonly OrderStatus Paid = new(4, nameof(Paid));
    public static readonly OrderStatus Shipped = new(5, nameof(Shipped));
    public static readonly OrderStatus Cancelled = new(6, nameof(Cancelled));

    private OrderStatus(int id, string name) : base(id, name) { }
}
```

## Domain Events

```csharp
// Domain event (using MediatR INotification)
public sealed record OrderStartedDomainEvent(Order Order, int BuyerId) : INotification;
public sealed record OrderPaidDomainEvent(int OrderId) : INotification;
public sealed record OrderShippedDomainEvent(Order Order) : INotification;

// Domain event handler
public sealed class OrderStartedDomainEventHandler(
    IBuyerRepository buyerRepo,
    ILogger<OrderStartedDomainEventHandler> logger)
    : INotificationHandler<OrderStartedDomainEvent>
{
    public async Task Handle(OrderStartedDomainEvent notification, CancellationToken ct)
    {
        logger.LogInformation("Order started for buyer {BuyerId}", notification.BuyerId);
        var buyer = await buyerRepo.FindAsync(notification.BuyerId, ct);
        if (buyer is null)
        {
            buyer = new Buyer(notification.BuyerId);
            buyerRepo.Add(buyer);
        }
        await buyerRepo.UnitOfWork.SaveEntitiesAsync(ct);
    }
}
```

## Repository Pattern (DDD Style)

```csharp
// Repository interface in DOMAIN layer (no EF Core dependency)
public interface IOrderRepository : IRepository<Order>
{
    Order Add(Order order);
    Order Update(Order order);
    Task<Order?> GetAsync(int orderId, CancellationToken ct = default);
}

public interface IRepository<T> where T : IAggregateRoot
{
    IUnitOfWork UnitOfWork { get; }
}

public interface IUnitOfWork : IDisposable
{
    Task<int> SaveChangesAsync(CancellationToken ct = default);
    Task<bool> SaveEntitiesAsync(CancellationToken ct = default);
}

// Implementation in INFRASTRUCTURE layer
public sealed class OrderRepository(OrderingContext context) : IOrderRepository
{
    public IUnitOfWork UnitOfWork => context;

    public Order Add(Order order) => context.Orders.Add(order).Entity;

    public Order Update(Order order) => context.Orders.Update(order).Entity;

    public async Task<Order?> GetAsync(int orderId, CancellationToken ct = default) =>
        await context.Orders
            .Include(o => o.OrderItems)
            .FirstOrDefaultAsync(o => o.Id == orderId, ct);
}
```

## CQRS with MediatR

```csharp
// Command
public sealed record CreateOrderCommand(
    int BuyerId,
    Address ShippingAddress,
    List<OrderItemDto> OrderItems) : IRequest<int>;

// Command Handler
public sealed class CreateOrderCommandHandler(
    IOrderRepository orderRepo,
    ILogger<CreateOrderCommandHandler> logger)
    : IRequestHandler<CreateOrderCommand, int>
{
    public async Task<int> Handle(CreateOrderCommand request, CancellationToken ct)
    {
        var order = new Order(request.BuyerId, request.ShippingAddress);

        foreach (var item in request.OrderItems)
        {
            order.AddOrderItem(item.ProductId, item.ProductName, item.UnitPrice, item.Units);
        }

        orderRepo.Add(order);
        await orderRepo.UnitOfWork.SaveEntitiesAsync(ct);

        logger.LogInformation("Order {OrderId} created for buyer {BuyerId}", order.Id, request.BuyerId);
        return order.Id;
    }
}

// Query (separate from commands)
public sealed record GetOrderByIdQuery(int OrderId) : IRequest<OrderDetailDto?>;

public sealed class GetOrderByIdQueryHandler(
    IReadOnlyRepository<Order> readRepo)
    : IRequestHandler<GetOrderByIdQuery, OrderDetailDto?>
{
    public async Task<OrderDetailDto?> Handle(GetOrderByIdQuery request, CancellationToken ct) =>
        await readRepo.Query<Order>()
            .AsNoTracking()
            .Where(o => o.Id == request.OrderId)
            .Select(o => new OrderDetailDto(
                o.Id, o.OrderDate, o.Status.Name,
                o.OrderItems.Select(i => new OrderItemDto(i.ProductName, i.UnitPrice, i.Units)).ToList(),
                o.GetTotal()))
            .FirstOrDefaultAsync(ct);
}

// API endpoint using MediatR
app.MapPost("/api/orders", async (CreateOrderCommand command, IMediator mediator, CancellationToken ct) =>
{
    var orderId = await mediator.Send(command, ct);
    return TypedResults.Created($"/api/orders/{orderId}", new { orderId });
});
```

## Domain Model Validation

```csharp
// Self-validating entities (invariants enforced in domain)
public sealed class OrderItem : Entity
{
    public int ProductId { get; private set; }
    public string ProductName { get; private set; }
    public decimal UnitPrice { get; private set; }
    public int Units { get; private set; }

    private OrderItem() { } // EF Core

    public OrderItem(int productId, string productName, decimal unitPrice, int units)
    {
        if (units <= 0) throw new OrderingDomainException("Invalid number of units");
        if (unitPrice < 0) throw new OrderingDomainException("Price cannot be negative");

        ProductId = productId;
        ProductName = productName ?? throw new ArgumentNullException(nameof(productName));
        UnitPrice = unitPrice;
        Units = units;
    }

    public void AddUnits(int units)
    {
        if (units <= 0) throw new OrderingDomainException("Invalid units");
        Units += units;
    }
}

// FluentValidation at application layer (for command validation)
public sealed class CreateOrderCommandValidator : AbstractValidator<CreateOrderCommand>
{
    public CreateOrderCommandValidator()
    {
        RuleFor(x => x.BuyerId).GreaterThan(0);
        RuleFor(x => x.ShippingAddress).NotNull();
        RuleFor(x => x.OrderItems).NotEmpty().WithMessage("Order must have at least one item");
        RuleForEach(x => x.OrderItems).ChildRules(item =>
        {
            item.RuleFor(i => i.ProductId).GreaterThan(0);
            item.RuleFor(i => i.Units).GreaterThan(0);
            item.RuleFor(i => i.UnitPrice).GreaterThanOrEqualTo(0);
        });
    }
}
```

## EF Core Mapping for DDD

```csharp
// Configure value objects as owned types
public sealed class OrderEntityTypeConfiguration : IEntityTypeConfiguration<Order>
{
    public void Configure(EntityTypeBuilder<Order> builder)
    {
        builder.ToTable("Orders");
        builder.HasKey(o => o.Id);
        builder.Ignore(o => o.DomainEvents);

        // Value object as owned type
        builder.OwnsOne(o => o.ShippingAddress, a =>
        {
            a.Property(p => p.Street).HasMaxLength(200).IsRequired();
            a.Property(p => p.City).HasMaxLength(100).IsRequired();
            a.Property(p => p.State).HasMaxLength(100);
            a.Property(p => p.Country).HasMaxLength(100).IsRequired();
            a.Property(p => p.ZipCode).HasMaxLength(20).IsRequired();
        });

        // Enumeration as value conversion
        builder.Property(o => o.Status)
            .HasConversion(
                s => s.Id,
                id => Enumeration.GetAll<OrderStatus>().Single(s => s.Id == id));

        // Private collection navigation
        var navigation = builder.Metadata.FindNavigation(nameof(Order.OrderItems))!;
        navigation.SetPropertyAccessMode(PropertyAccessMode.Field);

        builder.HasMany(o => o.OrderItems).WithOne().HasForeignKey("OrderId");
    }
}
```

## Dispatching Domain Events

```csharp
// DbContext dispatches domain events on SaveChanges
public sealed class OrderingContext : DbContext, IUnitOfWork
{
    private readonly IMediator _mediator;

    public OrderingContext(DbContextOptions<OrderingContext> options, IMediator mediator)
        : base(options)
    {
        _mediator = mediator;
    }

    public DbSet<Order> Orders => Set<Order>();

    public async Task<bool> SaveEntitiesAsync(CancellationToken ct = default)
    {
        // Dispatch domain events before saving (same transaction)
        await DispatchDomainEventsAsync(ct);
        await base.SaveChangesAsync(ct);
        return true;
    }

    private async Task DispatchDomainEventsAsync(CancellationToken ct)
    {
        var domainEntities = ChangeTracker
            .Entries<Entity>()
            .Where(x => x.Entity.DomainEvents.Count != 0)
            .ToList();

        var domainEvents = domainEntities
            .SelectMany(x => x.Entity.DomainEvents)
            .ToList();

        domainEntities.ForEach(entity => entity.Entity.ClearDomainEvents());

        foreach (var domainEvent in domainEvents)
        {
            await _mediator.Publish(domainEvent, ct);
        }
    }
}
```

## When to Use DDD vs CRUD

| Criteria | Simple CRUD | DDD/CQRS |
|----------|------------|-----------|
| Business rules | Few, simple | Complex, many invariants |
| Domain complexity | Low (data in/out) | High (behavior-rich) |
| Team size | 1-3 developers | 3+ developers |
| Expected changes | Stable requirements | Evolving business rules |
| Entities | Anemic (data bags) | Rich (behavior + data) |
| Validation | At API boundary only | Domain + application |

## Reference Documentation

- Domain model: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-domain-model
- Application layer: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/microservice-application-layer-web-api-design
- Domain events: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/domain-events-design-implementation
- EF Core persistence: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/infrastructure-persistence-layer-implementation-entity-framework-core
- Simplified CQRS: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/apply-simplified-microservice-cqrs-ddd-patterns
- DDD-oriented microservice: https://learn.microsoft.com/en-us/dotnet/architecture/microservices/microservice-ddd-cqrs-patterns/ddd-oriented-microservice
