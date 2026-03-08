# Payload schemas

## Canonical payload guidance
Site governance payloads include classification label, sharing capability, owner group, and retention policy bindings.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
