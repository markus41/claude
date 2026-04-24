---
description: Design ETL transformation rules for field mapping, data cleansing, and format conversion to move data from source to destination systems with different data structures.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Transform Builder

Produce a complete ETL transformation specification for a data migration. Every source-to-destination field transformation is explicitly defined with input format, transformation logic, output format, and test cases. This document is used by the migration developer to implement the transformation pipeline.

## Transformation Catalog Overview

List all transformations in the migration by type:

| Transformation Type | Count | Complexity |
|--------------------|-------|------------|
| Direct copy (with type conversion) | N | Low |
| Lookup / code translation | N | Low-Medium |
| String operations | N | Low |
| Date format conversion | N | Low |
| Numeric conversion | N | Low |
| Conditional / derived | N | Medium |
| Multi-field derivation | N | Medium-High |
| Null handling | N | Low |

## Transformation Type Library

### DIRECT — Copy with Type Conversion

No transformation logic beyond data type conversion.

**Pattern**:
```
Source: [FieldName] ([SourceType])
Destination: [FieldName] ([DestType])
Transform: Cast [SourceType] to [DestType]
```

**Examples**:
```
Source: ClientID (int) → Destination: ExternalId (string)
Transform: ExternalId = ClientID.ToString()
Test: 10042 → "10042"

Source: PremiumAmount (decimal 18,2) → Destination: WrittenPremium (decimal 18,4)
Transform: Cast decimal to higher precision — no rounding needed
Test: 1250.00 → 1250.0000
```

### LOOKUP — Code Translation

Translate a source code to a destination value using a lookup table.

**Lookup table format**:

```
Transformation: StatusCode → PolicyStatus

| Source Value | Destination Value | Notes |
|-------------|------------------|-------|
| A | Active | |
| C | Cancelled | |
| X | Expired | |
| P | Pending | |
| E | Active | Endorsed = Active + separate endorsement record |
| R | Cancelled | Rescinded treated as cancelled |
| null | Pending | Null status defaults to Pending; log occurrence |
| (other) | [REJECT] | Unknown code — reject record, log source value |
```

**Implementation**:
```typescript
const STATUS_LOOKUP: Record<string, string | null> = {
  'A': 'Active',
  'C': 'Cancelled',
  'X': 'Expired',
  'P': 'Pending',
  'E': 'Active',
  'R': 'Cancelled',
};

function translateStatus(sourceCode: string | null): string {
  if (sourceCode === null) {
    logger.warn('Null status code — defaulting to Pending');
    return 'Pending';
  }
  const result = STATUS_LOOKUP[sourceCode];
  if (result === undefined) {
    throw new TransformationError(
      `Unknown status code: "${sourceCode}"`,
      'UNKNOWN_CODE',
      { field: 'StatusCode', value: sourceCode }
    );
  }
  return result;
}
```

**Test cases**:

| Input | Expected Output | Notes |
|-------|----------------|-------|
| "A" | "Active" | Happy path |
| "C" | "Cancelled" | Happy path |
| "E" | "Active" | Endorsed = Active |
| "R" | "Cancelled" | Rescinded = Cancelled |
| null | "Pending" | Null default |
| "" | [REJECT — UNKNOWN_CODE] | Empty string is not a known code |
| "Z" | [REJECT — UNKNOWN_CODE] | Unknown code |
| "a" (lowercase) | [REJECT] | Case-sensitive — or add .toUpperCase() if source has mixed case |

### STRING — String Operations

Text manipulation transformations.

**Trim whitespace** (apply to ALL text fields):
```typescript
function trim(value: string | null): string | null {
  return value?.trim() ?? null;
}
// Apply at the start of every string field transformation
```

**Name normalization** (Title Case):
```typescript
function toTitleCase(name: string | null): string | null {
  if (!name) return null;
  return name.trim()
    .toLowerCase()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
// Test: "MARTINEZ ELENA" → "Martinez Elena"
// Test: "  smith  " → "Smith"
// Test: null → null
```

**Concatenation** (full name from parts):
```typescript
function buildFullName(lastName: string | null, firstName: string | null): string | null {
  const last = lastName?.trim();
  const first = firstName?.trim();
  if (!last && !first) return null;
  if (!last) return first ?? null;
  if (!first) return last;
  return `${last}, ${first}`;
}
// Test: ("Martinez", "Elena") → "Martinez, Elena"
// Test: ("Smith", null) → "Smith"
// Test: (null, null) → null
```

**String truncation**:
```typescript
function truncate(value: string | null, maxLength: number, fieldName: string): string | null {
  if (!value) return null;
  if (value.length > maxLength) {
    migrationLog.warn(`Field truncated: ${fieldName}`, {
      originalLength: value.length,
      truncatedTo: maxLength
    });
    return value.substring(0, maxLength);
  }
  return value;
}
```

### DATE — Date Format Conversion

Normalize all dates to ISO 8601 format (YYYY-MM-DD for dates, YYYY-MM-DDTHH:mm:ssZ for datetimes).

**Multi-format date parser** (handles mixed format source data):
```typescript
const DATE_FORMATS = [
  'MM/DD/YYYY',    // US format: 01/15/2026
  'M/D/YYYY',      // US short: 1/15/2026
  'YYYY-MM-DD',    // ISO 8601: 2026-01-15
  'DD-MMM-YYYY',   // 15-JAN-2026
  'YYYYMMDD',      // Compact: 20260115
];

function parseDate(value: string | null): Date | null {
  if (!value || value.trim() === '') return null;
  
  for (const format of DATE_FORMATS) {
    const parsed = dayjs(value.trim(), format, true); // strict mode
    if (parsed.isValid()) return parsed.toDate();
  }
  
  // Log unparseable date for manual review
  migrationLog.error('Unparseable date value', { value });
  return null; // or throw depending on whether the field is required
}

// Output format: always ISO 8601
function formatDateISO(date: Date | null): string | null {
  return date ? dayjs(date).format('YYYY-MM-DD') : null;
}
```

