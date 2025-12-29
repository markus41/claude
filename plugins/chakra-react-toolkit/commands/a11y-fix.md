---
name: a11y-fix
description: Auto-fix common accessibility issues in components
argument-hint: "[component-path] [--dry-run]"
allowed-tools: ["Read", "Write", "Edit", "Glob", "Grep"]
---

# Accessibility Auto-Fix Command

When this command is invoked, automatically fix common accessibility issues in the specified component(s). This command handles pattern-based fixes that don't require subjective decisions.

## Execution Steps

1. **Locate Target Components**
   - Read the specified component file(s)
   - If directory provided, find all .tsx/.jsx files with Glob
   - Parse component structure to identify fixable issues

2. **Identify Auto-Fixable Issues**
   - Scan for patterns that have deterministic fixes
   - Build a list of fixes to apply with their locations
   - Validate that fixes won't break existing functionality

3. **Apply Fixes**
   - Use Edit tool to make precise changes
   - Preserve existing code style and formatting
   - Add explanatory comments where helpful
   - If --dry-run flag is set, only report what would be fixed

4. **Generate Fix Report**
   - List all applied fixes with before/after code
   - Report any issues that require manual intervention
   - Provide next steps for remaining accessibility improvements

## Auto-Fixable Patterns

### Fix 1: Icon-Only Buttons Without Labels

```typescript
// BEFORE
<IconButton icon={<DeleteIcon />} onClick={handleDelete} />

// AFTER (infer label from handler name or nearby context)
<IconButton
  icon={<DeleteIcon />}
  aria-label="Delete"
  onClick={handleDelete}
/>
```

Strategy: Extract verb from handler name (handleDelete → "Delete", onClose → "Close")

### Fix 2: Images Without Alt Text

```typescript
// BEFORE
<Image src={user.avatar} />

// AFTER (use prop name or add generic alt)
<Image src={user.avatar} alt={user.name || "User avatar"} />
```

Strategy: Look for nearby variables (user.name, product.title) or use descriptive generic

### Fix 3: Form Inputs Without Labels

```typescript
// BEFORE
<Input placeholder="Enter email" />

// AFTER
<FormControl>
  <FormLabel>Email</FormLabel>
  <Input placeholder="Enter email" />
</FormControl>
```

Strategy: Wrap in FormControl, convert placeholder to label

### Fix 4: Missing Form Control IDs

```typescript
// BEFORE
<FormControl>
  <FormLabel>Username</FormLabel>
  <Input />
</FormControl>

// AFTER
<FormControl id="username">
  <FormLabel htmlFor="username">Username</FormLabel>
  <Input id="username" />
</FormControl>
```

Strategy: Generate ID from label text (lowercase, hyphenated)

### Fix 5: Links Without Meaningful Text

```typescript
// BEFORE
<Link href="/docs">Click here</Link>

// AFTER (enhance with context)
<Link href="/docs">View documentation</Link>
```

Strategy: Look for nearby headings or text to create meaningful link text

### Fix 6: Decorative Images

```typescript
// BEFORE
<Image src="/decorative-pattern.svg" />

// AFTER
<Image src="/decorative-pattern.svg" alt="" role="presentation" />
```

Strategy: Images with "decorative", "pattern", "background" in filename get empty alt

### Fix 7: Missing Modal Headers

```typescript
// BEFORE
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalBody>Content here</ModalBody>
  </ModalContent>
</Modal>

// AFTER
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalContent>
    <ModalHeader>Dialog</ModalHeader>
    <ModalCloseButton />
    <ModalBody>Content here</ModalBody>
  </ModalContent>
</Modal>
```

Strategy: Add generic header and close button if missing

### Fix 8: Heading Hierarchy Gaps

```typescript
// BEFORE
<Box>
  <Heading as="h1">Page Title</Heading>
  <Heading as="h3">Section</Heading> {/* Skip h2 */}
</Box>

// AFTER
<Box>
  <Heading as="h1">Page Title</Heading>
  <Heading as="h2">Section</Heading>
</Box>
```

Strategy: Ensure no heading levels are skipped

### Fix 9: Missing Focus Styles

```typescript
// BEFORE
<Button
  _focus={{}}  // Focus styles disabled
>
  Submit
</Button>

// AFTER
<Button
  _focus={{
    boxShadow: 'outline',
    borderColor: 'blue.500'
  }}
>
  Submit
</Button>
```

Strategy: Restore default Chakra focus styles when explicitly removed

### Fix 10: List Items Outside Lists

```typescript
// BEFORE
<Box>
  <li>Item 1</li>
  <li>Item 2</li>
</Box>

// AFTER
<List>
  <ListItem>Item 1</ListItem>
  <ListItem>Item 2</ListItem>
</List>
```

Strategy: Wrap orphaned <li> elements in proper list structure

