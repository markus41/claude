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

## Setup

```bash
npm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
# For accessibility testing:
npm install --save-dev jest-axe @axe-core/react
```

---

## ThemeProvider Test Wrapper

MUI components read from the theme context. Always wrap in ThemeProvider for tests.

```tsx
// test-utils.tsx
import { render, RenderOptions } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

const defaultTheme = createTheme();

function AllProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={defaultTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  );
}

export function renderWithTheme(ui: React.ReactElement, options?: RenderOptions) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// Custom theme for specific tests
export function renderWithCustomTheme(ui: React.ReactElement, themeOptions = {}) {
  const theme = createTheme(themeOptions);
  return render(
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {ui}
    </ThemeProvider>
  );
}

export { screen, waitFor, within, act } from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
```

---

## Testing Portal Components (Dialog, Menu, Popover, Snackbar)

Portal components render into `document.body`, not inside the component tree.
Use `screen` queries (they search the entire document) instead of container queries.

### Dialog

```tsx
import { renderWithTheme, screen, userEvent } from './test-utils';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import Button from '@mui/material/Button';

function ConfirmDialog({ open, onClose, onConfirm }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Dialog open={open} onClose={onClose} aria-labelledby="dialog-title">
      <DialogTitle id="dialog-title">Confirm deletion</DialogTitle>
      <Button onClick={onConfirm}>Delete</Button>
      <Button onClick={onClose}>Cancel</Button>
    </Dialog>
  );
}

describe('ConfirmDialog', () => {
  it('renders when open', () => {
    renderWithTheme(<ConfirmDialog open onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Confirm deletion')).toBeInTheDocument();
  });

  it('calls onConfirm when delete clicked', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    renderWithTheme(<ConfirmDialog open onClose={vi.fn()} onConfirm={onConfirm} />);

    await user.click(screen.getByRole('button', { name: 'Delete' }));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when cancel clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithTheme(<ConfirmDialog open onClose={onClose} onConfirm={vi.fn()} />);

    await user.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('is not in the DOM when closed', () => {
    renderWithTheme(<ConfirmDialog open={false} onClose={vi.fn()} onConfirm={vi.fn()} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});
```

### Menu

```tsx
it('opens menu on button click', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MyMenuComponent />);

  await user.click(screen.getByRole('button', { name: 'Options' }));

  // Menu renders in a portal — use screen queries
  expect(screen.getByRole('menu')).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Edit' })).toBeInTheDocument();
  expect(screen.getByRole('menuitem', { name: 'Delete' })).toBeInTheDocument();
});
```

### Snackbar

```tsx
it('shows success snackbar after save', async () => {
  const user = userEvent.setup();
  renderWithTheme(<SaveForm />);

  await user.click(screen.getByRole('button', { name: 'Save' }));

  // Snackbar appears in portal
  expect(await screen.findByRole('alert')).toHaveTextContent('Saved successfully');
});
```

---

## Testing Autocomplete

```tsx
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

it('selects an option from dropdown', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  renderWithTheme(
    <Autocomplete
      options={['Apple', 'Banana', 'Cherry']}
      onChange={(_, value) => onChange(value)}
      renderInput={(params) => <TextField {...params} label="Fruit" />}
    />
  );

  // Open the dropdown
  const input = screen.getByRole('combobox');
  await user.click(input);

  // Type to filter
  await user.type(input, 'Ban');

  // Select from listbox
  const option = await screen.findByRole('option', { name: 'Banana' });
  await user.click(option);

  expect(onChange).toHaveBeenCalledWith('Banana');
});

it('handles free text input', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <Autocomplete
      freeSolo
      options={['Apple', 'Banana']}
      renderInput={(params) => <TextField {...params} label="Fruit" />}
    />
  );

  const input = screen.getByRole('combobox');
  await user.type(input, 'Mango');
  expect(input).toHaveValue('Mango');
});
```

---

## Testing DataGrid

