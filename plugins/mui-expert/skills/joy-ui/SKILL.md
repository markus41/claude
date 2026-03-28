---
name: joy-ui
description: Joy UI — MUI's alternative design system with CSS variables, modern aesthetics, and simpler API
triggers:
  - Joy UI
  - joy
  - "@mui/joy"
  - alternative design
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

# Joy UI

## What is Joy UI?

Joy UI (`@mui/joy`) is MUI's alternative component library that offers a modern, clean design language distinct from Google's Material Design. It is built from the ground up with CSS variables as a first-class feature, a flexible variant system, and a simpler API surface compared to Material UI.

```bash
npm install @mui/joy @emotion/react @emotion/styled
# or
pnpm add @mui/joy @emotion/react @emotion/styled
```

Joy UI shares MUI's engineering quality (accessibility, TypeScript, composability) but makes different design decisions:

- **CSS variables by default** -- not experimental, not opt-in
- **Variant system** -- every component supports `solid`, `soft`, `outlined`, `plain`
- **Color system** -- semantic colors (`primary`, `neutral`, `danger`, `success`, `warning`) instead of `primary`/`secondary`
- **Decoration levels** -- replaces Material UI's `elevation` with a more flexible concept
- **Modern aesthetic** -- rounded, spacious, contemporary look out of the box

## When to Use Joy UI

| Scenario | Recommendation |
|----------|---------------|
| App should NOT look like Material Design | Joy UI |
| Want CSS variables without experimental flags | Joy UI |
| Need Google Material Design compliance | Material UI |
| Building a modern SaaS dashboard | Joy UI |
| Existing Material UI codebase | Material UI (or gradual migration) |
| Need the largest component catalog | Material UI (more components today) |
| Want built-in dark mode with zero config | Joy UI |

## Key Differences from Material UI

### Variant System

Material UI uses `variant` on some components (`contained`, `outlined`, `text` for Button). Joy UI applies a consistent variant system across ALL components:

| Variant | Description | Use Case |
|---------|-------------|----------|
| `solid` | Filled background, high emphasis | Primary actions, selected states |
| `soft` | Subtle background tint | Secondary actions, tags, badges |
| `outlined` | Border only | Tertiary actions, form fields |
| `plain` | No background or border | Low-emphasis, text-like actions |

```tsx
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';
import Alert from '@mui/joy/Alert';

// Every component supports all four variants
<Button variant="solid">Submit</Button>
<Button variant="soft">Draft</Button>
<Button variant="outlined">Cancel</Button>
<Button variant="plain">Skip</Button>

<Chip variant="soft" color="success">Active</Chip>
<Alert variant="outlined" color="warning">Check your input</Alert>
```

### Color System

Material UI: `primary`, `secondary`, `error`, `warning`, `info`, `success`
Joy UI: `primary`, `neutral`, `danger`, `success`, `warning`

```tsx
import Button from '@mui/joy/Button';
import Typography from '@mui/joy/Typography';

<Button color="primary">Primary</Button>
<Button color="neutral">Neutral</Button>
<Button color="danger">Delete</Button>
<Button color="success">Approve</Button>
<Button color="warning">Caution</Button>

<Typography color="danger">Error message</Typography>
```

### Component Naming Differences

| Material UI | Joy UI | Notes |
|-------------|--------|-------|
| `Paper` | `Sheet` | Surface container |
| `TextField` | `Input` / `Textarea` | Separate components, not a wrapper |
| `AppBar` | `Header` (custom) | Joy UI does not ship AppBar; use `Sheet` |
| `Snackbar` | `Snackbar` | Same name, different API |
| `Fab` | No equivalent | Use `IconButton` with `variant="solid"` |
| `Rating` | No equivalent | Not yet available in Joy UI |
| `SpeedDial` | No equivalent | Not yet available |

### Decoration Levels vs Elevation

Material UI uses `elevation={0..24}` for box-shadow depth. Joy UI uses CSS variables and the `shadow` prop:

