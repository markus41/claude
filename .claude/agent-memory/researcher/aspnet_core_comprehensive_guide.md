---
name: ASP.NET Core 10.0 Comprehensive Reference
description: Complete guide covering best practices, security, localization, hosting/deployment, model binding, and API design patterns for ASP.NET Core 10.0
type: reference
---

# ASP.NET Core 10.0 Comprehensive Reference
**Date**: 2026-03-29
**Scope**: .NET 10.0 with full code examples and patterns
**Focus**: Production-grade guidance with complete implementations

---

## 1. ASP.NET Core Best Practices

### Performance Fundamentals

#### Key Rules and Patterns

- **Cache aggressively** - Critical for hot code paths and frequently accessed data
- **Avoid blocking calls** - Use async/await exclusively; never use `Task.Wait()` or `Task.Result`
- **Never use `Task.Run()` then await** - ASP.NET Core already executes on thread pool threads
- **Make all hot code paths asynchronous** - Entire call stack benefits from async patterns
- **Use pagination for collections** - Never return unlimited results; prevent OOM and thread starvation
- **Minimize large object allocations** - Objects >= 85,000 bytes go to LOH (Large Object Heap), triggering Gen2 GC
- **Pool buffers with `ArrayPool<T>`** - Reuse large buffers instead of allocating new ones
- **Optimize data access first** - Database/remote calls are slowest part of apps
- **Use `HttpClientFactory`** - Never create/dispose `HttpClient` instances directly
- **Complete long-running tasks outside HTTP requests** - Use background services or message brokers
- **Minify and compress client assets** - Bundle and minify JavaScript/CSS; enable response compression
- **Use latest ASP.NET Core release** - Each version includes significant performance improvements

#### Hot Code Path Examples

```csharp
// BAD: Blocking call in hot path
public class BadController : Controller
{
    [HttpGet("/data")]
    public IActionResult GetData()
    {
        var json = new StreamReader(Request.Body).ReadToEnd();  // BLOCKS
        return Ok(JsonSerializer.Deserialize<MyData>(json));
    }
}

// GOOD: Async throughout
public class GoodController : Controller
{
    [HttpGet("/data")]
    public async Task<IActionResult> GetData()
    {
        var data = await JsonSerializer.DeserializeAsync<MyData>(Request.Body);
        return Ok(data);
    }
}
```

#### Pagination Pattern

```csharp
// BAD: Returns all results
public async Task<IActionResult> GetAllUsers()
{
    var users = await _db.Users.ToListAsync();  // OOM on large datasets
    return Ok(users);
}

// GOOD: Paginated results
public async Task<IActionResult> GetUsers(int pageNumber = 1, int pageSize = 20)
{
    var users = await _db.Users
        .Skip((pageNumber - 1) * pageSize)
        .Take(pageSize)
        .ToListAsync();

    var total = await _db.Users.CountAsync();

    return Ok(new { users, pageNumber, pageSize, totalCount = total });
}
```

#### Large Object Handling

```csharp
// BAD: Reads entire request into memory
public async Task<IActionResult> ProcessFile()
{
    var json = await new StreamReader(Request.Body).ReadToEndAsync();  // LOH allocation
    return Ok(JsonSerializer.Deserialize<LargeObject>(json));
}

// GOOD: Streams without full buffering
public async Task<IActionResult> ProcessFile()
{
    return Ok(await JsonSerializer.DeserializeAsync<LargeObject>(Request.Body));
}

// GOOD: Use ArrayPool for buffer reuse
using var buffer = ArrayPool<byte>.Shared.Rent(4096);
try
{
    int bytesRead;
    while ((bytesRead = await Request.Body.ReadAsync(buffer, 0, buffer.Length)) > 0)
    {
        // Process buffer
    }
}
finally
{
    ArrayPool<byte>.Shared.Return(buffer);
}
```

### IAsyncEnumerable Pattern

```csharp
// BAD: Synchronous enumeration blocks threads
public IEnumerable<Product> GetProducts()
{
    return _db.Products;  // Sync enumeration causes thread pool starvation
}

// GOOD: Async enumeration with streaming
public async IAsyncEnumerable<Product> GetProductsAsync()
{
    var products = _db.Products.AsAsyncEnumerable();
    await foreach (var product in products)
    {
        yield return product;
    }
}

// GOOD: Convert to list if full collection needed
public async Task<IActionResult> GetProducts()
{
    var products = await _db.Products.ToListAsync();  // Convert to list first
    return Ok(products);
}
```

### HttpContext Safety Patterns

#### Wrong: Storing HttpContext

