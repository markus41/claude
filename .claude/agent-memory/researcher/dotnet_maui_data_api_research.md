---
name: .NET MAUI & Data API Builder Comprehensive Research
description: Complete patterns, architecture, and code examples for .NET MAUI (SQLite, REST, navigation, MVVM) and Data API Builder
type: reference
---

# .NET MAUI & Data API Builder Comprehensive Research

Research date: 2026-03-29
Based on official Microsoft Learn documentation

## .NET MAUI: Local Data Storage (SQLite)

### NuGet Package Options
- **sqlite-net-pcl**: ORM-based approach with LINQ support (recommended for .NET MAUI)
- **Microsoft.Data.Sqlite**: Lightweight ADO.NET provider; implements standard abstractions

### Configuration Pattern
```csharp
public static class Constants
{
    public const string DatabaseFilename = "TodoSQLite.db3";

    public const SQLite.SQLiteOpenFlags Flags =
        SQLite.SQLiteOpenFlags.ReadWrite |
        SQLite.SQLiteOpenFlags.Create |
        SQLite.SQLiteOpenFlags.SharedCache;

    public static string DatabasePath =>
        Path.Combine(FileSystem.AppDataDirectory, DatabaseFilename);
}
```

### SQLiteOpenFlags Values
- **ReadWrite**: Connection can read and write data
- **Create**: Automatically creates database if missing
- **SharedCache**: Participates in shared cache if enabled
- **FullMutex**: Serialized threading mode
- **NoMutex**: Multi-threading mode
- **PrivateCache**: Does not participate in shared cache
- **ProtectionComplete**: File encrypted; inaccessible while device locked
- **ProtectionCompleteUnlessOpen**: Encrypted until first open
- **ProtectionCompleteUntilFirstUserAuthentication**: Encrypted until user authentication
- **ProtectionNone**: No encryption

### Entity Model Pattern
```csharp
public class TodoItem
{
    [PrimaryKey, AutoIncrement]
    public int ID { get; set; }
    public string Name { get; set; }
    public string Notes { get; set; }
    public bool Done { get; set; }
}
```

### Database Access Class (Repository Pattern)
```csharp
public class TodoItemDatabase
{
    SQLiteAsyncConnection database;

    // Lazy initialization
    async Task Init()
    {
        if (database is not null)
            return;

        database = new SQLiteAsyncConnection(Constants.DatabasePath, Constants.Flags);
        await database.CreateTableAsync<TodoItem>();
    }

    // CRUD operations using async/await
    public async Task<List<TodoItem>> GetItemsAsync()
    {
        await Init();
        return await database.Table<TodoItem>().ToListAsync();
    }

    public async Task<TodoItem> GetItemAsync(int id)
    {
        await Init();
        return await database.Table<TodoItem>()
            .Where(i => i.ID == id)
            .FirstOrDefaultAsync();
    }

    public async Task<int> SaveItemAsync(TodoItem item)
    {
        await Init();
        if (item.ID != 0)
            return await database.UpdateAsync(item);
        else
            return await database.InsertAsync(item);
    }

    public async Task<int> DeleteItemAsync(TodoItem item)
    {
        await Init();
        return await database.DeleteAsync(item);
    }
}
```

### Dependency Injection Registration
```csharp
// In MauiProgram.cs
builder.Services.AddSingleton<TodoItemDatabase>();
builder.Services.AddSingleton<TodoListPage>();
builder.Services.AddTransient<TodoItemPage>();
```

### Key Patterns
- **Lazy initialization**: Database connects only when first accessed
- **Async-only API**: All operations are async to prevent UI blocking
- **Repository abstraction**: Single class manages all data access
- **ORM approach**: Write objects, not SQL queries
- **Write-Ahead Logging (WAL)**: Enable with `EnableWriteAheadLoggingAsync()`

---

## .NET MAUI: REST API Consumption

### HttpClient Setup
```csharp
public class RestService
{
    HttpClient _client;
    JsonSerializerOptions _serializerOptions;

    public List<TodoItem> Items { get; private set; }

    public RestService()
    {
        _client = new HttpClient();
        _serializerOptions = new JsonSerializerOptions
        {
            PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
            WriteIndented = true
        };
    }
}
```

