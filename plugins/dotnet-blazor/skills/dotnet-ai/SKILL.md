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

### Function Calling (Tool Use) - from official docs

```csharp
using Microsoft.Extensions.AI;
using OpenAI;

// Build client with function invocation middleware
IChatClient client =
    new ChatClientBuilder(new OpenAIClient(key).GetChatClient("gpt-4o").AsIChatClient())
    .UseFunctionInvocation()  // Auto-invokes local functions
    .Build();

// Define tools available to the model
var chatOptions = new ChatOptions
{
    Tools = [AIFunctionFactory.Create((string location, string unit) =>
    {
        return "Periods of rain or drizzle, 15 C";
    },
    "get_current_weather",
    "Gets the current weather in a given location")]
};

// Conversation with automatic tool invocation
List<ChatMessage> chatHistory =
[
    new(ChatRole.System, "You are a hiking enthusiast who helps discover fun hikes."),
    new(ChatRole.User, "I live in Montreal. What's the current weather like?")
];

ChatResponse response = await client.GetResponseAsync(chatHistory, chatOptions);
Console.WriteLine(response.Text);  // Model auto-called get_current_weather
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

## MCP (Model Context Protocol) in .NET - from official docs

### Build MCP Server

```bash
# Requires .NET 10.0 SDK
dotnet new install Microsoft.McpServer.ProjectTemplates
dotnet new mcpserver -n MyMcpServer
```

```csharp
// Program.cs
using ModelContextProtocol.Server;
using System.ComponentModel;

var hostBuilder = Host.CreateDefaultBuilder(args)
    .ConfigureServices((context, services) =>
    {
        services.AddMcpServer(options =>
        {
            options.Name = "SampleMcpServer";
            options.Version = "1.0";
        })
        .WithStdioServerTransport()  // or .WithHttpServerTransport()
        .AddMcpServerTools();
    });

var host = hostBuilder.Build();
await host.RunAsync();
```

```csharp
// Tool definitions
public class RandomNumberTools
{
    [McpServerTool]
    [Description("Gets a random number between min and max")]
    public string GetRandomNumber(
        [Description("Minimum value")] int min,
        [Description("Maximum value")] int max)
    {
        return $"Your random number is {Random.Shared.Next(min, max + 1)}.";
    }

    [McpServerTool]
    [Description("Describes random weather in the provided city")]
    public string GetCityWeather(
        [Description("Name of the city")] string city)
    {
        var weather = Environment.GetEnvironmentVariable("WEATHER_CHOICES") ?? "balmy,rainy,stormy";
        var choices = weather.Split(",");
        return $"The weather in {city} is {choices[Random.Shared.Next(0, choices.Length)]}.";
    }
}
```

### MCP Server Config (.vscode/mcp.json)
```json
{
  "servers": {
    "MyMcpServer": {
      "type": "stdio",
      "command": "dotnet",
      "args": ["run", "--project", "<path-to-csproj>"],
      "env": { "WEATHER_CHOICES": "sunny,humid,freezing" }
    }
  }
}
```

### Build MCP Client
```csharp
using ModelContextProtocol.Client;
using Microsoft.Extensions.AI;

// Create MCP client connection
var transport = new StdioClientTransport(new()
{
    Command = "dotnet run",
    Arguments = ["--project", "<path-to-mcp-server>"],
    Name = "Minimal MCP Server",
});
McpClient mcpClient = await McpClient.CreateAsync(transport);

// Discover tools
IList<McpClientTool> tools = await mcpClient.ListToolsAsync();
foreach (McpClientTool tool in tools)
    Console.WriteLine(tool);

// Integrate MCP tools with chat client
IChatClient chatClient = new ChatClientBuilder(baseClient)
    .UseFunctionInvocation()
    .Build();

// Use MCP tools in chat
List<ChatMessage> messages = [new(ChatRole.User, "What's the weather in Paris?")];
await foreach (var update in chatClient.GetStreamingResponseAsync(
    messages, new() { Tools = [.. tools] }))
{
    Console.Write(update);
}
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

## Tokenization (from official docs)

```csharp
using Microsoft.ML.Tokenizers;

// Tiktoken for GPT-4o (requires Microsoft.ML.Tokenizers.Data.O200kBase)
Tokenizer tokenizer = TiktokenTokenizer.CreateForModel("gpt-4o");

string text = "Hello, how are you?";
int tokenCount = tokenizer.CountTokens(text);

// Encode to token IDs
IReadOnlyList<int> ids = tokenizer.EncodeToIds(text);

// Decode back
string decoded = tokenizer.Decode(ids);

// Trim to max tokens
int maxTokens = 100;
int lastIndex = tokenizer.GetIndexByTokenCount(text, maxTokens, out string? normalizedText, out int count);
string trimmed = text[..lastIndex];
```

## Key Packages (verified from official docs)

| Package | Purpose | Notes |
|---------|---------|-------|
| `Microsoft.Extensions.AI.Abstractions` | Core interfaces (IChatClient, IEmbeddingGenerator) | Base for all providers |
| `Microsoft.Extensions.AI` | Full library + middleware (caching, telemetry) | Includes Abstractions |
| `Microsoft.Extensions.AI.OpenAI` | OpenAI/Azure OpenAI provider | `--prerelease` required |
| `Microsoft.Extensions.VectorData.Abstractions` | Vector store interfaces (CRUD, search) | Interface definitions |
| `Microsoft.SemanticKernel.Connectors.InMemory` | In-memory vector store | `--prerelease` required |
| `ModelContextProtocol` | Official MCP C# SDK | `--prerelease`, requires .NET 10 |
| `Microsoft.ML.Tokenizers` | Tokenization (Tiktoken, BPE, Llama) | Stable, .NET Standard 2.0+ |
| `Microsoft.ML.Tokenizers.Data.O200kBase` | Tiktoken vocab for GPT-4/5 | Required for Tiktoken |
| `Azure.AI.OpenAI` | Azure OpenAI SDK | Official Azure package |
| `Azure.Identity` | Entra ID auth (DefaultAzureCredential) | For Azure services |

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
