---
name: mui-sx-styled
description: MUI sx prop and styled() API — responsive values, system shorthands, theme-aware styling, pseudo-selectors, performance guidance
triggers:
  - sx prop
  - styled
  - styling
  - CSS-in-JS
  - emotion
  - responsive styles
  - system props
  - shouldForwardProp
  - sx callback
  - nested selectors
  - MUI style
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

# MUI sx Prop and styled() API Skill

## The sx Prop

The `sx` prop is the primary styling escape hatch in MUI. It accepts a superset of CSS where property values can be theme tokens, responsive objects, or callback functions.

### Basic usage

```tsx
import Box from '@mui/material/Box';

<Box
  sx={{
    // Standard CSS
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    // Theme-aware values
    color: 'primary.main',              // resolves to theme.palette.primary.main
    backgroundColor: 'background.paper',
    borderColor: 'divider',
    p: 2,                               // theme.spacing(2) → '16px'
    borderRadius: 1,                    // theme.shape.borderRadius * 1 → 8px
    fontFamily: 'typography.fontFamily',
    fontSize: 'body2.fontSize',
  }}
/>
```

---

## System Property Shorthands

MUI maps short aliases to CSS properties via the `@mui/system` package:

| Shorthand | CSS Property         | Example                |
|-----------|---------------------|------------------------|
| `m`       | margin               | `m: 2` → `margin: 16px` |
| `mt`      | margin-top           | `mt: 1`                |
| `mb`      | margin-bottom        | `mb: 3`                |
| `ml`      | margin-left          | `ml: 2`                |
| `mr`      | margin-right         | `mr: 2`                |
| `mx`      | margin left + right  | `mx: 'auto'`           |
| `my`      | margin top + bottom  | `my: 2`                |
| `p`       | padding              | `p: 2` → `padding: 16px` |
| `pt`      | padding-top          | `pt: 1`                |
| `pb`      | padding-bottom       | `pb: 3`                |
| `pl`      | padding-left         | `pl: 2`                |
| `pr`      | padding-right        | `pr: 2`                |
| `px`      | padding left + right | `px: 3`                |
| `py`      | padding top + bottom | `py: 2`                |
| `bgcolor` | background-color     | `bgcolor: 'primary.main'` |
| `color`   | color                | `color: 'text.secondary'` |
| `display` | display              | `display: 'flex'`      |
| `gap`     | gap                  | `gap: 2`               |
| `width`   | width                | `width: 1` → `100%`    |
| `height`  | height               | `height: '100vh'`      |
| `maxWidth`| max-width            | `maxWidth: 'sm'` → breakpoint value |
| `minWidth`| min-width            |                        |
| `flexDirection` | flex-direction  | `flexDirection: 'row'` |
| `flexWrap`| flex-wrap            | `flexWrap: 'wrap'`     |
| `justifyContent` | justify-content |                       |
| `alignItems` | align-items       |                        |
| `alignSelf` | align-self          |                        |
| `flexGrow` | flex-grow            |                        |
| `flexShrink` | flex-shrink         |                        |
| `flexBasis` | flex-basis           |                        |
| `flex`    | flex                 |                        |
| `overflow`| overflow             |                        |
| `textOverflow` | text-overflow    |                        |
| `whiteSpace` | white-space         |                        |
| `position`| position             |                        |
| `top`/`right`/`bottom`/`left` | positioning |            |
| `zIndex`  | z-index              | `zIndex: 'tooltip'` → theme.zIndex.tooltip |
| `boxShadow`| box-shadow          | `boxShadow: 2` → theme.shadows[2] |
| `fontFamily`| font-family        |                        |
| `fontSize`| font-size            |                        |
| `fontWeight` | font-weight         |                        |
| `letterSpacing` | letter-spacing    |                        |
| `lineHeight` | line-height          |                        |
| `textAlign` | text-align           |                        |
| `typography` | all typography variant | `typography: 'h4'` |
| `border`  | border               | `border: 1` → `1px solid` |
| `borderTop`/`borderBottom`/etc | individual borders |  |
| `borderColor` | border-color       | `borderColor: 'divider'` |
| `borderRadius` | border-radius     | `borderRadius: 2` → theme.shape.borderRadius * 2 |

