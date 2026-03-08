# Payload schemas

## Canonical payload guidance
Table schema payload should include ownership type, primary name, alternate keys, and auditing flags before relationship creation.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
