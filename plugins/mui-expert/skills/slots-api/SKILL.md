---
name: slots-api
description: MUI slots and slotProps API for deep component customization — replacing internal elements, custom renderers, and composition patterns
triggers:
  - slots
  - slotProps
  - component customization
  - custom renderer
  - inner elements
  - PaperComponent
  - PopperComponent
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
---

# MUI Slots & slotProps API

The slots/slotProps pattern is MUI's primary mechanism for deep component customization. It lets you replace internal sub-components, inject custom renderers, and pass props to every layer of a compound component without wrapper hacks.

## 1. What Are Slots?

Every compound MUI component is built from smaller internal elements. The `slots` prop lets you swap any of those internal elements with your own component. The `slotProps` prop lets you pass additional props to each slot — whether you replaced it or not.

```tsx
// Before (MUI v5 — deprecated)
<Autocomplete
  PaperComponent={CustomPaper}
  componentsProps={{ paper: { elevation: 8 } }}
/>

// After (MUI v6+ — slots API)
<Autocomplete
  slots={{ paper: CustomPaper }}
  slotProps={{ paper: { elevation: 8 } }}
/>
```

**Key rules:**
- `slots` accepts component references (not JSX elements)
- `slotProps` accepts either a plain object or a callback function
- Slot names are camelCase: `slots.valueLabel`, not `slots.ValueLabel`
- The component you provide receives all the props that the default slot component would receive — spread them through

## 2. Common Slot Patterns by Component

### TextField

```tsx
import { TextField, InputBase, FormHelperText } from '@mui/material';

// Replace the underlying input element
<TextField
  label="Custom Input"
  slots={{
    input: InputBase,
    inputLabel: CustomLabel,
  }}
  slotProps={{
    input: {
      sx: { borderRadius: 2, bgcolor: 'grey.50' },
      'aria-describedby': 'helper-text',
    },
    inputLabel: {
      shrink: true,
      sx: { fontWeight: 600 },
    },
    formHelperText: {
      sx: { fontSize: '0.75rem', color: 'warning.main' },
    },
    htmlInput: {
      maxLength: 100,
      pattern: '[A-Za-z]+',
    },
  }}
  helperText="Letters only, max 100 chars"
/>
```

### Autocomplete

```tsx
import {
  Autocomplete,
  TextField,
  Paper,
  Popper,
  type PaperProps,
  type PopperProps,
  type AutocompleteRenderOptionState,
} from '@mui/material';
import { forwardRef } from 'react';

// Custom paper with shadow and border radius
const StyledPaper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => (
  <Paper
    {...props}
    ref={ref}
    elevation={8}
    sx={{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }}
  />
));
StyledPaper.displayName = 'StyledPaper';

// Custom popper with width matching
const WidePopper = forwardRef<HTMLDivElement, PopperProps>((props, ref) => (
  <Popper {...props} ref={ref} placement="bottom-start" sx={{ minWidth: 400 }} />
));
WidePopper.displayName = 'WidePopper';

<Autocomplete
  options={options}
  slots={{
    paper: StyledPaper,
    popper: WidePopper,
    listbox: CustomListbox,
  }}
  slotProps={{
    paper: { 'data-testid': 'autocomplete-dropdown' },
    popper: { modifiers: [{ name: 'offset', options: { offset: [0, 8] } }] },
    listbox: { sx: { maxHeight: 300, '& .MuiAutocomplete-option': { py: 1 } } },
    chip: { size: 'small', color: 'primary', variant: 'outlined' },
    clearIndicator: { sx: { color: 'error.main' } },
  }}
  renderInput={(params) => <TextField {...params} label="Search" />}
/>
```

### Select

```tsx
import { Select, MenuItem } from '@mui/material';

<Select
  value={value}
  onChange={handleChange}
  slots={{
    root: CustomSelectRoot,
  }}
  slotProps={{
    listbox: {
      sx: {
        maxHeight: 250,
        '& .MuiMenuItem-root': {
          borderRadius: 1,
          mx: 0.5,
        },
      },
    },
  }}
>
  <MenuItem value={10}>Ten</MenuItem>
  <MenuItem value={20}>Twenty</MenuItem>
</Select>
```

