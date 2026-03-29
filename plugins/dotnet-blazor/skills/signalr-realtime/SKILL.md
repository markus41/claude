---
name: signalr-realtime
description: SignalR for real-time communication in Blazor apps including hubs, groups, streaming, and scaling
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
triggers:
  - signalr
  - real-time
  - realtime
  - websocket
  - hub
  - live update
  - push notification
---

# SignalR Real-Time Communication

## Hub Definition

```csharp
public sealed class NotificationHub : Hub
{
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.SendAsync("ReceiveMessage", user, message);
    }

    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
        await Clients.Group(groupName).SendAsync("UserJoined", Context.UserIdentifier);
    }

    public async Task SendToGroup(string groupName, string message)
    {
        await Clients.Group(groupName).SendAsync("ReceiveMessage", message);
    }

    public override async Task OnConnectedAsync()
    {
        await base.OnConnectedAsync();
        // Track connection
    }
}
```

## Server Setup

```csharp
builder.Services.AddSignalR()
    .AddJsonProtocol(options =>
    {
        options.PayloadSerializerOptions.PropertyNamingPolicy = JsonNamingPolicy.CamelCase;
    });

app.MapHub<NotificationHub>("/hubs/notifications");
```

## Blazor Server (built-in circuit)

Blazor Server already uses SignalR for its circuit. For additional hubs:

```razor
@rendermode InteractiveServer
@inject NavigationManager Navigation
@implements IAsyncDisposable

@code {
    private HubConnection? _hub;

    protected override async Task OnInitializedAsync()
    {
        _hub = new HubConnectionBuilder()
            .WithUrl(Navigation.ToAbsoluteUri("/hubs/notifications"))
            .WithAutomaticReconnect()
            .Build();

        _hub.On<string, string>("ReceiveMessage", (user, message) =>
        {
            _messages.Add(new(user, message));
            InvokeAsync(StateHasChanged);
        });

        await _hub.StartAsync();
    }

    public async ValueTask DisposeAsync()
    {
        if (_hub is not null)
            await _hub.DisposeAsync();
    }
}
```

## Strongly-Typed Hub

```csharp
public interface INotificationClient
{
    Task ReceiveMessage(string user, string message);
    Task UserJoined(string userId);
    Task OrderUpdated(OrderStatusDto status);
}

public sealed class NotificationHub : Hub<INotificationClient>
{
    public async Task SendMessage(string user, string message)
    {
        await Clients.All.ReceiveMessage(user, message);
    }
}
```

## Server-to-Client Push (from services)

```csharp
public sealed class OrderService(IHubContext<NotificationHub, INotificationClient> hub)
{
    public async Task UpdateStatusAsync(int orderId, string status)
    {
        // Update DB...
        await hub.Clients.Group($"order-{orderId}")
            .OrderUpdated(new OrderStatusDto(orderId, status));
    }
}
```

## Scaling with Redis Backplane

```csharp
builder.Services.AddSignalR()
    .AddStackExchangeRedis(builder.Configuration.GetConnectionString("Redis")!);
```

## Hub Methods Reference (from official docs)

```csharp
public class ChatHub : Hub
{
    // Broadcast to ALL connected clients
    await Clients.All.SendAsync("ReceiveMessage", user, message);

    // Send to specific client by connection ID
    await Clients.Client(targetConnectionId).SendAsync("ReceivePrivateMessage", message);

    // Send to all EXCEPT caller
    await Clients.Others.SendAsync("ReceiveMessage", message);

    // Group operations
    await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    await Clients.Group(groupName).SendAsync("ReceiveGroupMessage", message);
    await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);

    // Send to group except caller
    await Clients.GroupExcept(groupName, Context.ConnectionId)
        .SendAsync("ReceiveMessage", message);
}
```

## JavaScript Client (from official docs)

```javascript
const connection = new signalR.HubConnectionBuilder()
    .withUrl("/chatHub")
    .withAutomaticReconnect()
    .build();

// Server calls this method on client
connection.on("ReceiveMessage", (user, message) => {
    document.getElementById("messages").innerHTML += `<li>${user}: ${message}</li>`;
});

// Client calls server method
await connection.invoke("SendMessage", user, message);

// Connection lifecycle
connection.onreconnecting((error) => console.log("Reconnecting..."));
connection.onreconnected((connectionId) => console.log("Reconnected:", connectionId));
connection.onclose((error) => console.log("Connection closed"));

connection.start().catch(err => console.error(err));
```

## Transport Fallback (from official docs)

SignalR automatically negotiates the best transport:
1. **WebSockets** (preferred) - full-duplex, lowest latency
2. **Server-Sent Events** - server-to-client only, widely supported
3. **Long Polling** - fallback for restricted environments

## Best Use Cases (from official docs)

- **Gaming**: Real-time game state, player positions
- **Dashboards**: Live metrics, alerts, status changes
- **Collaborative apps**: Shared whiteboards, document editing
- **Notifications**: Real-time alerts, chat messages
- **Stock tickers**: Live price feeds, market data
- **Auctions**: Real-time bid updates