---

## Responsive Values

### Object syntax (preferred for readability)

```tsx
<Box
  sx={{
    fontSize: {
      xs: '0.75rem',   // 0px+
      sm: '0.875rem',  // 600px+
      md: '1rem',      // 900px+
      lg: '1.125rem',  // 1200px+
      xl: '1.25rem',   // 1536px+
    },
    flexDirection: { xs: 'column', md: 'row' },
    display: { xs: 'none', md: 'flex' },  // hide on mobile
    p: { xs: 1, sm: 2, md: 3 },
    width: { xs: '100%', md: '50%', lg: '33.33%' },
  }}
/>
```

### Array syntax (ordered by breakpoint)

```tsx
// [xs, sm, md, lg, xl] — null skips that breakpoint
<Box
  sx={{
    display: ['none', null, 'flex'],  // hidden on xs, visible from md
    p: [1, 2, 3],                     // 8px, 16px, 24px
    fontSize: ['0.75rem', '0.875rem', '1rem'],
  }}
/>
```

---

## Callback Syntax — Theme Access

When you need direct theme access in sx, use the callback form:

```tsx
<Box
  sx={(theme) => ({
    backgroundColor: theme.palette.mode === 'dark'
      ? theme.palette.grey[800]
      : theme.palette.grey[100],
    color: theme.palette.primary.main,
    padding: theme.spacing(2, 3),
    borderRadius: `${theme.shape.borderRadius * 2}px`,
    transition: theme.transitions.create(['background-color'], {
      duration: theme.transitions.duration.short,
    }),
    [theme.breakpoints.up('md')]: {
      padding: theme.spacing(3, 4),
    },
  })}
/>
```

### Combining with static sx

```tsx
// Spread multiple sx values (array form)
<Box
  sx={[
    { display: 'flex', p: 2 },
    (theme) => ({ color: theme.palette.primary.main }),
    someCondition && { fontWeight: 'bold' },
  ]}
/>
```

---

## Pseudo-Selectors and Nested Selectors

```tsx
<Box
  sx={{
    // Pseudo-classes
    '&:hover': { backgroundColor: 'action.hover', cursor: 'pointer' },
    '&:focus': { outline: '2px solid', outlineColor: 'primary.main' },
    '&:active': { transform: 'scale(0.98)' },
    '&:disabled': { opacity: 0.5, pointerEvents: 'none' },
    '&:first-of-type': { borderTop: 'none' },
    '&:last-of-type': { borderBottom: 'none' },
    '&:not(:last-child)': { mb: 1 },

    // Pseudo-elements
    '&::before': { content: '""', display: 'block', width: 8, height: 8, borderRadius: '50%', bgcolor: 'primary.main' },
    '&::after':  { content: '""' },

    // Child selectors
    '& > span': { fontWeight: 'bold' },
    '& .MuiButton-root': { textTransform: 'none' },   // MUI internal class
    '& .MuiSvgIcon-root': { color: 'primary.main', mr: 1 },

    // Compound selectors
    '&:hover .MuiButton-root': { color: 'secondary.main' },

    // Attribute selectors
    '&[data-active="true"]': { color: 'primary.main' },

    // CSS variables
    '--custom-color': (theme) => theme.palette.primary.main,
  }}
/>
```

### MUI slot selectors

```tsx
// Target MUI component slots in sx
<TextField
  sx={{
    '& .MuiOutlinedInput-root': {
      borderRadius: 2,
      '& fieldset': { borderColor: 'divider' },
      '&:hover fieldset': { borderColor: 'primary.main' },
      '&.Mui-focused fieldset': { borderColor: 'primary.dark', borderWidth: 2 },
    },
    '& .MuiInputLabel-root': { fontWeight: 500 },
    '& .MuiFormHelperText-root': { fontSize: '0.7rem' },
  }}
/>
```

---

## Theme-Aware Values Reference

