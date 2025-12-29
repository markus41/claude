# exec-automator Scripts

Production-ready installation and management scripts for the exec-automator Claude Code plugin.

## Overview

This directory contains comprehensive scripts for setting up, managing, and maintaining the exec-automator plugin. All scripts feature colored output, error handling, logging, and follow Brookside BI brand voice.

## Available Scripts

### 1. install.sh - Main Installation Script

Complete installation and setup for the exec-automator plugin.

**Features:**
- Python version validation (>=3.10)
- Virtual environment creation
- Dependency installation (LangGraph, LangChain, MCP)
- Environment configuration
- Directory structure setup
- MCP server stub creation
- Connectivity testing

**Usage:**
```bash
./scripts/install.sh [options]

Options:
  --python PATH    Specify Python executable (default: python3)
  --skip-test      Skip MCP server connection test
  --dev            Install development dependencies
  --help           Show help message
```

**Examples:**
```bash
# Standard installation
./scripts/install.sh

# Use specific Python version with dev dependencies
./scripts/install.sh --python python3.11 --dev

# Quick install without testing
./scripts/install.sh --skip-test
```

**What it does:**
1. Validates Python version (3.10+)
2. Creates virtual environment in `.venv/`
3. Installs core dependencies:
   - langgraph >=0.2.0
   - langchain >=0.3.0
   - langchain-anthropic >=0.2.0
   - langchain-openai >=0.2.0
   - mcp >=1.0.0
4. Creates `.env` template for API keys
5. Sets up directory structure
6. Creates MCP server stub
7. Tests server startup

**Post-installation:**
- Edit `.env` file with your API keys
- Run `./scripts/start-mcp.sh` to launch server
- Run `./scripts/health-check.sh` to verify setup

---

### 2. start-mcp.sh - MCP Server Startup

Launches the exec-automator MCP server with proper environment and process management.

**Features:**
- Virtual environment activation
- Environment variable loading from `.env`
- Process management (PID tracking)
- Daemon mode support
- Log rotation
- Graceful shutdown handling

**Usage:**
```bash
./scripts/start-mcp.sh [options]

Options:
  --daemon         Run server as background daemon
  --port PORT      Override default port (default: 8765)
  --debug          Enable debug logging
  --help           Show help message
```

**Examples:**
```bash
# Start in foreground (interactive)
./scripts/start-mcp.sh

# Start as background daemon
./scripts/start-mcp.sh --daemon

# Custom port with debug logging
./scripts/start-mcp.sh --port 9000 --debug
```

**Process Management:**
```bash
# Start daemon
./scripts/start-mcp.sh --daemon

# Check status
ps -p $(cat mcp-server.pid)

# Stop server
kill $(cat mcp-server.pid)

# View logs
tail -f logs/mcp-server-YYYYMMDD.log
```

**Logs:**
- Server logs: `logs/mcp-server-YYYYMMDD.log`
- PID file: `mcp-server.pid`

---

### 3. setup-integrations.sh - Integration Setup Wizard

Interactive wizard for configuring external service integrations.

**Features:**
- OAuth flow guidance
- API key configuration
- Credential encryption
- Connection testing
- Secure credential storage

**Supported Integrations:**

**CRM Systems:**
- Salesforce (OAuth 2.0)
- HubSpot (API Key)
- Zoho CRM (OAuth 2.0)

**Calendar Services:**
- Google Calendar (OAuth 2.0)
- Microsoft 365 (OAuth 2.0)
- CalDAV (Username/Password)

**Email Platforms:**
- Gmail (OAuth 2.0)
- Outlook (OAuth 2.0)
- SendGrid (API Key)
- Generic SMTP

**Communication:**
- Slack (Bot Token)
- Microsoft Teams (OAuth 2.0)
- Discord (Bot Token)

**Usage:**
```bash
./scripts/setup-integrations.sh [options]

Options:
  --service NAME   Setup specific service only
  --list           List available integrations
  --reset          Reset all integration configurations
  --help           Show help message
```

**Examples:**
```bash
# Interactive setup (all integrations)
./scripts/setup-integrations.sh

# Setup specific service
./scripts/setup-integrations.sh --service crm

# List available integrations
./scripts/setup-integrations.sh --list

# Reset all configurations
./scripts/setup-integrations.sh --reset
```

**Security:**
- Credentials stored in `mcp-server/config/integrations.json`
- File permissions set to 600 (owner read/write only)
- File is .gitignore'd and should never be committed
- Use `backup.sh` with `--encrypt` for secure backups

---

### 4. health-check.sh - System Health Check

Comprehensive diagnostics for the exec-automator plugin.

