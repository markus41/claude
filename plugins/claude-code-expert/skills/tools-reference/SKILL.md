# Claude Code Tools Reference

Complete reference for every built-in tool available in Claude Code.

## File Tools

### Read
Read file contents from the filesystem.
```
Parameters:
  file_path: string (required) — Absolute path to file
  offset: number (optional) — Start line number
  limit: number (optional) — Number of lines to read
  pages: string (optional) — Page range for PDFs (e.g., "1-5")

Capabilities:
  - Text files with line numbers (cat -n format)
  - Image files (PNG, JPG, etc.) — rendered visually
  - PDF files — max 20 pages per request
  - Jupyter notebooks (.ipynb) — all cells with outputs
  - Lines >2000 chars are truncated
  - Default: up to 2000 lines from start
  - Max token limit: 25000 tokens per read
```

### Write
Create or overwrite files.
```
Parameters:
  file_path: string (required) — Absolute path
  content: string (required) — File content

Rules:
  - Overwrites existing files
  - Must Read file first before overwriting existing files
  - Prefer Edit for modifications to existing files
  - Never create documentation files unless explicitly requested
```

### Edit
Make targeted string replacements in files.
```
Parameters:
  file_path: string (required) — Absolute path
  old_string: string (required) — Text to find
  new_string: string (required) — Replacement text
  replace_all: boolean (optional, default: false) — Replace all occurrences

Rules:
  - Must Read file first
  - old_string must be unique in file (or use replace_all)
  - Preserves exact indentation from file
  - Never include line number prefixes in old_string/new_string
```

### Glob
Find files by pattern matching.
```
Parameters:
  pattern: string (required) — Glob pattern (e.g., "**/*.ts")
  path: string (optional) — Directory to search in

Patterns:
  - "**/*.ts" — All TypeScript files recursively
  - "src/**/*.test.ts" — Test files in src
  - "*.json" — JSON files in current directory
  - "{src,lib}/**/*.{ts,tsx}" — Multiple patterns

Returns: File paths sorted by modification time
```

### Grep
Search file contents with regex (powered by ripgrep).
```
Parameters:
  pattern: string (required) — Regex pattern
  path: string (optional) — File/directory to search
  glob: string (optional) — Glob filter for files
  type: string (optional) — File type filter (js, py, etc.)
  output_mode: "files_with_matches" | "content" | "count"
  -A: number — Lines after match
  -B: number — Lines before match
  -C / context: number — Lines around match
  -i: boolean — Case insensitive
  -n: boolean — Show line numbers (default: true)
  multiline: boolean — Enable multiline matching
  head_limit: number — Limit output lines
  offset: number — Skip first N entries

Notes:
  - Uses ripgrep syntax (not grep)
  - Escape literal braces: interface\{\}
  - Default output_mode: files_with_matches
```

## Shell Tools

### Bash
Execute shell commands.
```
Parameters:
  command: string (required) — The command to execute
  description: string (required) — What the command does
  timeout: number (optional) — Timeout in ms (max 600000 / 10 min)
  run_in_background: boolean (optional) — Run async
  dangerouslyDisableSandbox: boolean (optional) — Disable sandbox

Rules:
  - Working directory persists between calls
  - Shell state (variables, aliases) does NOT persist
  - Always quote paths with spaces
  - Use absolute paths when possible
  - Prefer dedicated tools over bash equivalents
  - Use && to chain dependent commands
  - Use ; when order matters but failure doesn't
  - Never use -i flag (interactive) with git
```

## Web Tools

### WebFetch
Fetch and analyze web content.
```
Parameters:
  url: string (required) — URL to fetch
  prompt: string (required) — What to extract

Notes:
  - Auto-upgrades HTTP to HTTPS
  - Converts HTML to markdown
  - Summarizes large content
  - 15-minute cache
  - For GitHub URLs, prefer gh CLI
```

### WebSearch
Search the web.
```
Parameters:
  query: string (required) — Search query
  allowed_domains: string[] (optional) — Domain whitelist
  blocked_domains: string[] (optional) — Domain blocklist

Notes:
  - Returns search results with URLs
  - Must include Sources section in response
  - US-only availability
```

## Agent Tools

### Agent
Spawn specialized sub-agents.
```
Parameters:
  prompt: string (required) — Task description
  subagent_type: string (required) — Agent specialization
  description: string (required) — 3-5 word summary
  run_in_background: boolean (optional) — Async execution
  isolation: "worktree" (optional) — Git worktree isolation
  mode: string (optional) — Permission mode
  resume: string (optional) — Resume previous agent by ID
  name: string (optional) — Agent name

Returns: Agent result text (not visible to user automatically)
```

### TodoWrite
Track tasks and progress.
```
Parameters:
  todos: array (required) — Todo items
    - content: string — Task description (imperative)
    - status: "pending" | "in_progress" | "completed"
    - activeForm: string — Present continuous form

Rules:
  - Only one task in_progress at a time
  - Mark complete immediately after finishing
  - Use for 3+ step tasks
  - Don't use for single trivial tasks
```

## Notebook Tools

### NotebookEdit
Edit Jupyter notebook cells.
```
Parameters:
  notebook_path: string (required) — Absolute path to .ipynb
  new_source: string (required) — New cell content
  cell_id: string (optional) — Cell ID to edit
  cell_type: "code" | "markdown" (optional)
  edit_mode: "replace" | "insert" | "delete" (optional)

Notes:
  - cell_number is 0-indexed
  - insert adds after specified cell
  - Must specify cell_type for insert
```

## Interactive Tools

### AskUserQuestion
Ask the user questions during execution.
```
Parameters:
  questions: array (required, 1-4 items)
    - question: string — The question text
    - header: string — Short label (max 12 chars)
    - options: array (2-4 items)
      - label: string — Display text
      - description: string — Explanation
      - preview: string (optional) — Preview content
    - multiSelect: boolean — Allow multiple selections

Notes:
  - Users can always select "Other" for custom input
  - Use for gathering preferences, not plan approval
  - In plan mode, use ExitPlanMode for plan approval
```

### Skill
Invoke slash commands.
```
Parameters:
  skill: string (required) — Skill name (e.g., "commit")
  args: string (optional) — Arguments

Notes:
  - Only for skills listed in user-invocable skills
  - Don't guess skill names
  - Don't use for built-in CLI commands
```

## Tool Best Practices

1. **Prefer dedicated tools** — Use Read instead of `cat`, Edit instead of `sed`
2. **Read before editing** — Always Read a file before Edit or Write
3. **Parallel calls** — Make independent tool calls in the same message
4. **Sequential dependencies** — Wait for results before dependent calls
5. **Glob before Read** — Find files first, then read specific ones
6. **Agent for research** — Use agents to keep main context clean
7. **Background for long tasks** — Use `run_in_background` for slow operations
