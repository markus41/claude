# Auth Flows Reference

## NAA (Nested App Authentication)

**When:** SPA tab in iframe (Teams/Outlook/Office)
**Requires:** MSAL.js v3.15+, manifest v1.21+, Entra SPA registration

```
Tab iframe → MSAL createNestablePublicClientApplication()
           → acquireTokenSilent() (no popup)
           → Teams host brokers token
           → Token returned to iframe
```

**Entra Setup:**
- Platform: SPA (not Web)
- Redirect URIs: `https://{domain}/auth-end`, `brk-multihub://{client-id}`
- Sign-in audience: `AzureADMyOrg` (single-tenant)
- Expose API: `api://{domain}/{client-id}` with `access_as_user` scope

## Traditional SSO

**When:** TeamsJS v2.x tab without NAA
**Requires:** TeamsJS `authentication.getAuthToken()`

```
Tab → authentication.getAuthToken()
    → Teams provides id_token
    → Exchange id_token for access_token via backend
    → On-behalf-of flow for Graph/API calls
```

## Bot SSO

**When:** Bot needs user context
**Requires:** OAuth connection in Azure Bot Service

```
User message → Bot detects no token
             → Send OAuthCard
             → Token exchange via handleTeamsSigninTokenExchange()
             → If exchange fails → interactive consent
             → Token stored in bot state
```

## Single-Tenant Enforcement

All v1.25 apps must use single-tenant:
- Entra: `signInAudience: "AzureADMyOrg"`
- Bot: `msaAppType: "SingleTenant"` + `msaAppTenantId: "{guid}"`
- Env: `APP_TENANTID={guid}` (never `common` or `organizations`)
- MSAL: `authority: "https://login.microsoftonline.com/{guid}"`

## Token Scopes (Common)

| Scope | Purpose |
|---|---|
| `User.Read` | Basic user profile |
| `Mail.Read` | Read user email |
| `Calendars.Read` | Read calendar events |
| `Files.Read.All` | Read OneDrive/SharePoint files |
| `Team.ReadBasic.All` | Read team info |
| `Channel.ReadBasic.All` | Read channel info |
| `OnlineMeetings.Read` | Read meeting details |
