# Git Workflow Rules

- Commit messages: imperative mood, max 72 chars for subject
- Format: `type(scope): description` (feat, fix, refactor, test, docs, chore)
- Always `git add` specific files, never `git add -A` or `git add .`
- Never force push to main/master
- Never amend published commits unless explicitly asked
- Run tests before committing
- Never commit .env files, credentials, or secrets
