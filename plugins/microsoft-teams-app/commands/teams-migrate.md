---
name: teams:migrate
intent: Migration guide from TeamsFx/Bot Framework to M365 Agents Toolkit
tags:
  - microsoft-teams-app
  - command
  - migration
inputs:
  - name: from
    description: "Migrate from: teamsfx | bot-framework | v1.17 | all"
    required: false
    default: all
risk: low
cost: low
description: Step-by-step migration from TeamsFx SDK and Bot Framework to M365 Agents Toolkit with manifest v1.25
allowed-tools:
  - Bash
  - Read
  - Write
  - Edit
  - Grep
  - Glob
---

# Teams App Migration

Migrate from deprecated Teams Toolkit (TeamsFx) and Bot Framework patterns to the modern M365 Agents Toolkit stack with manifest v1.25.

## Usage

```bash
/teams:migrate [--from=teamsfx|bot-framework|v1.17|all]
```

## Deprecation Timeline

```
┌──────────────────────────────────────────────────────────┐
│               DEPRECATION TIMELINE                        │
├──────────┬───────────────────────────────────────────────┤
│  Sep 2025│  Teams Toolkit deprecated                     │
│  Sep 2026│  TeamsFx community support ends               │
│  Ongoing │  Bot Framework v4 still supported             │
│          │  (but M365 Agents Toolkit is the path forward)│
├──────────┴───────────────────────────────────────────────┤
│  REPLACEMENT STACK                                        │
│  • M365 Agents Toolkit (replaces Teams Toolkit)          │
│  • @microsoft/m365agentstoolkit-cli (replaces teamsapp)  │
│  • m365agents.yml (replaces teamsapp.yml)                │
│  • Agents Playground (replaces Bot Emulator for testing) │
│  • TeamsJS v2.x SDK (replaces TeamsJS v1.x)              │
│  • MSAL.js v3.15+ (replaces TeamsFx auth helpers)        │
└──────────────────────────────────────────────────────────┘
```

## Phase 1: Tooling Migration

### CLI Migration

```bash
# OLD: Teams Toolkit CLI
npm uninstall -g @microsoft/teamsapp-cli

# NEW: M365 Agents Toolkit CLI
npm install -g @microsoft/m365agentstoolkit-cli

# Command mapping
# teamsapp new        → atk new
# teamsapp provision  → atk provision
# teamsapp deploy     → atk deploy
# teamsapp validate   → atk validate
# teamsapp preview    → atk preview
# teamsapp publish    → atk publish
# teamsapp package    → atk package
```

### Config File Migration

```bash
# Rename config files
mv teamsapp.yml m365agents.yml
mv teamsapp.local.yml m365agents.local.yml

# Update references in scripts
sed -i 's/teamsapp\.yml/m365agents.yml/g' package.json
sed -i 's/teamsapp\.local\.yml/m365agents.local.yml/g' package.json
```

### m365agents.yml Structure

```yaml
# m365agents.yml (was teamsapp.yml)
version: v1.0

environmentFolderPath: ./env

provision:
  - uses: teamsApp/create
    with:
      name: my-app-${{TEAMSFX_ENV}}

  - uses: aadApp/create
    with:
      name: my-app-${{TEAMSFX_ENV}}
      generateClientSecret: true
      signInAudience: AzureADMyOrg  # Single-tenant enforced

  - uses: aadApp/update
    with:
      manifestPath: ./aad.manifest.json

  - uses: teamsApp/validateManifest
    with:
      manifestPath: ./appPackage/manifest.json

  - uses: teamsApp/zipAppPackage
    with:
      manifestPath: ./appPackage/manifest.json
      outputZipPath: ./appPackage/build/appPackage.${{TEAMSFX_ENV}}.zip

  - uses: teamsApp/update
    with:
      appPackagePath: ./appPackage/build/appPackage.${{TEAMSFX_ENV}}.zip

deploy:
  - uses: cli/runNpmCommand
    with:
      args: install

  - uses: file/createOrUpdateEnvironmentFile
    with:
      target: ./.env
      envs:
        BOT_ID: ${{BOT_ID}}
        BOT_PASSWORD: ${{SECRET_BOT_PASSWORD}}
        APP_TENANTID: ${{APP_TENANTID}}
```

## Phase 2: SDK Migration

