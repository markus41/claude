---
description: Design AI extraction configurations for structured and semi-structured insurance and mortgage PDFs. Use when configuring a document AI model to extract data fields from applications, policy documents, EOBs, pay stubs, tax returns, or bank statements.
model: sonnet
allowed-tools:
  - Read
  - Grep
  - Bash
---

# PDF Field Extraction Configuration Design

Design the extraction configuration for AI-based data extraction from insurance and mortgage PDFs. Covers document type identification, field definition, confidence thresholds, model selection, pre-processing requirements, and structured output schema.

---

## Step 1: Document Type Identification

Before extracting fields, the system must identify what type of document is being processed. Route to the correct extraction model based on document type.

**Document classification first:** Run a classifier (see `form-classifier` skill) before the extraction model. The classifier returns a document type label that selects the correct field extraction configuration.

**Document types and extraction priority:**

| Document Type | Extraction Priority | Typical Use |
|--------------|---------------------|------------|
| ACORD 80 (personal auto application) | High | Insurance new business |
| ACORD 125 (commercial applicant) | High | Commercial lines |
| Policy declarations page | High | Policy verification |
| Loss run | High | Underwriting |
| Pay stub | High | Mortgage income verification |
| W-2 | High | Mortgage income verification |
| 1040 tax return | High | Mortgage income + self-employed |
| 1003 Uniform Residential Loan Application | High | Mortgage processing |
| Bank statement | High | Mortgage asset verification |
| Explanation of Benefits (EOB) | Medium | Claims / medical |
| Certificate of insurance | Medium | Proof of coverage |
| MVR (Motor Vehicle Record) | Medium | Insurance underwriting |
| Inspection report | Medium | Property insurance |

---

## Step 2: Field Definition by Document Type

### Pay Stub

| Field Name | Data Type | Required | Validation Rule | Extraction Note |
|-----------|-----------|----------|----------------|----------------|
| employer_name | string | Required | Non-empty | Top of stub; sometimes in logo area |
| employee_name | string | Required | Non-empty | Matches borrower name on 1003 |
| employee_ssn_last4 | string | Optional | 4 digits | Often masked; extract if visible |
| pay_period_start | date | Required | Valid date | Format: varies (MM/DD/YYYY, etc.) |
| pay_period_end | date | Required | Valid date | Must be more recent than prior stub |
| pay_date | date | Required | Valid date | Used to determine how current |
| pay_frequency | enum | Required | Weekly/Bi-Weekly/Semi-Monthly/Monthly | Calculate annual equivalent |
| gross_pay_this_period | currency | Required | Positive number | Current period gross before deductions |
| ytd_gross_pay | currency | Required | Positive number | Year-to-date gross |
| federal_tax_withheld | currency | Optional | Positive number | Cross-check against W-2 |
| net_pay | currency | Optional | Positive number | Informational only |
| hourly_rate | currency | Optional | If hourly employee | Used to calculate annual |
| hours_worked | number | Optional | Positive number | If hourly employee |

**Annual income calculation:**
```
Bi-weekly: ytd_gross / (pay_period_end_week_of_year / 2) × 26
Semi-monthly: ytd_gross / (pay_period_number) × 24
Monthly: gross_pay_this_period × 12
Hourly: hourly_rate × hours_per_week × 52 (use 2-year average if variable)
```

### W-2

| Field Name | Box | Data Type | Required | Validation |
|-----------|-----|-----------|----------|-----------|
| employee_name | Employee name box | string | Required | Match to application |
| employer_name | Employer name box | string | Required | Match to pay stubs |
| employer_ein | b | string | Required | XX-XXXXXXX format |
| wages_tips_other | 1 | currency | Required | Primary income figure |
| federal_income_tax | 2 | currency | Optional | Cross-check with 1040 |
| social_security_wages | 3 | currency | Optional | May differ from Box 1 |
| medicare_wages | 5 | currency | Optional | May differ from Box 1 |
| state | 15 | string | Optional | State of employment |
| state_wages | 16 | currency | Optional | State income |
| tax_year | top of form | year | Required | Validate: year should be prior 2 years |

