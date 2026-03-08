# Payload schemas

## Canonical payload guidance
Team create payload should include template@odata.bind, visibility, member settings, and installed apps list.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