```tsx
// Colors — dot notation into theme.palette
color: 'primary.main'
color: 'primary.light'
color: 'primary.dark'
color: 'primary.contrastText'
color: 'secondary.main'
color: 'error.main'
color: 'text.primary'
color: 'text.secondary'
color: 'text.disabled'
bgcolor: 'background.default'
bgcolor: 'background.paper'
borderColor: 'divider'

// Spacing — multiplied by theme.spacing unit (8px)
p: 1     // 8px
p: 1.5   // 12px
p: 2     // 16px
gap: 2   // 16px

// Typography
typography: 'h4'    // applies all h4 styles
fontSize: 'body2.fontSize'

// Breakpoints as maxWidth
maxWidth: 'sm'   // 600px
maxWidth: 'md'   // 900px

// Shadows
boxShadow: 0  // 'none'
boxShadow: 1  // elevation 1
boxShadow: 3  // elevation 3

// zIndex
zIndex: 'appBar'    // 1100
zIndex: 'modal'     // 1300
zIndex: 'tooltip'   // 1500
```

---

## styled() Function

`styled` creates reusable styled components backed by Emotion. Use it when you need a named, reusable component or when the styles don't change based on props.

### Basic styled component

```tsx
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';

const HeroSection = styled(Box)(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  padding: theme.spacing(8, 2),
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  color: theme.palette.primary.contrastText,
  [theme.breakpoints.up('md')]: {
    padding: theme.spacing(12, 4),
    flexDirection: 'row',
  },
}));

const PillButton = styled(Button)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 5,
  padding: theme.spacing(1, 3),
  textTransform: 'none',
  fontWeight: 700,
}));

// Usage — these are regular React components
<HeroSection>
  <PillButton variant="contained">Get Started</PillButton>
</HeroSection>
```

### Styled with custom props

```tsx
interface CardWrapperProps {
  elevated?: boolean;
  noPadding?: boolean;
}

// shouldForwardProp prevents custom props from being passed to the DOM
const CardWrapper = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'elevated' && prop !== 'noPadding',
})<CardWrapperProps>(({ theme, elevated, noPadding }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
  padding: noPadding ? 0 : theme.spacing(3),
  ...(elevated && {
    boxShadow: theme.shadows[4],
    border: 'none',
  }),
}));

// Usage
<CardWrapper elevated noPadding>Content</CardWrapper>
```

### Styling HTML elements directly

```tsx
const StyledTable = styled('table')(({ theme }) => ({
  width: '100%',
  borderCollapse: 'collapse',
  '& th': {
    backgroundColor: theme.palette.grey[100],
    fontWeight: 600,
    padding: theme.spacing(1.5, 2),
    textAlign: 'left',
    borderBottom: `2px solid ${theme.palette.divider}`,
  },
  '& td': {
    padding: theme.spacing(1, 2),
    borderBottom: `1px solid ${theme.palette.divider}`,
  },
  '& tr:hover td': {
    backgroundColor: theme.palette.action.hover,
  },
}));
```

### Extending an existing styled component

```tsx
const BaseCard = styled(Paper)(({ theme }) => ({
  borderRadius: theme.shape.borderRadius * 2,
  overflow: 'hidden',
}));

const InteractiveCard = styled(BaseCard)(({ theme }) => ({
  cursor: 'pointer',
  transition: theme.transitions.create(['transform', 'box-shadow']),
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: theme.shadows[8],
  },
  '&:active': {
    transform: 'translateY(0)',
  },
}));
```

---

## When to Use sx vs styled() vs Theme Overrides

| Approach | Use When |
|----------|----------|
| `sx` prop | One-off styles, styles that depend on component state or context, quick responsive adjustments |
| `styled()` | Reusable styled components, styles shared across files, complex component APIs with variant props |
| Theme `components` overrides | Global style changes for all instances of a MUI component across the app |
| Theme `palette`/`typography` | Design tokens that flow through the entire app |

