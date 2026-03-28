---
name: MUI Theming & Customization Complete Reference
description: Comprehensive research on MUI theme configuration, component overrides, palette, typography, breakpoints, transitions, and v5→v6 migration
type: reference
---

# MUI Theming & Customization - Complete Technical Reference
**Date:** 2026-03-28
**Source:** Official MUI Documentation (theming, default-theme, theme-components, palette, typography, breakpoints, transitions, color)

---

## SECTION 1: CORE THEME OBJECT STRUCTURE

Material UI themes contain these primary objects:

### 1.1 Palette Object
```typescript
palette: {
  mode: 'light' | 'dark',
  primary: { main, light, dark, contrastText },
  secondary: { main, light, dark, contrastText },
  error: { main, light, dark, contrastText },
  warning: { main, light, dark, contrastText },
  info: { main, light, dark, contrastText },
  success: { main, light, dark, contrastText },
  grey: { 50, 100, 200, ..., 900 },
  text: { primary, secondary, disabled },
  background: { default, paper },
  action: { active, hover, selected, disabled, disabledBackground },
  divider: color
}
```

**Default Light Mode Values:**
- Primary: #1976d2 (main), #42a5f5 (light), #1565c0 (dark)
- Secondary: #9c27b0 (main), #ba68c8 (light), #7b1fa2 (dark)
- Error: #d32f2f (main), #ef5350 (light), #c62828 (dark)
- Warning: #ed6c02 (main), #ff9800 (light), #e65100 (dark)
- Success: #2e7d32 (main), #4caf50 (light), #1b5e20 (dark)
- Info: #0288d1 (main), #03a9f4 (light), #01579b (dark)

**Default Dark Mode Adjustments:**
- Primary switches to #90caf9 (lighter for readability)
- Background: #121212
- Text: #fff (primary), rgba(255,255,255,0.7) (secondary), rgba(255,255,255,0.5) (disabled)

### 1.2 Typography Object
```typescript
typography: {
  fontFamily: string,
  fontSize: number,
  fontWeightLight: 300,
  fontWeightRegular: 400,
  fontWeightMedium: 500,
  fontWeightBold: 700,
  h1: { fontSize, fontWeight, lineHeight, letterSpacing },
  h2: { /* ... */ },
  h3: { /* ... */ },
  h4: { /* ... */ },
  h5: { /* ... */ },
  h6: { /* ... */ },
  subtitle1: { /* ... */ },
  subtitle2: { /* ... */ },
  body1: { /* ... */ },
  body2: { /* ... */ },
  button: { /* ... */ },
  caption: { /* ... */ },
  overline: { /* ... */ }
}
```

**Default Typography:**
- Font family: "Roboto", "Helvetica", "Arial", sans-serif
- Base fontSize: 16px (v6; was 14px in v5)
- h1: 6rem, weight 300, line-height 1.167
- h6: 1.25rem, weight 500, line-height 1.6
- body1: 1rem, weight 400, line-height 1.5
- caption: 0.75rem, weight 400, line-height 1.66

### 1.3 Spacing Object
```typescript
spacing: (n: number) => string
// Default: 8px base unit
// theme.spacing(2) = "16px"
// theme.spacing(3) = "24px"
```

### 1.4 Breakpoints Object
```typescript
breakpoints: {
  values: { xs: 0, sm: 600, md: 960, lg: 1280, xl: 1920 },
  up(key): string,        // @media (min-width: ...)
  down(key): string,      // @media (max-width: ...)
  only(key): string,      // @media (min-width: ...) and (max-width: ...)
  between(start, end): string  // @media (min-width: ...) and (max-width: ...)
}
```

### 1.5 Shadows Object
```typescript
shadows: string[] // 24 elevation levels (0-24)
// shadows[0] = 'none'
// shadows[1] = '0px 2px 1px -1px rgba(0,0,0,0.2),...'
// shadows[24] = maximum elevation shadow
```

### 1.6 Transitions Object
```typescript
transitions: {
  duration: {
    shortest: 150,      // ms
    shorter: 200,
    short: 250,
    standard: 300,
    complex: 375,
    enteringScreen: 225,
    leavingScreen: 195
  },
  easing: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
    linear: 'cubic-bezier(0, 0, 1, 1)',
    sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
  },
  create(props, options): string  // Generates CSS transition string
}
```

