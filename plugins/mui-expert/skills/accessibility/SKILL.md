---
name: mui-accessibility
description: MUI Accessibility (a11y) skill. Covers ARIA attributes, keyboard navigation, focus management, WCAG compliance, screen reader patterns, and common a11y violations with MUI and how to fix them.
triggers:
  - accessibility
  - a11y
  - aria
  - screen reader
  - keyboard navigation
  - WCAG
  - focus
  - color contrast
  - aria-label
  - aria-describedby
  - focus trap
  - role
  - tabIndex
globs:
  - "*.tsx"
  - "*.jsx"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
---

# MUI Accessibility (a11y) Skill

MUI components ship with built-in accessibility support, but correct usage and custom compositions require understanding the underlying patterns.

---

## WCAG Requirements Summary

| Criterion | Requirement | Notes |
|-----------|-------------|-------|
| Text contrast | 4.5:1 (AA) | Use MUI theme contrast checker |
| Large text contrast | 3:1 (AA) | 18px+ or 14px+ bold |
| UI component contrast | 3:1 (AA) | Buttons, inputs, icons |
| Keyboard access | All interactive elements reachable | No mouse-only actions |
| Focus visible | Visible focus indicator | MUI provides by default |
| Error identification | Errors described in text | Not color alone |
| Labels | All inputs have associated labels | Not placeholder only |

---

## Buttons and Icon Buttons

```tsx
// Text button — accessible by default
<Button variant="contained">Save Changes</Button>

// Icon-only button — MUST have aria-label
<IconButton aria-label="Delete item" onClick={handleDelete}>
  <DeleteIcon />
</IconButton>

// Icon button with tooltip — tooltip text also serves as accessible name
<Tooltip title="Delete item">
  <IconButton onClick={handleDelete} aria-label="Delete item">
    <DeleteIcon />
  </IconButton>
</Tooltip>

// Loading state — communicate to screen readers
<Button
  variant="contained"
  loading={isLoading}
  loadingPosition="start"
  startIcon={<SaveIcon />}
  aria-busy={isLoading}
>
  {isLoading ? 'Saving…' : 'Save'}
</Button>

// Disabled vs aria-disabled
// Use disabled to prevent interaction entirely
<Button disabled>Cannot proceed</Button>

// Use aria-disabled when you want the element focusable but inactive
// (e.g., for tooltip to explain why it's disabled)
<Tooltip title="Complete step 1 first">
  <span>
    <Button aria-disabled="true" onClick={(e) => e.preventDefault()}>
      Next Step
    </Button>
  </span>
</Tooltip>
```

### Decorative vs Meaningful Icons

```tsx
// Decorative icon inside button with text — hide from screen reader
<Button startIcon={<SaveIcon aria-hidden="true" />}>Save</Button>

// Meaningful standalone icon — provide accessible text
<SaveIcon aria-label="Saved successfully" />

// Using titleAccess prop (renders a <title> in the SVG)
<SaveIcon titleAccess="Document saved" />
```

---

## Forms and TextField

```tsx
// Correct pattern: label is associated to input via htmlFor/id
// MUI TextField handles this automatically when you use label prop
<TextField
  id="email-input"
  label="Email address"         // renders <label for="email-input">
  type="email"
  required
  error={!!errors.email}
  helperText={errors.email?.message ?? 'We will never share your email'}
  inputProps={{
    'aria-required': true,
    autoComplete: 'email',
  }}
/>

// FormControl + FormLabel + FormHelperText for custom fields
<FormControl error={!!errors.category} required>
  <FormLabel id="category-label">Category</FormLabel>
  <RadioGroup aria-labelledby="category-label" value={value} onChange={onChange}>
    <FormControlLabel value="a" control={<Radio />} label="Option A" />
    <FormControlLabel value="b" control={<Radio />} label="Option B" />
  </RadioGroup>
  <FormHelperText>{errors.category?.message ?? 'Select one category'}</FormHelperText>
</FormControl>

// Error announcement with aria-live
<Box role="alert" aria-live="assertive" aria-atomic>
  {submitError && <Alert severity="error">{submitError}</Alert>}
</Box>

// Live region for non-error status updates
<Box aria-live="polite" aria-atomic>
  {successMessage && <Alert severity="success">{successMessage}</Alert>}
</Box>
```

