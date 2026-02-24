# Payload schemas

## Canonical payload guidance
Use persistent-session-id header and payloads for range values/formulas with dimension-safe arrays.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