### 1040 Tax Return (Federal)

| Field Name | Line | Data Type | Required | Note |
|-----------|------|-----------|----------|------|
| tax_year | Top of form | year | Required | |
| filing_status | Filing status checkbox | enum | Required | Single/MFJ/MFS/HOH/QW |
| total_income | 9 | currency | Required | AGI before deductions |
| agi | 11 | currency | Required | Adjusted Gross Income |
| wages_salaries | 1a | currency | Required for W-2 employees | |
| business_income_loss | Schedule C | currency | Required for self-employed | From Schedule C |
| schedule_c_gross_revenue | Schedule C line 1 | currency | Self-employed | |
| schedule_c_net_profit | Schedule C line 31 | currency | Self-employed | After expenses |
| rental_income | Schedule E | currency | If applicable | |
| k1_income | Schedule E Part II | currency | Partnership/S-Corp | |
| depreciation_added_back | Schedule C + E | currency | Self-employed | Non-cash expense added back |
| depletion_added_back | Schedule C + E | currency | Self-employed | Non-cash expense added back |

### Bank Statement

| Field Name | Data Type | Required | Validation |
|-----------|-----------|----------|-----------|
| account_holder_name | string | Required | Match to borrower |
| institution_name | string | Required | Non-empty |
| account_number_last4 | string | Optional | 4 digits (masked) |
| account_type | enum | Required | Checking/Savings/Money Market |
| statement_period_start | date | Required | Valid date |
| statement_period_end | date | Required | Valid date; should be within 60 days |
| beginning_balance | currency | Required | |
| ending_balance | currency | Required | Used for asset verification |
| total_deposits | currency | Required | Identifies large/unusual deposits |
| large_deposits | list | Required | Deposits > $[threshold]; itemized |
| nsf_count | integer | Optional | Count of NSF/returned items |

### Policy Declarations Page

| Field Name | Data Type | Required | Validation |
|-----------|-----------|----------|-----------|
| insured_name | string | Required | Match to client record |
| policy_number | string | Required | Format varies by carrier |
| carrier_name | string | Required | |
| lob | enum | Required | Auto/Home/Commercial/GL/etc. |
| effective_date | date | Required | Valid date |
| expiration_date | date | Required | After effective date |
| premium_annual | currency | Required | |
| liability_limit | currency | Required for auto/GL | |
| deductible | currency | Required | |
| property_address | string | Required for property | Match to risk address |
| vehicle_info | object | Required for auto | Year/Make/Model/VIN |

---

## Step 3: Extraction Confidence Thresholds

| Confidence Level | Threshold | Handling |
|-----------------|-----------|---------|
| High confidence | ≥ 0.90 | Auto-accept; proceed without human review |
| Medium confidence | 0.70 – 0.89 | Flag for human verification; highlight field in review UI |
| Low confidence | < 0.70 | Route to human review queue; display extracted value as suggestion, not fact |
| Not found | N/A | Mark field as missing; trigger missing-field condition |

**Field-specific thresholds:**

Critical fields (wrong value has significant downstream impact) should have higher thresholds:
- Currency amounts: raise auto-accept to ≥ 0.93
- Dates: raise auto-accept to ≥ 0.93 (off-by-one errors on dates can affect compliance)
- SSN / EIN: raise auto-accept to ≥ 0.95; prefer human verification for all

**Confidence aggregation:**
- Document-level confidence = weighted average of field-level confidence scores (weight by field importance)
- If document-level confidence < 0.75: route entire document to human review, not field-by-field

---

## Step 4: Model Selection

