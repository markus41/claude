---
name: .NET AI Extensions Comprehensive Research
description: Complete API reference and code patterns for Microsoft.Extensions.AI, MCP, vector stores, and agents in .NET
type: reference
---

# .NET AI Extensions: Comprehensive Research Summary
**Date**: 2026-03-29
**Coverage**: Microsoft.Extensions.AI, MCP, embeddings, vector stores, agents, tokenization

---

## Package Ecosystem Overview

### Core Packages (Versioning: --prerelease flags indicate beta/preview)

| Package | Purpose | NuGet Link | Key Notes |
|---------|---------|-----------|-----------|
| **Microsoft.Extensions.AI.Abstractions** | Core abstractions (IChatClient, IEmbeddingGenerator) | nuget.org/packages/Microsoft.Extensions.AI.Abstractions | Base interfaces for all providers |
| **Microsoft.Extensions.AI** | Full library with middleware (caching, telemetry, function invocation) | nuget.org/packages/Microsoft.Extensions.AI | Implicit dependency on Abstractions |
| **Microsoft.Extensions.AI.OpenAI** | OpenAI/Azure OpenAI provider implementation | nuget.org/packages/Microsoft.Extensions.AI.OpenAI | --prerelease flag required |
| **Microsoft.Extensions.VectorData.Abstractions** | Vector store abstractions (CRUD, search operations) | nuget.org/packages/Microsoft.Extensions.VectorData.Abstractions | Interface definitions only |
| **Microsoft.SemanticKernel.Connectors.InMemory** | In-memory vector store implementation | nuget.org/packages/Microsoft.SemanticKernel.Connectors.InMemory | --prerelease flag, brings in VectorData |
| **ModelContextProtocol** | Official MCP C# SDK | NuGet (GitHub: modelcontextprotocol/csharp-sdk) | --prerelease flag, maintained by Microsoft/Anthropic/MCP org |
| **Microsoft.ML.Tokenizers** | Text tokenization for LLMs (Tiktoken, BPE, Llama) | nuget.org/packages/Microsoft.ML.Tokenizers | Stable, supports .NET Standard 2.0+ |
| **Microsoft.ML.Tokenizers.Data.O200kBase** | Tiktoken vocabulary for GPT-4/GPT-5 models | nuget.org/packages/Microsoft.ML.Tokenizers.Data.O200kBase | Required for Tiktoken tokenizers |
| **Azure.AI.OpenAI** | Azure OpenAI SDK | nuget.org/packages/Azure.AI.OpenAI | Official Azure package |
| **Azure.Identity** | Entra ID authentication (DefaultAzureCredential) | nuget.org/packages/Azure.Identity | For Azure service authentication |
| **OpenAI** | Official OpenAI library (dependency of Microsoft.Extensions.AI.OpenAI) | nuget.org/packages/OpenAI | Implicit dependency |

---

## Core API Patterns

### 1. IChatClient Interface (Abstract)

**Purpose**: Unified abstraction for chat models (OpenAI, Azure OpenAI, etc.)

**Key Methods**:
- `CompleteAsync()` / `CompleteStreamingAsync()` - Basic completion
- `GetResponseAsync()` / `GetStreamingResponseAsync()` - Response with options
- Supports multi-modal content (text, images, audio)
- Built-in function invocation capabilities

**Usage Pattern**:

```csharp
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using OpenAI;

// Load config
IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();
string? model = config["ModelName"];
string? key = config["OpenAIKey"];

// Create client (OpenAI)
IChatClient client =
    new OpenAIClient(key).GetChatClient(model).AsIChatClient();

// Alternative: Azure OpenAI
IChatClient azureClient =
    new AzureOpenAIClient(new Uri(endpoint), new DefaultAzureCredential())
        .GetChatClient(deployment)
        .AsIChatClient();

// Simple completion
ChatResponse response = await client.GetResponseAsync(
    "Summarize this text...",
    new ChatOptions { MaxOutputTokens = 400 });
Console.WriteLine(response);
```

### 2. ChatClientBuilder - Middleware Pipeline

**Purpose**: Compose chat client with middleware (function invocation, caching, telemetry)

