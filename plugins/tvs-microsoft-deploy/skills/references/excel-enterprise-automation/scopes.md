# Scope requirements

| Scope / Role | Why it is needed |
|---|---|
| `Files.ReadWrite.All (delegated/app)` | Required to execute privileged operations safely. |
| `Sites.ReadWrite.All when workbook in SharePoint` | Required to execute privileged operations safely. |
| `Workbook.ReadWrite.All where available` | Required to execute privileged operations safely. |
| `offline_access for unattended workflows` | Required to execute privileged operations safely. |
