---
name: components
description: MUI core component patterns and best practices
triggers:
  - component
  - Button
  - TextField
  - Dialog
  - Table
  - AppBar
  - Drawer
  - Autocomplete
  - Snackbar
  - Card
  - Menu
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

# MUI Core Components

Use this skill when implementing or modifying MUI components. This covers all major component categories with best practices and code examples.

## Input Components

### TextField

```tsx
import TextField from '@mui/material/TextField';

// Controlled with validation
<TextField
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={!!errors.email}
  helperText={errors.email ?? 'We will never share your email'}
  type="email"
  required
  fullWidth
  variant="outlined"  // outlined | filled | standard
  InputProps={{
    startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
  }}
/>
```

### Autocomplete

```tsx
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';

<Autocomplete
  options={countries}
  getOptionLabel={(option) => option.label}
  renderOption={(props, option) => (
    <li {...props} key={option.code}>
      <img src={`/flags/${option.code}.png`} alt="" width={20} />
      {option.label}
    </li>
  )}
  renderInput={(params) => <TextField {...params} label="Country" />}
  onChange={(_, value) => setCountry(value)}
  loading={isLoading}
  freeSolo={false}
  multiple={false}
/>
```

### Select

```tsx
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';

<FormControl fullWidth>
  <InputLabel id="role-label">Role</InputLabel>
  <Select
    labelId="role-label"
    value={role}
    label="Role"
    onChange={(e) => setRole(e.target.value)}
  >
    <MenuItem value="admin">Admin</MenuItem>
    <MenuItem value="editor">Editor</MenuItem>
    <MenuItem value="viewer">Viewer</MenuItem>
  </Select>
</FormControl>
```

## Display Components

### Typography

```tsx
import Typography from '@mui/material/Typography';

<Typography variant="h4" component="h1" gutterBottom>Page Title</Typography>
<Typography variant="body1" color="text.secondary">Description text</Typography>
<Typography variant="caption" sx={{ fontStyle: 'italic' }}>Footnote</Typography>
```

Variant mapping: h1-h6, subtitle1, subtitle2, body1, body2, button, caption, overline.

### Card

```tsx
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import CardMedia from '@mui/material/CardMedia';

<Card sx={{ maxWidth: 345 }}>
  <CardMedia component="img" height="140" image="/image.jpg" alt="Description" />
  <CardContent>
    <Typography gutterBottom variant="h5" component="div">Title</Typography>
    <Typography variant="body2" color="text.secondary">Card content here.</Typography>
  </CardContent>
  <CardActions>
    <Button size="small">Share</Button>
    <Button size="small">Learn More</Button>
  </CardActions>
</Card>
```

### Table

```tsx
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';

<TableContainer component={Paper}>
  <Table aria-label="users table">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell align="right">Email</TableCell>
        <TableCell align="right">Role</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow key={row.id} hover>
          <TableCell component="th" scope="row">{row.name}</TableCell>
          <TableCell align="right">{row.email}</TableCell>
          <TableCell align="right">{row.role}</TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

### Chip

```tsx
import Chip from '@mui/material/Chip';

<Chip label="Active" color="success" size="small" />
<Chip label="Tag" variant="outlined" onDelete={handleDelete} />
<Chip avatar={<Avatar>M</Avatar>} label="Clickable" onClick={handleClick} />
```

## Navigation Components

### AppBar + Drawer

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Drawer from '@mui/material/Drawer';
import IconButton from '@mui/material/IconButton';
import MenuIcon from '@mui/icons-material/Menu';

<AppBar position="fixed">
  <Toolbar>
    <IconButton edge="start" color="inherit" aria-label="open menu" onClick={toggleDrawer}>
      <MenuIcon />
    </IconButton>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>App Title</Typography>
  </Toolbar>
</AppBar>

<Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
  <List>
    <ListItemButton onClick={() => navigate('/dashboard')}>
      <ListItemIcon><DashboardIcon /></ListItemIcon>
      <ListItemText primary="Dashboard" />
    </ListItemButton>
  </List>
</Drawer>
```

### Tabs

```tsx
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

<Tabs value={tabIndex} onChange={(_, v) => setTabIndex(v)} aria-label="settings tabs">
  <Tab label="General" id="tab-0" aria-controls="tabpanel-0" />
  <Tab label="Security" id="tab-1" aria-controls="tabpanel-1" />
  <Tab label="Notifications" id="tab-2" aria-controls="tabpanel-2" />
</Tabs>

<div role="tabpanel" hidden={tabIndex !== 0} id="tabpanel-0" aria-labelledby="tab-0">
  {tabIndex === 0 && <GeneralSettings />}
</div>
```

## Feedback Components

### Dialog

```tsx
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';

<Dialog open={open} onClose={handleClose} aria-labelledby="dialog-title" maxWidth="sm" fullWidth>
  <DialogTitle id="dialog-title">Confirm Delete</DialogTitle>
  <DialogContent>
    <Typography>Are you sure you want to delete this item?</Typography>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} color="error" variant="contained">Delete</Button>
  </DialogActions>
</Dialog>
```

### Snackbar with Alert

```tsx
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

<Snackbar open={snackOpen} autoHideDuration={6000} onClose={handleSnackClose}>
  <Alert onClose={handleSnackClose} severity="success" variant="filled" sx={{ width: '100%' }}>
    Changes saved successfully!
  </Alert>
</Snackbar>
```

### Skeleton

```tsx
import Skeleton from '@mui/material/Skeleton';

// Loading placeholder
{isLoading ? (
  <>
    <Skeleton variant="rectangular" height={200} />
    <Skeleton variant="text" sx={{ fontSize: '1.5rem' }} />
    <Skeleton variant="text" width="60%" />
  </>
) : (
  <ActualContent />
)}
```

## Best practices

1. **Always use named imports** — `import Button from '@mui/material/Button'`
2. **Use `component` prop** for semantic HTML — `<Typography variant="h4" component="h1">`
3. **Provide `aria-label`** on every `IconButton`
4. **Use `key` props** on mapped components
5. **Prefer controlled components** for form inputs
6. **Use `sx` for one-off styles**, `styled()` for reusable styled components
7. **Use `variant="outlined"`** as default TextField variant (most accessible)
8. **Always provide `label`** on TextField (do not use `placeholder` as label substitute)