## TypeScript Interfaces for Fix Tracking

```typescript
interface AccessibilityFix {
  type: 'icon-button-label' | 'image-alt' | 'form-label' | 'form-id' |
        'link-text' | 'modal-header' | 'heading-hierarchy' | 'focus-style' |
        'list-structure' | 'decorative-image';
  location: {
    file: string;
    line: number;
    column: number;
  };
  before: string;
  after: string;
  confidence: 'high' | 'medium' | 'low'; // How certain the fix is correct
  requiresReview: boolean;
}

interface FixReport {
  timestamp: string;
  filesModified: number;
  fixesApplied: AccessibilityFix[];
  manualReviewRequired: {
    issue: string;
    location: string;
    suggestion: string;
  }[];
  summary: {
    total: number;
    byType: Record<string, number>;
  };
}
```

## Fix Application Logic

```typescript
// Pseudocode for fix application
async function applyAccessibilityFixes(componentPath: string, dryRun: boolean) {
  const content = await readFile(componentPath);
  const fixes: AccessibilityFix[] = [];

  // 1. Detect fixable patterns
  fixes.push(...detectIconButtonIssues(content));
  fixes.push(...detectImageAltIssues(content));
  fixes.push(...detectFormLabelIssues(content));
  fixes.push(...detectModalHeaderIssues(content));

  // 2. Sort fixes by confidence and line number (bottom to top to preserve positions)
  const sortedFixes = fixes
    .filter(f => f.confidence === 'high')
    .sort((a, b) => b.location.line - a.location.line);

  // 3. Apply fixes (or report in dry-run mode)
  if (dryRun) {
    return generateDryRunReport(sortedFixes);
  } else {
    for (const fix of sortedFixes) {
      await applyFix(componentPath, fix);
    }
  }

  // 4. Generate report
  return generateFixReport(fixes);
}
```

## Import Addition Strategy

When fixes require new Chakra imports:

```typescript
// Detect existing Chakra imports
import { Button, Box } from '@chakra-ui/react';

// If FormControl is needed but not imported, add it
import { Button, Box, FormControl, FormLabel } from '@chakra-ui/react';
```

Strategy: Parse existing Chakra import, add missing components alphabetically

## Output Format

Generate a markdown report:

```markdown
# Accessibility Fixes Applied

**File:** src/components/UserProfile.tsx
**Timestamp:** [timestamp]
**Fixes Applied:** 5
**Manual Review Required:** 2

## Applied Fixes

### 1. Added aria-label to icon button (Line 45)
**Type:** icon-button-label
**Confidence:** High

```tsx
// Before
<IconButton icon={<EditIcon />} onClick={handleEdit} />

// After
<IconButton
  icon={<EditIcon />}
  aria-label="Edit profile"
  onClick={handleEdit}
/>
```

### 2. Added FormControl wrapper (Lines 67-71)
**Type:** form-label
**Confidence:** High

```tsx
// Before
<Input placeholder="Email address" />

// After
<FormControl id="email">
  <FormLabel htmlFor="email">Email address</FormLabel>
  <Input id="email" placeholder="Email address" />
</FormControl>
```

## Manual Review Required

### 1. Complex button without clear purpose (Line 89)
**Suggestion:** Add descriptive aria-label based on context

```tsx
// Current
<IconButton icon={<Icon />} />

// Needs manual review to determine appropriate label
// Consider: What does this button do in the context of UserProfile?
```

## Summary
- Icon button labels: 2 fixed
- Form labels: 2 fixed
- Modal headers: 1 fixed
- Requires manual review: 2 items

## Next Steps
1. Review the manual items above
2. Run `claude /test-a11y` to generate accessibility tests
3. Run `claude /a11y-audit` to verify all fixes
```

## Usage Examples

```bash
# Fix a specific component
claude /a11y-fix src/components/LoginForm.tsx

# Preview fixes without applying (dry run)
claude /a11y-fix src/components/LoginForm.tsx --dry-run

# Fix all components in directory
claude /a11y-fix src/components/forms

# Fix and immediately audit
claude /a11y-fix src/components/UserProfile.tsx && claude /a11y-audit src/components/UserProfile.tsx
```

## Safety Guardrails

1. **Never fix if uncertain**: Only apply fixes with high confidence
2. **Preserve functionality**: Don't remove props or change behavior
3. **Maintain style**: Match existing code formatting and conventions
4. **Add imports carefully**: Only add necessary Chakra components
5. **Backup recommendation**: Suggest user has git backup before running

## Error Handling

```typescript
// Handle edge cases gracefully
try {
  applyFix(componentPath, fix);
} catch (error) {
  reportManualReviewRequired({
    issue: `Could not automatically fix: ${fix.type}`,
    location: `${fix.location.file}:${fix.location.line}`,
    suggestion: 'Please review and fix manually',
    error: error.message
  });
}
```