**Common Middleware**:
- `.UseFunctionInvocation()` - Auto-invoke local functions
- `.UseOpenTelemetry(...)` - Add observability
- `.UseDistributedCache(...)` - Cache responses
- `.Build()` - Finalize pipeline

**Full Example with Function Invocation**:

```csharp
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using OpenAI;

// Configuration
IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();
string? model = config["ModelName"];
string? key = config["OpenAIKey"];

// Build client with function invocation middleware
IChatClient client =
    new ChatClientBuilder(new OpenAIClient(key).GetChatClient(model ?? "gpt-4").AsIChatClient())
    .UseFunctionInvocation()
    .Build();

// Define tools (functions) available to the model
var chatOptions = new ChatOptions
{
    Tools = [AIFunctionFactory.Create((string location, string unit) =>
    {
        // Simulated weather API call
        return "Periods of rain or drizzle, 15 C";
    },
    "get_current_weather",
    "Gets the current weather in a given location")]
};

// Conversation with automatic tool invocation
List<ChatMessage> chatHistory =
[
    new(ChatRole.System, "You are a hiking enthusiast who helps people discover fun hikes. You are upbeat and friendly.")
];

chatHistory.Add(new ChatMessage(ChatRole.User,
    "I live in Montreal and I'm looking for a moderate intensity hike. What's the current weather like?"));

Console.WriteLine($"{chatHistory.Last().Role} >>> {chatHistory.Last()}");

ChatResponse response = await client.GetResponseAsync(chatHistory, chatOptions);
Console.WriteLine($"Assistant >>> {response.Text}");
```

### 3. IEmbeddingGenerator Interface

**Purpose**: Generate embedding vectors for semantic search and RAG applications

**Generic Type Parameters**:
- `TInput` - Type of input values (typically `string`)
- `TEmbedding` - Type of embedding (inherits from `Embedding` base class)

**Key Methods**:
- `GenerateAsync(IEnumerable<TInput>, EmbeddingGenerationOptions?, CancellationToken)` - Batch generation
- `GenerateVectorAsync(TInput)` - Convenience method for single value
- Supports composition with middleware (caching, rate limiting, telemetry)

**Basic Usage**:

```csharp
using Microsoft.Extensions.AI;
using OllamaSharp;

IEmbeddingGenerator<string, Embedding<float>> generator =
    new OllamaApiClient(new Uri("http://localhost:11434/"), "phi3:mini");

// Generate embeddings for multiple values
foreach (Embedding<float> embedding in
    await generator.GenerateAsync(["What is AI?", "What is .NET?"]))
{
    Console.WriteLine(string.Join(", ", embedding.Vector.ToArray()));
}

// Generate single embedding (accelerator method)
ReadOnlyMemory<float> vector = await generator.GenerateVectorAsync("What is AI?");
```

**With Middleware (Caching + Telemetry)**:

```csharp
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using OllamaSharp;
using OpenTelemetry.Trace;

// Setup OpenTelemetry
string sourceName = Guid.NewGuid().ToString();
TracerProvider tracerProvider = OpenTelemetry.Sdk.CreateTracerProviderBuilder()
    .AddSource(sourceName)
    .AddConsoleExporter()
    .Build();

// Build with middleware pipeline
IEmbeddingGenerator<string, Embedding<float>> generator =
    new EmbeddingGeneratorBuilder<string, Embedding<float>>(
        new OllamaApiClient(new Uri("http://localhost:11434/"), "phi3:mini"))
    .UseDistributedCache(
        new MemoryDistributedCache(
            Options.Create(new MemoryDistributedCacheOptions())))
    .UseOpenTelemetry(sourceName: sourceName)
    .Build();

GeneratedEmbeddings<Embedding<float>> embeddings =
    await generator.GenerateAsync(
        ["What is AI?", "What is .NET?", "What is AI?"] // Note: 3rd is duplicate
    );

foreach (Embedding<float> embedding in embeddings)
{
    Console.WriteLine(string.Join(", ", embedding.Vector.ToArray()));
}
```

**Custom Middleware Example (Rate Limiting)**:

```csharp
using Microsoft.Extensions.AI;
using System.Threading.RateLimiting;

public class RateLimitingEmbeddingGenerator(
    IEmbeddingGenerator<string, Embedding<float>> innerGenerator,
    RateLimiter rateLimiter)
        : DelegatingEmbeddingGenerator<string, Embedding<float>>(innerGenerator)
{
    public override async Task<GeneratedEmbeddings<Embedding<float>>> GenerateAsync(
        IEnumerable<string> values,
        EmbeddingGenerationOptions? options = null,
        CancellationToken cancellationToken = default)
    {
        using var lease = await rateLimiter.AcquireAsync(permitCount: 1, cancellationToken)
            .ConfigureAwait(false);

        if (!lease.IsAcquired)
            throw new InvalidOperationException("Unable to acquire lease.");

        return await base.GenerateAsync(values, options, cancellationToken);
    }

    protected override void Dispose(bool disposing)
    {
        if (disposing)
            rateLimiter.Dispose();
        base.Dispose(disposing);
    }
}

// Usage
IEmbeddingGenerator<string, Embedding<float>> generator =
    new RateLimitingEmbeddingGenerator(
        new OllamaApiClient(new Uri("http://localhost:11434/"), "phi3:mini"),
        new ConcurrencyLimiter(new() { PermitLimit = 1, QueueLimit = int.MaxValue }));
```

---

## Vector Store & RAG Implementation

### Complete Vector Search Example (OpenAI)

```csharp
using Microsoft.Extensions.AI;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.VectorData;
using Microsoft.SemanticKernel.Connectors.InMemory;
using OpenAI;

// 1. Define data model with VectorStore attributes
internal class CloudService
{
    [VectorStoreKey]
    public int Key { get; set; }

    [VectorStoreData]
    public string Name { get; set; }

    [VectorStoreData]
    public string Description { get; set; }

    [VectorStoreVector(
        Dimensions: 384,
        DistanceFunction = DistanceFunction.CosineSimilarity)]
    public ReadOnlyMemory<float> Vector { get; set; }
}

// 2. Configuration and setup
IConfigurationRoot config = new ConfigurationBuilder()
    .AddUserSecrets<Program>()
    .Build();
string model = config["ModelName"];
string key = config["OpenAIKey"];

// 3. Create embedding generator for OpenAI
IEmbeddingGenerator<string, Embedding<float>> generator =
    new OpenAIClient(new ApiKeyCredential(key))
        .GetEmbeddingClient(model: model)
        .AsIEmbeddingGenerator();

// 4. Create sample data
List<CloudService> cloudServices =
[
    new() {
        Key = 0,
        Name = "Azure App Service",
        Description = "Host .NET, Java, Node.js, and Python web applications and APIs in a fully managed Azure service. You only need to deploy your code to Azure. Azure takes care of all the infrastructure management like high availability, load balancing, and autoscaling."
    },
    new() {
        Key = 1,
        Name = "Azure Service Bus",
        Description = "A fully managed enterprise message broker supporting both point to point and publish-subscribe integrations. It's ideal for building decoupled applications, queue-based load leveling, or facilitating communication between microservices."
    },
    new() {
        Key = 2,
        Name = "Azure Blob Storage",
        Description = "Azure Blob Storage allows your applications to store and retrieve files in the cloud. Azure Storage is highly scalable to store massive amounts of data and data is stored redundantly to ensure high availability."
    }
];

// 5. Create and populate vector store
var vectorStore = new InMemoryVectorStore();
VectorStoreCollection<int, CloudService> cloudServicesStore =
    vectorStore.GetCollection<int, CloudService>("cloudServices");
await cloudServicesStore.EnsureCollectionExistsAsync();

// Generate embeddings and store data
foreach (CloudService service in cloudServices)
{
    service.Vector = await generator.GenerateVectorAsync(service.Description);
    await cloudServicesStore.UpsertAsync(service);
}

// 6. Perform semantic search
string query = "Which Azure service should I use to store my Word documents?";
ReadOnlyMemory<float> queryEmbedding = await generator.GenerateVectorAsync(query);

IAsyncEnumerable<VectorSearchResult<CloudService>> results =
    cloudServicesStore.SearchAsync(queryEmbedding, top: 1);

// 7. Display results
await foreach (VectorSearchResult<CloudService> result in results)
{
    Console.WriteLine($"Name: {result.Record.Name}");
    Console.WriteLine($"Description: {result.Record.Description}");
    Console.WriteLine($"Vector match score: {result.Score}");
}
```

