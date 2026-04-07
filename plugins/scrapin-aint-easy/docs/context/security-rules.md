# Security Rules

> Populated from interview Phase 5: Security & Compliance.

## Authentication

_Auth model (JWT, session, OAuth, etc.) and flow._

## Authorization

_Role-based, attribute-based, or other access control model._

## Data Sensitivity

| Data Type | Sensitivity | Handling |
|---|---|---|
| _PII_ | _High_ | _Encrypted at rest, masked in logs_ |

## Compliance

_Regulatory requirements (GDPR, HIPAA, SOC2, etc.) if applicable._

## Never Do

_Hard "never" rules for this project:_

- _Never log PII fields_
- _Never store credentials in the database_
- _Never expose internal errors to clients_
