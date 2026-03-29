---
name: Blazor .NET 10 Comprehensive Documentation
description: Complete Blazor patterns, components, render modes, hosting models, and .NET 10 features with code examples
type: reference
---

# Blazor .NET 10 Comprehensive Documentation

**Date**: 2026-03-29
**Coverage**: Components, render modes, prerendering, state management, routing, hosting models, web APIs, CSS isolation, Blazor Hybrid, authentication, and PWA patterns.

---

## 1. Component Fundamentals

### Component Structure & Conventions

**Naming Requirements**:
- Component names must start with **uppercase**: `ProductDetail.razor` ✔️ | `productDetail.razor` ❌
- File paths use Pascal case: `Components/Pages/ProductDetail.razor`
- Routable component URLs use kebab case: `@page "/product-detail"`

**Namespace Resolution** (Priority Order):
1. `@namespace` directive in `.razor` file
2. `RootNamespace` in project file
3. Project namespace + folder path (e.g., `BlazorSample.Components.Pages`)

### Component Implementation Patterns

#### Single-File Component
```razor
@page "/counter"

<PageTitle>Counter</PageTitle>

<h1>Counter</h1>

<p role="status">Current count: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>

@code {
    private int currentCount = 0;

    private void IncrementCount() => currentCount++;
}
```

#### Partial Class Pattern (Separated Markup & Logic)

**CounterPartialClass.razor:**
```razor
@page "/counter-partial-class"

<PageTitle>Counter</PageTitle>

<h1>Counter</h1>

<p role="status">Current count: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">Click me</button>
```

**CounterPartialClass.razor.cs:**
```csharp
namespace BlazorSample.Components.Pages;

public partial class CounterPartialClass
{
    private int currentCount = 0;

    private void IncrementCount() => currentCount++;
}
```

#### Base Class Inheritance
```razor
@page "/blazor-rocks-1"
@inherits BlazorRocksBase1

<PageTitle>Blazor Rocks!</PageTitle>

<h1>Blazor Rocks! Example 1</h1>

<p>@BlazorRocksText</p>
```

**BlazorRocksBase1.cs:**
```csharp
using Microsoft.AspNetCore.Components;

namespace BlazorSample;

public class BlazorRocksBase1 : ComponentBase
{
    public string BlazorRocksText { get; set; } = "Blazor rocks the browser!";
}
```

### Razor Directive Ordering Convention

```razor
@page "/doctor-who-episodes/{season:int}"
@rendermode InteractiveWebAssembly
@using System.Globalization
@using System.Text.Json
@using Microsoft.AspNetCore.Localization
@using Mandrill
@using BlazorSample.Components.Layout
@attribute [Authorize]
@implements IAsyncDisposable
@inject IJSRuntime JS
@inject ILogger<DoctorWhoEpisodes> Logger

<PageTitle>Doctor Who Episode List</PageTitle>
```

---

## 2. Component Parameters

### Basic Parameters

**ParameterChild.razor:**
```razor
<div class="card w-25" style="margin-bottom:15px">
    <div class="card-header font-weight-bold">@Title</div>
    <div class="card-body" style="font-style:@Body.Style">
        <p>@Body.Text</p>
        @if (Count is not null)
        {
            <p>The count is @Count.</p>
        }
    </div>
</div>

@code {
    [Parameter]
    public string Title { get; set; } = "Set By Child";

    [Parameter]
    public PanelBody Body { get; set; } =
        new()
        {
            Text = "Card content set by child.",
            Style = "normal"
        };

    [Parameter]
    public int? Count { get; set; }
}
```

**Parent Usage:**
```razor
@page "/parameter-1"

<PageTitle>Parameter 1</PageTitle>

<h1>Parameter Example 1</h1>

<h1>Child component (without attribute values)</h1>
<ParameterChild />

<h1>Child component (with attribute values)</h1>
<ParameterChild Title="Set by Parent"
    Body="@(new PanelBody() { Text = "Set by parent.", Style = "italic" })" />
```

### Required Parameters (.NET 6+)

