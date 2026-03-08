# Claude Code Troubleshooting & Debugger

Complete guide to diagnosing, debugging, and fixing Claude Code setup and runtime issues.

## Quick Diagnostics

### /doctor Command
```
/doctor
```
Runs automated health checks:
- API key validation
- Network connectivity
- CLI version check
- MCP server status
- Configuration validation
- Node.js version check

### Verbose Mode
```bash
claude --verbose
```
Shows detailed debug output including:
- API calls and responses
- MCP server communication
- Tool execution details
- Configuration loading
- Error stack traces

## Common Issues & Fixes

### 1. Authentication Errors

#### "Invalid API Key"
```bash
# Check key is set
echo $ANTHROPIC_API_KEY

# Test key
curl -H "x-api-key: $ANTHROPIC_API_KEY" \
  -H "content-type: application/json" \
  https://api.anthropic.com/v1/messages \
  -d '{"model":"claude-sonnet-4-6","max_tokens":10,"messages":[{"role":"user","content":"hi"}]}'

# Fix: Set correct key
export ANTHROPIC_API_KEY="sk-ant-..."

# Or add to shell profile
echo 'export ANTHROPIC_API_KEY="sk-ant-..."' >> ~/.bashrc
```

#### "Unauthorized" with Bedrock
```bash
# Check AWS credentials
aws sts get-caller-identity

# Ensure Bedrock access
aws bedrock list-foundation-models --region us-east-1

# Fix: Configure AWS
aws configure
# Or set env vars
export AWS_ACCESS_KEY_ID="..."
export AWS_SECRET_ACCESS_KEY="..."
export AWS_REGION="us-east-1"
export CLAUDE_CODE_USE_BEDROCK=1
```

#### "Unauthorized" with Vertex
```bash
# Check GCP auth
gcloud auth application-default print-access-token

# Fix: Re-authenticate
gcloud auth application-default login
export CLAUDE_CODE_USE_VERTEX=1
export ANTHROPIC_VERTEX_PROJECT_ID="your-project"
export CLOUD_ML_REGION="us-east5"
```

### 2. MCP Server Issues

#### Server Not Starting
```bash
# List server status
claude mcp list

# Test server manually
npx -y @modelcontextprotocol/server-filesystem /tmp 2>&1

# Common fix: Clear npx cache
npx clear-npx-cache

# Check node version (need 18+)
node --version

# Check .mcp.json syntax
python3 -c "import json; json.load(open('.mcp.json')); print('Valid JSON')"
```

#### "Tool not found" for MCP
```bash
# Verify tool name format: mcp__<server>__<tool>
# Example: mcp__filesystem__read_file

# List available tools from server
claude mcp get filesystem

# Fix: Check server name matches .mcp.json key
cat .mcp.json | python3 -c "import json,sys; print(list(json.load(sys.stdin)['mcpServers'].keys()))"
```

#### MCP Server Crashes
```bash
# Check server logs
claude --verbose 2>&1 | grep -i "mcp\|error"

# Common causes:
# 1. Missing env vars → add to .mcp.json "env" field
# 2. Port conflicts → change port or kill conflicting process
# 3. Permission denied → check file permissions
# 4. Missing dependency → npm install required packages
```

### 3. Configuration Issues

#### Settings Not Loading
```bash
# Check settings file exists and is valid JSON
cat .claude/settings.json | python3 -m json.tool

# Check file locations
ls -la .claude/settings.json .claude/settings.local.json 2>/dev/null
ls -la ~/.claude/settings.json 2>/dev/null

# Common fix: JSON syntax error
# Look for trailing commas, missing quotes, etc.
```

#### CLAUDE.md Not Loading
```bash
# Check file exists
ls -la CLAUDE.md .claude/CLAUDE.md

# Check file encoding (must be UTF-8)
file CLAUDE.md

# Check file size (very large files may be truncated)
wc -c CLAUDE.md

# Fix: Ensure it's a regular file, not a symlink to a missing target
```

#### Hooks Not Firing
```bash
# Check hooks configuration
python3 -c "
import json
settings = json.load(open('.claude/settings.json'))
hooks = settings.get('hooks', {})
for event, configs in hooks.items():
    print(f'{event}: {len(configs)} hook(s)')
    for config in configs:
        print(f'  matcher: {config.get(\"matcher\")}')
        for h in config.get('hooks', []):
            print(f'  command: {h.get(\"command\")}')
"

# Test hook script manually
echo '{"tool_name":"Bash","tool_input":{"command":"test"}}' | bash .claude/hooks/your-hook.sh

# Common issues:
# 1. Script not executable: chmod +x .claude/hooks/script.sh
# 2. Wrong path: use relative path from project root
# 3. Missing jq: apt install jq / brew install jq
# 4. Matcher doesn't match: check tool name exactly
```