### Data Model
```csharp
public class TodoItem
{
    public string ID { get; set; }
    public string Name { get; set; }
    public string Notes { get; set; }
    public bool Done { get; set; }
}
```

### HTTP Verb Patterns
| Operation | Verb | URI | Returns |
|-----------|------|-----|---------|
| Get items | GET | /api/todoitems/ | List |
| Create item | POST | /api/todoitems/ | 201 (Created) |
| Update item | PUT | /api/todoitems/ | 204 (No Content) |
| Delete item | DELETE | /api/todoitems/{id} | 204 (No Content) |

### GET Request Pattern
```csharp
public async Task<List<TodoItem>> RefreshDataAsync()
{
    Items = new List<TodoItem>();
    Uri uri = new Uri(string.Format(Constants.RestUrl, string.Empty));

    try
    {
        HttpResponseMessage response = await _client.GetAsync(uri);
        if (response.IsSuccessStatusCode)
        {
            string content = await response.Content.ReadAsStringAsync();
            Items = JsonSerializer.Deserialize<List<TodoItem>>(content, _serializerOptions);
        }
    }
    catch (Exception ex)
    {
        Debug.WriteLine(@"\tERROR {0}", ex.Message);
    }

    return Items;
}
```

### Large Response Streaming (Performance Optimization)
```csharp
// Instead of ReadAsStringAsync (buffers everything)
using Stream stream = await response.Content.ReadAsStreamAsync();
Items = await JsonSerializer.DeserializeAsync<List<TodoItem>>(stream, _serializerOptions);
```

### POST/PUT Pattern
```csharp
public async Task SaveTodoItemAsync(TodoItem item, bool isNewItem = false)
{
    Uri uri = new Uri(string.Format(Constants.RestUrl, string.Empty));

    try
    {
        string json = JsonSerializer.Serialize<TodoItem>(item, _serializerOptions);
        StringContent content = new StringContent(json, Encoding.UTF8, "application/json");

        HttpResponseMessage response = null;
        if (isNewItem)
            response = await _client.PostAsync(uri, content);
        else
            response = await _client.PutAsync(uri, content);

        if (response.IsSuccessStatusCode)
            Debug.WriteLine(@"\tTodoItem successfully saved.");
    }
    catch (Exception ex)
    {
        Debug.WriteLine(@"\tERROR {0}", ex.Message);
    }
}
```

### DELETE Pattern
```csharp
public async Task DeleteTodoItemAsync(string id)
{
    Uri uri = new Uri(string.Format(Constants.RestUrl, id));

    try
    {
        HttpResponseMessage response = await _client.DeleteAsync(uri);
        if (response.IsSuccessStatusCode)
            Debug.WriteLine(@"\tTodoItem successfully deleted.");
    }
    catch (Exception ex)
    {
        Debug.WriteLine(@"\tERROR {0}", ex.Message);
    }
}
```

### Key Patterns
- **Centralized HttpClient**: Single instance per service, class-level
- **JsonSerializerOptions**: Configuration for camelCase naming, formatting
- **IsSuccessStatusCode**: Check for 2xx responses
- **async/await**: All operations async
- **Streaming for large responses**: Avoid buffering entire response
- **Error handling**: Try-catch with Debug output
- **Service classes**: Encapsulate HTTP logic separate from UI

### Best Practices
- Single HttpClient per server (or one for app lifetime)
- Use IHttpClientFactory for managed instances (if available)
- DI register services as singleton
- Dependency Injection for testability

---

## .NET MAUI: Shell Navigation Architecture

### Shell Structure
```xaml
<Shell>
    <FlyoutItem Route="animals" Title="Animals">
        <Tab Route="domestic" Title="Domestic">
            <ShellContent Route="cats" ContentTemplate="{DataTemplate local:CatsPage}" />
            <ShellContent Route="dogs" ContentTemplate="{DataTemplate local:DogsPage}" />
        </Tab>
        <ShellContent Route="monkeys" Title="Monkeys"
                      ContentTemplate="{DataTemplate local:MonkeysPage}" />
    </FlyoutItem>
    <ShellContent Route="about" Title="About"
                  ContentTemplate="{DataTemplate local:AboutPage}" />
</Shell>
```