### Slider

```tsx
import { Slider, type SliderThumbSlotProps } from '@mui/material';
import { forwardRef } from 'react';

// Custom thumb with tooltip-style display
const CustomThumb = forwardRef<HTMLSpanElement, SliderThumbSlotProps>(
  (props, ref) => {
    const { children, className, ...other } = props;
    return (
      <span ref={ref} className={className} {...other}>
        {children}
        <span style={{
          position: 'absolute',
          top: -28,
          fontSize: 12,
          fontWeight: 700,
          background: '#1976d2',
          color: '#fff',
          borderRadius: 4,
          padding: '2px 6px',
        }}>
          {props['aria-valuenow']}
        </span>
      </span>
    );
  }
);
CustomThumb.displayName = 'CustomThumb';

<Slider
  value={sliderValue}
  onChange={handleSliderChange}
  slots={{
    thumb: CustomThumb,
    track: CustomTrack,
    rail: CustomRail,
    valueLabel: CustomValueLabel,
    mark: CustomMark,
    markLabel: CustomMarkLabel,
  }}
  slotProps={{
    thumb: {
      'data-testid': 'custom-thumb',
      sx: { width: 24, height: 24 },
    },
    track: {
      sx: { height: 8, borderRadius: 4 },
    },
    rail: {
      sx: { height: 8, borderRadius: 4, opacity: 0.3 },
    },
    valueLabel: {
      sx: { bgcolor: 'primary.dark', fontSize: 12 },
    },
  }}
  marks={[
    { value: 0, label: '0' },
    { value: 50, label: '50' },
    { value: 100, label: '100' },
  ]}
/>
```

### DatePicker

```tsx
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { PickersDay, type PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { type Dayjs } from 'dayjs';

// Highlight weekends
function CustomDay(props: PickersDayProps<Dayjs>) {
  const { day, ...other } = props;
  const isWeekend = day.day() === 0 || day.day() === 6;

  return (
    <PickersDay
      {...other}
      day={day}
      sx={{
        ...(isWeekend && {
          bgcolor: 'warning.light',
          '&:hover': { bgcolor: 'warning.main' },
        }),
      }}
    />
  );
}

<DatePicker
  label="Select date"
  value={dateValue}
  onChange={handleDateChange}
  slots={{
    day: CustomDay,
    field: CustomField,
    textField: CustomTextField,
    actionBar: CustomActionBar,
    toolbar: CustomToolbar,
    layout: CustomLayout,
  }}
  slotProps={{
    day: {
      sx: { borderRadius: 1 },
    },
    textField: {
      size: 'small',
      variant: 'filled',
      helperText: 'MM/DD/YYYY',
    },
    actionBar: {
      actions: ['clear', 'today', 'accept'],
    },
    toolbar: {
      hidden: false,
      toolbarFormat: 'ddd, MMM D',
    },
    popper: {
      placement: 'bottom-end',
    },
  }}
/>
```

### Dialog

```tsx
import { Dialog, Backdrop, type BackdropProps } from '@mui/material';
import { forwardRef } from 'react';

const BlurredBackdrop = forwardRef<HTMLDivElement, BackdropProps>((props, ref) => (
  <Backdrop
    {...props}
    ref={ref}
    sx={{
      backdropFilter: 'blur(8px)',
      backgroundColor: 'rgba(0, 0, 0, 0.3)',
    }}
  />
));
BlurredBackdrop.displayName = 'BlurredBackdrop';

<Dialog
  open={open}
  onClose={handleClose}
  slots={{
    backdrop: BlurredBackdrop,
    transition: Fade,
  }}
  slotProps={{
    backdrop: {
      timeout: 500,
      'data-testid': 'dialog-backdrop',
    },
    paper: {
      sx: {
        borderRadius: 3,
        boxShadow: 24,
        minWidth: 400,
      },
      elevation: 0,
    },
  }}
>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogContent>Are you sure?</DialogContent>
</Dialog>
```

