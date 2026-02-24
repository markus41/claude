# Hook Prompt Guidance

## team-accelerator
- `security-check`: Validate secrets handling, injection/XSS exposure, and input validation.
- `formatting-check`: Confirm lint/format/type expectations for edited files.
- `deployment-followup`: For deploy-related shell commands, remind on notification, verification, and runbook logging.
- `docs-impact-check`: For source edits, identify required API/docs/knowledge-base updates.
- `session-summary`: Summarize test outcomes, quality changes, and recommended follow-up.

## ahling-command-center
- `acc-predeploy-check`: Before Docker/deploy commands, verify daemon/network/secrets and suggest `acc-init` when prerequisites are missing.
- `acc-postdeploy-check`: After Docker/deploy commands, suggest health, logs, and resource verification.
