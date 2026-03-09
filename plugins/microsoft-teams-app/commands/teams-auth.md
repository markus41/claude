---
name: teams:auth
intent: Single-tenant enforcement, Nested App Authentication, SSO for Teams apps
tags:
  - microsoft-teams-app
  - command
  - auth
inputs:
  - name: type
    description: "Auth type: sso | naa | bot-auth | full"
    required: false
    default: full
risk: low
cost: low
description: Implement Teams app authentication with single-tenant enforcement, Nested App Authentication (NAA), SSO, and bot auth
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams App Authentication

Implement authentication for Teams apps using the modern single-tenant model with Nested App Authentication (NAA) for pop-up-free SSO.

## Usage

```bash
/teams:auth [--type=sso|naa|bot-auth|full]
```

## Auth Model Overview

```
┌─────────────────────────────────────────────────────────┐
│                TEAMS AUTH LANDSCAPE                       │
├────────────────────┬────────────────────────────────────┤
│   DEPRECATED       │   CURRENT (v1.25)                  │
│                    │                                    │
│  Multi-tenant      │  Single-tenant enforced            │
│  common/orgs       │  Specific tenant ID                │
│  Pop-up auth       │  NAA (pop-up-free iframe)          │
│  tasks.startTask   │  dialog.url.open()                 │
│  TeamsFx SDK       │  MSAL.js v3.15+ direct             │
│                    │  M365 Agents Toolkit               │
└────────────────────┴────────────────────────────────────┘
```

## Single-Tenant Enforcement

All new bot registrations and Entra app registrations must use single-tenant.

### Entra App Registration

```bash
# Register single-tenant app via Azure CLI
az ad app create \
  --display-name "My Teams App" \
  --sign-in-audience "AzureADMyOrg" \
  --web-redirect-uris "https://{baseUrl}/auth-end"

# Set the application ID URI
az ad app update \
  --id {app-id} \
  --identifier-uris "api://{baseUrl}/{app-id}"

# Create client secret
az ad app credential reset \
  --id {app-id} \
  --display-name "teams-app-secret"
```

### Environment Configuration

```bash
# .env — NEVER commit this file
BOT_ID={app-id}
BOT_PASSWORD={client-secret}
APP_TENANTID={your-tenant-id}  # NOT "common" or "organizations"
AAD_APP_CLIENT_ID={app-id}
AAD_APP_CLIENT_SECRET={client-secret}
AAD_APP_OAUTH_AUTHORITY=https://login.microsoftonline.com/{your-tenant-id}
```

### Manifest webApplicationInfo

```json
{
  "webApplicationInfo": {
    "id": "{aad-app-id}",
    "resource": "api://{baseUrl}/{aad-app-id}"
  }
}
```

## Nested App Authentication (NAA)

Pop-up-free SSO for SPA tabs hosted inside Teams/Outlook/Office iframes.

### How NAA Works

```
┌──────────────────────────────────────────────────┐
│  Teams Host (parent window)                       │
│                                                   │
│  ┌─────────────────────────────────────────────┐ │
│  │  Your Tab App (iframe)                       │ │
│  │                                              │ │
│  │  1. MSAL.js createNestedAppAuth()           │ │
│  │  2. acquireTokenSilent() ─────────────────┐ │ │
│  │                                            │ │ │
│  │  3. Token returned (no pop-up!) ◄─────────┘ │ │
│  │                                              │ │
│  └─────────────────────────────────────────────┘ │
│                                                   │
│  Teams provides parent-frame token brokering      │
└──────────────────────────────────────────────────┘
```

### Manifest Configuration

```json
{
  "nestedAppAuthInfo": {
    "clientId": "{spa-client-id}",
    "resource": "api://{baseUrl}/{spa-client-id}"
  }
}
```

### Entra App Registration for NAA

```bash
# Register SPA app (separate from bot app if needed)
az ad app create \
  --display-name "My Teams Tab SPA" \
  --sign-in-audience "AzureADMyOrg" \
  --enable-id-token-issuance true

# Add SPA redirect URIs (NOT web redirects)
az ad app update \
  --id {spa-app-id} \
  --spa-redirect-uris \
    "https://{baseUrl}/auth-end" \
    "brk-multihub://{spa-app-id}"

# Add API scope
az ad app update \
  --id {spa-app-id} \
  --identifier-uris "api://{baseUrl}/{spa-app-id}" \
  --set api.oauth2PermissionScopes='[{
    "adminConsentDescription": "Access the app",
    "adminConsentDisplayName": "access_as_user",
    "id": "{scope-guid}",
    "isEnabled": true,
    "type": "User",
    "value": "access_as_user"
  }]'
```

### Implementation with MSAL.js v3.15+

```typescript
// src/auth/naaAuth.ts
import {
  createNestablePublicClientApplication,
  type IPublicClientApplication,
  type AccountInfo,
  type AuthenticationResult,
} from "@azure/msal-browser";

const msalConfig = {
  auth: {
    clientId: process.env.AAD_APP_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.APP_TENANTID}`,
    supportsNestedAppAuth: true,  // Required for NAA
  },
};