**Key VectorData Attributes**:
- `[VectorStoreKey]` - Primary key field
- `[VectorStoreData]` - Searchable text data
- `[VectorStoreVector(Dimensions, DistanceFunction)]` - Embedding vector field
- `DistanceFunction`: `CosineSimilarity`, `EuclideanDistance`, `DotProductSimilarity`

---

## MCP (Model Context Protocol) Implementation

### MCP Server (Minimal Example)

**Setup & Installation**:
```bash
# Install template (requires .NET 10.0 SDK)
dotnet new install Microsoft.McpServer.ProjectTemplates

# Create project
dotnet new mcpserver -n MyMcpServer
```

**Program.cs - MCP Server with Tools**:

```csharp
using Microsoft.Extensions.Logging;
using ModelContextProtocol.Server;
using System.ComponentModel;

var hostBuilder = Host.CreateDefaultBuilder(args)
    .ConfigureServices((context, services) =>
    {
        services.AddLogging();
    })
    .ConfigureServices((context, services) =>
    {
        services
            .AddMcpServer(options =>
            {
                options.Name = "SampleMcpServer";
                options.Version = "1.0";
            })
            .WithStdioServerTransport() // or .WithHttpServerTransport()
            .AddMcpServerTools();
    });

var host = hostBuilder.Build();
await host.RunAsync();
```

**Tool Definition (RandomNumberTools.cs)**:

```csharp
using System.ComponentModel;
using ModelContextProtocol.Server;

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
        var weather = Environment.GetEnvironmentVariable("WEATHER_CHOICES");
        if (string.IsNullOrWhiteSpace(weather))
            weather = "balmy,rainy,stormy";

        var choices = weather.Split(",");
        var selected = Random.Shared.Next(0, choices.Length);
        return $"The weather in {city} is {choices[selected]}.";
    }
}
```

**MCP Server Configuration (stdio transport)**:

`.vscode/mcp.json`:
```json
{
  "servers": {
    "MyMcpServer": {
      "type": "stdio",
      "command": "dotnet",
      "args": [
        "run",
        "--project",
        "<path-to-csproj>"
      ],
      "env": {
        "WEATHER_CHOICES": "sunny,humid,freezing"
      }
    }
  }
}
```

**MCP Server Configuration (HTTP transport)**:

`.vscode/mcp.json`:
```json
{
  "servers": {
    "MyMCPServer": {
      "url": "http://localhost:6278",
      "type": "http",
      "headers": {}
    }
  }
}
```

**server.json (for NuGet publishing)**:

```json
{
  "$schema": "https://static.modelcontextprotocol.io/schemas/2025-10-17/server.schema.json",
  "name": "io.github.<username>/<repo-name>",
  "description": "Sample MCP server",
  "version": "0.1.0",
  "packages": [
    {
      "registryType": "nuget",
      "registryBaseUrl": "https://api.nuget.org",
      "identifier": "<unique-package-id>",
      "version": "0.1.0",
      "transport": { "type": "stdio" },
      "packageArguments": [],
      "environmentVariables": [
        {
          "name": "WEATHER_CHOICES",
          "value": "{weather_choices}",
          "variables": {
            "weather_choices": {
              "description": "Comma separated list of weather descriptions",
              "isRequired": true,
              "isSecret": false
            }
          }
        }
      ]
    }
  ],
  "repository": {
    "url": "https://github.com/<username>/<repo-name>",
    "source": "github"
  }
}
```

### MCP Client Implementation

**Complete MCP Client with Chat Integration**:

