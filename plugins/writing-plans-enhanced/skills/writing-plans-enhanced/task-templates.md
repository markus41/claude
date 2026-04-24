# Task Templates

Concrete templates for every common task type. Copy, adapt, fill. Each template shows the **Files** block, the steps, and the verification that proves the task succeeded.

All templates assume the plan document header and metadata block are already in place:

```markdown
### Task N: [Component Name]

**Type:** [see below]
**Depends on:** Task M (or: none)
**Parallel-safe:** yes | no
**Risk:** low | medium | high
```

---

## TDD (Standard)

**Use for:** New functions, classes, modules with behavior to verify.

````markdown
**Files:**
- Create: `src/feature/module.py`
- Test: `tests/feature/test_module.py`

- [ ] **Step 1: Write the failing test**

```python
def test_specific_behavior():
    result = function(input)
    assert result == expected
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pytest tests/feature/test_module.py::test_specific_behavior -v`
Expected: FAIL with `NameError: function not defined`

- [ ] **Step 3: Write minimal implementation**

```python
def function(input):
    return expected
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pytest tests/feature/test_module.py::test_specific_behavior -v`
Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add tests/feature/test_module.py src/feature/module.py
git commit -m "feat(feature): add specific_behavior"
```
````

---

## Config Change

**Use for:** Adding or modifying configuration (env vars, YAML/TOML/JSON settings, feature flags).

**Verification style:** Load the config in the running app and assert the expected value resolves.

````markdown
**Files:**
- Modify: `config/app.yaml:12-18`
- Modify: `src/config.py:45-50` (to read new key)
- Test: `tests/test_config.py`

- [ ] **Step 1: Write the failing test**

```python
def test_config_loads_new_key():
    cfg = load_config("config/app.yaml")
    assert cfg.new_key == "expected_value"
```

- [ ] **Step 2: Run test — expect FAIL**

Run: `pytest tests/test_config.py::test_config_loads_new_key -v`
Expected: FAIL with `AttributeError: 'Config' object has no attribute 'new_key'`

- [ ] **Step 3: Add config key to app.yaml**

```yaml
new_key: expected_value
```

- [ ] **Step 4: Read new key in src/config.py**

```python
@dataclass
class Config:
    new_key: str
```

- [ ] **Step 5: Run test — expect PASS**

Run: `pytest tests/test_config.py::test_config_loads_new_key -v`
Expected: PASS

- [ ] **Step 6: Verify resolved value from running app**

Run: `python -c "from src.config import load_config; print(load_config('config/app.yaml').new_key)"`
Expected output: `expected_value`

- [ ] **Step 7: Commit**

```bash
git add config/app.yaml src/config.py tests/test_config.py
git commit -m "feat(config): add new_key setting"
```
````

---

## Refactor (No Behavior Change)

**Use for:** Renaming, splitting, extracting, reorganizing — where observable behavior stays identical.

**Verification style:** All pre-existing tests pass. Do **not** add new tests — a refactor with new tests is actually a feature.

````markdown
**Files:**
- Modify: `src/old_location.py` (extract class `Widget` into new file)
- Create: `src/widget.py`
- Modify: All importers: `src/user.py:3`, `src/service.py:7`

- [ ] **Step 1: Baseline — run full test suite, capture pass count**

Run: `pytest -v | tail -3`
Expected: all tests passing. Record: `NN passed`

- [ ] **Step 2: Move class `Widget` to src/widget.py**

```python
# src/widget.py
class Widget:
    # [exact copy of class from src/old_location.py, including imports it uses]
    ...