### Route Registration
```csharp
// In Shell constructor or early in app startup
Routing.RegisterRoute("monkeydetails", typeof(MonkeyDetailPage));
Routing.RegisterRoute("beardetails", typeof(BearDetailPage));

// Contextual routes (same name at different hierarchy levels)
Routing.RegisterRoute("monkeys/details", typeof(MonkeyDetailPage));
Routing.RegisterRoute("bears/details", typeof(BearDetailPage));
```

### Navigation Methods

#### Absolute Route Navigation
```csharp
await Shell.Current.GoToAsync("//animals/domestic/dogs");
await Shell.Current.GoToAsync("//about");
```

#### Relative Route Navigation
```csharp
await Shell.Current.GoToAsync("monkeydetails");
```

#### Backward Navigation
```csharp
await Shell.Current.GoToAsync("..");  // Go back one level
await Shell.Current.GoToAsync("../route");  // Back then navigate to route
await Shell.Current.GoToAsync("../../route");  // Back twice then navigate
```

### Pass Simple Data (Query Parameters)
```csharp
string elephantName = "Dumbo";
await Shell.Current.GoToAsync($"elephantdetails?name={elephantName}");
```

### Pass Complex Data (Object Navigation)
```csharp
Animal animal = selectedAnimal;
var navigationParams = new Dictionary<string, object>
{
    { "Bear", animal }
};
await Shell.Current.GoToAsync("beardetails", navigationParams);

// Or single-use (auto-cleared):
var singleUseParams = new ShellNavigationQueryParameters
{
    { "Bear", animal }
};
await Shell.Current.GoToAsync("beardetails", singleUseParams);
```

### Receive Navigation Data: QueryPropertyAttribute (Simple)
```csharp
[QueryProperty(nameof(Bear), "Bear")]
public partial class BearDetailPage : ContentPage
{
    Animal bear;
    public Animal Bear
    {
        get => bear;
        set { bear = value; OnPropertyChanged(); }
    }
}
```

### Receive Navigation Data: IQueryAttributable (Complex)
```csharp
public class MonkeyDetailViewModel : IQueryAttributable, INotifyPropertyChanged
{
    public Animal Monkey { get; private set; }

    public void ApplyQueryAttributes(IDictionary<string, object> query)
    {
        Monkey = query["Monkey"] as Animal;
        OnPropertyChanged(nameof(Monkey));
    }
}
```

### Multiple Query Parameters
```csharp
// Passing
await Shell.Current.GoToAsync($"elephantdetails?name={name}&location={location}");

// Receiving via IQueryAttributable
public void ApplyQueryAttributes(IDictionary<string, object> query)
{
    string name = HttpUtility.UrlDecode(query["name"].ToString());
    string location = HttpUtility.UrlDecode(query["location"].ToString());
}
```

### Navigation Events
```csharp
public partial class AppShell : Shell
{
    protected override void OnNavigating(ShellNavigatingEventArgs args)
    {
        base.OnNavigating(args);

        // Cancel back navigation if data unsaved
        if (args.Source == ShellNavigationSource.Pop)
        {
            args.Cancel();
        }
    }

    protected override void OnNavigated(ShellNavigatedEventArgs args)
    {
        base.OnNavigated(args);
        // Navigation completed
    }
}
```

### Navigation Deferral (Confirmation Dialog)
```csharp
protected override async void OnNavigating(ShellNavigatingEventArgs args)
{
    base.OnNavigating(args);

    ShellNavigatingDeferral token = args.GetDeferral();

    var result = await DisplayActionSheetAsync("Navigate?", "Cancel", "Yes", "No");
    if (result != "Yes")
        args.Cancel();

    token.Complete();
}
```

### Back Button Customization
```xaml
<ContentPage ...>
    <Shell.BackButtonBehavior>
        <BackButtonBehavior Command="{Binding BackCommand}"
                            IconOverride="back.png"
                            IsVisible="True"
                            IsEnabled="True" />
    </Shell.BackButtonBehavior>
</ContentPage>
```