### Select with Accessible Label

```tsx
<FormControl fullWidth>
  <InputLabel id="country-label">Country</InputLabel>
  <Select
    labelId="country-label"
    id="country-select"
    value={country}
    label="Country"            // required — renders label gap in outlined variant
    onChange={(e) => setCountry(e.target.value)}
  >
    <MenuItem value="us">United States</MenuItem>
    <MenuItem value="ca">Canada</MenuItem>
  </Select>
</FormControl>
```

---

## Dialogs (Modal)

MUI Dialog includes a focus trap and returns focus automatically.

```tsx
<Dialog
  open={open}
  onClose={handleClose}
  aria-labelledby="dialog-title"
  aria-describedby="dialog-description"
  // Prevent closing when clicking backdrop (e.g., destructive action)
  // disableBackdropClick is removed in v5; use onClose with reason check:
  onClose={(event, reason) => {
    if (reason !== 'backdropClick') handleClose();
  }}
>
  <DialogTitle id="dialog-title">
    Confirm Delete
    <IconButton
      aria-label="Close dialog"
      onClick={handleClose}
      sx={{ position: 'absolute', right: 8, top: 8 }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>
  <DialogContent>
    <DialogContentText id="dialog-description">
      Are you sure you want to delete this item? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose} autoFocus>Cancel</Button>
    <Button onClick={handleConfirm} color="error">Delete</Button>
  </DialogActions>
</Dialog>
```

Note: `autoFocus` on Cancel ensures the safe action is focused first. For destructive dialogs, focus should land on the non-destructive button.

---

## Menus

```tsx
<Menu
  id="actions-menu"
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={handleClose}
  // Announce the menu to screen readers
  MenuListProps={{ 'aria-labelledby': 'actions-button' }}
>
  <MenuItem onClick={handleEdit}>
    <ListItemIcon><EditIcon fontSize="small" aria-hidden="true" /></ListItemIcon>
    <ListItemText>Edit</ListItemText>
  </MenuItem>
  <Divider />
  <MenuItem onClick={handleDelete} sx={{ color: 'error.main' }}>
    <ListItemIcon><DeleteIcon fontSize="small" color="error" aria-hidden="true" /></ListItemIcon>
    <ListItemText>Delete</ListItemText>
  </MenuItem>
</Menu>

// The trigger button links to the menu
<Button
  id="actions-button"
  aria-controls={open ? 'actions-menu' : undefined}
  aria-haspopup="true"
  aria-expanded={open ? 'true' : undefined}
  onClick={handleOpen}
>
  Actions
</Button>
```

Keyboard navigation is built in: Arrow keys navigate items, Home/End jump to first/last, typing jumps to item matching the letter (type-ahead).

---

## Tabs

```tsx
<Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
  <Tabs
    value={activeTab}
    onChange={(_, newValue) => setActiveTab(newValue)}
    aria-label="Product details tabs"
  >
    <Tab label="Overview" id="tab-overview" aria-controls="panel-overview" />
    <Tab label="Specs" id="tab-specs" aria-controls="panel-specs" />
    <Tab label="Reviews" id="tab-reviews" aria-controls="panel-reviews" />
  </Tabs>
</Box>

<TabPanel value={activeTab} index={0} id="panel-overview" aria-labelledby="tab-overview">
  Overview content
</TabPanel>
<TabPanel value={activeTab} index={1} id="panel-specs" aria-labelledby="tab-specs">
  Specs content
</TabPanel>
```