```csharp
// WRONG: Stores HttpContext in field, captured in background task
public class BadDependency
{
    private readonly HttpContext _context;

    public BadDependency(IHttpContextAccessor accessor)
    {
        _context = accessor.HttpContext;  // Captured at wrong time
    }

    public void CheckAdmin()
    {
        if (!_context.User.IsInRole("admin"))  // Null or wrong context
            throw new UnauthorizedAccessException();
    }
}

// WRONG: Fire-and-forget with HttpContext
[HttpGet("/fire-and-forget")]
public IActionResult BadFireAndForget()
{
    _ = Task.Run(async () =>
    {
        await Task.Delay(1000);
        var path = HttpContext.Request.Path;  // WRONG: HttpContext recycled
        Log(path);
    });

    return Accepted();
}
```

#### Correct: Copy Data Before Background Work

```csharp
// CORRECT: Store IHttpContextAccessor, access within request scope
public class GoodDependency
{
    private readonly IHttpContextAccessor _accessor;

    public GoodDependency(IHttpContextAccessor accessor)
    {
        _accessor = accessor;
    }

    public void CheckAdmin()
    {
        var context = _accessor.HttpContext;
        if (context != null && !context.User.IsInRole("admin"))
            throw new UnauthorizedAccessException();
    }
}

// CORRECT: Copy data before background task
[HttpGet("/fire-and-forget")]
public IActionResult GoodFireAndForget()
{
    string path = HttpContext.Request.Path;  // Copy BEFORE background work
    _ = Task.Run(async () =>
    {
        await Task.Delay(1000);
        Log(path);  // Uses copied value
    });

    return Accepted();
}

// CORRECT: Use IServiceScopeFactory for background DB work
[HttpGet("/background-db")]
public IActionResult BackgroundDatabaseWork([FromServices] IServiceScopeFactory factory)
{
    _ = Task.Run(async () =>
    {
        await Task.Delay(1000);

        // Create NEW scope for background operation
        await using var scope = factory.CreateAsyncScope();
        var dbContext = scope.ServiceProvider.GetRequiredService<MyDbContext>();

        dbContext.Items.Add(new Item { Name = "Test" });
        await dbContext.SaveChangesAsync();  // Uses scoped context
    });

    return Accepted();
}
```

### Response Headers Management

```csharp
// BAD: Try to set headers after response started
app.Use(async (context, next) =>
{
    await next();

    context.Response.Headers["test"] = "value";  // CRASHES if response started
});

// GOOD: Check if response started
app.Use(async (context, next) =>
{
    await next();

    if (!context.Response.HasStarted)
    {
        context.Response.Headers["test"] = "value";
    }
});

// BEST: Use OnStarting callback
app.Use(async (context, next) =>
{
    context.Response.OnStarting(() =>
    {
        context.Response.Headers["someheader"] = "somevalue";
        return Task.CompletedTask;
    });

    await next();
});
```

### Async Void Anti-Pattern

```csharp
// WRONG: Uses async void - request completes at first await
public class BadController : Controller
{
    [HttpGet("/async")]
    public async void Get()  // async void - BAD
    {
        await Task.Delay(1000);
        await Response.WriteAsync("Hello World");  // CRASHES: HttpContext recycled
    }
}

// CORRECT: Return Task
public class GoodController : Controller
{
    [HttpGet("/async")]
    public async Task Get()  // Return Task
    {
        await Task.Delay(1000);
        await Response.WriteAsync("Hello World");  // Safe: request still active
    }
}
```

### Form Data Handling

```csharp
// BAD: Uses HttpContext.Request.Form (sync over async)
public class BadFormController : Controller
{
    [HttpPost("/form")]
    public IActionResult Post()
    {
        var form = HttpContext.Request.Form;  // Sync enumeration
        ProcessForm(form["id"], form["name"]);
        return Accepted();
    }
}

// GOOD: Use ReadFormAsync
public class GoodFormController : Controller
{
    [HttpPost("/form")]
    public async Task<IActionResult> Post()
    {
        var form = await HttpContext.Request.ReadFormAsync();  // Async read
        ProcessForm(form["id"], form["name"]);
        return Accepted();
    }
}
```

### Content-Length Null Handling

```csharp
// WRONG: Assumes ContentLength is never null
if (Request.ContentLength > 1024)  // Returns false when null - BUG!
{
    return BadRequest("File too large");
}

// CORRECT: Check for null explicitly
if (Request.ContentLength is null or > 1024)
{
    return BadRequest("File too large");
}

// SAFE: Always handle null case
long maxSize = 1024 * 1024;
if (Request.ContentLength.HasValue && Request.ContentLength > maxSize)
{
    return BadRequest("File too large");
}
```

---

## 2. Security in ASP.NET Core

### Authentication vs. Authorization

**Authentication**: Verifying user identity (who they are)
**Authorization**: Granting permissions based on identity (what they can do)

### Secure Authentication Flows

#### Best Practice: Managed Identities

