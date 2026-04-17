---
description: Computer use and GUI automation patterns — when to use GUI automation vs shell/MCP/browser tools, visual validation techniques, native app testing, and guardrails for visual regression workflows
model: claude-opus-4-7
allowed-tools:
  - Bash
  - Read
---

# Computer Use & GUI Automation

Computer use lets Claude interact with GUIs: click buttons, fill forms, take screenshots, and navigate native apps. This is powerful but expensive and slow — use it only when a more precise tool doesn't exist.

## Tool Selection Priority

Before reaching for computer use, exhaust these options first:

| Task | Prefer This | Over Computer Use |
|------|------------|-------------------|
| API endpoint testing | Bash + curl | Clicking through UI |
| Database inspection | MCP postgres/sqlite | Navigating admin UI |
| File operations | Read/Write/Edit | Drag-and-drop UI |
| Web scraping | Firecrawl MCP | Screenshot + parse |
| Browser automation | Playwright MCP | Computer use click |
| CI status | GitHub API / gh CLI | Browser navigation |
| Log inspection | Bash + grep | Terminal screenshot |

**Rule:** If you can express the task as a shell command or API call, do that. Computer use is the fallback for GUI-only workflows.

---

## When Computer Use Is the Right Choice

### 1. Native App Validation
Testing a desktop app that has no API or CLI interface.

```
# Example: Validate Electron app UI after a build
Take a screenshot of the app after launch.
Click the "New Project" button.
Verify the dialog opens with the correct fields.
Fill in project name: "Test Project 2026"
Click Create and verify the project appears in the list.
```

### 2. Visual Regression Checks
Detecting layout regressions that unit tests can't catch.

```
# Workflow:
1. Take baseline screenshot of the current UI state
2. Apply the change
3. Take comparison screenshot
4. Highlight pixel differences > 1%
5. Human reviews diff
```

### 3. GUI-Only Admin Tools
Admin panels, legacy enterprise software, and embedded UIs with no API.

```
# Example: Generate a report from a legacy admin panel
Navigate to: http://admin.internal/reports
Click: "Export" → "CSV" → "Last 30 days"
Wait for download
Move file to: /tmp/report-{date}.csv
```

### 4. Local Simulator Flows
Mobile simulator or desktop app testing that requires visual interaction.

```
# Example: iOS simulator validation
Launch: xcrun simctl launch booted com.example.MyApp
Take screenshot
Verify: "Welcome" text is visible in the header
Tap: "Get Started" button (coordinates or element description)
Verify: onboarding screen loads
```

---

## Result Verification

Computer use output is inherently visual and unstructured. Always verify results with a structured check after GUI actions:

### Verification Pattern
```
After each GUI action:
1. Take a screenshot
2. Verify the expected visual state (specific text, element position, color)
3. If verification fails: log "FAIL: {what was expected vs. what was seen}"
4. If unsure: take another screenshot from a wider viewport

At the end:
- List each action and its verification result
- Count: {N} actions taken, {M} verified OK, {K} failed
```

### Confidence Levels
| Confidence | Verification | Action |
|------------|-------------|--------|
| HIGH | Text matches exactly / element found by ID | Proceed |
| MEDIUM | Visual match but element found by position | Log and proceed |
| LOW | Can't find element / ambiguous screenshot | Stop, report to human |

---

## Safety Guardrails

Computer use can cause irreversible actions (delete files, send emails, submit forms). Apply these guardrails:

### Never Without Confirmation
- Form submissions in production environments
- Delete or "Archive" actions
- Payment or billing interactions
- Sending emails or messages
- Anything involving real user data

### Screenshot Audit Trail
Keep screenshots of:
- State before any action
- State after each major action
- Final state

### Dry-Run First
For complex GUI flows, describe the steps and ask for confirmation before executing:
```
Before I click "Submit", here's what will happen:
- Form data: {summary}
- This action cannot be undone
- Proceeding? (yes/no)
```

---

## Computer Use vs. Playwright MCP

For web UIs, Playwright MCP is almost always better than computer use:

| | Playwright MCP | Computer Use |
|--|---------------|-------------|
| Reliability | High (DOM-based) | Medium (pixel-based) |
| Speed | Fast | Slow (screenshot per action) |
| Testability | Scriptable, repeatable | Hard to reproduce exactly |
| Cost | Low | High (vision model per screenshot) |
| Works on | Web browsers | Any visual surface |

**Use Playwright MCP for:** Web app testing, scraping, form automation on websites.

**Use Computer Use for:** Native desktop apps, embedded UIs, legacy apps with no API.

---

## Cost Awareness

Computer use is expensive:
- Each screenshot = vision model inference (high token cost)
- A 10-step GUI flow = 10+ vision inferences
- Compare: a 10-step shell script = near-zero cost

**Estimate before using:** If a GUI flow has N steps, expect N × (screenshot tokens + generation tokens). For flows > 20 steps, consider whether a shell/API approach exists.

---

## Runtime Availability

Computer use is available in both the Desktop app and the CLI (v2.1.86+).

```
CLI:     ✅ Computer use available (v2.1.86+, research preview)
Web:     ❌ Computer use not available
Desktop: ✅ Computer use available
```

### Enabling in the CLI

Run `/mcp` inside Claude Code, find `computer-use`, and toggle it on. The MCP server handles screen capture and input simulation. Then ask Claude to interact with the desktop:

```
> Open the iOS simulator, tap through onboarding, and screenshot each step
```

### Enabling in the Desktop App

Open **Settings → Computer use** and enable the toggle. Grant OS-level permissions when prompted (screen recording, accessibility).

---

## PowerShell Tool (Windows)

On Windows, Claude Code has a native **PowerShell tool** alongside Bash (preview, v2.1.84+). Use it for cmdlets, object pipelines, and Windows-native paths without translating through Git Bash.

Enable in settings:
```json
{
  "env": {
    "CLAUDE_CODE_USE_POWERSHELL_TOOL": "1"
  }
}
```

The PowerShell tool is distinct from computer use but relevant when automating Windows-native workflows. Prefer it over Bash for:
- Registry operations (`Get-ItemProperty HKLM:\...`)
- Windows service management (`Get-Service`, `Start-Service`)
- Paths with backslashes and drive letters
- Module-based tooling (`Import-Module`, `Install-Module`)
