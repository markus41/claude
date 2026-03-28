---
name: layout-responsive
description: MUI layout components and responsive design patterns
triggers:
  - layout
  - Grid
  - Stack
  - responsive
  - breakpoints
  - Container
  - useMediaQuery
  - mobile
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

# MUI Layout & Responsive Design

Use this skill when building layouts, handling responsive design, or working with Grid, Stack, Container, and breakpoints.

## Grid v2

MUI v6 uses the new Grid component with `size` and `offset` props:

```tsx
import Grid from '@mui/material/Grid';

<Grid container spacing={2}>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Card>Item 1</Card>
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4 }}>
    <Card>Item 2</Card>
  </Grid>
  <Grid size={{ xs: 12, md: 4 }}>
    <Card>Item 3</Card>
  </Grid>
</Grid>

{/* With offset */}
<Grid container spacing={2}>
  <Grid size={{ xs: 12, md: 8 }}>Main content</Grid>
  <Grid size={{ xs: 12, md: 3 }} offset={{ md: 1 }}>Sidebar</Grid>
</Grid>
```

For MUI v5, use the legacy props:
```tsx
<Grid container spacing={2}>
  <Grid item xs={12} sm={6} md={4}>Content</Grid>
</Grid>
```

## Stack

```tsx
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

{/* Horizontal button group */}
<Stack direction="row" spacing={2}>
  <Button>Cancel</Button>
  <Button variant="contained">Save</Button>
</Stack>

{/* Vertical with dividers */}
<Stack spacing={2} divider={<Divider flexItem />}>
  <Item>Section 1</Item>
  <Item>Section 2</Item>
  <Item>Section 3</Item>
</Stack>

{/* Responsive direction */}
<Stack direction={{ xs: 'column', sm: 'row' }} spacing={{ xs: 1, sm: 2 }}>
  <Box>Left</Box>
  <Box>Right</Box>
</Stack>
```

## Container

```tsx
import Container from '@mui/material/Container';

<Container maxWidth="lg">    {/* 1200px max */}
  <Container maxWidth="md">  {/* 900px max */}
    <Container maxWidth="sm"> {/* 600px max */}
```

Options: `xs` (444px), `sm` (600px), `md` (900px), `lg` (1200px), `xl` (1536px), `false` (no max).

## Box as layout primitive

```tsx
import Box from '@mui/material/Box';

{/* Flexbox layout */}
<Box sx={{ display: 'flex', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
  <Typography>Title</Typography>
  <Button>Action</Button>
</Box>

{/* CSS Grid */}
<Box sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
  gap: 2,
}}>
  <Paper>Cell 1</Paper>
  <Paper>Cell 2</Paper>
  <Paper>Cell 3</Paper>
</Box>

{/* Semantic HTML */}
<Box component="main" sx={{ p: 3 }}>
  <Box component="section" sx={{ mb: 4 }}>
    <Typography variant="h2" component="h2">Section</Typography>
  </Box>
</Box>
```

## Breakpoints & useMediaQuery

```tsx
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));    // < 600px
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600-900px
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));     // >= 900px
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

Default breakpoints: `xs: 0`, `sm: 600`, `md: 900`, `lg: 1200`, `xl: 1536`.

### Responsive sx values

```tsx
<Box sx={{
  fontSize: { xs: '0.875rem', sm: '1rem', md: '1.25rem' },
  p: { xs: 1, sm: 2, md: 3 },
  display: { xs: 'none', md: 'block' },  // hide on mobile
  flexDirection: { xs: 'column', sm: 'row' },
}} />
```

## Common layout patterns

### Sidebar + Content
```tsx
<Box sx={{ display: 'flex', minHeight: '100vh' }}>
  <Drawer variant="permanent" sx={{ width: 240, flexShrink: 0,
    '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' } }}>
    <Toolbar />
    <Navigation />
  </Drawer>
  <Box component="main" sx={{ flexGrow: 1, p: 3 }}>
    <Toolbar /> {/* spacer for fixed AppBar */}
    <Outlet />
  </Box>
</Box>
```

### Responsive card grid
```tsx
<Box sx={{
  display: 'grid',
  gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(3, 1fr)', lg: 'repeat(4, 1fr)' },
  gap: 3,
}}>
  {items.map((item) => <ItemCard key={item.id} item={item} />)}
</Box>
```

### Centered content
```tsx
<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
  <Paper sx={{ p: 4, maxWidth: 400, width: '100%' }}>
    <LoginForm />
  </Paper>
</Box>
```