### Tooltip

```tsx
import { Tooltip, Popper, type PopperProps } from '@mui/material';
import { forwardRef } from 'react';

const ThemedPopper = forwardRef<HTMLDivElement, PopperProps>((props, ref) => (
  <Popper
    {...props}
    ref={ref}
    sx={{
      '& .MuiTooltip-tooltip': {
        bgcolor: 'primary.dark',
        fontSize: 14,
        borderRadius: 2,
        px: 2,
        py: 1,
      },
      '& .MuiTooltip-arrow': {
        color: 'primary.dark',
      },
    }}
  />
));
ThemedPopper.displayName = 'ThemedPopper';

<Tooltip
  title="Detailed description here"
  arrow
  slots={{
    popper: ThemedPopper,
  }}
  slotProps={{
    popper: {
      modifiers: [{ name: 'offset', options: { offset: [0, -4] } }],
    },
    arrow: {
      sx: { color: 'primary.dark' },
    },
    tooltip: {
      sx: { maxWidth: 300 },
    },
    transition: {
      timeout: 200,
    },
  }}
>
  <IconButton>
    <InfoIcon />
  </IconButton>
</Tooltip>
```

## 3. Custom Slot Components

When creating a custom slot component, follow these rules:

1. **Forward the ref** — MUI needs refs for positioning (Popper, Tooltip) and focus management
2. **Spread all props** — The parent component passes required props (event handlers, ARIA attributes, styles); dropping them breaks functionality
3. **Use `forwardRef`** — Required for all slot components

```tsx
import { forwardRef, type HTMLAttributes } from 'react';
import { Paper, type PaperProps } from '@mui/material';

// CORRECT: Forward ref, spread props, then add customizations
const CustomPaper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => {
  const { children, sx, ...rest } = props;

  return (
    <Paper
      ref={ref}
      elevation={8}
      sx={[
        { borderRadius: 2, border: '2px solid', borderColor: 'primary.main' },
        // Merge incoming sx (may be from slotProps)
        ...(Array.isArray(sx) ? sx : [sx]),
      ]}
      {...rest}
    >
      {children}
    </Paper>
  );
});
CustomPaper.displayName = 'CustomPaper';

// Usage
<Autocomplete
  slots={{ paper: CustomPaper }}
  slotProps={{ paper: { sx: { minWidth: 300 } } }} // This sx merges with the slot's sx
  renderInput={(params) => <TextField {...params} label="Search" />}
/>
```

**Merging `sx` correctly:**

When your custom slot defines its own `sx` and you also want `slotProps.*.sx` to apply, merge them using the array syntax:

```tsx
const MySlot = forwardRef<HTMLDivElement, BoxProps>(({ sx, ...props }, ref) => (
  <Box
    ref={ref}
    sx={[
      { p: 2, bgcolor: 'grey.100' },           // slot defaults
      ...(Array.isArray(sx) ? sx : [sx]),        // incoming overrides
    ]}
    {...props}
  />
));
```

## 4. slotProps Callback Form

Instead of a static object, pass a function to `slotProps` to compute props based on the component's current state (the "owner state"):

```tsx
import { TextField } from '@mui/material';

<TextField
  label="Dynamic styling"
  slotProps={{
    // Callback receives ownerState with component internal state
    input: (ownerState) => ({
      sx: {
        fontWeight: ownerState.focused ? 700 : 400,
        bgcolor: ownerState.error ? 'error.light' : 'transparent',
        transition: 'all 0.2s ease',
      },
    }),
    inputLabel: (ownerState) => ({
      sx: {
        color: ownerState.focused ? 'primary.main' : 'text.secondary',
        fontSize: ownerState.shrink ? 12 : 16,
      },
    }),
  }}
/>
```

The callback pattern is especially useful for:
- **Conditional styling** based on focused/error/disabled state
- **Computed ARIA attributes** based on value
- **Dynamic classes** that depend on the component's internal state