```tsx
import Sheet from '@mui/joy/Sheet';

// Joy UI -- shadow levels
<Sheet variant="outlined" sx={{ p: 2 }}>No shadow</Sheet>
<Sheet variant="outlined" sx={{ p: 2, boxShadow: 'sm' }}>Small shadow</Sheet>
<Sheet variant="outlined" sx={{ p: 2, boxShadow: 'md' }}>Medium shadow</Sheet>
<Sheet variant="outlined" sx={{ p: 2, boxShadow: 'lg' }}>Large shadow</Sheet>
```

## Setup

### Basic Setup with CssVarsProvider

```tsx
// src/main.tsx
import { CssVarsProvider } from '@mui/joy/styles';
import CssBaseline from '@mui/joy/CssBaseline';
import App from './App';

function Root() {
  return (
    <CssVarsProvider>
      <CssBaseline />
      <App />
    </CssVarsProvider>
  );
}
```

`CssVarsProvider` replaces Material UI's `ThemeProvider`. It automatically:
- Injects CSS variables into `:root`
- Supports light/dark mode toggle without theme re-creation
- Enables runtime theme switching without JavaScript recalculation

### Dark Mode Toggle

```tsx
import { useColorScheme } from '@mui/joy/styles';
import IconButton from '@mui/joy/IconButton';

function ColorSchemeToggle() {
  const { mode, setMode } = useColorScheme();

  return (
    <IconButton
      variant="outlined"
      color="neutral"
      onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
    >
      {mode === 'dark' ? <SunIcon /> : <MoonIcon />}
    </IconButton>
  );
}
```

No need to create separate light/dark themes. The CSS variables automatically switch.

## Theme Customization

### Using extendTheme

```tsx
import { CssVarsProvider, extendTheme } from '@mui/joy/styles';

const customTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563eb',
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        success: {
          solidBg: '#16a34a',
          solidHoverBg: '#15803d',
        },
      },
    },
    dark: {
      palette: {
        primary: {
          solidBg: '#3b82f6',
          solidHoverBg: '#2563eb',
        },
      },
    },
  },
  fontFamily: {
    body: '"Inter", var(--joy-fontFamily-fallback)',
    display: '"Inter", var(--joy-fontFamily-fallback)',
  },
  typography: {
    h1: {
      fontSize: '2.25rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '1.875rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
  },
  radius: {
    sm: '6px',
    md: '8px',
    lg: '12px',
  },
  components: {
    JoyButton: {
      styleOverrides: {
        root: {
          borderRadius: 'var(--joy-radius-md)',
          fontWeight: 600,
        },
      },
      defaultProps: {
        variant: 'solid',
        color: 'primary',
      },
    },
    JoyInput: {
      styleOverrides: {
        root: {
          '--Input-radius': 'var(--joy-radius-md)',
        },
      },
    },
  },
});

function App() {
  return (
    <CssVarsProvider theme={customTheme}>
      <CssBaseline />
      {/* app content */}
    </CssVarsProvider>
  );
}
```

### Accessing CSS Variables in Custom Components

```tsx
import { styled } from '@mui/joy/styles';

const CustomCard = styled('div')(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.vars.radius.md,
  backgroundColor: theme.vars.palette.background.surface,
  border: `1px solid ${theme.vars.palette.divider}`,
  boxShadow: theme.vars.shadow.sm,
  // CSS variables are also accessible as plain CSS
  // background: 'var(--joy-palette-background-surface)',
}));
```

### Custom Tokens

```tsx
const theme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        // Custom semantic tokens
        brand: {
          50: '#fdf2f8',
          500: '#ec4899',
          700: '#be185d',
        },
      },
    },
  },
});

// TypeScript: augment the palette interface
declare module '@mui/joy/styles' {
  interface PaletteRange {
    // already exists in Joy
  }
  interface Palette {
    brand: PaletteRange;
  }
}
```

## Component Examples

### Button