### TeamsFx → MSAL.js Direct

```typescript
// ❌ OLD: TeamsFx auth
import { TeamsUserCredential, TeamsUserCredentialAuthConfig } from "@microsoft/teamsfx";

const authConfig: TeamsUserCredentialAuthConfig = {
  clientId: process.env.AAD_APP_CLIENT_ID!,
  initiateLoginEndpoint: process.env.INITIATE_LOGIN_ENDPOINT!,
};
const credential = new TeamsUserCredential(authConfig);
const token = await credential.getToken(["User.Read"]);

// ✅ NEW: MSAL.js v3.15+ with NAA
import { createNestablePublicClientApplication } from "@azure/msal-browser";

const msalInstance = await createNestablePublicClientApplication({
  auth: {
    clientId: process.env.AAD_APP_CLIENT_ID!,
    authority: `https://login.microsoftonline.com/${process.env.APP_TENANTID}`,
    supportsNestedAppAuth: true,
  },
});
const accounts = msalInstance.getAllAccounts();
const result = await msalInstance.acquireTokenSilent({
  scopes: ["User.Read"],
  account: accounts[0],
});
const token = result.accessToken;
```

### TeamsFx Graph Client → Direct Graph

```typescript
// ❌ OLD: TeamsFx Graph helper
import { createMicrosoftGraphClientWithCredential } from "@microsoft/teamsfx";

const graphClient = createMicrosoftGraphClientWithCredential(credential, ["User.Read"]);
const profile = await graphClient.api("/me").get();

// ✅ NEW: Direct Graph with MSAL token
const token = await getToken(["User.Read"]);
const response = await fetch("https://graph.microsoft.com/v1.0/me", {
  headers: { Authorization: `Bearer ${token}` },
});
const profile = await response.json();

// Or use @microsoft/microsoft-graph-client
import { Client } from "@microsoft/microsoft-graph-client";

const graphClient = Client.init({
  authProvider: (done) => done(null, token),
});
const profile = await graphClient.api("/me").get();
```

### TeamsJS v1.x → v2.x

```typescript
// ❌ OLD: TeamsJS v1.x
import * as microsoftTeams from "@microsoft/teams-js";

microsoftTeams.initialize(() => {
  microsoftTeams.getContext((context) => {
    console.log(context.teamId);
  });
});

// tasks namespace (deprecated)
microsoftTeams.tasks.startTask({
  url: "https://example.com/form",
  title: "My Form",
  height: 500,
  width: 600,
});

// ✅ NEW: TeamsJS v2.x
import { app, dialog } from "@microsoft/teams-js";

await app.initialize();
const context = await app.getContext();
console.log(context.team?.internalId);

// dialog namespace (current)
dialog.url.open({
  url: "https://example.com/form",
  title: "My Form",
  size: { height: 500, width: 600 },
});
```

## Phase 3: Manifest Migration (v1.17 → v1.25)

### Automated Migration Script

```bash
#!/bin/bash
# migrate-manifest.sh — Upgrade manifest from v1.17 to v1.25
set -euo pipefail

MANIFEST="${1:-appPackage/manifest.json}"

if [ ! -f "$MANIFEST" ]; then
  echo "ERROR: Manifest not found at $MANIFEST"
  exit 1
fi

echo "Migrating $MANIFEST from v1.17 → v1.25..."

# Update schema URL and version
python3 << PYEOF
import json

with open("$MANIFEST") as f:
    manifest = json.load(f)

# Track changes
changes = []

# 1. Update schema and version
old_version = manifest.get("manifestVersion", "unknown")
manifest["\$schema"] = "https://developer.microsoft.com/json-schemas/teams/v1.25/MicrosoftTeams.schema.json"
manifest["manifestVersion"] = "1.25"
changes.append(f"manifestVersion: {old_version} → 1.25")

# 2. Add supportsChannelFeatures if not present
if "supportsChannelFeatures" not in manifest:
    manifest["supportsChannelFeatures"] = {
        "supportsSharedChannels": True,
        "supportsPrivateChannels": True
    }
    changes.append("Added supportsChannelFeatures")

