---
name: blazor-components
description: Blazor component model including render modes, lifecycle, parameters, event handling, and component communication
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
triggers:
  - blazor component
  - render mode
  - component lifecycle
  - razor component
  - blazor page
  - component parameter
  - cascading parameter
  - EventCallback
---

# Blazor Component Model

## Render Modes (.NET 10 Blazor Web App)

The unified Blazor Web App model supports four render modes:

### Static Server-Side Rendering (SSR)
- Default mode, no `@rendermode` directive
- HTML rendered on server, sent as static HTML
- No interactivity (no event handlers)
- Best for: content pages, SEO-critical pages, fast initial load

```razor
@page "/about"
@attribute [StreamRendering]  @* Enable streaming for async data *@

<h1>About Us</h1>
<p>@_content</p>

@code {
    private string? _content;
    protected override async Task OnInitializedAsync()
    {
        _content = await ContentService.GetAboutAsync();
    }
}
```

### Interactive Server
- `@rendermode InteractiveServer`
- Uses SignalR WebSocket connection
- Server processes UI events, sends diffs to client
- Best for: admin dashboards, real-time data, forms with server validation

### Interactive WebAssembly
- `@rendermode InteractiveWebAssembly`
- .NET runtime runs in browser via WebAssembly
- No server connection needed after initial download
- Best for: offline-capable apps, client-heavy processing

### Interactive Auto
- `@rendermode InteractiveAuto`
- First render uses Server mode (fast start)
- Switches to WebAssembly once runtime is downloaded
- Best for: public apps needing both fast start and offline capability

## Component Lifecycle

```
Constructor → SetParametersAsync → OnInitialized[Async] → OnParametersSet[Async]
    → BuildRenderTree → OnAfterRender[Async](firstRender: true)

Parameter change → SetParametersAsync → OnParametersSet[Async]
    → BuildRenderTree → OnAfterRender[Async](firstRender: false)

Disposal → Dispose/DisposeAsync
```

### Key Rules
- `OnInitializedAsync` runs once - use for initial data loading
- `OnParametersSetAsync` runs on every parameter change - use for dependent data
- `OnAfterRenderAsync` runs after DOM update - use for JS interop
- Always check `firstRender` in `OnAfterRenderAsync` to avoid duplicate JS calls

## Component Communication

### Parent to Child (Parameters)
```razor
@* Parent *@
<ChildComponent Title="Hello" Items="@_items" OnDelete="HandleDelete" />

@* Child *@
@code {
    [Parameter] public string Title { get; set; } = "";
    [Parameter] public List<Item> Items { get; set; } = [];
    [Parameter] public EventCallback<int> OnDelete { get; set; }
}
```

### Child to Parent (EventCallback)
```razor
@* Child *@
<button @onclick="() => OnDelete.InvokeAsync(item.Id)">Delete</button>
```

### Cascading Values (ancestor to all descendants)
```razor
@* Layout or parent *@
<CascadingValue Value="@_theme" Name="AppTheme">
    @Body
</CascadingValue>

@* Any descendant *@
@code {
    [CascadingParameter(Name = "AppTheme")] public Theme? Theme { get; set; }
}
```

### State Container (cross-component via DI)
```csharp
public sealed class AppState
{
    public event Action? OnChange;
    private int _count;
    public int Count => _count;
    public void Increment()
    {
        _count++;
        OnChange?.Invoke();
    }
}
// Register as Scoped (Server) or Singleton (WASM)
```

## Forms and Validation

```razor
<EditForm Model="@_model" OnValidSubmit="HandleSubmit" FormName="my-form">
    <DataAnnotationsValidator />

    <InputText @bind-Value="_model.Name" />
    <ValidationMessage For="@(() => _model.Name)" />

    <InputNumber @bind-Value="_model.Quantity" />
    <InputDate @bind-Value="_model.DueDate" />
    <InputSelect @bind-Value="_model.Category">
        @foreach (var cat in _categories)
        {
            <option value="@cat">@cat</option>
        }
    </InputSelect>

    <button type="submit">Save</button>
</EditForm>
```

## Key Patterns

- Use `@key` on repeated elements for efficient diffing
- Use `<Virtualize>` for large lists (renders only visible items)
- Use `[SupplyParameterFromQuery]` for query string binding
- Use `[SupplyParameterFromForm]` for form model binding in SSR
- Use `NavigationManager.NavigateTo()` for programmatic navigation
- Use `IDisposable` to unsubscribe from events
- Use `ErrorBoundary` to catch component-level errors gracefully
