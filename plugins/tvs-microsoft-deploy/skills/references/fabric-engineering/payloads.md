# Payload schemas

## Canonical payload guidance
Notebook execution payload includes executionData.parameters and optional retry configuration for transient Spark failures.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
