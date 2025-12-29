---
name: component-review
description: Deep component quality review with actionable improvements
argument-hint: component-path
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Bash
---

# Component Review Command

You are being invoked as the `/component-review` slash command for the frontend-powerhouse plugin.

## Your Task

Perform a comprehensive quality review of a component, analyzing code quality, performance, accessibility, testing, and best practices. Use the **code-quality-reviewer** agent to conduct the review.

## Arguments

- **component-path** (required): Path to component file or directory (e.g., `src/components/Button/index.tsx`)

## Instructions

1. **Read the component file(s)** to understand structure and dependencies
2. **Activate the code-quality-reviewer agent** via the Task tool
3. The agent will analyze:
   - Code quality and architecture
   - React best practices
   - TypeScript usage and type safety
   - Performance optimization opportunities
   - Accessibility compliance
   - Testing coverage
   - Documentation quality
   - Security concerns
4. Generate detailed review report with actionable recommendations
5. Provide code examples for each improvement

## Review Categories

### 1. Code Quality
- Component structure and organization
- Code readability and maintainability
- Naming conventions
- Code duplication (DRY principle)
- Complexity analysis
- Error handling

### 2. React Best Practices
- Component composition
- Proper use of hooks
- State management patterns
- Side effect handling (useEffect)
- Memoization (useMemo, useCallback, React.memo)
- Component re-render optimization
- Props drilling vs context
- Ref usage and forwarding

### 3. TypeScript
- Type safety and coverage
- Interface vs type usage
- Generic usage
- Utility types
- Type inference
- Strict mode compliance
- Any/unknown usage

### 4. Performance
- Bundle size impact
- Lazy loading opportunities
- Code splitting
- Unnecessary re-renders
- Heavy computation memoization
- Large data handling
- Image optimization

### 5. Accessibility
- ARIA attributes
- Semantic HTML
- Keyboard navigation
- Focus management
- Color contrast
- Screen reader compatibility
- Alternative text for images

### 6. Testing
- Test coverage percentage
- Test quality (unit, integration, e2e)
- Edge case coverage
- User-centric tests
- Mock quality
- Test maintainability

### 7. Documentation
- JSDoc comments
- Prop documentation
- Usage examples
- Storybook stories
- README completeness

### 8. Security
- XSS vulnerabilities
- Injection risks
- Sensitive data exposure
- Third-party dependencies
- Input validation

## Expected Output

A detailed markdown report saved to `component-review-{componentName}-{timestamp}.md`:

```markdown
# Component Review: {ComponentName}

**Date**: {timestamp}
**Path**: {componentPath}
**Overall Score**: {score}/100
**Reviewer**: code-quality-reviewer agent

## Executive Summary

{Brief overview of component quality and top 3 critical issues}

## Detailed Analysis

### Code Quality Score: {score}/100

#### Issues Found

##### 1. [High Priority] Unnecessary Re-renders
- **Location**: `Button.tsx:45-60`
- **Issue**: Component re-renders on every parent render due to inline function creation
- **Impact**: Performance degradation on large lists
- **Current Code**:
  ```tsx
  <Button onClick={() => handleClick(item.id)}>
    Click me
  </Button>
  ```
- **Recommended Fix**:
  ```tsx
  const onClick = useCallback(() => {
    handleClick(item.id);
  }, [item.id]);

  <Button onClick={onClick}>Click me</Button>
  ```
- **Effort**: Low (< 30 min)
- **Impact**: High

##### 2. [Medium Priority] Missing TypeScript Generics
...

### React Best Practices Score: {score}/100
...

### Performance Score: {score}/100

#### Bundle Size Analysis
- Current size: {size} KB
- Largest dependencies: {list}
- Optimization opportunities: {count}

### Accessibility Score: {score}/100

#### WCAG Violations
- Missing ARIA labels: {count}
- Color contrast issues: {count}
- Keyboard navigation gaps: {count}

### Testing Score: {score}/100

#### Coverage
- Lines: {coverage}%
- Branches: {coverage}%
- Functions: {coverage}%
- Statements: {coverage}%

#### Missing Tests
1. Error state handling
2. Edge case: empty data array
3. Accessibility: keyboard navigation

### Documentation Score: {score}/100
...

## Recommendations by Priority

### Critical (Do Immediately)
1. Fix accessibility issues (ARIA labels)
2. Add error boundary
3. Validate props with proper types

### High Priority (This Sprint)
1. Optimize re-renders with memoization
2. Add comprehensive tests
3. Improve TypeScript types

### Medium Priority (Next Sprint)
1. Refactor large component into smaller pieces
2. Add JSDoc comments
3. Create Storybook stories

### Low Priority (Backlog)
1. Consider design pattern improvements
2. Explore alternative libraries
3. Add performance monitoring

## Code Examples

### Example 1: Memoization Pattern
**Before**:
```tsx
function MyComponent({ items }) {
  const expensiveCalculation = items.map(item => heavyOperation(item));
  return <div>{expensiveCalculation}</div>;
}
```

**After**:
```tsx
function MyComponent({ items }) {
  const expensiveCalculation = useMemo(
    () => items.map(item => heavyOperation(item)),
    [items]
  );
  return <div>{expensiveCalculation}</div>;
}
```

## Metrics Summary

| Category       | Score | Status |
|----------------|-------|--------|
| Code Quality   | 85/100 | ✅ Good |
| React Patterns | 72/100 | ⚠️ Needs work |
| TypeScript     | 90/100 | ✅ Excellent |
| Performance    | 65/100 | ⚠️ Needs work |
| Accessibility  | 55/100 | ❌ Poor |
| Testing        | 78/100 | ✅ Good |
| Documentation  | 60/100 | ⚠️ Needs work |
| Security       | 95/100 | ✅ Excellent |
| **Overall**    | **75/100** | **⚠️ Good with issues** |

## Action Items Checklist

- [ ] Fix missing ARIA labels (2 hours)
- [ ] Add React.memo to prevent re-renders (1 hour)
- [ ] Improve TypeScript types for props (1 hour)
- [ ] Write tests for edge cases (3 hours)
- [ ] Add JSDoc comments (1 hour)
- [ ] Refactor into smaller components (4 hours)
- [ ] Create Storybook stories (2 hours)

**Total Estimated Effort**: 14 hours
```

## Usage Examples

```bash
# Review a component file
/component-review src/components/Button/index.tsx

# Review entire component directory
/component-review src/components/Dashboard

# Review a page component
/component-review src/pages/Home.tsx
```

## Delegation Pattern

```typescript
// Use Task tool to delegate to code-quality-reviewer
task: {
  agent: "code-quality-reviewer",
  prompt: `Perform comprehensive quality review of component at ${componentPath}. Analyze code quality, React patterns, TypeScript, performance, accessibility, testing, and documentation.`,
  model: "opus",  // Use opus for thorough analysis
  extended_thinking: true  // Enable deep analysis
}
```

## Review Criteria

### Scoring System
- **90-100**: Excellent - Production-ready, best practices followed
- **75-89**: Good - Minor improvements needed
- **60-74**: Fair - Several issues to address
- **45-59**: Poor - Significant refactoring required
- **0-44**: Critical - Not production-ready

### Code Quality Factors
- Maintainability Index
- Cyclomatic Complexity
- Lines of Code per function
- Code duplication percentage
- ESLint warnings/errors

## Tools the Agent May Use

- Static code analysis
- TypeScript compiler checks
- React DevTools profiler analysis
- Bundle size analysis
- Accessibility testing (@axe-core)
- Test coverage reports
- Dependency analysis

After review completion:
1. Save the detailed report
2. Provide executive summary to user
3. Highlight top 3 critical issues
4. Estimate effort for fixes
5. Offer to fix issues if requested