let msalInstance: IPublicClientApplication;

export async function initializeNAA(): Promise<IPublicClientApplication> {
  // Use createNestablePublicClientApplication for NAA
  msalInstance = await createNestablePublicClientApplication(msalConfig);
  return msalInstance;
}

export async function getToken(scopes: string[]): Promise<string> {
  const accounts = msalInstance.getAllAccounts();

  if (accounts.length === 0) {
    throw new Error("No accounts found — NAA requires Teams context");
  }

  try {
    // Silent token acquisition (no pop-up)
    const result: AuthenticationResult = await msalInstance.acquireTokenSilent({
      scopes,
      account: accounts[0],
    });
    return result.accessToken;
  } catch (error) {
    // Fallback to interactive only if silent fails
    const result = await msalInstance.acquireTokenPopup({ scopes });
    return result.accessToken;
  }
}

export async function getGraphToken(): Promise<string> {
  return getToken(["https://graph.microsoft.com/.default"]);
}

export async function getApiToken(): Promise<string> {
  return getToken([`api://${process.env.AAD_APP_CLIENT_ID}/access_as_user`]);
}
```

### React Hook for NAA

```typescript
// src/hooks/useTeamsAuth.ts
import { useState, useEffect } from "react";
import { app } from "@microsoft/teams-js";
import { initializeNAA, getToken } from "../auth/naaAuth";

export function useTeamsAuth(scopes: string[]) {
  const [token, setToken] = useState<string | null>(null);
  const [account, setAccount] = useState<any>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function authenticate() {
      try {
        await app.initialize();
        const msalInstance = await initializeNAA();
        const accounts = msalInstance.getAllAccounts();

        if (accounts.length > 0) {
          setAccount(accounts[0]);
          const accessToken = await getToken(scopes);
          setToken(accessToken);
        }
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }
    authenticate();
  }, []);

  return { token, account, error, loading };
}
```

## Traditional SSO (Pre-NAA)

For apps that don't use NAA, the traditional SSO flow with TeamsJS:

```typescript
// src/auth/traditionalSSO.ts
import { authentication, app } from "@microsoft/teams-js";

export async function getTokenTraditional(): Promise<string> {
  await app.initialize();

  try {
    // Try silent SSO first
    const token = await authentication.getAuthToken();
    return token;
  } catch (error) {
    // Fallback to interactive auth
    const token = await authentication.authenticate({
      url: `${window.location.origin}/auth-start`,
      width: 600,
      height: 535,
    });
    return token;
  }
}
```

## Bot Authentication

### OAuth Connection in Azure Bot

```bash
# Create OAuth connection setting
az bot authsetting create \
  --resource-group {rg} \
  --name {bot-name} \
  --setting-name "GraphConnection" \
  --provider-scope-string "User.Read Mail.Read" \
  --client-id {app-id} \
  --client-secret {secret} \
  --service "Aadv2" \
  --parameters "tenantId={tenant-id}"
```

### Bot SSO Handler

```typescript
// src/bot/ssoHandler.ts
import {
  TeamsActivityHandler,
  TurnContext,
  tokenExchangeOperationName,
} from "botbuilder";

export class SSOBot extends TeamsActivityHandler {
  constructor() {
    super();

    this.onTokenResponseEvent(async (context: TurnContext) => {
      // Token received — user is authenticated
      const tokenResponse = context.activity.value;
      await context.sendActivity(
        `Authenticated as ${tokenResponse.connectionName}`
      );
    });
  }

  async handleTeamsSigninTokenExchange(
    context: TurnContext,
    query: any
  ): Promise<void> {
    // Exchange the SSO token
    const tokenExchangeResponse = await context.adapter.exchangeToken(
      context,
      query.connectionName,
      context.activity.from.id,
      { token: query.token }
    );

    if (tokenExchangeResponse?.token) {
      // Token exchange succeeded — no prompt needed
      await context.sendActivity({ type: "invokeResponse", value: { status: 200 } });
    }
  }
}
```

## Security Checklist

- [ ] App registration set to **single-tenant** (AzureADMyOrg)
- [ ] `APP_TENANTID` set to actual tenant GUID, not `common`/`organizations`
- [ ] Client secrets stored in Key Vault, not `.env` in production
- [ ] Redirect URIs use HTTPS only
- [ ] API permissions use least-privilege scopes
- [ ] Token validation checks `aud`, `iss`, `tid` claims
- [ ] CORS configured for Teams domains only
- [ ] NAA: `supportsNestedAppAuth: true` in MSAL config
- [ ] NAA: SPA redirect URIs include `brk-multihub://{client-id}`

## See Also

- `/teams:manifest` — webApplicationInfo and nestedAppAuthInfo schema
- `/teams:meeting-app` — Auth for meeting tab apps
- `/teams:dialog` — Dialog-based auth flow (replaces tasks)
