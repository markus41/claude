---
name: ASP.NET Core 10 Comprehensive Research - 6 Key Topics
description: Complete guidance on Blazor data binding, SignalR, gRPC, Razor Pages testing, SPA vs Traditional Web Apps, and AI chat applications
type: reference
date: 2026-03-29
---

# ASP.NET Core 10 & .NET AI Comprehensive Research Guide

**Coverage**: 6 official Microsoft documentation topics with code examples, decision matrices, and architectural guidance.
**Last Updated**: 2026-03-29
**Documentation Version**: ASP.NET Core 10.0, .NET 8.0+

---

## 1. Blazor Component Data Binding

### Overview
Blazor provides multiple approaches to bind data between components, from properties and parameter, to HTML form inputs.

### Key Binding Patterns

#### Property Binding (One-Way)
```razor
<!-- Component parameter: one-way down the component tree -->
<input type="text" value="@ParentValue" />

<!-- Rendered HTML -->
<input type="text" value="someValue" />
```

**C# Code Behind:**
```csharp
[Parameter]
public string ParentValue { get; set; }
```

#### Event Binding
```razor
<!-- Button click events -->
<button @onclick="HandleClick">Click Me</button>
<button @onclick="@((e) => HandleClickWithArg(e))">Arg Click</button>

<!-- Input events (change, input) -->
<input type="text" @onchange="HandleChange" />
<textarea @oninput="HandleInput"></textarea>

<!-- Keyboard events -->
<input type="text" @onkeydown="HandleKeyDown" />
<input type="text" @onkeyup="HandleKeyUp" />

<!-- Mouse events -->
<div @onmouseenter="HandleMouseEnter" @onmouseleave="HandleMouseLeave">
    Hover zone
</div>

<!-- Focus events -->
<input type="text" @onfocus="HandleFocus" @onblur="HandleBlur" />
```

**C# Event Handlers:**
```csharp
private void HandleClick()
{
    // Handle click
}

private void HandleClickWithArg(MouseEventArgs e)
{
    Console.WriteLine($"X: {e.ClientX}, Y: {e.ClientY}");
}

private void HandleChange(ChangeEventArgs e)
{
    string newValue = e.Value?.ToString();
}

private void HandleInput(ChangeEventArgs e)
{
    // Fires on every keystroke
    CurrentValue = e.Value?.ToString();
}

private void HandleKeyDown(KeyboardEventArgs e)
{
    if (e.Key == "Enter") { /* ... */ }
}
```

#### Two-Way Binding (@bind)
```razor
<!-- Simple two-way binding -->
<input type="text" @bind="UserName" />
<p>Entered: @UserName</p>

<!-- Bind with get/set -->
<input type="checkbox" @bind="IsChecked" />

<!-- Bind to event (custom event) -->
<input type="text" @bind:get="CurrentValue" @bind:set="SetValue" />

<!-- Bind with debounce (delay updates) -->
<input type="text" @bind="FilterText" @bind:event="onchange" />

<!-- Bind to multiple properties -->
<input type="text" @bind="Employee.FirstName" />
<input type="text" @bind="Employee.LastName" />
```

**C# Code Behind:**
```csharp
private string UserName { get; set; } = "";
private bool IsChecked { get; set; }
private string CurrentValue { get; set; } = "";

private void SetValue(string value)
{
    CurrentValue = value;
    // Custom logic when value changes
}

private Employee Employee { get; set; } = new();

public class Employee
{
    public string FirstName { get; set; } = "";
    public string LastName { get; set; } = "";
}
```

#### Form Binding (EditForm with Validation)
```razor
@page "/form-binding"
@using System.ComponentModel.DataAnnotations

<EditForm Model="@Person" OnValidSubmit="@HandleValidSubmit">
    <DataAnnotationsValidator />
    <ValidationSummary />

    <div class="form-group">
        <label for="firstName">First Name:</label>
        <InputText id="firstName" @bind-Value="Person.FirstName" />
        <ValidationMessage For="@(() => Person.FirstName)" />
    </div>

    <div class="form-group">
        <label for="age">Age:</label>
        <InputNumber id="age" @bind-Value="Person.Age" />
        <ValidationMessage For="@(() => Person.Age)" />
    </div>

    <div class="form-group">
        <label for="email">Email:</label>
        <InputEmail id="email" @bind-Value="Person.Email" />
        <ValidationMessage For="@(() => Person.Email)" />
    </div>

    <div class="form-group">
        <label for="country">Country:</label>
        <InputSelect id="country" @bind-Value="Person.CountryId">
            <option value="">-- Select Country --</option>
            @foreach (var country in Countries)
            {
                <option value="@country.Id">@country.Name</option>
            }
        </InputSelect>
    </div>

    <button type="submit">Submit</button>
</EditForm>

@code {
    private Person Person { get; set; } = new();
    private List<Country> Countries { get; set; } = new();

    protected override async Task OnInitializedAsync()
    {
        Countries = await LoadCountries();
    }

    private async Task HandleValidSubmit()
    {
        // Model is valid, process form
        await SavePerson(Person);
    }

    public class Person
    {
        [Required]
        [StringLength(50)]
        public string FirstName { get; set; } = "";

        [Range(18, 120)]
        public int Age { get; set; }

        [EmailAddress]
        public string Email { get; set; } = "";

        public int CountryId { get; set; }
    }

    public class Country
    {
        public int Id { get; set; }
        public string Name { get; set; } = "";
    }
}
```

