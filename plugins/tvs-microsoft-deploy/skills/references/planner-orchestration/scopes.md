# Scope requirements

| Scope / Role | Why it is needed |
|---|---|
| `Tasks.ReadWrite (delegated)` | Required to execute privileged operations safely. |
| `Group.ReadWrite.All (delegated/app for group context)` | Required to execute privileged operations safely. |
| `User.ReadBasic.All for assignee resolution` | Required to execute privileged operations safely. |
| `offline_access for long-running automation` | Required to execute privileged operations safely. |