| Document Type | Recommended Model | Rationale |
|-------------|-----------------|-----------|
| Machine-printed structured forms (W-2, 1099) | Azure Document Intelligence (Form Recognizer) — prebuilt W-2/1099 model | Pre-built models for standard IRS forms; high accuracy |
| Semi-structured machine print (pay stubs, bank statements, dec pages) | Azure Document Intelligence — custom trained model OR AWS Textract with custom adapter | Requires training on carrier/issuer-specific layouts |
| Handwritten fields (ACORD applications, older inspection reports) | Azure Document Intelligence — read model for handwriting | Handles mixed print/handwrite; lower accuracy than machine print |
| Tables (bank statement transactions, loss run schedules) | AWS Textract — Tables API OR Azure DI table extraction | Preserves row/column structure; critical for transaction lists |
| Complex multi-page documents (1040 with schedules) | Azure Document Intelligence — custom model with schedule awareness | Multi-page layout with dynamic presence of schedules |
| Low-quality scans (high noise, skew, faded) | Pre-process then OCR (Tesseract or Azure DI read) | Pre-processing pipeline required before model |

**Model selection criteria:**
- Use Azure Document Intelligence prebuilt models first (W-2, 1099, invoice) — highest accuracy for covered types
- For document types without a prebuilt model: train a custom Azure DI model using at least 50 labeled examples per document type (100+ preferred)
- AWS Textract as alternative if client is AWS-native and Azure DI is not preferred
- Never use general-purpose OCR (Tesseract) alone for structured financial documents — accuracy is insufficient for regulatory contexts

---

## Step 5: Pre-Processing Requirements

Before sending to extraction model:

| Pre-Processing Step | When Required | Tool |
|--------------------|--------------|------|
| DPI check | If source is scanned document | Reject if < 150 DPI; warn if < 200 DPI; optimal 300+ DPI |
| De-skew (deskew) | If page is rotated or tilted | OpenCV deskew or Azure DI handles internally |
| Contrast enhancement | If page is faded or low contrast | Adaptive histogram equalization |
| De-noise | If scanned with heavy grain | Gaussian blur or median filter |
| Color normalization | Color scans — convert to grayscale or enhance | Improves OCR accuracy |
| Page splitting | Multi-document packets | Detect and split at page boundaries between documents |
| Page rotation | If individual pages are upside-down | Auto-detect and rotate using text direction |
| Watermark removal | If watermarks obscure content | Detect and suppress watermark layer |

**Quality gate:** Any document failing minimum quality thresholds (DPI < 150, or confidence after pre-processing below floor) is routed to manual entry queue with specific quality failure message.

---

## Step 6: Structured Output Schema

All extraction results output in consistent JSON format for downstream system consumption.

```json
{
  "extraction_id": "uuid",
  "document_id": "uuid",
  "document_type": "pay_stub",
  "extraction_timestamp": "2024-01-15T14:32:00Z",
  "model_name": "azure-di-custom-pay-stub-v2",
  "model_version": "2.1.0",
  "document_confidence": 0.91,
  "page_count": 2,
  "fields": {
    "employer_name": {
      "value": "Acme Corporation",
      "confidence": 0.97,
      "bounding_box": {"page": 1, "x": 120, "y": 45, "width": 200, "height": 20},
      "status": "auto_accepted"
    },
    "gross_pay_this_period": {
      "value": 4250.00,
      "value_type": "currency",
      "confidence": 0.89,
      "bounding_box": {"page": 1, "x": 450, "y": 310, "width": 80, "height": 18},
      "status": "flagged_for_review"
    }
  },
  "missing_fields": ["employee_ssn_last4"],
  "validation_results": {
    "pay_period_end_vs_today": "within_60_days",
    "ytd_gross_ge_period_gross": "pass",
    "cross_field_consistency": "pass"
  },
  "routing": "auto_process",
  "review_reasons": ["gross_pay_confidence_below_threshold"]
}
```

---

## Output Format

Deliver two artifacts:

1. **Extraction Configuration Specification** — For each document type in scope: field definition table (name, type, required, validation, extraction note), confidence thresholds, model selection, and pre-processing requirements

2. **Output Schema Documentation** — JSON schema for extraction results with field definitions, status enum values, routing logic, and validation rule definitions
