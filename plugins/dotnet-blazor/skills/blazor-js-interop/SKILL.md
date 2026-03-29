---
name: blazor-js-interop
description: JavaScript interop in Blazor for calling JS from .NET and .NET from JS
allowed-tools:
  - Read
  - Write
  - Edit
triggers:
  - javascript interop
  - js interop
  - IJSRuntime
  - blazor javascript
  - call javascript
---

# Blazor JavaScript Interop

## Calling JavaScript from .NET

```csharp
@inject IJSRuntime JS

@code {
    private async Task ShowAlert()
    {
        await JS.InvokeVoidAsync("alert", "Hello from Blazor!");
    }

    private async Task<string> GetValue()
    {
        return await JS.InvokeAsync<string>("localStorage.getItem", "key");
    }

    // With element reference
    private ElementReference _inputRef;

    protected override async Task OnAfterRenderAsync(bool firstRender)
    {
        if (firstRender)
        {
            await JS.InvokeVoidAsync("focusElement", _inputRef);
        }
    }
}
```

## Calling .NET from JavaScript

```csharp
// Static .NET method
[JSInvokable]
public static Task<string> GetDataFromDotNet()
{
    return Task.FromResult("Hello from .NET!");
}

// Instance method
private DotNetObjectReference<MyComponent>? _dotNetRef;

protected override void OnInitialized()
{
    _dotNetRef = DotNetObjectReference.Create(this);
}

[JSInvokable]
public void HandleJsCallback(string data)
{
    _message = data;
    StateHasChanged();
}

public void Dispose() => _dotNetRef?.Dispose();
```

```javascript
// Call static method
const result = await DotNet.invokeMethodAsync('MyApp', 'GetDataFromDotNet');

// Call instance method
dotNetRef.invokeMethodAsync('HandleJsCallback', 'data from JS');
```

## Collocated JavaScript (recommended in .NET 10)

```
Components/Pages/
├── Map.razor
├── Map.razor.cs
└── Map.razor.js  ← Collocated JS module
```

```javascript
// Map.razor.js
export function initializeMap(element, options) {
    const map = new google.maps.Map(element, options);
    return map;
}

export function dispose() {
    // Cleanup
}
```

```csharp
// Map.razor.cs
private IJSObjectReference? _module;

protected override async Task OnAfterRenderAsync(bool firstRender)
{
    if (firstRender)
    {
        _module = await JS.InvokeAsync<IJSObjectReference>(
            "import", "./Components/Pages/Map.razor.js");
        await _module.InvokeVoidAsync("initializeMap", _mapElement, _options);
    }
}

public async ValueTask DisposeAsync()
{
    if (_module is not null)
    {
        await _module.InvokeVoidAsync("dispose");
        await _module.DisposeAsync();
    }
}
```

## Best Practices

- Use collocated `.razor.js` modules over global scripts
- Always dispose `IJSObjectReference` and `DotNetObjectReference`
- Only call JS interop in `OnAfterRenderAsync` (DOM must exist)
- Use `IJSRuntime` in Server mode, `IJSInProcessRuntime` only in WASM
- Minimize JS interop calls (batch operations when possible)
- Handle `JSDisconnectedException` in Blazor Server for graceful cleanup