```csharp
[Parameter]
[EditorRequired]
public string? Title { get; set; }

// Or single-line:
[Parameter, EditorRequired]
public string? Title { get; set; }
```

### Tuple Parameters (.NET 9+)

```razor
<div class="card w-50" style="margin-bottom:15px">
    <div class="card-header font-weight-bold">Tuple Card</div>
    <div class="card-body">
        <ul>
            <li>Integer: @Data?.Item1</li>
            <li>String: @Data?.Item2</li>
            <li>Boolean: @Data?.Item3</li>
        </ul>
    </div>
</div>

@code {
    [Parameter]
    public (int, string, bool)? Data { get; set; }
}
```

### Child Content (RenderFragment)

**RenderFragmentChild.razor:**
```razor
<div class="card w-25" style="margin-bottom:15px">
    <div class="card-header font-weight-bold">Child content</div>
    <div class="card-body">@ChildContent</div>
</div>

@code {
    [Parameter]
    public RenderFragment? ChildContent { get; set; }
}
```

**Parent Usage:**
```razor
@page "/render-fragments"

<PageTitle>Render Fragments</PageTitle>

<h1>Render Fragments Example</h1>

<RenderFragmentChild>
    Content of the child component is supplied
    by the parent component.
</RenderFragmentChild>
```

### Component References

**ReferenceChild.razor:**
```razor
@inject ILogger<ReferenceChild> Logger

@if (value > 0)
{
    <p>
        <code>value</code>: @value
    </p>
}

@code {
    private int value;

    public void ChildMethod(int value)
    {
        Logger.LogInformation("Received {Value} in ChildMethod", value);

        this.value = value;
        StateHasChanged();
    }
}
```

**ReferenceParent.razor:**
```razor
@page "/reference-parent"

<div>
    <button @onclick="@(() => childComponent1!.ChildMethod(5))">
        Call ChildMethod (first instance) with an argument of 5
    </button>

    <ReferenceChild @ref="childComponent1" />
</div>

<div>
    <button @onclick="CallChildMethod">
        Call ChildMethod (second instance) with an argument of 5
    </button>

    <ReferenceChild @ref="childComponent2" />
</div>

@code {
    private ReferenceChild? childComponent1;
    private ReferenceChild? childComponent2;

    private void CallChildMethod() => childComponent2!.ChildMethod(5);
}
```

⚠️ **Important**: Don't mutate child component state via references. Use component parameters for proper re-rendering.

---

## 3. Render Modes (.NET 8+)

### Render Mode Selection Matrix

| Mode | Execution | Interactivity | Use Case |
|------|-----------|---------------|----------|
| **InteractiveServer** | Server | Immediate | Real-time data, server resources, small payload |
| **InteractiveWebAssembly** | Browser (WASM) | Immediate | Offline support, client processing, CDN hosting |
| **InteractiveAuto** | Server→WASM | Immediate | Hybrid approach, fast initial + offload |
| **Static (SSR)** | Server | None | Content pages, SEO-focused, minimal interactivity |

### Setting Render Modes

**Global (Routes component in App.razor):**
```razor
<Routes @rendermode="InteractiveServer" />
<HeadOutlet @rendermode="InteractiveServer" />
```

**Component-Level:**
```razor
@page "/counter"
@rendermode InteractiveServer

<h1>Counter</h1>
<p>Current count: @currentCount</p>
<button @onclick="() => currentCount++">Increment</button>

@code {
    private int currentCount;
}
```

**Dynamic Assignment:**
```razor
@rendermode @(new InteractiveServerRenderMode(prerender: false))
@rendermode @(new InteractiveWebAssemblyRenderMode(prerender: false))
@rendermode @(new InteractiveAutoRenderMode(prerender: false))
```

---

## 4. Prerendering

### Enable/Disable Prerendering

**Disable for specific component instance:**
```razor
<... @rendermode="new InteractiveServerRenderMode(prerender: false)" />
<... @rendermode="new InteractiveWebAssemblyRenderMode(prerender: false)" />
<... @rendermode="new InteractiveAutoRenderMode(prerender: false)" />
```

