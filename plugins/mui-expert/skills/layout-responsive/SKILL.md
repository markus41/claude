---
name: mui-layout-responsive
description: MUI layout and responsive design — Grid v2, Stack, Container, Box, useMediaQuery, breakpoints, CSS Grid, and common layout patterns
triggers:
  - layout
  - Grid
  - Stack
  - responsive
  - breakpoints
  - Container
  - useMediaQuery
  - mobile
  - flexbox
  - grid layout
  - holy grail
  - sidebar layout
  - dashboard grid
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

# MUI Layout & Responsive Design Skill

## Grid v2

MUI v6 uses Grid v2 by default (imported from `@mui/material/Grid2` or `@mui/material/Unstable_Grid2` in v5). Grid v2 replaces the `xs`/`sm`/`md`/`lg`/`xl` props with a single `size` prop and adds `offset`.

### Basic Grid

```tsx
import Grid from '@mui/material/Grid2';

// 12-column grid — size values out of 12
<Grid container spacing={2}>
  <Grid size={12}>Full width</Grid>
  <Grid size={6}>Half width</Grid>
  <Grid size={6}>Half width</Grid>
  <Grid size={4}>Third</Grid>
  <Grid size={4}>Third</Grid>
  <Grid size={4}>Third</Grid>
  {/* size="grow" fills remaining space */}
  <Grid size="grow">Grows to fill</Grid>
</Grid>
```

### Responsive size

```tsx
<Grid container spacing={{ xs: 1, md: 2 }}>
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
    <Card>Item</Card>
  </Grid>
  <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }}>
    <Card>Item</Card>
  </Grid>
</Grid>
```

### Offset

```tsx
<Grid container>
  {/* Skip 3 columns, take 9 */}
  <Grid size={9} offset={3}>
    Offset item
  </Grid>

  {/* Responsive offset */}
  <Grid size={{ xs: 12, md: 6 }} offset={{ xs: 0, md: 3 }}>
    Centered on desktop
  </Grid>
</Grid>
```

### Nested grids

```tsx
<Grid container spacing={3}>
  <Grid size={8}>
    {/* Nested grid — inherits container context */}
    <Grid container spacing={1}>
      <Grid size={6}><TextField fullWidth label="First name" /></Grid>
      <Grid size={6}><TextField fullWidth label="Last name" /></Grid>
    </Grid>
  </Grid>
  <Grid size={4}>
    <Sidebar />
  </Grid>
</Grid>
```

### Grid spacing

```tsx
// Uniform spacing
<Grid container spacing={2}>

// Different row and column spacing
<Grid container rowSpacing={1} columnSpacing={{ xs: 1, sm: 2, md: 3 }}>

// No spacing
<Grid container spacing={0}>
```

### Auto-layout (size="grow")

```tsx
<Grid container spacing={2} alignItems="center">
  <Grid>
    <Avatar src="/user.jpg" />
  </Grid>
  <Grid size="grow">
    <Typography>Username that takes remaining space</Typography>
  </Grid>
  <Grid>
    <Button>Action</Button>
  </Grid>
</Grid>
```

---

## Stack

Stack lays out children in a single direction with uniform spacing. It's simpler than Grid for 1D layouts.

```tsx
import Stack from '@mui/material/Stack';

// Vertical stack (default)
<Stack spacing={2}>
  <Item />
  <Item />
  <Item />
</Stack>

// Horizontal stack
<Stack direction="row" spacing={1} alignItems="center">
  <Avatar />
  <Typography>Name</Typography>
  <Chip label="Admin" size="small" />
</Stack>

// Responsive direction
<Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
  <Card sx={{ flex: 1 }}>Left panel</Card>
  <Card sx={{ flex: 1 }}>Right panel</Card>
</Stack>

// With dividers
<Stack
  direction="row"
  divider={<Divider orientation="vertical" flexItem />}
  spacing={2}
>
  <Box>Section 1</Box>
  <Box>Section 2</Box>
  <Box>Section 3</Box>
</Stack>

// useFlexGap — applies gap instead of negative-margin spacing (better for wrapping)
<Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
  {tags.map((tag) => <Chip key={tag} label={tag} />)}
</Stack>
```

---

## Container

Container constrains content width and centers it horizontally.

```tsx
import Container from '@mui/material/Container';

// Responsive max-width (snaps to breakpoint values)
<Container maxWidth="sm">  {/* 600px */}
<Container maxWidth="md">  {/* 900px */}
<Container maxWidth="lg">  {/* 1200px — most common for page content */}
<Container maxWidth="xl">  {/* 1536px */}
<Container maxWidth={false}> {/* Full width, no max */}

// Fixed — exact breakpoint width (no fluid scaling between)
<Container maxWidth="md" fixed>

// No gutters (horizontal padding)
<Container disableGutters>

// Common page layout pattern
<Container maxWidth="lg" sx={{ py: 4 }}>
  <Grid container spacing={3}>
    {/* page content */}
  </Grid>
</Container>
```

---

## Box

