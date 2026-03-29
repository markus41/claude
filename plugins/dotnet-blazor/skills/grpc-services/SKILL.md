---
name: grpc-services
description: gRPC service development in .NET for high-performance inter-service communication
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Bash
triggers:
  - grpc
  - protobuf
  - proto file
  - grpc service
  - grpc client
---

# gRPC Services in .NET

## Proto File

```protobuf
syntax = "proto3";
option csharp_namespace = "MyApp.Grpc";
package catalog;

service CatalogService {
  rpc GetProduct (GetProductRequest) returns (ProductResponse);
  rpc ListProducts (ListProductsRequest) returns (ListProductsResponse);
  rpc CreateProduct (CreateProductRequest) returns (ProductResponse);
  rpc StreamProducts (StreamRequest) returns (stream ProductResponse);
}

message GetProductRequest { int32 id = 1; }
message ListProductsRequest {
  int32 page = 1;
  int32 page_size = 2;
  string search = 3;
}
message ListProductsResponse {
  repeated ProductResponse products = 1;
  int32 total_count = 2;
}
message CreateProductRequest {
  string name = 1;
  string description = 2;
  double price = 3;
}
message ProductResponse {
  int32 id = 1;
  string name = 2;
  string description = 3;
  double price = 4;
}
message StreamRequest { string filter = 1; }
```

## Service Implementation

```csharp
public sealed class CatalogGrpcService(ICatalogService catalog, ILogger<CatalogGrpcService> logger)
    : CatalogService.CatalogServiceBase
{
    public override async Task<ProductResponse> GetProduct(
        GetProductRequest request, ServerCallContext context)
    {
        var product = await catalog.GetByIdAsync(request.Id, context.CancellationToken)
            ?? throw new RpcException(new Status(StatusCode.NotFound, $"Product {request.Id} not found"));

        return MapToResponse(product);
    }

    public override async Task StreamProducts(
        StreamRequest request, IServerStreamWriter<ProductResponse> responseStream, ServerCallContext context)
    {
        await foreach (var product in catalog.StreamAsync(request.Filter, context.CancellationToken))
        {
            await responseStream.WriteAsync(MapToResponse(product));
        }
    }
}
```

## Server Setup

```csharp
builder.Services.AddGrpc();
app.MapGrpcService<CatalogGrpcService>();
```

## Client (with Aspire)

```csharp
builder.Services.AddGrpcClient<CatalogService.CatalogServiceClient>(o =>
{
    o.Address = new("https+http://catalog-api");
})
.AddStandardResilienceHandler();
```

## gRPC vs REST Decision Matrix (from official docs)

| Aspect | gRPC | REST/HTTP |
|--------|------|----------|
| Serialization | Protocol Buffers (binary) | JSON (text) |
| Protocol | HTTP/2 | HTTP/1.1 or HTTP/2 |
| Payload size | Small, compressed | Larger, human-readable |
| Latency | Low (~10x faster) | Higher |
| Browser support | Limited (gRPC-Web) | Full |
| Code generation | Automatic (contract-first) | Manual |
| Streaming | Native, bidirectional | Limited |
| Debugging | Binary (harder) | Easy (HTTP tools) |
| Use case | Microservices, real-time | Public APIs, browsers |

## All 4 RPC Patterns (from official docs)

### Client Streaming
```csharp
// Stream of requests → single response
public override async Task<HelloReply> LotsOfGreetings(
    IAsyncStreamReader<HelloRequest> requestStream, ServerCallContext context)
{
    var count = 0;
    await foreach (var request in requestStream.ReadAllAsync())
    {
        count++;
    }
    return new HelloReply { Message = $"Processed {count} greetings" };
}
```

### Bidirectional Streaming
```csharp
// Stream requests ↔ stream responses simultaneously
public override async Task BidiHello(
    IAsyncStreamReader<HelloRequest> requestStream,
    IServerStreamWriter<HelloReply> responseStream,
    ServerCallContext context)
{
    await foreach (var request in requestStream.ReadAllAsync())
    {
        await responseStream.WriteAsync(new HelloReply
        {
            Message = $"Echo: {request.Name}"
        });
    }
}
```

## Project Setup (from official docs)

```xml
<!-- .csproj -->
<ItemGroup>
  <Protobuf Include="Protos\greet.proto" />
</ItemGroup>
```

```bash
dotnet add package Grpc.AspNetCore
dotnet add package Grpc.Tools
```

## Best Practices

- Use gRPC for internal service-to-service communication
- Use REST/HTTP for external APIs (browser compatibility)
- Use server streaming for large result sets
- Use `Deadline` for request timeouts
- Use interceptors for cross-cutting concerns (logging, auth)
- Add `.proto` files to `<Protobuf>` item group in .csproj
- Binary format = harder debugging; use gRPC reflection for tooling
