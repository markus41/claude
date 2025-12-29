---
name: analyze-performance
description: Bundle size analysis and Core Web Vitals performance check
argument-hint: [path]
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
---

# Performance Analysis Command

You are being invoked as the `/analyze-performance` slash command for the frontend-powerhouse plugin.

## Your Task

Analyze bundle size, Core Web Vitals, and overall performance metrics. Use the **performance-optimizer** agent with **ultrathink** mode for comprehensive analysis.

## Arguments

- **path** (optional): Path to analyze. Defaults to entire project

## Instructions

1. **Activate the performance-optimizer agent** via the Task tool with ultrathink enabled
2. The agent will analyze:
   - Bundle size (total, by route, by component)
   - Code splitting effectiveness
   - Lazy loading opportunities
   - Core Web Vitals (LCP, FID, CLS)
   - React rendering performance
   - Memory leaks and re-render issues
   - Asset optimization (images, fonts)
3. Generate performance report with recommendations
4. Identify performance bottlenecks and quick wins

## Performance Metrics Analyzed

### Bundle Analysis
- Total bundle size
- Largest dependencies
- Duplicate packages
- Tree-shaking opportunities
- Code splitting effectiveness

### Core Web Vitals
- **LCP** (Largest Contentful Paint): < 2.5s
- **FID** (First Input Delay): < 100ms
- **CLS** (Cumulative Layout Shift): < 0.1
- **TTFB** (Time to First Byte): < 800ms
- **FCP** (First Contentful Paint): < 1.8s

### React Performance
- Unnecessary re-renders
- Large component trees
- Expensive computations without memoization
- Context provider optimization

## Expected Output

A markdown report saved to `performance-analysis-{timestamp}.md` with:

```markdown
# Performance Analysis Report

**Date**: {timestamp}
**Path**: {path}
**Overall Score**: {score}/100

## Bundle Size Analysis

### Total Size
- Production build: {size} MB (gzipped: {gzipped} MB)
- **Target**: < 250 KB (gzipped)
- **Status**: ⚠️ Exceeds recommendation

### Largest Dependencies
1. react-dom: 130 KB
2. @chakra-ui/react: 85 KB
3. lodash: 72 KB ⚠️ Use lodash-es instead

## Core Web Vitals

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP    | 3.2s  | < 2.5s | ❌ Failing |
| FID    | 85ms  | < 100ms | ✅ Passing |
| CLS    | 0.05  | < 0.1  | ✅ Passing |

## Issues Found

### 1. [Critical] Large Bundle Size
- **Impact**: Slow initial load
- **Cause**: Entire lodash library imported
- **Fix**:
  ```tsx
  // Before
  import _ from 'lodash';

  // After
  import debounce from 'lodash-es/debounce';
  ```

## Recommendations

### Quick Wins (< 1 hour)
1. Replace lodash with lodash-es
2. Add lazy loading to routes
3. Optimize images with next/image

### Medium Effort (1-4 hours)
1. Implement code splitting for heavy components
2. Add React.memo to expensive components
3. Optimize Context providers

### Long Term (> 4 hours)
1. Migrate to newer bundler (Vite/Turbopack)
2. Implement virtual scrolling
3. Add service worker for caching
```

## Usage Examples

```bash
# Analyze entire project
/analyze-performance

# Analyze specific path
/analyze-performance src/components/Dashboard

# Analyze build output
/analyze-performance build/
```

## Delegation Pattern

```typescript
// Use Task tool with ultrathink for comprehensive analysis
task: {
  agent: "performance-optimizer",
  prompt: `Analyze performance and bundle size for ${path}. Provide detailed recommendations.`,
  model: "opus",  // Use opus for ultrathink
  extended_thinking: true
}
```

## Tools the Agent May Use

- Bundle analyzer (webpack-bundle-analyzer, @next/bundle-analyzer)
- Lighthouse CLI for Core Web Vitals
- React DevTools Profiler analysis
- Source map exploration for size analysis
- Static code analysis for optimization opportunities

After completion, save the report and provide an executive summary with top 3 critical issues and quick wins.
