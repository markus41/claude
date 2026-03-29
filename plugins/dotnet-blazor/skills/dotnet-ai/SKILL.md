---
name: dotnet-ai
description: .NET AI integration with Microsoft.Extensions.AI, Semantic Kernel, MCP servers, embeddings, vector search, and agent frameworks
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - dotnet ai
  - microsoft extensions ai
  - semantic kernel
  - embeddings
  - vector search
  - mcp server dotnet
  - ai agent csharp
  - llm integration
  - function calling
  - chat completion
  - prompt engineering dotnet
---

# .NET AI Integration

## Microsoft.Extensions.AI (Unified AI Abstraction)

The recommended way to integrate AI in .NET apps. Provides a vendor-agnostic abstraction over AI services.

```csharp
// Install: dotnet add package Microsoft.Extensions.AI
// Provider packages: Microsoft.Extensions.AI.OpenAI, Microsoft.Extensions.AI.AzureAIInference, etc.

using Microsoft.Extensions.AI;

// Register in DI
builder.Services.AddChatClient(new AzureOpenAIClient(
    new Uri(builder.Configuration["AI:Endpoint"]!),
    new DefaultAzureCredential())
    .GetChatClient("gpt-4o"));

// Or with OpenAI directly
builder.Services.AddChatClient(new OpenAIClient(apiKey)
    .GetChatClient("gpt-4o"));
```

### Chat Completion

```csharp
public sealed class ChatService(IChatClient chatClient)
{
    public async Task<string> AskAsync(string question, CancellationToken ct)
    {
        var response = await chatClient.GetResponseAsync(question, cancellationToken: ct);
        return response.Text;
    }

    public async Task<string> AskWithContextAsync(string question, string systemPrompt, CancellationToken ct)
    {
        var messages = new List<ChatMessage>
        {
            new(ChatRole.System, systemPrompt),
            new(ChatRole.User, question)
        };

        var response = await chatClient.GetResponseAsync(messages, cancellationToken: ct);
        return response.Text;
    }

    // Streaming
    public async IAsyncEnumerable<string> StreamAsync(
        string prompt, [EnumeratorCancellation] CancellationToken ct = default)
    {
        await foreach (var update in chatClient.GetStreamingResponseAsync(prompt, cancellationToken: ct))
        {
            if (update.Text is not null)
                yield return update.Text;
        }
    }
}
```

### Function Calling (Tool Use)

```csharp
// Define tools as methods
[Description("Get the current weather for a location")]
static async Task<string> GetWeather(
    [Description("The city name")] string city,
    [Description("Temperature unit")] string unit = "celsius")
{
    // Call weather API...
    return $"Weather in {city}: 22°{unit[0]}, partly cloudy";
}

// Register tools with chat client
var options = new ChatOptions
{
    Tools = [AIFunctionFactory.Create(GetWeather)]
};

var response = await chatClient.GetResponseAsync("What's the weather in Seattle?", options);
```

### Embeddings

```csharp
// IEmbeddingGenerator<string, Embedding<float>>
builder.Services.AddEmbeddingGenerator(new AzureOpenAIClient(endpoint, credential)
    .GetEmbeddingClient("text-embedding-3-small"));

public sealed class SemanticSearchService(IEmbeddingGenerator<string, Embedding<float>> embedder)
{
    public async Task<float[]> GetEmbeddingAsync(string text, CancellationToken ct)
    {
        var embedding = await embedder.GenerateAsync(text, cancellationToken: ct);
        return embedding[0].Vector.ToArray();
    }

    public async Task<IReadOnlyList<float[]>> GetBatchEmbeddingsAsync(
        IEnumerable<string> texts, CancellationToken ct)
    {
        var embeddings = await embedder.GenerateAsync(texts.ToList(), cancellationToken: ct);
        return embeddings.Select(e => e.Vector.ToArray()).ToList();
    }
}
```

## Semantic Kernel (AI Orchestration)

```csharp
using Microsoft.SemanticKernel;
using Microsoft.SemanticKernel.ChatCompletion;
using Microsoft.SemanticKernel.Connectors.OpenAI;

// Build kernel
var kernel = Kernel.CreateBuilder()
    .AddAzureOpenAIChatCompletion("gpt-4o", endpoint, credential)
    .Build();

// Simple prompt
var result = await kernel.InvokePromptAsync("Summarize: {{$input}}", new() { ["input"] = text });

// With plugins
kernel.Plugins.AddFromType<TimePlugin>();
kernel.Plugins.AddFromType<WeatherPlugin>();

// Auto function calling
var settings = new OpenAIPromptExecutionSettings { FunctionChoiceBehavior = FunctionChoiceBehavior.Auto() };
var chatService = kernel.GetRequiredService<IChatCompletionService>();
var response = await chatService.GetChatMessageContentAsync("What time is it in London?", settings, kernel);
```

## MCP (Model Context Protocol) in .NET