**Features:**
- Environment validation
- Python dependency checks
- API key verification
- MCP server status
- Integration connectivity
- Database integrity
- Log analysis
- JSON output support
- Auto-fix common issues

**Usage:**
```bash
./scripts/health-check.sh [options]

Options:
  --verbose        Show detailed output
  --fix            Attempt to fix common issues
  --json           Output results in JSON format
  --help           Show help message
```

**Examples:**
```bash
# Basic health check
./scripts/health-check.sh

# Verbose output with auto-fix
./scripts/health-check.sh --verbose --fix

# JSON output for monitoring
./scripts/health-check.sh --json > health-report.json
```

**Health Checks:**
1. **Environment:**
   - Plugin root directory
   - .env file
   - Log directory
   - Directory structure

2. **Python:**
   - Virtual environment
   - Python version (3.10+)
   - Required packages

3. **API Keys:**
   - ANTHROPIC_API_KEY (required)
   - OPENAI_API_KEY (optional)
   - API connectivity

4. **MCP Server:**
   - Server file existence
   - Python syntax validation
   - Process status
   - Server responsiveness

5. **Integrations:**
   - Configuration file
   - Integration count
   - Service connectivity

6. **Database:**
   - Checkpoint database
   - Database size
   - Integrity check

7. **Logs:**
   - Recent activity
   - Error count
   - Log rotation needs

**Exit Codes:**
- 0: All checks passed
- 1: Warnings present
- 2: Critical failures

**JSON Output Format:**
```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "plugin": "exec-automator",
  "version": "1.0.0",
  "summary": {
    "total_checks": 20,
    "passed": 18,
    "warnings": 2,
    "failed": 0,
    "critical_failed": false
  },
  "checks": [
    {
      "category": "Environment",
      "name": "Plugin Root Directory",
      "status": "pass",
      "message": ""
    }
  ]
}
```

---

### 5. backup.sh - Configuration Backup

Secure backup and restore for exec-automator configurations.

**Features:**
- Compressed archives with timestamps
- GPG encryption support
- Remote backup (rsync, S3)
- Automatic backup rotation
- Checksum verification
- Restore functionality
- Incremental backups

**Usage:**
```bash
./scripts/backup.sh [options]

Options:
  --output DIR     Backup directory (default: ./backups)
  --encrypt        Encrypt backup with GPG
  --remote URL     Upload to remote location
  --include-logs   Include log files in backup
  --restore FILE   Restore from backup archive
  --list           List available backups
  --help           Show help message
```

**Examples:**
```bash
# Basic backup
./scripts/backup.sh

# Encrypted backup to custom location
./scripts/backup.sh --output /secure/backups --encrypt

# Backup with logs to S3
./scripts/backup.sh --include-logs --remote s3://my-bucket/backups

# Backup with rsync to remote server
./scripts/backup.sh --remote user@server:/backups

# List available backups
./scripts/backup.sh --list

# Restore from backup
./scripts/backup.sh --restore backups/exec-automator-20250115-120000.tar.gz
```

**Backup Contents:**
- Environment configuration (`.env`)
- Integration credentials (`mcp-server/config/integrations.json`)
- Workflow definitions (`workflows/`)
- Agent configurations (`agents/`)
- Plugin settings (`.claude-plugin/`)
- Checkpoint database (`mcp-server/data/checkpoints.db`)
- Logs (optional with `--include-logs`)

**Backup Rotation:**
- Automatically keeps last 10 backups
- Older backups are removed
- Can be customized in script

**Encryption:**
- Uses GPG symmetric encryption (AES256)
- Password-based
- Requires GPG to be installed
- Encrypted files have `.gpg` extension

**Remote Backup:**

S3 Example:
```bash
# Configure AWS CLI first
aws configure

# Backup to S3
./scripts/backup.sh --remote s3://my-bucket/exec-automator-backups
```

rsync Example:
```bash
# Backup to remote server
./scripts/backup.sh --remote user@backup-server:/var/backups/exec-automator
```

**Restore Process:**
1. Verifies backup integrity (SHA256 checksum)
2. Decrypts if encrypted
3. Creates backup of current state
4. Extracts and restores files
5. Saves pre-restore backup for rollback

---

## Quick Start Guide

### Initial Setup

```bash
# 1. Run installation
./scripts/install.sh --dev

# 2. Configure API keys
nano .env  # Add ANTHROPIC_API_KEY, OPENAI_API_KEY

# 3. Setup integrations (optional)
./scripts/setup-integrations.sh

# 4. Start MCP server
./scripts/start-mcp.sh --daemon

# 5. Verify health
./scripts/health-check.sh --verbose
```

### Daily Operations

