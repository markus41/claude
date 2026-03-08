# Payload schemas

## Canonical payload guidance
Embed token request includes accessLevel, identities (RLS), and datasets/reports list aligned to tenant isolation model.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