#### Child Component Parameter Binding
```razor
<!-- Parent Component -->
@page "/parent-binding"

<ChildComponent
    Name="@ParentName"
    OnNameChanged="@HandleNameChanged">
</ChildComponent>

@code {
    private string ParentName = "Initial Value";

    private void HandleNameChanged(string newName)
    {
        ParentName = newName;
    }
}

<!-- Child Component (ChildComponent.razor) -->
@if (!string.IsNullOrEmpty(Name))
{
    <p>Received: @Name</p>
}

<button @onclick="NotifyParent">Change Parent Value</button>

@code {
    [Parameter]
    public string Name { get; set; } = "";

    [Parameter]
    public EventCallback<string> OnNameChanged { get; set; }

    private async Task NotifyParent()
    {
        await OnNameChanged.InvokeAsync("New Value from Child");
    }
}
```

### Binding Decision Matrix

| Scenario | Binding Type | Use Case |
|----------|--------------|----------|
| Simple display | `@Value` (no binding) | Read-only display of data |
| One-way parameter | `[Parameter] public T Value` | Parent → Child |
| Two-way sync | `@bind="Property"` | Form fields, checkboxes, dropdowns |
| Custom two-way | `@bind:get / @bind:set` | Custom property with validation logic |
| Form validation | `<EditForm> + InputX + ValidationX` | Complex forms with error messages |
| Event-driven | `@on{Event}="Handler"` | Respond to user actions without state sync |
| Cascading parameters | `<CascadingValue Value="@Data">` | Pass data deep in component tree |

---

## 2. SignalR - Real-Time Communication

### What is SignalR?

ASP.NET Core SignalR is a library for adding real-time web functionality. It enables server-to-client RPC (Remote Procedure Calls), allowing the server to instantly push data to connected clients.

**Key Features:**
- Handles connection management automatically
- Broadcast to all clients or specific clients/groups
- Supports WebSockets, Server-Sent Events, Long Polling (automatic fallback)
- Strongly-typed communication with JSON or MessagePack protocols
- Built-in hub pattern for bidirectional communication

### Best Use Cases

1. **Gaming** — Real-time game state, player positions, game events
2. **Dashboards & Monitoring** — Live metric updates, alerts, status changes
3. **Collaborative Apps** — Shared whiteboards, document editing, live comments
4. **Notifications** — Real-time alerts, system notifications, chat messages
5. **Stock Tickers** — Live price feeds, market data updates
6. **Live Voting/Auctions** — Real-time vote counts, bid updates

### SignalR Hub Definition

```csharp
// Server-side Hub
using Microsoft.AspNetCore.SignalR;

public class ChatHub : Hub
{
    // Called when client connects
    public override async Task OnConnectedAsync()
    {
        Console.WriteLine($"Client connected: {Context.ConnectionId}");
        await base.OnConnectedAsync();
    }

    // Called when client disconnects
    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        Console.WriteLine($"Client disconnected: {Context.ConnectionId}");
        await base.OnDisconnectedAsync(exception);
    }

    // Client calls this method (RPC from client to server)
    public async Task SendMessage(string user, string message)
    {
        // Broadcast to all connected clients
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    // Send to specific client
    public async Task SendPrivateMessage(string targetConnectionId, string message)
    {
        await Clients.Client(targetConnectionId).SendAsync("ReceivePrivateMessage", message);
    }

    // Send to all except caller
    public async Task BroadcastExcept(string message)
    {
        await Clients.Others.SendAsync("ReceiveMessage", message);
    }

    // Join a group
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserJoinedGroup", Context.ConnectionId);
    }

    // Send to group
    public async Task SendToGroup(string groupName, string message)
    {
        await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", message);
    }

    // Leave group
    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    // Send to groups except caller
    public async Task SendToGroupExcept(string groupName, string message)
    {
        await Clients.GroupExcept(groupName, Context.ConnectionId)
            .SendAsync("ReceiveMessage", message);
    }
}
```

### Server Configuration (Program.cs)

```csharp
var builder = WebApplication.CreateBuilder(args);

// Add SignalR services
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        // Configure JSON serialization
        options.PayloadSerializationOptions.PropertyNamingPolicy = null;
    });

var app = builder.Build();

// Configure middleware
app.UseRouting();

app.MapSignalRHub<ChatHub>("/chatHub");
// Or map to custom route:
// app.MapHub<ChatHub>("/hubs/chat");

app.Run();
```

### Client-Side JavaScript

