---
description: Design Power BI data model relationships and Power Query transformation specifications for combining insurance and financial services data from multiple source systems.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Data Model Mapper

Produce a complete Power BI data model design specification. This covers source system inventory, star schema design, relationship definitions, Power Query transformations, and incremental refresh configuration. The output is the technical blueprint a Power BI developer uses to build the data layer.

## Source System Inventory

Document every data source that feeds the model:

| Source System | System Type | Connection Method | Volume (rows) | Refresh Frequency | Key Tables / Endpoints |
|--------------|-------------|-------------------|--------------|------------------|----------------------|
| Agency Management System | SQL Server on-premises | On-premises gateway | ~500K policies | Daily at 2 AM | dbo.Policies, dbo.Clients, dbo.Producers, dbo.Claims, dbo.Activities |
| SharePoint Renewal Tracker | SharePoint Online list | Cloud connection | ~2K rows | On refresh | Renewal Tracker list |
| Targets Workbook | Excel on SharePoint | Cloud connection | ~100 rows | On refresh | Targets sheet, ProducerGoals sheet |
| Carrier Premium Data | CSV export via email to SharePoint | Cloud connection | ~10K rows/month | Monthly | [filename].csv |

**Volume assessment**:
- < 100K rows per table: Import mode, no optimization needed
- 100K–10M rows: Import mode with incremental refresh on date-partitioned tables
- > 10M rows: Consider DirectQuery or a pre-aggregated summary table in Import mode

## Star Schema Design

Design the data model as a star schema. Every fact table connects to dimension tables via one-to-many relationships. Never create many-to-many relationships directly between tables — use a bridge table.

### Fact Tables

**Fact_Policies** (one row per policy term):

| Column | Data Type | Source | Notes |
|--------|-----------|--------|-------|
| PolicyKey | Integer | Surrogate key generated in Power Query | Primary key |
| PolicyNumber | Text | AMS: dbo.Policies.PolicyNumber | Natural key — do not use as relationship key |
| ClientKey | Integer | Foreign key → Dim_Clients | |
| ProducerKey | Integer | Foreign key → Dim_Producers | |
| ProductKey | Integer | Foreign key → Dim_Products | |
| GeographyKey | Integer | Foreign key → Dim_Geography | |
| WriteDateKey | Integer | Foreign key → Dim_Date (YYYYMMDD integer) | |
| ExpirationDateKey | Integer | Foreign key → Dim_Date | |
| WrittenPremium | Decimal | AMS: dbo.Policies.WrittenPremium | |
| EarnedPremium | Decimal | AMS: calculated | |
| PolicyStatus | Text | AMS: dbo.Policies.StatusCode | Translated via lookup |
| IsNewBusiness | Boolean | AMS: PolicyType = 'NB' | |
| IsRenewal | Boolean | AMS: PolicyType = 'RN' | |
| LineOfBusiness | Text | AMS: dbo.PolicyLines.LOBCode | Translated via lookup |

**Fact_Claims** (one row per claim):

| Column | Data Type | Source | Notes |
|--------|-----------|--------|-------|
| ClaimKey | Integer | Surrogate key | |
| PolicyKey | Integer | Foreign key → Fact_Policies (inactive relationship — use USERELATIONSHIP in DAX) | |
| ClientKey | Integer | Foreign key → Dim_Clients | |
| LossDateKey | Integer | Foreign key → Dim_Date | |
| ReportDateKey | Integer | Foreign key → Dim_Date | |
| ClaimStatus | Text | AMS: dbo.Claims.StatusCode | |
| IncurredLoss | Decimal | AMS: dbo.Claims.IncurredAmount | |
| PaidLoss | Decimal | AMS: dbo.Claims.PaidAmount | |
| ClaimType | Text | AMS: dbo.Claims.ClaimType | |

### Dimension Tables

**Dim_Date** (date dimension — generated in Power Query):

Generate a complete date dimension for the range of dates in the data (typically 5-10 years back to 2 years forward):