```csharp
using Azure.AI.OpenAI;
using Azure.Identity;
using Microsoft.Extensions.AI;
using ModelContextProtocol.Client;
using ModelContextProtocol.Protocol;

// Step 1: Create IChatClient (Azure OpenAI in this example)
IChatClient chatClient =
    new ChatClientBuilder(
        new AzureOpenAIClient(new Uri("<your-azure-openai-endpoint>"),
        new DefaultAzureCredential())
        .GetChatClient("gpt-4o").AsIChatClient())
    .UseFunctionInvocation()
    .Build();

// Step 2: Create MCP client connection to server
var transport = new StdioClientTransport(new()
{
    Command = "dotnet run",
    Arguments = ["--project", "<path-to-your-mcp-server-project>"],
    Name = "Minimal MCP Server",
});
McpClient mcpClient = await McpClient.CreateAsync(transport);

// Step 3: List all available tools from the MCP server
Console.WriteLine("Available tools:");
IList<McpClientTool> tools = await mcpClient.ListToolsAsync();
foreach (McpClientTool tool in tools)
{
    Console.WriteLine($"{tool}");
}
Console.WriteLine();

// Step 4: Conversational loop with tool usage
List<ChatMessage> messages = [];
while (true)
{
    Console.Write("Prompt: ");
    messages.Add(new(ChatRole.User, Console.ReadLine()));

    List<ChatResponseUpdate> updates = [];
    await foreach (ChatResponseUpdate update in chatClient
        .GetStreamingResponseAsync(messages, new() { Tools = [.. tools] }))
    {
        Console.Write(update);
        updates.Add(update);
    }
    Console.WriteLine();

    messages.AddMessages(updates);
}
```

**MCP Key Classes & Methods**:
- `StdioClientTransport` - For local/stdio-based MCP servers
- `McpClient.CreateAsync(transport)` - Initialize client connection
- `McpClient.ListToolsAsync()` - Discover available tools
- `McpClientTool` - Represents a tool available on the server

---

## Tokenization & Token Management

### Tiktoken Tokenizer (GPT Models)

**Installation**:
```bash
dotnet add package Microsoft.ML.Tokenizers
dotnet add package Microsoft.ML.Tokenizers.Data.O200kBase
```

**Usage**:

```csharp
using Microsoft.ML.Tokenizers;

// Initialize for GPT-4/GPT-5
Tokenizer tokenizer = TiktokenTokenizer.CreateForModel("gpt-5");

string source = "Text tokenization is the process of splitting a string into a list of tokens.";

// Count tokens
Console.WriteLine($"Tokens: {tokenizer.CountTokens(source)}");
// Output: Tokens: 16

// Encode to IDs
IReadOnlyList<int> ids = tokenizer.EncodeToIds(source);
Console.WriteLine($"Token IDs: {string.Join(", ", ids)}");

// Decode back to text
string? decoded = tokenizer.Decode(ids);
Console.WriteLine($"Decoded: {decoded}");

// Trim text to token limit (from start)
var trimIndex = tokenizer.GetIndexByTokenCount(source, 5, out string? processedText, out _);
processedText ??= source;
Console.WriteLine($"First 5 tokens: {processedText.Substring(0, trimIndex)}");
// Output: First 5 tokens: Text tokenization is the

// Trim text to token limit (from end)
trimIndex = tokenizer.GetIndexByTokenCountFromEnd(source, 5, out processedText, out _);
processedText ??= source;
Console.WriteLine($"Last 5 tokens: {processedText.Substring(trimIndex)}");
// Output: Last 5 tokens:  a list of tokens.
```

### Llama Tokenizer

**Usage**:

```csharp
using Microsoft.ML.Tokenizers;

// Download Llama tokenizer model from Hugging Face
using HttpClient httpClient = new();
const string modelUrl = @"https://huggingface.co/hf-internal-testing/llama-tokenizer/resolve/main/tokenizer.model";
using Stream remoteStream = await httpClient.GetStreamAsync(modelUrl);

Tokenizer llamaTokenizer = LlamaTokenizer.Create(remoteStream);

string input = "Hello, world!";

// Token operations
IReadOnlyList<int> ids = llamaTokenizer.EncodeToIds(input);
Console.WriteLine($"Token IDs: {string.Join(", ", ids)}");
// Output: Token IDs: 1, 15043, 29892, 3186, 29991

int tokenCount = llamaTokenizer.CountTokens(input);
Console.WriteLine($"Tokens: {tokenCount}");
// Output: Tokens: 5

string? decoded = llamaTokenizer.Decode(ids);
Console.WriteLine($"Decoded: {decoded}");
// Output: Decoded: Hello, world!

// Advanced options
ReadOnlySpan<char> textSpan = "Hello World".AsSpan();
ids = llamaTokenizer.EncodeToIds(textSpan, considerNormalization: false);
ids = llamaTokenizer.EncodeToIds(textSpan, considerPreTokenization: false);
ids = llamaTokenizer.EncodeToIds(textSpan, considerNormalization: false, considerPreTokenization: false);
```

