---
name: audit
description: Audit UI for design style consistency and accessibility
argument-hint: "<scope> [style]"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# Design System Audit Command

Audit your UI codebase for design style consistency, accessibility compliance, and best practices.

## Usage

```bash
/audit <scope> [style]
```

## Arguments

- `scope` (required): Audit scope - `file`, `directory`, or `project`
- `style` (optional): Design style to check against (defaults to detected style)

## Examples

```bash
# Audit entire project
/audit project

# Audit specific directory
/audit directory src/components

# Audit single file
/audit file src/components/Button/Button.tsx

# Audit against specific style
/audit project "Material Design"
```

## Execution Flow

### 1. Scope Detection

```bash
# Project scope
find . -name "*.tsx" -o -name "*.jsx" -o -name "*.css" -o -name "*.scss"

# Directory scope
find src/components -name "*.tsx" -o -name "*.css"

# File scope
Single file analysis
```

### 2. Design Token Analysis

Scan for hardcoded values that should use design tokens:

```typescript
// audit/tokenAnalyzer.ts
interface HardcodedValue {
  file: string;
  line: number;
  type: 'color' | 'spacing' | 'fontSize' | 'shadow' | 'borderRadius';
  value: string;
  suggestion: string;
}

export function detectHardcodedValues(content: string, filePath: string): HardcodedValue[] {
  const issues: HardcodedValue[] = [];

  // Detect hardcoded colors
  const colorRegex = /(#[0-9A-Fa-f]{3,6}|rgb\([^)]+\)|rgba\([^)]+\))/g;
  const colors = content.matchAll(colorRegex);

  for (const match of colors) {
    const color = match[0];
    const token = findClosestColorToken(color);

    issues.push({
      file: filePath,
      line: getLineNumber(content, match.index!),
      type: 'color',
      value: color,
      suggestion: token ? `var(--color-${token})` : 'Use design token',
    });
  }

  // Detect hardcoded spacing (px values)
  const spacingRegex = /(\d+)px(?!\s*\/)/g;
  const spacings = content.matchAll(spacingRegex);

  for (const match of spacings) {
    const px = parseInt(match[1]);
    const token = findClosestSpacingToken(px);

    if (token) {
      issues.push({
        file: filePath,
        line: getLineNumber(content, match.index!),
        type: 'spacing',
        value: `${px}px`,
        suggestion: `var(--spacing-${token})`,
      });
    }
  }

  return issues;
}
```

### 3. Accessibility Checks

#### Color Contrast

```typescript
// audit/accessibilityChecker.ts
interface ContrastIssue {
  file: string;
  line: number;
  foreground: string;
  background: string;
  ratio: number;
  level: 'AA' | 'AAA';
  passed: boolean;
}

export function checkColorContrast(
  foreground: string,
  background: string,
  fontSize: number = 16
): ContrastIssue {
  const ratio = getContrastRatio(foreground, background);
  const isLargeText = fontSize >= 18;

  const wcagAA = isLargeText ? 3 : 4.5;
  const wcagAAA = isLargeText ? 4.5 : 7;

  return {
    ratio,
    wcagAA: {
      required: wcagAA,
      passed: ratio >= wcagAA,
    },
    wcagAAA: {
      required: wcagAAA,
      passed: ratio >= wcagAAA,
    },
  };
}
```

#### ARIA Attributes

```typescript
// audit/ariaChecker.ts
interface AriaIssue {
  file: string;
  line: number;
  element: string;
  issue: string;
  severity: 'error' | 'warning' | 'info';
  suggestion: string;
}

export function checkAriaAttributes(jsx: string, filePath: string): AriaIssue[] {
  const issues: AriaIssue[] = [];

  // Check for buttons without accessible labels
  if (/<button(?![^>]*aria-label)(?![^>]*>.*<\/button>)/.test(jsx)) {
    issues.push({
      file: filePath,
      line: 0,
      element: 'button',
      issue: 'Button without accessible label',
      severity: 'error',
      suggestion: 'Add aria-label or text content',
    });
  }

  // Check for images without alt text
  if (/<img(?![^>]*alt=)/.test(jsx)) {
    issues.push({
      file: filePath,
      line: 0,
      element: 'img',
      issue: 'Image without alt text',
      severity: 'error',
      suggestion: 'Add alt attribute',
    });
  }

  // Check for form inputs without labels
  if (/<input(?![^>]*aria-label)(?![^>]*id=)/.test(jsx)) {
    issues.push({
      file: filePath,
      line: 0,
      element: 'input',
      issue: 'Input without associated label',
      severity: 'warning',
      suggestion: 'Add aria-label or associate with <label>',
    });
  }

  return issues;
}
```

