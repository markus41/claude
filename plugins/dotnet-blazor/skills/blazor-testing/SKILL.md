---
name: blazor-testing
description: Testing Blazor apps with bUnit, xUnit, WebApplicationFactory, and integration testing patterns
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - blazor test
  - bunit
  - xunit
  - integration test
  - component test
  - test blazor
---

# Blazor Testing

## Test Project Setup

```bash
dotnet new xunit -n MyApp.Tests
dotnet add MyApp.Tests package bunit
dotnet add MyApp.Tests package FluentAssertions
dotnet add MyApp.Tests package NSubstitute
dotnet add MyApp.Tests package Microsoft.AspNetCore.Mvc.Testing
dotnet add MyApp.Tests package Testcontainers.PostgreSql  # For real DB tests
```

## bUnit Component Tests

```csharp
public sealed class CounterTests : TestContext
{
    [Fact]
    public void Counter_StartsAtZero()
    {
        var cut = RenderComponent<Counter>();
        cut.Find("p").TextContent.Should().Contain("0");
    }

    [Fact]
    public void Counter_IncrementsOnClick()
    {
        var cut = RenderComponent<Counter>();
        cut.Find("button").Click();
        cut.Find("p").TextContent.Should().Contain("1");
    }
}
```

### Testing with Parameters and Services
```csharp
public sealed class ProductListTests : TestContext
{
    [Fact]
    public async Task Should_Display_Products()
    {
        var mockService = Substitute.For<IProductService>();
        mockService.GetAllAsync(Arg.Any<CancellationToken>())
            .Returns(new List<ProductDto>
            {
                new(1, "Widget", 9.99m),
                new(2, "Gadget", 19.99m)
            });
        Services.AddSingleton(mockService);

        var cut = RenderComponent<ProductList>();
        cut.WaitForState(() => cut.FindAll(".product-card").Count > 0);

        cut.FindAll(".product-card").Should().HaveCount(2);
        cut.Markup.Should().Contain("Widget");
    }
}
```

### Testing Forms
```csharp
[Fact]
public void Form_Validates_Required_Fields()
{
    var cut = RenderComponent<CreateProductForm>();

    cut.Find("form").Submit();

    cut.FindAll(".validation-message").Should().NotBeEmpty();
}

[Fact]
public void Form_Submits_Valid_Data()
{
    var mockService = Substitute.For<IProductService>();
    Services.AddSingleton(mockService);

    var cut = RenderComponent<CreateProductForm>();
    cut.Find("#name").Change("New Product");
    cut.Find("#price").Change("29.99");
    cut.Find("form").Submit();

    mockService.Received(1).CreateAsync(
        Arg.Is<CreateProductRequest>(r => r.Name == "New Product"),
        Arg.Any<CancellationToken>());
}
```

## API Integration Tests

```csharp
public sealed class ProductApiTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;

    public ProductApiTests(WebApplicationFactory<Program> factory)
    {
        _client = factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                services.RemoveAll<AppDbContext>();
                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseInMemoryDatabase($"Test-{Guid.NewGuid()}"));
            });
        }).CreateClient();
    }

    [Fact]
    public async Task GetProducts_ReturnsOk()
    {
        var response = await _client.GetAsync("/api/products");
        response.StatusCode.Should().Be(HttpStatusCode.OK);
    }

    [Theory]
    [InlineData("", HttpStatusCode.BadRequest)]
    [InlineData("Valid Name", HttpStatusCode.Created)]
    public async Task CreateProduct_ValidatesInput(string name, HttpStatusCode expected)
    {
        var response = await _client.PostAsJsonAsync("/api/products",
            new { Name = name, Price = 10.0 });
        response.StatusCode.Should().Be(expected);
    }
}
```

## Test with Real Database (Testcontainers)

```csharp
public sealed class ProductDbTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("postgres:16")
        .Build();

    public async Task InitializeAsync() => await _postgres.StartAsync();
    public async Task DisposeAsync() => await _postgres.DisposeAsync();

    [Fact]
    public async Task Can_Create_And_Read_Product()
    {
        var options = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql(_postgres.GetConnectionString())
            .Options;

        await using var db = new AppDbContext(options);
        await db.Database.EnsureCreatedAsync();

        db.Products.Add(new Product { Name = "Test", Price = 9.99m });
        await db.SaveChangesAsync();

        var product = await db.Products.FirstAsync();
        product.Name.Should().Be("Test");
    }
}
```