### BPE (Byte-Pair Encoding) Tokenizer

**Usage**:

```csharp
using Microsoft.ML.Tokenizers;

// Download GPT-2 BPE files from Hugging Face
using HttpClient httpClient = new();
const string vocabUrl = @"https://huggingface.co/openai-community/gpt2/raw/main/vocab.json";
const string mergesUrl = @"https://huggingface.co/openai-community/gpt2/raw/main/merges.txt";

using Stream vocabStream = await httpClient.GetStreamAsync(vocabUrl);
using Stream mergesStream = await httpClient.GetStreamAsync(mergesUrl);

Tokenizer bpeTokenizer = BpeTokenizer.Create(vocabStream, mergesStream);

string text = "Hello, how are you doing today?";

// Basic operations
IReadOnlyList<int> ids = bpeTokenizer.EncodeToIds(text);
int tokenCount = bpeTokenizer.CountTokens(text);
string? decoded = bpeTokenizer.Decode(ids);

// Detailed token information
IReadOnlyList<EncodedToken> tokens = bpeTokenizer.EncodeToTokens(text, out string? normalizedString);
foreach (EncodedToken token in tokens)
{
    Console.WriteLine($"  ID: {token.Id}, Value: '{token.Value}'");
}
```

**Tokenizer Base Class Common Methods**:

| Method | Purpose |
|--------|---------|
| `EncodeToIds(text)` | Convert text to token IDs |
| `Decode(ids)` | Convert token IDs back to text |
| `CountTokens(text)` | Count total tokens in text |
| `EncodeToTokens(text, out normalized)` | Get token details (ID + value) |
| `GetIndexByTokenCount(text, count, out processed, out count)` | Find char index for N tokens from start |
| `GetIndexByTokenCountFromEnd(text, count, out processed, out count)` | Find char index for N tokens from end |

---

## Agent Architecture Patterns

### Agent Concepts

**Agents Are Systems That Accomplish Objectives**

Components of capable agents:
1. **Reasoning & Decision-Making** - LLMs, search algorithms, planning systems
2. **Tool Usage** - MCP servers, code execution, external APIs
3. **Context Awareness** - Chat history, vector stores, knowledge graphs

### Workflow Orchestration Patterns

| Pattern | Use Case | Flow |
|---------|----------|------|
| **Sequential** | Tasks with dependencies | Task Input → Agent A → Agent B → Agent C → Output |
| **Concurrent** | Independent parallel tasks | Task Input → (A, B, C in parallel) → Aggregate → Output |
| **Handoff** | Conditional role switching | Agent A → Decision → Agent B or Agent C → Output |
| **Group Chat** | Collaborative problem-solving | User + Agents collaborate in shared conversation |
| **Magentic** | Hierarchical orchestration | Lead agent directs other agents |

### Building Agents in .NET

**Foundation Components**:
- `Microsoft.Extensions.AI` - Chat and embedding abstractions
- `Microsoft.Extensions.VectorData` - Vector store abstractions
- `Microsoft.Agent.Framework` - Higher-level orchestration

---

## Key Integration Patterns

### Pattern 1: Chat + Function Invocation

```csharp
var client = new ChatClientBuilder(openAIClient.GetChatClient(model).AsIChatClient())
    .UseFunctionInvocation()
    .Build();
```

### Pattern 2: Embedding Pipeline with Caching

```csharp
var generator = new EmbeddingGeneratorBuilder<string, Embedding<float>>(baseGenerator)
    .UseDistributedCache(cache)
    .UseOpenTelemetry(sourceName: "embedding-gen")
    .Build();
```

### Pattern 3: Vector Search Workflow