**Disable for component definition:**
```razor
@rendermode @(new InteractiveServerRenderMode(prerender: false))
```

**Disable for entire app:**
```razor
<Routes @rendermode="new InteractiveServerRenderMode(prerender: false)" />
<HeadOutlet @rendermode="new InteractiveServerRenderMode(prerender: false)" />
```

### Handling Client-Side Services During Prerendering

**Problem**: Client-only services (like `IWebAssemblyHostEnvironment`) fail during server prerendering.

**Solution 1 - Register on server:**
```csharp
builder.Services.TryAddScoped<IWebAssemblyHostEnvironment, ServerHostEnvironment>();
```

**Solution 2 - Make optional:**
```csharp
private string? environmentName;

public Home(IWebAssemblyHostEnvironment? env = null)
{
    environmentName = env?.Environment;
}
```

**Solution 3 - Inject IServiceProvider:**
```razor
@page "/"
@using Microsoft.AspNetCore.Components.WebAssembly.Hosting
@inject IServiceProvider Services

<p>Environment: @environmentName</p>

@code {
    private string? environmentName;

    protected override void OnInitialized()
    {
        if (Services.GetService<IWebAssemblyHostEnvironment>() is { } env)
        {
            environmentName = env.Environment;
        }
    }
}
```

---

## 5. State Management

### In-Memory State Container Service

**StateContainer.cs:**
```csharp
public class StateContainer
{
    private string? savedString;

    public string Property
    {
        get => savedString ?? string.Empty;
        set
        {
            savedString = value;
            NotifyStateChanged();
        }
    }

    public event Action? OnChange;

    private void NotifyStateChanged() => OnChange?.Invoke();
}
```

**Program.cs (Client-side):**
```csharp
builder.Services.AddSingleton<StateContainer>();
```

**Program.cs (Server-side):**
```csharp
builder.Services.AddScoped<StateContainer>();
```

**Component Usage:**
```razor
@implements IDisposable
@inject StateContainer StateContainer

<h2>Nested component</h2>

<p>Nested component Property: <b>@StateContainer.Property</b></p>

<p>
    <button @onclick="ChangePropertyValue">
        Change the Property
    </button>
</p>

@code {
    protected override void OnInitialized()
    {
        StateContainer.OnChange += StateHasChanged;
    }

    private void ChangePropertyValue()
    {
        StateContainer.Property =
            $"New value set in the Nested component: {DateTime.Now}";
    }

    public void Dispose()
    {
        StateContainer.OnChange -= StateHasChanged;
    }
}
```

### Cascading Values and Parameters

```razor
<CascadingValue Value="this">
    <Child />
</CascadingValue>

@code {
    public string Message { get; set; } = "Hello from parent!";
}
```

**Child component:**
```razor
@inject CascadingParameter Parent Parent

<p>@Parent.Message</p>
```

### Root-Level Cascading Values with Notifications (.NET 8+)

```razor
<CascadingValueSource TValue="AppState" Value="appState">
    <Routes @rendermode="InteractiveServer" />
</CascadingValueSource>

@code {
    private AppState appState = new();
}
```

---

## 6. Routing

### Basic Route Template

```razor
@page "/hello-world"

<h1>Hello World!</h1>
```

### Route Parameters

```razor
@page "/route-parameter-1/{text}"

<h1>Route Parameter Example 1</h1>

<p>Blazor is @Text!</p>

@code {
    [Parameter]
    public string? Text { get; set; }
}
```

### Optional Parameters (.NET 5+)

```razor
@page "/route-parameter-2/{text?}"

<h1>Route Parameter Example 2</h1>

<p>Blazor is @Text!</p>

@code {
    [Parameter]
    public string? Text { get; set; }

    protected override void OnParametersSet() => Text = Text ?? "fantastic";
}
```

### Route Constraints

```razor
@page "/user/{Id:int}"

<h1>User Example</h1>

<p>User Id: @Id</p>

@code {
    [Parameter]
    public int Id { get; set; }
}
```