### Build MCP Server
```csharp
using ModelContextProtocol.Server;

var builder = Host.CreateApplicationBuilder(args);
builder.Services.AddMcpServer()
    .WithStdioServerTransport()
    .WithTools<MyTools>();

var app = builder.Build();
await app.RunAsync();

[McpServerToolType]
public sealed class MyTools
{
    [McpServerTool, Description("Search products by name")]
    public async Task<string> SearchProducts(
        [Description("Search query")] string query,
        AppDbContext db, CancellationToken ct)
    {
        var products = await db.Products
            .Where(p => p.Name.Contains(query))
            .Take(10)
            .ToListAsync(ct);
        return JsonSerializer.Serialize(products);
    }
}
```

### Build MCP Client
```csharp
using ModelContextProtocol.Client;

var client = await McpClientFactory.CreateAsync(new McpServerConfig
{
    Id = "my-server",
    Name = "My MCP Server",
    TransportType = TransportTypes.StdIo,
    TransportOptions = new() { ["command"] = "dotnet", ["args"] = "run --project MyMcpServer" }
});

var tools = await client.ListToolsAsync();
var result = await client.CallToolAsync("SearchProducts", new { query = "widget" });
```

## Vector Search

```csharp
// Using Microsoft.Extensions.VectorData
using Microsoft.Extensions.VectorData;

public sealed class ProductSearchVector
{
    [VectorStoreRecordKey]
    public int Id { get; set; }

    [VectorStoreRecordData]
    public string Name { get; set; } = "";

    [VectorStoreRecordData]
    public string Description { get; set; } = "";

    [VectorStoreRecordVector(1536)] // OpenAI embedding dimension
    public ReadOnlyMemory<float> Embedding { get; set; }
}

// Search
public sealed class VectorSearchService(
    IVectorStore vectorStore,
    IEmbeddingGenerator<string, Embedding<float>> embedder)
{
    public async Task<IReadOnlyList<ProductSearchVector>> SearchAsync(
        string query, int topK = 5, CancellationToken ct = default)
    {
        var collection = vectorStore.GetCollection<int, ProductSearchVector>("products");
        var queryEmbedding = await embedder.GenerateAsync(query, cancellationToken: ct);

        var results = await collection.VectorizedSearchAsync(
            queryEmbedding[0].Vector, new() { Top = topK }, ct);

        return await results.Results.Select(r => r.Record).ToListAsync(ct);
    }
}
```

## AI Integration in Blazor

```razor
@page "/ai-chat"
@rendermode InteractiveServer
@inject IChatClient ChatClient

<div class="chat-container">
    @foreach (var message in _messages)
    {
        <div class="message @message.Role">@message.Content</div>
    }
    @if (_isStreaming)
    {
        <div class="message assistant">@_streamingText</div>
    }
</div>

<EditForm Model="@_input" OnValidSubmit="SendMessage">
    <InputText @bind-Value="_input.Text" placeholder="Ask anything..." />
    <button type="submit" disabled="@_isStreaming">Send</button>
</EditForm>

@code {
    private readonly List<(string Role, string Content)> _messages = [];
    private ChatInput _input = new();
    private bool _isStreaming;
    private string _streamingText = "";

    private async Task SendMessage()
    {
        var userMessage = _input.Text;
        _messages.Add(("user", userMessage));
        _input = new();
        _isStreaming = true;
        _streamingText = "";

        await foreach (var chunk in ChatClient.GetStreamingResponseAsync(userMessage))
        {
            if (chunk.Text is not null)
            {
                _streamingText += chunk.Text;
                StateHasChanged();
            }
        }

        _messages.Add(("assistant", _streamingText));
        _isStreaming = false;
    }

    private sealed class ChatInput { public string Text { get; set; } = ""; }
}
```

## Key Packages

| Package | Purpose |
|---------|---------|
| `Microsoft.Extensions.AI` | Unified AI abstraction (IChatClient, IEmbeddingGenerator) |
| `Microsoft.Extensions.AI.OpenAI` | OpenAI/Azure OpenAI provider |
| `Microsoft.Extensions.AI.Ollama` | Ollama local model provider |
| `Microsoft.SemanticKernel` | AI orchestration with plugins and planners |
| `Microsoft.Extensions.VectorData` | Vector store abstraction |
| `ModelContextProtocol` | MCP client/server for .NET |
| `Microsoft.ML.Tokenizers` | Tokenization for token counting |

## Reference

- .NET AI docs: https://learn.microsoft.com/en-us/dotnet/ai/
- Microsoft.Extensions.AI: https://learn.microsoft.com/en-us/dotnet/ai/microsoft-extensions-ai
- .NET AI ecosystem: https://learn.microsoft.com/en-us/dotnet/ai/dotnet-ai-ecosystem
- Function calling: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/use-function-calling?pivots=openai
- Vector search: https://learn.microsoft.com/en-us/dotnet/ai/vector-stores/how-to/build-vector-search-app?pivots=openai
- MCP in .NET: https://learn.microsoft.com/en-us/dotnet/ai/get-started-mcp
- Build MCP server: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-server
- Build MCP client: https://learn.microsoft.com/en-us/dotnet/ai/quickstarts/build-mcp-client
- AI Agents: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/agents
- Prompt engineering: https://learn.microsoft.com/en-us/dotnet/ai/conceptual/prompt-engineering-dotnet
- Semantic Kernel: https://learn.microsoft.com/en-us/semantic-kernel/
