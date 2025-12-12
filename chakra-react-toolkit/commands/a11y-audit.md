---
name: a11y-audit
description: Run accessibility audit on components (WCAG 2.1 AA checks)
argument-hint: "[component-path] [--strict]"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# Accessibility Audit Command

When this command is invoked, perform a comprehensive accessibility audit on the specified component or directory of components against WCAG 2.1 AA standards.

## Execution Steps

1. **Locate Target Components**
   - If a specific file path is provided, audit that component
   - If a directory is provided, find all .tsx/.jsx components using Glob
   - Default to scanning the entire src/components directory if no path specified

2. **Read and Analyze Each Component**
   - Parse the component code for accessibility issues
   - Check for proper semantic HTML usage
   - Verify ARIA attributes are used correctly
   - Ensure keyboard navigation support
   - Validate color contrast requirements (if theme colors are used)

3. **Generate Detailed Audit Report**
   - Create a markdown report with severity levels (Critical, Warning, Info)
   - Include code snippets showing problematic areas
   - Provide actionable recommendations with code examples
   - Calculate an overall accessibility score

## WCAG 2.1 AA Audit Criteria

### Critical Issues (Level A - Must Fix)
- [ ] Missing alt text on images
- [ ] Form inputs without associated labels
- [ ] Buttons/links without accessible text
- [ ] Keyboard traps (elements that can't be exited with keyboard)
- [ ] Missing or incorrect heading hierarchy
- [ ] Color used as the only visual means of conveying information
- [ ] Insufficient color contrast (< 4.5:1 for normal text, < 3:1 for large text)

### Warning Issues (Level AA - Should Fix)
- [ ] Missing focus indicators
- [ ] Non-descriptive link text ("click here", "read more")
- [ ] Missing landmark regions (header, main, nav, footer)
- [ ] Redundant or improper ARIA usage
- [ ] Missing skip navigation links
- [ ] Form validation without accessible error messages
- [ ] Missing aria-live regions for dynamic content

### Informational (Best Practices)
- [ ] Could use semantic HTML instead of divs
- [ ] Opportunities to enhance screen reader experience
- [ ] Potential keyboard navigation improvements
- [ ] Consider adding loading states with aria-busy

## Chakra UI Specific Checks

```typescript
// Check for proper Chakra accessibility props
interface ChakraA11yPatterns {
  // Button accessibility
  hasAriaLabel: boolean;          // <Button aria-label="...">
  hasVisibleText: boolean;        // <Button>Text</Button>
  hasIconButton: boolean;         // <IconButton aria-label="..." />

  // Form accessibility
  formControlId: boolean;         // <FormControl id="...">
  formLabelHtmlFor: boolean;      // <FormLabel htmlFor="...">
  formHelperText: boolean;        // <FormHelperText>
  formErrorMessage: boolean;      // <FormErrorMessage>

  // Modal/Drawer accessibility
  hasModalHeader: boolean;        // <ModalHeader>
  hasCloseButton: boolean;        // <ModalCloseButton>

  // Image accessibility
  imageAlt: boolean;              // <Image alt="..." />

  // Link accessibility
  isExternal: boolean;            // <Link isExternal> adds proper attributes
}
```

## Analysis Patterns

### Pattern 1: Icon-Only Buttons
```typescript
// BAD - No accessible label
<IconButton icon={<DeleteIcon />} />

// GOOD - Has aria-label
<IconButton
  icon={<DeleteIcon />}
  aria-label="Delete item"
/>
```

### Pattern 2: Form Labels
```typescript
// BAD - No association
<FormLabel>Email</FormLabel>
<Input type="email" />

// GOOD - Proper association
<FormControl id="email">
  <FormLabel htmlFor="email">Email</FormLabel>
  <Input id="email" type="email" />
</FormControl>
```

### Pattern 3: Modal/Drawer Headings
```typescript
// BAD - No heading for screen readers
<Modal>
  <ModalContent>
    <Text fontSize="xl">Settings</Text>
  </ModalContent>
</Modal>

// GOOD - Proper modal structure
<Modal>
  <ModalContent>
    <ModalHeader>Settings</ModalHeader>
    <ModalCloseButton />
    <ModalBody>...</ModalBody>
  </ModalContent>
</Modal>
```

### Pattern 4: Color Contrast
```typescript
// Check theme token usage
// BAD - Low contrast
<Text color="gray.400" bg="gray.100">Low contrast text</Text>

// GOOD - Sufficient contrast
<Text color="gray.700" bg="white">High contrast text</Text>
```

## Output Format

Generate a markdown report saved as `a11y-audit-report-[timestamp].md`:

```markdown
# Accessibility Audit Report

**Generated:** [timestamp]
**Components Audited:** [count]
**Overall Score:** [percentage] / 100

## Summary
- Critical Issues: [count]
- Warnings: [count]
- Informational: [count]

## Critical Issues

### [ComponentName.tsx]
**Line [X]:** Missing aria-label on icon button
```tsx
// Current code
<IconButton icon={<CloseIcon />} onClick={onClose} />

// Recommended fix
<IconButton
  icon={<CloseIcon />}
  aria-label="Close dialog"
  onClick={onClose}
/>
```

## Warnings
[Similar format for warnings]

## Best Practices
[Similar format for info items]

## Next Steps
1. Run `claude /a11y-fix [component-path]` to auto-fix common issues
2. Run `claude /test-a11y [component-path]` to generate accessibility tests
3. Manually review and fix complex issues listed above
```

## Usage Examples

```bash
# Audit a specific component
claude /a11y-audit src/components/UserProfile.tsx

# Audit all components in a directory
claude /a11y-audit src/components/forms

# Strict mode (fail on warnings)
claude /a11y-audit src/components --strict

# Audit entire component library
claude /a11y-audit
```

## Integration with Chakra UI

When analyzing Chakra components, leverage built-in accessibility features:
- Chakra's FormControl automatically manages IDs and associations
- Modal, Drawer, AlertDialog have built-in focus management
- Menu, Popover, Tooltip use proper ARIA attributes
- Ensure these are used correctly rather than bypassed

## Color Contrast Validation

If --strict flag is used, check against theme tokens:

```typescript
// Extract color values from theme
const contrastChecks = [
  { fg: 'gray.600', bg: 'white', ratio: 4.5 },
  { fg: 'blue.500', bg: 'blue.50', ratio: 3.2 }, // FAIL
];

// Report contrast failures with suggestions
```
