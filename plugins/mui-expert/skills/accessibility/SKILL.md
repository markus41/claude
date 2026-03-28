---
name: accessibility
description: MUI accessibility patterns, ARIA attributes, and WCAG compliance
triggers:
  - accessibility
  - a11y
  - aria
  - screen reader
  - keyboard navigation
  - WCAG
  - focus
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.jsx"
---

# MUI Accessibility (a11y)

MUI ships with many built-in accessibility features. This skill covers what works automatically,
what you must add manually, common violations, and WCAG compliance patterns.

## Built-in Accessibility Features

MUI provides these automatically:

- `role`, `aria-*` attributes on interactive elements (Button, Checkbox, Slider, etc.)
- Keyboard navigation in menus, selects, dialogs, date pickers, and tabs
- Focus trapping in Dialog and Drawer (via `FocusTrap`)
- Color contrast that meets WCAG AA for the default theme palette
- `aria-expanded`, `aria-selected`, `aria-checked` state attributes
- `aria-live` regions in Snackbar for announcements

## Icon Buttons Need aria-label

Icon-only buttons have no visible text — always add `aria-label`.

```tsx
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

// BAD — screen reader announces nothing meaningful
<IconButton>
  <DeleteIcon />
</IconButton>

// GOOD
<IconButton aria-label="Delete item">
  <DeleteIcon />
</IconButton>

// GOOD — dynamic label
<IconButton aria-label={`Edit ${item.name}`}>
  <EditIcon />
</IconButton>

// GOOD — using Tooltip (tooltip text does NOT replace aria-label for buttons)
<Tooltip title="Delete item">
  <IconButton aria-label="Delete item">
    <DeleteIcon />
  </IconButton>
</Tooltip>
```

## TextField Accessible Name

TextField with `label` is fully accessible. Without a label, add `aria-label` or `aria-labelledby`.

```tsx
// GOOD — label prop creates accessible name + visible label
<TextField label="Email address" type="email" />

// GOOD — label + helper text
<TextField
  label="Password"
  type="password"
  helperText="Minimum 8 characters"
  inputProps={{ 'aria-describedby': 'password-helper-text' }}
/>

// When label is hidden (search bar)
<TextField
  placeholder="Search..."
  inputProps={{ 'aria-label': 'Search products' }}
/>

// Associating external label
<Typography id="name-label">Full name</Typography>
<TextField inputProps={{ 'aria-labelledby': 'name-label' }} />
```

## Dialog — Focus Trap and Labels

Dialog automatically traps focus. Always provide `aria-labelledby` and `aria-describedby`.

```tsx
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

function ConfirmDeleteDialog({ open, onClose, onConfirm, itemName }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      aria-labelledby="confirm-dialog-title"
      aria-describedby="confirm-dialog-description"
    >
      <DialogTitle id="confirm-dialog-title">
        Delete {itemName}?
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="confirm-dialog-description">
          This action cannot be undone. The item will be permanently removed.
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        {/* Destructive action — autoFocus so keyboard users land here */}
        <Button onClick={onConfirm} color="error" autoFocus>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## Menu Keyboard Navigation

Menu handles keyboard navigation automatically. Provide accessible trigger.

```tsx
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Button from '@mui/material/Button';
import { useState } from 'react';

function ActionMenu() {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <Button
        id="action-button"
        aria-controls={open ? 'action-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={(e) => setAnchorEl(e.currentTarget)}
      >
        Actions
      </Button>
      <Menu
        id="action-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        MenuListProps={{
          'aria-labelledby': 'action-button',
        }}
      >
        <MenuItem onClick={() => setAnchorEl(null)}>Edit</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)}>Duplicate</MenuItem>
        <MenuItem onClick={() => setAnchorEl(null)} sx={{ color: 'error.main' }}>
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
```

**Keyboard behavior (automatic):**
- Arrow Up/Down: navigate items
- Enter/Space: select item
- Escape: close menu and return focus to trigger
- Home/End: jump to first/last item

## Tabs Keyboard Navigation

```tsx
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function ProductTabs() {
  const [value, setValue] = useState(0);

  return (
    <Box>
      <Tabs
        value={value}
        onChange={(_, newValue) => setValue(newValue)}
        aria-label="Product details"
      >
        <Tab label="Description" id="product-tab-0" aria-controls="product-tabpanel-0" />
        <Tab label="Specifications" id="product-tab-1" aria-controls="product-tabpanel-1" />
        <Tab label="Reviews" id="product-tab-2" aria-controls="product-tabpanel-2" />
      </Tabs>
      <TabPanel value={value} index={0}>Description content</TabPanel>
      <TabPanel value={value} index={1}>Specifications content</TabPanel>
      <TabPanel value={value} index={2}>Reviews content</TabPanel>
    </Box>
  );
}
```

**Keyboard behavior (automatic):**
- Arrow Left/Right: move between tabs
- Home/End: jump to first/last tab
- Enter/Space: activate focused tab

## Alert — role="alert" vs role="status"

```tsx
import Alert from '@mui/material/Alert';