```javascript
// Create connection to hub
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .build();

// Client method: server calls this
connection.on("ReceiveMessage", (user, message) => {
    const msg = `${user}: ${message}`;
    document.getElementById("messages").innerHTML += `<li>${msg}</li>`;
});

connection.on("ReceiveGroupMessage", (message) => {
    console.log("Group message:", message);
});

// Call server method
async function sendMessage(user, message) {
    await connection.invoke("SendMessage", user, message)
        .catch(err => console.error(err));
}

// Join group
async function joinGroup(groupName) {
    await connection.invoke("JoinGroup", groupName)
        .catch(err => console.error(err));
}

// Start connection
connection.start()
    .catch(err => console.error(err));

// Handle disconnect/reconnect
connection.onreconnecting((error) => {
    console.log("Attempting to reconnect...");
});

connection.onreconnected((connectionId) => {
    console.log("Reconnected with ID:", connectionId);
});

connection.onclose((error) => {
    console.log("Connection closed");
});
```

### Blazor Client Integration

```razor
@page "/chat"
@using Microsoft.AspNetCore.SignalR.Client
@implements IAsyncDisposable

<div>
    <input type="text" @bind="UserName" placeholder="Your name" />
    <input type="text" @bind="MessageText" @onkeypress="OnKeyPress" placeholder="Message" />
    <button @onclick="SendMessage">Send</button>
</div>

<div>
    <h3>Messages</h3>
    <ul>
        @foreach (var msg in Messages)
        {
            <li>@msg.User: @msg.Text</li>
        }
    </ul>
</div>

@code {
    private HubConnection? HubConnection;
    private List<ChatMessage> Messages = new();
    private string UserName = "";
    private string MessageText = "";

    protected override async Task OnInitializedAsync()
    {
        HubConnection = new HubConnectionBuilder()
            .WithUrl(NavigationManager.ToAbsoluteUri("/chatHub"))
            .WithAutomaticReconnect()
            .Build();

        HubConnection.On<string, string>("ReceiveMessage", (user, message) =>
        {
            Messages.Add(new ChatMessage { User = user, Text = message });
            InvokeAsync(StateHasChanged);
        });

        await HubConnection.StartAsync();
    }

    private async Task SendMessage()
    {
        if (HubConnection is not null)
        {
            await HubConnection.SendAsync("SendMessage", UserName, MessageText);
            MessageText = "";
        }
    }

    private async Task OnKeyPress(KeyboardEventArgs e)
    {
        if (e.Key == "Enter")
        {
            await SendMessage();
        }
    }

    async ValueTask IAsyncDisposable.DisposeAsync()
    {
        if (HubConnection is not null)
        {
            await HubConnection.DisposeAsync();
        }
    }

    public class ChatMessage
    {
        public string User { get; set; }
        public string Text { get; set; }
    }
}
```

### Transport Selection

SignalR automatically selects the best transport:

1. **WebSockets** — Preferred, true bidirectional communication
2. **Server-Sent Events (SSE)** — Server → Client only, client uses HTTP polling
3. **Long Polling** — Fallback, HTTP polling with delays

Use `WithUrl()` to configure:

```csharp
HubConnection = new HubConnectionBuilder()
    .WithUrl("/chatHub", options =>
    {
        // Explicitly choose transports
        options.Transports = HttpTransportType.WebSockets | HttpTransportType.ServerSentEvents;

        // Configure reconnection
        options.AutomaticReconnectPolicy = new DefaultHttpRetryPolicy();
    })
    .Build();
```

---

## 3. gRPC - High-Performance RPC Framework

### What is gRPC?

gRPC is a language-agnostic, high-performance RPC framework using Protocol Buffers (protobuf) for serialization. It's built on HTTP/2 and provides:

- **High Performance**: Binary serialization, reduced payload size
- **Strongly Typed**: Contract-first API design with code generation
- **Language Agnostic**: Services in any language that supports gRPC
- **Streaming**: Unary, server streaming, client streaming, bidirectional streaming

### gRPC vs HTTP/REST Decision Matrix

| Aspect | gRPC | REST/HTTP |
|--------|------|----------|
| **Serialization** | Protocol Buffers (binary) | JSON (text) |
| **Protocol** | HTTP/2 | HTTP/1.1 or HTTP/2 |
| **Payload Size** | Small, compressed | Larger, human-readable |
| **Latency** | Low (~10x faster) | Higher |
| **Browser Support** | Limited (gRPC-Web) | Full |
| **Code Gen** | Automatic (contract-first) | Manual or schema-based |
| **Streaming** | Native, bidirectional | Limited, requires polling |
| **SEO/Discovery** | No | Yes (URLs are self-documenting) |
| **Debugging** | Binary (harder) | Easy (HTTP tools) |
| **Use Case** | Microservices, real-time | Public APIs, web browsers |

### Proto File Definition

```protobuf
// greet.proto
syntax = "proto3";

package greet;

service Greeter {
  rpc SayHello (HelloRequest) returns (HelloReply);
  rpc SayHelloStream (HelloRequest) returns (stream HelloReply);
  rpc LotsOfReplies (HelloRequest) returns (stream HelloReply);
  rpc LotsOfGreetings (stream HelloRequest) returns (HelloReply);
  rpc BidiHello (stream HelloRequest) returns (stream HelloReply);
}

message HelloRequest {
  string name = 1;
  string greeting = 2;
}

message HelloReply {
  string message = 1;
}
```

### Server Implementation

