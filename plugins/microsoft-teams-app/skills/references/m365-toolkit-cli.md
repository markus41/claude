# M365 Agents Toolkit CLI Reference

## Package

```
@microsoft/m365agentstoolkit-cli
```

**Binary:** `atk`
**Replaces:** `@microsoft/teamsapp-cli` (deprecated Sept 2025)

## Commands

| Command | Description |
|---|---|
| `atk new` | Create new project from template |
| `atk provision` | Provision cloud resources |
| `atk deploy` | Deploy to provisioned resources |
| `atk validate` | Validate manifest and config |
| `atk preview` | Preview app locally or remotely |
| `atk package` | Create app package (.zip) |
| `atk publish` | Publish to org app catalog |
| `atk env` | Manage environment configurations |

## Templates

| Template ID | Description |
|---|---|
| `basic-tab` | Static tab with React |
| `bot` | Conversational bot |
| `message-extension` | Bot-based message extension |
| `declarative-agent` | Declarative agent for M365 Copilot |
| `basic-custom-engine-agent` | Custom Engine Agent with AI backend |
| `weather-agent` | Sample agent with API plugin |
| `tab-spfx` | SharePoint Framework tab |

## Config Files

| File | Purpose |
|---|---|
| `m365agents.yml` | Main provisioning/deploy config |
| `m365agents.local.yml` | Local development overrides |
| `env/.env.dev` | Dev environment variables |
| `env/.env.local` | Local environment variables |
| `appPackage/manifest.json` | App manifest |

## Common Workflows

```bash
# New project
atk new --template basic-custom-engine-agent --folder ./my-agent

# Local development
atk preview --local

# Validate before publish
atk validate --manifest-path appPackage/manifest.json

# Package and publish
atk package --manifest-path appPackage/manifest.json --output-zip-path ./build/app.zip
atk publish --file-path ./build/app.zip
```

## Agents Playground

Local testing without M365 account or tunnel.

```bash
npx agentsplayground -e "http://localhost:3978/api/messages" -c "emulator"
npx agentsplayground -e "http://localhost:3978/api/messages" -c "msteams"
```

Channel IDs:
- `emulator` — Default generic channel
- `msteams` — Teams-specific behaviors (channelData, etc.)