```tsx
import { Slider } from '@mui/material';

<Slider
  slotProps={{
    thumb: (ownerState) => ({
      sx: {
        // Change thumb color at extremes
        bgcolor: ownerState.value === 100
          ? 'success.main'
          : ownerState.value === 0
            ? 'error.main'
            : 'primary.main',
        width: ownerState.active ? 28 : 20,
        height: ownerState.active ? 28 : 20,
        transition: 'width 0.1s, height 0.1s',
      },
    }),
    valueLabel: (ownerState) => ({
      sx: {
        bgcolor: ownerState.value > 80 ? 'success.dark' : 'primary.dark',
      },
    }),
  }}
/>
```

### Owner State Properties

Common ownerState properties vary by component:

| Component | ownerState properties |
|-----------|----------------------|
| TextField | `focused`, `error`, `disabled`, `required`, `filled`, `size`, `variant`, `color` |
| Slider | `active`, `disabled`, `dragging`, `focusedThumbIndex`, `marked`, `orientation`, `value` |
| Button | `active`, `disabled`, `focusVisible`, `fullWidth`, `size`, `variant`, `color` |
| Chip | `clickable`, `deletable`, `disabled`, `size`, `variant`, `color` |
| Badge | `anchorOrigin`, `color`, `invisible`, `max`, `overlap`, `variant` |

## 5. Migration from components/componentsProps (v5 to v6)

MUI v6 unified the customization API. Here is the mapping:

### Prop Renames

```tsx
// v5 (deprecated)
<DataGrid
  components={{
    Toolbar: CustomToolbar,
    Footer: CustomFooter,
    NoRowsOverlay: EmptyState,
  }}
  componentsProps={{
    toolbar: { showQuickFilter: true },
    footer: { sx: { bgcolor: 'grey.50' } },
  }}
/>

// v6+ (current)
<DataGrid
  slots={{
    toolbar: CustomToolbar,
    footer: CustomFooter,
    noRowsOverlay: EmptyState,
  }}
  slotProps={{
    toolbar: { showQuickFilter: true },
    footer: { sx: { bgcolor: 'grey.50' } },
  }}
/>
```

### Named Props to Slots

Some components had dedicated props that are now unified under `slots`:

| v5 Prop | v6 Equivalent |
|---------|---------------|
| `PaperComponent` | `slots.paper` |
| `PopperComponent` | `slots.popper` |
| `TransitionComponent` | `slots.transition` |
| `BackdropComponent` | `slots.backdrop` |
| `IconComponent` | `slots.openPickerIcon` |
| `OpenPickerButtonProps` | `slotProps.openPickerButton` |
| `InputAdornmentProps` | `slotProps.inputAdornment` |
| `ToolbarComponent` | `slots.toolbar` |
| `PaperProps` | `slotProps.paper` |
| `PopperProps` | `slotProps.popper` |
| `TransitionProps` | `slotProps.transition` |
| `BackdropProps` | `slotProps.backdrop` |

### Casing Change

`components` used PascalCase keys; `slots` uses camelCase:

```tsx
// v5
components={{ Toolbar: CustomToolbar, NoRowsOverlay: Empty }}

// v6
slots={{ toolbar: CustomToolbar, noRowsOverlay: Empty }}
```

### Codemod

MUI provides a codemod to automate migration:

```bash
npx @mui/codemod v6.0.0/preset-safe ./src
```

## 6. DataGrid Slots (Comprehensive)

The DataGrid has the most extensive slots API in MUI. Here is a thorough reference:

### Toolbar