#### Keyboard Navigation

```typescript
// audit/keyboardChecker.ts
interface KeyboardIssue {
  file: string;
  line: number;
  element: string;
  issue: string;
  suggestion: string;
}

export function checkKeyboardNavigation(jsx: string, filePath: string): KeyboardIssue[] {
  const issues: KeyboardIssue[] = [];

  // Check for onClick without onKeyDown on non-interactive elements
  if (/<div[^>]*onClick[^>]*(?!onKeyDown)/.test(jsx)) {
    issues.push({
      file: filePath,
      line: 0,
      element: 'div with onClick',
      issue: 'Clickable div without keyboard support',
      suggestion: 'Add onKeyDown handler or use <button> element',
    });
  }

  // Check for missing tabIndex on interactive custom elements
  if (/<div[^>]*role="button"[^>]*(?!tabIndex)/.test(jsx)) {
    issues.push({
      file: filePath,
      line: 0,
      element: 'div with role="button"',
      issue: 'Interactive element not keyboard accessible',
      suggestion: 'Add tabIndex={0}',
    });
  }

  return issues;
}
```

### 4. Style Consistency Checks

```typescript
// audit/styleConsistency.ts
interface StyleIssue {
  file: string;
  line: number;
  property: string;
  value: string;
  expectedPattern: string;
  severity: 'error' | 'warning' | 'info';
}

export function checkStyleConsistency(style: DesignStyle, css: string): StyleIssue[] {
  const issues: StyleIssue[] = [];

  // Check font families match design style
  const fontFamilyRegex = /font-family:\s*([^;]+)/g;
  const matches = css.matchAll(fontFamilyRegex);

  for (const match of matches) {
    const fontFamily = match[1];
    if (!fontFamily.includes(style.typography.fontFamily.base)) {
      issues.push({
        file: '',
        line: 0,
        property: 'font-family',
        value: fontFamily,
        expectedPattern: style.typography.fontFamily.base,
        severity: 'warning',
      });
    }
  }

  // Check border-radius values
  const borderRadiusRegex = /border-radius:\s*(\d+px)/g;
  const radii = css.matchAll(borderRadiusRegex);

  for (const match of radii) {
    const value = match[1];
    if (!Object.values(style.radii).includes(value)) {
      issues.push({
        file: '',
        line: 0,
        property: 'border-radius',
        value,
        expectedPattern: 'Use design token values',
        severity: 'info',
      });
    }
  }

  return issues;
}
```

### 5. Component Best Practices

```typescript
// audit/componentChecker.ts
interface ComponentIssue {
  file: string;
  component: string;
  issue: string;
  category: 'performance' | 'accessibility' | 'maintainability' | 'consistency';
  suggestion: string;
}

export function checkComponentBestPractices(content: string, filePath: string): ComponentIssue[] {
  const issues: ComponentIssue[] = [];

  // Check for inline styles
  if (/style=\{\{/.test(content)) {
    issues.push({
      file: filePath,
      component: extractComponentName(content),
      issue: 'Inline styles detected',
      category: 'maintainability',
      suggestion: 'Use styled-components or CSS modules',
    });
  }

  // Check for missing forwardRef on reusable components
  if (/export (const|function) \w+.*=.*\(.*props.*\)/.test(content) &&
      !/forwardRef/.test(content)) {
    issues.push({
      file: filePath,
      component: extractComponentName(content),
      issue: 'Component does not use forwardRef',
      category: 'maintainability',
      suggestion: 'Wrap component with forwardRef for ref forwarding',
    });
  }

  // Check for missing TypeScript prop types
  if (/\.tsx$/.test(filePath) && !/interface \w+Props/.test(content)) {
    issues.push({
      file: filePath,
      component: extractComponentName(content),
      issue: 'Missing TypeScript prop interface',
      category: 'maintainability',
      suggestion: 'Define props interface',
    });
  }

  return issues;
}
```

