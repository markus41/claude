---
description: Analyze source and target system schemas to map structural differences and identify migration complexity at the start of a data migration engagement.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Schema Analyzer

Produce a complete schema analysis and comparison document for a data migration. This is the first deliverable in a migration engagement. The output drives field mapping, transformation design, and complexity estimation for the rest of the project.

## Source Schema Extraction

Extract the schema from the source system using the method appropriate for the system type:

### SQL Server Source

```sql
-- Extract full table schema
SELECT 
    t.name AS TableName,
    c.name AS ColumnName,
    tp.name AS DataType,
    c.max_length AS MaxLength,
    c.precision AS Precision,
    c.scale AS Scale,
    c.is_nullable AS IsNullable,
    c.is_identity AS IsIdentity,
    dc.definition AS DefaultValue,
    ep.value AS ColumnDescription
FROM sys.tables t
JOIN sys.columns c ON t.object_id = c.object_id
JOIN sys.types tp ON c.user_type_id = tp.user_type_id
LEFT JOIN sys.default_constraints dc ON c.default_object_id = dc.object_id
LEFT JOIN sys.extended_properties ep ON ep.major_id = t.object_id 
    AND ep.minor_id = c.column_id AND ep.name = 'MS_Description'
WHERE t.type = 'U'
ORDER BY t.name, c.column_id;

-- Extract foreign key relationships
SELECT 
    fk.name AS ForeignKeyName,
    OBJECT_NAME(fk.parent_object_id) AS ParentTable,
    COL_NAME(fkc.parent_object_id, fkc.parent_column_id) AS ParentColumn,
    OBJECT_NAME(fk.referenced_object_id) AS ReferencedTable,
    COL_NAME(fkc.referenced_object_id, fkc.referenced_column_id) AS ReferencedColumn
FROM sys.foreign_keys fk
JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
ORDER BY ParentTable, ParentColumn;
```

### Dataverse Source

Use the Dataverse Web API to extract entity metadata:
```
GET [org-url]/api/data/v9.2/EntityDefinitions?$select=LogicalName,DisplayName,Description
GET [org-url]/api/data/v9.2/EntityDefinitions(LogicalName='account')/Attributes?$select=LogicalName,AttributeType,RequiredLevel,DisplayName
```

### SharePoint List Source

Export list schema via PowerShell:
```powershell
Connect-PnPOnline -Url $siteUrl -Interactive
$list = Get-PnPList -Identity "ListName"
$fields = Get-PnPField -List "ListName"
$fields | Select-Object InternalName, TypeAsString, Required, MaxLength, DefaultValue |
  Export-Csv ".\sharepoint-schema.csv" -NoTypeInformation
```

### CSV / Excel Source

Document the schema by inspection:
- Column headers (as-is from the file)
- Inferred data type (text, number, date, boolean)
- Presence of null/empty values (sample 100 rows)
- Distinct value count (for potential code/lookup fields)
- File encoding and delimiter

## Source Schema Documentation

For each entity/table being migrated, produce:

**Entity**: [Table/List name]
**Record count**: [Approximate count]
**Primary key**: [Column name and type]
**System of record**: [System name]

| Column Name | Data Type | Length / Precision | Nullable | Default | Foreign Key | Sample Values | Notes |
|-------------|-----------|-------------------|----------|---------|-------------|---------------|-------|
| ClientID | int | — | No | Identity | — | 10042, 10043 | Auto-increment |
| LastName | varchar | 100 | No | — | — | "Martinez" | |
| FirstName | varchar | 100 | No | — | — | "Elena" | |
| SSN | char | 11 | Yes | — | — | "***-**-****" | MUST be masked in migration |
| DateOfBirth | date | — | Yes | — | — | 1975-03-14 | |
| State | char | 2 | No | — | — | "CA", "TX" | 2-letter USPS code |
| AgentCode | varchar | 20 | Yes | — | → Agents.AgentCode | "AG-001" | |
| StatusCode | char | 1 | No | 'A' | — | "A", "I", "D" | A=Active, I=Inactive, D=Deceased |
| CreateDate | datetime | — | No | GetDate() | — | | Server default — not user-controlled |
| Notes | nvarchar | 4000 | Yes | — | — | | Free text |

## Target Schema Documentation

Document the destination system's schema for the same entities:

**Entity**: [Destination entity name]
**System**: [Destination system name]
**Write method**: REST API / SQL INSERT / Dataverse upsert / SharePoint list item

