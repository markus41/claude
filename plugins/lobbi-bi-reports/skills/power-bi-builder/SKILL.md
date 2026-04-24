---
description: Design Power BI report and visual specifications for executive reporting on claims, loan pipeline, premium production, and financial services KPI tracking.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# Power BI Builder

Produce a complete Power BI report design specification. This skill generates the design document that a Power BI developer uses to build the report. Every visual, measure, and configuration decision is made explicitly. No generic placeholder content.

## Report Purpose and Audience

State clearly:

- **Business question the report answers**: One sentence (e.g., "How is our agency's premium production trending by producer and line of business, and where are we against our annual target?")
- **Primary audience**: Role titles, not names. Include the decision they make using this report.
- **Secondary audience**: Who else views it (e.g., producers viewing only their own data)
- **Decision cadence**: How often the report is reviewed and acted on (daily operations, weekly team meeting, monthly board review)

## Data Source Connection

**Connection mode decision**:

| Mode | Use When |
|------|----------|
| Import | Data is < 1 GB, refresh frequency is acceptable at 8x/day or less, complex DAX measures needed |
| DirectQuery | Near-real-time data required (operations), data is > 1 GB, source system is SQL Server / Azure SQL |
| Composite | Mix: some tables imported (slow-changing dimensions) and some DirectQuery (fact tables) |

For most insurance and financial services management reporting: **Import mode** with daily or hourly refresh is appropriate and provides best performance. Use DirectQuery only when the business explicitly requires same-hour data.

**Data sources** (list each):

| Source | Type | Connection String / URL | Refresh Frequency | Tables / Endpoints Used |
|--------|------|------------------------|------------------|------------------------|
| Agency Management System | SQL Server | Server=ams-db.firm.local; Database=AMS_Prod | Daily at 2 AM | dbo.Policies, dbo.Clients, dbo.Producers |
| SharePoint List | SharePoint Online | https://[tenant].sharepoint.com/sites/ops | On refresh | Renewal Tracker list |
| Excel workbook | SharePoint file | /sites/ops/Shared Documents/Targets.xlsx | On refresh | Targets sheet |

**Gateway**: On-premises data gateway required for SQL Server, local files, or any source behind the corporate firewall. Specify: cluster name, installed on which server, which service account runs the gateway service.

## Dataset Design

**Calculated columns vs. measures decision rule**:
- Calculated columns: Used for text manipulation, row-level categories, foreign key derivations. Computed at refresh time, stored in memory.
- Measures: Used for all aggregations, ratios, YTD, MoM calculations. Computed at query time. Always prefer measures over calculated columns for aggregations.

**Key tables needed** (describe, detailed schema in data-model-mapper skill):
- Fact tables: Transactions, policies, claims, loan applications
- Dimension tables: Date, Producer/Agent, Client, Product/Coverage, State/Geography
- Bridge tables: Only if many-to-many relationships exist

## Page Layout Design

Design each report page. Typical report has 3-6 pages.

**Page template**:

```
Page Name: [Noun phrase — what the user sees on this page]
Purpose: [One sentence]
Audience: [All users / Specific role]
Row-Level Security Applied: Yes / No

Slicer Panel (left or top bar, ~15% of canvas width):
  - Date Range: Between slicer on Date[Date]
  - [Dimension 1]: Dropdown slicer
  - [Dimension 2]: Dropdown slicer
  - Clear All Filters button: Bookmark action

Section 1 — KPI Cards (top row):
  Visual: Card (New)
  Metrics displayed (one card per metric):
    - [Metric name]: [Measure name], format: $#,##0 or #,##0.0%
    - Reference label: [Comparison: vs. prior period / vs. target]
    - Conditional formatting: Green if >= target, Red if < 90% of target

Section 2 — Trend (main chart):
  Visual: Line chart
  X-axis: Date[Month-Year]
  Y-axis: [Primary measure]
  Secondary Y-axis: [Secondary measure if dual-axis needed]
  Legend: [Dimension to break by]
  Data labels: On for last data point only
  Markers: On
  Reference line: Target value (constant or from measure)

Section 3 — Breakdown (supporting chart):
  Visual: Clustered bar chart / Stacked bar / Table — specify which and why
  Axis: [Dimension]
  Values: [Measures]
  Sorted by: [Measure] descending
  Conditional formatting on value column: Data bars or color scale

Section 4 — Detail Table (bottom, collapsible):
  Visual: Table
  Columns: [List column names and measures]
  Row subtotals: On / Off
  Column totals: On / Off
  Conditional formatting: [Which columns get highlighting]
```

