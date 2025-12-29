# Component Testing with Chakra UI

This skill activates when writing tests for Chakra UI components, setting up React Testing Library with Chakra, testing user interactions, handling async operations, or ensuring accessibility with jest-axe. It provides comprehensive guidance on testing patterns that work with both Vitest and Jest, supporting modern React testing practices.

## Test Setup

### Installation and Configuration

Install required testing dependencies:

```bash
# Core testing libraries
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event

# For accessibility testing
npm install --save-dev jest-axe

# For Vitest (alternative to Jest)
npm install --save-dev vitest jsdom @vitest/ui
```

### Vitest Configuration

Configure Vitest for React component testing:

```typescript
// vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test/setup.ts',
    css: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'src/test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
    },
  },
});
```

### Jest Configuration

Configure Jest for React component testing:

```javascript
// jest.config.js
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
  },
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: {
        jsx: 'react-jsx',
      },
    }],
  },
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/test/**',
  ],
};
```

### Test Setup File

Create a shared setup file for test utilities:

```typescript
// src/test/setup.ts
import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest'; // or from '@jest/globals' for Jest

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock matchMedia (required for responsive components)
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});

// Mock IntersectionObserver (for lazy loading components)
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  takeRecords() {
    return [];
  }
  unobserve() {}
} as any;

// Mock ResizeObserver (for responsive components)
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
} as any;
```

### Custom Render Function

Create a custom render function with ChakraProvider:

```typescript
// src/test/utils.tsx
import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../theme'; // Your custom theme

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: any;
  colorMode?: 'light' | 'dark';
}

// Custom render function
export function renderWithChakra(
  ui: ReactElement,
  { theme: customTheme, colorMode = 'light', ...options }: CustomRenderOptions = {}
) {
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <ChakraProvider theme={customTheme || theme}>
      {children}
    </ChakraProvider>
  );

  return render(ui, { wrapper: Wrapper, ...options });
}

// Export everything from React Testing Library
export * from '@testing-library/react';

// Override render method
export { renderWithChakra as render };
```

## Testing Component Rendering

### Basic Component Tests

Test component rendering and props:

```typescript
import { describe, it, expect } from 'vitest'; // or from '@jest/globals'
import { render, screen } from '../test/utils';
import { Button } from '@chakra-ui/react';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click me</Button>);

    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<Button size="sm">Small</Button>);

    expect(screen.getByRole('button')).toHaveClass('chakra-button');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with custom color scheme', () => {
    render(<Button colorScheme="blue">Blue Button</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
  });

  it('renders disabled state', () => {
    render(<Button isDisabled>Disabled</Button>);

    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders loading state', () => {
    render(<Button isLoading>Loading</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading');
  });
});
```

### Testing Custom Components

Test custom Chakra-based components:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import { Box, Heading, Text } from '@chakra-ui/react';

// Custom Card component
function Card({ title, description }: { title: string; description: string }) {
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      p={6}
      shadow="md"
      data-testid="card"
    >
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color="gray.600">{description}</Text>
    </Box>
  );
}

describe('Card Component', () => {
  it('renders title and description', () => {
    render(
      <Card
        title="Test Card"
        description="This is a test description"
      />
    );

    expect(screen.getByRole('heading', { name: /test card/i })).toBeInTheDocument();
    expect(screen.getByText(/this is a test description/i)).toBeInTheDocument();
  });

  it('applies correct styles', () => {
    render(<Card title="Styled Card" description="Description" />);

    const card = screen.getByTestId('card');
    expect(card).toHaveStyle({
      borderRadius: expect.any(String),
    });
  });
});
```

## Testing User Interactions

### Click Events

Test click handlers and user interactions:

```typescript
import { describe, it, expect, vi } from 'vitest'; // or jest.fn() for Jest
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { Button } from '@chakra-ui/react';