# 3. Add meetingExtensionDefinition if configurableTabs has meeting contexts
for tab in manifest.get("configurableTabs", []):
    contexts = tab.get("context", [])
    has_meeting = any("meeting" in c.lower() for c in contexts)
    if has_meeting and "meetingExtensionDefinition" not in manifest:
        manifest["meetingExtensionDefinition"] = {
            "supportsAnonymousGuestUsers": False
        }
        changes.append("Added meetingExtensionDefinition (anonymous=false)")
        break

with open("$MANIFEST", "w") as f:
    json.dump(manifest, f, indent=2)

print("Changes made:")
for c in changes:
    print(f"  • {c}")
print(f"\nManifest saved to $MANIFEST")
PYEOF

echo ""
echo "Manual steps remaining:"
echo "  1. Review auth: ensure single-tenant (AzureADMyOrg)"
echo "  2. Add nestedAppAuthInfo if using SPA tabs"
echo "  3. Add backgroundLoadConfiguration if desired"
echo "  4. Add agenticUserTemplates for Agent 365"
echo "  5. Validate: atk validate --manifest-path $MANIFEST"
```

## Phase 4: Auth Migration

### Multi-Tenant → Single-Tenant

```bash
# Update Entra app registration
az ad app update \
  --id {app-id} \
  --sign-in-audience "AzureADMyOrg"

# Update environment variables
# ❌ OLD
# APP_TENANTID=common
# AAD_APP_OAUTH_AUTHORITY=https://login.microsoftonline.com/common

# ✅ NEW
# APP_TENANTID={your-actual-tenant-id}
# AAD_APP_OAUTH_AUTHORITY=https://login.microsoftonline.com/{your-actual-tenant-id}
```

### Update Bot Registration

```bash
# Update bot to single-tenant
az bot update \
  --resource-group {rg} \
  --name {bot-name} \
  --endpoint "https://{your-domain}/api/messages" \
  --msa-app-type "SingleTenant" \
  --msa-app-tenant-id "{your-tenant-id}"
```

## Phase 5: Package Dependencies

### Update package.json

```diff
  "dependencies": {
-   "@microsoft/teamsfx": "^2.x",
-   "@microsoft/teams-js": "^1.x",
+   "@microsoft/teams-js": "^2.28.0",
+   "@azure/msal-browser": "^3.15.0",
    "botbuilder": "^4.23.0",
-   "@microsoft/teamsapp-cli": "^3.x"
  },
  "devDependencies": {
+   "@microsoft/m365agentstoolkit-cli": "^1.x"
  }
```

```bash
# Install new deps
npm uninstall @microsoft/teamsfx @microsoft/teamsapp-cli
npm install @microsoft/teams-js@latest @azure/msal-browser@latest
npm install -D @microsoft/m365agentstoolkit-cli@latest
```

## Migration Checklist

### Tooling
- [ ] Install `@microsoft/m365agentstoolkit-cli`
- [ ] Rename `teamsapp.yml` → `m365agents.yml`
- [ ] Rename `teamsapp.local.yml` → `m365agents.local.yml`
- [ ] Update `package.json` scripts

### Manifest
- [ ] Update `$schema` to v1.25 URL
- [ ] Update `manifestVersion` to `"1.25"`
- [ ] Add `supportsChannelFeatures` if using channels
- [ ] Add `nestedAppAuthInfo` if using NAA
- [ ] Validate with `atk validate`

### Auth
- [ ] Switch Entra app to single-tenant (`AzureADMyOrg`)
- [ ] Update `APP_TENANTID` from `common` to actual GUID
- [ ] Replace TeamsFx auth with MSAL.js v3.15+
- [ ] Update bot registration to `SingleTenant`

### SDK
- [ ] Replace `@microsoft/teamsfx` with `@azure/msal-browser`
- [ ] Update TeamsJS from v1.x to v2.x
- [ ] Replace `tasks.*` with `dialog.*`
- [ ] Update `microsoftTeams.initialize()` to `app.initialize()`
- [ ] Update `microsoftTeams.getContext()` to `app.getContext()`

### Testing
- [ ] Test with Agents Playground locally
- [ ] Verify SSO flow works with single-tenant
- [ ] Test in Teams desktop, web, and mobile
- [ ] Validate manifest before publishing

## See Also

- `/teams:manifest` — Full v1.25 schema reference
- `/teams:auth` — NAA and single-tenant deep dive
- `/teams:dialog` — dialog namespace migration
- `/teams:agent` — Custom Engine Agents (new capability)
