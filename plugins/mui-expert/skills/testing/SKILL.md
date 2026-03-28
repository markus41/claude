---
name: testing
description: Testing MUI components with React Testing Library — theme mocking, portal components, DataGrid, DatePicker, and accessibility testing
triggers:
  - testing
  - test
  - React Testing Library
  - jest
  - vitest
  - accessibility test
  - axe
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash
  - Write
  - Edit
globs:
  - "*.test.*"
  - "*.spec.*"
  - "**/tests/**"
  - "**/__tests__/**"
---

# Testing MUI Components

Comprehensive patterns for testing Material UI components with React Testing Library, covering theme integration, complex widgets, accessibility, and common pitfalls.

## 1. ThemeProvider Wrapper

MUI components rely on `ThemeProvider` for styling and behavior. Always wrap renders in your custom theme to get accurate test results.

### renderWithTheme Utility

```tsx
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme, Theme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { ReactElement } from 'react';

// Import your app's theme or create a default
const defaultTheme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  theme?: Theme;
}

export function renderWithTheme(
  ui: ReactElement,
  { theme = defaultTheme, ...options }: CustomRenderOptions = {},
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

// Re-export everything from RTL so tests import from one place
export * from '@testing-library/react';
export { renderWithTheme as render };
```

### Usage

```tsx
import { render, screen } from '../test-utils';
import { Button } from '@mui/material';

test('renders a primary button with theme colors', () => {
  render(<Button variant="contained" color="primary">Save</Button>);
  const button = screen.getByRole('button', { name: /save/i });
  expect(button).toBeInTheDocument();
  expect(button).toHaveClass('MuiButton-containedPrimary');
});
```

## 2. Portal Components

MUI Dialog, Menu, Popover, Snackbar, and Tooltip render into portals (appended to `document.body`). They are still found by RTL queries because RTL searches the entire document by default.

### Testing Dialog

```tsx
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
} from '@mui/material';
import { useState } from 'react';

function ConfirmDialog() {
  const [open, setOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Delete</Button>
      {confirmed && <span>Item deleted</span>}
      <Dialog open={open} onClose={() => setOpen(false)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>Are you sure you want to delete this item?</DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={() => { setConfirmed(true); setOpen(false); }}>
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

test('opens dialog, confirms, and shows result', async () => {
  const user = userEvent.setup();
  render(<ConfirmDialog />);

  // Dialog not visible yet
  expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

  // Open the dialog
  await user.click(screen.getByRole('button', { name: /delete/i }));

  // Dialog is now visible (portal renders to body, but RTL finds it)
  expect(screen.getByRole('dialog')).toBeInTheDocument();
  expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

  // Confirm
  await user.click(screen.getByRole('button', { name: /confirm/i }));

  // Dialog closed, result shown
  await waitFor(() => {
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
  expect(screen.getByText(/item deleted/i)).toBeInTheDocument();
});
```

### Testing Menu

```tsx
test('opens menu and selects an option', async () => {
  const user = userEvent.setup();
  const onSelect = vi.fn();

  render(
    <MenuExample onSelect={onSelect} />
  );

  // Open menu
  await user.click(screen.getByRole('button', { name: /options/i }));

  // Menu items are in a portal but queryable
  const menuItems = screen.getAllByRole('menuitem');
  expect(menuItems).toHaveLength(3);

  // Select an item
  await user.click(screen.getByRole('menuitem', { name: /edit/i }));

  expect(onSelect).toHaveBeenCalledWith('edit');
  // Menu closes after selection
  await waitFor(() => {
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });
});
```

### Testing Snackbar

```tsx
test('shows snackbar on action and auto-hides', async () => {
  const user = userEvent.setup();
  // Use fake timers for autoHideDuration
  vi.useFakeTimers({ shouldAdvanceTime: true });

  render(<SnackbarExample />);

  await user.click(screen.getByRole('button', { name: /save/i }));

  expect(screen.getByRole('alert')).toHaveTextContent(/saved successfully/i);

  // Advance past autoHideDuration (default 6000ms)
  vi.advanceTimersByTime(6500);

  await waitFor(() => {
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  vi.useRealTimers();
});
```

## 3. DataGrid Testing

MUI DataGrid renders asynchronously and uses virtualization. Always wait for rows to appear.

### Waiting for Rows

