---
description: Define KPI frameworks with targets, thresholds, calculation methods, and business owners for insurance and financial services executive dashboards and operational reporting.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
  - Write
---

# KPI Designer

Produce a complete KPI catalog for the client's business type. Every KPI is fully defined with data source, formula, target, thresholds, and business owner. No placeholder values — use industry benchmarks where client-specific targets are not yet provided, and flag them for client confirmation.

## KPI Catalog Structure

Each KPI entry contains:

| Field | Description |
|-------|-------------|
| KPI Name | Short display name (< 30 characters) |
| Business Question | The decision this KPI informs |
| Data Source | System and table/field |
| Calculation Formula | Plain English and pseudo-code |
| Unit of Measure | $, %, count, days, ratio |
| Frequency | How often it is calculated: daily, weekly, monthly |
| Period Type | YTD, rolling 12-month, point-in-time, etc. |
| Target | Numeric target value |
| Green Threshold | >= this value = on track |
| Amber Threshold | Between amber and green = needs attention |
| Red Threshold | < this value = at risk |
| Business Owner | Role title responsible for this KPI |
| Review Cadence | When this KPI is formally reviewed |
| Benchmark | Industry average for reference |

## Insurance Agency KPI Set

### Production KPIs

| KPI Name | Business Question | Formula | Unit | Target | Green | Amber | Red | Owner | Benchmark |
|----------|------------------|---------|------|--------|-------|-------|-----|-------|-----------|
| Written Premium YTD | Are we on pace to hit annual production goal? | SUM(Policies.WrittenPremium) WHERE WriteDate in current year | $ | Client-defined annual goal | >= 100% of pro-rated target | 90-99% | < 90% | Agency Principal | N/A |
| New Business Premium | How much new premium did we write this period? | SUM(WrittenPremium) WHERE PolicyType = 'New' AND WriteDate in period | $ | Client-defined | >= Target | 80-99% | < 80% | Production Manager | N/A |
| Policy Count (Active) | How many active policies do we service? | COUNT(Policies) WHERE Status = 'Active' | Count | Client-defined | >= Target | 95-99% | < 95% | Operations Manager | N/A |
| Producer Production | How is each producer performing vs. their individual goal? | SUM(WrittenPremium) per ProducerID / ProducerGoal | % of goal | 100% | >= 100% | 80-99% | < 80% | Sales Manager | N/A |
| Average Premium per Policy | Are we writing quality policies or just volume? | SUM(WrittenPremium) / COUNT(Policies) | $ | Prior year average + 5% | >= target | 90-99% | < 90% | Agency Principal | Varies by line |

### Retention KPIs

| KPI Name | Business Question | Formula | Unit | Target | Green | Amber | Red | Owner | Benchmark |
|----------|------------------|---------|------|--------|-------|-------|-----|-------|-----------|
| Policy Retention Rate | Are we keeping our clients? | (Policies renewed in period / Policies up for renewal in period) × 100 | % | 90% | >= 90% | 85-89% | < 85% | Account Manager Lead | 85-90% industry avg |
| Client Retention Rate | Are we keeping our clients (account-level, not policy-level)? | (Clients with at least 1 active policy this year AND last year) / (All clients with active policy last year) × 100 | % | 92% | >= 92% | 88-91% | < 88% | Account Manager Lead | 88-92% |
| Renewal Hit Rate | Of renewals quoted, how many do we close? | (Renewals bound) / (Renewals quoted) × 100 | % | 85% | >= 85% | 75-84% | < 75% | Operations Manager | 80-85% |
| Days to Renewal Quote | How quickly do we deliver renewal quotes? | AVG(QuoteDate - RenewalOfferDate) per policy | Days | 10 days | <= 10 | 11-20 | > 20 | Account Manager | 14 days |

### Risk and Loss KPIs

| KPI Name | Business Question | Formula | Unit | Target | Green | Amber | Red | Owner | Benchmark |
|----------|------------------|---------|------|--------|-------|-------|-----|-------|-----------|
| Loss Ratio (reported) | Are our clients filing claims at a rate that will cause carriers to non-renew? | (Incurred Losses) / (Earned Premium) × 100 | % | < 60% | <= 60% | 61-70% | > 70% | Agency Principal | 55-65% personal lines |
| E&O Incidents | Are we creating liability exposure for the agency? | COUNT(E&O incidents opened in period) | Count | 0 | 0 | 1 | >= 2 | Principal/Compliance | 0 |

## Mortgage / Lending KPI Set