### Navigation State Properties
- **CurrentItem**: Currently selected ShellItem
- **CurrentPage**: Currently presented Page
- **CurrentState**: URI of current route
- **BackButtonBehavior**: Customize back button

### Key Patterns
- **URI-based navigation**: Routes are strings, not types
- **Relative vs Absolute**: Relative searches for unique routes; Absolute follows hierarchy
- **Contextual navigation**: Same route name at different levels for context-aware navigation
- **Query parameters**: Simple strings (URL-encoded) vs object-based (retained in memory)
- **IQueryAttributable**: Preferred for complex data (trim-safe)
- **GoToAsync is async**: Always await to prevent race conditions
- **Navigation stack**: Read-only; modify only through GoToAsync

---

## .NET MAUI: MVVM Pattern

### INotifyPropertyChanged Implementation
```csharp
using System.ComponentModel;
using System.Runtime.CompilerServices;

public class ClockViewModel : INotifyPropertyChanged
{
    public event PropertyChangedEventHandler PropertyChanged;

    private DateTime _dateTime;

    public DateTime DateTime
    {
        get => _dateTime;
        set
        {
            if (_dateTime != value)
            {
                _dateTime = value;
                OnPropertyChanged();  // Caller member name automatic
            }
        }
    }

    protected void OnPropertyChanged([CallerMemberName] string name = "") =>
        PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(name));
}
```

### View-ViewModel Binding in XAML
```xaml
<ContentPage x:Class="App.ClockPage"
             x:DataType="local:ClockViewModel">
    <ContentPage.BindingContext>
        <local:ClockViewModel />
    </ContentPage.BindingContext>

    <Label Text="{Binding DateTime, StringFormat='{0:T}'}"
           FontSize="18"
           HorizontalOptions="Center"
           VerticalOptions="Center" />
</ContentPage>
```

### Two-Way Data Binding
```xaml
<Slider Value="{Binding Hue}"
        Margin="20,0,20,0" />  <!-- TwoWay is default for Slider -->
```

### ICommand (RelayCommand) Pattern
```csharp
public class KeypadViewModel : INotifyPropertyChanged
{
    public ICommand AddCharCommand { get; private set; }
    public ICommand DeleteCharCommand { get; private set; }

    public KeypadViewModel()
    {
        // Command with parameter
        AddCharCommand = new Command<string>((key) => InputString += key);

        // Command with CanExecute
        DeleteCharCommand = new Command(
            () => InputString = InputString.Substring(0, InputString.Length - 1),
            () => InputString.Length > 0
        );
    }
}
```

### Command Binding in XAML
```xaml
<Button Text="1" Command="{Binding AddCharCommand}"
        CommandParameter="1" />
<Button Text="Delete" Command="{Binding DeleteCharCommand}" />
```

### Interactive Two-Way Binding (HSL Color Example)
```csharp
public class HslViewModel : INotifyPropertyChanged
{
    private float _hue, _saturation, _luminosity;
    private Color _color;

    public float Hue
    {
        get => _hue;
        set
        {
            if (_hue != value)
                Color = Color.FromHsla(value, _saturation, _luminosity);
        }
    }

    public Color Color
    {
        get => _color;
        set
        {
            if (_color != value)
            {
                _color = value;
                _hue = _color.GetHue();
                _saturation = _color.GetSaturation();
                _luminosity = _color.GetLuminosity();

                OnPropertyChanged(nameof(Hue));
                OnPropertyChanged(nameof(Saturation));
                OnPropertyChanged(nameof(Luminosity));
                OnPropertyChanged(nameof(Color));
            }
        }
    }
}
```

### UI Threading (Cross-Thread Updates)
.NET MAUI **automatically marshals** binding updates to the UI thread. You can safely update properties from background threads.

```csharp
// Safe to call from any thread
Task.Run(() => this.DateTime = DateTime.Now);
```