**Available Constraints**:
- `bool`: `{active:bool}` → `true`, `FALSE`
- `datetime`: `{dob:datetime}` → `2016-12-31`, `2016-12-31 7:32pm`
- `decimal`: `{price:decimal}` → `49.99`, `-1,000.01`
- `double`: `{weight:double}` → `1.234`
- `float`: `{weight:float}` → `1.234`
- `guid`: `{id:guid}` → `00001111-aaaa-2222-bbbb-3333cccc4444`
- `int`: `{id:int}` → `123456789`
- `long`: `{ticks:long}` → `123456789`
- `nonfile`: `{parameter:nonfile}` → Not file paths

### Optional Constraints (.NET 6+)

```razor
@page "/user/{id:int}/{option:bool?}"

<p>Id: @Id</p>
<p>Option: @Option</p>

@code {
    [Parameter]
    public int Id { get; set; }

    [Parameter]
    public bool Option { get; set; }
}
```

### Catch-All Route Parameters (.NET 5+)

```razor
@page "/catch-all/{*pageRoute}"

<h1>Catch All Parameters Example</h1>

<p>PageRoute: @PageRoute</p>

@code {
    [Parameter]
    public string? PageRoute { get; set; }
}
```

For URL `/catch-all/this/is/a/test` → `PageRoute = "this/is/a/test"`

### Focus on Navigation (.NET 6+)

```razor
<FocusOnNavigate RouteData="routeData" Selector="h1" />
```

Sets focus to the page's top-level header after navigation (useful for screen readers).

### Handle Asynchronous Navigation Events (.NET 5+)

```razor
<Router AppAssembly="typeof(App).Assembly"
    OnNavigateAsync="OnNavigateAsync">
    ...
</Router>

@code {
    private async Task OnNavigateAsync(NavigationContext context)
    {
        if (context.Path == "/about")
        {
            var stats = new Stats { Page = "/about" };
            await Http.PostAsJsonAsync("api/visited", stats,
                context.CancellationToken);
        }
        else if (context.Path == "/store")
        {
            var productIds = new[] { 345, 789, 135, 689 };

            foreach (var productId in productIds)
            {
                context.CancellationToken.ThrowIfCancellationRequested();
                Products.Prefetch(productId);
            }
        }
    }
}
```

### Navigation Indicator Content (.NET 5+)

```razor
@using Microsoft.AspNetCore.Components.Routing

<Router AppAssembly="typeof(App).Assembly">
    <Navigating>
        <p>Loading the requested page&hellip;</p>
    </Navigating>
</Router>
```

---

## 7. Web API Calls (HttpClient)

### Basic HttpClient Usage

```csharp
@page "/fetch-data"
@inject HttpClient Http

<h1>Fetch data</h1>

@if (forecasts == null)
{
    <p>Loading...</p>
}
else
{
    <table class="table">
        <thead>
            <tr>
                <th>Date</th>
                <th>Temp. (C)</th>
                <th>Summary</th>
            </tr>
        </thead>
        <tbody>
            @foreach (var forecast in forecasts)
            {
                <tr>
                    <td>@forecast.Date.ToShortDateString()</td>
                    <td>@forecast.TemperatureC</td>
                    <td>@forecast.Summary</td>
                </tr>
            }
        </tbody>
    </table>
}

@code {
    private WeatherForecast[]? forecasts;

    protected override async Task OnInitializedAsync()
    {
        forecasts = await Http.GetFromJsonAsync<WeatherForecast[]>("sample-data/weather.json");
    }

    public class WeatherForecast
    {
        public DateTime Date { get; set; }

        public int TemperatureC { get; set; }

        public string? Summary { get; set; }

        public int TemperatureF => 32 + (int)(TemperatureC / 0.5556);
    }
}
```

### Error Handling

```csharp
protected override async Task OnInitializedAsync()
{
    try
    {
        forecasts = await Http.GetFromJsonAsync<WeatherForecast[]>("sample-data/weather.json");
    }
    catch (Exception ex)
    {
        Logger.LogError(ex, "Error loading forecasts");
    }
}
```