```tsx
import {
  DataGrid,
  GridToolbarContainer,
  GridToolbarExport,
  GridToolbarFilterButton,
  GridToolbarQuickFilter,
  type GridSlots,
} from '@mui/x-data-grid';

function CustomToolbar() {
  return (
    <GridToolbarContainer sx={{ p: 1, gap: 1 }}>
      <GridToolbarFilterButton />
      <GridToolbarExport />
      <Box sx={{ flexGrow: 1 }} />
      <GridToolbarQuickFilter
        debounceMs={300}
        sx={{ width: 250 }}
      />
      <Button
        size="small"
        startIcon={<AddIcon />}
        onClick={handleAddRow}
      >
        Add Row
      </Button>
    </GridToolbarContainer>
  );
}

<DataGrid
  rows={rows}
  columns={columns}
  slots={{
    toolbar: CustomToolbar,
  }}
  slotProps={{
    toolbar: {
      showQuickFilter: true,
      quickFilterProps: { debounceMs: 300 },
    },
  }}
/>
```

### Footer

```tsx
import { GridFooterContainer, type GridSlotsComponentsProps } from '@mui/x-data-grid';

function CustomFooter(props: NonNullable<GridSlotsComponentsProps['footer']>) {
  const { selectedRowCount, totalRowCount } = props;

  return (
    <GridFooterContainer sx={{ justifyContent: 'space-between', px: 2 }}>
      <Typography variant="body2" color="text.secondary">
        {selectedRowCount > 0
          ? `${selectedRowCount} of ${totalRowCount} selected`
          : `${totalRowCount} total rows`}
      </Typography>
      <Box sx={{ display: 'flex', gap: 1 }}>
        <Button size="small" onClick={handleExport}>Export CSV</Button>
        <Button size="small" onClick={handlePrint}>Print</Button>
      </Box>
    </GridFooterContainer>
  );
}

<DataGrid
  rows={rows}
  columns={columns}
  slots={{ footer: CustomFooter }}
/>
```

### No Rows & Loading Overlays

```tsx
function NoRowsOverlay() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
        gap: 2,
      }}
    >
      <SearchOffIcon sx={{ fontSize: 64, color: 'text.disabled' }} />
      <Typography variant="h6" color="text.secondary">
        No results found
      </Typography>
      <Typography variant="body2" color="text.disabled">
        Try adjusting your search or filter criteria
      </Typography>
    </Box>
  );
}

function LoadingOverlay() {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%',
      }}
    >
      <CircularProgress size={40} />
      <Typography sx={{ ml: 2 }}>Loading data...</Typography>
    </Box>
  );
}

<DataGrid
  rows={rows}
  columns={columns}
  loading={isLoading}
  slots={{
    noRowsOverlay: NoRowsOverlay,
    noResultsOverlay: NoRowsOverlay,
    loadingOverlay: LoadingOverlay,
  }}
  slotProps={{
    loadingOverlay: {
      variant: 'skeleton',
      noRowsVariant: 'skeleton',
    },
  }}
/>
```

### Custom Cell Renderer via renderCell vs Slots

For per-column cell customization, use `renderCell` on the column definition. For global cell wrapper customization, use slots:

```tsx
import {
  type GridColDef,
  type GridRenderCellParams,
  type GridCellParams,
} from '@mui/x-data-grid';

// Per-column: renderCell
const columns: GridColDef[] = [
  {
    field: 'status',
    headerName: 'Status',
    width: 150,
    renderCell: (params: GridRenderCellParams) => (
      <Chip
        label={params.value}
        color={params.value === 'active' ? 'success' : 'default'}
        size="small"
        variant="outlined"
      />
    ),
  },
  {
    field: 'progress',
    headerName: 'Progress',
    width: 200,
    renderCell: (params: GridRenderCellParams<any, number>) => (
      <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
        <LinearProgress
          variant="determinate"
          value={params.value ?? 0}
          sx={{ flexGrow: 1, height: 8, borderRadius: 4 }}
        />
        <Typography variant="caption">{params.value}%</Typography>
      </Box>
    ),
  },
  {
    field: 'actions',
    headerName: 'Actions',
    type: 'actions',
    width: 120,
    getActions: (params) => [
      <GridActionsCellItem
        key="edit"
        icon={<EditIcon />}
        label="Edit"
        onClick={() => handleEdit(params.id)}
      />,
      <GridActionsCellItem
        key="delete"
        icon={<DeleteIcon />}
        label="Delete"
        onClick={() => handleDelete(params.id)}
        showInMenu
      />,
    ],
  },
];
```