Box is the foundational layout primitive — a `div` with the `sx` prop and `component` override.

```tsx
import Box from '@mui/material/Box';

// Flexbox layout
<Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
  <Avatar />
  <Box sx={{ flexGrow: 1 }}>
    <Typography variant="subtitle2">Title</Typography>
    <Typography variant="body2" color="text.secondary">Subtitle</Typography>
  </Box>
  <Button>Action</Button>
</Box>

// Semantic HTML via component prop
<Box component="section" sx={{ py: 6, bgcolor: 'background.paper' }}>
  <Box component="article" sx={{ maxWidth: 720, mx: 'auto', px: 2 }}>
    <Box component="h1" sx={{ typography: 'h3', mb: 2 }}>Heading</Box>
    <Box component="p" sx={{ typography: 'body1', color: 'text.secondary' }}>
      Article content here.
    </Box>
  </Box>
</Box>

// Absolute positioning
<Box sx={{ position: 'relative', width: '100%', height: 300 }}>
  <Box
    component="img"
    src="/hero.jpg"
    alt="Hero"
    sx={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
  />
  <Box sx={{ position: 'relative', zIndex: 1, p: 4, color: 'common.white' }}>
    Overlay content
  </Box>
</Box>
```

---

## Breakpoints

### useMediaQuery hook

```tsx
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function MyComponent() {
  const theme = useTheme();
  const isXs = useMediaQuery(theme.breakpoints.down('sm'));       // < 600px
  const isMd = useMediaQuery(theme.breakpoints.up('md'));        // >= 900px
  const isBetween = useMediaQuery(theme.breakpoints.between('sm', 'md')); // 600–899px
  const isLg = useMediaQuery(theme.breakpoints.only('lg'));      // 1200–1535px

  // Custom media query
  const isTall = useMediaQuery('(min-height: 600px)');
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)');

  return (
    <Box>
      {isXs && <MobileNav />}
      {isMd && <DesktopNav />}
    </Box>
  );
}
```

### SSR considerations

```tsx
// SSR: useMediaQuery returns false on server (no window)
// Use noSsr to skip the SSR phase and always hydrate with the client value
const isLarge = useMediaQuery(theme.breakpoints.up('lg'), { noSsr: true });

// Or provide an initial value matching your SSR assumption
const isMobile = useMediaQuery(theme.breakpoints.down('sm'), { defaultMatches: false });
```

### Breakpoint helpers in sx

```tsx
// These are all equivalent ways to apply styles above 'md':
<Box sx={{
  // 1. Responsive object
  display: { xs: 'none', md: 'flex' },
  // 2. Callback with breakpoints
  ...(theme) => ({ [theme.breakpoints.up('md')]: { display: 'flex' } }),
}} />

// In styled()
const NavBar = styled(Box)(({ theme }) => ({
  display: 'none',
  [theme.breakpoints.up('md')]: { display: 'flex' },
}));
```

### Hiding elements responsively

```tsx
// Replace deprecated Hidden component with sx display
<Box sx={{ display: { xs: 'block', md: 'none' } }}>
  Mobile only content
</Box>

<Box sx={{ display: { xs: 'none', md: 'block' } }}>
  Desktop only content
</Box>

// Or use conditional rendering with useMediaQuery
const isMobile = useMediaQuery(theme.breakpoints.down('md'));
{isMobile ? <MobileMenu /> : <DesktopMenu />}
```

---

## CSS Grid with sx

For complex two-dimensional layouts, use native CSS Grid via the `sx` prop:

```tsx
// Auto-responsive card grid (no breakpoints needed)
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: 3,
  }}
>
  {items.map((item) => <Card key={item.id}>{item.name}</Card>)}
</Box>

// Explicit responsive grid
<Box
  sx={{
    display: 'grid',
    gridTemplateColumns: {
      xs: '1fr',
      sm: 'repeat(2, 1fr)',
      md: 'repeat(3, 1fr)',
      lg: 'repeat(4, 1fr)',
    },
    gap: { xs: 2, md: 3 },
  }}
>

// Named areas
<Box
  sx={{
    display: 'grid',
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
    gridTemplateColumns: { xs: '1fr', md: '240px 1fr' },
    gridTemplateRows: { xs: 'auto', md: '64px 1fr 64px' },
    minHeight: '100vh',
  }}
>
  <Box sx={{ gridArea: 'header' }}><AppBar /></Box>
  <Box sx={{ gridArea: 'sidebar' }}><Sidebar /></Box>
  <Box sx={{ gridArea: 'main' }} component="main"><Content /></Box>
  <Box sx={{ gridArea: 'footer' }}><Footer /></Box>
</Box>
```

---

## Common Layout Patterns

### Sidebar + Content (responsive)