1. Define model with `[VectorStoreVector]` attributes
2. Create `IEmbeddingGenerator` for embedding creation
3. Populate vector store with embeddings via `UpsertAsync`
4. Query with `SearchAsync` using query embedding

### Pattern 4: MCP Server + Chat Client

```csharp
// Server exposes tools via MCP
// Client discovers tools via McpClient.ListToolsAsync()
// Chat client uses tools for function invocation
```

---

## Common NuGet Package Combinations

**Minimal Chat Application**:
```bash
dotnet add package Microsoft.Extensions.AI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Microsoft.Extensions.Configuration.UserSecrets
dotnet add package OpenAI
```

**Function Calling Application**:
```bash
dotnet add package Microsoft.Extensions.AI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Microsoft.Extensions.Configuration.UserSecrets
```

**Vector Search / RAG Application**:
```bash
dotnet add package Microsoft.Extensions.AI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Microsoft.SemanticKernel.Connectors.InMemory --prerelease
dotnet add package Microsoft.Extensions.Configuration.UserSecrets
```

**MCP Server Application**:
```bash
# Install template first
dotnet new install Microsoft.McpServer.ProjectTemplates

# Create project
dotnet new mcpserver -n MyMcpServer --framework net10.0 --enable-native-aot false
```

**MCP Client Application**:
```bash
dotnet add package ModelContextProtocol --prerelease
dotnet add package Microsoft.Extensions.AI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Azure.AI.OpenAI
dotnet add package Azure.Identity
```

**Full-Featured Application (Chat + Functions + Embeddings + MCP)**:
```bash
dotnet add package Microsoft.Extensions.AI
dotnet add package Microsoft.Extensions.AI.OpenAI --prerelease
dotnet add package Microsoft.SemanticKernel.Connectors.InMemory --prerelease
dotnet add package ModelContextProtocol --prerelease
dotnet add package Microsoft.ML.Tokenizers
dotnet add package Microsoft.Extensions.Configuration.UserSecrets
dotnet add package Azure.AI.OpenAI
dotnet add package Azure.Identity
dotnet add package OpenAI
```

---

## Important Notes for Plugin Implementation

1. **All Microsoft.Extensions.AI packages use --prerelease flag** - These are actively developed beta libraries
2. **Vector stores require explicit model field decoration** - Use `[VectorStoreVector(Dimensions, DistanceFunction)]`
3. **MCP requires .NET 10.0 SDK minimum** - For official templates
4. **Function invocation is middleware** - Apply via `ChatClientBuilder` not directly
5. **Tokenizers are stable** - No prerelease flag needed
6. **DefaultAzureCredential requires role assignment** - Need "Azure AI Developer" role
7. **MCP servers/clients use **prerelease flag** - Official SDK still in active development
8. **Embedding models differ from chat models** - Use `text-embedding-3-small/large` for embeddings, `gpt-4o` for chat

---

## API Surface Summary

### IChatClient Operations
- Streaming: `GetStreamingResponseAsync(messages, options)`
- Completion: `GetResponseAsync(prompt, options)`
- Options include: `MaxOutputTokens`, `Temperature`, `Tools`, etc.

### IEmbeddingGenerator Operations
- Batch: `GenerateAsync(values, options, cancellation)`
- Single: `GenerateVectorAsync(value)` (accelerator)
- Result type: `GeneratedEmbeddings<T>` (collection of `Embedding<T>`)

### VectorStore Operations
- CRUD: `UpsertAsync()`, `GetAsync()`, `DeleteAsync()`
- Search: `SearchAsync(embedding, top: N)`
- Result: `VectorSearchResult<T>` with `.Record` and `.Score`

### MCP Operations
- Initialize: `McpClient.CreateAsync(transport)`
- Discover: `ListToolsAsync()` → `IList<McpClientTool>`
- Execute: Via chat client function invocation middleware

### Tokenizer Operations
- Count: `CountTokens(text)`
- Encode: `EncodeToIds(text)` → `IReadOnlyList<int>`
- Decode: `Decode(ids)` → `string?`
- Details: `EncodeToTokens(text, out normalized)` → `IReadOnlyList<EncodedToken>`

