# /quick-fix - Rapid Issue Identification & Fix Generation

## Description
Quickly identify and generate fixes for common code issues, bugs, and warnings. Scans codebase for errors and provides targeted solutions.

## Usage
```bash
/quick-fix [scope] [severity]
```

## Parameters
- **scope**: `all` | `current` | `staged` | `filename` (default: `current`)
- **severity**: `critical` | `high` | `medium` | `low` | `all` (default: `all`)

## Examples

### Scan current file for critical issues
```bash
/quick-fix current critical
```

### Scan all staged changes for high severity issues
```bash
/quick-fix staged high
```

### Scan entire project
```bash
/quick-fix all
```

### Fix specific file
```bash
/quick-fix src/components/Button.tsx
```

## Actions Performed
1. **Issue Detection**: Identifies syntax errors, linting violations, type errors
2. **Impact Analysis**: Determines severity and affected components
3. **Solution Generation**: Proposes fixes with code examples
4. **Diff Preview**: Shows before/after changes
5. **Apply Option**: Automatically applies fixes if confirmed

## Output Format
```
ISSUES FOUND: 5
━━━━━━━━━━━━━━━━━━━━━━━━

[CRITICAL] src/api.ts:42
Unhandled Promise rejection
Fix: Add .catch() handler
Preview: [Apply] [Skip] [Edit]

[HIGH] src/utils.ts:18
Type mismatch: string | undefined
Fix: Add null check
Preview: [Apply] [Skip] [Edit]
```

## Configuration
- Auto-apply fixes for low severity issues
- Preserve code style and formatting
- Create backup before batch changes
- Link fixes to related issues/PRs

## Related Commands
- `/test` - Run tests after applying fixes
- `/review` - Review code before committing
- `/optimize-code` - Optimize after fixing
