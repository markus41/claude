---
description: Calculate automation ROI from current manual effort data and project investment figures. Use when quantifying the business case for an automation engagement or validating the financial return for a client decision-maker.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# ROI Calculator

Calculate the financial return on an automation engagement using actual client process data. Produce an ROI summary suitable for executive presentation, including payback period, first-year net benefit, and 3-year NPV.

## Step 1: Data Collection

Ask the client the following questions during discovery. Document every answer — do not estimate figures that can be collected.

**Current process data:**

1. **Who performs this process?**
   - Role/title: [e.g., CSR, Loan Processor, Underwriter]
   - Fully-loaded hourly cost (salary + benefits + overhead): $[X]/hour
   - If unknown: use industry benchmarks (CSR: $35–45/hr fully loaded; Loan Processor: $45–60/hr; Underwriter: $60–85/hr)

2. **How often does the process occur?**
   - Frequency: [N] times per [day / week / month]
   - Convert to annual: [N] × [frequency multiplier] = [annual volume]
   - Seasonal variation: note if volume peaks (e.g., renewal season, year-end)

3. **How long does one instance take?**
   - End-to-end time: [N] minutes per instance
   - Include: setup, execution, review, documentation, follow-up communications
   - Exclude: time spent waiting for external responses (unless staff is blocked)

4. **What is the error rate?**
   - Percentage of instances that result in an error requiring correction: [X]%
   - Time to identify and correct one error: [N] minutes
   - Who performs the correction (same role or escalation?): [role]

5. **Are there additional costs?**
   - Overtime or temporary staff costs from process volume: $[X]/year
   - Vendor fees paid per transaction for manual process: $[X] × [annual volume]
   - Compliance penalties or rework from errors (if tracked): $[X]/year
   - Customer attrition attributable to process delays (if estimable): $[X]/year

6. **What percentage of the process will automation handle?**
   - Straight-through processing rate (no human intervention): [X]% (typical range: 60–90%)
   - Exception rate requiring human review: [100-X]%
   - Time for human review of exceptions: [N] minutes each

---

## Step 2: Current Annual Cost Calculation

Calculate the total annual cost of the manual process.

**Manual labor cost:**
```
Annual volume = [frequency per period] × [periods per year]
Hours per instance = [minutes per instance] / 60
Annual hours = annual volume × hours per instance
Annual labor cost = annual hours × fully-loaded hourly rate
```

**Error and rework cost:**
```
Annual errors = annual volume × error rate (decimal)
Annual rework hours = annual errors × (correction time in minutes / 60)
Annual rework cost = annual rework hours × hourly rate of correction staff
```

**Additional costs:**
```
Annual additional costs = overtime/temp + vendor transaction fees + penalties + attrition
```

**Total annual cost of manual process:**
```
Total = annual labor cost + annual rework cost + annual additional costs
```

---

## Step 3: Automation Savings Calculation

**Labor hours recovered by automation:**
```
Straight-through volume = annual volume × straight-through rate
Hours recovered from straight-through = straight-through volume × (minutes per instance / 60)

Exception volume = annual volume × exception rate
Hours recovered from exceptions = exception volume × ((minutes per instance - exception review time) / 60)

Total hours recovered = hours recovered from straight-through + hours recovered from exceptions
Annual labor savings = total hours recovered × hourly rate
```

**Error reduction savings:**
```
Automation error rate (assume 0.1% for well-designed systems, vs. current [X]%)
Remaining annual errors = annual volume × 0.001
Rework hours saved = (annual errors - remaining annual errors) × (correction time / 60)
Annual error savings = rework hours saved × hourly rate
```

**Additional cost savings:**
```
Eliminated overtime/temp: $[X]/year
Eliminated per-transaction vendor fees: $[X] × straight-through volume
Annual additional savings = sum of eliminated costs
```

**Total annual savings:**
```
Total annual savings = annual labor savings + annual error savings + annual additional savings
```

---

## Step 4: ROI Calculation

**Project investment:**
```
Total project fee: $[Investment]
Ongoing annual cost (maintenance, hosting, licensing): $[Annual ongoing]
Year 1 total cost: Project fee + annual ongoing
Year 2–3 total cost per year: Annual ongoing only
```

**ROI metrics:**

| Metric | Formula | Value |
|--------|---------|-------|
| First-year net benefit | Total annual savings − Year 1 total cost | $[X] |
| First-year ROI | (Net benefit / Year 1 total cost) × 100 | [X]% |
| Payback period | Year 1 total cost / (Total annual savings / 12) | [N] months |
| Year 2 net benefit | Total annual savings − Annual ongoing | $[X] |
| Year 3 net benefit | Total annual savings − Annual ongoing | $[X] |
| 3-year cumulative savings | Sum of year 1–3 savings | $[X] |
| 3-year total cost | Year 1 cost + (Year 2+3 ongoing × 2) | $[X] |
| 3-year NPV (10% discount rate) | NPV formula below | $[X] |

**3-year NPV calculation:**
```
Discount rate: 10% (standard corporate hurdle rate)
Year 1 net cash flow: total annual savings − year 1 total cost
Year 2 net cash flow: total annual savings − annual ongoing
Year 3 net cash flow: total annual savings − annual ongoing

NPV = Year1_CF / (1.10)^1 + Year2_CF / (1.10)^2 + Year3_CF / (1.10)^3
```

---

## Step 5: Sensitivity Analysis

Show how ROI changes if key assumptions vary. Helps the client see the floor.

| Scenario | Assumption Change | Annual Savings | Payback Period |
|---------|------------------|----------------|---------------|
| Base case | As collected | $[X] | [N] months |
| Conservative (-20%) | 20% lower volume or savings rate | $[X] | [N] months |
| Optimistic (+20%) | 20% higher volume or straight-through rate | $[X] | [N] months |
| Break-even | Minimum savings to achieve 24-month payback | $[X] | 24 months |

**Break-even volume:** The minimum annual transaction volume at which the project pays back within 24 months:
```
Break-even annual savings = Year 1 total cost / 2
Break-even volume = break-even annual savings / (savings per transaction)
```

---

## Step 6: ROI Summary Output

Produce a one-page ROI summary for executive presentation:

**[Client Name] — Automation ROI Summary**

| | Current State | Automated |
|--|--|--|
| Annual process volume | [N] transactions | [N] transactions |
| Manual hours per year | [N] hours | [N] hours (exceptions only) |
| Annual labor cost | $[X] | $[X] |
| Annual error cost | $[X] | $[X] |
| **Total annual cost** | **$[X]** | **$[X]** |

**Investment and Return:**

| | |
|--|--|
| Project investment | $[Amount] |
| Annual ongoing cost | $[Amount] |
| **Annual net savings** | **$[Amount]** |
| **First-year ROI** | **[X]%** |
| **Payback period** | **[N] months** |
| **3-year NPV** | **$[Amount]** |

*Based on [volume] transactions/year at $[rate]/hour, [X]% automation rate, and [X]% current error rate. Actual results may vary.*

---

## Notes on Data Quality

- If the client cannot provide actual hours or volume data, use a documented benchmark source and note the assumption
- Never fabricate figures — an overestimated ROI that fails to materialize destroys trust
- If the payback period exceeds 24 months at base case, have an honest conversation before proceeding with the proposal
- Recurring costs (hosting, licensing, support retainer) must be included — they reduce the ongoing savings
- If the client's fully-loaded hourly rate is unknown, use the midpoint of the role benchmark range and document it