```tsx
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { renderWithTheme, screen, within } from './test-utils';

const columns: GridColDef[] = [
  { field: 'name', headerName: 'Name', width: 200 },
  { field: 'age', headerName: 'Age', width: 100 },
];

const rows = [
  { id: 1, name: 'Alice', age: 30 },
  { id: 2, name: 'Bob', age: 25 },
];

it('renders rows', () => {
  renderWithTheme(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} />
    </div>
  );

  // DataGrid uses role="grid"
  const grid = screen.getByRole('grid');
  expect(grid).toBeInTheDocument();

  // Check cell content
  expect(screen.getByText('Alice')).toBeInTheDocument();
  expect(screen.getByText('Bob')).toBeInTheDocument();
});

it('sorts by column header click', async () => {
  const user = userEvent.setup();
  renderWithTheme(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={rows} columns={columns} />
    </div>
  );

  // Click the Age column header to sort
  const ageHeader = screen.getByRole('columnheader', { name: /Age/i });
  await user.click(ageHeader);

  // Verify sort indicator
  const sortButton = within(ageHeader).getByRole('button');
  expect(sortButton).toHaveAttribute('aria-label', expect.stringContaining('sort'));
});

it('shows loading state', () => {
  renderWithTheme(
    <div style={{ height: 400, width: '100%' }}>
      <DataGrid rows={[]} columns={columns} loading />
    </div>
  );

  expect(screen.getByRole('progressbar')).toBeInTheDocument();
});
```

**Key**: DataGrid MUST have a parent with explicit height. Without it, the grid renders with zero height and tests fail silently.

---

## Testing DatePicker

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';

function renderWithLocalization(ui: React.ReactElement) {
  return renderWithTheme(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      {ui}
    </LocalizationProvider>
  );
}

it('selects a date', async () => {
  const user = userEvent.setup();
  const onChange = vi.fn();

  renderWithLocalization(
    <DatePicker label="Start date" onChange={onChange} />
  );

  // Open the picker
  const input = screen.getByRole('textbox', { name: 'Start date' });
  await user.click(input);

  // Click a day in the calendar (portal)
  const day15 = screen.getByRole('gridcell', { name: '15' });
  await user.click(day15);

  expect(onChange).toHaveBeenCalled();
});

it('shows validation error', async () => {
  renderWithLocalization(
    <DatePicker
      label="End date"
      disablePast
      defaultValue={dayjs('2020-01-01')}
      slotProps={{
        textField: { helperText: 'Must be in the future' },
      }}
    />
  );

  expect(screen.getByText('Must be in the future')).toBeInTheDocument();
});
```

---

## Accessibility Testing

### jest-axe Integration

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

it('has no accessibility violations', async () => {
  const { container } = renderWithTheme(<MyComponent />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### ARIA Attribute Testing

```tsx
it('icon buttons have accessible names', () => {
  renderWithTheme(<MyToolbar />);

  const buttons = screen.getAllByRole('button');
  buttons.forEach((button) => {
    expect(button).toHaveAccessibleName();
  });
});

it('form fields have labels', () => {
  renderWithTheme(<MyForm />);

  expect(screen.getByLabelText('Email address')).toBeInTheDocument();
  expect(screen.getByLabelText('Password')).toBeInTheDocument();
});

it('dialog has accessible label', () => {
  renderWithTheme(<MyDialog open />);

  const dialog = screen.getByRole('dialog');
  expect(dialog).toHaveAccessibleName(); // via aria-labelledby or aria-label
});
```

### Keyboard Navigation Testing

```tsx
it('supports keyboard navigation in tabs', async () => {
  const user = userEvent.setup();
  renderWithTheme(<MyTabs />);

  const firstTab = screen.getByRole('tab', { name: 'Overview' });
  firstTab.focus();

  await user.keyboard('{ArrowRight}');
  expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();

  await user.keyboard('{Enter}');
  expect(screen.getByRole('tabpanel')).toHaveTextContent('Details content');
});
```

---

## Dark Mode Testing

```tsx
it('renders correctly in dark mode', () => {
  const darkTheme = createTheme({ palette: { mode: 'dark' } });

  const { container } = render(
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <MyComponent />
    </ThemeProvider>
  );

  // Check that component renders (no crashes in dark mode)
  expect(container.firstChild).toBeInTheDocument();
});
```

---

## Responsive Testing — Mocking useMediaQuery

```tsx
import mediaQuery from 'css-mediaquery';

