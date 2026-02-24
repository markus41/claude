# Payload schemas

## Canonical payload guidance
Create group with owners/members and assign app roles using object IDs; include consistencyLevel header for advanced filters.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