### 1.7 Shape Object
```typescript
shape: {
  borderRadius: 4  // Default border radius in px
}
```

### 1.8 Z-Index Object
```typescript
zIndex: {
  mobileStepper: 1000,
  fab: 1050,
  speedDial: 1050,
  appBar: 1100,
  drawer: 1200,
  modal: 1300,
  snackbar: 1400,
  tooltip: 1500
}
```

### 1.9 Components Object
```typescript
components: {
  [ComponentName]: {
    defaultProps: { /* default prop values */ },
    styleOverrides: { [slot]: CSSProperties | function },
    variants: [
      {
        props: { /* prop conditions */ },
        style: CSSProperties
      }
    ]
  }
}
```

---

## SECTION 2: THEME CREATION & SETUP

### Basic Theme Creation
```typescript
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    primary: { main: '#1976d2' },
    secondary: { main: '#dc004e' }
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    fontSize: 14
  }
});
```

### Theme Provider Setup
```typescript
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';

<ThemeProvider theme={theme}>
  <CssBaseline />  {/* Resets browser defaults */}
  <App />
</ThemeProvider>
```

### TypeScript Theme Augmentation
```typescript
declare module '@mui/material/styles' {
  interface Palette {
    neutral?: PaletteColor;
  }
  interface PaletteOptions {
    neutral?: PaletteColorOptions;
  }
}

const theme = createTheme({
  palette: {
    neutral: { main: '#7e8792' }
  }
});

// Access in component:
// theme.palette.neutral.main → '#7e8792'
```

---

## SECTION 3: COMPONENT THEME OVERRIDES

### Global Style Overrides
```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          fontSize: '1rem',
          textTransform: 'none'
        },
        contained: {
          boxShadow: 'none'
        },
        outlined: {
          border: '2px solid'
        }
      },
      defaultProps: {
        disableRipple: true
      }
    }
  }
});
```

### Component Variants
```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: 'dashed' },
          style: {
            textTransform: 'none',
            border: `2px dashed ${blue[500]}`,
            '&:hover': {
              backgroundColor: blue[50]
            }
          }
        },
        {
          props: { variant: 'dashed', color: 'secondary' },
          style: {
            border: `4px dashed ${red[500]}`
          }
        }
      ]
    }
  }
});

// Usage:
<Button variant="dashed">Dashed button</Button>
<Button variant="dashed" color="secondary">Secondary dashed</Button>
```

### Slot-Based Overrides
```typescript
const theme = createTheme({
  components: {
    MuiSlider: {
      styleOverrides: {
        thumb: {
          boxShadow: 'none',
          width: 24,
          height: 24
        },
        rail: {
          opacity: 0.5,
          height: 4
        },
        track: {
          height: 6
        }
      }
    }
  }
});
```

### Conditional Style Overrides
```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
              backgroundColor: theme.palette.primary.dark,
              color: '#fff'
            })
        })
      }
    }
  }
});
```

---

## SECTION 4: PALETTE CUSTOMIZATION

### Custom Color Additions
```typescript
declare module '@mui/material/styles' {
  interface Palette {
    tertiary: PaletteColor;
  }
  interface PaletteOptions {
    tertiary?: PaletteColorOptions;
  }
}

const theme = createTheme({
  palette: {
    tertiary: {
      main: '#66bb6a',
      light: '#81c784',
      dark: '#388e3c',
      contrastText: '#fff'
    }
  }
});
```

### Dark Mode with Conditional Palette
```typescript
const getDesignTokens = (mode: 'light' | 'dark') => ({
  palette: {
    mode,
    ...(mode === 'light'
      ? {
          primary: { main: '#1976d2' },
          secondary: { main: '#9c27b0' },
          background: { default: '#fff', paper: '#f5f5f5' }
        }
      : {
          primary: { main: '#90caf9' },
          secondary: { main: '#f48fb1' },
          background: { default: '#121212', paper: '#1e1e1e' }
        })
  }
});

// Usage:
const [mode, setMode] = useState<'light' | 'dark'>('light');
const theme = useMemo(
  () => createTheme(getDesignTokens(mode)),
  [mode]
);
```