```csharp
// RECOMMENDED: Use managed identities (Azure services)
var tokenProvider = new ChainedTokenCredential(
    new ManagedIdentityCredential(),
    new EnvironmentCredential());

// For Azure SQL
var connection = new SqlConnection
{
    ConnectionString = "Server=myserver.database.windows.net;Database=mydb"
};
var token = await tokenProvider.GetTokenAsync(
    new TokenRequestContext(new[] { "https://database.windows.net/.default" }));
connection.AccessToken = token.Token;
```

#### Never Do This: Resource Owner Password Credentials

```csharp
// NEVER USE: Exposes user password to client
// This is a significant security risk:
var client = new HttpClient();
var request = new HttpRequestMessage(HttpMethod.Post, "https://auth-server/token")
{
    Content = new FormUrlEncodedContent(new[]
    {
        new KeyValuePair<string, string>("grant_type", "password"),
        new KeyValuePair<string, string>("username", userEmail),
        new KeyValuePair<string, string>("password", userPassword),  // NEVER
        new KeyValuePair<string, string>("client_id", clientId)
    })
};
```

### Secrets Management

```csharp
// BAD: Never store secrets in configuration
var connectionString = Configuration["ConnectionStrings:Database"];  // Plain text risk

// GOOD: Use Secret Manager in development
// dotnet user-secrets init
// dotnet user-secrets set "ConnectionStrings:Database" "Server=..."

// GOOD: Use Azure Key Vault in production
builder.Configuration.AddAzureKeyVault(
    new Uri($"https://{keyVaultName}.vault.azure.net/"),
    new DefaultAzureCredential());
```

### Common Vulnerabilities

#### 1. Cross-Site Scripting (XSS)

```csharp
// BAD: User input rendered as HTML
public IActionResult Display(string userInput)
{
    return Ok($"<div>{userInput}</div>");  // XSS vulnerability
}

// GOOD: HTML encode user input
public IActionResult Display(string userInput)
{
    var encoded = System.Net.WebUtility.HtmlEncode(userInput);
    return Ok($"<div>{encoded}</div>");
}

// GOOD: Razor automatically encodes
@{ var userInput = ViewBag.Input; }
<div>@userInput</div>  // Automatically encoded by Razor
```

#### 2. SQL Injection

```csharp
// BAD: String concatenation
var query = $"SELECT * FROM Users WHERE Email = '{userEmail}'";  // SQL injection
var users = await _db.Users.FromSqlRaw(query).ToListAsync();

// GOOD: Parameterized queries
var users = await _db.Users
    .Where(u => u.Email == userEmail)
    .ToListAsync();

// GOOD: Explicit parameters
var users = await _db.Users
    .FromSqlInterpolated($"SELECT * FROM Users WHERE Email = {userEmail}")
    .ToListAsync();
```

#### 3. Cross-Site Request Forgery (CSRF/XSRF)

```csharp
// GOOD: Enable CSRF protection automatically
builder.Services.AddAntiforgery(options =>
{
    options.HeaderName = "X-CSRF-TOKEN";
});

// In HTML forms:
// <form method="post">
//     @Html.AntiForgeryToken()
//     ...
// </form>

// In AJAX requests:
var token = document.querySelector('input[name="__RequestVerificationToken"]').value;
fetch('/api/endpoint', {
    method: 'POST',
    headers: {
        'X-CSRF-TOKEN': token
    }
});
```

#### 4. Open Redirect Attacks

```csharp
// BAD: Trusts user-provided redirect URL
public IActionResult RedirectToReturnUrl(string returnUrl)
{
    return Redirect(returnUrl);  // User could redirect to malicious site
}

// GOOD: Validate URL is local
public IActionResult RedirectToReturnUrl(string returnUrl)
{
    if (!Url.IsLocalUrl(returnUrl))
    {
        return RedirectToPage("./Index");
    }

    return Redirect(returnUrl);
}

// GOOD: Use URL validation helper
if (!Uri.TryCreate(returnUrl, UriKind.Relative, out var uri))
{
    return RedirectToPage("./Index");
}

return Redirect(returnUrl);
```

---

## 3. Localization and Globalization

### Core Concepts

| Term | Definition |
|------|-----------|
| **Globalization (G11N)** | Making app support different languages/regions |
| **Localization (L10N)** | Customizing globalized app for specific language/region |
| **Internationalization (I18N)** | Both globalization + localization |
| **Culture** | Language + optionally region (e.g., "en-US", "fr") |
| **Neutral Culture** | Language only (e.g., "en", "es") |
| **Specific Culture** | Language + region (e.g., "en-US", "es-CL") |

### Setup

