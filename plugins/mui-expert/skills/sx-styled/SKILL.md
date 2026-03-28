---
name: sx-styled
description: MUI sx prop and styled() API for component styling
triggers:
  - sx prop
  - styled
  - styling
  - CSS-in-JS
  - emotion
  - responsive styles
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

# MUI sx Prop and styled() API

## Overview

MUI provides two primary APIs for styling components: the `sx` prop (inline, one-off
styles with full theme access) and the `styled()` function (reusable styled components
built on Emotion). Choose based on reuse: `sx` for single-use overrides, `styled()` for
components used more than once.

---

## sx Prop

The `sx` prop accepts a superset of CSS where values can reference theme tokens, respond
to breakpoints, and use shorthand aliases. It is available on every MUI component and on
the `Box` primitive.

### Basic usage

```tsx
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

// Plain CSS properties — camelCase
<Box sx={{ backgroundColor: 'white', borderRadius: 2, boxShadow: 3 }}>
  content
</Box>

// Theme token references
<Box sx={{ color: 'primary.main', bgcolor: 'background.paper' }} />

// Typography variants
<Box sx={{ typography: 'h4' }}>Heading text</Box>
```

### System shorthands

MUI maps single-letter aliases to CSS properties. These only work inside `sx` (and
`styled` with the `system` utilities), not in plain Emotion.

```tsx
<Box
  sx={{
    m: 2,          // margin: theme.spacing(2)
    p: 3,          // padding: theme.spacing(3)
    mx: 'auto',    // marginLeft + marginRight: auto
    my: 1,         // marginTop + marginBottom
    px: 2,         // paddingLeft + paddingRight
    py: 1,         // paddingTop + paddingBottom
    mt: 4,         // marginTop
    mb: 2,         // marginBottom
    ml: 1,         // marginLeft
    mr: 1,         // marginRight
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 2,        // gap: theme.spacing(2)
    width: 1,      // width: 100%  (fractions map to %)
    height: '100vh',
  }}
/>
```

### Theme-aware callback

Use the callback form `(theme) => ({...})` when you need theme values that cannot be
expressed as token strings, such as palette computed colors or custom spacing math.

```tsx
<Box
  sx={(theme) => ({
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[900]
      : theme.palette.grey[100],
    padding: theme.spacing(2, 3),          // shorthand: vertical, horizontal
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    transition: theme.transitions.create(['background-color'], {
      duration: theme.transitions.duration.short,
    }),
  })}
/>
```

### Responsive values — object syntax

Pass an object keyed by breakpoint names. Values are applied from the named breakpoint
upward (mobile-first).

```tsx
<Box
  sx={{
    width: {
      xs: '100%',   // 0px+
      sm: '80%',    // 600px+
      md: '60%',    // 900px+
      lg: '50%',    // 1200px+
    },
    fontSize: { xs: 14, md: 16, lg: 18 },
    display: { xs: 'block', md: 'flex' },
    flexDirection: { xs: 'column', md: 'row' },
    gap: { xs: 1, md: 2 },
  }}
/>
```

### Responsive values — array syntax

Arrays map values to breakpoints in order `[xs, sm, md, lg, xl]`. Use `null` to skip
a breakpoint without changing the value.

```tsx
<Box
  sx={{
    padding: [1, 2, 3],          // xs=1, sm=2, md=3
    fontSize: [12, null, 16],    // xs=12, sm unchanged, md=16
    display: ['block', 'flex'],  // xs=block, sm+=flex
  }}
/>
```

### Pseudo-selectors and nested selectors

The `sx` prop supports any CSS selector string as a key, enabling hover states,
focus-visible, and targeting MUI's internal slot class names.

```tsx
<Button
  sx={{
    '&:hover': {
      backgroundColor: 'primary.dark',
      transform: 'translateY(-1px)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
    '&:focus-visible': {
      outline: '3px solid',
      outlineColor: 'primary.light',
    },
    // Target MUI internal slot classes
    '& .MuiButton-startIcon': {
      marginRight: 0.5,
    },
    // Target child elements
    '& span': {
      fontWeight: 700,
    },
    // Sibling state
    '&.Mui-disabled': {
      opacity: 0.5,
    },
  }}
>
  Click me
</Button>
```

---

## styled() Function

`styled()` is the Emotion `styled` function extended with MUI's theme and system
shorthands. Use it to create reusable, named components.

### Basic styled component

```tsx
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(8, 2),
  backgroundColor: theme.palette.background.default,
  [theme.breakpoints.up('md')]: {
    flexDirection: 'row',
    padding: theme.spacing(12, 4),
  },
}));

// Usage
<HeroSection component="section">
  <h1>Welcome</h1>
</HeroSection>
```

### Styled with props

Accept custom props to drive conditional styles. Use TypeScript generics to type them.

