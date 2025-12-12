---
name: test-a11y
description: Generate accessibility tests using jest-axe or vitest-axe
argument-hint: "[component-path] [--framework=vitest|jest]"
allowed-tools: ["Read", "Write", "Glob", "Grep", "Bash"]
---

# Accessibility Test Generator

When this command is invoked, generate comprehensive accessibility tests for the specified component(s) using jest-axe or vitest-axe to ensure WCAG compliance.

## Execution Steps

1. **Analyze Target Component**
   - Read the component file to understand its structure
   - Identify interactive elements (buttons, forms, links, modals)
   - Detect Chakra UI components that need accessibility testing
   - Parse props to understand component variants and states

2. **Detect Test Framework**
   - Check package.json for vitest or jest dependency
   - Use --framework flag if provided, otherwise auto-detect
   - Set up appropriate test file naming (.test.tsx vs .spec.tsx)

3. **Generate Test File**
   - Create comprehensive accessibility test suite
   - Include tests for different component states
   - Test keyboard navigation
   - Test screen reader announcements
   - Test focus management
   - Include axe-core automated checks

4. **Install Dependencies if Needed**
   - Check if jest-axe or vitest-axe is installed
   - Offer to install missing dependencies
   - Configure axe if not already configured

## Test Template Structure

```typescript
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe'; // or vitest-axe
import userEvent from '@testing-library/user-event';
import { ChakraProvider } from '@chakra-ui/react';
import { ComponentName } from './ComponentName';

// Extend Jest/Vitest matchers
expect.extend(toHaveNoViolations);

/**
 * Wrapper component to provide Chakra context
 */
const renderWithChakra = (ui: React.ReactElement) => {
  return render(<ChakraProvider>{ui}</ChakraProvider>);
};

describe('ComponentName - Accessibility', () => {
  // Axe-core automated testing
  describe('Automated WCAG checks', () => {
    it('should have no accessibility violations in default state', async () => {
      const { container } = renderWithChakra(<ComponentName />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    // Test variants/states if component has them
    it('should have no violations when disabled', async () => {
      const { container } = renderWithChakra(<ComponentName isDisabled />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Keyboard navigation testing
  describe('Keyboard navigation', () => {
    it('should be keyboard accessible', async () => {
      const user = userEvent.setup();
      renderWithChakra(<ComponentName />);

      // Test tab navigation
      await user.tab();
      expect(screen.getByRole('button')).toHaveFocus();

      // Test activation with Enter/Space
      await user.keyboard('{Enter}');
      // Assert expected behavior
    });
  });

  // Screen reader testing
  describe('Screen reader support', () => {
    it('should have accessible labels', () => {
      renderWithChakra(<ComponentName />);

      // Check for accessible name
      expect(screen.getByRole('button')).toHaveAccessibleName('Expected Name');
    });

    it('should announce state changes', () => {
      renderWithChakra(<ComponentName />);

      // Check aria-live regions or role changes
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  // Focus management testing
  describe('Focus management', () => {
    it('should manage focus correctly in modal', async () => {
      const user = userEvent.setup();
      renderWithChakra(<ComponentName />);

      // Open modal
      await user.click(screen.getByRole('button', { name: /open/i }));

      // Focus should move to modal
      expect(screen.getByRole('dialog')).toContainElement(document.activeElement);

      // Escape should close and restore focus
      await user.keyboard('{Escape}');
      expect(screen.getByRole('button', { name: /open/i })).toHaveFocus();
    });
  });
});
```

## Component-Specific Test Patterns

### Pattern 1: Form Components

