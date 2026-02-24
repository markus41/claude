# Home Assistant Architect Plugin

Comprehensive Claude Code plugin for Home Assistant automation, local LLM integration, and Ubuntu server management. This plugin provides specialized sub-agents, hooks, tools, and skills to streamline smart home development and operations.

## Features

## Registry Snapshot

<!-- registry-summary:start -->
- Sub-agents: **15**
- Commands: **9**
- Skills: **8**
- Hook entries (config, scripts, and hook events): **10**
- MCP entrypoints: **2**
<!-- registry-summary:end -->

### Sub-Agents

| Agent | Purpose | Model |
|-------|---------|-------|
| **ha-device-controller** | Control devices, entities, and services | Sonnet |
| **ha-automation-architect** | Design and optimize automations | Sonnet |
| **ha-diagnostics** | Troubleshoot issues and logs | Sonnet |
| **local-llm-manager** | Deploy Ollama and local LLMs | Opus |
| **ubuntu-ha-deployer** | Deploy HA on Ubuntu servers | Sonnet |
| **ha-voice-assistant** | Configure voice pipelines | Sonnet |
| **ha-energy-optimizer** | Analyze and optimize energy usage | Sonnet |
| **ha-security-auditor** | Audit security configuration | Opus |

### Commands

| Command | Description |
|---------|-------------|
| `/ha-control` | Control entities with natural language |
| `/ha-automation` | Create and manage automations |
| `/ha-deploy` | Deploy HA on Ubuntu |
| `/ha-diagnose` | Diagnose issues |
| `/ollama-setup` | Setup local LLM |
| `/ha-voice` | Configure voice assistant |
| `/ha-backup` | Backup and restore |
| `/ha-mcp` | Configure MCP server |

### Skills

- **ha-core**: REST/WebSocket API patterns
- **ha-automation**: YAML automation best practices
- **local-llm**: Ollama integration patterns
- **ubuntu-deployment**: Docker deployment

### Hooks

- State change monitoring
- Health checks on task completion
- YAML validation before writes
- Security scanning
- Backup reminders

### MCP Server

Full Model Context Protocol server with 11 tools:
- Entity state management
- Service calls
- History queries
- Automation management
- Ollama integration

## Installation

### Prerequisites

- Claude Code CLI installed
- Home Assistant instance (2025.1.0+)
- Long-Lived Access Token from HA

### Plugin Installation

```bash
# Clone the plugin
cd ~/.claude/plugins
git clone https://github.com/Lobbi-Docs/claude.git

# Or use the plugin manager
/plugin-install home-assistant-architect
```

### Configuration

Set environment variables:

```bash
export HA_URL="http://homeassistant.local:8123"
export HA_TOKEN="your-long-lived-access-token"
export OLLAMA_URL="http://localhost:11434"
```

Or add to `.env`:

```env
HA_URL=http://homeassistant.local:8123
HA_TOKEN=your-token
OLLAMA_URL=http://localhost:11434
HA_VOICE_MODEL=llama3.2:3b
```

## Quick Start

### Control Devices

```bash
# Natural language control
/ha-control turn on living room lights at 50%
/ha-control set thermostat to 72 degrees
/ha-control lock front door
```

### Create Automations

```bash
# Create from description
/ha-automation create Turn on porch lights at sunset

# Debug automation
/ha-automation debug motion_lights
```

### Deploy on Ubuntu

```bash
# Full stack deployment
/ha-deploy full --dir /opt/homeassistant

# Check status
/ha-deploy status
```

### Setup Local LLM