```csharp
// Program.cs: Configure localization services
builder.Services.AddLocalization(options =>
{
    options.ResourcesPath = "Resources";  // Set resource path
});

builder.Services.AddMvc()
    .AddViewLocalization(LanguageViewLocationExpanderFormat.Suffix)  // View localization
    .AddDataAnnotationsLocalization();  // Validation message localization

// Configure middleware (MUST be before routing middleware)
var supportedCultures = new[] { "en-US", "fr", "es" };
var localizationOptions = new RequestLocalizationOptions()
    .SetDefaultCulture(supportedCultures[0])
    .AddSupportedCultures(supportedCultures)
    .AddSupportedUICultures(supportedCultures);

app.UseRequestLocalization(localizationOptions);
```

### IStringLocalizer Usage

```csharp
// In controller
using Microsoft.Extensions.Localization;

public class AboutController : Controller
{
    private readonly IStringLocalizer<AboutController> _localizer;

    public AboutController(IStringLocalizer<AboutController> localizer)
    {
        _localizer = localizer;
    }

    [HttpGet]
    public string Get()
    {
        return _localizer["About Title"];  // Returns localized string
    }
}

// In Razor view
@using Microsoft.AspNetCore.Mvc.Localization
@inject IViewLocalizer Localizer

<h2>@Localizer["About"]</h2>
<p>@Localizer["Use this area to provide additional information."]</p>

// With HTML content (IHtmlLocalizer)
@inject IHtmlLocalizer<BookController> HtmlLocalizer

<div>@HtmlLocalizer["<b>Hello</b> {0}!", userName]</div>
```

### Resource File Naming

Resource files use the pattern: `{Type}.{Culture}.resx`

```
Resources/
  Controllers.HomeController.fr.resx     (Dot naming)
  Controllers/HomeController.fr.resx     (Path naming)
  Views/Home/About.fr.resx               (View resources)
```

```csharp
// With ResourcesPath = "Resources":
Resources/Controllers.HomeController.fr.resx
Resources/Controllers/HomeController.fr.resx

// French resource file (Welcome.fr.resx):
// | Key        | Value          |
// |------------|----------------|
// | Hello      | Bonjour        |
// | Goodbye    | Au revoir      |
```

### Culture Selection (Priority Order)

1. **QueryString**: `?culture=fr&ui-culture=fr`
2. **Cookie**: `.AspNetCore.Culture` (default name)
3. **Accept-Language HTTP Header** (from browser)
4. **DefaultRequestCulture** (fallback)

```csharp
// Query string usage
var url = "http://localhost:5000/?culture=fr-CA&ui-culture=fr-CA";

// Set culture via cookie
public IActionResult SetLanguage(string culture, string returnUrl)
{
    Response.Cookies.Append(
        CookieRequestCultureProvider.DefaultCookieName,
        CookieRequestCultureProvider.MakeCookieValue(new RequestCulture(culture)),
        new CookieOptions { Expires = DateTimeOffset.UtcNow.AddYears(1) });

    return LocalRedirect(returnUrl);
}

// Custom culture provider
private const string DefaultCulture = "en-US";

services.Configure<RequestLocalizationOptions>(options =>
{
    options.DefaultRequestCulture = new RequestCulture(culture: DefaultCulture,
                                                       uiCulture: DefaultCulture);
    options.SupportedCultures = new[] { new CultureInfo(DefaultCulture),
                                        new CultureInfo("fr") };
    options.SupportedUICultures = options.SupportedCultures;

    options.AddInitialRequestCultureProvider(new CustomRequestCultureProvider(
        async context =>
    {
        // Custom logic: check database, user preferences, etc.
        return await Task.FromResult(new ProviderCultureResult("en"));
    }));
});
```

### Culture Fallback

When a resource is not found, localization searches parent cultures:

```
Requested: fr-CA
Looks for: Welcome.fr-CA.resx
Not found, fallback to: Welcome.fr.resx
Not found, fallback to: Welcome.resx (default)
```

### DataAnnotations Localization

```csharp
public class RegisterViewModel
{
    [Required(ErrorMessage = "The Email field is required.")]
    [EmailAddress(ErrorMessage = "The Email field is not a valid email address.")]
    [Display(Name = "Email")]
    public string Email { get; set; }

    [Required(ErrorMessage = "The Password field is required.")]
    [StringLength(8, ErrorMessage = "The {0} must be at least {2} characters long.",
                  MinimumLength = 6)]
    [DataType(DataType.Password)]
    [Display(Name = "Password")]
    public string Password { get; set; }
}

// Create resource files:
// Resources/ViewModels.Account.RegisterViewModel.fr.resx
// Resources/ViewModels/Account/RegisterViewModel.fr.resx

// Configure shared validation messages
services.AddMvc()
    .AddDataAnnotationsLocalization(options =>
    {
        options.DataAnnotationLocalizerProvider = (type, factory) =>
            factory.Create(typeof(SharedResource));  // All validations use SharedResource
    });
```

---

## 4. Hosting and Deployment

### Publish Process