```typescript
describe('FormComponent - Accessibility', () => {
  it('should associate labels with inputs', () => {
    renderWithChakra(<FormComponent />);

    const input = screen.getByLabelText('Email address');
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should announce validation errors', async () => {
    const user = userEvent.setup();
    renderWithChakra(<FormComponent />);

    // Submit invalid form
    await user.click(screen.getByRole('button', { name: /submit/i }));

    // Error should be associated with input
    const input = screen.getByLabelText('Email address');
    expect(input).toHaveAccessibleDescription(/invalid email/i);
    expect(input).toHaveAttribute('aria-invalid', 'true');
  });

  it('should have no violations with error state', async () => {
    const { container } = renderWithChakra(<FormComponent error="Invalid email" />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Pattern 2: Modal/Dialog Components

```typescript
describe('ModalComponent - Accessibility', () => {
  it('should trap focus within modal', async () => {
    const user = userEvent.setup();
    renderWithChakra(<ModalComponent isOpen={true} />);

    const dialog = screen.getByRole('dialog');
    const focusableElements = dialog.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    // Tab through all elements
    for (let i = 0; i < focusableElements.length; i++) {
      await user.tab();
    }

    // Next tab should cycle back to first element
    await user.tab();
    expect(focusableElements[0]).toHaveFocus();
  });

  it('should have accessible heading', () => {
    renderWithChakra(<ModalComponent isOpen={true} />);

    expect(screen.getByRole('dialog')).toHaveAccessibleName();
    // Modal should have heading as accessible name
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });
});
```

### Pattern 3: Button Components

```typescript
describe('ButtonComponent - Accessibility', () => {
  it('should have accessible name for icon buttons', () => {
    renderWithChakra(<IconButton icon={<DeleteIcon />} aria-label="Delete item" />);

    const button = screen.getByRole('button', { name: /delete item/i });
    expect(button).toBeInTheDocument();
  });

  it('should indicate loading state to screen readers', () => {
    renderWithChakra(<ButtonComponent isLoading>Submit</ButtonComponent>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });
});
```

### Pattern 4: Menu/Dropdown Components

```typescript
describe('MenuComponent - Accessibility', () => {
  it('should support keyboard navigation through menu items', async () => {
    const user = userEvent.setup();
    renderWithChakra(<MenuComponent />);

    // Open menu
    const trigger = screen.getByRole('button');
    await user.click(trigger);

    // Menu should be visible
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();

    // Arrow down should move focus
    await user.keyboard('{ArrowDown}');
    const firstItem = screen.getAllByRole('menuitem')[0];
    expect(firstItem).toHaveFocus();

    // Enter should activate item
    const mockOnSelect = jest.fn();
    await user.keyboard('{Enter}');
    // Assert menu action occurred
  });
});
```

### Pattern 5: Data Table Components

```typescript
describe('TableComponent - Accessibility', () => {
  it('should have proper table structure', () => {
    renderWithChakra(<TableComponent data={mockData} />);

    const table = screen.getByRole('table');
    expect(table).toBeInTheDocument();

    // Should have column headers
    const columnHeaders = screen.getAllByRole('columnheader');
    expect(columnHeaders.length).toBeGreaterThan(0);

    // Should have rows
    const rows = screen.getAllByRole('row');
    expect(rows.length).toBeGreaterThan(1); // Header + data rows
  });

  it('should support sortable columns with screen reader announcements', () => {
    renderWithChakra(<TableComponent sortable />);

    const sortButton = screen.getByRole('button', { name: /sort by name/i });
    expect(sortButton).toHaveAttribute('aria-sort', 'none');
  });
});
```

## Axe-core Configuration

```typescript
/**
 * Custom axe configuration for Chakra UI components
 */
const axeConfig = {
  rules: {
    // Disable rules that conflict with Chakra's design system
    'color-contrast': { enabled: true }, // Keep enabled, but may need custom thresholds
    'landmark-one-main': { enabled: true },
    'page-has-heading-one': { enabled: false }, // Not always applicable in components
    'region': { enabled: false }, // Not always applicable in isolated components
  },
};

// Use in tests
const results = await axe(container, axeConfig);
```

## Test Utilities

```typescript
/**
 * Helper function to test keyboard navigation sequence
 */
async function testKeyboardNavigation(
  element: HTMLElement,
  keys: string[],
  expectedFocus: HTMLElement
) {
  const user = userEvent.setup();

  for (const key of keys) {
    await user.keyboard(key);
  }

  expect(expectedFocus).toHaveFocus();
}

/**
 * Helper to verify ARIA attributes
 */
function expectAccessibleElement(
  element: HTMLElement,
  attributes: {
    role?: string;
    label?: string;
    description?: string;
    expanded?: boolean;
  }
) {
  if (attributes.role) {
    expect(element).toHaveAttribute('role', attributes.role);
  }
  if (attributes.label) {
    expect(element).toHaveAccessibleName(attributes.label);
  }
  if (attributes.description) {
    expect(element).toHaveAccessibleDescription(attributes.description);
  }
  if (attributes.expanded !== undefined) {
    expect(element).toHaveAttribute('aria-expanded', String(attributes.expanded));
  }
}
```

## Package Installation

```typescript
// Check and install required dependencies
const requiredPackages = {
  vitest: ['vitest-axe', '@testing-library/react', '@testing-library/user-event'],
  jest: ['jest-axe', '@testing-library/react', '@testing-library/user-event', '@testing-library/jest-dom'],
};

// Generate installation command
function getInstallCommand(framework: 'vitest' | 'jest'): string {
  const packages = requiredPackages[framework];
  return `npm install --save-dev ${packages.join(' ')}`;
}
```

## Output Format

Generate test file at `[ComponentName].a11y.test.tsx`:

```typescript
// File header comment
/**
 * Accessibility tests for [ComponentName]
 *
 * Tests include:
 * - Automated WCAG 2.1 AA compliance (via axe-core)
 * - Keyboard navigation
 * - Screen reader support
 * - Focus management
 *
 * Generated by: claude /test-a11y
 * Framework: [vitest|jest]
 */

// Rest of test file...
```

## Usage Examples

```bash
# Generate accessibility tests for a component (auto-detect framework)
claude /test-a11y src/components/LoginForm.tsx

# Specify test framework
claude /test-a11y src/components/UserProfile.tsx --framework=vitest

# Generate tests for all components in directory
claude /test-a11y src/components/forms

# Generate and immediately run tests
claude /test-a11y src/components/Button.tsx && npm test Button.a11y.test
```

## Integration Notes

- Tests are generated in the same directory as the component
- Naming convention: `[ComponentName].a11y.test.tsx`
- Tests can be run independently or as part of the full test suite
- Chakra theme context is automatically provided via wrapper
- Works with both Vitest and Jest out of the box