### POST Request with JSON Body

```csharp
var newItem = new TodoItem { Title = "New Task", IsComplete = false };

var response = await Http.PostAsJsonAsync("/api/todos", newItem);

if (response.IsSuccessStatusCode)
{
    var createdItem = await response.Content.ReadAsAsync<TodoItem>();
}
```

---

## 8. CSS Isolation

### Enable CSS Isolation

Create a `.razor.css` file matching the component name in the same folder.

**Example.razor:**
```razor
@page "/example"

<h1>Scoped CSS Example</h1>
```

**Example.razor.css:**
```css
h1 {
    color: brown;
    font-family: Tahoma, Geneva, Verdana, sans-serif;
}
```

Styles are automatically scoped to the component with a unique attribute `b-{STRING}`.

### Child Component Support with `::deep`

**Parent.razor:**
```razor
@page "/parent"

<div>
    <h1>Parent component</h1>

    <Child />
</div>
```

**Child.razor:**
```razor
<h1>Child Component</h1>
```

**Parent.razor.css:**
```css
::deep h1 {
    color: red;
}
```

The `::deep` pseudo-element applies parent styles to all descendant elements.

### Customize Scope Identifier (.NET 8+)

**Project File:**
```xml
<ItemGroup>
  <None Update="Components/Pages/Example.razor.css" CssScope="custom-scope-identifier" />
</ItemGroup>
```

### Disable CSS Isolation

```xml
<ScopedCssEnabled>false</ScopedCssEnabled>
```

---

## 9. Blazor Hybrid (MAUI/WPF/Windows Forms)

### Architecture

Blazor Hybrid apps:
- Run **natively** on the device (not WebAssembly)
- Render to an embedded **Web View** control
- Have **full access to native APIs**
- Can share components with web apps

### .NET MAUI Integration

```csharp
using Microsoft.AspNetCore.Components.WebView.Maui;

namespace BlazorMauiApp;

public static class MauiProgram
{
    public static MauiApp CreateMauiApp()
    {
        var builder = MauiApp.CreateBuilder();
        builder
            .UseMauiApp<App>()
            .ConfigureFonts(fonts =>
            {
                fonts.AddFont("OpenSans-Regular.ttf", "OpenSansRegular");
            })
            .AddMauiBlazorWebView();

#if DEBUG
        builder.Services.AddBlazorWebViewDeveloperTools();
#endif

        return builder.Build();
    }
}
```

### MAUI Page with BlazorWebView

```xml
<?xml version="1.0" encoding="utf-8" ?>
<ContentPage xmlns="http://schemas.microsoft.com/dotnet/2021/maui"
             xmlns:x="http://schemas.microsoft.com/winfx/2009/xaml"
             x:Class="BlazorMauiApp.MainPage"
             Title="Blazor Hybrid App">

    <BlazorWebView x:Name="blazorWebView"
        HostingPage="index.html">
        <BlazorWebView.RootComponents>
            <RootComponent Selector="#app" ComponentType="{x:Type local:App}" />
        </BlazorWebView.RootComponents>
    </BlazorWebView>

</ContentPage>
```

### WPF Integration

```csharp
using Microsoft.AspNetCore.Components.WebView.Wpf;

public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
    }
}
```

**XAML:**
```xml
<Window x:Class="BlazorWpfApp.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:blazor="clr-namespace:Microsoft.AspNetCore.Components.WebView.Wpf;assembly=Microsoft.AspNetCore.Components.WebView.Wpf"
        Title="Blazor WPF App" Height="450" Width="800">
    <Grid>
        <blazor:BlazorWebView x:Name="BlazorWebView" HostingPage="wwwroot/index.html">
            <blazor:BlazorWebView.RootComponents>
                <blazor:RootComponent Selector="#app" ComponentType="{x:Type local:App}" />
            </blazor:BlazorWebView.RootComponents>
        </blazor:BlazorWebView>
    </Grid>
</Window>
```

### Web View Configuration

