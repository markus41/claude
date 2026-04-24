---
description: Profile source data quality, completeness, and anomalies before migration to identify cleansing requirements and assess fitness for migration.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Data Profiler

Produce a complete data quality assessment for the source system data. The output is a data quality scorecard that drives cleansing priorities and determines which data issues must be fixed before migration and which can be resolved during transformation. No migration should proceed to production cutover without a completed data profile.

## Profiling Queries

Run these queries against the source system. Document the results for every entity being migrated.

### Completeness Analysis

```sql
-- Null rate per column (SQL Server)
SELECT
    'Clients' AS TableName,
    SUM(CASE WHEN ClientID IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS ClientID_NullPct,
    SUM(CASE WHEN LastName IS NULL OR LastName = '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS LastName_NullPct,
    SUM(CASE WHEN FirstName IS NULL OR FirstName = '' THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS FirstName_NullPct,
    SUM(CASE WHEN SSN IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS SSN_NullPct,
    SUM(CASE WHEN DateOfBirth IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS DateOfBirth_NullPct,
    SUM(CASE WHEN AgentCode IS NULL THEN 1 ELSE 0 END) * 100.0 / COUNT(*) AS AgentCode_NullPct,
    COUNT(*) AS TotalRecords
FROM dbo.Clients;
```

**Null rate interpretation**:

| Null Rate | Severity | Action |
|-----------|----------|--------|
| 0% | None | No action needed |
| 1-5% | Low | Accept if field is optional in destination; investigate if required |
| 5-20% | Medium | Identify pattern (batch of records from specific period?), cleanse or default |
| > 20% | High | Must resolve before migration — either cleanse, derive, or confirm field is not required |

Document results:

| Table | Column | Null / Empty Count | Null % | Destination Required | Action |
|-------|--------|--------------------|--------|---------------------|--------|
| Clients | LastName | 0 | 0% | Yes | No action |
| Clients | DateOfBirth | 1,245 | 10% | No | Accept null — destination field is optional |
| Clients | AgentCode | 340 | 2.7% | No | Set ProducerId to null in destination |
| Clients | SSN | 8,200 | 66% | No (encrypted, optional) | Accept null |

### Uniqueness Analysis

```sql
-- Duplicate detection on natural key fields
SELECT 
    PolicyNumber,
    COUNT(*) AS DuplicateCount
FROM dbo.Policies
GROUP BY PolicyNumber
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC;

-- Total duplicates
SELECT COUNT(*) AS TotalDuplicateGroups
FROM (
    SELECT PolicyNumber, COUNT(*) cnt 
    FROM dbo.Policies 
    GROUP BY PolicyNumber 
    HAVING COUNT(*) > 1
) d;

-- Sample of duplicate records (to understand the pattern)
SELECT TOP 20 p.*
FROM dbo.Policies p
WHERE p.PolicyNumber IN (
    SELECT PolicyNumber FROM dbo.Policies GROUP BY PolicyNumber HAVING COUNT(*) > 1
)
ORDER BY p.PolicyNumber, p.CreateDate;
```

Document:

| Table | Key Field | Total Records | Duplicate Groups | Records in Duplicate Groups | Duplicate % |
|-------|-----------|--------------|-----------------|----------------------------|------------|
| Policies | PolicyNumber | 38,200 | 42 | 89 | 0.23% |
| Clients | SSN (non-null) | 4,085 | 7 | 16 | 0.39% |

**De-duplication strategy** (choose based on the pattern found):

| Strategy | When to Use |
|----------|------------|
| Keep latest by date | Duplicates are updates that did not properly replace the original |
| Keep highest status | Active > Pending > Cancelled — the more complete record wins |
| Merge fields | Both records have partial data that completes the full record — merge fields |
| Manual review | Duplicates cannot be programmatically resolved — flag for business review |

### Format Consistency

