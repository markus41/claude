---
description: Design SharePoint Online site, list, library, and page provisioning specifications for insurance and financial services firms on Microsoft 365.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# SharePoint Builder

Produce a complete SharePoint Online provisioning specification. Work through each section in order, making explicit decisions rather than presenting options. Output a structured specification document the client can hand to a SharePoint administrator for implementation.

## Site Design

Determine site type first:

- **Communication site**: Use when the primary purpose is broadcasting information to a broad audience (intranet home, compliance notices, product catalog). Single owner team, many readers.
- **Team site**: Use when the site supports ongoing collaboration within a defined working group (claims team, loan processing unit, agency ops). Members need to contribute content.

Document the selection with rationale. Then specify:

- **Display name and URL slug**: Follow the convention `[firm-abbreviation]-[function]` (e.g., `acme-claims`, `acme-hr`)
- **Site template**: Apply the built-in template closest to the use case (Topic, Showcase, Blank for communication sites; Standard, Project, no-template for team sites)
- **Hub site registration**: Register under the appropriate hub (Intranet hub for communication sites, Department hub for team sites) to inherit navigation and theme
- **Navigation structure**: List the top navigation links (max 7) and any mega-menu groupings. Use audience-targeted navigation nodes where different roles see different links.
- **Permissions model**: Define three SharePoint groups with exact membership:

| Group | Role | Populated by |
|-------|------|--------------|
| [Site Name] Owners | Full Control | IT admins + site champion |
| [Site Name] Members | Edit | Business function staff |
| [Site Name] Visitors | Read | All firm staff (or specific departments) |

Never break inheritance at the site level unless a specific confidentiality requirement exists — document any inheritance breaks explicitly.

## Document Library Design

For each document library, produce this specification:

**Library name**: Use PascalCase nouns (e.g., `PolicyDocuments`, `ClaimFiles`, `LoanApplications`)

**Column schema table**:

| Column Name | Type | Required | Default | Notes |
|-------------|------|----------|---------|-------|
| Content Type | Content Type | Yes | — | List all content types |
| Client ID | Single line of text | Yes | — | Must match AMS/LOS client ID format |
| Document Date | Date | Yes | Today | |
| Status | Choice | Yes | Draft | Draft; Under Review; Final; Archived |
| ... | | | | |

**Managed metadata columns**: For any taxonomy-driven column (Coverage Type, State, Product Line), specify the term set path in the Term Store (e.g., `Lobbi > Products > Coverage Types`). Do not use free-text columns for values that must be standardized.

**Versioning settings**:
- Major versions only for final documents subject to retention (policies, contracts)
- Major and minor versions for documents with a review/approval workflow (procedures, templates)
- Set major version limit: 50 | minor version limit: 10
- Enable check-out required if document integrity during editing is critical

**Retention label**: Specify which Microsoft Purview retention label to auto-apply (e.g., `FINRA-7yr`, `State-Insurance-5yr`, `General-3yr`).

**Views to configure**:
- Default view: Active documents, sorted by Document Date descending
- By Status: Group by Status column
- By Client: Group by Client ID, show only Final items
- Archive view: Status = Archived, hidden from main navigation

## Custom List Design

For each tracking list (claims register, renewal pipeline, task log), produce:

**List name and purpose**: One sentence describing what the list tracks and who updates it.

**Column definitions**:

| Column Name | Type | Required | Choices / Validation | Notes |
|-------------|------|----------|----------------------|-------|
| Title | Single line | Yes | — | Claim number or record ID |
| Assigned To | Person | Yes | — | Must be internal user |
| Due Date | Date | No | Must be >= [Today] | Validation formula |
| Priority | Choice | Yes | High; Medium; Low | |
| ... | | | | |

**Calculated columns**: Define the formula explicitly. Example: `Days Open = =DATEDIF([Created],[Today],"D")`.

**Validation formulas**: List any column-level or list-level validation rules (e.g., Close Date must be after Open Date).

**Views**:
- My Items: `[Assigned To] = [Me]`, sorted by Due Date ascending
- Overdue: `[Due Date] < [Today] AND [Status] != "Closed"`, highlighted with red conditional formatting
- All Items: Default, ungrouped, for managers

## Page Design

For each page (home page and key landing pages), specify:

**Page layout**: Full-width, vertical section, or multi-column. Specify the number of columns per section.

**Web part placement** (top to bottom, left to right):

| Section | Web Part | Configuration Notes |
|---------|----------|---------------------|
| Hero | Hero | 5 tiles; link to key document libraries and apps |
| Row 1, Left | News | Source: This site; Layout: Top story; Show: 4 items |
| Row 1, Right | Quick Links | Compact layout; link to AMS, LOS, Teams channel, SharePoint libraries |
| Row 2 | Document Library | Library: PolicyDocuments; View: Active; Show 8 items |
| Row 3 | List | List: RenewalPipeline; View: My Items |
| Footer | People | Show site owners and site contacts |

**Audience targeting**: Specify if any web parts should be targeted to a specific SharePoint group or Azure AD group.

## Information Architecture

Define the site collection hierarchy:

```
[Hub Site] Firm Intranet
  [Associated Site] HR & Compliance
  [Associated Site] Operations - Claims
  [Associated Site] Operations - Renewals
  [Standalone] Client Portal (external sharing enabled)
```

Specify which sites should be standalone (not hub-associated) due to external sharing, sensitivity, or guest access requirements.

## Governance Settings

| Setting | Value | Rationale |
|---------|-------|-----------|
| External sharing | Disabled (or Existing guests only) | Financial services: no anonymous links |
| Default link type | Specific people | Prevent accidental broad sharing |
| Expiration on sharing links | 30 days | Limit lingering access |
| Site storage limit | 1 TB (or custom) | |
| Site classification | Internal / Confidential / Restricted | Per Microsoft Purview classification |

## Output Format

Deliver the specification as a structured Markdown document with:

1. Executive summary (site purpose, primary users, key libraries)
2. Site design decision table
3. Library specifications (one section per library)
4. List specifications (one section per list)
5. Page design layout (one section per page)
6. Permissions matrix
7. Governance settings table
8. Open questions requiring client confirmation before provisioning begins
