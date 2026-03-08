# Plugin System: 5 Additional High-Impact Improvements (Execution Plan)

This plan adds **five immediately actionable upgrades** beyond the previous recommendations, with concrete implementation scope, deliverables, acceptance criteria, and success metrics.

---

## 1) Create a Plugin Compatibility Preflight CLI + CI Gate

### Why this matters
Install-time failures are expensive and erode trust. Today, compatibility checks are mostly implicit. Add a deterministic preflight that catches issues before publish/install.

### Implementation scope
1. Add a compatibility validator command:
   - `npm run plugin:preflight -- <plugin-manifest-path>`
2. Validate:
   - Host semver range compatibility
   - API contract version compatibility
   - Required capabilities present
   - Required permissions declared
   - Required dependencies resolvable
3. Add CI job:
   - Run preflight on all changed plugin manifests
   - Block merge on any incompatibility
4. Add install flow integration:
   - Execute preflight before install/update
   - Return structured failure reasons to UI

### Deliverables
- Validator script + typed output schema
- CI workflow step for pull requests
- UI errors mapped to actionable remediation text

### Acceptance criteria
- Incompatible plugin cannot be installed in local or CI paths
- Failure output includes machine-readable `code` and human-readable `next_step`
- CI reports exactly which field failed

### KPI targets (30 days)
- **-60%** install failures caused by version mismatch
- **<2 min** mean diagnosis time for compatibility failures

---

## 2) Add Transactional Install/Update with Automatic Rollback

### Why this matters
Partial installs create broken states. Use a transaction model: either plugin is fully healthy post-install, or system reverts safely.

### Implementation scope
1. Define install transaction phases:
   - `download -> verify -> dependency-prepare -> activate -> health-check`
2. Persist phase state + correlation id for each install attempt.
3. If any phase fails:
   - Roll back to last known-good version
   - Emit rollback event + reason
4. Expose status in UI:
   - “Installing (phase 3/5)”
   - “Rolled back to vX.Y.Z”

### Deliverables
- Transaction state machine and event logs
- Rollback implementation for update path
- UI surface for install timeline and rollback outcomes

### Acceptance criteria
- Forced failure in any phase results in stable prior state
- No plugin remains in indeterminate status after failure
- Rollback event appears in activity/history view

### KPI targets (30 days)
- **0** stranded/partial installs
- **>95%** failed updates auto-recover without manual intervention

---

## 3) Build Plugin SLO Dashboard + Alerting (Reliability and Cost)

### Why this matters
You already collect plugin metrics; make them operational. Teams need at-a-glance answers: “What is failing?” and “What is expensive?”

### Implementation scope
1. Define per-plugin SLOs:
   - Availability (success rate)
   - Latency (p95/p99)
   - Error budget burn
   - Cost per successful execution
2. Add dashboard views:
   - Fleet summary (top failing/top costly)
   - Plugin detail trend graphs (7d/30d)
3. Add alert thresholds:
   - High error-rate spike
   - Latency regression
   - Cost anomaly
4. Add weekly report export:
   - JSON + markdown summary for engineering reviews

### Deliverables
- SLO definitions + evaluator
- Dashboard widgets and trend endpoints
- Alert rules + notification wiring

### Acceptance criteria
- Alerts trigger during synthetic fault tests
- Dashboard shows comparative trend vs previous window
- Weekly report generated via single command

### KPI targets (60 days)
- **-40%** MTTD for plugin incidents
- **-20%** plugin execution cost variance

---

## 4) Introduce Safe Sandboxing Profiles by Plugin Type

### Why this matters
Different plugin classes have different risk. A node plugin should not get the same default privileges as an integration or agent. Enforce least privilege by default.

### Implementation scope
1. Define default sandbox profiles:
   - `node`: minimal filesystem/network
   - `integration`: constrained network + explicit domain allowlist
   - `agent`: token/cost and tool access caps
   - `quality_gate`: read-heavy, write-restricted
2. Require explicit manifest override for elevated privileges.
3. Add runtime policy enforcement:
   - Deny and log disallowed operations
4. Add admin controls:
   - Org-level policy overrides and approval workflows

### Deliverables
- Profile schema + policy engine integration
- Enforcement logs in plugin diagnostics
- Admin policy configuration docs

### Acceptance criteria
- Disallowed operations are blocked with auditable reason
- Elevated scope requires explicit approval and is traceable
- Existing official plugins run under mapped profiles without regressions

### KPI targets (60 days)
- **100%** plugins assigned to a sandbox profile
- **-70%** high-risk permission grants on first install

---

## 5) Add Golden Integration Test Harness for Plugin Releases

### Why this matters
Most regressions happen at integration boundaries. Unit tests pass while real plugin workflows fail. A golden harness de-risks releases.

### Implementation scope
1. Define canonical plugin test scenarios:
   - Install -> configure -> execute -> update -> rollback -> uninstall
2. Provide reusable fixtures for:
   - Mock API responses
   - Permission prompts
   - Failure injection at each install phase
3. Add release gate:
   - Plugin release blocked unless golden scenarios pass
4. Publish compatibility matrix:
   - Plugin version × host version × API version

### Deliverables
- `plugin-golden-harness` test package
- CI job for matrix execution
- Release checklist update with harness output links

### Acceptance criteria
- New plugin must pass harness before publish tag
- Regression in critical scenario blocks release automatically
- Matrix artifact downloadable from CI for debugging

### KPI targets (90 days)
- **-50%** post-release plugin hotfixes
- **>90%** critical-path scenario pass rate before release

---

## Recommended sequencing (highest ROI first)
1. **Transactional install/update + rollback** (prevents user-facing breakage)
2. **Compatibility preflight CLI + CI gate** (prevents known bad releases)
3. **Golden integration test harness** (prevents integration regressions)
4. **Sandboxing profiles** (reduces security and governance risk)
5. **SLO dashboard + alerting** (improves operations and cost control)

## Suggested 6-week delivery cadence
- **Week 1-2:** Transactional install + rollback foundations
- **Week 2-3:** Compatibility preflight + CI blocking
- **Week 3-4:** Golden harness + release gate
- **Week 4-5:** Sandboxing profiles + policy enforcement
- **Week 5-6:** SLO dashboard + anomaly alerting
