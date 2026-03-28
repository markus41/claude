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

# MUI Layout and Responsive Design

## Grid v2

MUI v6 ships Grid v2 as default (imported from `@mui/material/Grid`). The `size` prop
replaces the old `xs`/`sm`/`md` props. Grid v2 always uses CSS grid internally and no
longer requires the `item` prop — every direct child of a `container` is a grid item.

### Basic grid

```tsx
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';

<Grid container spacing={2}>
  <Grid size={12}>
    <Paper sx={{ p: 2 }}>Full width header</Paper>
  </Grid>
  <Grid size={{ xs: 12, md: 8 }}>
    <Paper sx={{ p: 2 }}>Main content (full on mobile, 8/12 on desktop)</Paper>
  </Grid>
  <Grid size={{ xs: 12, md: 4 }}>
    <Paper sx={{ p: 2 }}>Sidebar (full on mobile, 4/12 on desktop)</Paper>
  </Grid>
</Grid>
```

### size values

```tsx
// Fixed column span
<Grid size={6} />           // always 6/12

// Responsive spans
<Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} />

// 'auto' — shrinks to content width
<Grid size="auto" />

// 'grow' — fills remaining space (equivalent to old xs="true")
<Grid size="grow" />
```

### Spacing and column/row gap

```tsx
// Uniform spacing
<Grid container spacing={3}>

// Separate column and row spacing
<Grid container columnSpacing={4} rowSpacing={2}>

// Responsive spacing
<Grid container spacing={{ xs: 1, sm: 2, md: 3 }}>
```

### Offset

```tsx
// Offset pushes the item right by n columns
<Grid container>
  <Grid size={4} offset={4}>
    <Paper sx={{ p: 2 }}>Centered 4-column block</Paper>
  </Grid>
</Grid>

// Responsive offset
<Grid size={6} offset={{ xs: 0, md: 3 }}>
  Centered on desktop, left-aligned on mobile
</Grid>
```

### Nested grid

```tsx
<Grid container spacing={2}>
  <Grid size={8}>
    {/* Nested grid — no additional container needed in v2 */}
    <Grid container spacing={1}>
      <Grid size={6}><Paper sx={{ p: 1 }}>Nested A</Paper></Grid>
      <Grid size={6}><Paper sx={{ p: 1 }}>Nested B</Paper></Grid>
    </Grid>
  </Grid>
  <Grid size={4}>
    <Paper sx={{ p: 2 }}>Sidebar</Paper>
  </Grid>
</Grid>
```

---

## Stack

`Stack` is a one-dimensional layout component (flexbox row or column). Simpler than Grid
for linear sequences of components.

### Basic usage

```tsx
import Stack from '@mui/material/Stack';
import Divider from '@mui/material/Divider';

// Vertical stack (default direction)
<Stack spacing={2}>
  <TextField label="First name" />
  <TextField label="Last name" />
  <TextField label="Email" />
  <Button variant="contained">Submit</Button>
</Stack>

// Horizontal row
<Stack direction="row" spacing={1} alignItems="center">
  <Avatar src={user.avatar} />
  <Typography>{user.name}</Typography>
  <Chip label={user.role} size="small" />
</Stack>
```

### Responsive direction

```tsx
<Stack
  direction={{ xs: 'column', sm: 'row' }}
  spacing={{ xs: 1, sm: 2 }}
  alignItems={{ xs: 'stretch', sm: 'center' }}
  justifyContent="space-between"
>
  <SearchInput />
  <FilterPanel />
  <ActionButtons />
</Stack>
```

### Divider between items

```tsx
<Stack
  direction="row"
  spacing={2}
  divider={<Divider orientation="vertical" flexItem />}
>
  <Typography>Section A</Typography>
  <Typography>Section B</Typography>
  <Typography>Section C</Typography>
</Stack>
```

### useFlexGap

By default Stack uses negative margin to simulate gaps. Set `useFlexGap` to use the CSS
`gap` property instead — required when children have `overflow: hidden` or when the
container has `overflow: hidden`.

```tsx
<Stack
  direction="row"
  spacing={2}
  useFlexGap
  flexWrap="wrap"
  sx={{ width: '100%' }}
>
  {tags.map((tag) => <Chip key={tag} label={tag} />)}
</Stack>
```

---

## Container

Centers content horizontally with a max-width. The main layout wrapper for page content.

