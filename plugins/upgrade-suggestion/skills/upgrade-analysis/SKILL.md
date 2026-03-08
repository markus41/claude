---
name: upgrade-analysis
description: Core analysis patterns, detection heuristics, and scoring algorithms for the upgrade intelligence system
tags:
  - upgrade-suggestion
  - analysis
  - upgrades
  - code-quality
  - spark
---

# Upgrade Analysis Skill

Core analysis patterns and algorithms powering the upgrade intelligence system.
Used by both the quick-mode analyst and the full council of specialists.

## Analysis Architecture

```
                    ┌─────────────────┐
                    │  Fingerprinting  │
                    │  (skill)         │
                    └────────┬────────┘
                             │
                    ┌────────▼────────┐
              ┌─────┤  Signal Sweep    ├─────┐
              │     │  (this skill)    │     │
              │     └─────────────────┘     │
              │                             │
     Quick Mode                        Council Mode
         │                                  │
    ┌────▼─────┐              ┌─────────────▼──────────────┐
    │ upgrade-  │              │  5 Specialist Agents       │
    │ analyst   │              │  (parallel analysis)       │
    │ (single)  │              └──────────┬────────────────┘
    └────┬─────┘                         │
         │                    ┌──────────▼────────────────┐
         │                    │  Council Synthesizer       │
         │                    │  (dedupe, vote, bundle)    │
         │                    └──────────┬────────────────┘
         │                               │
    ┌────▼───────────────────────────────▼──┐
    │         Dashboard Rendering            │
    │    (visual output with heatmaps)       │
    └────────────────────────────────────────┘
```

## Signal Detection Checklist

Run these checks in order. For quick mode, stop at 6+ signals.
For council mode, each specialist runs their domain-specific subset.

### Phase 1: Project Health (Config Files)

```bash
# Package.json signals
cat package.json 2>/dev/null | python3 -c "
import sys, json
try:
    pkg = json.load(sys.stdin)
    scripts = pkg.get('scripts', {})
    deps = {**pkg.get('dependencies', {}), **pkg.get('devDependencies', {})}

    essential = ['test', 'lint', 'build', 'dev']
    missing = [s for s in essential if s not in scripts]
    if missing: print(f'MISSING_SCRIPTS: {missing}')

    print(f'DEP_COUNT: {len(pkg.get(\"dependencies\", {}))}')
    print(f'DEV_DEP_COUNT: {len(pkg.get(\"devDependencies\", {}))}')

    if 'typescript' not in deps and '@types/node' not in deps:
        print('NO_TYPESCRIPT')
except: pass
" 2>/dev/null

# TypeScript strictness
grep -E '"strict"\s*:\s*true' tsconfig.json 2>/dev/null && echo 'TS_STRICT' || echo 'TS_NOT_STRICT'

# Linting configured
ls .eslintrc* eslint.config.* biome.json 2>/dev/null | head -1 || echo 'NO_LINTER'

# Formatting configured
ls .prettierrc* prettier.config.* biome.json 2>/dev/null | head -1 || echo 'NO_FORMATTER'

# Pre-commit hooks
ls .husky/pre-commit 2>/dev/null || echo 'NO_PRE_COMMIT'
```

**Signals per check:**
- Missing `test` or `lint` script → DX upgrade (impact: 7)
- `strict: false` or missing → Architecture upgrade (impact: 6)
- No linter → DX upgrade (impact: 7)
- No formatter → DX upgrade (impact: 5)
- No pre-commit hooks → DX upgrade (impact: 7)

### Phase 2: Code Patterns (Source Files)

```bash
# Large files (>300 lines)
find src/ -name '*.ts' -o -name '*.tsx' -o -name '*.py' 2>/dev/null | xargs wc -l 2>/dev/null | sort -rn | head -10

# TODO/FIXME density
grep -rn 'TODO\|FIXME\|HACK\|XXX' src/ --include='*.ts' --include='*.tsx' --include='*.py' 2>/dev/null | wc -l

# Console.log in production code
grep -rn 'console\.log' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v test | grep -v spec | wc -l

# any type usage
grep -rn ': any\b' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v test | grep -v '.d.ts' | wc -l

# Deep nesting (4+ levels)
grep -rn '^\s\{16,\}' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | grep -v test | wc -l

# Duplicated patterns (similar exports)
grep -rn 'export.*function\|export.*const.*=' src/ --include='*.ts' 2>/dev/null | cut -d: -f3 | sort | uniq -d | head -5
```

**Signals:**
- Files >300 lines → Architecture: split file (impact: 5-7 based on size)
- >10 TODOs → Feature: resolve TODOs (impact: 4-6)
- >5 console.logs in src → DX: add proper logging (impact: 4)
- >5 `any` types → Architecture: type safety (impact: 6)
- Deep nesting → Architecture: refactor (impact: 5)

### Phase 3: Test Coverage

```bash
# Count source vs test files
src_count=$(find src/ -name '*.ts' -not -name '*.test.*' -not -name '*.spec.*' -not -name '*.d.ts' -not -path '*/__tests__/*' 2>/dev/null | wc -l)
test_count=$(find src/ -name '*.test.*' -o -name '*.spec.*' 2>/dev/null | wc -l)
echo "SOURCE: $src_count TESTS: $test_count RATIO: $(echo "scale=2; $test_count/$src_count" | bc 2>/dev/null)"

# Critical untested files (API routes, auth, database)
for f in $(find src/ -path '*/api/*' -o -path '*/auth/*' -o -path '*/db/*' -name '*.ts' -not -name '*.test.*' 2>/dev/null); do
  base="${f%.ts}"
  [ ! -f "${base}.test.ts" ] && [ ! -f "${base}.spec.ts" ] && echo "UNTESTED_CRITICAL: $f"
done
```