### Column Menu

```tsx
import {
  GridColumnMenu,
  type GridColumnMenuProps,
  GridColumnMenuFilterItem,
  GridColumnMenuSortItem,
  GridColumnMenuColumnsItem,
} from '@mui/x-data-grid';

function CustomColumnMenu(props: GridColumnMenuProps) {
  return (
    <GridColumnMenu
      {...props}
      slots={{
        columnMenuSortItem: GridColumnMenuSortItem,
        columnMenuFilterItem: GridColumnMenuFilterItem,
        columnMenuColumnsItem: GridColumnMenuColumnsItem,
      }}
      slotProps={{
        columnMenuSortItem: { displayOrder: 0 },
        columnMenuFilterItem: { displayOrder: 10 },
        columnMenuColumnsItem: { displayOrder: 20 },
      }}
    />
  );
}

<DataGrid
  rows={rows}
  columns={columns}
  slots={{ columnMenu: CustomColumnMenu }}
/>
```

### Base Component Overrides

DataGrid allows overriding the base MUI components it uses internally:

```tsx
<DataGrid
  rows={rows}
  columns={columns}
  slots={{
    baseButton: CustomButton,
    baseTextField: CustomTextField,
    baseSelect: CustomSelect,
    baseCheckbox: CustomCheckbox,
    baseSwitch: CustomSwitch,
    baseChip: CustomChip,
    baseTooltip: CustomTooltip,
    basePopper: CustomPopper,
    baseInputAdornment: CustomInputAdornment,
    baseIconButton: CustomIconButton,
  }}
  slotProps={{
    baseButton: { variant: 'outlined', size: 'small' },
    baseTextField: { variant: 'filled', size: 'small' },
    baseCheckbox: { color: 'secondary' },
  }}
/>
```

### Complete DataGrid Slot Reference

| Slot | Purpose |
|------|---------|
| `toolbar` | Top toolbar area |
| `footer` | Bottom footer area |
| `columnMenu` | Column header dropdown menu |
| `columnHeaders` | Column header row container |
| `cell` | Individual cell wrapper |
| `row` | Row wrapper |
| `noRowsOverlay` | Shown when rows array is empty |
| `noResultsOverlay` | Shown when filtering returns no results |
| `loadingOverlay` | Shown while `loading={true}` |
| `detailPanelContent` | Row detail expand panel (Pro) |
| `detailPanelExpandIcon` | Expand icon for detail panel (Pro) |
| `detailPanelCollapseIcon` | Collapse icon for detail panel (Pro) |
| `pagination` | Pagination controls |
| `filterPanel` | Filter panel |
| `columnsPanel` | Columns visibility panel |
| `preferencesPanel` | Settings panel wrapper |
| `baseButton` | Base Button used across the grid |
| `baseTextField` | Base TextField used across the grid |
| `baseSelect` | Base Select used across the grid |
| `baseCheckbox` | Base Checkbox used across the grid |

## 7. TypeScript Typing

### Typing Custom Slot Components

Use `SlotComponentProps` to correctly type a custom slot:

```tsx
import { type SlotComponentProps } from '@mui/base/utils';
import { type PaperProps } from '@mui/material/Paper';
import { type AutocompleteOwnerState } from '@mui/material/Autocomplete';
import { forwardRef } from 'react';

// Method 1: Use the exact MUI prop type directly
const TypedPaper = forwardRef<HTMLDivElement, PaperProps>((props, ref) => (
  <Paper {...props} ref={ref} elevation={8} />
));
TypedPaper.displayName = 'TypedPaper';

// Method 2: Use SlotComponentProps for full owner state access
type AutocompletePaperSlotProps = SlotComponentProps<
  typeof Paper,
  {}, // additional props you want
  AutocompleteOwnerState<string, false, false, false>
>;

const TypedPaperWithOwnerState = forwardRef<HTMLDivElement, AutocompletePaperSlotProps>(
  (props, ref) => {
    const { ownerState, ...rest } = props;
    return (
      <Paper
        {...rest}
        ref={ref}
        elevation={ownerState?.focused ? 12 : 4}
      />
    );
  }
);
TypedPaperWithOwnerState.displayName = 'TypedPaperWithOwnerState';
```