```tsx
// TabPanel component
function TabPanel({ children, value, index, ...props }: {
  children: React.ReactNode;
  value: number;
  index: number;
  id: string;
  'aria-labelledby': string;
}) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      {...props}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}
```

---

## Alerts and Notifications

```tsx
// Alert with role — for important messages
<Alert severity="error" role="alert">      {/* assertive: interrupts */}
  Payment failed. Please check your card details.
</Alert>

<Alert severity="success" role="status">   {/* polite: waits for idle */}
  Your profile has been updated.
</Alert>

// Snackbar — transient message, use polite
<Snackbar
  open={open}
  autoHideDuration={6000}
  onClose={handleClose}
  // Accessible position announcement
>
  <Alert
    severity="success"
    role="status"
    aria-live="polite"
    onClose={handleClose}
  >
    File uploaded successfully.
  </Alert>
</Snackbar>
```

---

## Tables

```tsx
<TableContainer component={Paper}>
  <Table aria-label="Employee roster" aria-describedby="table-description">
    <caption id="table-description" style={{ captionSide: 'bottom', textAlign: 'left' }}>
      Showing 10 of 143 employees. Use sort buttons to reorder.
    </caption>
    <TableHead>
      <TableRow>
        <TableCell>
          <TableSortLabel
            active={orderBy === 'name'}
            direction={orderBy === 'name' ? order : 'asc'}
            onClick={() => handleSort('name')}
          >
            Name
          </TableSortLabel>
        </TableCell>
        <TableCell align="right">
          <TableSortLabel
            active={orderBy === 'salary'}
            direction={orderBy === 'salary' ? order : 'asc'}
            onClick={() => handleSort('salary')}
          >
            Salary
          </TableSortLabel>
        </TableCell>
        <TableCell>Actions</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell component="th" scope="row">{row.name}</TableCell>
          <TableCell align="right">{row.salary}</TableCell>
          <TableCell>
            <IconButton aria-label={`Edit ${row.name}`} size="small">
              <EditIcon fontSize="small" />
            </IconButton>
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

Key points: `component="th" scope="row"` for row headers, `aria-label` with row context on action buttons, `aria-sort` is handled by `TableSortLabel`.

---

## Tooltip Accessibility

```tsx
// On a focusable element — accessible by default (shows on focus and hover)
<Tooltip title="Delete this record">
  <IconButton aria-label="Delete record">
    <DeleteIcon />
  </IconButton>
</Tooltip>

// On a non-focusable element — must add tabIndex or use a wrapper
<Tooltip title="This feature requires Pro subscription">
  <span tabIndex={0}>
    <Chip label="Pro Feature" />
  </span>
</Tooltip>

// Tooltip as the accessible name (not just supplementary)
// If the tooltip IS the label, the button still needs aria-label
<Tooltip title="Save document (Ctrl+S)">
  <IconButton aria-label="Save document">
    <SaveIcon />
  </IconButton>
</Tooltip>
```

---

## Skip Navigation and Focus Management

```tsx
// Skip navigation link — first focusable element on page
<Box
  component="a"
  href="#main-content"
  sx={{
    position: 'absolute',
    transform: 'translateY(-100%)',
    transition: 'transform 0.3s',
    '&:focus': { transform: 'translateY(0)' },
    zIndex: 9999,
    p: 2,
    backgroundColor: 'primary.main',
    color: 'white',
    textDecoration: 'none',
  }}
>
  Skip to main content
</Box>

<Box component="main" id="main-content" tabIndex={-1}>
  {/* Main content */}
</Box>
```

```tsx
// Programmatic focus management — focus heading after navigation
import { useRef, useEffect } from 'react';

