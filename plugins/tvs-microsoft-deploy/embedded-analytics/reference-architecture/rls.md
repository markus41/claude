# Row-Level Security (RLS) Reference

## Scope

Define patterns for enforcing data boundaries in shared semantic models used for embedded analytics.

## Recommended Pattern

- Create a `TenantAccess` table keyed by `TenantId` and principal identifier.
- Relate facts/dimensions to `TenantId`.
- Define role filter expression (example):

```DAX
[TenantId] IN
    SELECTCOLUMNS(
        FILTER(TenantAccess, TenantAccess[PrincipalObjectId] = USEROBJECTID()),
        "TenantId", TenantAccess[TenantId]
    )
```

## Effective Identity

When generating embed tokens, provide effective identity with:

- `username` or object identifier,
- roles,
- datasets list,
- custom data (optional for advanced filters).

## Validation Checklist

- Positive tests: users see only authorized tenant rows.
- Negative tests: cross-tenant access attempts return empty result sets.
- Aggregate leakage tests: totals/subtotals do not expose unauthorized counts.
- Export tests: data export adheres to same row constraints.

## Common Pitfalls

- RLS applied on facts but not conformed dimensions.
- Inconsistent tenant key normalization.
- Admin accounts bypassing role tests in QA and masking defects.
