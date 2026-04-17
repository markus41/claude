# Claude Code Git Integration

Complete guide to Git workflows and version control within Claude Code.

## Git Awareness

Claude Code automatically detects Git repositories and understands:
- Current branch and status
- Uncommitted changes (staged and unstaged)
- Recent commit history
- Remote tracking branches
- Merge conflicts

## Commit Workflow

### Claude's Commit Protocol
When asked to commit, Claude follows this exact workflow:

1. **Inspect state** (parallel):
   - `git status` — see untracked/modified files
   - `git diff` — see staged and unstaged changes
   - `git log --oneline -5` — recent commit style

2. **Draft commit message**:
   - Summarize the nature of changes
   - Use imperative mood: "Add feature" not "Added feature"
   - Follow project conventions

3. **Stage and commit** (parallel):
   - `git add <specific files>` — never `git add -A` or `git add .`
   - `git commit -m "message"` using heredoc for formatting
   - `git status` to verify

### Commit Message Format
```
type(scope): description

Optional body with more details.

https://claude.ai/code/session_xxx
```

Types: `feat`, `fix`, `refactor`, `test`, `docs`, `chore`, `style`, `perf`, `ci`

### What Claude Won't Do (Without Explicit Ask)
- Push to remote
- Amend published commits
- Force push
- Skip hooks (--no-verify)
- Create empty commits
- Commit .env or credential files

## Pull Request Workflow

### Creating PRs
When asked to create a PR, Claude:

1. **Analyzes all commits** on the branch (not just latest)
2. **Generates title** (< 70 chars)
3. **Generates body** with:
   - Summary (1-3 bullet points)
   - Test plan
   - Session link

```bash
gh pr create --title "feat: add user authentication" --body "$(cat <<'EOF'
## Summary
- Add JWT-based authentication middleware
- Create login/register API endpoints
- Add auth guards to protected routes

## Test plan
- [ ] Unit tests for auth middleware
- [ ] Integration tests for login/register
- [ ] E2E test for protected routes

https://claude.ai/code/session_xxx
EOF
)"
```

### PR Operations
```bash
# View PR
gh pr view 123

# View PR comments
gh api repos/owner/repo/pulls/123/comments

# View PR checks
gh pr checks 123

# Merge PR
gh pr merge 123

# Close PR
gh pr close 123
```

## Branch Management

```bash
# Create and checkout branch
git checkout -b feature/my-feature

# Push with upstream tracking
git push -u origin feature/my-feature

# Delete branch (local)
git branch -d feature/my-feature

# Delete branch (remote)
git push origin --delete feature/my-feature
```

## Conflict Resolution

Claude can help resolve merge conflicts:

```bash
# Start merge/rebase
git merge main
# or
git rebase main

# Claude reads conflict markers
# Claude resolves conflicts using Edit tool
# Claude stages resolved files
git add <resolved-file>
git merge --continue
# or
git rebase --continue
```

### Claude's Conflict Approach
- Investigate both sides of the conflict
- Understand intent of both changes
- Merge logically (not just pick one side)
- Test after resolution

## Git Safety Rules

Claude follows strict git safety:

1. **Never** force push to main/master
2. **Never** use `--no-verify` (investigate hook failures instead)
3. **Never** amend published commits without explicit request
4. **Never** use `-i` flag (interactive mode not supported)
5. **Never** discard uncommitted changes without confirmation
6. **Always** create new commits instead of amending
7. **Always** stage specific files (not `git add .`)
8. **Always** check for .env files before committing

## Stash Operations

```bash
# Stash changes
git stash

# Stash with message
git stash push -m "work in progress on auth"

# Apply and remove
git stash pop

# Apply but keep in stash
git stash apply

# List stashes
git stash list
```

## Log and History

```bash
# Recent commits
git log --oneline -10

# Commits by author
git log --author="name"

# Changes between branches
git log main..feature-branch

# Diff between branches
git diff main...HEAD

# File history
git log --follow -p -- path/to/file
```

## Common Git Patterns in Claude Code

### Pre-commit Workflow
```
1. Make changes
2. Run tests: npm test
3. Run linter: npm run lint
4. Stage files: git add specific-files
5. Commit with message
```

### Rebase Workflow
```bash
# Update feature branch with main
git fetch origin main
git rebase origin/main

# If conflicts:
# Resolve → git add → git rebase --continue
```

### Cherry Pick
```bash
git cherry-pick <commit-sha>
```

### Reset (with caution)
```bash
# Soft reset (keep changes staged)
git reset --soft HEAD~1

# Mixed reset (keep changes unstaged)
git reset HEAD~1

# Hard reset (DESTRUCTIVE - Claude confirms first)
git reset --hard HEAD~1
```
