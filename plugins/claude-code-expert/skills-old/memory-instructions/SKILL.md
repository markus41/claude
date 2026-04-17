# Claude Code Memory & Instructions System

Complete guide to CLAUDE.md, project instructions, auto-memory, and rules.

## CLAUDE.md — Project Instructions

### Purpose
CLAUDE.md files contain natural-language instructions that Claude Code loads as system context. They tell Claude about your project's conventions, build commands, architecture, and preferences.

### Hierarchy (All Additive)

```
Enterprise/Managed CLAUDE.md     (highest priority, cannot be overridden)
  └── User ~/.claude/CLAUDE.md         (personal preferences, all projects)
      └── Project ./CLAUDE.md              (project conventions)
          └── Project ./.claude/CLAUDE.md       (additional project instructions)
              └── Local ./CLAUDE.local.md         (personal, gitignored)
                  └── Directory path/CLAUDE.md      (scoped to that directory)
```

All levels are loaded and combined. Lower levels cannot override enterprise settings.

### Additional Syntax
- `@path/file.md` — Import additional files into CLAUDE.md context
- Keep under 200 lines for optimal context cost

### What to Include

```markdown
# Project Instructions

## Build & Test Commands
- Install: `pnpm install`
- Dev: `pnpm dev`
- Build: `pnpm build`
- Test: `pnpm test`
- Single test: `pnpm test -- path/to/test.ts`
- Lint: `pnpm lint`
- Type check: `pnpm typecheck`

## Code Conventions
- Language: TypeScript strict mode
- Style: Prettier + ESLint
- Imports: Use absolute paths from `@/`
- Components: Functional React with hooks
- State: Zustand for global, React Query for server

## Architecture
- Monorepo: Turborepo with packages in `packages/`
- API: Next.js API routes in `src/app/api/`
- Database: PostgreSQL with Prisma ORM
- Auth: NextAuth.js with Keycloak provider
- Deployment: Kubernetes on AWS EKS

## Key Files
- `prisma/schema.prisma` — Database schema
- `src/lib/auth.ts` — Auth configuration
- `src/lib/db.ts` — Database client

## Important Context
- We use pnpm, never npm or yarn
- Always run tests before committing
- Follow conventional commits format
- Never commit .env files
```

### What NOT to Include
- Secrets or API keys
- User-specific paths (use `settings.local.json` instead)
- Temporary instructions (use conversation context)
- Overly detailed documentation (link to docs instead)

## Rules System

Rules in `.claude/rules/` are like scoped CLAUDE.md files.

### Global Rules (no frontmatter)
```markdown
# Git Rules
- Use conventional commits
- Never force push to main
```

### Path-Scoped Rules
```markdown
---
paths:
  - "**/*.ts"
  - "**/*.tsx"
---

# TypeScript Rules
- Use strict mode
- Prefer interfaces over type aliases for objects
- Max function length: 50 lines
```

### Rule File Organization
```
.claude/rules/
├── architecture.md      # Global — project structure
├── code-style.md        # Scoped — *.ts, *.tsx, *.js, *.jsx
├── docker-k8s.md        # Scoped — Dockerfiles, *.yaml
├── git-workflow.md      # Global — commit conventions
├── testing.md           # Scoped — *.test.*, *.spec.*
├── research.md          # Global — web research tools
├── self-healing.md      # Global — error capture protocol
└── lessons-learned.md   # Global — auto-growing error log
```

## Auto-Memory System

### How It Works
Claude Code automatically saves important discoveries and patterns to persistent memory files.

### Memory Location
```
~/.claude/projects/<project-hash>/memory/
├── MEMORY.md        # Auto-loaded into context (keep under 200 lines)
├── debugging.md     # Topic-specific notes
├── patterns.md      # Recurring patterns
└── architecture.md  # Architecture decisions
```

### MEMORY.md (Auto-Loaded)
```markdown
# Project Memory

## Build System
- Uses pnpm workspaces with Turborepo
- `pnpm -w` for root-level operations

## Database
- PostgreSQL on port 5433 (non-standard)
- Run `pnpm db:migrate` after schema changes

## User Preferences
- Always use bun for running scripts
- Prefers functional style over OOP
```

### What Gets Auto-Saved
- Stable patterns confirmed across interactions
- Key architectural decisions
- Important file paths
- User preferences for workflow
- Solutions to recurring problems

### What Does NOT Get Saved
- Session-specific context
- Unverified information
- Anything duplicating CLAUDE.md
- Speculative conclusions

### Manual Memory Commands
```
# User says:
"Remember that we always use bun, not npm"
→ Claude saves to MEMORY.md

"Forget the instruction about yarn"
→ Claude removes from MEMORY.md

"Always run lint before committing"
→ Claude saves preference

# Slash commands:
/memory              # View memories
/memory add <text>   # Add entry
/memory clear        # Clear all
```

### Disabling Auto-Memory
```bash
export DISABLE_AUTOMEMORY=1
```
or in settings.json:
```json
{ "autoMemory": false }
```

## Self-Healing Loop

The lessons-learned system creates a continuously improving knowledge base:

```
Tool call fails
  → PostToolUse hook captures error
  → Appends to .claude/rules/lessons-learned.md
  → Claude fixes the issue
  → Claude updates entry: Status → RESOLVED, adds Fix + Prevention
  → Next session loads lessons-learned.md as a rule
  → Claude doesn't repeat the mistake
```

### Lessons-Learned Format
```markdown
### Error: Git push rejected
- **Tool:** Bash
- **Status:** RESOLVED
- **Fix:** Use `git pull --rebase` before pushing
- **Prevention:** Always pull before push
```

## Settings Hierarchy

```
Enterprise managed settings     (cannot be overridden)
  └── User settings (~/.claude/settings.json)
      └── Project settings (.claude/settings.json)
          └── Local overrides (.claude/settings.local.json)
```

### Merge Behavior
- Arrays: concatenated (allow lists combine)
- Objects: deep merged (later values override)
- Primitives: later values override
- Enterprise settings: always win

## Best Practices

1. **Keep CLAUDE.md focused** — Build commands, conventions, architecture
2. **Use rules for enforcement** — Path-scoped rules for file-type conventions
3. **Let auto-memory learn** — Don't manually duplicate auto-saved info
4. **Review lessons-learned** — Promote patterns to permanent rules
5. **Scope rules narrowly** — Docker rules shouldn't load for TypeScript work
6. **Version control CLAUDE.md** — It's project documentation
7. **Gitignore settings.local.json** — Personal overrides stay local
