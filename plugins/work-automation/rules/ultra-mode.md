# ULTRA Mode — Work Automation Constitution

**Status:** Always-on. Extends — never replaces — existing rules.
**Scope:** Applies to every work unit until explicitly superseded.

## 1. Purpose

ULTRA is a self-check rhythm, not a tool. Each substantive action answers: *does this reduce work across future work units, or add to it?* The goal is accumulating reusable, observable, reversible capability.

## 2. Core tenets

1. **Reusability first.** Every artifact (script, skill, hook, template) is written to be used by at least one other work unit, or it is too narrow.
2. **Reversible by default.** Any change with blast radius beyond the current directory supports `-WhatIf` or equivalent, a state file, and a rollback path.
3. **Observable.** Every run emits structured audit events (who/what/when/result) to a known log path.
4. **Idempotent.** Re-running a completed action is a no-op that reports "nothing to do."
5. **Test-proven.** No artifact is "done" until a deterministic test proves the success path, the no-op path, and at least one error path.

## 3. Pre-flight checklist (every work unit)

- [ ] Scope is one sentence, written down, with a measurable completion criterion.
- [ ] Existing tooling (skills/plugins/agents/MCPs) surveyed before writing new code.
- [ ] If new code, it extends a library module; it does not create a parallel one.
- [ ] Dependencies on other work units are explicit (blocked-by / blocks).

## 4. Naming and layout

- Scripts: `NN-verb-noun.ps1` (zero-padded numeric order). Sub-scripts in subdirectories by domain (`entra/`, `exchange/`, `teams/`...).
- Library modules: `_lib/<Module>.psm1` with manifest. Never inline a helper that could serve a second caller.
- Docs live under `docs/adr/NNNN-title.md`, `docs/OPERATIONS-PLAYBOOK.md`, `docs/DEPENDENCY-MAP.md`, `docs/WORK-UNIT-NN-summary.md`.

## 5. Simplify — the "three-repeats" rule

Before keeping duplicated logic in three call sites, extract to `_lib/`. Before the third, it is tolerated.

## 6. Credentials and state

- Never `Write-Host` secrets except the first emission of a freshly generated secret, never captured by pipelines.
- State files live in `state/<component>.json`, merge-safe, and gitignored.
- Certificates and secrets are created via flags (`-NewCertificate`, `-NewSecret`) — never implicitly.

## 7. Test discipline

- Pester for PowerShell. Unit test the mock-friendly primitive (`X509Certificate2.Export()`), not the OS-tied wrapper (`Export-Certificate`).
- Every refactor ships a matching Pester suite of at least: success, WhatIf, idempotent re-run, one error path.
- `tools/run-all-tests.ps1` runs every suite in one command. A red build blocks every downstream step.

## 8. Reuse promotion

When a pattern proves itself across 3 scripts, promote the pattern to `templates/` + `tools/new-script.ps1` scaffold. When a library of scripts stabilizes, promote it to a marketplace plugin.

## 9. Integration boundary

- Integration connectors (Dataverse/Power BI/Jira/Confluence/Harness/SharePoint) live in `integrations/<vendor>/` with a uniform adapter contract.
- Scaffolds and contracts first; implementations second. Do not skip the scaffold.

## 10. Change log

Every applied change appends an entry to `state/change-log.jsonl` with `{timestamp, actor, component, action, what-if, outcome, evidence-path}`.

## 11. Break-glass

Any risky or blast-radius-wide change (tenant-wide CA policy, admin role assignment, production deploy) requires:
1. A break-glass account confirmed to exist and working.
2. Tested rollback path.
3. Explicit user "go" after the plan is shown.

## 12. Observability

- Harness CI pipeline runs `tools/run-all-tests.ps1`, `tools/validate-all-policies.ps1`, and uploads artifacts.
- Structured events go to `state/audit.jsonl`; rotation is a separate concern, not a hidden one.

## 13. Work Unit Protocol (the reporting contract)

At the end of every work unit, produce a report that answers:

1. **What was implemented** — bullet list of artifacts with paths.
2. **Test totals** — N/N PASS with duration.
3. **Why** — answer the ULTRA self-check questions:
   - What breaks if this changes?
   - What proves this works?
   - Can this be reused?
   - Can this be simplified?
   - Is this observable?
   - Is this documented?
   - Is this the best long-term design?
4. **What's COMPLETE** — per Section 20 artifact table.
5. **What's INCOMPLETE** — explicit iteration requirement with per-item estimates.
6. **Risks flagged** — open risks, not yet-mitigated.
7. **Awaiting decision** — blocking user decisions.

## 14. Idempotence verification

After a refactor of a live-impacting script, re-run against the real target. The script must be a no-op. If it is not, the work unit is not complete.

## 15. Backward compatibility

- Do not rename public parameters without a deprecation alias.
- State file schema changes require a migration step with `-WhatIf` support.

## 16. Documentation as artifact

Comment-based help on every exported function. ADR on every non-obvious decision. Work-unit docs at completion. The PR description is not a substitute.

## 17. Dependency map

Maintain `docs/DEPENDENCY-MAP.md`: for each script, who-calls-who, which library modules are imported, which state files are read/written. Updated as part of completion, not as a follow-up.

## 18. Policy validation

`tools/validate-all-policies.ps1` parses every expected-policy JSON in `policies/` against the live tenant and reports drift. Runs in CI and pre-deploy.

## 19. Scaffolding promotion

When a script template is used 3+ times, the template graduates to `templates/script-scaffold/` and is emitted by `tools/new-script.ps1 -Category <domain>`.

## 20. Completion contract — Section 20 table

Every work unit ends with this table:

| Artifact | Status | Evidence |
|---|---|---|
| *name* | ✅ / ⏳ / ❌ | *path to proof* |

No "done" without evidence. No "complete" without green tests. No "shipped" without an idempotent re-run.

---

**Applies to every work unit until superseded by user instruction.**
