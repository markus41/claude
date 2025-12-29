---
name: generate-tests
description: Create comprehensive test suite for component with multiple test types
argument-hint: component-path [test-types]
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - Bash
---

# Generate Tests Command

You are being invoked as the `/generate-tests` slash command for the frontend-powerhouse plugin.

## Your Task

Generate a comprehensive test suite for a component. Use the **frontend-test-generator** agent to create unit, integration, and/or e2e tests.

## Arguments

- **component-path** (required): Path to component file (e.g., `src/components/Button/index.tsx`)
- **test-types** (optional): Comma-separated list of test types - unit|integration|e2e|all. Defaults to "all"

## Instructions

1. **Read the component file** to understand its structure, props, and behavior
2. **Activate the frontend-test-generator agent** via the Task tool
3. Pass component details and test types to the agent
4. The agent will create:
   - **Unit tests**: Component rendering, props, variants, edge cases
   - **Integration tests**: User interactions, form submissions, API calls
   - **E2E tests**: Full user flows with Playwright
5. Follow testing best practices (React Testing Library, user-centric tests)

## Test Types

### Unit Tests (React Testing Library + Vitest/Jest)
- Component renders correctly
- Props are applied properly
- Variants render expected styles
- Event handlers are called
- Edge cases and error states

### Integration Tests
- Multi-component interactions
- Form submission flows
- API integration with MSW
- State management integration
- Navigation flows

### E2E Tests (Playwright)
- Complete user journeys
- Cross-browser testing
- Visual regression testing
- Performance testing

## Expected Output Structure

```
src/components/{ComponentName}/
├── __tests__/
│   ├── {ComponentName}.test.tsx        # Unit tests
│   ├── {ComponentName}.integration.test.tsx  # Integration tests
│   └── {ComponentName}.e2e.test.ts     # E2E tests
└── __mocks__/
    └── handlers.ts                      # MSW handlers for API mocking
```

## Test Quality Requirements

- **Coverage**: Minimum 80% code coverage
- **User-centric**: Test behavior, not implementation
- **Accessibility**: Test ARIA attributes and keyboard navigation
- **Readable**: Descriptive test names using Given-When-Then pattern
- **Fast**: Unit tests should run in milliseconds
- **Isolated**: No test dependencies, proper cleanup

## Usage Examples

```bash
# Generate all test types
/generate-tests src/components/Button/index.tsx

# Generate only unit tests
/generate-tests src/components/LoginForm/index.tsx unit

# Generate unit and integration tests
/generate-tests src/components/Dashboard/index.tsx unit,integration

# Generate only e2e tests
/generate-tests src/pages/checkout.tsx e2e
```

## Example Test Output

```tsx
// Unit test example
describe('Button', () => {
  it('should render children text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);

    await userEvent.click(screen.getByRole('button'));

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when isDisabled prop is true', () => {
    render(<Button isDisabled>Click me</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
  });
});
```

## Delegation Pattern

```typescript
// Use Task tool to delegate to frontend-test-generator
task: {
  agent: "frontend-test-generator",
  prompt: `Generate ${testTypes} tests for component at ${componentPath}`,
  model: "sonnet"
}
```

## Testing Libraries Used

- **React Testing Library**: User-centric component testing
- **Vitest/Jest**: Test runner and assertions
- **@testing-library/user-event**: User interaction simulation
- **MSW**: API mocking for integration tests
- **Playwright**: E2E testing framework
- **@axe-core/react**: Accessibility testing

After tests are generated, run them to ensure they pass and report coverage statistics.
