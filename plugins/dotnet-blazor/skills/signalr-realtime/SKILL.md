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
