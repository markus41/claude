---
name: blazor-performance
description: Blazor rendering optimization, virtualization, lazy loading, caching, and memory management
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
triggers:
  - blazor performance
  - blazor slow
  - rendering optimization
  - virtualize
  - lazy loading
  - blazor caching
---

# Blazor Performance Optimization

## Rendering Optimization

### Use @key for list rendering
```razor
@foreach (var item in Items)
{
    <ItemCard @key="item.Id" Item="@item" />
}
```

### Override ShouldRender
```csharp
private bool _shouldRender = true;
protected override bool ShouldRender() => _shouldRender;
```

### Virtualize large lists
```razor
<Virtualize Items="@_allItems" Context="item" ItemSize="50">
    <ItemRow Item="@item" />
</Virtualize>

@* With item provider for server-side paging *@
<Virtualize ItemsProvider="LoadItems" Context="item">
    <ItemRow Item="@item" />
</Virtualize>

@code {
    private async ValueTask<ItemsProviderResult<ItemDto>> LoadItems(
        ItemsProviderRequest request)
    {
        var result = await Service.GetPagedAsync(request.StartIndex, request.Count);
        return new ItemsProviderResult<ItemDto>(result.Items, result.TotalCount);
    }
}
```

### Streaming SSR for slow data
```razor
@attribute [StreamRendering]

@if (_data is null)
{
    <LoadingSpinner />
}
else
{
    <DataDisplay Data="@_data" />
}
```

## Caching Strategies

### Output Caching (API endpoints)
```csharp
app.MapGet("/api/products", async (AppDbContext db) =>
    await db.Products.AsNoTracking().ToListAsync())
    .CacheOutput(policy => policy.Expire(TimeSpan.FromMinutes(5)).Tag("products"));
```

### Distributed Cache (Redis)
```csharp
public sealed class CachedProductService(
    IProductRepository repo,
    IDistributedCache cache) : IProductService
{
    public async Task<ProductDto?> GetByIdAsync(int id, CancellationToken ct)
    {
        var cacheKey = $"product:{id}";
        var cached = await cache.GetStringAsync(cacheKey, ct);
        if (cached is not null)
            return JsonSerializer.Deserialize<ProductDto>(cached);

        var product = await repo.GetByIdAsync(id, ct);
        if (product is not null)
        {
            await cache.SetStringAsync(cacheKey,
                JsonSerializer.Serialize(product),
                new DistributedCacheEntryOptions { AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10) },
                ct);
        }
        return product;
    }
}
```

### Memory Cache for component state
```csharp
@inject IMemoryCache Cache

@code {
    protected override async Task OnInitializedAsync()
    {
        _categories = await Cache.GetOrCreateAsync("categories", async entry =>
        {
            entry.AbsoluteExpirationRelativeToNow = TimeSpan.FromHours(1);
            return await CategoryService.GetAllAsync();
        });
    }
}
```

## WASM Size Optimization

- Enable trimming: `<PublishTrimmed>true</PublishTrimmed>`
- Enable AOT compilation: `<RunAOTCompilation>true</RunAOTCompilation>`
- Use lazy assembly loading for rarely-used features
- Minimize NuGet packages in WASM project

## SignalR Connection (Blazor Server)

- Monitor circuit count with Aspire dashboard
- Set reasonable circuit timeout: `CircuitOptions.DisconnectedCircuitRetentionPeriod`
- Minimize state stored in circuit (use external state stores)
- Use `@rendermode InteractiveAuto` for high-traffic pages to offload to WASM