### Key Patterns
- **Property change notification**: INotifyPropertyChanged + OnPropertyChanged
- **Binding context**: View.BindingContext = viewmodel instance
- **Two-way binding**: Default for inputs (Slider, Entry, etc.)
- **One-way binding**: Default for display (Label.Text)
- **Commands**: ICommand for button/gesture handlers
- **CanExecute**: Disable button when command cannot execute
- **Thread-safe updates**: Binding engine handles UI thread marshaling

---

## Community Toolkit.Mvvm

### ObservableObject (Replaces INotifyPropertyChanged boilerplate)
```csharp
using CommunityToolkit.Mvvm.ComponentModel;

public class MyViewModel : ObservableObject
{
    private string _name;

    public string Name
    {
        get => _name;
        set => SetProperty(ref _name, value);
    }
}
```

### Source Generators with [ObservableProperty]
```csharp
using CommunityToolkit.Mvvm.ComponentModel;

public partial class MyViewModel : ObservableObject
{
    [ObservableProperty]
    private string name;

    [ObservableProperty]
    private int count;
}
// Generates Name and Count properties automatically
```

### RelayCommand
```csharp
using CommunityToolkit.Mvvm.Input;

public partial class MyViewModel : ObservableObject
{
    [RelayCommand]
    public void DoSomething()
    {
        // Logic here
    }

    [RelayCommand]
    private async Task RefreshData()
    {
        // Async logic
    }
}
// Generates DoSomethingCommand and RefreshDataCommand automatically
```

### Messaging (Decoupled Communication)
```csharp
using CommunityToolkit.Mvvm.Messaging;

// Send message
WeakReferenceMessenger.Default.Send(new MyMessage("data"));

// Receive message
public partial class ReceivingVM : ObservableObject, IRecipient<MyMessage>
{
    public ReceivingVM()
    {
        WeakReferenceMessenger.Default.RegisterAll(this);
    }

    public void Receive(MyMessage message)
    {
        // Handle message
    }
}
```

### IoC Container
```csharp
using CommunityToolkit.Mvvm.DependencyInjection;

// Setup
Ioc.Default.ConfigureServices(
    new ServiceCollection()
        .AddSingleton<MyViewModel>()
        .BuildServiceProvider());

// Use
var viewModel = Ioc.Default.GetRequiredService<MyViewModel>();
```

### Toolkit Components
- **ObservableObject**: Base class for ViewModels
- **ObservableValidator**: Property validation
- **ObservableRecipient**: Combine messaging + observable
- **RelayCommand & AsyncRelayCommand**: Simplified commands
- **WeakReferenceMessenger & StrongReferenceMessenger**: Decoupled pub/sub
- **Ioc**: Lightweight dependency injection

---

## Data API Builder (DAB)

### Overview
- **Purpose**: Configuration-based engine for REST/GraphQL APIs
- **Configuration**: Single JSON file (zero custom code)
- **Deployment**: Docker, Kubernetes, Azure Container Services, on-premises
- **Licensing**: MIT open source, free tier (no premium)

### Supported Databases
- SQL Server / Azure SQL Database
- PostgreSQL
- MySQL
- Azure Cosmos DB
- SQL Data Warehouse

### Key Features
- REST and GraphQL endpoints simultaneously
- Data pagination, filtering, sorting
- Column selection (partial responses)
- Stored procedure support
- Relationship navigation
- Aggregation (SQL family)
- OData-like query parameters
- In-memory caching
- Hot configuration reloading

### Architecture
```
Database Schema
    ↓
DAB Configuration File (dab-config.json)
    ↓
Entity Abstraction Layer
    - Named entities
    - Field aliasing
    - Relationships (real or virtual)
    - Role-based access
    ↓
REST & GraphQL Endpoints
    - Identical data model
    - Different query syntax
    - Same authorization
```

### Configuration File Structure
```json
{
  "runtime": {
    "rest": { "enabled": true },
    "graphql": { "enabled": true }
  },
  "data-source": {
    "database-type": "mssql",
    "connection-string": "..."
  },
  "entities": {
    "Todo": {
      "source": "dbo.TodoItems",
      "permissions": [
        {
          "role": "authenticated",
          "actions": ["*"]
        }
      ]
    }
  }
}
```