### 4. Performance Issues

#### Slow Responses
```bash
# Check network latency
curl -o /dev/null -s -w "%{time_total}\n" https://api.anthropic.com/v1/messages

# Check proxy settings
echo $HTTP_PROXY $HTTPS_PROXY

# Fixes:
# 1. Use /compact to reduce context size
# 2. Switch to faster model: /model claude-haiku-4-5-20251001
# 3. Reduce max_turns for non-interactive mode
# 4. Check VPN/proxy configuration
```

#### High Memory Usage
```bash
# Check Node.js memory
node -e "console.log(process.memoryUsage())"

# Fix: Increase Node.js memory limit
export NODE_OPTIONS="--max-old-space-size=4096"
```

#### Context Window Full
```
/compact                    # Compress conversation
/clear                      # Nuclear option: full reset
```

### 5. Installation Issues

#### npm Install Fails
```bash
# Clear npm cache
npm cache clean --force

# Try with specific Node version
nvm use 20
npm install -g @anthropic-ai/claude-code

# Permission fix (Linux/Mac)
npm install -g @anthropic-ai/claude-code --unsafe-perm

# Alternative: use npx
npx @anthropic-ai/claude-code
```

#### Version Mismatch
```bash
# Check version
claude --version

# Update
npm update -g @anthropic-ai/claude-code

# Or reinstall
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code
```

### 6. Git-Related Issues

#### "Not a git repository"
```bash
# Initialize git if needed
git init

# Claude Code works without git but some features depend on it
```

#### Permission Denied for Git Operations
```bash
# Check git config
git config --list

# Fix SSH issues
ssh -T git@github.com

# Fix HTTPS auth
gh auth login
```

### 7. Plugin Issues

#### Plugin Not Loading
```bash
# Check plugin manifest
cat plugins/my-plugin/.claude-plugin/plugin.json | python3 -m json.tool

# Check plugin is registered
cat .claude/registry/plugins.index.json | python3 -m json.tool

# Common fixes:
# 1. Invalid JSON in plugin.json
# 2. Missing required fields (name, version)
# 3. Path references don't match actual files
```

## Debugging Checklist

### Quick Debug Flow
```
1. What's the error message? (exact text)
2. When does it happen? (on start, during tool use, on commit)
3. Is it reproducible? (every time, intermittent)
4. What changed recently? (new config, update, new MCP server)

Then:
5. Run /doctor
6. Run with --verbose
7. Check lessons-learned.md for known issues
8. Check settings.json for misconfigurations
9. Check .mcp.json for server issues
10. Check hook scripts for errors
```

### Environment Debug
```bash
# Full environment check
echo "Node: $(node --version)"
echo "npm: $(npm --version)"
echo "Claude: $(claude --version 2>/dev/null || echo 'not found')"
echo "git: $(git --version)"
echo "OS: $(uname -a)"
echo "API Key: ${ANTHROPIC_API_KEY:+set (${#ANTHROPIC_API_KEY} chars)}"
echo "Bedrock: ${CLAUDE_CODE_USE_BEDROCK:-not set}"
echo "Vertex: ${CLAUDE_CODE_USE_VERTEX:-not set}"
echo "Proxy: ${HTTP_PROXY:-not set}"
```

### Reset Everything
```bash
# Nuclear reset (last resort)
# 1. Clear Claude Code cache
rm -rf ~/.claude/cache/

# 2. Reinstall
npm uninstall -g @anthropic-ai/claude-code
npm install -g @anthropic-ai/claude-code

# 3. Verify
claude --version
claude /doctor
```

## Self-Healing Protocol

When errors occur in Claude Code:

1. **PostToolUse hook captures error** → appends to `lessons-learned.md`
2. **Claude reads the error** → identifies root cause
3. **Claude fixes the issue** → applies the fix
4. **Claude documents** → updates lessons-learned entry:
   - Status: NEEDS_FIX → RESOLVED
   - Adds Fix description
   - Adds Prevention strategy
5. **Next session** → Claude reads lessons-learned.md and avoids repeating the mistake

### Manually Capturing Issues
```bash
# Add to lessons-learned.md
cat >> .claude/rules/lessons-learned.md << 'EOF'

### Error: Description of what went wrong
- **Tool:** ToolName
- **Status:** RESOLVED
- **Fix:** What fixed it
- **Prevention:** How to avoid it
EOF
```

## Log Collection

```bash
# Claude Code debug logs
claude --verbose 2>&1 | tee claude-debug.log

# MCP server logs
# Check server-specific log locations

# System logs
journalctl -u claude-code --since "1 hour ago" 2>/dev/null

# Node.js trace
NODE_DEBUG=* claude --verbose 2>&1 | head -100
```
