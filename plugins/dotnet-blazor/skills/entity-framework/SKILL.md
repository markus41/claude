---
name: entity-framework
description: Entity Framework Core patterns for data access, migrations, relationships, performance, and best practices
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - entity framework
  - ef core
  - dbcontext
  - migration
  - database
  - linq query
  - data access
---

# Entity Framework Core

## DbContext Setup

```csharp
public sealed class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Product> Products => Set<Product>();
    public DbSet<Order> Orders => Set<Order>();
    public DbSet<Customer> Customers => Set<Customer>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.ApplyConfigurationsFromAssembly(typeof(AppDbContext).Assembly);
    }
}
```

## Entity Configuration (Fluent API)

```csharp
public sealed class ProductConfiguration : IEntityTypeConfiguration<Product>
{
    public void Configure(EntityTypeBuilder<Product> builder)
    {
        builder.HasKey(p => p.Id);
        builder.Property(p => p.Name).HasMaxLength(200).IsRequired();
        builder.Property(p => p.Price).HasPrecision(18, 2);
        builder.Property(p => p.Sku).HasMaxLength(50);
        builder.HasIndex(p => p.Sku).IsUnique();

        builder.HasOne(p => p.Category)
            .WithMany(c => c.Products)
            .HasForeignKey(p => p.CategoryId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasMany(p => p.Tags)
            .WithMany(t => t.Products)
            .UsingEntity(j => j.ToTable("ProductTags"));
    }
}
```

## Migrations

```bash
# Add migration
dotnet ef migrations add InitialCreate --project Data --startup-project Web

# Update database
dotnet ef database update --project Data --startup-project Web

# Generate SQL script
dotnet ef migrations script --idempotent --project Data --startup-project Web

# Remove last migration (if not applied)
dotnet ef migrations remove --project Data --startup-project Web
```

## Query Patterns

### Basic CRUD
```csharp
// Read (always use async, use AsNoTracking for reads)
var products = await db.Products
    .AsNoTracking()
    .Where(p => p.IsActive)
    .OrderBy(p => p.Name)
    .ToListAsync(ct);

// Read with projection (best performance)
var dtos = await db.Products
    .AsNoTracking()
    .Where(p => p.IsActive)
    .Select(p => new ProductDto(p.Id, p.Name, p.Price))
    .ToListAsync(ct);

// Create
db.Products.Add(new Product { Name = "New", Price = 9.99m });
await db.SaveChangesAsync(ct);

// Update
var product = await db.Products.FindAsync([id], ct);
if (product is not null)
{
    product.Price = newPrice;
    await db.SaveChangesAsync(ct);
}

// Delete
var product = await db.Products.FindAsync([id], ct);
if (product is not null)
{
    db.Products.Remove(product);
    await db.SaveChangesAsync(ct);
}
```

### Eager Loading
```csharp
var orders = await db.Orders
    .Include(o => o.Customer)
    .Include(o => o.Items)
        .ThenInclude(i => i.Product)
    .AsSplitQuery() // Prevents cartesian explosion
    .ToListAsync(ct);
```

### Compiled Queries (hot paths)
```csharp
private static readonly Func<AppDbContext, int, CancellationToken, Task<Product?>> GetProductById =
    EF.CompileAsyncQuery((AppDbContext db, int id, CancellationToken ct) =>
        db.Products.FirstOrDefault(p => p.Id == id));

// Usage
var product = await GetProductById(db, id, ct);
```

### Bulk Operations (.NET 10)
```csharp
// Bulk update without loading entities
await db.Products
    .Where(p => p.CategoryId == oldCategoryId)
    .ExecuteUpdateAsync(s => s.SetProperty(p => p.CategoryId, newCategoryId), ct);

// Bulk delete
await db.Products
    .Where(p => p.IsDeleted && p.DeletedAt < cutoff)
    .ExecuteDeleteAsync(ct);
```

## Performance Tips

- Always use `AsNoTracking()` for read-only queries
- Use `Select()` projection to only load needed columns
- Use `AsSplitQuery()` for multiple includes
- Add indexes for frequently queried columns
- Use `ExecuteUpdateAsync`/`ExecuteDeleteAsync` for bulk operations
- Use compiled queries for frequently executed queries
- Never call `ToList()` before `Where()` (loads entire table)
- Use `IQueryable` in repositories, materialize in services