### Color Channel Support (v6 Feature)
```typescript
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
      mainChannel: '25 118 210'  // RGB values
    }
  }
});

// Usage in CSS:
backgroundColor: `rgba(var(--mui-palette-primary-mainChannel) / 0.12)`
```

---

## SECTION 5: TYPOGRAPHY CUSTOMIZATION

### Complete Typography Configuration
```typescript
const theme = createTheme({
  typography: {
    fontFamily: [
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif'
    ].join(','),
    fontSize: 14,
    fontWeightLight: 300,
    fontWeightRegular: 400,
    fontWeightMedium: 500,
    fontWeightBold: 700,
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.01562em'
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 700,
      lineHeight: 1.3
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 700,
      lineHeight: 1.4
    },
    body1: {
      fontSize: '1rem',
      fontWeight: 400,
      lineHeight: 1.5
    },
    body2: {
      fontSize: '0.875rem',
      fontWeight: 400,
      lineHeight: 1.43
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      textTransform: 'none',
      letterSpacing: '0.01785714em'
    },
    caption: {
      fontSize: '0.75rem',
      fontWeight: 400,
      lineHeight: 1.66,
      letterSpacing: '0.0333333333em'
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      lineHeight: 2.66,
      letterSpacing: '0.0833333333em',
      textTransform: 'uppercase'
    }
  }
});
```

### Responsive Typography
```typescript
<Typography
  sx={{
    fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' }
  }}
>
  This text scales responsively
</Typography>

// Or with fluid typography using clamp:
sx={{
  fontSize: 'clamp(1rem, 2.5vw, 2rem)'  // Min 1rem, Max 2rem
}}
```

### Custom Typography Variants
```typescript
declare module '@mui/material/styles' {
  interface TypographyVariants {
    eyebrow: React.CSSProperties;
    display: React.CSSProperties;
  }
  interface TypographyVariantsOptions {
    eyebrow?: React.CSSProperties;
    display?: React.CSSProperties;
  }
}

declare module '@mui/material/Typography' {
  interface TypographyPropsVariantOverrides {
    eyebrow: true;
    display: true;
  }
}

const theme = createTheme({
  typography: {
    eyebrow: {
      fontSize: '0.75rem',
      fontWeight: 700,
      letterSpacing: '0.1em',
      textTransform: 'uppercase',
      color: '#666'
    },
    display: {
      fontSize: '3rem',
      fontWeight: 300,
      lineHeight: 1.2
    }
  }
});

// Usage:
<Typography variant="eyebrow">Label</Typography>
<Typography variant="display">Large Title</Typography>
```

---

## SECTION 6: BREAKPOINTS API

### Breakpoint Values
```typescript
xs: 0px      // Mobile
sm: 600px    // Tablet
md: 960px    // Small laptop
lg: 1280px   // Desktop
xl: 1920px   // Large desktop
```

### Using Breakpoints in sx
```typescript
// Hidden on small screens:
<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  Desktop only
</Box>

// Responsive padding:
<Box
  sx={{
    padding: { xs: 8, sm: 16, md: 24, lg: 32 }  // px values
  }}
>
  Content
</Box>
```

### Using Breakpoints with styled
```typescript
import { styled } from '@mui/material/styles';

const HiddenOnSmall = styled(Box)(({ theme }) => ({
  display: 'block',
  [theme.breakpoints.down('sm')]: {
    display: 'none'
  }
}));

const ResponsivePadding = styled(Box)(({ theme }) => ({
  padding: theme.spacing(3),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(4)
  },
  [theme.breakpoints.only('sm')]: {
    padding: theme.spacing(2)
  }
}));
```

### Breakpoint Utilities
```typescript
theme.breakpoints.up('sm')        // @media (min-width: 600px)
theme.breakpoints.down('md')      // @media (max-width: 959.95px)
theme.breakpoints.only('sm')      // @media (min-width: 600px) and (max-width: 959.95px)
theme.breakpoints.between('sm', 'lg')  // @media (min-width: 600px) and (max-width: 1279.95px)
```

### Custom Breakpoints
```typescript
const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 600,
      md: 960,
      lg: 1280,
      xl: 1920,
      tablet: 640,
      laptop: 1024,
      desktop: 1440
    }
  }
});

// TypeScript augmentation:
declare module '@mui/material/styles' {
  interface BreakpointOverrides {
    xs: true;
    sm: true;
    md: true;
    lg: true;
    xl: true;
    tablet: true;
    laptop: true;
    desktop: true;
  }
}
```