```tsx
const SIDEBAR_WIDTH = 260;

function AppLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Drawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={isMobile ? open : true}
        onClose={() => setOpen(false)}
        sx={{
          width: SIDEBAR_WIDTH,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: SIDEBAR_WIDTH,
            boxSizing: 'border-box',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Logo />
        </Box>
        <SidebarNav />
      </Drawer>

      {/* Main area */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          <Toolbar>
            {isMobile && (
              <IconButton onClick={() => setOpen(true)} sx={{ mr: 1 }}>
                <MenuIcon />
              </IconButton>
            )}
            <Typography variant="h6" sx={{ flexGrow: 1 }}>Dashboard</Typography>
          </Toolbar>
        </AppBar>

        <Box component="main" sx={{ flexGrow: 1, p: 3, overflow: 'auto' }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
```

### Dashboard Grid

```tsx
function Dashboard() {
  return (
    <Container maxWidth="xl" sx={{ py: 3 }}>
      {/* Stats row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        {stats.map((stat) => (
          <Grid key={stat.label} size={{ xs: 12, sm: 6, lg: 3 }}>
            <StatCard {...stat} />
          </Grid>
        ))}
      </Grid>

      {/* Charts row */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Card sx={{ p: 3, height: 360 }}>
            <RevenueChart />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Card sx={{ p: 3, height: 360 }}>
            <TrafficChart />
          </Card>
        </Grid>
      </Grid>

      {/* Table */}
      <Card>
        <RecentOrdersTable />
      </Card>
    </Container>
  );
}
```

### Responsive Card Grid

```tsx
function ProductGrid({ products }) {
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            md: 'repeat(3, 1fr)',
            lg: 'repeat(4, 1fr)',
          },
          gap: 3,
        }}
      >
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </Box>
    </Container>
  );
}
```

### Holy Grail Layout

```tsx
function HolyGrailLayout() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Header */}
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6">Site Name</Typography>
        </Toolbar>
      </AppBar>

      {/* Middle row: nav + main + aside */}
      <Box sx={{ display: 'flex', flexGrow: 1 }}>
        {/* Left nav */}
        <Box
          component="nav"
          sx={{
            width: { xs: 0, md: 220 },
            flexShrink: 0,
            display: { xs: 'none', md: 'block' },
            borderRight: '1px solid',
            borderColor: 'divider',
            p: 2,
          }}
        >
          <LeftNav />
        </Box>

        {/* Main content */}
        <Box component="main" sx={{ flexGrow: 1, p: 3, minWidth: 0 }}>
          <Outlet />
        </Box>

        {/* Right aside */}
        <Box
          component="aside"
          sx={{
            width: { xs: 0, lg: 280 },
            flexShrink: 0,
            display: { xs: 'none', lg: 'block' },
            borderLeft: '1px solid',
            borderColor: 'divider',
            p: 2,
          }}
        >
          <RelatedContent />
        </Box>
      </Box>

      {/* Footer */}
      <Box component="footer" sx={{ bgcolor: 'background.paper', borderTop: '1px solid', borderColor: 'divider', py: 4 }}>
        <Container maxWidth="lg">
          <Footer />
        </Container>
      </Box>
    </Box>
  );
}
```

### Centered Auth Layout

```tsx
function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        bgcolor: 'background.default',
        p: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 440 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Logo />
        </Box>
        <Paper sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
          {children}
        </Paper>
      </Box>
    </Box>
  );
}
```

---

## Responsive Typography

```tsx
// Method 1: responsiveFontSizes utility
import { createTheme, responsiveFontSizes } from '@mui/material/styles';
let theme = createTheme();
theme = responsiveFontSizes(theme); // auto-scales h1–h6 for each breakpoint

// Method 2: Manual responsive typography in theme
const theme = createTheme({
  typography: {
    h1: {
      fontSize: '2rem',
      [theme.breakpoints.up('md')]: { fontSize: '3rem' },
      [theme.breakpoints.up('lg')]: { fontSize: '4rem' },
    },
  },
});

// Method 3: sx responsive typography
<Typography sx={{ fontSize: { xs: '1.5rem', md: '2rem', lg: '3rem' }, fontWeight: 700 }}>
  Responsive Heading
</Typography>
```

---

## Layout Utilities

```tsx
// Full-height flex column
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <AppBar />
  <Box sx={{ flexGrow: 1, overflow: 'auto' }}>scrollable content</Box>
  <BottomBar />
</Box>

// Vertically centered content (fallback for old browsers)
<Box
  sx={{
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '60vh',
  }}
>
  <CircularProgress />
</Box>

// Sticky sidebar
<Box sx={{ display: 'flex', gap: 3, alignItems: 'flex-start' }}>
  <Box sx={{ flexGrow: 1 }}>
    <MainContent />
  </Box>
  <Box sx={{ width: 300, flexShrink: 0, position: 'sticky', top: 88 }}>
    <TableOfContents />
  </Box>
</Box>

// Truncate text in flex children (common bug — requires minWidth: 0)
<Box sx={{ display: 'flex' }}>
  <Typography noWrap sx={{ minWidth: 0 }}>Very long text that will truncate…</Typography>
  <Button sx={{ flexShrink: 0 }}>Action</Button>
</Box>
```