describe('Click Events', () => {
  it('calls onClick handler when clicked', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn(); // or jest.fn()

    render(<Button onClick={handleClick}>Click me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    await user.click(button);

    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('does not call onClick when disabled', async () => {
    const user = userEvent.setup();
    const handleClick = vi.fn();

    render(
      <Button isDisabled onClick={handleClick}>
        Disabled
      </Button>
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
  });

  it('handles double click', async () => {
    const user = userEvent.setup();
    const handleDoubleClick = vi.fn();

    render(<Button onDoubleClick={handleDoubleClick}>Double Click</Button>);

    const button = screen.getByRole('button');
    await user.dblClick(button);

    expect(handleDoubleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Form Interactions

Test form inputs and submission:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import userEvent from '@testing-library/user-event';
import {
  FormControl,
  FormLabel,
  Input,
  Button,
  FormErrorMessage,
} from '@chakra-ui/react';

function LoginForm({ onSubmit }: { onSubmit: (data: any) => void }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('All fields are required');
      return;
    }
    onSubmit({ email, password });
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormControl isInvalid={!!error}>
        <FormLabel>Email</FormLabel>
        <Input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </FormControl>

      <FormControl isInvalid={!!error}>
        <FormLabel>Password</FormLabel>
        <Input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        {error && <FormErrorMessage>{error}</FormErrorMessage>}
      </FormControl>

      <Button type="submit">Submit</Button>
    </form>
  );
}

describe('LoginForm', () => {
  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
    const submitButton = screen.getByRole('button', { name: /submit/i });

    await user.type(emailInput, 'test@example.com');
    await user.type(passwordInput, 'password123');
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith({
      email: 'test@example.com',
      password: 'password123',
    });
  });

  it('shows error for empty fields', async () => {
    const user = userEvent.setup();
    const handleSubmit = vi.fn();

    render(<LoginForm onSubmit={handleSubmit} />);

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    expect(screen.getByText(/all fields are required/i)).toBeInTheDocument();
    expect(handleSubmit).not.toHaveBeenCalled();
  });
});
```

### Keyboard Navigation

Test keyboard interactions:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import userEvent from '@testing-library/user-event';
import { Button, useDisclosure, Modal, ModalContent } from '@chakra-ui/react';

function ModalExample() {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <Button onClick={onOpen}>Open Modal</Button>
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalContent>
          <Button onClick={onClose}>Close</Button>
        </ModalContent>
      </Modal>
    </>
  );
}

describe('Keyboard Navigation', () => {
  it('closes modal on Escape key', async () => {
    const user = userEvent.setup();

    render(<ModalExample />);

    const openButton = screen.getByRole('button', { name: /open modal/i });
    await user.click(openButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('navigates through buttons with Tab', async () => {
    const user = userEvent.setup();

    render(
      <>
        <Button>First</Button>
        <Button>Second</Button>
        <Button>Third</Button>
      </>
    );

    const first = screen.getByRole('button', { name: /first/i });
    const second = screen.getByRole('button', { name: /second/i });

    first.focus();
    expect(first).toHaveFocus();

    await user.tab();
    expect(second).toHaveFocus();
  });
});
```

## Async Testing

### Testing Async State Updates

Test components with async operations:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { Button, Spinner, Text } from '@chakra-ui/react';

function AsyncDataComponent() {
  const [data, setData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/data');
      const result = await response.json();
      setData(result.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={fetchData}>Fetch Data</Button>
      {loading && <Spinner />}
      {data && <Text>{data}</Text>}
    </div>
  );
}

describe('AsyncDataComponent', () => {
  it('fetches and displays data', async () => {
    const user = userEvent.setup();

    // Mock fetch
    global.fetch = vi.fn(() =>
      Promise.resolve({
        json: () => Promise.resolve({ message: 'Hello from API' }),
      })
    ) as any;

    render(<AsyncDataComponent />);

    const button = screen.getByRole('button', { name: /fetch data/i });
    await user.click(button);

    // Wait for loading spinner
    expect(screen.getByRole('status')).toBeInTheDocument();

    // Wait for data to appear
    await waitFor(() => {
      expect(screen.getByText(/hello from api/i)).toBeInTheDocument();
    });

    // Spinner should be gone
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });

  it('handles fetch error', async () => {
    const user = userEvent.setup();

    global.fetch = vi.fn(() =>
      Promise.reject(new Error('API Error'))
    ) as any;

    render(<AsyncDataComponent />);

    const button = screen.getByRole('button');
    await user.click(button);

    await waitFor(() => {
      expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
  });
});
```

### Testing Toasts

Test Chakra's toast notifications:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '../test/utils';
import { Button, useToast } from '@chakra-ui/react';

function ToastExample() {
  const toast = useToast();

  const showToast = () => {
    toast({
      title: 'Success',
      description: 'Operation completed',
      status: 'success',
      duration: 3000,
    });
  };

  return <Button onClick={showToast}>Show Toast</Button>;
}

describe('Toast', () => {
  it('displays toast on button click', async () => {
    const user = userEvent.setup();

    render(<ToastExample />);

    const button = screen.getByRole('button', { name: /show toast/i });
    await user.click(button);

    await waitFor(() => {
      expect(screen.getByText(/success/i)).toBeInTheDocument();
      expect(screen.getByText(/operation completed/i)).toBeInTheDocument();
    });
  });
});
```

## Mocking Chakra Components

### Mocking useColorMode

Mock color mode for testing:

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../test/utils';
import * as ChakraUI from '@chakra-ui/react';

// Mock useColorMode
vi.spyOn(ChakraUI, 'useColorMode').mockImplementation(() => ({
  colorMode: 'dark',
  toggleColorMode: vi.fn(),
  setColorMode: vi.fn(),
}));

describe('Dark Mode Component', () => {
  it('renders with dark mode styles', () => {
    function DarkModeComponent() {
      const { colorMode } = ChakraUI.useColorMode();
      const bg = colorMode === 'dark' ? 'gray.800' : 'white';

      return <ChakraUI.Box bg={bg}>Content</ChakraUI.Box>;
    }

    render(<DarkModeComponent />);
    // Test dark mode specific behavior
  });
});
```

### Mocking useBreakpointValue

Mock responsive hooks:

```typescript
import { describe, it, expect, vi } from 'vitest';
import * as ChakraUI from '@chakra-ui/react';

vi.spyOn(ChakraUI, 'useBreakpointValue').mockReturnValue('md');

describe('Responsive Component', () => {
  it('renders mobile layout', () => {
    // Override for this test
    vi.spyOn(ChakraUI, 'useBreakpointValue').mockReturnValue('base');

    // Test mobile-specific rendering
  });
});
```

## Accessibility Testing

### Testing with jest-axe

Test for accessibility violations:

```typescript
import { describe, it, expect } from 'vitest';
import { render } from '../test/utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import { FormControl, FormLabel, Input } from '@chakra-ui/react';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('form has no accessibility violations', async () => {
    const { container } = render(
      <FormControl>
        <FormLabel>Email</FormLabel>
        <Input type="email" />
      </FormControl>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('button has no accessibility violations', async () => {
    const { container } = render(
      <Button>Click me</Button>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing ARIA Attributes

Test proper ARIA implementation:

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '../test/utils';
import { IconButton } from '@chakra-ui/react';
import { CloseIcon } from '@chakra-ui/icons';

describe('ARIA Attributes', () => {
  it('icon button has aria-label', () => {
    render(
      <IconButton
        aria-label="Close dialog"
        icon={<CloseIcon />}
      />
    );

    const button = screen.getByRole('button', { name: /close dialog/i });
    expect(button).toHaveAttribute('aria-label', 'Close dialog');
  });

  it('loading button has aria-busy', () => {
    render(<Button isLoading>Submit</Button>);

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('data-loading');
  });
});
```

Use these testing patterns to ensure your Chakra UI components work correctly, handle user interactions properly, and remain accessible to all users.