```csharp
// Publish with dotnet CLI
// dotnet publish -c Release -o ./publish

// Publish settings files (custom XML, JSON, etc.)
// In project file:
//<ItemGroup>
//  <Content Include="**\*.xml"
//    Exclude="bin\**\*;obj\**\*"
//    CopyToOutputDirectory="PreserveNewest" />
//</ItemGroup>
```

### Publish Folder Contents

- App assembly files (`.dll`)
- Dependencies (NuGet packages)
- .NET runtime (if self-contained)
- Configuration files (`appsettings.json`, `web.config`)
- Static assets (CSS, JavaScript, images)
- MVC views (`.cshtml`)

### Self-Contained vs. Framework-Dependent

```bash
# Self-contained: Includes .NET runtime
dotnet publish -c Release --self-contained --runtime win-x64

# Framework-dependent: Requires .NET installed on server (default)
dotnet publish -c Release
```

### Process Manager Setup

#### Windows: IIS

```xml
<!-- web.config for IIS -->
<configuration>
  <system.webServer>
    <aspNetCore processPath="dotnet"
                arguments=".\MyApp.dll"
                forwardWindowsAuthToken="false" />
  </system.webServer>
</configuration>
```

#### Windows: Windows Service

```csharp
builder.Services.AddWindowsService();

// Register as service:
// sc create MyService binPath= "C:\path\to\MyApp.exe"
```

#### Linux: Systemd