function PageContent({ title }: { title: string }) {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, [title]);

  return (
    <Typography
      variant="h1"
      ref={headingRef}
      tabIndex={-1}    // focusable programmatically, not by keyboard Tab
      sx={{ '&:focus': { outline: 'none' } }}  // hide visible outline on h1
    >
      {title}
    </Typography>
  );
}
```

---

## Color Contrast with MUI Theme

```ts
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    // MUI calculates contrast ratios — test with browser tools
    primary: {
      main: '#1976d2',          // 4.6:1 on white — passes AA
      contrastText: '#ffffff',
    },
    error: {
      main: '#d32f2f',          // 5.8:1 on white — passes AA
    },
    // Custom colors must be manually verified
    // Tool: https://webaim.org/resources/contrastchecker/
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          // Ensure focus is always visible (some resets remove it)
          '&:focus-visible': {
            outline: '3px solid',
            outlineColor: 'primary.main',
            outlineOffset: '2px',
          },
        },
      },
    },
  },
});
```

---

## Common A11y Violations with MUI

### 1. Missing Input Label (most common)

```tsx
// WRONG — placeholder is not a label
<TextField placeholder="Enter your email" />

// RIGHT — use label prop
<TextField label="Email address" placeholder="name@example.com" />
```

### 2. Icon Button Without Label

```tsx
// WRONG
<IconButton onClick={handleDelete}><DeleteIcon /></IconButton>

// RIGHT
<IconButton aria-label="Delete item" onClick={handleDelete}><DeleteIcon /></IconButton>
```

### 3. Dialog Without aria-labelledby

```tsx
// WRONG
<Dialog open={open}><DialogTitle>Confirm</DialogTitle></Dialog>

// RIGHT
<Dialog open={open} aria-labelledby="confirm-dialog-title">
  <DialogTitle id="confirm-dialog-title">Confirm</DialogTitle>
</Dialog>
```

### 4. Color as Only Error Indicator

```tsx
// WRONG — error conveyed only by red color
<TextField sx={{ '& fieldset': { borderColor: 'red' } }} />

// RIGHT — error + text message
<TextField error helperText="This field is required" />
```

### 5. Non-descriptive Link/Button Text

```tsx
// WRONG — "click here" or "read more" is meaningless out of context
<Button>Read more</Button>

// RIGHT — descriptive
<Button>Read more about pricing plans</Button>
// Or visually hidden supplement:
<Button>
  Read more <VisuallyHidden>about our pricing plans</VisuallyHidden>
</Button>
```

### 6. Menu Trigger Without aria-haspopup

```tsx
// WRONG
<Button onClick={openMenu}>Actions</Button>

// RIGHT
<Button
  aria-haspopup="menu"
  aria-controls={open ? 'actions-menu' : undefined}
  aria-expanded={open}
  onClick={openMenu}
>
  Actions
</Button>
```

---

## VisuallyHidden Utility Component

```tsx
// Visually hidden but readable by screen readers
const VisuallyHidden = ({ children }: { children: React.ReactNode }) => (
  <Box
    component="span"
    sx={{
      position: 'absolute',
      width: '1px',
      height: '1px',
      padding: 0,
      margin: '-1px',
      overflow: 'hidden',
      clip: 'rect(0, 0, 0, 0)',
      whiteSpace: 'nowrap',
      border: 0,
    }}
  >
    {children}
  </Box>
);

// Usage
<IconButton aria-label="notifications">
  <NotificationsIcon />
  {unreadCount > 0 && (
    <Badge badgeContent={unreadCount} color="error">
      <VisuallyHidden>{unreadCount} unread notifications</VisuallyHidden>
    </Badge>
  )}
</IconButton>
```

---

## Testing A11y

```bash
# Install axe-core testing utilities
npm install --save-dev @axe-core/react jest-axe

# With jest-axe
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('form has no a11y violations', async () => {
  const { container } = render(<MyForm />);
  expect(await axe(container)).toHaveNoViolations();
});
```

Browser tools: Chrome DevTools Accessibility panel, axe DevTools extension, WAVE, Lighthouse (accessibility audit).