**Add Proto File to Project (**.csproj**)**:
```xml
<ItemGroup>
  <Protobuf Include="Protos\greet.proto" />
</ItemGroup>
```

**NuGet Packages**:
```bash
dotnet add package Grpc.AspNetCore
dotnet add package Grpc.Tools
```

**Service Implementation**:
```csharp
using Grpc.Core;
using GrpcService.Protos;

public class GreeterService : Greeter.GreeterBase
{
    private readonly ILogger<GreeterService> _logger;

    public GreeterService(ILogger<GreeterService> logger)
    {
        _logger = logger;
    }

    // Unary RPC (single request, single response)
    public override Task<HelloReply> SayHello(HelloRequest request, ServerCallContext context)
    {
        _logger.LogInformation("Saying hello to {Name}", request.Name);
        return Task.FromResult(new HelloReply
        {
            Message = $"Hello {request.Name}, {request.Greeting}!"
        });
    }

    // Server streaming RPC (single request, stream of responses)
    public override async Task SayHelloStream(HelloRequest request, IServerStreamWriter<HelloReply> responseStream, ServerCallContext context)
    {
        for (int i = 0; i < 3; i++)
        {
            await responseStream.WriteAsync(new HelloReply
            {
                Message = $"Hello {request.Name} #{i + 1}"
            });
            await Task.Delay(1000);
        }
    }

    // Client streaming RPC (stream of requests, single response)
    public override async Task<HelloReply> LotsOfGreetings(IAsyncStreamReader<HelloRequest> requestStream, ServerCallContext context)
    {
        var count = 0;
        await foreach (var request in requestStream.ReadAllAsync())
        {
            _logger.LogInformation("Received greeting from {Name}", request.Name);
            count++;
        }
        return new HelloReply
        {
            Message = $"Processed {count} greetings"
        };
    }

    // Bidirectional streaming RPC (stream requests, stream responses)
    public override async Task BidiHello(IAsyncStreamReader<HelloRequest> requestStream, IServerStreamWriter<HelloReply> responseStream, ServerCallContext context)
    {
        await foreach (var request in requestStream.ReadAllAsync())
        {
            _logger.LogInformation("Received: {Name}", request.Name);
            await responseStream.WriteAsync(new HelloReply
            {
                Message = $"Echo: {request.Name}"
            });
        }
    }
}
```

**Program.cs Configuration**:
```csharp
var builder = WebApplication.CreateBuilder(args);

builder.Services.AddGrpc();

var app = builder.Build();

app.MapGrpcService<GreeterService>();
app.Run();
```

### Client Implementation

```csharp
using Grpc.Net.Client;
using GrpcService.Protos;

// Create channel (long-lived connection)
var channel = GrpcChannel.ForAddress("https://localhost:5001");
var client = new Greeter.GreeterClient(channel);

// Unary call
var reply = await client.SayHelloAsync(new HelloRequest { Name = "World", Greeting = "Hi" });
Console.WriteLine(reply.Message);

// Server streaming
using (var call = client.SayHelloStream(new HelloRequest { Name = "Alice" }))
{
    await foreach (var message in call.ResponseStream.ReadAllAsync())
    {
        Console.WriteLine(message.Message);
    }
}

// Client streaming
using (var call = client.LotsOfGreetings())
{
    for (int i = 0; i < 5; i++)
    {
        await call.RequestStream.WriteAsync(new HelloRequest { Name = $"User{i}" });
    }
    await call.RequestStream.CompleteAsync();
    var response = await call.ResponseAsync;
    Console.WriteLine(response.Message);
}

// Bidirectional streaming
using (var call = client.BidiHello())
{
    var sendTask = Task.Run(async () =>
    {
        for (int i = 0; i < 3; i++)
        {
            await call.RequestStream.WriteAsync(new HelloRequest { Name = $"Msg{i}" });
            await Task.Delay(500);
        }
        await call.RequestStream.CompleteAsync();
    });

    await foreach (var message in call.ResponseStream.ReadAllAsync())
    {
        Console.WriteLine(message.Message);
    }
    await sendTask;
}
```

### When to Use gRPC

**Use gRPC when:**
- Building microservices (internal, service-to-service)
- Performance is critical (low latency, high throughput)
- Streaming is required (real-time data)
- Using .NET, Java, Go, Python (polyglot systems)
- You control both client and server

**Don't use gRPC for:**
- Public-facing APIs (use REST/HTTP)
- Browser-based clients (use gRPC-Web)
- Simple CRUD operations (REST is simpler)
- Legacy system integration

---

## 4. Razor Pages Unit Testing

### Testing Architecture

Razor Pages testing involves three layers:

1. **Data Access Layer (DAL)** — Test database operations
2. **Page Models** — Test page logic, handlers (OnGet, OnPost, etc.)
3. **Integration Tests** — Test full request/response cycle

### Test Setup & Utilities

**Fresh Database per Test (xUnit with EF Core InMemory):**

```csharp
public static class Utilities
{
    public static DbContextOptions<AppDbContext> TestDbContextOptions()
    {
        // Create new service provider for each test to get fresh database
        var serviceProvider = new ServiceCollection()
            .AddEntityFrameworkInMemoryDatabase()
            .BuildServiceProvider();

        var builder = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryDb")
            .UseInternalServiceProvider(serviceProvider);

        return builder.Options;
    }
}
```

