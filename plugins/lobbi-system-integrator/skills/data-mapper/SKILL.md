---
description: Design field mapping specifications between source and destination systems for synchronizing insurance AMS and CRM data, LOS to reporting systems, or data migrations between platforms.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Data Mapper

Produce a complete field mapping specification between a source system and a destination system. This document is the definitive reference for transforming data from source to destination format. Every field mapping is explicit — no ambiguity about what transformation applies.

## Source System Data Model

Document the source system's data model for the entities being synchronized:

**Source system**: [System name] — [version/API version]
**Extraction method**: REST API / SQL query / CSV export / event stream

**Source entity**: [Entity name] (e.g., Policy, Client, Loan Application)

| Field Name | Data Type | Nullable | Format / Valid Values | Example | Notes |
|-----------|-----------|----------|----------------------|---------|-------|
| policy_id | string | No | UUID format | `a1b2c3d4-...` | System-assigned, immutable |
| policy_number | string | No | Alpha-numeric, max 20 chars | `POL-2026-001042` | Human-readable |
| client_id | string | No | Integer as string | `"10042"` | References client record |
| effective_date | string | No | YYYY-MM-DD | `"2026-01-15"` | ISO 8601 date only |
| premium_amount | number | No | Decimal, 2 places | `1250.00` | USD, never negative |
| status_code | string | No | Enum: A, C, X, P, E | `"A"` | A=Active, C=Cancelled, X=Expired, P=Pending, E=Endorsed |
| lob_code | string | No | Enum: AU, HO, LI, CO, UM | `"AU"` | Line of business code |
| producer_npi | string | Yes | NPI format or null | `"1234567890"` | Null for direct business |
| notes | string | Yes | Free text, max 2000 chars | | May contain special characters |
| created_at | string | No | ISO 8601 datetime with TZ | `"2026-01-15T09:30:00-05:00"` | |
| modified_at | string | No | ISO 8601 datetime with TZ | | Used for delta sync |

Repeat this table for each source entity involved in the integration.

## Destination System Data Model

Document the destination system's expected data structure:

**Destination system**: [System name]
**Write method**: REST API POST/PUT / SQL INSERT/UPDATE / Dataverse record / SharePoint list item

**Destination entity**: [Entity name]

| Field Name | Data Type | Required | Validation Rules | Foreign Key | Notes |
|-----------|-----------|----------|-----------------|-------------|-------|
| PolicyId | GUID | No (auto-generated) | | | System assigns on creation |
| PolicyNumber | string(50) | Yes | Must be unique | | |
| ClientId | GUID | Yes | Must exist in Client table | → Client | |
| EffectiveDate | datetime | Yes | Must be >= 1990-01-01 | | |
| ExpirationDate | datetime | Yes | Must be > EffectiveDate | | |
| PremiumAmount | decimal(18,2) | Yes | Must be >= 0 | | |
| PolicyStatus | string(20) | Yes | Enum: Active, Cancelled, Expired, Pending | | |
| LineOfBusiness | string(30) | Yes | Enum: Auto, Homeowners, Life, Commercial, Umbrella | | |
| ProducerId | GUID | No | Must exist in Producer table if provided | → Producer | |
| Notes | string(4000) | No | | | |
| CreatedDate | datetime | No (system-assigned) | | | |
| LastModifiedDate | datetime | No (system-assigned) | | | |
| ExternalSystemId | string(100) | No | Used for sync tracking | | Store source policy_id here |

## Field Mapping Table

The core of this specification. Every source field is mapped to a destination field with a transformation.

**Transformation type legend**:
- **DIRECT**: Copy value as-is (with data type conversion only)
- **LOOKUP**: Translate a code value using a lookup table
- **FORMULA**: Derive the value through a calculation
- **SPLIT**: One source field → multiple destination fields
- **CONCAT**: Multiple source fields → one destination field
- **CONST**: Hardcoded constant value regardless of source
- **DERIVED**: Calculated from one or more source fields using business logic
- **OMIT**: Source field is not mapped to any destination field (confirm this is intentional)

