---
description: "draw.io desktop app integration for Claude Code — OS detection, editor paths, CLI export, file watching, and iterative AI+human workflows"
triggers:
  - drawio desktop
  - draw.io desktop
  - open diagram
  - desktop editor
  - drawio electron
  - drawio app
  - visual editor
globs:
  - "**/*.drawio"
  - "**/*.drawio.svg"
  - "**/*.drawio.png"
---

# draw.io Desktop Integration

## Overview

This skill covers the integration between Claude Code (running on desktop) and
the draw.io desktop application (Electron-based). It enables a seamless workflow
where the AI generates/edits diagram XML and the user visually refines it in the
desktop editor.

## Platform Detection

### OS Detection Logic

```bash
detect_platform() {
    local os="$(uname -s 2>/dev/null || echo unknown)"
    case "$os" in
        Darwin)                    echo "macos" ;;
        Linux)
            # Check if running in WSL
            if grep -qi microsoft /proc/version 2>/dev/null; then
                echo "wsl"
            else
                echo "linux"
            fi
            ;;
        MINGW*|MSYS*|CYGWIN*)     echo "windows" ;;
        *)
            # Fallback: check for Windows env vars
            if [[ -n "${USERPROFILE:-}" ]]; then
                echo "windows"
            else
                echo "unknown"
            fi
            ;;
    esac
}
```

### draw.io Executable Locations

| Platform | Common Paths |
|----------|-------------|
| **macOS** | `/Applications/draw.io.app/Contents/MacOS/draw.io` |
| | `~/Applications/draw.io.app/Contents/MacOS/draw.io` |
| **Linux** | `/usr/bin/drawio` (apt/deb) |
| | `/snap/bin/drawio` (snap) |
| | `/opt/drawio/drawio` (manual) |
| | `~/.local/bin/drawio` (user install) |
| | Flatpak: `flatpak run com.jgraph.drawio.desktop` |
| **Windows** | `%LOCALAPPDATA%\Programs\draw.io\draw.io.exe` |
| | `%PROGRAMFILES%\draw.io\draw.io.exe` |
| **WSL** | `/mnt/c/Program Files/draw.io/draw.io.exe` |
| | `/mnt/c/Users/<user>/AppData/Local/Programs/draw.io/draw.io.exe` |

### Detection Priority

1. Check `DRAWIO_EDITOR_PATH` environment variable (user override)
2. Check `PATH` with `command -v drawio`
3. Check platform-specific common paths
4. Check for MCP Tool Server (`@drawio/mcp`) as alternative opener
5. Fall back to browser (`https://app.diagrams.net`)

## draw.io Desktop CLI Reference

The draw.io desktop app supports command-line operations:

### Export Commands

```bash
# Export to SVG
drawio --export --format svg input.drawio -o output.svg

# Export to PNG with 2x scale (retina)
drawio --export --format png --scale 2 input.drawio -o output.png

# Export to PDF
drawio --export --format pdf input.drawio -o output.pdf

# Export with embedded diagram XML (re-editable)
drawio --export --format svg --embed-diagram input.drawio -o output.drawio.svg

# Export specific page (0-indexed)
drawio --export --format svg --page-index 2 input.drawio -o page3.svg

# Export with transparent background
drawio --export --format png --transparent input.drawio -o output.png

# Export with border padding
drawio --export --format png --border 10 input.drawio -o output.png

# Export cropped to content
drawio --export --format svg --crop input.drawio -o output.svg

# Export all pages
drawio --export --format png --all-pages input.drawio -o output.png
```

### Headless Export (Linux CI/CD)

When no display is available (SSH, Docker, CI), use `xvfb-run`:

```bash
# Install xvfb
sudo apt-get install -y xvfb

# Export with virtual framebuffer
xvfb-run -a drawio --export --format svg input.drawio -o output.svg

# Batch export all diagrams
for f in docs/*.drawio; do
    xvfb-run -a drawio --export --format svg --embed-diagram "$f" \
        -o "${f%.drawio}.drawio.svg"
done
```

### Version Check

```bash
drawio --version
# Example output: 24.7.17
```

## Desktop Workflows

### Workflow 1: AI Creates → User Refines

```
Claude Code                         draw.io Desktop
─────────────                       ───────────────
1. drawio:create --output arch.drawio
   ↓ writes XML file
2. drawio:open --file arch.drawio
   ↓ launches desktop app ──────→   3. User sees diagram
                                    4. User drags/resizes/adds
                                    5. User saves (Ctrl+S)
   ↓ detects file change
6. Read the updated XML
7. drawio:enrich --level 2 arch.drawio
   ↓ writes enriched XML ───────→   8. Desktop auto-reloads
```

### Workflow 2: User Designs → AI Exports

```
draw.io Desktop                     Claude Code
───────────────                     ─────────────
1. User creates diagram visually
2. User saves as project.drawio
                                    3. drawio:analyze project.drawio
                                       → quality report
                                    4. drawio:export --format svg
                                       --embed-diagram
                                    5. drawio:embed --platform github
```

### Workflow 3: Side-by-Side Editing