**Access scoped services from native UI (.NET 8+):**
```csharp
private async void MyMauiButtonHandler(object sender, EventArgs e)
{
    var wasDispatchCalled = await _blazorWebView.TryDispatchAsync(sp =>
    {
        var navMan = sp.GetRequiredService<NavigationManager>();
        navMan.CallSomeNavigationApi(...);
    });

    if (!wasDispatchCalled)
    {
        // Handle dispatch failure
    }
}
```

### Unhandled Exceptions (Windows Forms/WPF)

```csharp
AppDomain.CurrentDomain.UnhandledException += (sender, error) =>
{
#if DEBUG
    MessageBox.Show(text: error.ExceptionObject.ToString(), caption: "Error");
#else
    MessageBox.Show(text: "An error has occurred.", caption: "Error");
#endif

    // Log the error information
};
```

---

## 10. Hosting Models Comparison

| Feature | Server | WebAssembly | Hybrid |
|---------|--------|-------------|--------|
| **Complete .NET API compatibility** | ✔️ | ❌ | ✔️ |
| **Direct server/network access** | ✔️ | ❌† | ❌† |
| **Small payload, fast initial load** | ✔️ | ❌ | ❌ |
| **Near-native execution** | ✔️ | ✔️‡ | ✔️ |
| **App code secure on server** | ✔️ | ❌† | ❌† |
| **Run offline** | ❌ | ✔️ | ✔️ |
| **Static site hosting** | ❌ | ✔️ | ❌ |
| **Offload processing to clients** | ❌ | ✔️ | ✔️ |
| **Full native capabilities** | ❌ | ❌ | ✔️ |

†Can use server-based APIs
‡Requires AOT compilation

---

## 11. Authentication with Microsoft Entra (Azure AD)

### Setup in Program.cs

```csharp
builder.Services
    .AddAuthentication(OpenIdConnectDefaults.AuthenticationScheme)
    .AddMicrosoftIdentityWebApp(builder.Configuration.GetSection("AzureAd"));

builder.Services.AddAuthorization();
```

### Login Component Example

```razor
@page "/login"
@using Microsoft.AspNetCore.Components.Authorization

<PageTitle>Login</PageTitle>

<h1>Login</h1>

<AuthorizeView>
    <Authorized>
        <p>Welcome, @context.User.Identity?.Name</p>
        <a href="/logout">Logout</a>
    </Authorized>
    <NotAuthorized>
        <a href="/MicrosoftIdentity/Account/SignIn">Login</a>
    </NotAuthorized>
</AuthorizeView>
```

### Protected Component

```razor
@page "/secure-page"
@attribute [Authorize]

<h1>Secure Page</h1>

<AuthorizeView>
    <Authorized>
        <p>This content is only visible to authenticated users.</p>
    </Authorized>
    <NotAuthorized>
        <p>You are not authorized to view this page.</p>
    </NotAuthorized>
</AuthorizeView>
```

---

## 12. Progressive Web Apps (PWA)

### Create PWA Project

```bash
dotnet new blazorwasm -o MyBlazorPwa --pwa
```

### Convert Existing App to PWA

**Project File:**
```xml
<PropertyGroup>
  <ServiceWorkerAssetsManifest>service-worker-assets.js</ServiceWorkerAssetsManifest>
</PropertyGroup>

<ItemGroup>
  <ServiceWorker Include="wwwroot\service-worker.js"
    PublishedContent="wwwroot\service-worker.published.js" />
</ItemGroup>
```

### Index.html Setup

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Blazor PWA</title>
    <base href="/" />
    <link href="app.css" rel="stylesheet" />
    <link href="manifest.webmanifest" rel="manifest" />
    <link rel="apple-touch-icon" sizes="512x512" href="icon-512.png" />
    <link rel="apple-touch-icon" sizes="192x192" href="icon-192.png" />
</head>
<body>
    <div id="app">Loading...</div>

    <div id="blazor-error-ui">
        An unhandled error has occurred.
        <a href="" class="reload">Reload</a>
        <a class="dismiss">Dismiss</a>
    </div>

    <script src="_framework/blazor.webassembly.js"></script>
    <script>
      navigator.serviceWorker.register('service-worker.js', { updateViaCache: 'none' });
    </script>