```tsx
// GOOD: sx for contextual/one-off styling
<Typography sx={{ color: isActive ? 'primary.main' : 'text.secondary', mb: 1 }}>
  Label
</Typography>

// GOOD: styled() for reusable components
const SectionHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 700,
  marginBottom: theme.spacing(3),
  position: 'relative',
  '&::after': {
    content: '""',
    position: 'absolute',
    bottom: -8,
    left: 0,
    width: 40,
    height: 3,
    backgroundColor: theme.palette.primary.main,
  },
}));

// GOOD: theme overrides for global consistency
const theme = createTheme({
  components: {
    MuiButton: {
      styleOverrides: { root: { textTransform: 'none' } },
    },
  },
});
```

---

## Performance Considerations

**The sx prop generates new class names on every render.** For components in hot render paths (list items, table rows, animation frames), avoid sx or memoize the sx object:

```tsx
// PROBLEMATIC: new style object on every render
function ListItem({ item, isSelected }) {
  return (
    <Box
      sx={{
        backgroundColor: isSelected ? 'primary.light' : 'transparent',
        p: 2,
        borderRadius: 1,
        cursor: 'pointer',
        // This object is recreated every render
      }}
    >
      {item.name}
    </Box>
  );
}

// BETTER option 1: Use styled() + props
const StyledListItem = styled(Box, {
  shouldForwardProp: (p) => p !== 'selected',
})<{ selected: boolean }>(({ theme, selected }) => ({
  backgroundColor: selected ? theme.palette.primary.light : 'transparent',
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
}));

// BETTER option 2: useMemo for dynamic sx
function ListItem({ item, isSelected }) {
  const sx = useMemo(
    () => ({
      backgroundColor: isSelected ? 'primary.light' : 'transparent',
      p: 2,
      borderRadius: 1,
      cursor: 'pointer',
    }),
    [isSelected]
  );
  return <Box sx={sx}>{item.name}</Box>;
}

// BETTER option 3: Combine static sx with conditional className
const StyledListItem = styled(Box)(({ theme }) => ({
  padding: theme.spacing(2),
  borderRadius: theme.shape.borderRadius,
  cursor: 'pointer',
  '&.selected': {
    backgroundColor: theme.palette.primary.light,
  },
}));

function ListItem({ item, isSelected }) {
  return (
    <StyledListItem className={isSelected ? 'selected' : ''}>
      {item.name}
    </StyledListItem>
  );
}
```

---

## Combining sx with className and Other Styles

```tsx
import { cx } from '@emotion/css';

// sx and className coexist — className wins on specificity ties
<Box
  className="external-class"
  sx={{ color: 'primary.main', p: 2 }}
/>

// Array sx with conditional entries
<Box
  sx={[
    styles.base,
    isActive && styles.active,
    { mb: 2 },
    (theme) => ({ border: `1px solid ${theme.palette.divider}` }),
  ]}
/>

const styles = {
  base: { display: 'flex', p: 2 },
  active: { backgroundColor: 'primary.light', color: 'primary.dark' },
};
```

---

## CSS Grid with sx

```tsx
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)',
    },
    gridTemplateRows: 'auto',
    gap: 3,
    gridTemplateAreas: {
      xs: `
        "header"
        "sidebar"
        "main"
        "footer"
      `,
      md: `
        "header header"
        "sidebar main"
        "footer footer"
      `,
    },
  }}
>
  <Box sx={{ gridArea: 'header' }}>Header</Box>
  <Box sx={{ gridArea: 'sidebar' }}>Sidebar</Box>
  <Box sx={{ gridArea: 'main' }}>Main</Box>
  <Box sx={{ gridArea: 'footer' }}>Footer</Box>
</Box>
```

---

## Animations with sx

```tsx
import { keyframes } from '@mui/system';

const pulse = keyframes`
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.05); opacity: 0.8; }
  100% { transform: scale(1); opacity: 1; }
`;

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(-8px); }
  to { opacity: 1; transform: translateY(0); }
`;

<Box
  sx={{
    animation: `${pulse} 2s ease-in-out infinite`,
  }}
/>

<Box
  sx={{
    animation: `${fadeIn} 0.3s ease-out forwards`,
  }}
/>
```