### DAL Unit Tests

```csharp
using Xunit;
using MyRazorApp.Data;

public class DataAccessLayerTests
{
    [Fact]
    public async Task DeleteMessageAsync_MessageIsDeleted_WhenMessageIsFound()
    {
        using (var db = new AppDbContext(Utilities.TestDbContextOptions()))
        {
            // Arrange
            var seedMessages = new List<Message>
            {
                new Message { Id = 1, Text = "Message 1" },
                new Message { Id = 2, Text = "Message 2" },
                new Message { Id = 3, Text = "Message 3" }
            };
            await db.AddRangeAsync(seedMessages);
            await db.SaveChangesAsync();

            // Act
            await db.DeleteMessageAsync(1);

            // Assert
            var actualMessages = await db.Messages.AsNoTracking().ToListAsync();
            Assert.Equal(2, actualMessages.Count);
            Assert.DoesNotContain(actualMessages, m => m.Id == 1);
        }
    }

    [Fact]
    public async Task AddMessageAsync_AddsMessage_WhenMessageIsValid()
    {
        using (var db = new AppDbContext(Utilities.TestDbContextOptions()))
        {
            // Arrange
            var newMessage = new Message { Id = 1, Text = "New Message" };

            // Act
            await db.AddMessageAsync(newMessage);

            // Assert
            var message = await db.Messages.FirstAsync(m => m.Id == 1);
            Assert.Equal("New Message", message.Text);
        }
    }

    [Fact]
    public async Task GetMessagesAsync_ReturnsAllMessages_InSortedOrder()
    {
        using (var db = new AppDbContext(Utilities.TestDbContextOptions()))
        {
            // Arrange
            await db.AddRangeAsync(
                new Message { Id = 3, Text = "C" },
                new Message { Id = 1, Text = "A" },
                new Message { Id = 2, Text = "B" }
            );
            await db.SaveChangesAsync();

            // Act
            var messages = await db.GetMessagesAsync();

            // Assert
            Assert.Equal(3, messages.Count);
            Assert.Equal("A", messages[0].Text);
            Assert.Equal("B", messages[1].Text);
            Assert.Equal("C", messages[2].Text);
        }
    }
}
```

### Page Model Unit Tests (with Mocking)

```csharp
using Moq;
using Xunit;
using MyRazorApp.Data;
using MyRazorApp.Pages;
using Microsoft.AspNetCore.Mvc.RazorPages;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;

public class IndexPageTests
{
    [Fact]
    public async Task OnGetAsync_PopulatesPageModel_WithMessages()
    {
        // Arrange
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryDb");

        var mockDb = new Mock<AppDbContext>(optionsBuilder.Options);
        var expectedMessages = new List<Message>
        {
            new Message { Id = 1, Text = "Hello" },
            new Message { Id = 2, Text = "World" }
        };

        mockDb.Setup(db => db.GetMessagesAsync())
            .Returns(Task.FromResult(expectedMessages));

        var pageModel = new IndexModel(mockDb.Object);

        // Act
        await pageModel.OnGetAsync();

        // Assert
        var actualMessages = Assert.IsAssignableFrom<List<Message>>(pageModel.Messages);
        Assert.Equal(2, actualMessages.Count);
        Assert.Equal("Hello", actualMessages[0].Text);
    }

    [Fact]
    public async Task OnPostAddMessageAsync_ReturnsPageResult_WhenModelStateIsInvalid()
    {
        // Arrange
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryDb");
        var mockDb = new Mock<AppDbContext>(optionsBuilder.Options);

        var httpContext = new DefaultHttpContext();
        var modelState = new ModelStateDictionary();
        var actionContext = new ActionContext(httpContext, new RouteData(), new PageActionDescriptor(), modelState);
        var modelMetadataProvider = new EmptyModelMetadataProvider();
        var viewData = new ViewDataDictionary(modelMetadataProvider, modelState);
        var tempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());
        var pageContext = new PageContext(actionContext) { ViewData = viewData };

        var pageModel = new IndexModel(mockDb.Object)
        {
            PageContext = pageContext,
            TempData = tempData,
            Url = new UrlHelper(actionContext)
        };

        // Add validation error
        pageModel.ModelState.AddModelError("Message.Text", "The Text field is required.");

        // Act
        var result = await pageModel.OnPostAddMessageAsync();

        // Assert
        Assert.IsType<PageResult>(result);
        mockDb.Verify(db => db.AddMessageAsync(It.IsAny<Message>()), Times.Never);
    }

    [Fact]
    public async Task OnPostAddMessageAsync_CallsAddMessageAsync_WhenModelStateIsValid()
    {
        // Arrange
        var optionsBuilder = new DbContextOptionsBuilder<AppDbContext>()
            .UseInMemoryDatabase("InMemoryDb");
        var mockDb = new Mock<AppDbContext>(optionsBuilder.Options);
        mockDb.Setup(db => db.AddMessageAsync(It.IsAny<Message>()))
            .Returns(Task.CompletedTask);
        mockDb.Setup(db => db.GetMessagesAsync())
            .Returns(Task.FromResult(new List<Message>()));

        var httpContext = new DefaultHttpContext();
        var modelState = new ModelStateDictionary();
        var actionContext = new ActionContext(httpContext, new RouteData(), new PageActionDescriptor(), modelState);
        var modelMetadataProvider = new EmptyModelMetadataProvider();
        var viewData = new ViewDataDictionary(modelMetadataProvider, modelState);
        var tempData = new TempDataDictionary(httpContext, Mock.Of<ITempDataProvider>());
        var pageContext = new PageContext(actionContext) { ViewData = viewData };

        var pageModel = new IndexModel(mockDb.Object)
        {
            PageContext = pageContext,
            TempData = tempData,
            Url = new UrlHelper(actionContext),
            Message = new Message { Text = "Test Message" }
        };

        // Act
        var result = await pageModel.OnPostAddMessageAsync();

        // Assert
        mockDb.Verify(db => db.AddMessageAsync(It.Is<Message>(m => m.Text == "Test Message")), Times.Once);
        Assert.IsType<RedirectToPageResult>(result);
    }
}
```

