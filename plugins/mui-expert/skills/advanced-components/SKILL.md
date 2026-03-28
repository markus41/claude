---
name: advanced-components
description: Advanced MUI component patterns — Autocomplete (async, virtualized, grouped, createFilterOptions), Stepper (non-linear, vertical, mobile), Popover, Popper, Portal, ClickAwayListener, and complex composition
triggers:
  - Autocomplete advanced
  - Stepper
  - Popover
  - Popper
  - Portal
  - ClickAwayListener
  - createFilterOptions
  - combo box
  - free solo
  - async autocomplete
  - grouped options
  - non-linear stepper
  - vertical stepper
  - mobile stepper
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
  - "*.jsx"
---

# Advanced MUI Component Patterns

Deep patterns for complex MUI components that go beyond basic usage.

---

## Autocomplete — Advanced Patterns

### Async / Server-Side Options

```tsx
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useEffect, useRef } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

function AsyncAutocomplete() {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (!open) return;
    if (!inputValue) {
      setOptions([]);
      return;
    }

    // Debounce API calls
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/users?search=${encodeURIComponent(inputValue)}`);
        const data: User[] = await res.json();
        setOptions(data);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [inputValue, open]);

  return (
    <Autocomplete
      open={open}
      onOpen={() => setOpen(true)}
      onClose={() => setOpen(false)}
      options={options}
      loading={loading}
      getOptionLabel={(option) => option.name}
      isOptionEqualToValue={(option, value) => option.id === value.id}
      onInputChange={(_, value) => setInputValue(value)}
      filterOptions={(x) => x} // disable client-side filtering — server handles it
      renderInput={(params) => (
        <TextField
          {...params}
          label="Search users"
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading && <CircularProgress color="inherit" size={20} />}
                  {params.InputProps.endAdornment}
                </>
              ),
            },
          }}
        />
      )}
      renderOption={(props, option) => (
        <li {...props} key={option.id}>
          <Box>
            <Typography variant="body1">{option.name}</Typography>
            <Typography variant="caption" color="text.secondary">{option.email}</Typography>
          </Box>
        </li>
      )}
    />
  );
}
```

### createFilterOptions — Custom Filtering

```tsx
import { createFilterOptions } from '@mui/material/Autocomplete';

interface Film {
  title: string;
  year: number;
  inputValue?: string; // for "create" option
}

// Custom filter: match start of title, limit to 10
const filter = createFilterOptions<Film>({
  matchFrom: 'start',    // 'start' | 'any' (default: 'any')
  limit: 10,             // max options shown
  stringify: (option) => option.title, // what to search against
  ignoreAccents: true,   // normalize accents
  ignoreCase: true,      // case-insensitive (default: true)
  trim: true,            // trim whitespace
});

// "Create" option pattern — add user-typed value as new option
<Autocomplete
  freeSolo
  selectOnFocus
  clearOnBlur
  handleHomeEndKeys
  options={films}
  filterOptions={(options, params) => {
    const filtered = filter(options, params);

    const { inputValue } = params;
    // Suggest creating a new value
    const isExisting = options.some((option) => inputValue === option.title);
    if (inputValue !== '' && !isExisting) {
      filtered.push({
        inputValue,
        title: `Add "${inputValue}"`,
        year: new Date().getFullYear(),
      });
    }
    return filtered;
  }}
  getOptionLabel={(option) => {
    if (typeof option === 'string') return option;
    if (option.inputValue) return option.inputValue;
    return option.title;
  }}
  onChange={(_, newValue) => {
    if (newValue && typeof newValue !== 'string' && newValue.inputValue) {
      // User chose "Add ..." — create the new item
      handleCreate(newValue.inputValue);
    }
  }}
  renderInput={(params) => <TextField {...params} label="Film" />}
/>
```

### Virtualized Autocomplete (10,000+ options)

```tsx
import { FixedSizeList, ListChildComponentProps } from 'react-window';
import { forwardRef, HTMLAttributes } from 'react';

const ITEM_HEIGHT = 36;
const LISTBOX_PADDING = 8;