```tsx
import Button from '@mui/joy/Button';
import IconButton from '@mui/joy/IconButton';
import ButtonGroup from '@mui/joy/ButtonGroup';

// Variants and colors
<Button variant="solid" color="primary">Save</Button>
<Button variant="soft" color="neutral">Cancel</Button>
<Button variant="outlined" color="danger">Delete</Button>
<Button variant="plain" color="success">Approve</Button>

// Sizes
<Button size="sm">Small</Button>
<Button size="md">Medium</Button>
<Button size="lg">Large</Button>

// With icons
<Button startDecorator={<PlusIcon />}>Add item</Button>
<Button endDecorator={<ArrowRightIcon />}>Next</Button>

// Loading state
<Button loading>Saving...</Button>
<Button loading loadingPosition="start" startDecorator={<SaveIcon />}>
  Saving...
</Button>

// Icon button
<IconButton variant="soft" color="neutral">
  <SettingsIcon />
</IconButton>

// Button group
<ButtonGroup variant="outlined" color="neutral">
  <Button>Left</Button>
  <Button>Center</Button>
  <Button>Right</Button>
</ButtonGroup>
```

### Input and Textarea

```tsx
import Input from '@mui/joy/Input';
import Textarea from '@mui/joy/Textarea';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import FormHelperText from '@mui/joy/FormHelperText';

// Basic input
<Input placeholder="Enter your name" />

// With decorators (adornments)
<Input
  startDecorator={<SearchIcon />}
  endDecorator={<IconButton variant="plain"><ClearIcon /></IconButton>}
  placeholder="Search..."
/>

// Form control with label and helper text
<FormControl error>
  <FormLabel>Email</FormLabel>
  <Input
    type="email"
    placeholder="name@example.com"
    variant="outlined"
  />
  <FormHelperText>Please enter a valid email address.</FormHelperText>
</FormControl>

// Textarea with auto-resize
<Textarea
  placeholder="Write your message..."
  minRows={3}
  maxRows={6}
  variant="outlined"
/>
```

### Card (Sheet-based)

```tsx
import Card from '@mui/joy/Card';
import CardContent from '@mui/joy/CardContent';
import CardOverflow from '@mui/joy/CardOverflow';
import CardActions from '@mui/joy/CardActions';
import AspectRatio from '@mui/joy/AspectRatio';
import Typography from '@mui/joy/Typography';
import Button from '@mui/joy/Button';
import Chip from '@mui/joy/Chip';

function ProductCard() {
  return (
    <Card variant="outlined" sx={{ width: 320 }}>
      <CardOverflow>
        <AspectRatio ratio="16/9">
          <img src="/product.jpg" alt="Product" loading="lazy" />
        </AspectRatio>
      </CardOverflow>

      <CardContent>
        <Typography level="title-md">Premium Headphones</Typography>
        <Typography level="body-sm" textColor="text.tertiary">
          Noise-cancelling wireless headphones with 30-hour battery life.
        </Typography>
        <Chip variant="soft" color="success" size="sm" sx={{ mt: 1 }}>
          In Stock
        </Chip>
      </CardContent>

      <CardOverflow variant="soft" sx={{ bgcolor: 'background.level1' }}>
        <CardActions>
          <Typography level="title-lg" sx={{ mr: 'auto' }}>
            $299
          </Typography>
          <Button variant="solid" color="primary" size="sm">
            Add to Cart
          </Button>
        </CardActions>
      </CardOverflow>
    </Card>
  );
}
```

### Typography

```tsx
import Typography from '@mui/joy/Typography';

// Joy UI uses "level" instead of "variant"
<Typography level="h1">Heading 1</Typography>
<Typography level="h2">Heading 2</Typography>
<Typography level="h3">Heading 3</Typography>
<Typography level="h4">Heading 4</Typography>
<Typography level="title-lg">Title Large</Typography>
<Typography level="title-md">Title Medium</Typography>
<Typography level="title-sm">Title Small</Typography>
<Typography level="body-lg">Body Large</Typography>
<Typography level="body-md">Body Medium (default)</Typography>
<Typography level="body-sm">Body Small</Typography>
<Typography level="body-xs">Body Extra Small</Typography>

// With color
<Typography color="primary">Primary text</Typography>
<Typography color="danger">Error message</Typography>
<Typography textColor="text.secondary">Secondary text</Typography>

// Decorators (icons inline with text)
<Typography startDecorator={<InfoIcon />}>
  This is an informational message.
</Typography>
```

### Modal