```bash
# Check system health
./scripts/health-check.sh

# Start server
./scripts/start-mcp.sh --daemon

# Stop server
kill $(cat mcp-server.pid)

# View logs
tail -f logs/mcp-server-$(date +%Y%m%d).log
```

### Backup & Restore

```bash
# Create encrypted backup
./scripts/backup.sh --encrypt

# Backup to S3
./scripts/backup.sh --remote s3://my-bucket/backups

# List backups
./scripts/backup.sh --list

# Restore from backup
./scripts/backup.sh --restore backups/exec-automator-20250115-120000.tar.gz.gpg
```

### Troubleshooting

```bash
# Run health check with auto-fix
./scripts/health-check.sh --fix --verbose

# Reinstall dependencies
source .venv/bin/activate
pip install --force-reinstall langgraph langchain mcp

# Reset integrations
./scripts/setup-integrations.sh --reset

# Check server logs
tail -100 logs/mcp-server-$(date +%Y%m%d).log
```

---

## Environment Variables

### Required Variables

```bash
# API Keys (REQUIRED)
ANTHROPIC_API_KEY=sk-ant-xxx
OPENAI_API_KEY=sk-xxx

# MCP Server Configuration
MCP_SERVER_HOST=localhost
MCP_SERVER_PORT=8765
MCP_LOG_LEVEL=INFO

# LangGraph Configuration
LANGGRAPH_CHECKPOINT_DB=sqlite:///./mcp-server/data/checkpoints.db
LANGGRAPH_TRACING=false
```

### Optional Variables

```bash
# Development Settings
DEBUG=false
LOG_LEVEL=INFO

# Integration API Keys
CRM_API_KEY=
CALENDAR_API_KEY=
EMAIL_API_KEY=
SLACK_BOT_TOKEN=
```

---

## Logging

All scripts create detailed logs in the `logs/` directory:

```
logs/
├── install-YYYYMMDD-HHMMSS.log
├── mcp-server-YYYYMMDD.log
├── integration-setup-YYYYMMDD-HHMMSS.log
├── health-check-YYYYMMDD-HHMMSS.log
└── backup-YYYYMMDD-HHMMSS.log
```

**Log Levels:**
- `INFO`: General information
- `SUCCESS`: Successful operations
- `WARN`: Warnings (non-critical)
- `ERROR`: Errors (critical)
- `VERBOSE`: Detailed debug information (with --verbose)

**View Logs:**
```bash
# Tail latest MCP server log
tail -f logs/mcp-server-$(date +%Y%m%d).log

# Search for errors
grep ERROR logs/*.log

# View specific log
less logs/health-check-20250115-120000.log
```

---

## Security Best Practices

### API Keys
- Never commit `.env` file
- Use environment variables in production
- Rotate keys regularly
- Use separate keys for dev/prod

### Integration Credentials
- `mcp-server/config/integrations.json` is .gitignore'd
- File permissions set to 600
- Use encrypted backups
- Store backups securely

### Backups
- Always encrypt backups with `--encrypt`
- Use strong GPG passwords
- Store backups off-site (S3, remote server)
- Test restore process regularly

### Server
- Run MCP server as non-root user
- Use firewall to restrict access
- Monitor logs for suspicious activity
- Keep dependencies updated

---

## Dependencies

### Required
- Python 3.10+
- pip
- tar
- bash

### Optional
- gpg (for encrypted backups)
- rsync (for remote backups)
- AWS CLI (for S3 backups)
- sqlite3 (for database integrity checks)

### Python Packages
See `install.sh` for full list. Core packages:
- langgraph >=0.2.0
- langchain >=0.3.0
- langchain-anthropic >=0.2.0
- mcp >=1.0.0

---

## Cross-Platform Support

### Linux/macOS
All scripts work natively on Linux and macOS.

### Windows
- Use Git Bash, WSL, or MSYS2
- Scripts detect Windows and adjust commands
- Virtual environment activation handled automatically

---

## CI/CD Integration

### Health Check in CI
```yaml
# GitHub Actions example
- name: Health Check
  run: |
    ./scripts/health-check.sh --json > health-report.json

- name: Upload Health Report
  uses: actions/upload-artifact@v3
  with:
    name: health-report
    path: health-report.json
```

### Automated Backups
```bash
# Cron job for daily backups
0 2 * * * cd /path/to/exec-automator && ./scripts/backup.sh --encrypt --remote s3://backups
```

---

## Support

For issues, feature requests, or questions:
- GitHub: https://github.com/brooksidebi/exec-automator
- Email: dev@brooksidebi.com
- Documentation: See plugin README.md

---

**Powered by Brookside BI**

Copyright (c) 2025 Brookside BI. All rights reserved.