```bash
# Install and configure Ollama
/ollama-setup install
/ollama-setup pull llama3.2:3b
/ollama-setup configure
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Home Assistant Architect Plugin                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐               │
│  │   Agents     │  │   Commands   │  │    Skills    │               │
│  │  (dynamic)   │  │  (dynamic)   │  │  (dynamic)   │               │
│  └──────────────┘  └──────────────┘  └──────────────┘               │
│          │                │                 │                        │
│          └────────────────┼─────────────────┘                        │
│                           │                                          │
│                    ┌──────▼──────┐                                   │
│                    │  MCP Server │                                   │
│                    │  (11 tools) │                                   │
│                    └──────┬──────┘                                   │
│                           │                                          │
│         ┌─────────────────┼─────────────────┐                       │
│         │                 │                 │                       │
│  ┌──────▼──────┐  ┌───────▼───────┐  ┌─────▼──────┐                │
│  │ Home        │  │    Ollama     │  │  Ubuntu    │                │
│  │ Assistant   │  │  (Local LLM)  │  │  Server    │                │
│  │   API       │  │               │  │            │                │
│  └─────────────┘  └───────────────┘  └────────────┘                │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

## MCP Server Setup

### For Claude Desktop

Add to `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "home-assistant": {
      "command": "node",
      "args": ["path/to/mcp-server/dist/index.js"],
      "env": {
        "HA_URL": "http://homeassistant.local:8123",
        "HA_TOKEN": "your-token",
        "OLLAMA_URL": "http://localhost:11434"
      }
    }
  }
}
```

### For Claude Code

```bash
claude mcp add home-assistant \
  -e HA_URL=http://homeassistant.local:8123 \
  -e HA_TOKEN=your-token \
  -- node path/to/mcp-server/dist/index.js
```

## Ubuntu Deployment

### Quick Deploy

```bash
# One-line deployment
curl -fsSL https://raw.githubusercontent.com/Lobbi-Docs/claude/main/home-assistant-architect/scripts/quick-deploy.sh | bash
```

### Full Stack

The Docker Compose template includes:

- Home Assistant Core
- MariaDB database
- Mosquitto MQTT
- Zigbee2MQTT
- Z-Wave JS UI
- Node-RED
- InfluxDB + Grafana
- Caddy reverse proxy
- Ollama LLM

```bash
cd /opt/homeassistant
docker compose up -d
```

## Local LLM Integration

### Recommended Models

| Use Case | Model | RAM Required |
|----------|-------|--------------|
| Voice Assistant | llama3.2:3b | 4GB |
| HA Control | fixt/home-3b-v3 | 4GB |
| General Chat | llama3.2:8b | 8GB |
| Complex Tasks | mistral:7b | 8GB |

### Voice Pipeline

```yaml
# Local voice stack
STT: faster-whisper (base.en)
LLM: llama3.2:3b or home-3b-v3
TTS: piper (en_US-lessac-medium)
Wake: openwakeword
```

## Security

### Best Practices

- Use Long-Lived Access Tokens (not passwords)
- Enable HTTPS with valid certificates
- Use VPN for remote access (Tailscale, WireGuard)
- Run security audits regularly

### Security Audit

```bash
# Run security audit
claude Task --subagent_type=ha-security-auditor "Audit my HA installation"
```

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Connection refused | Check HA_URL and firewall |
| 401 Unauthorized | Verify HA_TOKEN |
| Entity not found | Check entity_id spelling |
| Automation not running | Check conditions and triggers |
| Ollama timeout | Increase client timeout |

### Diagnostics

```bash
# Run diagnostics
/ha-diagnose

# Check logs
/ha-deploy logs homeassistant
```

## Contributing

1. Fork the repository
2. Create feature branch
3. Submit pull request

## License

MIT License

## Resources

### Official Documentation
- [Home Assistant](https://www.home-assistant.io/docs/)
- [Ollama](https://ollama.com/)
- [MCP Protocol](https://modelcontextprotocol.io/)

### Community
- [HA Community](https://community.home-assistant.io/)
- [hass-mcp](https://github.com/voska/hass-mcp)
- [home-llm](https://github.com/acon96/home-llm)

---

**Built with Brookside BI standards for sustainable smart home development.**