```tsx
import { render, screen, within, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { DataGrid, GridColDef } from '@mui/x-data-grid';

const columns: GridColDef[] = [
  { field: 'id', headerName: 'ID', width: 70 },
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'email', headerName: 'Email', width: 250 },
];

const rows = [
  { id: 1, name: 'Alice Johnson', email: 'alice@example.com' },
  { id: 2, name: 'Bob Smith', email: 'bob@example.com' },
  { id: 3, name: 'Charlie Brown', email: 'charlie@example.com' },
];

test('renders DataGrid with rows', async () => {
  render(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} />
    </div>
  );

  // DataGrid renders asynchronously - wait for rows
  await waitFor(() => {
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  // All rows present
  expect(screen.getByText('Bob Smith')).toBeInTheDocument();
  expect(screen.getByText('charlie@example.com')).toBeInTheDocument();
});
```

### Testing Sort

```tsx
test('sorts DataGrid by name column', async () => {
  const user = userEvent.setup();
  render(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} />
    </div>
  );

  await waitFor(() => {
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  // Click the Name column header to sort
  const nameHeader = screen.getByRole('columnheader', { name: /name/i });
  await user.click(nameHeader);

  // Verify sort indicator appears
  await waitFor(() => {
    expect(nameHeader).toHaveAttribute('aria-sort', 'ascending');
  });

  // Click again for descending
  await user.click(nameHeader);
  await waitFor(() => {
    expect(nameHeader).toHaveAttribute('aria-sort', 'descending');
  });
});
```

### Testing Filter

```tsx
test('filters DataGrid rows', async () => {
  const user = userEvent.setup();
  render(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid
        rows={rows}
        columns={columns}
        slots={{ toolbar: GridToolbar }}
      />
    </div>
  );

  await waitFor(() => {
    expect(screen.getByText('Alice Johnson')).toBeInTheDocument();
  });

  // Open filter panel via toolbar
  const filterButton = screen.getByRole('button', { name: /filter/i });
  await user.click(filterButton);

  // Select column, operator, enter value
  // (Filter panel renders in a portal)
  await waitFor(() => {
    expect(screen.getByRole('tooltip')).toBeInTheDocument();
  });
});
```

**Important DataGrid testing notes:**
- Always wrap DataGrid in a container with explicit `height` and `width` -- virtualization requires dimensions.
- Use `waitFor` for row assertions because DataGrid renders asynchronously.
- For large datasets, DataGrid virtualizes rows. Only visible rows are in the DOM. Scroll to test off-screen rows.
- `getByRole('grid')` finds the grid. Use `within(grid).getAllByRole('row')` for row queries.

## 4. DatePicker Testing

MUI X DatePicker requires `LocalizationProvider`. Extend `renderWithTheme` or wrap in tests.

```tsx
import { render, screen, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { useState } from 'react';

function DatePickerExample({ onChange }: { onChange: (date: dayjs.Dayjs | null) => void }) {
  const [value, setValue] = useState<dayjs.Dayjs | null>(null);
  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker
        label="Select date"
        value={value}
        onChange={(newValue) => {
          setValue(newValue);
          onChange(newValue);
        }}
      />
    </LocalizationProvider>
  );
}

test('opens calendar and selects a date', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(<DatePickerExample onChange={handleChange} />);

  // Open the calendar by clicking the calendar icon button
  const openButton = screen.getByRole('button', { name: /choose date/i });
  await user.click(openButton);

  // Calendar dialog opens in a portal
  await waitFor(() => {
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  // Select day 15 of the current month
  const day15 = screen.getByRole('gridcell', { name: '15' });
  await user.click(day15);

  // Calendar closes and callback fires
  await waitFor(() => {
    expect(handleChange).toHaveBeenCalled();
  });

  const selectedDate = handleChange.mock.calls[0][0];
  expect(selectedDate.date()).toBe(15);
});

test('types a date manually into the input', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(<DatePickerExample onChange={handleChange} />);

  const input = screen.getByRole('textbox', { name: /select date/i });
  await user.clear(input);
  await user.type(input, '03/15/2026');

  await waitFor(() => {
    expect(handleChange).toHaveBeenCalled();
  });
});
```

## 5. Autocomplete Testing