</body>
</html>
```

### Service Worker Strategy

The `service-worker.published.js` uses a **cache-first strategy**:
1. Try to serve cached content first
2. Fall back to network requests if not cached
3. For navigation requests, always serve `/index.html`

### Offline Support

- Works only in **published** apps (not Debug)
- User must visit app online first to cache assets
- Browser automatically downloads and caches resources
- Navigation requests return cached `/index.html`

### Customizing Cache Strategy

Edit `service-worker.published.js` `onFetch` logic to customize which URLs should bypass the service worker:

```javascript
const shouldServeIndexHtml = event.request.mode === 'navigate'
  && !event.request.url.includes('/Identity/')
  && !event.request.url.includes('/signin-google');
```

### Manifest Configuration

**manifest.webmanifest:**
```json
{
  "name": "My Blazor PWA",
  "short_name": "Blazor PWA",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#03173d",
  "description": "A Progressive Web App built with Blazor",
  "icons": [
    {
      "src": "icon-192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "icon-512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ]
}
```

---

## 13. Advanced .NET 10 Patterns

### Static Versus Interactive Routing (.NET 8+)

**Static Routing**: Uses endpoint routing and HTTP request path during prerendering on the server.

**Interactive Routing**: Router becomes interactive after static SSR, uses document URL and can dynamically navigate without HTTP requests.

```razor
<!-- Static SSR only -->
<Routes />

<!-- Interactive server -->
<Routes @rendermode="InteractiveServer" />

<!-- Interactive WebAssembly -->
<Routes @rendermode="InteractiveWebAssembly" />

<!-- Auto mode (server→WebAssembly) -->
<Routes @rendermode="InteractiveAuto" />
```

### Multiple Assembly Routing (.NET 8+)

**Server project Program.cs:**
```csharp
app.MapRazorComponents<App>()
    .AddAdditionalAssemblies(typeof(BlazorSample.Client._Imports).Assembly);
```

**In Router:**
```razor
<Router
    AppAssembly="@typeof(App).Assembly"
    AdditionalAssemblies="[ typeof(BlazorSample.Client._Imports).Assembly ]">
    ...
</Router>
```

### Async Lifecycle Methods

```csharp
protected override async Task OnInitializedAsync()
{
    data = await LoadDataAsync();
}

protected override async Task OnParametersSetAsync()
{
    await RefreshAsync();
}

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        await InitializeAsync();
    }
}
```

### MarkupString for Raw HTML

```razor
@page "/markup-strings"

<h1>Markup Strings Example</h1>

@((MarkupString)myMarkup)

@code {
    private string myMarkup =
        "<p class=\"text-danger\">This is a <em>markup string</em>.</p>";
}
```

⚠️ **Security Warning**: Never use `MarkupString` with untrusted content.

---

## Key Takeaways

### .NET 10 Highlights
1. **Render modes** provide flexible component execution models (Server/WebAssembly/Auto/Static)
2. **Interactive routing** enables dynamic navigation without page reloads
3. **Prerendering** improves initial load times and SEO
4. **Blazor Hybrid** unifies mobile/desktop/web with shared components
5. **CSS isolation** scopes styles to components automatically
6. **PWA support** enables offline-first applications
7. **Multiple render modes** in single app support hybrid architectures

### Architecture Decision Matrix

**Choose InteractiveServer if:**
- Need server resources/APIs
- Small payload critical
- Limited client devices
- Real-time collaborative features

**Choose InteractiveWebAssembly if:**
- Need offline support
- Heavy client processing
- CDN distribution
- Reduced server load

**Choose InteractiveAuto if:**
- Want best of both worlds
- Fast initial load + client offloading
- Can handle initial server-rendering

**Choose Static (SSR) if:**
- Content-focused pages
- SEO critical
- No interactivity needed
- Minimal dependencies

**Choose Hybrid if:**
- Native desktop/mobile apps
- Component reuse across platforms
- Need native API access