---

## SECTION 7: TRANSITIONS CUSTOMIZATION

### Custom Transitions
```typescript
const theme = createTheme({
  transitions: {
    duration: {
      shortest: 150,
      shorter: 200,
      short: 250,
      standard: 300,
      complex: 375,
      enteringScreen: 225,
      leavingScreen: 195
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      linear: 'cubic-bezier(0, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)'
    }
  }
});
```

### Using Transitions in Components
```typescript
const StyledComponent = styled(Box)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  transition: theme.transitions.create('background-color', {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut
  }),
  '&:hover': {
    backgroundColor: theme.palette.primary.dark
  }
}));

// Multiple properties:
transition: theme.transitions.create(['background-color', 'transform'], {
  duration: theme.transitions.duration.standard
})
```

### Transition Helper
```typescript
// theme.transitions.create(props, options) returns CSS string:
theme.transitions.create('all', {
  duration: theme.transitions.duration.standard,
  easing: theme.transitions.easing.easeInOut,
  delay: 0
})
// Returns: "all 300ms cubic-bezier(0.4, 0, 0.2, 1) 0ms"
```

---

## SECTION 8: ADVANCED COMPOSITION PATTERNS

### Theme Composition
```typescript
const baseTheme = createTheme();
const theme = createTheme(baseTheme, {
  palette: {
    primary: { main: '#1976d2' }
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: baseTheme.spacing(1)
        }
      }
    }
  }
});
```

### Multi-Theme Support
```typescript
const themes = {
  light: createTheme({ palette: { mode: 'light' } }),
  dark: createTheme({ palette: { mode: 'dark' } }),
  highContrast: createTheme({
    palette: {
      mode: 'light',
      primary: { main: '#000' },
      background: { default: '#fff' }
    }
  })
};

// In component:
const [themeName, setThemeName] = useState<'light' | 'dark' | 'highContrast'>('light');
<ThemeProvider theme={themes[themeName]}>
  <App onThemeChange={setThemeName} />
</ThemeProvider>
```

### Conditional Overrides Based on Props
```typescript
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.variant === 'contained' &&
            ownerState.color === 'primary' && {
              backgroundColor: theme.palette.primary.dark,
              '&:hover': {
                backgroundColor: theme.palette.primary.darker
              }
            }),
          ...(ownerState.size === 'large' && {
            padding: theme.spacing(2, 4)
          })
        })
      }
    }
  }
});
```

---

## SECTION 9: V5 → V6 MIGRATION NOTES

### Key Changes

| Aspect | v5 | v6 |
|--------|----|----|
| **CSS Variables** | Limited | Full CSS custom properties integration |
| **Default Font Size** | 14px | 16px |
| **Component API** | makeStyles | styled() or sx prop |
| **Theme Structure** | Similar | Better TS support, channels |
| **Styling Library** | Emotion/styled-components | Emotion (default) |
| **Palette Channels** | Not available | `mainChannel: '25 118 210'` for rgba composition |

### Migration Example
```typescript
// v5
import { makeStyles } from '@mui/styles';

const useStyles = makeStyles((theme) => ({
  button: {
    backgroundColor: theme.palette.primary.main,
    [theme.breakpoints.down('sm')]: {
      padding: theme.spacing(1)
    }
  }
}));

// v6
import { styled } from '@mui/material/styles';

const StyledButton = styled(Button)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  [theme.breakpoints.down('sm')]: {
    padding: theme.spacing(1)
  }
}));

// v6 Alternative (sx prop)
<Button
  sx={{
    backgroundColor: 'primary.main',
    p: { xs: 1, md: 2 }
  }}
/>
```

---

## SECTION 10: STYLE INTEGRATION PATTERNS

### sx Prop with Theme
```typescript
<Box
  sx={{
    color: 'primary.main',
    backgroundColor: 'background.paper',
    padding: (theme) => theme.spacing(2),
    margin: 2,  // Shorthand: theme.spacing(2)
    [theme => theme.breakpoints.down('sm')]: {
      padding: (theme) => theme.spacing(1)
    },
    '&:hover': {
      backgroundColor: 'primary.light'
    }
  }}
>
  Content
</Box>
```