```tsx
import { render, screen, within, waitFor } from '../test-utils';
import userEvent from '@testing-library/user-event';
import { Autocomplete, TextField } from '@mui/material';

const options = ['JavaScript', 'TypeScript', 'Python', 'Rust', 'Go'];

function LanguageSelect({ onChange }: { onChange: (value: string | null) => void }) {
  return (
    <Autocomplete
      options={options}
      onChange={(_, value) => onChange(value)}
      renderInput={(params) => (
        <TextField {...params} label="Programming Language" />
      )}
    />
  );
}

test('opens dropdown and selects an option', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(<LanguageSelect onChange={handleChange} />);

  const input = screen.getByRole('combobox', { name: /programming language/i });

  // Click to open dropdown
  await user.click(input);

  // All options visible in the listbox (portal)
  const listbox = screen.getByRole('listbox');
  expect(within(listbox).getAllByRole('option')).toHaveLength(5);

  // Select TypeScript
  await user.click(screen.getByRole('option', { name: /typescript/i }));

  expect(handleChange).toHaveBeenCalledWith('TypeScript');

  // Dropdown closes
  await waitFor(() => {
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });
});

test('filters options by typing', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(<LanguageSelect onChange={handleChange} />);

  const input = screen.getByRole('combobox', { name: /programming language/i });

  // Type to filter
  await user.type(input, 'Typ');

  // Only TypeScript matches
  await waitFor(() => {
    const listbox = screen.getByRole('listbox');
    const visibleOptions = within(listbox).getAllByRole('option');
    expect(visibleOptions).toHaveLength(1);
    expect(visibleOptions[0]).toHaveTextContent('TypeScript');
  });

  // Press Enter to select the filtered result
  await user.keyboard('{Enter}');
  expect(handleChange).toHaveBeenCalledWith('TypeScript');
});

test('clears selected value', async () => {
  const user = userEvent.setup();
  const handleChange = vi.fn();

  render(<LanguageSelect onChange={handleChange} />);

  // Select an option first
  const input = screen.getByRole('combobox', { name: /programming language/i });
  await user.click(input);
  await user.click(screen.getByRole('option', { name: /python/i }));

  // Clear button appears
  const clearButton = screen.getByRole('button', { name: /clear/i });
  await user.click(clearButton);

  expect(handleChange).toHaveBeenLastCalledWith(null);
});
```

## 6. Accessibility Testing

### Setup jest-axe

```bash
npm install --save-dev jest-axe @types/jest-axe
# or
pnpm add -D jest-axe @types/jest-axe
```

### Configuration

```tsx
// jest.setup.ts or vitest.setup.ts
import 'jest-axe/extend-expect';
```

For Vitest, add a custom matcher declaration:

```ts
// vitest.d.ts
import 'vitest';
import type { AxeMatchers } from 'jest-axe';

declare module 'vitest' {
  interface Assertion extends AxeMatchers {}
  interface AsymmetricMatchersContaining extends AxeMatchers {}
}
```

### Testing with jest-axe

```tsx
import { render } from '../test-utils';
import { axe, toHaveNoViolations } from 'jest-axe';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';

expect.extend(toHaveNoViolations);

test('login form has no accessibility violations', async () => {
  const { container } = render(
    <form aria-label="Login form">
      <TextField
        label="Email"
        type="email"
        required
        fullWidth
        margin="normal"
      />
      <TextField
        label="Password"
        type="password"
        required
        fullWidth
        margin="normal"
      />
      <Button type="submit" variant="contained" fullWidth>
        Sign In
      </Button>
    </form>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});

test('select component is accessible', async () => {
  const { container } = render(
    <FormControl fullWidth>
      <InputLabel id="role-label">Role</InputLabel>
      <Select labelId="role-label" label="Role" value="">
        <MenuItem value="admin">Admin</MenuItem>
        <MenuItem value="editor">Editor</MenuItem>
        <MenuItem value="viewer">Viewer</MenuItem>
      </Select>
    </FormControl>
  );

  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### ARIA Role Testing

```tsx
test('navigation menu has correct ARIA roles', () => {
  render(<AppNavigation />);

  // Check navigation landmark
  expect(screen.getByRole('navigation')).toBeInTheDocument();

  // Menu items have correct roles
  const menuItems = screen.getAllByRole('menuitem');
  expect(menuItems).toHaveLength(4);

  // Active item is marked
  const activeItem = screen.getByRole('menuitem', { name: /dashboard/i });
  expect(activeItem).toHaveAttribute('aria-current', 'page');
});

test('dialog traps focus correctly', async () => {
  const user = userEvent.setup();
  render(<DialogExample />);

  await user.click(screen.getByRole('button', { name: /open/i }));

  const dialog = screen.getByRole('dialog');
  expect(dialog).toBeInTheDocument();

  // First focusable element in dialog should have focus
  await waitFor(() => {
    expect(document.activeElement).toBe(
      within(dialog).getByRole('button', { name: /cancel/i })
    );
  });

  // Tab cycles within dialog (focus trap)
  await user.tab();
  expect(document.activeElement).toBe(
    within(dialog).getByRole('button', { name: /confirm/i })
  );
});
```

## 7. Dark Mode Testing

```tsx
import { render, screen } from '../test-utils';
import { createTheme } from '@mui/material/styles';
import { Paper, Typography } from '@mui/material';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#90caf9' },
    background: {
      default: '#121212',
      paper: '#1e1e1e',
    },
  },
});

