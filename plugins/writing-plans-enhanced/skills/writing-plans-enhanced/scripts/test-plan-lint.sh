#!/usr/bin/env bash
# test-plan-lint.sh — tests for plan-lint.sh
# Deterministic, isolated, minimal-mock.
# Usage: ./test-plan-lint.sh
# Exit: 0 if all tests pass, 1 on first failure.

set -euo pipefail

HERE="$(cd "$(dirname "$0")" && pwd)"
LINTER="$HERE/plan-lint.sh"

# Temp workspace — isolated per run
WORK="$(mktemp -d 2>/dev/null || mktemp -d -t plan-lint-test)"
trap 'rm -rf "$WORK"' EXIT

pass=0
fail=0

assert() {
  local label="$1" actual="$2" expected="$3"
  if [[ "$actual" == "$expected" ]]; then
    echo "  PASS: $label"
    pass=$((pass+1))
  else
    echo "  FAIL: $label"
    echo "    expected: $expected"
    echo "    actual:   $actual"
    fail=$((fail+1))
  fi
}

assert_contains() {
  local label="$1" actual="$2" needle="$3"
  if [[ "$actual" == *"$needle"* ]]; then
    echo "  PASS: $label"
    pass=$((pass+1))
  else
    echo "  FAIL: $label"
    echo "    needle:   $needle"
    echo "    haystack: $actual"
    fail=$((fail+1))
  fi
}

# ------------------------------------------------------------------
# Fixture 1: clean plan — should exit 0 with no findings
# ------------------------------------------------------------------
cat >"$WORK/clean.md" <<'EOF'
# Clean Feature Implementation Plan

**Goal:** Add a working widget.

**Architecture:** Thin wrapper around existing service.

**Tech Stack:** Python, pytest.

**Context:**
- Codebase conventions: src/ layout, pytest, black
- Reference pattern: src/features/thing.py
- Known risks: none

---

### Task 1: Add widget

**Type:** TDD
**Depends on:** none
**Parallel-safe:** yes
**Risk:** low

**Files:**
- Create: `src/widget.py`

- [ ] **Step 1: Write failing test**

```python
def test_widget():
    assert Widget().name == "w"
```

- [ ] **Step 2: Commit**

```bash
git commit -m "feat(widget): add initial widget"
```
EOF

echo "Test 1: clean plan"
out="$(bash "$LINTER" "$WORK/clean.md" 2>&1 || true)"
rc=$?
# When `|| true` is used, $? is the true command. Re-run to capture real rc.
bash "$LINTER" "$WORK/clean.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "clean plan exit 0" "$rc" "0"
assert "clean plan no output" "$out" ""

# ------------------------------------------------------------------
# Fixture 2: plan with placeholders
# ------------------------------------------------------------------
cat >"$WORK/placeholders.md" <<'EOF'
# Bad Plan

**Context:**
- Codebase conventions: TBD
- Reference pattern: fill in later
- Known risks: TODO

---

### Task 1: Stub

**Type:** TDD
**Depends on:** none
**Parallel-safe:** yes
**Risk:** low

- [ ] Implement later

```bash
git commit -m "feat: stub"
```
EOF

echo "Test 2: plan with placeholders"
out="$(bash "$LINTER" "$WORK/placeholders.md" 2>&1 || true)"
bash "$LINTER" "$WORK/placeholders.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "placeholders exit 1" "$rc" "1"
assert_contains "detects TBD" "$out" "TBD"
assert_contains "detects TODO" "$out" "TODO"
assert_contains "detects 'fill in'" "$out" "fill in"
assert_contains "detects 'Implement later'" "$out" "Implement later"

# ------------------------------------------------------------------
# Fixture 3: missing Context block
# ------------------------------------------------------------------
cat >"$WORK/no-context.md" <<'EOF'
# No Context Plan

**Goal:** Something.

---

### Task 1: X

**Type:** TDD
**Depends on:** none
**Parallel-safe:** yes
**Risk:** low

- [ ] Step 1

```bash
git commit -m "feat: x"
```
EOF

echo "Test 3: missing Context block"
out="$(bash "$LINTER" "$WORK/no-context.md" 2>&1 || true)"
bash "$LINTER" "$WORK/no-context.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "no-context exit 1" "$rc" "1"
assert_contains "flags missing Context" "$out" "Context"

# ------------------------------------------------------------------
# Fixture 4: task missing metadata
# ------------------------------------------------------------------
cat >"$WORK/no-metadata.md" <<'EOF'
# Missing Metadata Plan

**Context:**
- Codebase conventions: none
- Reference pattern: none
- Known risks: none

---

### Task 1: No Metadata

- [ ] Step 1

```bash
git commit -m "feat: x"
```
EOF

echo "Test 4: task missing metadata"
out="$(bash "$LINTER" "$WORK/no-metadata.md" 2>&1 || true)"
bash "$LINTER" "$WORK/no-metadata.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "no-metadata exit 1" "$rc" "1"
assert_contains "flags missing Type" "$out" "Type"

# ------------------------------------------------------------------
# Fixture 5: vague commit message
# ------------------------------------------------------------------
cat >"$WORK/vague-commit.md" <<'EOF'
# Vague Commit Plan

**Context:**
- Codebase conventions: none
- Reference pattern: none
- Known risks: none

---

### Task 1: Thing

**Type:** TDD
**Depends on:** none
**Parallel-safe:** yes
**Risk:** low

- [ ] Step 1

```bash
git commit -m "wip"
```
EOF

echo "Test 5: vague commit message"
out="$(bash "$LINTER" "$WORK/vague-commit.md" 2>&1 || true)"
bash "$LINTER" "$WORK/vague-commit.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "vague-commit exit 1" "$rc" "1"
assert_contains "flags vague commit" "$out" "vague"

# ------------------------------------------------------------------
# Fixture 6: forward dependency
# ------------------------------------------------------------------
cat >"$WORK/forward-dep.md" <<'EOF'
# Forward Dep Plan

**Context:**
- Codebase conventions: none
- Reference pattern: none
- Known risks: none

---

### Task 1: Early

**Type:** TDD
**Depends on:** Task 3
**Parallel-safe:** no
**Risk:** low

- [ ] Step 1

```bash
git commit -m "feat: early"
```

### Task 2: Middle

**Type:** TDD
**Depends on:** Task 1
**Parallel-safe:** no
**Risk:** low

- [ ] Step 1

```bash
git commit -m "feat: middle"
```

### Task 3: Late

**Type:** TDD
**Depends on:** Task 2
**Parallel-safe:** no
**Risk:** low

- [ ] Step 1

```bash
git commit -m "feat: late"
```
EOF

echo "Test 6: forward dependency"
out="$(bash "$LINTER" "$WORK/forward-dep.md" 2>&1 || true)"
bash "$LINTER" "$WORK/forward-dep.md" >/dev/null 2>&1 && rc=0 || rc=$?
assert "forward-dep exit 1" "$rc" "1"
assert_contains "flags forward dep" "$out" "forward"

# ------------------------------------------------------------------
# Fixture 7: missing file arg
# ------------------------------------------------------------------
echo "Test 7: missing file arg"
bash "$LINTER" >/dev/null 2>&1 && rc=0 || rc=$?
assert "missing arg exit 2" "$rc" "2"

# ------------------------------------------------------------------
# Summary
# ------------------------------------------------------------------
echo
echo "Summary: $pass passed, $fail failed"
[[ $fail -eq 0 ]]