```
M Code — Date dimension generation:
let
    StartDate = #date(2020, 1, 1),
    EndDate = #date(2027, 12, 31),
    DayCount = Duration.Days(EndDate - StartDate) + 1,
    DateList = List.Dates(StartDate, DayCount, #duration(1, 0, 0, 0)),
    DateTable = Table.FromList(DateList, Splitter.SplitByNothing()),
    #"Renamed Columns" = Table.RenameColumns(DateTable, {{"Column1", "Date"}}),
    #"Changed Type" = Table.TransformColumnTypes(#"Renamed Columns", {{"Date", type date}}),
    #"Added DateKey" = Table.AddColumn(#"Changed Type", "DateKey", each Date.Year([Date]) * 10000 + Date.Month([Date]) * 100 + Date.Day([Date]), Int32.Type),
    #"Added Year" = Table.AddColumn(#"Added DateKey", "Year", each Date.Year([Date]), Int32.Type),
    #"Added Quarter" = Table.AddColumn(#"Added Year", "Quarter", each "Q" & Text.From(Date.QuarterOfYear([Date])), type text),
    #"Added Month Number" = Table.AddColumn(#"Added Quarter", "MonthNumber", each Date.Month([Date]), Int32.Type),
    #"Added Month Name" = Table.AddColumn(#"Added Month Number", "MonthName", each Date.ToText([Date], "MMMM"), type text),
    #"Added Month-Year" = Table.AddColumn(#"Added Month Name", "MonthYear", each Date.ToText([Date], "MMM yyyy"), type text),
    #"Added IsWeekend" = Table.AddColumn(#"Added Month-Year", "IsWeekend", each Date.DayOfWeek([Date]) >= 5, type logical),
    #"Added FiscalYear" = Table.AddColumn(#"Added IsWeekend", "FiscalYear", each if Date.Month([Date]) >= 7 then "FY" & Text.From(Date.Year([Date]) + 1) else "FY" & Text.From(Date.Year([Date])), type text)
in
    #"Added FiscalYear"
```

**Dim_Clients**:

| Column | Data Type | Source | Notes |
|--------|-----------|--------|-------|
| ClientKey | Integer | Surrogate key | |
| ClientID | Text | AMS: dbo.Clients.ClientID | Natural key |
| ClientName | Text | AMS: dbo.Clients.FullName | Last, First format normalized |
| ClientType | Text | AMS: dbo.Clients.ClientType | Personal / Commercial |
| State | Text | AMS: dbo.Clients.State | 2-letter USPS code |
| ZipCode | Text | AMS: dbo.Clients.Zip | Left 5 digits only |
| ClientSince | Date | AMS: dbo.Clients.CreateDate | |
| IsActive | Boolean | Any active policy in Fact_Policies | Calculated column |

**Dim_Producers**:

| Column | Data Type | Source | Notes |
|--------|-----------|--------|-------|
| ProducerKey | Integer | Surrogate key | |
| ProducerID | Text | AMS: dbo.Producers.ProducerID | |
| ProducerName | Text | AMS: dbo.Producers.FullName | |
| ProducerEmail | Text | AMS: dbo.Producers.Email | Used for RLS |
| Branch | Text | AMS: dbo.Producers.Branch | |
| IsActive | Boolean | AMS: dbo.Producers.Active | |
| AnnualTarget | Decimal | Targets workbook: ProducerGoals sheet | Joined on ProducerID |

## Relationship Definitions

| From Table | From Column | To Table | To Column | Cardinality | Active | Cross-Filter |
|-----------|-------------|----------|-----------|-------------|--------|-------------|
| Fact_Policies | DateKey (WriteDate) | Dim_Date | DateKey | Many-to-one | Yes | Single (→ Fact) |
| Fact_Policies | DateKey (ExpirationDate) | Dim_Date | DateKey | Many-to-one | No | Single |
| Fact_Policies | ClientKey | Dim_Clients | ClientKey | Many-to-one | Yes | Single |
| Fact_Policies | ProducerKey | Dim_Producers | ProducerKey | Many-to-one | Yes | Single |
| Fact_Policies | ProductKey | Dim_Products | ProductKey | Many-to-one | Yes | Single |
| Fact_Claims | PolicyKey | Fact_Policies | PolicyKey | Many-to-one | No | Single |
| Fact_Claims | LossDateKey | Dim_Date | DateKey | Many-to-one | Yes | Single |