```tsx
import Container from '@mui/material/Container';

// Responsive max-width (uses theme breakpoints)
<Container maxWidth="lg">        {/* lg = 1200px by default */}
  <Typography variant="h1">Page title</Typography>
</Container>

// Exact pixel constraint
<Container maxWidth="sm">        {/* sm = 600px */}

// Disable max-width (full fluid width)
<Container maxWidth={false}>

// 'fixed' — jumps between fixed widths at each breakpoint
<Container fixed>

// Typical page layout
<Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
  <AppBar position="sticky">{/* ... */}</AppBar>
  <Container maxWidth="xl" sx={{ flex: 1, py: 3 }}>
    {children}
  </Container>
  <Box component="footer" sx={{ bgcolor: 'background.paper', py: 4 }}>
    <Container maxWidth="xl">{/* footer content */}</Container>
  </Box>
</Box>
```

---

## Box as a Layout Primitive

`Box` renders a `div` by default but accepts a `component` prop. It has full access to
the `sx` prop and system shorthands.

```tsx
import Box from '@mui/material/Box';

// Flex centering helper
<Box display="flex" alignItems="center" justifyContent="center" minHeight="100vh">
  <CircularProgress />
</Box>

// Section spacing
<Box component="section" sx={{ py: { xs: 6, md: 10 } }}>
  {children}
</Box>

// Scroll container
<Box sx={{ overflowY: 'auto', maxHeight: 400, '&::-webkit-scrollbar': { width: 6 } }}>
  {longList}
</Box>
```

---

## Breakpoints

MUI's default breakpoints (in `px`):

| Key | Min width |
|-----|-----------|
| xs  | 0         |
| sm  | 600       |
| md  | 900       |
| lg  | 1200      |
| xl  | 1536      |

### useMediaQuery

```tsx
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

function ResponsiveComponent() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const isTablet = useMediaQuery(theme.breakpoints.between('sm', 'md'));
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));

  // SSR: default to a value so the first render matches server output
  const prefersDark = useMediaQuery('(prefers-color-scheme: dark)', {
    defaultMatches: false,
    noSsr: true,
  });

  return isMobile ? <MobileLayout /> : <DesktopLayout />;
}
```

### Breakpoint helpers

```tsx
// theme.breakpoints.up(key)   — key and above
// theme.breakpoints.down(key) — below key (exclusive)
// theme.breakpoints.between(start, end) — start to end (exclusive end)
// theme.breakpoints.only(key) — exactly key

// In sx prop (shorthand)
<Box sx={{
  display: { xs: 'none', md: 'block' },     // hide on mobile
}}>
  Desktop only content
</Box>

// In styled()
const HiddenOnMobile = styled(Box)(({ theme }) => ({
  [theme.breakpoints.down('md')]: {
    display: 'none',
  },
}));
```

---

## Common Layout Patterns

### App shell: sidebar + main content

```tsx
const DRAWER_WIDTH = 240;

function AppShell() {
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  const drawerContent = (
    <Box>
      <Toolbar />
      <Divider />
      <NavMenu />
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}
      >
        <Toolbar>
          {isMobile && (
            <IconButton color="inherit" edge="start" onClick={() => setMobileOpen(true)}>
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>My App</Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile: temporary drawer */}
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', md: 'none' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop: permanent drawer */}
      <Drawer
        variant="permanent"
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          width: DRAWER_WIDTH,
          flexShrink: 0,
        }}
        open
      >
        {drawerContent}
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: { md: `${DRAWER_WIDTH}px` } }}>
        <Toolbar /> {/* Spacer for AppBar */}
        {/* Page content */}
      </Box>
    </Box>
  );
}
```

### Dashboard card grid

```tsx
function Dashboard() {
  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      {/* Stat cards row */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {stats.map((stat) => (
          <Grid key={stat.id} size={{ xs: 12, sm: 6, md: 3 }}>
            <StatCard stat={stat} />
          </Grid>
        ))}
      </Grid>

      {/* Main content + sidebar */}
      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 8 }}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Recent Activity</Typography>
            <ActivityChart />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, lg: 4 }}>
          <Stack spacing={3}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Quick Stats</Typography>
              <QuickStats />
            </Paper>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Top Items</Typography>
              <TopItemsList />
            </Paper>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
```

### Centered auth form

```tsx
function LoginPage() {
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
      <Container maxWidth="xs">
        <Paper elevation={3} sx={{ p: { xs: 3, sm: 4 }, borderRadius: 2 }}>
          <Stack spacing={3} alignItems="center">
            <Logo />
            <Typography variant="h5" fontWeight={600}>Sign in</Typography>
            <LoginForm />
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}
```

### Masonry layout

```tsx
// For masonry layout, use Masonry from @mui/lab
import Masonry from '@mui/lab/Masonry';

<Masonry columns={{ xs: 1, sm: 2, md: 3 }} spacing={2}>
  {items.map((item) => (
    <Paper key={item.id} sx={{ p: 2 }}>
      <Typography variant="body2">{item.content}</Typography>
    </Paper>
  ))}
</Masonry>
```