function renderRow(props: ListChildComponentProps) {
  const { data, index, style } = props;
  const dataSet = data[index];
  const inlineStyle = {
    ...style,
    top: (style.top as number) + LISTBOX_PADDING,
  };
  return (
    <li {...dataSet[0]} style={inlineStyle} key={dataSet[1].id}>
      {dataSet[1].label}
    </li>
  );
}

const ListboxComponent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLElement>>(
  function ListboxComponent(props, ref) {
    const { children, ...other } = props;
    const items = children as [HTMLAttributes<HTMLElement>, { label: string; id: string }][];
    const itemCount = items.length;
    const height = Math.min(8, itemCount) * ITEM_HEIGHT + 2 * LISTBOX_PADDING;

    return (
      <div ref={ref} {...other}>
        <FixedSizeList
          height={height}
          width="100%"
          itemSize={ITEM_HEIGHT}
          itemCount={itemCount}
          itemData={items}
          overscanCount={5}
        >
          {renderRow}
        </FixedSizeList>
      </div>
    );
  }
);

<Autocomplete
  disableListWrap
  slots={{ listbox: ListboxComponent }}
  options={tenThousandOptions}
  renderInput={(params) => <TextField {...params} label="10,000 options" />}
/>
```

### Grouped Options

```tsx
<Autocomplete
  options={countries.sort((a, b) => -b.continent.localeCompare(a.continent))}
  groupBy={(option) => option.continent}
  getOptionLabel={(option) => option.name}
  renderGroup={(params) => (
    <li key={params.key}>
      <GroupHeader>{params.group}</GroupHeader>
      <GroupItems>{params.children}</GroupItems>
    </li>
  )}
  renderInput={(params) => <TextField {...params} label="Country" />}
/>
```

### Multiple with Chip Limit

```tsx
<Autocomplete
  multiple
  limitTags={2}           // show max 2 chips, "+N" for overflow
  disableCloseOnSelect    // keep dropdown open after selection
  options={allTags}
  getOptionLabel={(option) => option.label}
  renderTags={(value, getTagProps, ownerState) =>
    value.map((option, index) => {
      const { key, ...tagProps } = getTagProps({ index });
      return (
        <Chip
          key={key}
          label={option.label}
          size="small"
          color="primary"
          variant="outlined"
          {...tagProps}
        />
      );
    })
  }
  renderInput={(params) => <TextField {...params} label="Tags" placeholder="Add..." />}
/>
```

### Highlight Matching Text

```tsx
import parse from 'autosuggest-highlight/parse';
import match from 'autosuggest-highlight/match';

<Autocomplete
  options={options}
  renderOption={(props, option, { inputValue }) => {
    const matches = match(option.label, inputValue, { insideWords: true });
    const parts = parse(option.label, matches);
    return (
      <li {...props}>
        {parts.map((part, index) => (
          <span key={index} style={{ fontWeight: part.highlight ? 700 : 400 }}>
            {part.text}
          </span>
        ))}
      </li>
    );
  }}
  renderInput={(params) => <TextField {...params} label="Highlight demo" />}
/>
```

---

## Stepper — Advanced Patterns

### Horizontal Stepper with Validation

```tsx
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import StepContent from '@mui/material/StepContent';
import Button from '@mui/material/Button';

const steps = ['Account', 'Profile', 'Confirm'];

function HorizontalStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [errors, setErrors] = useState<Record<number, string>>({});

  const validateStep = (step: number): boolean => {
    // Per-step validation logic
    switch (step) {
      case 0: return !!formData.email && !!formData.password;
      case 1: return !!formData.name;
      default: return true;
    }
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setErrors((prev) => ({ ...prev, [activeStep]: '' }));
      setActiveStep((prev) => prev + 1);
    } else {
      setErrors((prev) => ({ ...prev, [activeStep]: 'Please fill all fields' }));
    }
  };

  return (
    <>
      <Stepper activeStep={activeStep} alternativeLabel>
        {steps.map((label, index) => (
          <Step key={label}>
            <StepLabel
              error={!!errors[index]}
              optional={errors[index] ? (
                <Typography variant="caption" color="error">{errors[index]}</Typography>
              ) : undefined}
            >
              {label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      {/* Step content */}
      {activeStep === 0 && <AccountForm />}
      {activeStep === 1 && <ProfileForm />}
      {activeStep === 2 && <ConfirmStep />}
      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button disabled={activeStep === 0} onClick={() => setActiveStep((p) => p - 1)}>
          Back
        </Button>
        <Button variant="contained" onClick={handleNext}>
          {activeStep === steps.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </Box>
    </>
  );
}
```

### Vertical Stepper (Step Content)

```tsx
<Stepper activeStep={activeStep} orientation="vertical">
  {steps.map((step, index) => (
    <Step key={step.label}>
      <StepLabel
        optional={index === steps.length - 1 ? (
          <Typography variant="caption">Last step</Typography>
        ) : undefined}
      >
        {step.label}
      </StepLabel>
      <StepContent TransitionProps={{ unmountOnExit: false }}>
        <Typography>{step.description}</Typography>
        {step.content}
        <Box sx={{ mt: 2 }}>
          <Button variant="contained" onClick={handleNext} sx={{ mr: 1 }}>
            {index === steps.length - 1 ? 'Finish' : 'Continue'}
          </Button>
          <Button disabled={index === 0} onClick={handleBack}>Back</Button>
        </Box>
      </StepContent>
    </Step>
  ))}
</Stepper>
```

### Non-Linear Stepper

```tsx
function NonLinearStepper() {
  const [activeStep, setActiveStep] = useState(0);
  const [completed, setCompleted] = useState<Record<number, boolean>>({});

  const handleStep = (step: number) => () => {
    setActiveStep(step); // Jump to any step
  };

  const handleComplete = () => {
    setCompleted((prev) => ({ ...prev, [activeStep]: true }));
    // Move to next incomplete step
    const next = steps.findIndex((_, i) => !completed[i] && i !== activeStep);
    if (next !== -1) setActiveStep(next);
  };

  const allCompleted = Object.keys(completed).length === steps.length;

  return (
    <Stepper nonLinear activeStep={activeStep}>
      {steps.map((label, index) => (
        <Step key={label} completed={completed[index]}>
          <StepButton color="inherit" onClick={handleStep(index)}>
            {label}
          </StepButton>
        </Step>
      ))}
    </Stepper>
  );
}
```

### Custom Step Icons & Connectors

```tsx
import StepConnector, { stepConnectorClasses } from '@mui/material/StepConnector';
import { StepIconProps } from '@mui/material/StepIcon';
import { styled } from '@mui/material/styles';
import Check from '@mui/icons-material/Check';

const QontoConnector = styled(StepConnector)(({ theme }) => ({
  [`&.${stepConnectorClasses.alternativeLabel}`]: {
    top: 10,
    left: 'calc(-50% + 16px)',
    right: 'calc(50% + 16px)',
  },
  [`&.${stepConnectorClasses.active}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`&.${stepConnectorClasses.completed}`]: {
    [`& .${stepConnectorClasses.line}`]: {
      borderColor: theme.palette.primary.main,
    },
  },
  [`& .${stepConnectorClasses.line}`]: {
    borderColor: theme.palette.divider,
    borderTopWidth: 3,
    borderRadius: 1,
  },
}));

function QontoStepIcon(props: StepIconProps) {
  const { active, completed, className } = props;
  return (
    <Box
      className={className}
      sx={{
        color: active || completed ? 'primary.main' : 'text.disabled',
        display: 'flex',
        height: 22,
        alignItems: 'center',
      }}
    >
      {completed ? (
        <Check sx={{ fontSize: 18 }} />
      ) : (
        <Box
          sx={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            backgroundColor: 'currentColor',
          }}
        />
      )}
    </Box>
  );
}

<Stepper alternativeLabel activeStep={activeStep} connector={<QontoConnector />}>
  {steps.map((label) => (
    <Step key={label}>
      <StepLabel StepIconComponent={QontoStepIcon}>{label}</StepLabel>
    </Step>
  ))}
</Stepper>
```

### MobileStepper (Dots / Progress / Text)

```tsx
import MobileStepper from '@mui/material/MobileStepper';
import KeyboardArrowLeft from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRight from '@mui/icons-material/KeyboardArrowRight';

<MobileStepper
  variant="dots"          // 'dots' | 'progress' | 'text'
  steps={maxSteps}
  position="static"       // 'static' | 'top' | 'bottom'
  activeStep={activeStep}
  nextButton={
    <Button size="small" onClick={handleNext} disabled={activeStep === maxSteps - 1}>
      Next <KeyboardArrowRight />
    </Button>
  }
  backButton={
    <Button size="small" onClick={handleBack} disabled={activeStep === 0}>
      <KeyboardArrowLeft /> Back
    </Button>
  }
/>
```

---

## Popover

```tsx
import Popover from '@mui/material/Popover';

// Anchor to element
const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);

<Button onClick={(e) => setAnchorEl(e.currentTarget)}>Open Popover</Button>
<Popover
  open={Boolean(anchorEl)}
  anchorEl={anchorEl}
  onClose={() => setAnchorEl(null)}
  anchorOrigin={{
    vertical: 'bottom',    // 'top' | 'center' | 'bottom' | number
    horizontal: 'left',    // 'left' | 'center' | 'right' | number
  }}
  transformOrigin={{
    vertical: 'top',
    horizontal: 'left',
  }}
  slotProps={{
    paper: {
      sx: { p: 2, maxWidth: 300 },
    },
  }}
>
  <Typography>Popover content</Typography>
</Popover>

// Mouse-follow popover
<Popover
  open={Boolean(anchorEl)}
  anchorReference="anchorPosition"
  anchorPosition={
    anchorEl ? { top: mouseY, left: mouseX } : undefined
  }
>
  <Typography>Follows cursor</Typography>
</Popover>

// Virtual element (e.g., text selection)
<Popover
  open={open}
  anchorEl={{
    getBoundingClientRect: () => ({
      top: selectionRect.top,
      left: selectionRect.left,
      bottom: selectionRect.bottom,
      right: selectionRect.right,
      width: selectionRect.width,
      height: selectionRect.height,
      x: selectionRect.x,
      y: selectionRect.y,
      toJSON: () => {},
    }),
  }}
>
  <FormattingToolbar />
</Popover>
```

---

## Popper

Lower-level than Popover — no backdrop, no click-away handling built in.

```tsx
import Popper from '@mui/material/Popper';
import ClickAwayListener from '@mui/material/ClickAwayListener';
import Fade from '@mui/material/Fade';
import Paper from '@mui/material/Paper';

const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
const open = Boolean(anchorEl);

<Button onClick={(e) => setAnchorEl(anchorEl ? null : e.currentTarget)}>
  Toggle
</Button>
<Popper
  open={open}
  anchorEl={anchorEl}
  placement="bottom-start"    // 12 placements: top, bottom, left, right + start/end
  transition
  modifiers={[
    { name: 'offset', options: { offset: [0, 8] } },       // [skid, distance]
    { name: 'flip', options: { fallbackPlacements: ['top-start'] } },
    { name: 'preventOverflow', options: { boundary: 'viewport' } },
  ]}
>
  {({ TransitionProps }) => (
    <Fade {...TransitionProps} timeout={200}>
      <Paper elevation={8} sx={{ p: 2, maxWidth: 300 }}>
        <ClickAwayListener onClickAway={() => setAnchorEl(null)}>
          <Box>
            <Typography>Popper content</Typography>
            <Button onClick={() => setAnchorEl(null)}>Close</Button>
          </Box>
        </ClickAwayListener>
      </Paper>
    </Fade>
  )}
</Popper>
```

### Popper Placements

```
top-start    top    top-end
left-start            right-start
left                  right
left-end              right-end
bottom-start bottom bottom-end
```

---

## Portal

Renders children into a different part of the DOM tree.

```tsx
import Portal from '@mui/material/Portal';

// Render into document.body (default)
<Portal>
  <Box sx={{ position: 'fixed', bottom: 16, right: 16 }}>
    Floating element
  </Box>
</Portal>

// Render into a specific container
const containerRef = useRef<HTMLDivElement>(null);

<div ref={containerRef} />
<Portal container={containerRef.current}>
  <Typography>Rendered inside the div above</Typography>
</Portal>

// Disable portal (render in place)
<Portal disablePortal>
  <Typography>Rendered in the normal tree position</Typography>
</Portal>
```

---

## ClickAwayListener

Detects clicks outside the wrapped element.

```tsx
import ClickAwayListener from '@mui/material/ClickAwayListener';

<ClickAwayListener
  onClickAway={handleClose}
  mouseEvent="onMouseDown"    // 'onClick' | 'onMouseDown' | 'onMouseUp' | false
  touchEvent="onTouchStart"   // 'onTouchStart' | 'onTouchEnd' | false
>
  <Box sx={{ position: 'relative' }}>
    <Button onClick={toggleMenu}>Menu</Button>
    {open && (
      <Paper sx={{ position: 'absolute', top: '100%', zIndex: 1 }}>
        <MenuItem>Item 1</MenuItem>
        <MenuItem>Item 2</MenuItem>
      </Paper>
    )}
  </Box>
</ClickAwayListener>
```

**Gotcha**: ClickAwayListener only works with a single child element. If wrapping multiple elements, wrap them in a `<div>` or `<Box>`.

---

## NoSsr

Defers rendering to client only — useful for client-dependent content.

```tsx
import NoSsr from '@mui/material/NoSsr';

// Content only renders on client (prevents SSR hydration mismatch)
<NoSsr fallback={<Skeleton variant="rectangular" height={200} />}>
  <MapComponent /> {/* Uses window.navigator, fails on server */}
</NoSsr>

// Defer to second frame (avoid blocking first paint)
<NoSsr defer>
  <HeavyChart />
</NoSsr>
```

---

## Composition Patterns

### Component Prop (Polymorphic)

Many MUI components accept a `component` prop to change the rendered HTML element:

```tsx
// Button as a router link
import { Link as RouterLink } from 'react-router-dom';

<Button component={RouterLink} to="/dashboard">
  Dashboard
</Button>

// ListItemButton as a router link
<ListItemButton component={RouterLink} to="/settings">
  <ListItemIcon><SettingsIcon /></ListItemIcon>
  <ListItemText primary="Settings" />
</ListItemButton>

// Card as an article
<Card component="article">
  <CardContent>Article content</CardContent>
</Card>

// Typography as a label
<Typography component="label" htmlFor="email-input">
  Email
</Typography>
```

### Forwarding sx to Inner Components

```tsx
interface CustomCardProps {
  title: string;
  children: React.ReactNode;
  sx?: SxProps<Theme>;
}

function CustomCard({ title, children, sx }: CustomCardProps) {
  return (
    <Card sx={[{ borderRadius: 2, border: '1px solid', borderColor: 'divider' }, ...(Array.isArray(sx) ? sx : [sx])]}>
      <CardContent>
        <Typography variant="h6">{title}</Typography>
        {children}
      </CardContent>
    </Card>
  );
}

// Usage — sx is properly merged
<CustomCard title="Stats" sx={{ bgcolor: 'primary.light' }}>
  Content
</CustomCard>
```

### Render Props with MUI (Headless Patterns)

```tsx
import { useAutocomplete } from '@mui/material/useAutocomplete';

function CustomCombobox({ options, label }: { options: string[]; label: string }) {
  const {
    getRootProps,
    getInputProps,
    getListboxProps,
    getOptionProps,
    groupedOptions,
    focused,
    value,
  } = useAutocomplete({
    options,
    getOptionLabel: (option) => option,
  });

  return (
    <div {...getRootProps()}>
      <label>{label}</label>
      <input {...getInputProps()} />
      {groupedOptions.length > 0 && (
        <ul {...getListboxProps()}>
          {groupedOptions.map((option, index) => (
            <li {...getOptionProps({ option, index })} key={option}>
              {option}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```