**Test cases**:

| Input | Expected Output | Format Detected |
|-------|----------------|-----------------|
| "01/15/2026" | "2026-01-15" | MM/DD/YYYY |
| "2026-01-15" | "2026-01-15" | YYYY-MM-DD |
| "15-JAN-2026" | "2026-01-15" | DD-MMM-YYYY |
| "20260115" | "2026-01-15" | YYYYMMDD |
| "" | null | Empty |
| "13/45/2026" | null (error logged) | Invalid |

**Timezone handling**: All source dates stored without timezone are assumed to be in the firm's local timezone. Convert to UTC for storage in destination if destination uses UTC. Document the assumed timezone: `US/Eastern` (adjust for client).

### NUMERIC — Numeric Conversion

```typescript
// Currency: ensure 2 decimal places, non-negative
function parseCurrency(value: unknown): number {
  if (value === null || value === undefined) return 0; // or throw if required
  const n = typeof value === 'string' ? parseFloat(value.replace(/[$,]/g, '')) : Number(value);
  if (isNaN(n)) throw new TransformationError(`Invalid currency value: ${value}`);
  if (n < 0) throw new TransformationError(`Negative currency not allowed: ${n}`);
  return Math.round(n * 100) / 100; // round to 2 decimal places
}

// Test cases:
// "$1,250.00" → 1250.00
// "1250" → 1250.00
// "-50.00" → THROW (negative)
// null → 0.00
// "abc" → THROW (invalid)
```

### CONDITIONAL — Conditional Logic

```typescript
// Derive PolicyType from source fields
function derivePolicyType(
  isNewBusiness: boolean,
  isRenewal: boolean,
  policyNumber: string
): string {
  if (isNewBusiness) return 'New Business';
  if (isRenewal) return 'Renewal';
  // Fallback: derive from policy number format
  if (policyNumber.startsWith('NB-')) return 'New Business';
  if (policyNumber.startsWith('RN-')) return 'Renewal';
  return 'Unknown'; // Log this case
}
```

### CONST — Hardcoded Constant

```typescript
// Fields that require a fixed value regardless of source data
const CONSTANTS = {
  MigrationSource: 'Legacy-AMS-Migration',   // Track which records were migrated
  MigratedAt: new Date().toISOString(),       // Set at migration run time
  DataClassification: 'Confidential',          // All migrated records are confidential
};
```

## Null and Default Value Handling Policy

Define the null handling decision for every destination required field that may have a null source:

| Destination Field | Required | Source Null Handling | Default Value | Rationale |
|-----------------|----------|---------------------|---------------|-----------|
| PolicyStatus | Yes | Source never null — throw if null | — | Required field; null indicates data error |
| ProducerId | No | Set to null | null | Unassigned policies are valid |
| ExpirationDate | Yes | Derive from EffectiveDate + standard term | EffectiveDate + 365 days | Can be calculated |
| PremiumAmount | Yes | Default to 0 | 0.00 | Zero-premium records may be valid; log occurrence |
| LastName | Yes | Reject record | — | Cannot have client without name |
| BirthDate | No | Null accepted | null | Optional field |

## Data Cleansing Rules

Cleansing operations applied before transformation to fix known source data quality issues (identified in data profiling):

| Issue | Field | Cleanse Rule | Records Affected |
|-------|-------|-------------|-----------------|
| Leading/trailing spaces | All text fields | `.trim()` applied universally | All records |
| Mixed case in names | LastName, FirstName | Apply `toTitleCase()` | ~15% of records |
| Multiple spaces in name | LastName | Replace `/ {2,}/g` with single space | ~300 records |
| SSN in Notes field | Notes | Replace SSN pattern `\d{3}-\d{2}-\d{4}` with `[REDACTED]` | 14 records |
| Phone: non-digit characters | Phone | Strip all non-digits; keep 10 digits | All records |
| Negative premium (error) | WrittenPremium | Reject record — log for business review | 3 records |

## Transformation Sequence

When multiple transformations apply to one field, the order of operations matters:

```
For each source record:
  1. CLEANSE: Apply universal cleansing (trim all strings, normalize whitespace)
  2. VALIDATE: Check for critical null / invalid source values — reject record if critical
  3. LOOKUP: Apply code translations (status codes, LOB codes)
  4. DERIVE: Calculate derived fields (ExpirationDate from EffectiveDate, FullName from parts)
  5. FORMAT: Apply format conversions (dates, currency precision)
  6. CONST: Inject constant values (MigrationSource, MigratedAt)
  7. LOAD: Write to destination system
  8. LOG: Record success or failure in migration event log
```

## Transformation Test Cases Summary

For every transformation in the catalog, include at minimum:
- 1 happy path (typical valid input)
- 1 null/empty input test
- 1 edge case (boundary value, special character, maximum length)
- 1 invalid input test (expect rejection or error)

Collect all test cases into a test data file that the migration developer runs against the transformation functions before executing against real source data.

## Output Format

Deliver as:

1. Transformation catalog overview table (type counts)
2. Full transformation specifications (one section per transformation using the templates above)
3. All lookup tables (formatted tables, one per code field)
4. Null and default value handling policy table
5. Data cleansing rules table
6. Transformation sequence diagram (ordered steps)
7. Test case table (all fields: transformation, input, expected output, test category)
8. Implementation notes for developer (language/library recommendations, performance considerations for large datasets)