// role="alert" — interrupts screen reader immediately (errors, warnings)
<Alert severity="error" role="alert">
  Payment failed. Please check your card details.
</Alert>

// role="status" (aria-live="polite") — announces when user is idle (success, info)
<Alert severity="success" role="status">
  Profile saved successfully.
</Alert>

// Snackbar announces automatically via aria-live region
import Snackbar from '@mui/material/Snackbar';

<Snackbar
  open={open}
  autoHideDuration={4000}
  onClose={() => setOpen(false)}
  message="Changes saved"
/>
```

## Form Patterns — FormControl + FormLabel Chain

```tsx
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import FormGroup from '@mui/material/FormGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormHelperText from '@mui/material/FormHelperText';
import Checkbox from '@mui/material/Checkbox';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';

// Checkbox group — grouped with fieldset semantics
function NotificationPrefs() {
  return (
    <FormControl component="fieldset">
      <FormLabel component="legend">Notification preferences</FormLabel>
      <FormGroup>
        <FormControlLabel
          control={<Checkbox name="email" />}
          label="Email notifications"
        />
        <FormControlLabel
          control={<Checkbox name="sms" />}
          label="SMS notifications"
        />
      </FormGroup>
      <FormHelperText>Choose at least one option</FormHelperText>
    </FormControl>
  );
}

// Radio group
function PlanSelector() {
  const [plan, setPlan] = useState('basic');

  return (
    <FormControl>
      <FormLabel id="plan-label">Subscription plan</FormLabel>
      <RadioGroup
        aria-labelledby="plan-label"
        value={plan}
        onChange={(e) => setPlan(e.target.value)}
      >
        <FormControlLabel value="basic" control={<Radio />} label="Basic — $9/mo" />
        <FormControlLabel value="pro" control={<Radio />} label="Pro — $29/mo" />
        <FormControlLabel value="enterprise" control={<Radio />} label="Enterprise" />
      </RadioGroup>
    </FormControl>
  );
}
```

## Icon Accessibility — Decorative vs Meaningful

```tsx
import SvgIcon from '@mui/material/SvgIcon';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import Typography from '@mui/material/Typography';

// Decorative icon — hidden from screen readers
// (icon next to visible text — the text already conveys the meaning)
<Button startIcon={<SaveIcon aria-hidden="true" />}>
  Save changes
</Button>

// Meaningful icon — conveys unique information without adjacent text
<CheckCircleIcon
  aria-label="Verified"
  sx={{ color: 'success.main' }}
/>

// Icon with visible text — hide the icon
<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <WarningIcon aria-hidden="true" sx={{ color: 'warning.main' }} />
  <Typography>Your session will expire in 5 minutes</Typography>
</Box>