```ini
[Unit]
Description=My ASP.NET Core App
After=network.target

[Service]
Type=notify
User=www-data
WorkingDirectory=/var/www/myapp
ExecStart=/usr/bin/dotnet /var/www/myapp/MyApp.dll
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

### Reverse Proxy Configuration

#### Nginx Example

```nginx
server {
    listen 80;
    server_name example.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Configure App to Work Behind Proxy

```csharp
// Program.cs
builder.Services.Configure<ForwardedHeadersOptions>(options =>
{
    options.ForwardedHeaders = ForwardedHeaders.XForwardedFor |
                               ForwardedHeaders.XForwardedProto;
    // Restrict to known proxies in production
    options.KnownNetworks.Add(new IPNetwork(IPAddress.Parse("10.0.0.0"), 8));
});

app.UseForwardedHeaders();
```

### Deployment with MSBuild/Visual Studio

```xml
<!-- Visual Studio Publish Profile (.pubxml) -->
<Project>
  <PropertyGroup>
    <PublishURL>ftp://example.com/</PublishURL>
    <DeleteExistingFiles>true</DeleteExistingFiles>
    <TargetFramework>net10.0</TargetFramework>
    <Configuration>Release</Configuration>
  </PropertyGroup>
</Project>
```

### Health Checks

```csharp
// Program.cs
builder.Services.AddHealthChecks()
    .AddCheck<CustomHealthCheck>("custom")
    .AddDbContextCheck<MyDbContext>();

var app = builder.Build();
app.MapHealthChecks("/health");

// Custom health check
public class CustomHealthCheck : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        var healthy = await PerformCheck();
        return healthy
            ? HealthCheckResult.Healthy()
            : HealthCheckResult.Unhealthy("Service unavailable");
    }

    private async Task<bool> PerformCheck()
    {
        // Implementation
        return true;
    }
}
```

---

## 5. Model Binding

### Binding Sources (Priority Order)

1. Form fields
2. Request body (for `[ApiController]`)
3. Route data
4. Query string parameters
5. Uploaded files

### Source-Specific Attributes

```csharp
public class UserBindingModel
{
    [FromRoute]  // From URL route
    public int Id { get; set; }

    [FromQuery]  // From query string (?searchTerm=...)
    public string SearchTerm { get; set; }

    [FromForm]   // From form fields
    public string FullName { get; set; }

    [FromBody]   // From request body (JSON)
    public Address Address { get; set; }

    [FromHeader(Name = "Accept-Language")]
    public string Language { get; set; }

    [FromServices]  // From dependency injection
    public ILogger<UserBindingModel> Logger { get; set; }
}

// Usage in action
public async Task<IActionResult> UpdateUser(
    [FromRoute] int id,
    [FromBody] User user,
    [FromServices] IUserService userService)
{
    await userService.UpdateAsync(id, user);
    return Ok();
}
```

### Property-Level Binding Attributes

```csharp
// [BindProperty] - Targets single property
public class EditModel : PageModel
{
    [BindProperty]
    public Instructor Instructor { get; set; }

    [BindProperty(SupportsGet = true)]
    public string Filter { get; set; }  // Enable for GET requests
}

// [BindProperties] - Targets all public properties
[BindProperties]
public class CreateModel : PageModel
{
    public Instructor Instructor { get; set; }
    public string Department { get; set; }
}

// [Bind] - Specify which properties to include
[Bind("LastName,FirstName,HireDate")]
public class Instructor
{
    public int Id { get; set; }  // Not bound
    public string LastName { get; set; }  // Bound
    public string FirstName { get; set; }  // Bound
    public DateTime HireDate { get; set; }  // Bound
}

// [BindRequired] - Adds model state error if binding fails
public class InstructorRequired
{
    [BindRequired]
    public DateTime HireDate { get; set; }
}

// [BindNever] - Prevents binding
public class InstructorNever
{
    [BindNever]
    public int Id { get; set; }  // Cannot be bound from request
}

// [ModelBinder] - Custom binder or change binding name
public class Instructor
{
    [ModelBinder(Name = "instructor_id")]
    public int Id { get; set; }  // Binds from "instructor_id" instead of "id"
}
```

### Complex Type Binding

```csharp
// Model
public class Instructor
{
    public int Id { get; set; }
    public string LastName { get; set; }
    public string FirstName { get; set; }
}

// Controller
public IActionResult OnPost(int? id, Instructor instructorToUpdate)
{
    // Binding looks for: instructorToUpdate.Id, instructorToUpdate.LastName, etc.
    // Form data: instructorToUpdate.Id=1&instructorToUpdate.LastName=Smith
}

// Custom prefix
public IActionResult OnPost(
    int? id,
    [Bind(Prefix = "Instructor")] Instructor instructorToUpdate)
{
    // Now looks for: Instructor.Id=1&Instructor.LastName=Smith
}

// Important: [FromBody] ignores other binding source attributes
public ActionResult<Pet> Create([FromBody] Pet pet)
{
    // Only request body is used, [FromQuery], [FromForm] on nested properties IGNORED
}

public class Pet
{
    public string Name { get; set; }

    [FromQuery]  // IGNORED when parent has [FromBody]
    public string Breed { get; set; }
}
```

### Collections Binding

```csharp
// Array binding
public IActionResult OnPost(int? id, int[] selectedCourses)
{
    // Multiple formats supported:
    // selectedCourses=1050&selectedCourses=2000
    // selectedCourses[0]=1050&selectedCourses[1]=2000
    // [0]=1050&[1]=2000
    // selectedCourses[]=1050&selectedCourses[]=2000 (form data only)
}

// Dictionary binding
public IActionResult OnPost(Dictionary<int, string> selectedCourses)
{
    // selectedCourses[1050]=Chemistry&selectedCourses[2000]=Economics
    // selectedCourses[0].Key=1050&selectedCourses[0].Value=Chemistry&selectedCourses[1].Key=2000&selectedCourses[1].Value=Economics
}
```

### Simple Type Conversion with IParsable<T>

```csharp
// Custom type implementing IParsable<T>
public class DateRange : IParsable<DateRange>
{
    public DateOnly? From { get; init; }
    public DateOnly? To { get; init; }

    public static DateRange Parse(string value, IFormatProvider? provider)
    {
        if (!TryParse(value, provider, out var result))
            throw new ArgumentException("Invalid format", nameof(value));
        return result;
    }

    public static bool TryParse(string? value, IFormatProvider? provider,
                                out DateRange dateRange)
    {
        var segments = value?.Split(',', StringSplitOptions.RemoveEmptyEntries
                                         | StringSplitOptions.TrimEntries);

        if (segments?.Length == 2
            && DateOnly.TryParse(segments[0], provider, out var fromDate)
            && DateOnly.TryParse(segments[1], provider, out var toDate))
        {
            dateRange = new DateRange { From = fromDate, To = toDate };
            return true;
        }

        dateRange = new DateRange { From = default, To = default };
        return false;
    }
}

// Usage
public IActionResult ByRange([FromQuery] DateRange range)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);

    return Ok(range);
}
```

### Record Type Binding

```csharp
// Binding metadata goes on PARAMETERS, not properties
public record Person(
    [Required] string Name,
    [Range(0, 150)] int Age,
    [BindNever] int Id);

public class PersonController
{
    [HttpPost]
    public IActionResult Create(Person person)
    {
        // Metadata on parameters is used
        // Properties metadata is IGNORED
    }
}

// Important: TryUpdateModel does not update primary constructor parameters
public record Person(string Name)
{
    public int Age { get; set; }
}

var person = new Person("initial-name");
await TryUpdateModelAsync(person, ...);
// Name will NOT be re-bound, but Age WILL be updated
```

### JSON Configuration

```csharp
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
        options.JsonSerializerOptions.Converters.Add(new JsonStringEnumConverter());
        options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
        options.JsonSerializerOptions.WriteIndented = true;
    });
```

### Custom JsonConverter

```csharp
[JsonConverter(typeof(ObjectIdConverter))]
public record ObjectId(int Id);

internal class ObjectIdConverter : JsonConverter<ObjectId>
{
    public override ObjectId Read(
        ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        return new(JsonSerializer.Deserialize<int>(ref reader, options));
    }

    public override void Write(
        Utf8JsonWriter writer, ObjectId value, JsonSerializerOptions options)
    {
        writer.WriteNumberValue(value.Id);
    }
}
```

### Manual Model Binding

```csharp
public async Task<IActionResult> OnPostAsync()
{
    var newInstructor = new Instructor();

    if (await TryUpdateModelAsync(
        newInstructor,
        "Instructor",  // Prefix
        x => x.Name,
        x => x.HireDate))  // Properties to bind
    {
        _instructorStore.Add(newInstructor);
        return RedirectToPage("./Index");
    }

    return Page();
}
```

### Exclude Types from Binding

```csharp
builder.Services.AddRazorPages()
    .AddMvcOptions(options =>
    {
        // Prevent binding for System.Version
        options.ModelMetadataDetailsProviders.Add(
            new ExcludeBindingMetadataProvider(typeof(Version)));

        // Prevent validation for System.Guid
        options.ModelMetadataDetailsProviders.Add(
            new SuppressChildValidationMetadataProvider(typeof(Guid)));
    });
```

---

## 6. ASP.NET Core APIs

### Minimal APIs (Recommended)

Minimal APIs are **the recommended approach for new projects**. They provide simplified, high-performance API development.

#### Basic Example

```csharp
var builder = WebApplication.CreateBuilder(args);
var app = builder.Build();

// Simple endpoint
app.MapGet("/", () => "Hello World!");

// With route parameters
app.MapGet("/users/{userId}/books/{bookId}",
    (int userId, int bookId) =>
        $"User {userId}, Book {bookId}");

app.Run();
```

#### Complete REST CRUD Example

```csharp
var builder = WebApplication.CreateBuilder(args);
builder.Services.AddScoped<ITodoService, TodoService>();

var app = builder.Build();

app.MapGet("/todos", GetTodos)
    .WithName("GetTodos")
    .WithOpenApi();

app.MapGet("/todos/{id}", GetTodoById)
    .WithName("GetTodo")
    .WithOpenApi();

app.MapPost("/todos", CreateTodo)
    .WithName("CreateTodo")
    .WithOpenApi();

app.MapPut("/todos/{id}", UpdateTodo)
    .WithName("UpdateTodo")
    .WithOpenApi();

app.MapDelete("/todos/{id}", DeleteTodo)
    .WithName("DeleteTodo")
    .WithOpenApi();

app.Run();

// Handler methods
async Task<IResult> GetTodos(ITodoService service)
{
    var todos = await service.GetAllAsync();
    return Results.Ok(todos);
}

async Task<IResult> GetTodoById(int id, ITodoService service)
{
    var todo = await service.GetByIdAsync(id);
    return todo == null
        ? Results.NotFound()
        : Results.Ok(todo);
}

async Task<IResult> CreateTodo(CreateTodoRequest request, ITodoService service)
{
    var todo = await service.CreateAsync(request.Title, request.Description);
    return Results.Created($"/todos/{todo.Id}", todo);
}

async Task<IResult> UpdateTodo(int id, UpdateTodoRequest request, ITodoService service)
{
    var todo = await service.UpdateAsync(id, request.Title, request.Description);
    return todo == null
        ? Results.NotFound()
        : Results.Ok(todo);
}

async Task<IResult> DeleteTodo(int id, ITodoService service)
{
    var success = await service.DeleteAsync(id);
    return success
        ? Results.NoContent()
        : Results.NotFound();
}

// Request/Response types
public record CreateTodoRequest(string Title, string? Description);
public record UpdateTodoRequest(string Title, string? Description);
public record TodoResponse(int Id, string Title, string? Description, bool Completed);
```

#### Advanced Minimal API Features

```csharp
// Authorization
app.MapPost("/admin/users", CreateUser)
    .RequireAuthorization("AdminPolicy");

// OpenAPI documentation
app.MapGet("/products/{id}", GetProduct)
    .Produces<ProductDto>(StatusCodes.Status200OK)
    .Produces(StatusCodes.Status404NotFound)
    .WithName("GetProductById")
    .WithOpenApi();

// Multiple formats
app.MapGet("/weather", GetWeather)
    .Produces<WeatherDto>("application/json")
    .Produces<WeatherDto>("application/xml");

// Custom validation
app.MapPost("/items", CreateItem)
    .AddEndpointFilter(async (context, next) =>
    {
        var item = context.GetArgument<Item>(0);
        if (string.IsNullOrEmpty(item.Name))
            return Results.BadRequest("Name is required");

        return await next(context);
    });

// Dependency injection
app.MapGet("/data", (IDataService service) => service.GetData());

// Form data
app.MapPost("/upload", async (HttpContext context) =>
{
    var form = await context.Request.ReadFormAsync();
    var file = form.Files["file"];
    // Process file
    return Results.Ok();
});

// Complex parameters
app.MapPost("/process", (ProcessRequest request) =>
{
    // Auto-binds from body (if [FromBody] implied)
    return Results.Ok(request);
});
```

### Controller-Based APIs (Alternative)

For large applications requiring MVC patterns or specific features:

```csharp
// Program.cs
builder.Services.AddControllers();
var app = builder.Build();
app.UseHttpsRedirection();
app.MapControllers();
app.Run();

// Controller
[ApiController]
[Route("[controller]")]
public class WeatherForecastController : ControllerBase
{
    private static readonly string[] Summaries = new[]
    {
        "Freezing", "Bracing", "Chilly", "Cool", "Mild", "Warm", "Balmy", "Hot", "Sweltering", "Scorching"
    };

    private readonly ILogger<WeatherForecastController> _logger;

    public WeatherForecastController(ILogger<WeatherForecastController> logger)
    {
        _logger = logger;
    }

    [HttpGet(Name = "GetWeatherForecast")]
    public IEnumerable<WeatherForecast> Get()
    {
        return Enumerable.Range(1, 5).Select(index => new WeatherForecast
        {
            Date = DateOnly.FromDateTime(DateTime.Now.AddDays(index)),
            TemperatureC = Random.Shared.Next(-20, 55),
            Summary = Summaries[Random.Shared.Next(Summaries.Length)]
        })
        .ToArray();
    }
}

public class WeatherForecast
{
    public DateOnly Date { get; set; }
    public int TemperatureC { get; set; }
    public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
    public string? Summary { get; set; }
}
```

### Choosing Between Approaches

| Feature | Minimal APIs | Controllers |
|---------|-------------|-------------|
| **Performance** | Faster, less overhead | Good, with overhead |
| **Boilerplate** | Minimal code | More code |
| **Learning curve** | Easier | Steeper |
| **Model binding extensibility** | Custom solutions | Built-in via `IModelBinderProvider` |
| **Validation extensibility** | Custom solutions | Built-in via `IModelValidator` |
| **Scaling to many endpoints** | Excellent | Excellent |
| **Team familiarity** | Modern approach | Traditional MVC |

**Recommendation**: Use **Minimal APIs** for new projects unless you need specific controller features (JsonPatch, OData, Application Parts, Application Model).

---

## Common Pitfalls and Prevention

### Performance Pitfalls

| Pitfall | Impact | Prevention |
|---------|--------|-----------|
| Blocking async code with `.Result` | Thread starvation | Always use `await` |
| Creating `HttpClient` in loop | Socket exhaustion | Use `HttpClientFactory` |
| Returning `IEnumerable` from controller | Sync enumeration | Use `ToListAsync()` first |
| Storing `HttpContext` in fields | Wrong/null context | Use `IHttpContextAccessor` at invocation time |
| Large object allocation in hot paths | Gen2 GC pressure | Use `ArrayPool<T>`, cache objects |
| Form binding with `Request.Form` | Sync over async | Use `ReadFormAsync()` |
| Unhandled null `ContentLength` | Logic bugs | Check for null explicitly |

### Security Pitfalls

| Pitfall | Risk | Prevention |
|---------|------|-----------|
| Trusting `ContentLength` | DOS attacks | Validate `ContentLength.HasValue` |
| Rendering user input as HTML | XSS | Use `HtmlEncode()` or Razor auto-encoding |
| String concatenation in SQL | SQL injection | Use EF Core LINQ or parameterized queries |
| Open redirect URLs | Phishing | Validate with `Url.IsLocalUrl()` |
| Resource Owner Password Credentials | Credential exposure | Use managed identities or OAuth2 flows |
| Plain text secrets in config | Credential leak | Use Azure Key Vault or Secret Manager |

---

## Summary of Key Files and Directories

| Path | Purpose |
|------|---------|
| `Program.cs` | Service registration and middleware configuration |
| `appsettings.json` | Configuration for all environments |
| `appsettings.{Environment}.json` | Environment-specific overrides |
| `Properties/launchSettings.json` | Development launch profiles |
| `.env` (development only) | Local secrets, never commit |
| `Resources/` | Localization resource files |
| `wwwroot/` | Static files (CSS, JS, images) |
| `Controllers/` | Controller classes (if using controllers) |
| `Models/` | Data models, view models |
| `Services/` | Business logic, data access |

---

## Additional Resources

- **Official Docs**: https://learn.microsoft.com/en-us/aspnet/core/
- **Minimal APIs Reference**: https://learn.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis
- **Entity Framework Core**: https://learn.microsoft.com/en-us/ef/core/
- **Azure Key Vault**: https://learn.microsoft.com/en-us/azure/key-vault/
- **Security Best Practices**: https://owasp.org/www-project-top-ten/

