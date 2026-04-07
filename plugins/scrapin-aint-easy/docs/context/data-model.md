# Data Model

> Main entities, relationships, and invariants.

## Entities

_Key data entities and their fields._

## Relationships

_How entities relate to each other (1:1, 1:N, N:M)._

## Invariants

_Data rules that must always hold:_

- _Example: "Every order must have at least one line item"_
- _Example: "User email must be unique within a tenant"_

## Storage

| Data Type | Store | Retention |
|---|---|---|
| _Transactional_ | _PostgreSQL_ | _Indefinite_ |
| _Cache_ | _Redis_ | _TTL-based_ |
| _Documents_ | _S3_ | _Per policy_ |