function createMatchMedia(width: number) {
  return (query: string) => ({
    matches: mediaQuery.match(query, { width }),
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  });
}

beforeAll(() => {
  // Simulate mobile viewport
  window.matchMedia = createMatchMedia(375) as any;
});

it('shows mobile menu on small screens', () => {
  window.matchMedia = createMatchMedia(375) as any;
  renderWithTheme(<ResponsiveNavbar />);

  expect(screen.getByLabelText('open menu')).toBeInTheDocument();
  expect(screen.queryByText('Desktop Nav')).not.toBeInTheDocument();
});

it('shows desktop nav on large screens', () => {
  window.matchMedia = createMatchMedia(1200) as any;
  renderWithTheme(<ResponsiveNavbar />);

  expect(screen.getByText('Desktop Nav')).toBeInTheDocument();
  expect(screen.queryByLabelText('open menu')).not.toBeInTheDocument();
});
```

---

## Snapshot Testing

**Generally avoid** with MUI — class names include auto-generated hashes that change between runs.

If you must snapshot, use `toJSON()` with emotion's serializer or snapshot specific attributes:

```tsx
// Better alternative: test behavior and accessibility, not DOM structure
it('renders correct heading', () => {
  renderWithTheme(<PageHeader title="Dashboard" />);
  expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Dashboard');
});

// If you need visual regression, use Storybook + Chromatic or Percy
```

---

## Common Gotchas

### 1. act() Warnings with Transitions

MUI transitions (Fade, Grow, Collapse) use timeouts. Wrap state updates:

```tsx
import { act } from '@testing-library/react';

await act(async () => {
  await user.click(screen.getByRole('button'));
});
// Or use waitFor for async assertions
await waitFor(() => {
  expect(screen.getByText('Content')).toBeVisible();
});
```

### 2. Autocomplete Debounce

If Autocomplete has async options with debounce:

```tsx
import { waitFor } from '@testing-library/react';

await user.type(input, 'search term');
// Wait for debounce + API response
await waitFor(() => {
  expect(screen.getByRole('option', { name: 'Result' })).toBeInTheDocument();
}, { timeout: 1000 });
```

### 3. DataGrid Needs Container Height

```tsx
// BAD — grid renders with 0 height
renderWithTheme(<DataGrid rows={rows} columns={columns} />);

// GOOD — explicit height container
renderWithTheme(
  <div style={{ height: 400, width: '100%' }}>
    <DataGrid rows={rows} columns={columns} />
  </div>
);
```

### 4. Tooltip Hover Testing

```tsx
await user.hover(screen.getByLabelText('info'));
// Tooltip appears after delay — use findBy (async)
expect(await screen.findByRole('tooltip')).toHaveTextContent('Help text');
```

### 5. Select Component Testing

```tsx
// MUI Select uses a button role, not a native select
const select = screen.getByRole('combobox', { name: 'Role' });
await user.click(select);

// Options render in a listbox portal
const option = screen.getByRole('option', { name: 'Admin' });
await user.click(option);
```

### 6. Loading States with Skeleton

```tsx
it('shows skeletons while loading', () => {
  renderWithTheme(<UserList loading />);

  // Skeletons don't have semantic roles — query by test-id or structure
  const skeletons = document.querySelectorAll('.MuiSkeleton-root');
  expect(skeletons.length).toBeGreaterThan(0);
});

it('shows content after loading', async () => {
  const { rerender } = renderWithTheme(<UserList loading />);
  rerender(<UserList loading={false} users={mockUsers} />);

  expect(screen.getByText('Alice')).toBeInTheDocument();
});
```