```sql
-- Date format distribution (for varchar date columns)
SELECT 
    CASE 
        WHEN EffectiveDate LIKE '[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]' THEN 'MM/DD/YYYY'
        WHEN EffectiveDate LIKE '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'YYYY-MM-DD'
        WHEN EffectiveDate IS NULL THEN 'NULL'
        ELSE 'OTHER: ' + LEFT(EffectiveDate, 20)
    END AS FormatPattern,
    COUNT(*) AS RecordCount
FROM dbo.OldPolicies -- tables with varchar date columns
GROUP BY 
    CASE 
        WHEN EffectiveDate LIKE '[0-9][0-9]/[0-9][0-9]/[0-9][0-9][0-9][0-9]' THEN 'MM/DD/YYYY'
        WHEN EffectiveDate LIKE '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]' THEN 'YYYY-MM-DD'
        WHEN EffectiveDate IS NULL THEN 'NULL'
        ELSE 'OTHER: ' + LEFT(EffectiveDate, 20)
    END;

-- Phone number format distribution
SELECT 
    CASE 
        WHEN Phone LIKE '[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]' THEN 'NNN-NNN-NNNN'
        WHEN Phone LIKE '([0-9][0-9][0-9]) [0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]' THEN '(NNN) NNN-NNNN'
        WHEN Phone LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' THEN 'NNNNNNNNNN'
        WHEN Phone IS NULL THEN 'NULL'
        ELSE 'OTHER'
    END AS FormatPattern,
    COUNT(*) AS RecordCount
FROM dbo.Clients
GROUP BY 
    CASE 
        WHEN Phone LIKE '[0-9][0-9][0-9]-[0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]' THEN 'NNN-NNN-NNNN'
        WHEN Phone LIKE '([0-9][0-9][0-9]) [0-9][0-9][0-9]-[0-9][0-9][0-9][0-9]' THEN '(NNN) NNN-NNNN'
        WHEN Phone LIKE '[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]' THEN 'NNNNNNNNNN'
        WHEN Phone IS NULL THEN 'NULL'
        ELSE 'OTHER'
    END;
```

Document the findings and the normalization rule:

| Field | Formats Found | Count per Format | Normalization Rule |
|-------|--------------|-----------------|-------------------|
| EffectiveDate | MM/DD/YYYY (35,100), YYYY-MM-DD (2,800), NULL (300) | — | Parse all formats, output ISO 8601 YYYY-MM-DD |
| Phone | NNN-NNN-NNNN (8,200), (NNN) NNN-NNNN (1,800), NNNNNNNNNN (950), NULL (1,500) | — | Strip all non-digits, store as 10-digit string |

**SSN masking verification**:
```sql
-- Verify SSN data is not exposed in other columns
SELECT TOP 10 Notes FROM dbo.Clients WHERE Notes LIKE '%[0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9][0-9][0-9]%';
-- If any rows returned: SSN embedded in notes — must be scrubbed before migration
```

### Referential Integrity

```sql
-- Orphaned policies (no matching client)
SELECT 
    COUNT(*) AS OrphanedPolicies,
    COUNT(*) * 100.0 / (SELECT COUNT(*) FROM dbo.Policies) AS OrphanPct
FROM dbo.Policies p
WHERE NOT EXISTS (SELECT 1 FROM dbo.Clients c WHERE c.ClientID = p.ClientID);

-- Show sample orphaned records
SELECT TOP 20 p.PolicyNumber, p.ClientID, p.CreateDate
FROM dbo.Policies p
WHERE NOT EXISTS (SELECT 1 FROM dbo.Clients c WHERE c.ClientID = p.ClientID)
ORDER BY p.CreateDate DESC;

-- Claims with no matching policy
SELECT COUNT(*) AS OrphanedClaims
FROM dbo.Claims cl
WHERE NOT EXISTS (SELECT 1 FROM dbo.Policies p WHERE p.PolicyID = cl.PolicyID);
```

Document:

| Parent Table | Child Table | Orphan Count | Orphan % | Recommended Action |
|-------------|-------------|-------------|----------|-------------------|
| Clients | Policies | 12 | 0.03% | Investigate — these are old records; likely client deleted without cascade. Exclude from migration or create placeholder client records. |
| Policies | Claims | 0 | 0% | No action |
| Agents | Policies | 7 | 0.02% | Agent left firm; create inactive placeholder agent record |

### Value Distribution

For code fields (status codes, LOB codes, state codes), profile all distinct values:

```sql
-- Status code distribution
SELECT StatusCode, COUNT(*) AS RecordCount, COUNT(*) * 100.0 / SUM(COUNT(*)) OVER() AS Pct
FROM dbo.Policies
GROUP BY StatusCode
ORDER BY RecordCount DESC;
```

Document and flag any codes not in the expected value set:

| Code Field | Value | Count | % | In Destination Lookup? |
|-----------|-------|-------|---|----------------------|
| StatusCode | A | 28,450 | 74.5% | Yes → Active |
| StatusCode | C | 8,100 | 21.2% | Yes → Cancelled |
| StatusCode | X | 1,550 | 4.1% | Yes → Expired |
| StatusCode | P | 98 | 0.3% | Yes → Pending |
| StatusCode | Z | 2 | 0.01% | **No — unknown code. Must investigate before migration.** |

**Unknown codes** require business owner confirmation: What does Z mean? Map to which destination value? Or exclude from migration?

### Data Volume by Entity

```sql
-- Record counts and approximate data volume
SELECT 
    t.name AS TableName,
    SUM(p.rows) AS RowCount,
    SUM(a.total_pages) * 8 / 1024.0 AS TotalMB
FROM sys.tables t
JOIN sys.indexes i ON t.object_id = i.object_id
JOIN sys.partitions p ON i.object_id = p.object_id AND i.index_id = p.index_id
JOIN sys.allocation_units a ON p.partition_id = a.container_id
WHERE t.type = 'U'
GROUP BY t.name
ORDER BY TotalMB DESC;
```

| Table | Row Count | Size (MB) | Est. Migration Time at 500 rows/sec | Priority |
|-------|----------|-----------|-------------------------------------|---------|
| Policies | 38,200 | 145 MB | 76 seconds | 2 (after Clients) |
| Attachments | 28,000 files | 8.2 GB | File transfer will dominate — est. 2 hours | 3 |
| Clients | 12,450 | 42 MB | 25 seconds | 1 (first — referenced by Policies) |
| Claims | 4,100 | 18 MB | 8 seconds | 4 |
| Agents | 85 | < 1 MB | < 1 second | 0 (first — referenced by Clients) |

### Critical Data Quality Issues

Identify fields that will fail destination validation without cleansing:

| Issue | Table | Field | Record Count | Severity | Must Fix Before Cutover |
|-------|-------|-------|-------------|----------|------------------------|
| Blank LastName | Clients | LastName | 3 | Critical | Yes — destination requires |
| Unknown StatusCode 'Z' | Policies | StatusCode | 2 | High | Yes — no destination mapping |
| EffectiveDate in future | Policies | EffectiveDate | 890 | Low | No — valid for future policies |
| SSN in Notes field | Clients | Notes | 14 | Critical | Yes — PII in free text; scrub before migration |
| Orphaned policies | Policies | ClientID | 12 | Medium | Investigate — exclude or fix |

## Data Quality Scorecard

Summarize findings per entity on a 0-100 score:

**Scoring method**:
- Completeness: (1 - average null rate for required fields) × 40 points
- Uniqueness: (1 - duplicate rate on natural key) × 30 points
- Referential integrity: (1 - orphan rate) × 20 points
- Format consistency: (% of records in standard format for date/phone) × 10 points

| Entity | Completeness | Uniqueness | Ref. Integrity | Format | Total Score | Grade |
|--------|-------------|------------|---------------|--------|-------------|-------|
| Clients | 38/40 | 29/30 | 20/20 | 9/10 | 96 | A |
| Policies | 36/40 | 28/30 | 19/20 | 7/10 | 90 | A- |
| Claims | 39/40 | 30/30 | 20/20 | 10/10 | 99 | A+ |
| Agents | 40/40 | 30/30 | 20/20 | 10/10 | 100 | A+ |

**Migration readiness**:
- Score >= 90: Ready for migration with minor cleansing
- Score 75-89: Cleansing required before migration; estimate 1-2 weeks of data prep
- Score < 75: Significant data quality work required; estimate 2-4 weeks; may require business involvement

## Output Format

Deliver as:

1. Profiling query results summary (one section per analysis type)
2. Completeness table (null rates per column per entity)
3. Uniqueness findings (duplicate counts and de-duplication strategy)
4. Format consistency findings and normalization rules
5. Referential integrity findings and orphan handling strategy
6. Value distribution table for all code fields (with unknown values flagged)
7. Data volume and migration time estimates
8. Critical issues list (ranked by severity — must resolve before cutover)
9. Data quality scorecard per entity
10. Cleansing work estimate (number of records and effort to address each issue)
11. Recommended cleansing sequence (order of operations to prepare data for migration)
