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

## Best Practices

- Use gRPC for internal service-to-service communication
- Use REST/HTTP for external APIs (browser compatibility)
- Use server streaming for large result sets
- Use `Deadline` for request timeouts
- Use interceptors for cross-cutting concerns (logging, auth)