**Signals:**
- Test ratio < 0.3 → DX: add tests for critical paths (impact: 7)
- Untested API/auth files → Security + DX: add tests (impact: 8)

### Phase 4: Security Quick-Scan

```bash
# Hardcoded secrets
grep -rn 'password\s*=\|secret\s*=\|api[_-]key\s*=' src/ --include='*.ts' --include='*.py' 2>/dev/null | grep -v test | grep -v 'process\.env\|os\.environ' | head -5

# Missing input validation at API boundaries
grep -rn 'req\.body\|request\.json' src/ --include='*.ts' --include='*.py' 2>/dev/null | grep -v 'validate\|schema\|zod\|joi\|pydantic' | head -10

# XSS risk indicators
grep -rn 'dangerouslySetInnerHTML\|innerHTML' src/ --include='*.tsx' --include='*.ts' 2>/dev/null | head -5

# JWT in localStorage
grep -rn 'localStorage.*token\|localStorage.*jwt' src/ --include='*.ts' --include='*.tsx' 2>/dev/null | head -5
```

**Signals:**
- Hardcoded secrets → Security: use env vars (impact: 9, severity: critical)
- Unvalidated input → Security: add schema validation (impact: 8)
- XSS risk → Security: sanitize output (impact: 8)
- JWT in localStorage → Security: use httpOnly cookies (impact: 7)

### Phase 5: UX/Accessibility

```bash
# Missing alt text
grep -rn '<img' src/ --include='*.tsx' --include='*.jsx' 2>/dev/null | grep -v 'alt=' | head -5

# Missing loading states
grep -rn 'isLoading\|loading\|Spinner\|Skeleton' src/ --include='*.tsx' 2>/dev/null | wc -l

# Missing error boundaries
grep -rn 'ErrorBoundary' src/ --include='*.tsx' 2>/dev/null | wc -l

# Missing keyboard accessibility
grep -rn 'onClick' src/ --include='*.tsx' 2>/dev/null | wc -l
grep -rn 'onKeyDown\|onKeyUp' src/ --include='*.tsx' 2>/dev/null | wc -l
```

**Signals:**
- Images without alt → UX: accessibility fix (impact: 6, severity: high)
- No error boundaries → UX: add graceful error handling (impact: 7)
- No loading states → UX: add skeleton screens (impact: 7)
- Many onClick without onKeyDown → UX: keyboard accessibility (impact: 6)

## Scoring Algorithms

### Quick Mode Score

```
QuickScore = (Impact * 0.40) + (Effort * 0.30) + (Relevance * 0.30)
```

### Council Mode Score

```
CouncilScore = (Impact * 0.30)
             + (Effort * 0.20)
             + (Confidence * 10 * 0.25)
             + (Relevance * 0.15)
             + (Innovation * 0.10)
```

### Confidence Boosting

```
base_confidence = individual_agent_confidence  # 0.0-1.0

FOR each additional agent that flags the same issue:
  base_confidence += 0.15

confidence = min(0.99, base_confidence)
```

### Bundle Synergy Score

```
individual_sum = impact_A + impact_B
bundle_impact = individual_sum * synergy_multiplier

WHERE synergy_multiplier:
  prerequisites:   1.20  (20% bonus — they naturally chain)
  amplifiers:      1.30  (30% bonus — combined effect is greater)
  same_module:     1.10  (10% bonus — less context switching)
  independent:     1.00  (no bonus)
```

## Suggestion Quality Checklist

Before presenting any suggestion, verify:

- [ ] References specific files and line numbers from the actual codebase
- [ ] Includes before/after code showing the concrete change
- [ ] Impact is quantified (latency, bundle size, query count, or similar)
- [ ] Effort estimate is realistic for a single developer session
- [ ] Category is accurate and not duplicated excessively in results
- [ ] Implementation hint is concrete enough to start immediately
- [ ] Tags enable cross-referencing with related findings
- [ ] No generic advice — every word is specific to this codebase

## Anti-Patterns to Avoid

| Anti-Pattern | Why It's Bad | Instead |
|-------------|-------------|---------|
| "Add more tests" | Too vague, not actionable | "Add tests for `createUser()` in auth.ts — untested critical path" |
| "Improve error handling" | No specific location | "Add try/catch in `fetchProducts()` at api.ts:42 — unhandled promise rejection" |
| "Refactor this file" | No clear outcome | "Extract auth middleware from 4 route handlers into `middleware/auth.ts`" |
| "Use TypeScript" | Already using TS | "Enable `strict: true` in tsconfig — currently 23 implicit any types" |
| "Add caching" | Where? What? How? | "Add SWR cache to `/api/products` — 2400 identical DB queries/min, data changes every 5min" |
| 3 architecture suggestions | Lacks diversity | Mix categories: 1 performance + 1 security + 1 ux |
| Suggesting >1 day effort | Too large for quick wins | Break into session-sized chunks or flag as "strategic" |

## Visual Output Templates

### Health Bar (0-100)

```
████████░░ 78/100    (78% filled, 10 chars total)
██████░░░░ 55/100
███████░░░ 68/100
█████░░░░░ 48/100
```

### Impact/Effort Bar (1-10)

```
▰▰▰▰▰▰▰▰▱▱ 8/10
▰▰▰▰▰▰▰▱▱▱ 7/10
▰▰▰▰▰▱▱▱▱▱ 5/10
```

### Confidence Dots

```
●●●●○ 92% (4/5 filled for 80-99%)
●●●○○ 65% (3/5 for 60-79%)
●●○○○ 45% (2/5 for 40-59%)
```

### Heatmap Row

```
src/api/        ██████████ Perf ████░░░░░░ Sec  ██████░░░░ Arch
```

These visual elements combine into the full dashboard rendered by the command.
