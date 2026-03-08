# Payload schemas

## Canonical payload guidance
Managed import payload includes holding-solution and overwrite-unmanaged customizations flags plus connection reference mapping JSON.

## Validation checklist
- Ensure IDs are environment-specific and not hard-coded across tenants.
- Enforce UTC timestamps and explicit locale handling where relevant.
- Include correlation IDs in request headers for traceability.