const lightTheme = createTheme({
  palette: {
    mode: 'light',
  },
});

test('renders correctly in dark mode', () => {
  const { container } = render(
    <Paper elevation={2}>
      <Typography variant="h6">Dashboard</Typography>
    </Paper>,
    { theme: darkTheme },
  );

  const paper = container.querySelector('.MuiPaper-root');
  const styles = getComputedStyle(paper!);

  // Dark mode paper uses dark background
  expect(styles.backgroundColor).toBe('rgb(30, 30, 30)');
});

test('renders correctly in light mode', () => {
  const { container } = render(
    <Paper elevation={2}>
      <Typography variant="h6">Dashboard</Typography>
    </Paper>,
    { theme: lightTheme },
  );

  const paper = container.querySelector('.MuiPaper-root');
  const styles = getComputedStyle(paper!);

  // Light mode paper uses white background
  expect(styles.backgroundColor).toBe('rgb(255, 255, 255)');
});

test('theme toggle switches between modes', async () => {
  const user = userEvent.setup();
  render(<ThemeToggleApp />);

  // Default: light mode
  expect(document.body).not.toHaveStyle({ backgroundColor: '#121212' });

  // Toggle to dark
  await user.click(screen.getByRole('button', { name: /dark mode/i }));

  await waitFor(() => {
    const app = screen.getByTestId('app-root');
    expect(app).toHaveClass('dark-mode');
  });
});
```

## 8. Responsive Testing

MUI uses `useMediaQuery` for responsive behavior. Mock it in tests.

### Mocking useMediaQuery

```tsx
import { render, screen } from '../test-utils';
import { useMediaQuery, useTheme } from '@mui/material';

// Mock approach 1: Mock the module
vi.mock('@mui/material', async () => {
  const actual = await vi.importActual('@mui/material');
  return {
    ...actual,
    useMediaQuery: vi.fn(),
  };
});