| # | Source Field | Destination Field | Transform Type | Transformation Logic | Null Handling |
|---|-------------|------------------|----------------|---------------------|---------------|
| 1 | policy_id | ExternalSystemId | DIRECT | Copy as string | Error — source never null |
| 2 | policy_number | PolicyNumber | DIRECT | Copy as string | Error — source never null |
| 3 | client_id | ClientId | LOOKUP | Look up client in destination by ExternalSystemId = source.client_id. Use destination GUID. If not found: reject record, log error. | Error — required |
| 4 | effective_date | EffectiveDate | FORMULA | Parse ISO date "YYYY-MM-DD", convert to destination datetime with time 00:00:00 UTC | Error — required |
| 5 | effective_date + 365 days | ExpirationDate | DERIVED | ExpirationDate = EffectiveDate + policy term days. Term days comes from lob_code lookup: AU=365, HO=365, LI=365, CO=365. | Error — required |
| 6 | premium_amount | PremiumAmount | DIRECT | Convert number to decimal(18,2) | Default: 0.00 |
| 7 | status_code | PolicyStatus | LOOKUP | See Status Code lookup table below | Error — required |
| 8 | lob_code | LineOfBusiness | LOOKUP | See LOB Code lookup table below | Error — required |
| 9 | producer_npi | ProducerId | LOOKUP | Look up producer in destination by NPI. Use destination GUID. If not found: set to null (not reject). | Default: null |
| 10 | notes | Notes | DIRECT | Copy as string. Truncate to 4000 chars if longer. Log truncation. | Default: null |
| 11 | (none) | CreatedDate | CONST | Do not set — destination system assigns. | N/A |
| 12 | created_at | (log only) | OMIT | Not stored in destination. Preserved in integration event log for audit. | — |

## Lookup Tables

### Status Code Mapping

| Source Code | Source Meaning | Destination Value | Notes |
|------------|---------------|------------------|-------|
| A | Active | Active | |
| C | Cancelled | Cancelled | |
| X | Expired | Expired | |
| P | Pending | Pending | |
| E | Endorsed (active with endorsement) | Active | Endorsed policies are Active in destination; endorsement detail stored separately |
| R | Rescinded | Cancelled | Treat as cancelled in destination |
| *(any other)* | Unknown | — | Reject record, log unknown code |

### Line of Business Code Mapping

| Source Code | Source Meaning | Destination Value |
|------------|---------------|------------------|
| AU | Automobile | Auto |
| HO | Homeowners | Homeowners |
| LI | Life | Life |
| CO | Commercial Lines | Commercial |
| UM | Umbrella | Umbrella |
| BO | BOP (Business Owners Policy) | Commercial |
| WC | Workers Compensation | Commercial |
| *(any other)* | Unknown | Reject — log for review |

### Producer NPI Lookup

Maintain a mapping table: source NPI → destination ProducerId (GUID). Built at sync startup, refreshed hourly.

If a producer NPI arrives that is not in the mapping table:
- Do not reject the policy record
- Set ProducerId to null (unassigned)
- Add the unknown NPI to a "Unknown Producers" tracking list for manual resolution

## Transformation Logic Detail

For complex transformations, provide implementation-level detail:

### Transformation #5: ExpirationDate Derivation

```typescript
function deriveExpirationDate(effectiveDate: Date, lobCode: string): Date {
  const termDaysByLob: Record<string, number> = {
    'AU': 365, 'HO': 365, 'LI': 365, 'CO': 365, 'UM': 365,
    'BO': 365, 'WC': 365
  };
  
  const termDays = termDaysByLob[lobCode];
  if (!termDays) {
    throw new MappingError(`Unknown LOB code for term calculation: ${lobCode}`);
  }
  
  const expiration = new Date(effectiveDate);
  expiration.setDate(expiration.getDate() + termDays);
  return expiration;
}
```

### String Truncation Logging

When a string field is truncated to fit the destination column limit:
```typescript
if (sourceValue.length > maxLength) {
  integrationLog.warn('Field truncated', {
    field: 'notes',
    originalLength: sourceValue.length,
    truncatedTo: maxLength,
    policyId: record.policy_id
  });
  return sourceValue.substring(0, maxLength);
}
```

## Unmapped Source Fields

These source fields have no destination mapping. Confirm with the client that discarding them is intentional:

| Source Field | Reason Not Mapped | Business Confirmation |
|-------------|------------------|----------------------|
| created_at | Destination uses system-assigned CreatedDate | Confirmed [date] |
| modified_at | Used for delta sync logic only, not stored | Confirmed [date] |
| internal_ref | Legacy field, no business value | Pending confirmation |

Do not proceed with go-live if any unmapped field marked "Pending confirmation" is not resolved.

## Output Format

Deliver as:

1. Source system data model table (all fields for each entity)
2. Destination system data model table (all fields for each entity)
3. Field mapping table (all rows with transformation type and logic)
4. Lookup tables (one table per code translation)
5. Complex transformation detail (pseudocode for non-trivial transformations)
6. Unmapped fields table (with confirmation status)
7. Null handling summary (which fields cause record rejection vs. applying a default)
8. Test cases derived from the mapping (for each lookup table: at least one test per source code; for each DERIVED field: at least two test cases including edge cases)
