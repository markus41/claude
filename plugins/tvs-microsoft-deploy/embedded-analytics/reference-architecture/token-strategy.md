# Embedded Token Strategy

## Design Principle

Never mint embed tokens directly in the browser. Token issuance must occur in a trusted backend with tenant-aware authorization checks.

## Flow

1. User authenticates via Azure AD B2C/Entra External ID (or federated enterprise IdP).
2. Backend API validates user claims and tenant membership.
3. Backend requests Power BI embed token scoped to:
   - report/dashboard identifiers,
   - workspace,
   - dataset,
   - optional effective identity for RLS.
4. Backend returns short-lived token to browser.
5. Browser initializes Power BI JS client with token and embed config.

## Token Policy

- TTL: 5-10 minutes.
- No long-lived refresh tokens in frontend storage.
- Rotate service principal credentials through Key Vault.
- Enforce request signing and replay protection on embed endpoint.

## Operational Safeguards

- Correlate token issuance to user/session IDs for auditing.
- Rate-limit token endpoint per tenant and user.
- Alert on unusual token mint bursts.
- Validate report/workspace ownership before issuing token.
