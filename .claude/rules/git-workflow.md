# Git Workflow Rules

- Commit messages: imperative mood, max 72 chars for subject
- Format: `type(scope): description` (feat, fix, refactor, test, docs, chore)
- Always `git add` specific files, never `git add -A` or `git add .`
- Never force push to main/master
- Never amend published commits unless explicitly asked
- Run tests before committing
- Never commit .env files, credentials, or secrets
- After `git rm`, use `git add -u` or commit directly — don't re-add deleted files (`git add <path>` fails with "pathspec did not match")
- If `git push` is rejected (non-fast-forward), run `git stash && git pull --rebase origin <branch> && git stash pop` before retrying. Graduated from 2 RESOLVED lessons on 2026-04-17.
- Grep exit-1 (zero matches) is a normal signal, not an error. In shell pipelines, append `|| true` when it's OK to have no matches, or use `set +e` locally.