### Key Testing Patterns

| Pattern | Purpose | Example |
|---------|---------|---------|
| **Arrange-Act-Assert** | Test structure | Setup data → Execute → Verify results |
| **Fresh DB per test** | Test isolation | Use `TestDbContextOptions()` |
| **In-Memory DB** | Fast, isolated | `UseInMemoryDatabase()` |
| **Mocking DAL** | Test page logic independently | `Mock<AppDbContext>` |
| **ModelState validation** | Test form validation | `AddModelError()` then assert |
| **PageContext setup** | Simulate page request | Create `DefaultHttpContext`, `PageContext` |

---

## 5. Traditional Web Apps vs Single-Page Apps vs Blazor

### Decision Matrix

| **Factor** | **Traditional Web App** | **Single-Page App (SPA)** | **Blazor** |
|---|---|---|---|
| **JavaScript Required** | No | Yes | No (uses .NET) |
| **SEO-Friendly** | Yes (default) | Limited (requires special setup) | Yes (server-rendered) |
| **Learning Curve** | Moderate | Steep (JS frameworks + state management) | Moderate (.NET + Razor) |
| **Rich UI** | Limited | Excellent | Excellent |
| **Performance** | Good (full page loads) | Excellent (no page reloads) | Good (depends on render mode) |
| **Build Complexity** | Simple | Complex (bundling, transpiling) | Moderate |
| **State Management** | Server-side (sessions) | Client-side (Redux, Vuex, etc.) | Hybrid (server or client) |
| **Offline Support** | Limited | Good (service workers) | Good (Blazor WASM) |
| **Code Reuse** | Limited | Share JS libraries | Share .NET libraries |
| **Team .NET Skills** | Required | Not required | Leveraged |
| **Team JS Skills** | Not required | Required | Not required |

### Use Traditional Web Apps When

**✓ Client-side requirements are simple or read-only**
```
- Blog sites, documentation
- Content management systems
- News websites
- Simple forms
```

**✓ Browser compatibility is critical (no JS support)**
```
- Legacy browser support
- Government/corporate environments
```

**✓ SEO is primary concern**
```
- Public-facing content sites
- E-commerce product pages
- Marketing sites
```

**✓ Team is more familiar with server-side development**

**Example Architecture:**
```
Browser → HTTP Request
     ↓
Server (ASP.NET Core)
  - Razor Pages
  - Render HTML
  - Handle forms
     ↓
HTTP Response (HTML)
```

### Use Single-Page Apps (SPA) When

**✓ Rich, responsive user interface needed**
```
- Real-time dashboards
- Complex data visualization
- Collaborative tools
- Desktop-like experiences
```

**✓ Frequent API calls with minimal page reloads**

**✓ Team has strong JavaScript/TypeScript skills**

**✓ Already building a backend API**
```
- Mobile apps also use same API
- Third-party integrations
```

**Frameworks:** Angular, React, Vue.js, Svelte

**Example Architecture:**
```
Browser (React App) ←→ REST/GraphQL API
  - Client-side routing
  - State management
  - Form handling
     ↑↓
Server (API only)
  - JSON endpoints
  - Business logic
  - Database
```

### Use Blazor When

**✓ Need rich UI without deep JavaScript expertise**
- Use .NET instead of JS/TS
- Reuse .NET libraries
- Share code between server and client

**✓ Team is primarily .NET developers**
- C# and Razor on the frontend
- No JS/TS learning curve

**✓ Need both server and client-side benefits**
- Server rendering for SEO/performance
- Client-side interactivity without JS
- Real-time updates with SignalR

**Render Modes (.NET 8+):**

1. **Static Server-Side Rendering (SSR)**
   ```
   Server generates HTML → Browser displays (no interactivity)
   Use: Static content, read-only pages
   ```

2. **Interactive Server (Blazor Server)**
   ```
   Browser ←→ SignalR ←→ Server
   Interactive, real-time, but requires persistent connection
   Use: Dashboards, real-time collaboration
   ```