```

- [ ] **Step 3: Remove `Widget` from src/old_location.py**

Leave a temporary re-export to keep imports working during migration:

```python
# src/old_location.py
from src.widget import Widget  # re-export for backward compat during migration
```

- [ ] **Step 4: Run full test suite — expect same pass count**

Run: `pytest -v | tail -3`
Expected: `NN passed` (same as Step 1)

- [ ] **Step 5: Update importers to use new path**

In `src/user.py:3`: change `from src.old_location import Widget` → `from src.widget import Widget`
In `src/service.py:7`: same change.

- [ ] **Step 6: Remove re-export from src/old_location.py**

Delete the backward-compat line.

- [ ] **Step 7: Run full test suite — expect same pass count**

Run: `pytest -v | tail -3`
Expected: `NN passed`

- [ ] **Step 8: Commit**

```bash
git add src/widget.py src/old_location.py src/user.py src/service.py
git commit -m "refactor: extract Widget into its own module"
```
````

---

## Migration (Data / Schema)

**Use for:** Database schema changes, data transformations, format upgrades.

**Verification style:** Dry-run succeeds, rollback plan is present, applied to a copy first. **Risk: high** almost always.

````markdown
**Type:** Migration
**Risk:** high — schema change, non-trivial rollback

**Files:**
- Create: `migrations/0042_add_user_status.sql`
- Create: `migrations/0042_add_user_status.rollback.sql`
- Modify: `src/models/user.py:15` (add `status` field)
- Test: `tests/migrations/test_0042.py`

**Rollback plan:** Run `0042_add_user_status.rollback.sql` to restore prior schema. Verified by: `pytest tests/migrations/test_0042.py::test_rollback`.

- [ ] **Step 1: Write migration SQL**

```sql
-- migrations/0042_add_user_status.sql
ALTER TABLE users ADD COLUMN status TEXT NOT NULL DEFAULT 'active';
```

- [ ] **Step 2: Write rollback SQL**

```sql
-- migrations/0042_add_user_status.rollback.sql
ALTER TABLE users DROP COLUMN status;
```

- [ ] **Step 3: Write test that applies and rolls back on a temp database**

```python
def test_migration_applies_and_rolls_back(tmp_db):
    apply_migration(tmp_db, "0042_add_user_status.sql")
    assert column_exists(tmp_db, "users", "status")
    apply_migration(tmp_db, "0042_add_user_status.rollback.sql")
    assert not column_exists(tmp_db, "users", "status")
```

- [ ] **Step 4: Run test — expect PASS**

Run: `pytest tests/migrations/test_0042.py -v`
Expected: PASS

- [ ] **Step 5: Dry-run against a copy of production data**

Run: `./scripts/dry-run-migration.sh 0042_add_user_status.sql`
Expected: `DRY RUN OK — 0 errors, N rows affected`

- [ ] **Step 6: Update model to match new schema**

```python
# src/models/user.py
@dataclass
class User:
    id: int
    email: str
    status: str = "active"