| Field Name | Data Type | Required | Max Length | Validation | Default | Notes |
|-----------|-----------|----------|------------|------------|---------|-------|
| Id | GUID | No (auto) | — | System-assigned | — | Do not populate |
| LastName | string | Yes | 150 | Not blank | — | |
| FirstName | string | Yes | 150 | Not blank | — | |
| TaxId | string | No | 20 | Encrypted at rest | — | Destination for SSN — encrypted |
| BirthDate | date | No | — | Must be in past | — | |
| StateCode | string | Yes | 2 | Must be valid US state | — | Same format as source |
| AgentId | GUID | No | — | Must exist in Agent entity | — | Resolved from AgentCode |
| Status | string | Yes | 20 | Enum: Active, Inactive, Deceased | Active | |
| Remarks | string | No | 5000 | | | Larger than source — no truncation needed |
| CreatedOn | datetime | No (auto) | — | System-assigned | — | |
| ExternalId | string | No | 100 | | — | Populate with source ClientID for traceability |

## Schema Comparison

Produce a side-by-side comparison identifying all differences:

### Coverage Analysis

**Source fields with no destination mapping** (document each — confirm discard is intentional):

| Source Field | Reason Not Mapped | Action Required |
|-------------|------------------|----------------|
| CreateDate | Destination uses system-assigned CreatedOn | Confirm with client — no action |
| [field] | [reason] | [action] |

**Destination required fields with no source** (must resolve before migration can proceed):

| Destination Field | Required | Available Source? | Resolution |
|------------------|----------|------------------|------------|
| [field] | Yes | No | Derive from [other source field] / Apply default value "[value]" / Block migration until source provides data |

### Data Type Mismatches

| Source Field | Source Type | Destination Field | Destination Type | Conversion Required |
|-------------|-------------|------------------|-----------------|-----------------------|
| ClientID (int) | int | ExternalId | string(100) | Cast integer to string |
| DateOfBirth (date) | date | BirthDate | date | Direct mapping — same type |
| StatusCode (char 1) | char(1) | Status | string(20) | Lookup table translation |
| Notes (nvarchar 4000) | nvarchar(4000) | Remarks | string(5000) | Direct mapping — destination wider |
| SSN (char 11) | char(11) | TaxId | string(20) — encrypted | Encryption at rest handled by destination API |

### Field Length Mismatches

| Source Field | Source Length | Destination Field | Destination Length | Risk |
|-------------|--------------|------------------|--------------------|------|
| LastName | varchar(100) | LastName | string(150) | None — destination wider |
| [if source wider] | | | | Truncation required — document |

### Relationship Mapping

| Source Relationship | Source FK | Destination Relationship | Resolution |
|--------------------|-----------|------------------------|-----------|
| Client → Agent (via AgentCode) | Clients.AgentCode → Agents.AgentCode | Client → Agent (via AgentId GUID) | Build AgentCode → AgentId lookup table; migrate Agents first |
| Policy → Client (via ClientID int) | Policies.ClientID → Clients.ClientID | Policy → Client (via ClientId GUID) | Build ClientID → new GUID mapping table during client migration |

## Business Logic Identification

Document any business logic embedded in the source system that must be replicated in migration:

| Logic Type | Description | Source Location | Migration Action |
|-----------|-------------|-----------------|-----------------|
| Calculated field | AnnualPremium = MonthlyPremium × 12 | Not stored; always calculated | Replicate calculation in migration transform |
| Status derivation | Policy status "Expired" when ExpirationDate < today | SQL view logic | Apply same logic in WHERE clause of migration query |
| Lookup/decode | StatusCode 'A' = Active, 'I' = Inactive | Application code (not in DB) | Build lookup table, confirm with client |
| Cascade | Client delete cascades to Policy records | FK with CASCADE | Test: verify destination handles orphan records |

## Migration Complexity Scoring

Rate each entity/table by migration complexity:

| Rating | Criteria |
|--------|----------|
| Simple | Direct field copy with type conversion only. No lookups, no derived fields, no business logic. |
| Medium | Requires lookup table translation OR derived fields OR data cleansing on < 5 fields. |
| Complex | Business logic replication, major data model restructuring, many-to-many relationship resolution, or data cleansing on > 5 fields. |

**Entity complexity table**:

| Entity | Records | Complexity | Rationale |
|--------|---------|------------|-----------|
| Clients | 12,450 | Medium | Status code lookup, SSN encryption, AgentCode → GUID resolution |
| Policies | 38,200 | Complex | Multiple relationship resolutions, status logic, term calculation |
| Claims | 4,100 | Medium | Status lookup, client GUID resolution |
| Agents | 85 | Simple | Direct mapping, minimal transformation |
| Attachments | 28,000 | Complex | Binary file migration, path restructuring, SharePoint upload |

## Output Format

Deliver as:

1. Source schema extraction method and queries used
2. Source schema documentation (one table per entity)
3. Target schema documentation (one table per entity)
4. Schema comparison tables:
   - Unmapped source fields
   - Destination required fields with no source
   - Data type mismatches
   - Field length mismatches
   - Relationship mapping
5. Business logic catalog
6. Complexity scoring table with rationale
7. Open questions (items requiring client confirmation before field mapping proceeds)
8. Next steps (recommended order: data profiling → field mapping → transformation design → test migration)