```
Claude Code (terminal)              draw.io Desktop (window)
──────────────────────              ────────────────────────
1. drawio:edit --add-vertex         Auto-reload shows new shape
   "Auth Service"
2. drawio:edit --connect-to         Auto-reload shows connection
   "auth-svc" "api-gw"
3. drawio:style --preset dark       Auto-reload shows dark theme
```

### Workflow 4: WSL Integration

When running Claude Code in WSL but want to use Windows draw.io:

```bash
# Convert WSL path to Windows path
WINPATH=$(wslpath -w "$PWD/docs/architecture.drawio")

# Open in Windows draw.io
"/mnt/c/Program Files/draw.io/draw.io.exe" "$WINPATH" &

# Or use Windows file association
cmd.exe /C "start \"\" \"$WINPATH\"" 2>/dev/null
```

## Installation Guides

### macOS

```bash
# Homebrew (recommended)
brew install --cask drawio

# Verify
/Applications/draw.io.app/Contents/MacOS/draw.io --version
```

### Ubuntu/Debian

```bash
# Snap (auto-updates)
sudo snap install drawio

# Or .deb package
DRAWIO_VERSION="24.7.17"
wget "https://github.com/jgraph/drawio-desktop/releases/download/v${DRAWIO_VERSION}/drawio-amd64-${DRAWIO_VERSION}.deb"
sudo dpkg -i "drawio-amd64-${DRAWIO_VERSION}.deb"
sudo apt-get install -f  # fix dependencies if needed

# Verify
drawio --version
```

### Fedora/RHEL

```bash
# Snap
sudo dnf install snapd
sudo snap install drawio

# Or Flatpak
flatpak install flathub com.jgraph.drawio.desktop
```

### Windows

```powershell
# Winget (recommended)
winget install JGraph.Draw

# Chocolatey
choco install drawio

# Verify
& "$env:LOCALAPPDATA\Programs\draw.io\draw.io.exe" --version
```

### Arch Linux

```bash
# AUR
yay -S drawio-desktop-bin
```

## MCP + Desktop Combined Setup

For the richest desktop experience, combine the MCP Tool Server with desktop app:

### Claude Code (.mcp.json)

```json
{
  "mcpServers": {
    "drawio": {
      "command": "npx",
      "args": ["@drawio/mcp"],
      "env": {
        "DRAWIO_EDITOR_PATH": "/usr/bin/drawio"
      }
    }
  }
}
```

The MCP Tool Server's `open_diagram` tool will use the configured editor path.

### Claude Desktop (claude_desktop_config.json)

```json
{
  "mcpServers": {
    "drawio-app": {
      "url": "https://mcp.draw.io/mcp"
    },
    "drawio-tool": {
      "command": "npx",
      "args": ["@drawio/mcp"]
    }
  }
}
```

## File Watching

### Native File Watching with fswatch (macOS)

```bash
fswatch -o docs/architecture.drawio | while read _; do
    echo "[$(date '+%H:%M:%S')] Diagram changed — re-analyzing..."
    # Trigger re-analysis or export
done
```

### inotifywait (Linux)

```bash
inotifywait -m -e modify docs/architecture.drawio | while read _; do
    echo "[$(date '+%H:%M:%S')] Diagram changed"
done
```

### PowerShell (Windows)

```powershell
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "docs"
$watcher.Filter = "*.drawio"
$watcher.EnableRaisingEvents = $true
Register-ObjectEvent $watcher Changed -Action {
    Write-Host "Diagram changed at $(Get-Date -Format 'HH:mm:ss')"
}
```

## Auto-Reload Behavior

The draw.io desktop app monitors open files for external changes:

- **Default**: Prompts the user when an external change is detected
- **Setting**: `Extras → Edit Configuration` → add `"autoSave": true` for auto-reload
- **draw.io config file** (`.drawio.json` in user home):

```json
{
  "autoSave": true,
  "autoSaveDelay": 500
}
```

This enables the workflow where Claude Code edits XML → desktop app auto-reloads.

## Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DRAWIO_EDITOR_PATH` | Custom path to draw.io executable | `/opt/drawio/drawio` |
| `DRAWIO_EXPORT_FORMAT` | Default export format | `svg` |
| `DRAWIO_EXPORT_SCALE` | Default export scale | `2` |
| `DISPLAY` | X11 display (Linux, needed for GUI) | `:0` |
| `WAYLAND_DISPLAY` | Wayland display (Linux) | `wayland-0` |

## Troubleshooting

### "Cannot open display" (Linux)

```bash
# Check display
echo $DISPLAY
# If empty, set it
export DISPLAY=:0

# For Wayland
echo $WAYLAND_DISPLAY

# For headless export without display
xvfb-run -a drawio --export --format svg input.drawio -o output.svg
```

### "draw.io crashes on open" (Linux Snap)

```bash
# Snap needs connected interfaces
snap connections drawio
# If missing:
sudo snap connect drawio:removable-media
```

### File permissions (macOS)

```bash
# If macOS blocks the app
xattr -cr /Applications/draw.io.app
# Or allow in System Preferences → Security & Privacy
```

### WSL cannot open Windows apps

```bash
# Ensure interop is enabled
cat /proc/sys/fs/binfmt_misc/WSLInterop
# If missing, add to /etc/wsl.conf:
# [interop]
# enabled = true
```