```tsx
import Modal from '@mui/joy/Modal';
import ModalDialog from '@mui/joy/ModalDialog';
import ModalClose from '@mui/joy/ModalClose';
import DialogTitle from '@mui/joy/DialogTitle';
import DialogContent from '@mui/joy/DialogContent';
import DialogActions from '@mui/joy/DialogActions';
import Button from '@mui/joy/Button';
import { useState } from 'react';

function ConfirmDialog() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button variant="outlined" color="danger" onClick={() => setOpen(true)}>
        Delete Account
      </Button>

      <Modal open={open} onClose={() => setOpen(false)}>
        <ModalDialog variant="outlined" role="alertdialog" size="md">
          <ModalClose />
          <DialogTitle>
            Are you sure?
          </DialogTitle>
          <DialogContent>
            This action cannot be undone. All your data will be permanently deleted.
          </DialogContent>
          <DialogActions>
            <Button variant="solid" color="danger" onClick={() => setOpen(false)}>
              Delete
            </Button>
            <Button variant="plain" color="neutral" onClick={() => setOpen(false)}>
              Cancel
            </Button>
          </DialogActions>
        </ModalDialog>
      </Modal>
    </>
  );
}

// Fullscreen modal on mobile
<ModalDialog
  layout="fullscreen" // 'center' | 'fullscreen'
  sx={(theme) => ({
    [theme.breakpoints.only('xs')]: {
      top: 'unset',
      bottom: 0,
      left: 0,
      right: 0,
      borderRadius: '12px 12px 0 0',
      transform: 'none',
    },
  })}
>
  {/* content */}
</ModalDialog>
```

### Autocomplete

```tsx
import Autocomplete from '@mui/joy/Autocomplete';
import AutocompleteOption from '@mui/joy/AutocompleteOption';
import FormControl from '@mui/joy/FormControl';
import FormLabel from '@mui/joy/FormLabel';
import ListItemContent from '@mui/joy/ListItemContent';
import ListItemDecorator from '@mui/joy/ListItemDecorator';
import Typography from '@mui/joy/Typography';

interface Country {
  code: string;
  label: string;
  phone: string;
}

const countries: Country[] = [
  { code: 'US', label: 'United States', phone: '+1' },
  { code: 'GB', label: 'United Kingdom', phone: '+44' },
  { code: 'DE', label: 'Germany', phone: '+49' },
  // ...
];

function CountrySelect() {
  return (
    <FormControl>
      <FormLabel>Country</FormLabel>
      <Autocomplete
        placeholder="Choose a country"
        options={countries}
        getOptionLabel={(option) => option.label}
        isOptionEqualToValue={(option, value) => option.code === value.code}
        renderOption={(props, option) => (
          <AutocompleteOption {...props}>
            <ListItemDecorator>
              <span className={`fi fi-${option.code.toLowerCase()}`} />
            </ListItemDecorator>
            <ListItemContent>
              <Typography level="body-md">{option.label}</Typography>
              <Typography level="body-xs" textColor="text.tertiary">
                {option.phone}
              </Typography>
            </ListItemContent>
          </AutocompleteOption>
        )}
        variant="outlined"
        sx={{ width: 300 }}
      />
    </FormControl>
  );
}
```

## Using Joy UI + Material UI Together

It is possible to use both Joy UI and Material UI in the same application. This is useful during migration or when you need components that only exist in one library.

### Setup: Dual Provider

```tsx
import { CssVarsProvider as JoyCssVarsProvider } from '@mui/joy/styles';
import {
  ThemeProvider as MaterialThemeProvider,
  createTheme as materialCreateTheme,
  THEME_ID as MATERIAL_THEME_ID,
} from '@mui/material/styles';
import CssBaseline from '@mui/joy/CssBaseline';

const materialTheme = materialCreateTheme();

function App() {
  return (
    <MaterialThemeProvider theme={{ [MATERIAL_THEME_ID]: materialTheme }}>
      <JoyCssVarsProvider>
        <CssBaseline enableColorScheme />
        {/* Both Joy UI and Material UI components work here */}
      </JoyCssVarsProvider>
    </MaterialThemeProvider>
  );
}
```

### Avoiding CSS Variable Conflicts

Joy UI and Material UI both generate CSS variables. To avoid collisions:

```tsx
import { extendTheme } from '@mui/joy/styles';

const joyTheme = extendTheme({
  cssVarPrefix: 'joy', // default, but explicit for clarity
});

// Material UI variables use --mui- prefix
// Joy UI variables use --joy- prefix
// No collision
```

### Sharing Design Tokens Between Both Libraries

```tsx
// shared-tokens.ts
export const sharedTokens = {
  primaryMain: '#2563eb',
  primaryLight: '#60a5fa',
  primaryDark: '#1d4ed8',
  fontFamily: '"Inter", sans-serif',
  borderRadius: '8px',
};

// joy-theme.ts
import { extendTheme } from '@mui/joy/styles';
import { sharedTokens } from './shared-tokens';

export const joyTheme = extendTheme({
  colorSchemes: {
    light: {
      palette: {
        primary: {
          500: sharedTokens.primaryMain,
          400: sharedTokens.primaryLight,
          700: sharedTokens.primaryDark,
        },
      },
    },
  },
  fontFamily: {
    body: sharedTokens.fontFamily,
  },
});

// material-theme.ts
import { createTheme } from '@mui/material/styles';
import { sharedTokens } from './shared-tokens';

export const materialTheme = createTheme({
  palette: {
    primary: {
      main: sharedTokens.primaryMain,
      light: sharedTokens.primaryLight,
      dark: sharedTokens.primaryDark,
    },
  },
  typography: {
    fontFamily: sharedTokens.fontFamily,
  },
  shape: {
    borderRadius: parseInt(sharedTokens.borderRadius),
  },
});
```

## Migration Considerations

### When to Choose Joy UI over Material UI

Choose Joy UI when:

1. **Starting a new project** that should not look like Material Design
2. **CSS variables are critical** for runtime theming (white-label, user-customizable themes)
3. **Dark mode must work seamlessly** without re-rendering the component tree
4. **Consistent variant system** across all components is important to your design team
5. **Modern aesthetic** is desired without heavy theme overrides

Stay with Material UI when:

1. **You have a large existing Material UI codebase** -- migration cost may not be justified
2. **You need components that Joy UI does not yet offer** (Rating, SpeedDial, Timeline, TreeView, DataGrid)
3. **Material Design compliance is required** (e.g., internal Google-ecosystem tools)
4. **Ecosystem maturity matters** -- Material UI has more community themes, templates, and third-party integrations

### Migration Checklist (Material UI to Joy UI)

```
[ ] Replace ThemeProvider with CssVarsProvider
[ ] Replace createTheme with extendTheme
[ ] Update component imports: @mui/material -> @mui/joy
[ ] Replace Paper with Sheet
[ ] Replace TextField with Input/Textarea + FormControl
[ ] Update variant values: "contained" -> "solid", "text" -> "plain"
[ ] Update color values: "error" -> "danger", "info" -> (use "primary" or "neutral")
[ ] Replace elevation prop with boxShadow sx prop
[ ] Replace Typography variant prop with level prop
[ ] Update Chip variant: "filled" -> "solid"
[ ] Test dark mode toggle (should work out of the box)
[ ] Verify CSS variable usage in custom styled components
[ ] Replace makeStyles/withStyles with sx prop or styled()
```

### Side-by-Side Component Mapping

```tsx
// MATERIAL UI                           // JOY UI
// ============                          // ======

import Paper from '@mui/material/Paper';  import Sheet from '@mui/joy/Sheet';
<Paper elevation={3}>                     <Sheet variant="outlined" sx={{ boxShadow: 'md' }}>

import TextField from '@mui/material/..'; import Input from '@mui/joy/Input';
<TextField                                <FormControl>
  label="Name"                              <FormLabel>Name</FormLabel>
  variant="outlined"                        <Input variant="outlined"
  error                                       error
  helperText="Required"                       />
/>                                          <FormHelperText>Required</FormHelperText>
                                           </FormControl>

<Button variant="contained">              <Button variant="solid">
<Button variant="text">                   <Button variant="plain">
<Chip variant="filled">                   <Chip variant="solid">
<Alert severity="error">                  <Alert color="danger">
<Typography variant="h4">                 <Typography level="h4">
<Typography variant="body1">              <Typography level="body-md">
```