---

## Advanced Layout Patterns

### Responsive AppBar + Drawer Layout

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

const DRAWER_WIDTH = 240;

function ResponsiveLayout({ children }: { children: React.ReactNode }) {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up('md'));
  const [mobileOpen, setMobileOpen] = useState(false);

  const drawerContent = (
    <Box sx={{ width: DRAWER_WIDTH }}>
      <Toolbar /> {/* spacer for AppBar height */}
      <List>
        {navItems.map((item) => (
          <ListItemButton key={item.path} component={RouterLink} to={item.path}>
            <ListItemIcon>{item.icon}</ListItemIcon>
            <ListItemText primary={item.label} />
          </ListItemButton>
        ))}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          {!isDesktop && (
            <IconButton edge="start" onClick={() => setMobileOpen(true)} aria-label="menu">
              <MenuIcon />
            </IconButton>
          )}
          <Typography variant="h6" noWrap sx={{ flexGrow: 1 }}>App</Typography>
        </Toolbar>
      </AppBar>

      {/* Mobile: temporary drawer */}
      {!isDesktop && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ '& .MuiDrawer-paper': { width: DRAWER_WIDTH } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop: permanent drawer */}
      {isDesktop && (
        <Drawer
          variant="permanent"
          sx={{
            width: DRAWER_WIDTH,
            flexShrink: 0,
            '& .MuiDrawer-paper': { width: DRAWER_WIDTH, boxSizing: 'border-box' },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
        }}
      >
        <Toolbar /> {/* spacer */}
        {children}
      </Box>
    </Box>
  );
}
```

### Mini Variant Drawer (Icon-Only Collapsed)

```tsx
const MINI_WIDTH = 56;
const FULL_WIDTH = 240;

<Drawer
  variant="permanent"
  sx={{
    width: expanded ? FULL_WIDTH : MINI_WIDTH,
    transition: (theme) => theme.transitions.create('width', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.enteringScreen,
    }),
    '& .MuiDrawer-paper': {
      width: expanded ? FULL_WIDTH : MINI_WIDTH,
      overflowX: 'hidden',
      transition: 'inherit',
    },
  }}
>
  <Toolbar>
    <IconButton onClick={() => setExpanded(!expanded)}>
      {expanded ? <ChevronLeftIcon /> : <MenuIcon />}
    </IconButton>
  </Toolbar>
  <List>
    {navItems.map((item) => (
      <Tooltip key={item.path} title={expanded ? '' : item.label} placement="right">
        <ListItemButton sx={{ minHeight: 48, px: 2.5, justifyContent: expanded ? 'initial' : 'center' }}>
          <ListItemIcon sx={{ minWidth: 0, mr: expanded ? 3 : 'auto', justifyContent: 'center' }}>
            {item.icon}
          </ListItemIcon>
          {expanded && <ListItemText primary={item.label} />}
        </ListItemButton>
      </Tooltip>
    ))}
  </List>
</Drawer>
```

### Sticky Header + Scrollable Content

```tsx
<Box sx={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <AppBar position="static">
    <Toolbar><Typography variant="h6">App</Typography></Toolbar>
  </AppBar>
  <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
    {/* Scrollable content area */}
    {children}
  </Box>
  <Paper elevation={3} sx={{ p: 2 }}>
    {/* Sticky footer */}
    <Button variant="contained" fullWidth>Save</Button>
  </Paper>
</Box>
```

### Dashboard Grid Layout

```tsx
<Grid container spacing={3}>
  {/* Full-width stats row */}
  <Grid size={12}>
    <Stack direction="row" spacing={2} sx={{ overflowX: 'auto' }}>
      {stats.map((stat) => (
        <Paper key={stat.label} sx={{ p: 2, minWidth: 200, flex: '0 0 auto' }}>
          <Typography variant="caption" color="text.secondary">{stat.label}</Typography>
          <Typography variant="h4">{stat.value}</Typography>
        </Paper>
      ))}
    </Stack>
  </Grid>

  {/* Main chart + sidebar */}
  <Grid size={{ xs: 12, lg: 8 }}>
    <Paper sx={{ p: 2, height: 400 }}>
      <RevenueChart />
    </Paper>
  </Grid>
  <Grid size={{ xs: 12, lg: 4 }}>
    <Paper sx={{ p: 2, height: 400 }}>
      <ActivityFeed />
    </Paper>
  </Grid>

  {/* Full-width data table */}
  <Grid size={12}>
    <Paper sx={{ height: 500 }}>
      <DataGrid rows={rows} columns={columns} />
    </Paper>
  </Grid>
</Grid>
```
