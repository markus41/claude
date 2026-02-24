# Operator-Facing Remediation Format

Use this canonical remediation envelope for all command failures.

```json
{
  "status": "failed",
  "code": "TVS_CLI_EXECUTION_FAILED",
  "message": "Fabric deployment phase failed at notebook publish step.",
  "command": "tvs:deploy-fabric",
  "planId": "PLAN-TAIA-001",
  "entity": "taia",
  "tenant": "taia-prod",
  "severity": "error",
  "retryable": true,
  "remediation": {
    "summary": "Rerun notebook deployment with strict validation after fixing workspace permissions.",
    "actions": [
      "Run /tvs:status-check --entity taia --tenant taia-prod --plan-id PLAN-TAIA-001",
      "Validate Fabric workspace roles for deployment principal",
      "Re-run /tvs:deploy-fabric with --strict --dry-run",
      "Execute full run after dry-run passes"
    ],
    "escalation": "If still failing, attach --export-json artifact and open platform incident with planId."
  }
}
```