### 6. Generate Audit Report

```markdown
# Design System Audit Report

Generated: {timestamp}
Scope: {scope}
Style: {style}
Files scanned: {count}

---

## Executive Summary

- **Overall Score**: 78/100
- **Critical Issues**: 3
- **Warnings**: 12
- **Recommendations**: 24

### Breakdown
- ✅ Accessibility: 85%
- ⚠️  Design Tokens: 65%
- ✅ Style Consistency: 92%
- ⚠️  Component Best Practices: 71%

---

## Critical Issues (3)

### 1. Missing Alt Text on Images
**File**: `src/components/Hero/Hero.tsx:45`
**Severity**: Error
**Issue**: Image without alt text
```tsx
<img src="/hero.jpg" />
```
**Fix**:
```tsx
<img src="/hero.jpg" alt="Hero image showing product features" />
```

### 2. Low Color Contrast
**File**: `src/components/Button/Button.tsx:23`
**Severity**: Error
**Contrast Ratio**: 2.8:1 (Requires: 4.5:1)
```tsx
color: #AAAAAA;
background: #FFFFFF;
```
**Fix**: Use darker text color (e.g., #666666 for 5.7:1 ratio)

### 3. Clickable Div Without Keyboard Support
**File**: `src/components/Card/Card.tsx:67`
**Severity**: Error
```tsx
<div onClick={handleClick}>...</div>
```
**Fix**:
```tsx
<button onClick={handleClick} onKeyDown={handleKeyDown}>...</button>
```

---

## Warnings (12)

### Hardcoded Colors (8 instances)

| File | Line | Value | Suggested Token |
|------|------|-------|-----------------|
| Button.tsx | 23 | #2196F3 | var(--color-primary-500) |
| Card.tsx | 45 | rgba(0,0,0,0.1) | var(--shadow-sm) |
| Modal.tsx | 12 | #FFFFFF | var(--color-bg-default) |
| Input.tsx | 34 | #E0E0E0 | var(--color-border-default) |

**Impact**: Inconsistent styling, difficult theme switching
**Fix**: Replace with design token references

### Hardcoded Spacing (4 instances)

| File | Line | Value | Suggested Token |
|------|------|-------|-----------------|
| Layout.tsx | 15 | 16px | var(--spacing-2) |
| Header.tsx | 28 | 24px | var(--spacing-3) |
| Footer.tsx | 42 | 32px | var(--spacing-4) |

---

## Recommendations (24)

### Design Token Usage

**Issue**: 34% of styles use hardcoded values
**Impact**: Medium
**Effort**: Low

Replace hardcoded values with design tokens for:
- Colors: 18 instances
- Spacing: 9 instances
- Border radius: 4 instances
- Shadows: 3 instances

**Example**:
```tsx
// Before
<Button style={{ padding: '12px 24px', background: '#2196F3' }}>