| KPI Name | Business Question | Formula | Unit | Target | Green | Amber | Red | Owner | Benchmark |
|----------|------------------|---------|------|--------|-------|-------|-----|-------|-----------|
| Loan Volume (funded) | How much loan volume did we close this period? | SUM(LoanAmount) WHERE Status = 'Funded' | $ | Client-defined | >= Target | 85-99% | < 85% | Branch Manager | N/A |
| Loan Count (funded) | How many loans did we close? | COUNT(Loans) WHERE Status = 'Funded' | Count | Client-defined | >= Target | 85-99% | < 85% | Branch Manager | N/A |
| Pull-Through Rate | Of applications started, how many close? | (Funded loans) / (Applications received) × 100 | % | 65% | >= 65% | 50-64% | < 50% | Operations | 60-70% purchase; 50-60% refi |
| Days to Close | How fast are we closing loans? | AVG(FundingDate - ApplicationDate) per loan | Days | 25 days | <= 25 | 26-35 | > 35 | Operations | 30-45 days |
| Fallout Rate | How many loans are we losing after lock? | (Withdrawn + Declined + Expired) / (Applications received) × 100 | % | < 20% | <= 20% | 21-30% | > 30% | LO Manager | 20-30% |
| Margin Per Loan | Are we pricing loans profitably? | (Revenue - Direct Costs) / Loan Count | $ | Client-defined | >= Target | 80-99% | < 80% | Finance | Varies by channel |
| LO Productivity | How many loans per LO per month? | (Funded Loans in period) / (Active LO headcount) | Loans/LO | 4 per month | >= 4 | 2-3 | < 2 | Branch Manager | 3-5 per month |

## Financial Advisory KPI Set

| KPI Name | Business Question | Formula | Unit | Target | Green | Amber | Red | Owner | Benchmark |
|----------|------------------|---------|------|--------|-------|-------|-----|-------|-----------|
| AUM | What is our total assets under management? | SUM(AccountValue) WHERE AccountStatus = 'Active' | $ | Client-defined | >= Target | 90-99% | < 90% | Principal Advisor | N/A |
| AUM Growth (MoM) | Are we growing or losing AUM? | (AUM this month - AUM prior month) / AUM prior month × 100 | % | +2% per month | >= 2% | 0-1.9% | < 0% | Principal | N/A |
| Client Retention | Are we keeping clients? | (Active clients this year / Active clients last year) × 100 | % | 95% | >= 95% | 90-94% | < 90% | Advisor | 90-95% |
| Fee Revenue | Are we hitting revenue targets? | SUM(FeeRevenue) in period | $ | Client-defined | >= 100% of target | 90-99% | < 90% | Finance | N/A |
| Compliance Incidents | Are we maintaining a clean regulatory record? | COUNT(compliance incidents in period) | Count | 0 | 0 | 1 | >= 2 | CCO | 0 |
| New Assets Added | How much new money are advisors bringing in? | SUM(NewDeposits - Withdrawals) in period | $ | Client-defined | >= Target | 70-99% | < 70% | Advisor | N/A |

## KPI Hierarchy

Organize KPIs from company level to individual contributor:

```
Company Level (Board / Owner)
  Written Premium YTD
  Client Retention Rate
  Loss Ratio
  E&O Incidents

Department Level (Managers)
  Producer Production by Producer
  Renewal Hit Rate by Book
  Days to Renewal Quote
  Active Policy Count by Line of Business

Individual Level (Staff)
  My Renewals Due This Week
  My Open Tasks
  My Client Count
  My Production vs. My Goal
```

## Leading vs. Lagging Indicator Balance

Ensure the KPI set includes both types:

**Lagging indicators** (what happened — confirm results):
- Written Premium YTD, Funded Loan Volume, AUM, Retention Rate

**Leading indicators** (what is about to happen — allow course correction):
- Renewals due in next 30 days, Pipeline value, Quote count this month, Days to renewal quote

The dashboard should display at least 2 leading indicators for every 3 lagging indicators.

## Output Format

Deliver as:

1. KPI catalog table (full table with all fields per KPI, organized by business type and category)
2. KPI hierarchy diagram (text tree format)
3. Leading vs. lagging indicator breakdown
4. Benchmark reference table (industry sources: NAIC for insurance, MBA for mortgage)
5. Open items requiring client confirmation (targets marked as "TBD — client to confirm" with the recommended default)
6. DAX formula stubs for each KPI (calculation logic in DAX, to be passed to power-bi-builder skill)