### Typing slotProps Callbacks

```tsx
import { type TextFieldOwnerState } from '@mui/material/TextField';
import { type SliderOwnerState } from '@mui/material/Slider';

// The callback signature is (ownerState: OwnerState) => SlotProps
<TextField
  slotProps={{
    input: (ownerState: TextFieldOwnerState) => ({
      sx: {
        bgcolor: ownerState.error ? 'error.light' : 'background.paper',
      },
    }),
  }}
/>

<Slider
  slotProps={{
    thumb: (ownerState: SliderOwnerState) => ({
      style: {
        backgroundColor: ownerState.active ? '#ff0000' : '#1976d2',
      },
    }),
  }}
/>
```

### Typing DataGrid Slots

```tsx
import {
  DataGrid,
  type GridSlots,
  type GridSlotsComponentsProps,
  type GridToolbarContainerProps,
} from '@mui/x-data-grid';

// Custom toolbar with typed props
interface CustomToolbarProps extends GridToolbarContainerProps {
  onAddClick: () => void;
  title: string;
}

function CustomToolbar({ onAddClick, title, ...props }: CustomToolbarProps) {
  return (
    <GridToolbarContainer {...props}>
      <Typography variant="h6">{title}</Typography>
      <Box sx={{ flexGrow: 1 }} />
      <Button onClick={onAddClick}>Add</Button>
    </GridToolbarContainer>
  );
}

// Pass custom props through slotProps
<DataGrid
  rows={rows}
  columns={columns}
  slots={{
    toolbar: CustomToolbar as GridSlots['toolbar'],
  }}
  slotProps={{
    toolbar: {
      onAddClick: handleAddRow,
      title: 'User Management',
    } as CustomToolbarProps,
  }}
/>
```

### Extending Slot Types for Custom Components

When building a reusable component that accepts slots itself:

```tsx
import { type ElementType, type ComponentPropsWithRef } from 'react';

// Define your own slots interface
interface MyComponentSlots {
  root?: ElementType;
  header?: ElementType;
  content?: ElementType;
  footer?: ElementType;
}

// Define slotProps to match
interface MyComponentSlotProps {
  root?: ComponentPropsWithRef<'div'>;
  header?: ComponentPropsWithRef<'div'> & { title?: string };
  content?: ComponentPropsWithRef<'div'>;
  footer?: ComponentPropsWithRef<'div'>;
}

interface MyComponentProps {
  slots?: MyComponentSlots;
  slotProps?: MyComponentSlotProps;
  children: React.ReactNode;
}

function MyComponent({ slots, slotProps, children }: MyComponentProps) {
  const Root = slots?.root ?? 'div';
  const Header = slots?.header ?? 'div';
  const Content = slots?.content ?? 'div';
  const Footer = slots?.footer ?? 'div';

  return (
    <Root {...slotProps?.root}>
      <Header {...slotProps?.header} />
      <Content {...slotProps?.content}>{children}</Content>
      <Footer {...slotProps?.footer} />
    </Root>
  );
}
```

## Quick Reference: When to Use What

| Goal | Approach |
|------|----------|
| Change props of an internal element | `slotProps.elementName` |
| Replace an internal element entirely | `slots.elementName` |
| Conditional props based on state | `slotProps.elementName` as callback |
| Custom cell in DataGrid column | `renderCell` on `GridColDef` |
| Custom toolbar/footer in DataGrid | `slots.toolbar` / `slots.footer` |
| Override base MUI components in DataGrid | `slots.baseButton` etc. |
| Style an internal element | `slotProps.elementName.sx` |
| Add test IDs to internal elements | `slotProps.elementName['data-testid']` |