```

- [ ] **Step 7: Run full test suite**

Run: `pytest -v`
Expected: all tests passing

- [ ] **Step 8: Commit**

```bash
git add migrations/ src/models/user.py tests/migrations/
git commit -m "feat(db): add user status column (migration 0042)"
```
````

---

## Documentation

**Use for:** README changes, API docs, tutorials, ADRs.

**Verification style:** Cross-links resolve, code blocks parse, runnable examples actually run.

````markdown
**Files:**
- Modify: `README.md:45-80`
- Create: `docs/api/new-endpoint.md`

- [ ] **Step 1: Write the doc content**

[Full markdown content here — do not placeholder]

- [ ] **Step 2: Verify all cross-links resolve**

Run: `markdown-link-check README.md docs/api/new-endpoint.md`
Expected: no broken links

- [ ] **Step 3: Verify code blocks parse**

Run: `python -c "$(sed -n '/^```python$/,/^```$/p' docs/api/new-endpoint.md | sed '/^```/d')"`
Expected: no SyntaxError

- [ ] **Step 4: Run any runnable examples end-to-end**

Run: [exact command from the doc]
Expected: [exact output shown in the doc]

- [ ] **Step 5: Commit**

```bash
git add README.md docs/api/new-endpoint.md
git commit -m "docs: document new endpoint"
```
````

---

## File Move / Rename

**Use for:** Relocating a file without changing its contents, or renaming without changing its API.

**Verification style:** `git status` shows the rename (not add + delete), imports still resolve, tests still pass.

````markdown
**Files:**
- Move: `src/old/path.py` → `src/new/path.py`
- Modify importers: `src/a.py:1`, `src/b.py:2`, `tests/test_a.py:3`

- [ ] **Step 1: Git-aware move**

Run: `git mv src/old/path.py src/new/path.py`

- [ ] **Step 2: Verify git recorded as rename**

Run: `git status`
Expected: `renamed: src/old/path.py -> src/new/path.py` (single line, not separate add/delete)

- [ ] **Step 3: Update all importers**

In `src/a.py:1`: change `from src.old.path import X` → `from src.new.path import X`
[Repeat for each importer]

- [ ] **Step 4: Run full test suite — expect same pass count as before**

Run: `pytest -v | tail -3`
Expected: all tests passing, same count as baseline

- [ ] **Step 5: Commit**

```bash
git add -A
git commit -m "refactor: move path module to new location"
```
````

---

## Infrastructure / IaC

**Use for:** Terraform, Kubernetes manifests, Helm charts, CloudFormation, cloud console changes via CLI.

**Verification style:** `plan` / `diff` shows the expected delta. Apply only after dry-run review. **Risk: high** when touching shared environments.

````markdown
**Type:** Infrastructure
**Risk:** high — shared environment

**Files:**
- Modify: `terraform/production/main.tf:25-40`
- Modify: `terraform/production/variables.tf:10-12`

**Rollback plan:** `terraform apply` with prior commit. No state-destructive changes in this task.

- [ ] **Step 1: Edit the Terraform resources**

```hcl
resource "aws_s3_bucket" "logs" {
  bucket = "${var.env}-logs"
  versioning { enabled = true }
}
```

- [ ] **Step 2: Run terraform fmt + validate**

Run: `cd terraform/production && terraform fmt -check && terraform validate`
Expected: `Success! The configuration is valid.`

- [ ] **Step 3: Run terraform plan — review delta**

Run: `terraform plan -out=plan.tfplan`
Expected: `Plan: 1 to add, 0 to change, 0 to destroy.` Verify the resource addresses match the intent.

- [ ] **Step 4: Apply (after plan review)**

Run: `terraform apply plan.tfplan`
Expected: `Apply complete! Resources: 1 added, 0 changed, 0 destroyed.`

- [ ] **Step 5: Commit**

```bash
git add terraform/production/main.tf terraform/production/variables.tf
git commit -m "infra: add versioned logs bucket"
```
````

---

## Bug Fix (Regression Test First)

**Use for:** Fixing a defect in existing code. Add a regression test that reproduces the bug before fixing.

````markdown
**Files:**
- Modify: `src/feature/buggy.py:88`
- Test: `tests/feature/test_buggy.py` (new test)

- [ ] **Step 1: Write regression test that reproduces the bug**

```python
def test_regression_issue_123():
    # Bug: negative inputs caused overflow
    result = buggy_function(-1)
    assert result == expected_for_negative
```

- [ ] **Step 2: Run test — expect FAIL with the actual bug**

Run: `pytest tests/feature/test_buggy.py::test_regression_issue_123 -v`
Expected: FAIL with `OverflowError` (or the specific failure the bug produces)

- [ ] **Step 3: Fix the bug**

[Show the exact diff: old line(s) and new line(s)]

- [ ] **Step 4: Run test — expect PASS**

Run: `pytest tests/feature/test_buggy.py::test_regression_issue_123 -v`
Expected: PASS

- [ ] **Step 5: Run full suite — nothing else broken**

Run: `pytest -v`
Expected: all tests passing

- [ ] **Step 6: Commit**

```bash
git add src/feature/buggy.py tests/feature/test_buggy.py
git commit -m "fix(feature): handle negative inputs in buggy_function (#123)"
```
````

---

## Notes on Language & Stack

The templates above use Python/pytest for concreteness. Translate freely:

| Language | Test runner | Example command |
|----------|-------------|-----------------|
| Python | pytest | `pytest tests/ -v` |
| JavaScript/TypeScript | vitest / jest | `npx vitest run tests/file.test.ts` |
| Go | go test | `go test ./pkg/feature -run TestSpecific -v` |
| Rust | cargo test | `cargo test --package crate specific_test` |
| Java | JUnit + gradle | `./gradlew test --tests '*SpecificTest'` |
| C# | dotnet test | `dotnet test --filter FullyQualifiedName~SpecificTest` |
| Shell | bats | `bats tests/specific.bats` |

Use whatever the codebase already uses. Never introduce a new test framework as part of a plan — that's a separate plan.