// Status indicator — use aria-label or visually-hidden text
<Box sx={{ display: 'flex', alignItems: 'center' }}>
  <CheckCircleIcon sx={{ color: 'success.main' }} aria-hidden="true" />
  <Typography component="span" sx={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>
    Active
  </Typography>
</Box>
```

## Color Contrast (WCAG AA)

WCAG AA requires:
- Normal text: 4.5:1 contrast ratio
- Large text (18pt+ or 14pt+ bold): 3:1
- UI components (borders, icons): 3:1

```tsx
// MUI default theme passes WCAG AA for primary, secondary, error, warning, success, info

// BAD — custom color with insufficient contrast on white background
<Typography sx={{ color: '#aaa' }}>Light gray text</Typography>

// GOOD — use theme palette tokens which are contrast-tested
<Typography color="text.primary">Primary text</Typography>
<Typography color="text.secondary">Secondary text (passes AA on white)</Typography>

// When using custom colors, verify with a contrast checker
// theme.palette.grey[600] (#757575) has 4.6:1 on white — passes AA
<Typography sx={{ color: 'grey.700' }}>Safe gray</Typography>

// Disabled state — MUI uses lower contrast intentionally (WCAG exception for disabled)
<Button disabled>Disabled</Button>
```

## Focus Management

```tsx
import { useRef, useEffect } from 'react';

// Move focus to a heading after navigation (SPA route change)
function PageContent({ title }: { title: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <Typography
      variant="h1"
      tabIndex={-1}       // focusable programmatically, not in tab order
      ref={headingRef}
      sx={{ outline: 'none' }}
    >
      {title}
    </Typography>
  );
}

// Move focus to first error on form submit failure
function FormWithFocusError() {
  const firstErrorRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = await validate();
    if (errors.length) {
      firstErrorRef.current?.focus();
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <TextField
        error
        helperText="Required"
        inputRef={firstErrorRef}
        label="Email"
      />
    </form>
  );
}
```

## Skip Navigation Link

For keyboard users to bypass repeated navigation:

```tsx
// Place at the very top of the page, before the app shell
function SkipNav() {
  return (
    <Box
      component="a"
      href="#main-content"
      sx={{
        position: 'absolute',
        left: '-9999px',
        top: 'auto',
        width: 1,
        height: 1,
        overflow: 'hidden',
        '&:focus': {
          position: 'static',
          width: 'auto',
          height: 'auto',
          overflow: 'visible',
          p: 1,
          backgroundColor: 'primary.main',
          color: 'primary.contrastText',
          zIndex: 9999,
        },
      }}
    >
      Skip to main content
    </Box>
  );
}

// In layout:
<SkipNav />
<AppBar>...</AppBar>
<Box component="main" id="main-content" tabIndex={-1}>
  {children}
</Box>
```

## Visually Hidden Text (Screen Reader Only)

```tsx
// Utility sx for visually hidden but screen-reader accessible text
const srOnly = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
} as const;

// Usage: add context for screen readers without showing it visually
<Button onClick={handleDelete}>
  Delete
  <Box component="span" sx={srOnly}> {itemName}</Box>
</Button>
// Screen reader: "Delete Product XYZ, button"
// Visual user sees: "Delete"
```

## Loading States

```tsx
import CircularProgress from '@mui/material/CircularProgress';

// BAD — spinner with no accessible announcement
<CircularProgress />

// GOOD — role + aria-label for standalone spinners
<CircularProgress aria-label="Loading products" />

// GOOD — live region announces to screen reader when loading changes
<Box aria-live="polite" aria-busy={isLoading}>
  {isLoading ? (
    <CircularProgress aria-label="Loading" />
  ) : (
    <ProductList products={products} />
  )}
</Box>

// Button loading state (MUI Lab LoadingButton)
import LoadingButton from '@mui/lab/LoadingButton';

<LoadingButton
  loading={isSubmitting}
  loadingIndicator="Saving..."
  variant="contained"
>
  Save
</LoadingButton>
```

## Common Violations and Fixes

| Violation | Fix |
|-----------|-----|
| Icon button without label | Add `aria-label` to `<IconButton>` |
| Input without label | Add `label` prop to `<TextField>` or `inputProps={{ 'aria-label': '...' }}` |
| Dialog without aria-labelledby | Add `aria-labelledby` pointing to `<DialogTitle>` id |
| Color as the only indicator | Add text, icon, or pattern alongside color |
| Tab panel not linked to tab | Use matching `id`/`aria-controls` / `aria-labelledby` |
| Low-contrast custom color | Check ratio; use `theme.palette` tokens |
| Missing focus outline | Never set `outline: 0` without a `:focus-visible` replacement |
| Spinner with no announcement | Add `aria-label` or `aria-live` region |
| Tooltip replacing aria-label | Tooltip is not accessible — add explicit `aria-label` too |
| Form group without legend | Wrap in `<FormControl component="fieldset">` with `<FormLabel component="legend">` |

## Testing Accessibility

```bash
# Automated: axe-core via jest-axe
npm install --save-dev jest-axe @types/jest-axe

# In tests:
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

test('DatePicker has no accessibility violations', async () => {
  const { container } = render(
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <DatePicker label="Date" value={null} onChange={() => {}} />
    </LocalizationProvider>
  );
  expect(await axe(container)).toHaveNoViolations();
});
```

Manual testing checklist:
- Tab through all interactive elements — focus order must be logical
- Press Enter/Space to activate buttons and links
- Press Escape to close dialogs, menus, and pickers
- Test with screen reader: NVDA+Firefox (Windows), VoiceOver+Safari (macOS/iOS)
- Zoom to 200% — layout must remain usable
- Test with keyboard only (unplug mouse)