// After
<Button style={{
  padding: `${tokens.spacing[1.5]} ${tokens.spacing[3]}`,
  background: tokens.colors.primary[500]
}}>
```

### Component Improvements

1. **Add forwardRef to 6 components** for better composability
2. **Define TypeScript interfaces** for 4 components missing prop types
3. **Extract inline styles** to styled-components (8 instances)

### Accessibility Enhancements

1. Add `aria-label` to 5 icon buttons
2. Associate labels with 3 form inputs
3. Add focus-visible styles to 7 interactive elements
4. Improve keyboard navigation in 2 custom components

---

## Detailed Findings

### By Category

#### Accessibility (85%)
- ✅ 23/27 images have alt text
- ✅ 89% color contrast compliance (WCAG AA)
- ⚠️  3 form inputs missing labels
- ⚠️  2 buttons without accessible names

#### Design Tokens (65%)
- ⚠️  34% hardcoded colors
- ⚠️  22% hardcoded spacing
- ✅ 100% typography using tokens
- ✅ 95% shadows using tokens

#### Style Consistency (92%)
- ✅ All fonts match design style
- ✅ Border radius values consistent
- ⚠️  Some spacing values off-grid (8px grid system)

#### Component Best Practices (71%)
- ✅ 85% components use TypeScript
- ⚠️  40% missing forwardRef
- ⚠️  15% using inline styles
- ✅ 90% components have displayName

---

## Files with Most Issues

| File | Critical | Warnings | Recommendations | Score |
|------|----------|----------|-----------------|-------|
| src/components/Card/Card.tsx | 1 | 3 | 5 | 62/100 |
| src/components/Button/Button.tsx | 1 | 2 | 4 | 71/100 |
| src/components/Modal/Modal.tsx | 0 | 2 | 3 | 78/100 |
| src/components/Input/Input.tsx | 1 | 1 | 2 | 82/100 |

---

## Action Items

### High Priority (Critical Issues)
- [ ] Fix missing alt text on images (3 instances)
- [ ] Fix low color contrast issues (1 instance)
- [ ] Add keyboard support to clickable divs (1 instance)

### Medium Priority (Warnings)
- [ ] Replace hardcoded colors with tokens (18 instances)
- [ ] Replace hardcoded spacing with tokens (9 instances)
- [ ] Add missing ARIA labels (5 instances)

### Low Priority (Recommendations)
- [ ] Add forwardRef to components (6 components)
- [ ] Extract inline styles (8 instances)
- [ ] Add TypeScript prop interfaces (4 components)

---

## Automated Fixes

Some issues can be fixed automatically:

```bash
# Apply automated fixes
/audit fix project

# Preview fixes without applying
/audit fix project --dry-run

# Fix specific category
/audit fix project --category=tokens
```

---

## Next Audit

Recommended to run audit:
- After major refactoring
- Before production deployments
- Weekly during active development

Schedule: `npm run audit:weekly`
```

### 7. Automated Fixes (Optional)

```typescript
// audit/autoFix.ts
export function autoFixHardcodedColors(content: string, tokens: any): string {
  const colorMap = buildColorMap(tokens);

  return content.replace(
    /(#[0-9A-Fa-f]{6}|rgb\([^)]+\)|rgba\([^)]+\))/g,
    (match) => {
      const token = findClosestColorToken(match, colorMap);
      return token ? `var(--color-${token})` : match;
    }
  );
}

export function autoFixSpacing(content: string, tokens: any): string {
  const spacingMap = buildSpacingMap(tokens);

  return content.replace(/(\d+)px/g, (match, px) => {
    const token = findClosestSpacingToken(parseInt(px), spacingMap);
    return token ? `var(--spacing-${token})` : match;
  });
}
```

## Output

```
✅ Audit Complete

Scope: project
Files scanned: 127
Style: Material Design

Score: 78/100

Issues found:
- Critical: 3
- Warnings: 12
- Recommendations: 24

Top issues:
1. Missing alt text (3 instances)
2. Low color contrast (1 instance)
3. Hardcoded colors (18 instances)

Report generated:
- audit-report.md
- audit-report.json
- audit-report.html

Next steps:
1. Review critical issues first
2. Run: /audit fix project --dry-run
3. Apply fixes: /audit fix project
4. Re-run audit to verify improvements
```

## Integration with CI/CD

```yaml
# .github/workflows/design-audit.yml
name: Design System Audit

on: [pull_request]

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Run design audit
        run: npm run audit:ci
      - name: Upload report
        uses: actions/upload-artifact@v2
        with:
          name: audit-report
          path: audit-report.html
      - name: Comment PR
        if: failure()
        run: gh pr comment ${{ github.event.pull_request.number }} --body-file audit-summary.md
```
