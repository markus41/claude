# Checkpointing

> Track, rewind, and summarize Claude's edits and conversation to manage session state.
> Built-in feature — no configuration required.

## Overview

Claude Code automatically tracks file edits as you work, allowing you to quickly undo changes and rewind to previous states. This safety net lets you pursue ambitious, wide-scale tasks knowing you can always return to a prior code state.

## How Checkpoints Work

### Automatic Tracking
- Every user prompt creates a new checkpoint
- Checkpoints persist across sessions (available in resumed conversations)
- Auto-cleaned after 30 days (configurable)
- Tracks all changes made by Claude's file editing tools

### Rewind Menu

Open with `Esc` + `Esc` (double-press) or `/rewind` command.

Scrollable list shows each prompt from the session. Select a point and choose an action:

| Action | Effect |
|:-------|:-------|
| **Restore code and conversation** | Revert both code and conversation to that point |
| **Restore conversation** | Rewind to that message, keep current code |
| **Restore code** | Revert file changes, keep conversation |
| **Summarize from here** | Compress conversation from this point forward |
| **Never mind** | Cancel, return to message list |

After restoring conversation or summarizing, the original prompt is restored into the input field for re-sending or editing.

### Restore vs Summarize

**Restore** (3 options) — reverts state: undoes code changes, conversation history, or both.

**Summarize from here** — different behavior:
- Messages before selected point stay intact
- Selected message and all subsequent → replaced with compact AI summary
- No files on disk changed
- Original messages preserved in transcript (Claude can reference details)
- Like targeted `/compact` — keep early context in full, compress what's using space
- Optional instructions to guide summary focus

Use summarize to free context space. Use fork (`claude --continue --fork-session`) to branch and try a different approach while keeping original session.

## Common Use Cases

- **Exploring alternatives**: Try different implementations without losing starting point
- **Recovering from mistakes**: Quickly undo changes that broke functionality
- **Iterating on features**: Experiment with variations, revert to working states
- **Freeing context space**: Summarize verbose debugging sessions from midpoint forward

## Pipeline and Build Integration

Checkpointing is valuable during CI/CD workflows:

### Failed Build Recovery
When a build fix attempt makes things worse, rewind to the pre-fix state and try a different approach.

### Iterative Debugging
Checkpoint before each debugging hypothesis. If approach A fails, rewind and try approach B without residual changes.

### Safe Refactoring
Make sweeping changes with confidence — rewind instantly if tests fail.

## Limitations

### Bash Commands Not Tracked
Files modified by bash commands (`rm`, `mv`, `cp`) are NOT tracked. Only direct file edits through Claude's editing tools.

### External Changes Not Tracked
Manual changes outside Claude Code and edits from other concurrent sessions are normally not captured (unless they modify same files as current session).

### Not a Version Control Replacement
- Use Git for commits, branches, long-term history
- Think of checkpoints as "local undo" and Git as "permanent history"
- Checkpoints complement but don't replace Git

## See Also

- [Interactive Mode](https://code.claude.com/docs/en/interactive-mode) — Keyboard shortcuts and session controls
- [Built-in Commands](https://code.claude.com/docs/en/commands) — `/rewind` command reference
- [CLI Reference](https://code.claude.com/docs/en/cli-reference) — Command-line options