## Filter and Slicer Design

**Slicers**: Place all slicers in a consistent location across all pages. Use a vertical panel on the left for desktop viewing. Sync all slicers across pages using the Sync Slicers pane.

| Slicer | Field | Type | Default Selection |
|--------|-------|------|------------------|
| Date Range | Date[Date] | Between (date range) | Current year to today |
| Producer | Producer[ProducerName] | Dropdown, multi-select | All |
| Line of Business | Product[LineOfBusiness] | Dropdown, multi-select | All |
| State | Geography[State] | Dropdown, multi-select | All |

**Drill-through pages**: Configure drill-through on the detail table or bar chart so users can right-click a producer or policy and navigate to a detail page showing all records for that selection.

**Report-level filters** (hidden from users): Filter out test records, inactive carriers, and records with invalid status codes. Document each hidden filter.

## DAX Measure Library

For every metric displayed in the report, write the complete DAX formula:

```
-- Written Premium (YTD)
Written Premium YTD =
CALCULATE(
    SUM(Policies[WrittenPremium]),
    DATESYTD(Date[Date])
)

-- Written Premium (Prior Year YTD) 
Written Premium PYTD =
CALCULATE(
    [Written Premium YTD],
    SAMEPERIODLASTYEAR(Date[Date])
)

-- Year-over-Year Growth %
Written Premium YoY % =
DIVIDE(
    [Written Premium YTD] - [Written Premium PYTD],
    [Written Premium PYTD],
    BLANK()
)

-- vs. Target %
Written Premium vs Target % =
DIVIDE(
    [Written Premium YTD],
    SUM(Targets[PremiumTarget]),
    BLANK()
)

-- Policy Count (Active)
Active Policy Count =
CALCULATE(
    COUNTROWS(Policies),
    Policies[Status] = "Active"
)

-- Retention Rate (12-month rolling)
Retention Rate 12M =
DIVIDE(
    CALCULATE(
        COUNTROWS(Policies),
        Policies[Status] = "Active",
        DATESINPERIOD(Date[Date], LASTDATE(Date[Date]), -12, MONTH)
    ),
    CALCULATE(
        COUNTROWS(Policies),
        DATEADD(Date[Date], -12, MONTH)
    ),
    BLANK()
)
```

Write a complete measure for every KPI card and chart axis value in the report. Include formatting string comments.

## Conditional Formatting Rules

| Visual | Column/Measure | Format Type | Rules |
|--------|---------------|-------------|-------|
| KPI Cards | vs. Target % | Background color | >= 100%: green #107C10; 90-99%: amber #FFB900; < 90%: red #D13438 |
| Producer table | Retention Rate | Color scale | 3-color: red at 70%, white at 85%, green at 100% |
| State map | Written Premium | Color saturation | Light to dark blue based on value |
| Detail table | Days Open (claims) | Background color | > 30 days: amber; > 60 days: red |

## Mobile Layout

For each page, configure the mobile layout (View > Mobile layout in Power BI Desktop):

- KPI cards: Stack vertically at full width
- Primary chart: Full width, reduced height
- Slicers: Collapse into a filter icon (use the built-in mobile filter pane)
- Detail tables: Omit from mobile layout (too small to use on phone)

## Row-Level Security

If the report will be distributed to producers or agents who should only see their own data:

**RLS role definition** (in Power BI Desktop > Modeling > Manage Roles):
```
Role: Producer
Table: Producers
Filter: [ProducerEmail] = USERPRINCIPALNAME()
```

**Testing**: Create a test role for each RLS scenario. Verify that a producer logging in sees only their records and that totals reflect their filtered data, not firm-wide totals.

**Publish and assign**: After publishing to Power BI Service, go to the dataset > Security > assign Azure AD groups to the Producer role. Do not assign to the Admin role (admins see all data).

## Output Format

Deliver as:

1. Report summary (purpose, audience, data sources, page count)
2. Data source connection table with gateway requirement
3. Page design specification (one section per page using the template above)
4. DAX measure library (all measures with full formulas and comments)
5. Conditional formatting rules table
6. RLS configuration (if applicable)
7. Mobile layout notes
8. Developer checklist (what to build in order: data model → measures → pages → RLS → test → publish)