```tsx
interface CardContainerProps {
  variant?: 'elevated' | 'outlined' | 'filled';
  selected?: boolean;
}

const CardContainer = styled(Box, {
  // Prevent non-HTML props from being forwarded to the DOM element
  shouldForwardProp: (prop) => prop !== 'variant' && prop !== 'selected',
})<CardContainerProps>(({ theme, variant = 'elevated', selected }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  padding: theme.spacing(2),
  cursor: 'pointer',
  transition: theme.transitions.create(['box-shadow', 'border-color'], {
    duration: theme.transitions.duration.short,
  }),

  ...(variant === 'elevated' && {
    boxShadow: selected ? theme.shadows[8] : theme.shadows[1],
    '&:hover': { boxShadow: theme.shadows[4] },
  }),

  ...(variant === 'outlined' && {
    border: `1px solid`,
    borderColor: selected
      ? theme.palette.primary.main
      : theme.palette.divider,
    boxShadow: 'none',
    '&:hover': { borderColor: theme.palette.primary.light },
  }),

  ...(variant === 'filled' && {
    backgroundColor: selected
      ? theme.palette.primary.light
      : theme.palette.action.hover,
    boxShadow: 'none',
  }),
}));

// Usage
<CardContainer variant="outlined" selected={isActive} onClick={handleClick}>
  {children}
</CardContainer>
```

### shouldForwardProp

Always declare `shouldForwardProp` for custom boolean or string props to prevent React
warnings about unknown DOM attributes.

```tsx
import { styled } from '@mui/material/styles';
import Button from '@mui/material/Button';

const GradientButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})<{ gradient?: boolean }>(({ theme, gradient }) => ({
  ...(gradient && {
    background: `linear-gradient(45deg, ${theme.palette.primary.main} 30%, ${theme.palette.secondary.main} 90%)`,
    color: theme.palette.common.white,
    '&:hover': {
      background: `linear-gradient(45deg, ${theme.palette.primary.dark} 30%, ${theme.palette.secondary.dark} 90%)`,
    },
  }),
}));
```

### Extending an existing styled component

```tsx
const PrimaryCard = styled(CardContainer)({
  borderTop: '4px solid',
  borderTopColor: 'primary.main',
});
```

---

## sx vs styled() vs Theme Overrides — Decision Guide

| Scenario | Recommendation |
|---|---|
| One-off style on a single instance | `sx` prop |
| Same styles used on 2+ instances | `styled()` |
| Styles driven by custom props | `styled()` with `shouldForwardProp` |
| Overriding a MUI component globally | Theme `components.MuiXxx.styleOverrides` |
| Dynamic styles based on component state | `sx` callback or `styled()` with props |
| Performance-sensitive render-heavy list | `styled()` (styles computed once) |
| Quick prototype / layout tweak | `sx` prop |

---

## Performance Considerations

The `sx` prop generates a new class name on every render when its value object changes
identity. For components that render frequently (virtualized lists, animated items),
prefer `styled()` or memoize the sx object.

```tsx
// Bad — new object reference every render
function ListItem({ item }) {
  return (
    <Box sx={{ padding: 2, color: item.active ? 'primary.main' : 'text.primary' }}>
      {item.label}
    </Box>
  );
}

// Better — stable reference for static parts, sx only for dynamic
const ItemBase = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
}));

function ListItem({ item }) {
  return (
    <ItemBase sx={{ color: item.active ? 'primary.main' : 'text.primary' }}>
      {item.label}
    </ItemBase>
  );
}

// Alternative — useMemo for complex dynamic sx
function ListItem({ item, index }) {
  const sxStyles = React.useMemo(() => ({
    padding: 2,
    color: item.active ? 'primary.main' : 'text.primary',
    animationDelay: `${index * 50}ms`,
  }), [item.active, index]);

  return <Box sx={sxStyles}>{item.label}</Box>;
}
```

---

## Common Patterns

### Dark/light mode conditional

```tsx
<Box
  sx={{
    bgcolor: (theme) =>
      theme.palette.mode === 'dark' ? 'grey.900' : 'grey.50',
    color: 'text.primary',
  }}
/>
```

### Combining sx arrays (MUI v5+)

Pass an array of sx values to compose styles. Falsy entries are skipped.

```tsx
<Box
  sx={[
    { padding: 2, borderRadius: 1 },
    isHighlighted && { bgcolor: 'warning.light' },
    isDisabled && { opacity: 0.5, pointerEvents: 'none' },
  ]}
/>
```

### Full-bleed section within a Container

```tsx
const FullBleed = styled(Box)(({ theme }) => ({
  width: '100vw',
  position: 'relative',
  left: '50%',
  right: '50%',
  marginLeft: '-50vw',
  marginRight: '-50vw',
  backgroundColor: theme.palette.primary.main,
  padding: theme.spacing(4, 0),
}));
```