test('renders mobile layout on small screens', () => {
  // Configure mock to simulate mobile
  (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(true);

  render(<ResponsiveLayout />);

  // Mobile: hamburger menu visible, sidebar hidden
  expect(screen.getByRole('button', { name: /menu/i })).toBeInTheDocument();
  expect(screen.queryByRole('navigation')).not.toBeInTheDocument();
});

test('renders desktop layout on large screens', () => {
  (useMediaQuery as ReturnType<typeof vi.fn>).mockReturnValue(false);

  render(<ResponsiveLayout />);

  // Desktop: sidebar visible, no hamburger
  expect(screen.getByRole('navigation')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: /menu/i })).not.toBeInTheDocument();
});
```

### Alternative: matchMedia Mock

```tsx
// A reusable matchMedia mock for tests
function mockMatchMedia(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

test('shows compact table on mobile', () => {
  mockMatchMedia(true); // matches = true means small screen
  render(<DataTable data={sampleData} />);

  // Compact layout: cards instead of table
  expect(screen.queryByRole('table')).not.toBeInTheDocument();
  expect(screen.getAllByTestId('data-card')).toHaveLength(sampleData.length);
});
```

## 9. Snapshot Testing

**General guidance:** Avoid snapshot tests for MUI components in most cases. MUI generates dynamic class names and inline styles that change between versions, causing brittle snapshots that break on upgrades without real regressions.

### When snapshots are appropriate

- Custom SVG icons or static presentational components
- Generated CSS-in-JS output that must remain stable
- Regression testing for design tokens

### When to avoid

- Any component with MUI's generated `css-*` class names
- Components with dynamic content (dates, IDs)
- Complex interactive components (DataGrid, DatePicker)

### If you must snapshot

```tsx
test('icon component matches snapshot', () => {
  const { container } = render(<CustomLogo size="large" />);

  // Snapshot only the SVG, not MUI wrapper classes
  const svg = container.querySelector('svg');
  expect(svg).toMatchSnapshot();
});
```

### Prefer assertion-based tests instead

```tsx
// Instead of a snapshot, assert specific properties:
test('avatar renders initials for users without photos', () => {
  render(<UserAvatar user={{ name: 'Jane Doe', photo: null }} />);

  const avatar = screen.getByText('JD');
  expect(avatar).toBeInTheDocument();
  expect(avatar.closest('.MuiAvatar-root')).toHaveClass('MuiAvatar-colorDefault');
});
```

## 10. Common Gotchas

### act() Warnings

The `act()` warning appears when state updates happen outside of React's batching. Common causes and fixes:

```tsx
// PROBLEM: Async state update after unmount
test('loads data on mount', async () => {
  render(<UserProfile userId="1" />);

  // FIX: Wait for the loading to complete before test ends
  await waitFor(() => {
    expect(screen.getByText('Jane Doe')).toBeInTheDocument();
  });
});

// PROBLEM: Timer-based updates
test('debounced search', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

  render(<SearchBox />);

  await user.type(screen.getByRole('searchbox'), 'react');

  // Advance past debounce delay
  vi.advanceTimersByTime(300);

  await waitFor(() => {
    expect(screen.getByText(/results for "react"/i)).toBeInTheDocument();
  });

  vi.useRealTimers();
});
```

**Key rule:** When using `userEvent.setup()` with fake timers, pass `advanceTimers` so userEvent can coordinate with the fake clock.

### Debounced Inputs

MUI TextField with debounce (e.g., search fields) requires timer advancement:

```tsx
test('debounced TextField fires onChange after delay', async () => {
  vi.useFakeTimers({ shouldAdvanceTime: true });
  const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
  const onSearch = vi.fn();

  render(<DebouncedSearch onSearch={onSearch} debounceMs={500} />);

  await user.type(screen.getByRole('textbox'), 'hello');

  // Not called yet (within debounce window)
  expect(onSearch).not.toHaveBeenCalled();

  // Advance past debounce
  vi.advanceTimersByTime(500);

  await waitFor(() => {
    expect(onSearch).toHaveBeenCalledWith('hello');
  });

  vi.useRealTimers();
});
```

### Loading States and Skeletons

```tsx
test('shows skeleton while loading, then content', async () => {
  // Mock API with delayed response
  server.use(
    http.get('/api/users', async () => {
      await delay(100);
      return HttpResponse.json([{ id: 1, name: 'Alice' }]);
    }),
  );

  render(<UserList />);

  // Skeleton visible during loading
  expect(screen.getAllByTestId('skeleton-row')).toHaveLength(5);

  // Wait for content to replace skeleton
  await waitFor(() => {
    expect(screen.queryByTestId('skeleton-row')).not.toBeInTheDocument();
  });

  expect(screen.getByText('Alice')).toBeInTheDocument();
});
```

### Tooltip Hover

Tooltips appear on hover with a delay. Use `userEvent.hover` and `waitFor`:

```tsx
test('shows tooltip on hover', async () => {
  const user = userEvent.setup();

  render(
    <Tooltip title="Delete item">
      <IconButton aria-label="delete">
        <DeleteIcon />
      </IconButton>
    </Tooltip>
  );

  await user.hover(screen.getByRole('button', { name: /delete/i }));

  await waitFor(() => {
    expect(screen.getByRole('tooltip')).toHaveTextContent('Delete item');
  });

  await user.unhover(screen.getByRole('button', { name: /delete/i }));

  await waitFor(() => {
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
```

### Transition Animations

MUI components use CSS transitions (Fade, Grow, Slide, Collapse). In tests, these can cause elements to be in the DOM but not yet visible. Disable transitions globally or wait for them:

```tsx
// Option 1: Disable transitions in test theme
const testTheme = createTheme({
  transitions: {
    // Disable all transitions
    create: () => 'none',
  },
  components: {
    MuiDialog: {
      defaultProps: {
        TransitionComponent: ({ children }) => children,
      },
    },
  },
});

// Option 2: Wait for transition to complete
test('collapse expands content', async () => {
  const user = userEvent.setup();
  render(<CollapsibleSection />);

  await user.click(screen.getByRole('button', { name: /expand/i }));

  // Wait for transition and content visibility
  await waitFor(() => {
    const content = screen.getByText(/detailed information/i);
    expect(content).toBeVisible();
  });
});
```

### Finding Elements by MUI-specific Attributes

When ARIA roles are not sufficient, use `data-testid` or MUI class names:

```tsx
// Prefer roles and accessible names first
screen.getByRole('button', { name: /submit/i });
screen.getByRole('textbox', { name: /email/i });
screen.getByRole('combobox', { name: /country/i });

// Fallback: data-testid (add to your component)
<Chip data-testid="status-chip" label="Active" color="success" />
screen.getByTestId('status-chip');

// Last resort: MUI class selectors (fragile, avoid if possible)
container.querySelector('.MuiChip-colorSuccess');
```

### Query Priority (follow RTL guidelines)

1. `getByRole` -- always prefer (buttons, textboxes, comboboxes, dialogs, etc.)
2. `getByLabelText` -- form fields with labels
3. `getByPlaceholderText` -- when no label exists
4. `getByText` -- non-interactive text content
5. `getByDisplayValue` -- current input value
6. `getByTestId` -- escape hatch when nothing else works