### Authentication Providers
| Provider | Use Case |
|----------|----------|
| Microsoft Entra ID | Production apps with Azure identity |
| Custom JWT | Third-party identity (Okta, Auth0, Keycloak) |
| App Service EasyAuth | Apps behind Azure App Service |
| Simulator | Local dev/testing |

### Security Features
- Granular permission controls per entity/operation
- Claims passed to SQL session context
- Stateless container design
- Policy engine for complex rules
- Role-based access control

### Deployment Options
- Azure Container Apps
- Azure Container Instances
- Azure Kubernetes Service (AKS)
- Azure Web App for Containers
- Docker (any infrastructure)

### Model Context Protocol (MCP)
DAB supports MCP (v1.7+) for agent apps with same rich functionality as REST/GraphQL

---

## Pattern Overlap: MAUI vs Blazor

### Shared Patterns

| Pattern | .NET MAUI | Blazor | Notes |
|---------|-----------|--------|-------|
| **MVVM** | INotifyPropertyChanged | INotifyPropertyChanged | Identical pattern |
| **Data Binding** | XAML bindings | @bind directive | Both two-way capable |
| **REST Consumption** | HttpClient | HttpClient | Same API |
| **JSON Serialization** | System.Text.Json | System.Text.Json | Identical |
| **Async/await** | Native | Native | Both async-first |
| **Dependency Injection** | ServiceCollection | ServiceCollection | Same DI container |
| **Repository Pattern** | Used for DB access | Can be used for APIs | Clean architecture |
| **Commands** | ICommand + Relay | EventCallback | Similar intent |
| **UI Threading** | Auto-marshaled | Auto-rendered on sync context | Different but equivalent |
| **Community Toolkit** | Full support | Full support | Observable + Commands |

### Differences
- **MAUI**: Local-first with SQLite, navigation model for pages
- **Blazor**: Server/client split, component-based, render modes (Server vs WASM vs Auto)
- **MAUI**: Shell for app structure; Blazor uses Layout/Router
- **Storage**: MAUI has FileSystem API; Blazor uses browser storage or server session

---

## Recommended Learning Path

1. **Start with SQLite** (Local Data) — Foundational for offline-first apps
2. **Add REST API** consumption — How to fetch/sync from server
3. **Master Shell Navigation** — App structure and routing
4. **Implement MVVM** with INotifyPropertyChanged — How data flows view↔viewmodel
5. **Upgrade with Community Toolkit** — Modern ObservableObject and RelayCommand
6. **Consider Data API Builder** — If building backend-agnostic mobile app against SQL database

---

## Key Takeaways for Blazor Developers

1. **MVVM pattern is identical** — Fully transferable knowledge
2. **Data binding syntax is different** (XAML vs Razor) but concept is the same
3. **REST consumption identical** — Use HttpClient the same way
4. **Async/await first-class** in both frameworks
5. **SQLite is .NET MAUI's answer to browser storage** — Similar offline persistence
6. **Shell navigation ≈ Blazor routing** — Both URI-based, both support parameters
7. **Community Toolkit works everywhere** — Use ObservableObject in both MAUI and Blazor

---

## References

- [.NET MAUI SQLite Documentation](https://learn.microsoft.com/en-us/dotnet/maui/data-cloud/database-sqlite?view=net-maui-10.0)
- [.NET MAUI REST API Documentation](https://learn.microsoft.com/en-us/dotnet/maui/data-cloud/rest?view=net-maui-10.0)
- [.NET MAUI Shell Navigation](https://learn.microsoft.com/en-us/dotnet/maui/fundamentals/shell/navigation?view=net-maui-10.0)
- [.NET MAUI MVVM & Data Binding](https://learn.microsoft.com/en-us/dotnet/maui/xaml/fundamentals/mvvm?view=net-maui-10.0)
- [Data API Builder Overview](https://learn.microsoft.com/en-us/azure/data-api-builder/overview)
- [Community Toolkit MVVM](https://learn.microsoft.com/en-us/dotnet/communitytoolkit/mvvm/)
