# API Contracts

> Important endpoints, request/response shapes, status codes, versioning.

## Endpoints

| Method | Path | Description | Auth |
|---|---|---|---|
| _GET_ | _/api/v1/resource_ | _Description_ | _Bearer token_ |

## Request/Response Patterns

_Standard envelope, pagination, error format._

## Status Codes

| Code | Meaning |
|---|---|
| 200 | Success |
| 201 | Created |
| 400 | Bad request (validation error) |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not found |
| 422 | Unprocessable entity |
| 500 | Internal server error |

## Versioning

_How API versions are managed._