3. **Interactive WebAssembly (Blazor WASM)**
   ```
   Browser (C# compiled to WebAssembly)
   Fully client-side, offline capable
   Use: Rich desktop-like experiences, offline support
   ```

4. **Interactive Auto**
   ```
   First load: Server-rendered
   Subsequent: Client-side WebAssembly
   Best of both worlds (fast initial load + client-side interactivity)
   Use: Most real-world Blazor apps
   ```

**Example Blazor Component:**
```razor
@page "/counter"
@rendermode InteractiveAuto

<PageTitle>Counter</PageTitle>

<h1>Counter</h1>

<p role="status">Current count: @currentCount</p>

<button class="btn btn-primary" @onclick="IncrementCount">
    Click me
</button>

@code {
    private int currentCount = 0;

    private void IncrementCount()
    {
        currentCount++;
    }
}
```

### Hybrid Approach

Combine traditional web app with SPA or Blazor:

```
Traditional Web App (main site)
└── Rich SPA/Blazor subapplication
    - Admin dashboard
    - Real-time notifications
    - Complex editor
```

**Example: ASP.NET Core Razor Pages + React admin panel**
```
/pages/ → Razor Pages (server-rendered, SEO-friendly)
/admin/ → React SPA (rich, interactive, no SEO needed)
```

---

## 6. Building AI Chat Applications with .NET

### Overview

Build AI-powered chat apps using **Microsoft.Extensions.AI** with OpenAI or Azure OpenAI. This abstracts the underlying AI service, allowing easy swaps between providers.

### Architecture

```
Application
    ↓
IChatClient (abstraction)
    ↓
OpenAI / Azure OpenAI SDK
    ↓
API (OpenAI / Azure)
```

### Setup & Installation

**Prerequisites:**
- .NET 8.0 SDK or higher
- OpenAI API key OR Azure OpenAI resource

**Create Console App:**
```bash
dotnet new console -o ChatAppAI
cd ChatAppAI
```

### OpenAI Setup

**Install Packages:**
```bash
dotnet add package OpenAI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Microsoft.Extensions.Configuration
dotnet add package Microsoft.Extensions.Configuration.UserSecrets
```

**Configure Secrets:**
```bash
dotnet user-secrets init
dotnet user-secrets set OpenAIKey <your-api-key>
dotnet user-secrets set ModelName gpt-4o
```

**Program.cs:**
```csharp
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using OpenAI;

// Load configuration
IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();

string modelName = config["ModelName"];
string apiKey = config["OpenAIKey"];

// Create chat client
IChatClient chatClient = new OpenAIClient(apiKey)
    .GetChatClient(modelName)
    .AsIChatClient();

// Start conversation
List<ChatMessage> chatHistory =
[
    new ChatMessage(ChatRole.System, """
        You are a helpful hiking advisor. Help users find great hiking trails.
        Ask for location and difficulty preference.
        Provide 3 hike recommendations with interesting local facts.
    """)
];

// Conversation loop
while (true)
{
    Console.Write("You: ");
    string? userInput = Console.ReadLine();

    if (string.IsNullOrWhiteSpace(userInput)) break;

    chatHistory.Add(new ChatMessage(ChatRole.User, userInput));

    // Stream response
    Console.Write("Assistant: ");
    string response = "";

    await foreach (ChatResponseUpdate update in
        chatClient.GetStreamingResponseAsync(chatHistory))
    {
        Console.Write(update.Text);
        response += update.Text;
    }

    chatHistory.Add(new ChatMessage(ChatRole.Assistant, response));
    Console.WriteLine();
}
```

### Azure OpenAI Setup

**Install Packages:**
```bash
dotnet add package Azure.Identity
dotnet add package Azure.AI.OpenAI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
```

**Configure Secrets:**
```bash
dotnet user-secrets init
dotnet user-secrets set AZURE_OPENAI_ENDPOINT https://your-resource.openai.azure.com/
dotnet user-secrets set AZURE_OPENAI_GPT_NAME gpt-4
dotnet user-secrets set AZURE_OPENAI_API_KEY your-key
```

**Program.cs:**
```csharp
using Azure.Identity;
using Azure.AI.OpenAI;
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;

IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();

string endpoint = config["AZURE_OPENAI_ENDPOINT"];
string deployment = config["AZURE_OPENAI_GPT_NAME"];

// Create chat client using DefaultAzureCredential (az login, env vars, etc.)
IChatClient chatClient = new AzureOpenAIClient(
    new Uri(endpoint),
    new DefaultAzureCredential()
)
.GetChatClient(deployment)
.AsIChatClient();

// Rest of conversation logic (same as OpenAI)
```

### Function Calling (Tool Use)

Enable the AI to call functions in your application:

```csharp
using Microsoft.Extensions.AI;

// Define functions the AI can call
var tools = new List<AITool>
{
    new AITool
    {
        Name = "get_weather",
        Description = "Get current weather for a location",
        Parameters = new
        {
            type = "object",
            properties = new
            {
                location = new { type = "string", description = "City name" },
                unit = new { type = "string", @enum = new[] { "celsius", "fahrenheit" } }
            },
            required = new[] { "location" }
        }
    },
    new AITool
    {
        Name = "calculate_distance",
        Description = "Calculate distance between two hikes",
        Parameters = new
        {
            type = "object",
            properties = new
            {
                from_hike = new { type = "string" },
                to_hike = new { type = "string" }
            },
            required = new[] { "from_hike", "to_hike" }
        }
    }
};

// Process conversation with tools
var chatHistory = new List<ChatMessage>
{
    new(ChatRole.System, "You are a hiking expert. Use tools when needed."),
    new(ChatRole.User, "What's the weather on Mount Rainier today?")
};

while (true)
{
    var response = await chatClient.CompleteAsync(
        chatHistory,
        new ChatOptions { Tools = tools }
    );

    // Check if AI wants to use a tool
    if (response.Content[0].Kind == ChatResponseContentKind.ToolCall)
    {
        var toolCall = (ChatToolCall)response.Content[0];

        // Execute the tool
        string result = toolCall.Name switch
        {
            "get_weather" => GetWeather(toolCall.Arguments),
            "calculate_distance" => CalculateDistance(toolCall.Arguments),
            _ => "Unknown tool"
        };

        // Add tool response to history
        chatHistory.Add(new(ChatRole.Assistant, response.Content));
        chatHistory.Add(new(ChatRole.Tool, result, toolCall.Id));
    }
    else
    {
        // AI provided final response
        var textContent = response.Content.OfType<TextContent>().FirstOrDefault();
        if (textContent != null)
        {
            Console.WriteLine($"Assistant: {textContent.Text}");
        }
        break;
    }
}

string GetWeather(IReadOnlyDictionary<string, object> args)
{
    var location = args["location"]?.ToString() ?? "Unknown";
    return $"Weather in {location}: Sunny, 72°F";
}

string CalculateDistance(IReadOnlyDictionary<string, object> args)
{
    return "Distance: 45 miles";
}
```

### Middleware & Advanced Patterns

**Caching Responses:**
```csharp
var chatClient = new OpenAIClient(apiKey)
    .GetChatClient(modelName)
    .AsIChatClient();

// Add caching middleware
var builder = new ChatClientBuilder(chatClient);
builder.UseFunctionInvocation(); // Enable function calling
// Add other middleware (caching, retry, logging, etc.)
var cachedClient = builder.Build();
```

**Streaming Responses:**
```csharp
await foreach (var update in chatClient.GetStreamingResponseAsync(messages))
{
    if (update.ContentUpdate is TextContentUpdate textUpdate)
    {
        Console.Write(textUpdate.Text);
    }
}
```

### Key Concepts

| Concept | Purpose | Example |
|---------|---------|---------|
| **ChatMessage** | Message in conversation | `new ChatMessage(ChatRole.User, "Hi")` |
| **ChatRole** | Message sender | System, User, Assistant, Tool |
| **ChatOptions** | Configuration | Temperature, max tokens, tools |
| **Streaming** | Real-time token output | `GetStreamingResponseAsync()` |
| **Tool Calling** | AI calls functions | Weather lookup, database query |
| **Message History** | Conversation context | Maintain list for multi-turn conversations |

---

## Summary & Quick Reference

### When to Use Each Technology

| Technology | Best For | Decision |
|-----------|----------|----------|
| **Blazor Data Binding** | Component state sync | Any Blazor component |
| **SignalR** | Real-time server→client push | Dashboards, chat, notifications |
| **gRPC** | High-performance microservices | Internal service-to-service |
| **Unit Testing** | Quality assurance | Always test before deployment |
| **Traditional Web App** | SEO, simple requirements | Public content sites |
| **SPA** | Rich interactivity | Complex web applications |
| **Blazor** | Rich UI + .NET skills | .NET-first organizations |
| **AI Chat** | Intelligent assistants | Customer support, recommendations |

### Key NuGet Packages

```bash
# Blazor & Web
dotnet add package Microsoft.AspNetCore.Components.Web

# Real-time communication
dotnet add package Microsoft.AspNetCore.SignalR.Core

# gRPC
dotnet add package Grpc.AspNetCore
dotnet add package Grpc.Tools

# Testing
dotnet add package xUnit
dotnet add package Moq
dotnet add package Microsoft.EntityFrameworkCore.InMemory

# AI
dotnet add package OpenAI
dotnet add package Azure.AI.OpenAI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
```

### Documentation References

- **Blazor Data Binding**: https://learn.microsoft.com/en-us/aspnet/core/blazor/components/data-binding
- **SignalR**: https://learn.microsoft.com/en-us/aspnet/core/signalr/introduction
- **gRPC**: https://learn.microsoft.com/en-us/aspnet/core/grpc/
- **Testing**: https://learn.microsoft.com/en-us/aspnet/core/test/razor-pages-tests
- **Web App Strategy**: https://learn.microsoft.com/en-us/dotnet/architecture/modern-web-apps-azure/choose-between-traditional-web-and-single-page-apps
- **AI Chat**: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-chat-app

---

**Document Last Updated**: 2026-03-29
**Confidence Level**: High (sourced from official Microsoft Learn documentation)
**Recommended Review**: Quarterly (to capture .NET updates)
