# home-assistant-architect

**Version:** 2.0.0 | **License:** MIT
**Author:** Brookside BI

## Purpose

This plugin provides comprehensive Home Assistant automation, local LLM integration
via Ollama, and Ubuntu server deployment. It exists because smart home development
involves coordinating a complex stack -- HA Core, Zigbee/Z-Wave radios, MQTT brokers,
NVR cameras, energy monitors, and voice pipelines -- where each subsystem has its own
YAML configuration dialect and API surface.

The plugin's 15 agents cover the full spectrum from device control and automation
design through camera NVR management, energy optimization, and security auditing. A
built-in MCP server with 11 tools enables direct entity state management, service
calls, and Ollama integration. Hook behavior is scoped to HA/Ollama contexts only,
avoiding noisy reminders during unrelated work.

## Directory Structure

```
home-assistant-architect/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 15 agents
  commands/                      # 9 commands
  skills/                        # 8 skills (subdirectories with SKILL.md)
  hooks/                         # 10 hook entries (scoped to HA/Ollama contexts)
  mcp-server/                    # MCP server with 11 tools
```

## Agents

| Agent | Description |
|-------|-------------|
| ha-device-controller | Control devices, entities, and services |
| ha-automation-architect | Design and optimize automations |
| ha-dashboard-designer | Lovelace dashboard design |
| ha-customization-expert | HA customization and configuration |
| ha-diagnostics | Troubleshoot issues and analyze logs |
| ha-energy-optimizer | Analyze and optimize energy usage |
| ha-energy-management | Energy monitoring and management |
| ha-camera-nvr | Camera and NVR configuration |
| ha-data-writer | HA configuration file writing |
| ha-sensor-manager | Sensor setup and management |
| ha-frontend-builder | Custom frontend components |
| ha-voice-assistant | Voice pipeline configuration |
| ha-security-auditor | Security configuration audit |
| local-llm-manager | Ollama and local LLM deployment |
| ubuntu-ha-deployer | Deploy HA on Ubuntu servers |

## Commands

| Command | Description |
|---------|-------------|
| `/ha-control` | Control entities with natural language |
| `/ha-automation` | Create and manage automations |
| `/ha-dashboard` | Design and deploy dashboards |
| `/ha-deploy` | Deploy HA on Ubuntu (Docker Compose) |
| `/ha-energy` | Energy management and optimization |
| `/ha-camera` | Camera and NVR configuration |
| `/ha-sensor` | Sensor setup and management |
| `/ha-mcp` | Configure MCP server connection |
| `/ollama-setup` | Install and configure local LLM |

## Skills

- **ha-core** -- REST/WebSocket API patterns
- **ha-automation** -- YAML automation best practices
- **local-llm** -- Ollama integration patterns
- **ubuntu-deployment** -- Docker Compose deployment on Ubuntu
- **camera-nvr** -- Camera and NVR configuration
- **energy-management** -- Energy monitoring and optimization
- **lovelace-design** -- Dashboard design patterns
- **sensor-management** -- Sensor setup and calibration

## MCP Server (11 tools)

Entity state management, service calls, history queries, automation management,
and Ollama integration. Configured via:

```bash
claude mcp add home-assistant \
  -e HA_URL=http://homeassistant.local:8123 \
  -e HA_TOKEN=your-token \
  -- node path/to/mcp-server/dist/index.js
```

## Recommended Local LLM Models

| Use Case | Model | RAM |
|----------|-------|-----|
| Voice Assistant | llama3.2:3b | 4GB |
| HA Control | fixt/home-3b-v3 | 4GB |
| General Chat | llama3.2:8b | 8GB |

## Prerequisites

- Home Assistant instance (2025.1.0+)
- Long-Lived Access Token from HA
- Docker (for Ubuntu deployment)
- Ollama (optional, for local LLM)

**Environment variables:**
- `HA_URL`, `HA_TOKEN` -- Home Assistant connection
- `OLLAMA_URL` -- Ollama server (default: http://localhost:11434)

## Quick Start

```
/ha-mcp                                  # Configure MCP connection
/ha-control turn on living room lights at 50%
/ha-automation create Turn on porch lights at sunset
/ha-deploy full --dir /opt/homeassistant
/ollama-setup install && /ollama-setup pull llama3.2:3b
```
