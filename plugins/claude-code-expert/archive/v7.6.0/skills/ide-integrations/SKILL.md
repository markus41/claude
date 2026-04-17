# Claude Code IDE Integrations

Complete guide to using Claude Code with VS Code, JetBrains, and terminal editors.

## VS Code Extension

### Installation
1. Open VS Code Extensions (Ctrl+Shift+X / Cmd+Shift+X)
2. Search for "Claude Code"
3. Install the official Anthropic extension
4. Or: `code --install-extension anthropic.claude-code`

### Features
- **Inline chat** — Ask Claude about selected code
- **Terminal integration** — Claude Code runs in VS Code terminal
- **File context** — Automatically shares open file context
- **Diff view** — Shows proposed changes as diffs
- **Status bar** — Shows Claude Code status and costs

### Key Bindings (VS Code)
| Shortcut | Action |
|----------|--------|
| `Ctrl+Shift+P` → "Claude" | Command palette actions |
| Select code → right-click → "Ask Claude" | Ask about selection |

### VS Code Settings
```json
// .vscode/settings.json
{
  "claude-code.model": "claude-sonnet-4-6",
  "claude-code.autoStart": false,
  "claude-code.terminal.fontSize": 14
}
```

### Status Line Configuration
The status line shows at the bottom of the Claude Code terminal:

```json
// settings.json
{
  "statusLine": {
    "enabled": true,
    "show": ["model", "cost", "context"]
  }
}
```

## JetBrains Plugin

### Installation
1. Open Settings → Plugins
2. Search "Claude Code" in Marketplace
3. Install and restart IDE

### Supported IDEs
- IntelliJ IDEA
- PyCharm
- WebStorm
- GoLand
- Rider
- PhpStorm
- RubyMine
- CLion
- DataGrip

### Features
- Terminal-based Claude Code integration
- File context sharing
- Code selection queries
- Project structure awareness

## Terminal Usage

### Supported Terminals
- macOS Terminal
- iTerm2
- Alacritty
- Kitty
- Windows Terminal
- Warp
- Hyper

### Terminal Tips

```bash
# Start Claude Code
claude

# Start with specific project
cd /path/to/project && claude

# Use with tmux
tmux new-session -s claude
claude

# Use with screen
screen -S claude
claude
```

### Terminal Configuration

```bash
# Add to .bashrc or .zshrc

# Alias for quick access
alias cc="claude"
alias ccp="claude -p"

# Function for pipe usage
ccr() {
  cat "$1" | claude -p "review this code"
}

# Function for quick questions
ccq() {
  claude -p "$*"
}
```

## Multi-Directory Support

```bash
# Add additional directories to Claude's context
claude --add-dir /path/to/related/project
claude --add-dir /path/to/shared/libs

# Multiple directories
claude --add-dir ./frontend --add-dir ./backend --add-dir ./shared
```

## Remote Development

### SSH
```bash
# Claude Code works over SSH
ssh user@remote-server
claude
```

### Docker
```bash
# Run Claude Code in Docker
docker run -it -v $(pwd):/workspace -w /workspace \
  -e ANTHROPIC_API_KEY=$ANTHROPIC_API_KEY \
  node:20 npx @anthropic-ai/claude-code
```

### GitHub Codespaces
Claude Code works in Codespaces with terminal access.

### VS Code Remote
Works with VS Code Remote SSH, Containers, and WSL extensions.

## CI/CD Integration

### GitHub Actions
```yaml
name: Claude Code Review
on: [pull_request]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm install -g @anthropic-ai/claude-code
      - run: |
          claude -p "Review the changes in this PR for bugs and improvements" \
            --output-format json \
            --max-turns 10 \
            --dangerously-skip-permissions
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
```

### GitLab CI
```yaml
claude-review:
  image: node:20
  script:
    - npm install -g @anthropic-ai/claude-code
    - claude -p "Review this merge request" --output-format json --max-turns 10 --dangerously-skip-permissions
  variables:
    ANTHROPIC_API_KEY: $ANTHROPIC_API_KEY
```

## Vim/Neovim Integration

Claude Code can be used alongside Vim/Neovim via terminal split:

```bash
# In a terminal split, run Claude Code
# It can edit files that Vim also has open
# Use :e! in Vim to reload after Claude makes changes
```

### Neovim Plugin Ecosystem
Some community plugins provide Claude Code integration for Neovim.

## Troubleshooting IDE Issues

### VS Code Extension Not Loading
1. Check VS Code version (requires 1.80+)
2. Ensure Claude Code CLI is installed globally
3. Check Output panel → "Claude Code" channel for errors
4. Restart VS Code

### Terminal Not Rendering Properly
1. Ensure terminal supports Unicode
2. Check TERM environment variable
3. Try `export TERM=xterm-256color`
4. Increase terminal font size

### Permission Issues in IDE
1. Check `.claude/settings.json` permissions config
2. Ensure IDE terminal has access to shell profile
3. Check proxy settings if behind firewall