**Cross-filter direction rule**: Use Single direction (dimension filters fact) in nearly all cases. Use Both directions only when a slicer on a dimension table must filter another dimension table through the fact (rare). Document each Both-direction relationship with the business justification.

**Inactive relationships**: Reference inactive relationships in DAX with `USERELATIONSHIP()`. Example: to calculate claims by expiration date instead of write date, write `CALCULATE([Claim Count], USERELATIONSHIP(Fact_Policies[ExpirationDateKey], Dim_Date[DateKey]))`.

## Power Query Transformation Specifications

For each data source, specify all required transformations:

**AMS SQL data transformations**:

| Step | Transformation | M Code Pattern |
|------|---------------|----------------|
| Remove test policies | Filter rows | `Table.SelectRows(Source, each [PolicyNumber] <> null and not Text.StartsWith([PolicyNumber], "TEST"))` |
| Normalize state codes | Replace values | `Table.ReplaceValue(#"prev", "Califronia", "CA", Replacer.ReplaceText, {"State"})` + lookup table join |
| Parse written date | Change type | `Table.TransformColumnTypes(Source, {{"WriteDate", type date}})` |
| Derive DateKey | Add column | `Table.AddColumn(Source, "DateKey", each Date.Year([WriteDate]) * 10000 + Date.Month([WriteDate]) * 100 + Date.Day([WriteDate]), Int32.Type)` |
| Handle nulls in premium | Replace null | `Table.ReplaceValue(Source, null, 0, Replacer.ReplaceValue, {"WrittenPremium"})` |
| Surrogate key | Add index | `Table.AddIndexColumn(Source, "PolicyKey", 1, 1, Int32.Type)` |

**Null and default value handling**:
- Numeric fields used in aggregations: Replace null with 0
- Text fields used in slicers: Replace null with "(Not Assigned)" — do not leave nulls in dimension columns
- Date fields: Replace null with a sentinel date (e.g., 9999-12-31 for "no expiration") — document the sentinel value in a report note

## Incremental Refresh Configuration

Apply to large fact tables (Fact_Policies, Fact_Claims) with > 100K rows and a reliable date column:

**Configuration**:
1. In Power Query, create two parameters: `RangeStart` (Date/Time) and `RangeEnd` (Date/Time)
2. Filter the fact table: `Table.SelectRows(Source, each [WriteDate] >= RangeStart and [WriteDate] < RangeEnd)`
3. In Power BI Desktop > right-click table > Incremental refresh:
   - Store data starting: 5 years
   - Refresh data starting: 30 days (rolling refresh window)
   - Detect data changes: Enable if source has a "LastModified" timestamp column

**Incremental refresh prevents**: Full table reload on every scheduled refresh. Only the last 30 days of policies are refreshed each run. Historical data (>30 days) is preserved in cached partitions.

**Limitation**: Incremental refresh requires Power BI Premium or Premium Per User. On Pro-only workspaces, implement date-filtered queries instead (load only current year data, with prior years as a separate pre-aggregated summary table).

## Composite Model Design

Use composite model when mixing DirectQuery and Import sources is necessary:

- Import: All dimension tables (Date, Clients, Producers, Products, Geography)
- DirectQuery: Fact table from SQL Server if near-real-time is required

**Performance implication**: Every visual that touches a DirectQuery table issues a SQL query. Limit the number of visuals per page and avoid complex DAX measures on DirectQuery tables. Pre-aggregate at the source (SQL view or stored procedure) where possible.

## Output Format

Deliver as:

1. Source system inventory table
2. Star schema entity relationship diagram (Markdown table format showing tables and relationships)
3. Fact table schema (one section per fact table with all columns)
4. Dimension table schema (one section per dimension table)
5. Relationship definition table
6. Power Query transformation spec (one section per source with numbered transformation steps and M code patterns)
7. Null handling decisions (table: column, null handling rule, rationale)
8. Incremental refresh configuration (if applicable)
9. Composite model design (if applicable, with rationale)
