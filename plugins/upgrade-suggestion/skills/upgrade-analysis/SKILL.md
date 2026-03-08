---
name: upgrade-analysis
description: Core analysis patterns for identifying high-quality project upgrades
tags:
  - analysis
  - upgrades
  - code-quality
  - spark
---

# Upgrade Analysis Skill

Patterns and heuristics for identifying the 3 highest-impact upgrades in any
codebase. Inspired by GitHub Spark's `create_suggestions` which generates
follow-up improvement suggestions after every interaction.

## Quick-Scan Checklist

Run these checks in order. Stop collecting once you have 6+ candidate signals
(you only need to pick 3).

### 1. Project Health (package.json / config files)

```bash
# Check for outdated deps
grep -c '"dependencies"' package.json
# Check for missing scripts
grep -E '"(test|lint|build|typecheck)"' package.json
# Check TypeScript strictness
grep '"strict"' tsconfig.json
```

**Signals:**
- Missing `test` or `lint` script → DX upgrade opportunity
- `strict: false` or missing → Architecture upgrade
- No `engines` field → DX upgrade (pin Node version)

### 2. Code Patterns (source files)

```bash
# Large files
find src/ -name '*.ts' -o -name '*.tsx' | xargs wc -l | sort -rn | head -5

# TODO/FIXME density
grep -rn 'TODO\|FIXME\|HACK\|XXX' src/ --include='*.ts' --include='*.tsx' | wc -l

# Console.log in production
grep -rn 'console\.log' src/ --include='*.ts' --include='*.tsx' | grep -v test | wc -l

# Any types
grep -rn ': any' src/ --include='*.ts' --include='*.tsx' | wc -l
```

**Signals:**
- Files >300 lines → Architecture upgrade (split)
- >10 TODOs → Feature upgrade (resolve them)
- Console.logs in src → DX upgrade (add proper logging)
- >5 `any` types → Architecture upgrade (type safety)

### 3. Test Coverage

```bash
# Files without test counterparts
for f in src/**/*.ts; do
  test_file="${f%.ts}.test.ts"
  spec_file="${f%.ts}.spec.ts"
  [ ! -f "$test_file" ] && [ ! -f "$spec_file" ] && echo "UNTESTED: $f"
done
```

**Signals:**
- Critical paths without tests → Architecture upgrade
- No integration tests → Architecture upgrade
- No E2E tests → UX upgrade (verify user flows)

### 4. Security Scan

```bash
# Hardcoded secrets
grep -rn 'password\|secret\|api_key\|apiKey\|token' src/ --include='*.ts' | grep -v test | grep -v '.d.ts'

# Missing input validation
grep -rn 'req\.body\|req\.query\|req\.params' src/ --include='*.ts' | grep -v 'validate\|schema\|zod\|joi'
```

**Signals:**
- Hardcoded credentials → Security upgrade (use env vars)
- Unvalidated input → Security upgrade (add schema validation)

### 5. UX/Accessibility

```bash
# Missing alt text
grep -rn '<img' src/ --include='*.tsx' | grep -v 'alt='

# Missing error boundaries
grep -rn 'ErrorBoundary' src/ --include='*.tsx' | wc -l

# Missing loading states
grep -rn 'isLoading\|loading\|Spinner\|Skeleton' src/ --include='*.tsx' | wc -l
```

**Signals:**
- Images without alt → UX upgrade (accessibility)
- No error boundaries → UX upgrade (graceful failures)
- No loading states → UX upgrade (perceived performance)

## Suggestion Templates

Use these templates to craft high-quality suggestions:

### Performance Upgrade Template

```
Title: [Verb] [specific thing] for [measurable benefit]
Example: "Add React.memo to ProductList to prevent unnecessary re-renders"

Description pattern:
- What: [Component/function] currently [problem behavior]
- Why: This causes [measurable impact]
- Fix: [Specific action] in [specific file(s)]
```

### Security Upgrade Template

```
Title: [Verb] [vulnerability type] in [location]
Example: "Add Zod validation to POST /api/users request body"

Description pattern:
- Risk: [Input/endpoint] currently accepts [unvalidated data]
- Impact: Could allow [attack type]
- Fix: Add [validation library] schema in [file]
```

### Architecture Upgrade Template

```
Title: [Verb] [code smell] by [solution pattern]
Example: "Extract shared auth logic from 4 route handlers into middleware"

Description pattern:
- Current: [Pattern] is repeated in [N files/functions]
- Problem: Changes require updating [N places]
- Fix: Extract into [shared module/hook/middleware] at [path]
```

### DX Upgrade Template

```
Title: Add [tool/config] for [developer benefit]
Example: "Add pre-commit hooks with Husky for automatic lint + typecheck"

Description pattern:
- Gap: [Missing tooling/config] means [developer friction]
- Benefit: [Measurable improvement to workflow]
- Implementation: [Steps to add it]
```

### UX Upgrade Template

```
Title: Add [UX pattern] to [user-facing area]
Example: "Add skeleton loading states to the dashboard data tables"

Description pattern:
- Current: [Page/component] shows [blank/spinner/nothing] while loading
- Impact: Users perceive [slowness/confusion]
- Fix: Add [loading pattern] in [component file]
```

### Feature Upgrade Template

```
Title: [Verb] [feature] to [user benefit]
Example: "Add keyboard shortcuts for common actions in the editor"

Description pattern:
- Opportunity: Users currently [manual workflow]
- Benefit: [Feature] would [save time/reduce friction]
- Implementation: Add [specific code] in [files]
```

## Output Formatting

Always present as exactly 3 numbered suggestions with the visual format defined
in the command file. Include the "Pick one" prompt at the bottom to enable
immediate implementation — this is the key GitHub Spark interaction pattern.

## Anti-Patterns

- Don't suggest "add more tests" generically — say which function needs a test and why
- Don't suggest "improve error handling" — say which try/catch is missing where
- Don't suggest "refactor this file" — say what to extract and where to put it
- Don't suggest upgrades that require >1 day of work — keep them session-sized
- Don't repeat the same category 3 times — diversify across dimensions