### Styled Components with Theme
```typescript
import { styled } from '@mui/material/styles';

const StyledContainer = styled(Box)(({ theme }) => ({
  color: theme.palette.primary.main,
  padding: theme.spacing(2),
  backgroundColor: theme.palette.background.paper,
  border: `1px solid ${theme.palette.divider}`,
  borderRadius: theme.shape.borderRadius,
  transition: theme.transitions.create(['background-color', 'border-color'], {
    duration: theme.transitions.duration.standard,
    easing: theme.transitions.easing.easeInOut
  }),
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(3)
  },
  '&:hover': {
    backgroundColor: theme.palette.action.hover,
    borderColor: theme.palette.primary.main
  }
}));
```

### CSS Custom Properties (v6)
```typescript
const StyledBox = styled(Box)(({ theme }) => ({
  '--custom-spacing': theme.spacing(2),
  '--custom-color': theme.palette.primary.main,
  '--custom-radius': `${theme.shape.borderRadius}px`,
  padding: 'var(--custom-spacing)',
  color: 'var(--custom-color)',
  borderRadius: 'var(--custom-radius)'
}));
```

---

## SECTION 11: DEFAULT THEME VALUES REFERENCE

```typescript
// Spacing
spacing: 8px base unit

// Primary Colors (Light/Dark)
primary.main:        '#1976d2' / '#90caf9'
primary.light:       '#42a5f5' / '#e3f2fd'
primary.dark:        '#1565c0' / '#42a5f5'
primary.contrastText: '#fff'

// Secondary Colors (Light/Dark)
secondary.main:      '#9c27b0' / '#ce93d8'
secondary.light:     '#ba68c8' / '#f8bbd0'
secondary.dark:      '#7b1fa2' / '#ba68c8'

// Semantic Colors (Light/Dark)
error.main:          '#d32f2f' / '#f44336'
warning.main:        '#ed6c02' / '#ff9800'
info.main:           '#0288d1' / '#29b6f6'
success.main:        '#2e7d32' / '#66bb6a'

// Text
text.primary:        'rgba(0, 0, 0, 0.87)' / 'rgba(255, 255, 255, 1)'
text.secondary:      'rgba(0, 0, 0, 0.6)' / 'rgba(255, 255, 255, 0.7)'
text.disabled:       'rgba(0, 0, 0, 0.38)' / 'rgba(255, 255, 255, 0.5)'

// Background
background.default:  '#fff' / '#121212'
background.paper:    '#fff' / '#1e1e1e'

// Shape
borderRadius:        4px

// Z-Index
modal:              1300
snackbar:           1400
tooltip:            1500

// Typography
fontSize:           16px (base)
fontFamily:         '"Roboto", "Helvetica", "Arial", sans-serif'
fontWeightLight:    300
fontWeightRegular:  400
fontWeightMedium:   500
fontWeightBold:     700

// Transitions
duration.standard:  300ms
easing.easeInOut:   'cubic-bezier(0.4, 0, 0.2, 1)'

// Breakpoints
sm: 600px
md: 960px
lg: 1280px
xl: 1920px
```

---

## CRITICAL PATTERNS FOR PLUGIN DEVELOPMENT

1. **Always use TypeScript augmentation** for custom palette colors or typography variants
2. **Compose themes** using `createTheme(baseTheme, overrides)` for layering
3. **Use styled()** for component customization over deprecated `makeStyles`
4. **Leverage sx prop** for one-off responsive styles
5. **Use theme.transitions.create()** for consistent animation timing
6. **Dark mode:** Use conditional palette objects with `useMemo` for performance
7. **Breakpoints:** Prefer responsive object syntax `{ xs: 'value', md: 'value' }`
8. **Color channels:** Use RGB channel values for dynamic opacity in v6

---

## RESEARCH SOURCE ATTRIBUTION
- https://mui.com/material-ui/customization/theming/
- https://mui.com/material-ui/customization/default-theme/
- https://mui.com/material-ui/customization/theme-components/
- https://mui.com/material-ui/customization/palette/
- https://mui.com/material-ui/customization/typography/
- https://mui.com/material-ui/customization/breakpoints/
- https://mui.com/material-ui/customization/transitions/
- https://mui.com/material-ui/customization/color/
- https://mui.com/material-ui/customization/density/
