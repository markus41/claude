# Payload schemas

## Canonical payload guidance
Task payload should include planId, bucketId, assignments map, percentComplete, and dueDateTime in UTC.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
