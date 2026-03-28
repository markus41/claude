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

# MUI Core Components Reference

## Input Components

### TextField

The most common form input. Wraps `FormControl`, `InputLabel`, `OutlinedInput`/`FilledInput`/`Input`,
and `FormHelperText` in one component.

```tsx
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';

// Standard usage
<TextField
  label="Email address"
  type="email"
  variant="outlined"          // 'outlined' | 'filled' | 'standard'
  size="small"                // 'small' | 'medium'
  fullWidth
  required
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  error={!!emailError}
  helperText={emailError || 'We will never share your email'}
  InputProps={{
    startAdornment: <InputAdornment position="start"><EmailIcon /></InputAdornment>,
  }}
  inputProps={{ maxLength: 100, 'aria-label': 'email address' }}
/>

// Multiline / textarea
<TextField
  label="Description"
  multiline
  rows={4}
  // or: minRows={2} maxRows={8} for auto-grow
  fullWidth
/>
```

### Autocomplete

Combines a text input with a dropdown for both free-form and constrained selection.

```tsx
import Autocomplete from '@mui/material/Autocomplete';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';

// Static options
<Autocomplete
  options={countries}
  getOptionLabel={(option) => option.label}
  isOptionEqualToValue={(option, value) => option.code === value.code}
  value={selectedCountry}
  onChange={(_, newValue) => setSelectedCountry(newValue)}
  renderInput={(params) => (
    <TextField {...params} label="Country" />
  )}
/>

// Multiple selection with chips
<Autocomplete
  multiple
  options={tags}
  value={selectedTags}
  onChange={(_, newValue) => setSelectedTags(newValue)}
  renderTags={(value, getTagProps) =>
    value.map((option, index) => (
      <Chip label={option} {...getTagProps({ index })} key={option} />
    ))
  }
  renderInput={(params) => (
    <TextField {...params} label="Tags" placeholder="Add tag" />
  )}
/>

// Async / server-side options
const [open, setOpen] = React.useState(false);
const [options, setOptions] = React.useState([]);
const [loading, setLoading] = React.useState(false);

<Autocomplete
  open={open}
  onOpen={() => { setOpen(true); fetchOptions(); }}
  onClose={() => setOpen(false)}
  options={options}
  loading={loading}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Search users"
      InputProps={{
        ...params.InputProps,
        endAdornment: (
          <>
            {loading && <CircularProgress size={20} />}
            {params.InputProps.endAdornment}
          </>
        ),
      }}
    />
  )}
/>
```

### Select

```tsx
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Checkbox from '@mui/material/Checkbox';
import ListItemText from '@mui/material/ListItemText';

<FormControl fullWidth size="small">
  <InputLabel id="role-label">Role</InputLabel>
  <Select
    labelId="role-label"
    label="Role"
    value={role}
    onChange={(e) => setRole(e.target.value)}
  >
    <MenuItem value="admin">Administrator</MenuItem>
    <MenuItem value="editor">Editor</MenuItem>
    <MenuItem value="viewer">Viewer</MenuItem>
  </Select>
</FormControl>

// Multiple select with checkboxes
<Select
  multiple
  value={selectedRoles}
  onChange={handleChange}
  renderValue={(selected) => (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
      {selected.map((value) => <Chip key={value} label={value} size="small" />)}
    </Box>
  )}
>
  {roles.map((role) => (
    <MenuItem key={role} value={role}>
      <Checkbox checked={selectedRoles.includes(role)} />
      <ListItemText primary={role} />
    </MenuItem>
  ))}
</Select>
```

### Checkbox, Radio, Switch

```tsx
import Checkbox from '@mui/material/Checkbox';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

// Checkbox with indeterminate state
<Checkbox
  checked={allSelected}
  indeterminate={someSelected && !allSelected}
  onChange={handleSelectAll}
/>

// Radio group
<RadioGroup value={alignment} onChange={(e) => setAlignment(e.target.value)}>
  <FormControlLabel value="left" control={<Radio />} label="Left" />
  <FormControlLabel value="center" control={<Radio />} label="Center" />
  <FormControlLabel value="right" control={<Radio />} label="Right" />
</RadioGroup>

// Switch
<FormControlLabel
  control={
    <Switch checked={darkMode} onChange={(e) => setDarkMode(e.target.checked)} />
  }
  label="Dark mode"
/>
```

### Slider and Rating

```tsx
import Slider from '@mui/material/Slider';
import Rating from '@mui/material/Rating';

// Range slider
<Slider
  value={priceRange}
  onChange={(_, newValue) => setPriceRange(newValue as number[])}
  valueLabelDisplay="auto"
  min={0}
  max={1000}
  step={10}
  marks={[
    { value: 0, label: '$0' },
    { value: 500, label: '$500' },
    { value: 1000, label: '$1000' },
  ]}
/>

// Star rating
<Rating
  value={rating}
  onChange={(_, newValue) => setRating(newValue)}
  precision={0.5}
  size="large"
/>
```

---

## Display Components

### Typography

```tsx
import Typography from '@mui/material/Typography';

// Semantic element with visual variant
<Typography variant="h1" component="h2">Page title</Typography>

// Caption with ellipsis
<Typography
  variant="body2"
  color="text.secondary"
  noWrap
  sx={{ maxWidth: 200 }}
>
  Long text that will be truncated
</Typography>

// Paragraph with bottom margin
<Typography variant="body1" gutterBottom>
  First paragraph with bottom margin.
</Typography>
```

### Chip

```tsx
import Chip from '@mui/material/Chip';
import Avatar from '@mui/material/Avatar';

<Chip label="Active" color="success" size="small" />
<Chip label="Draft" variant="outlined" onDelete={handleDelete} />
<Chip
  avatar={<Avatar alt="User" src="/user.jpg" />}
  label="Jane Smith"
  onClick={handleClick}
  clickable
/>
```

### Avatar and Badge

```tsx
import Avatar from '@mui/material/Avatar';
import AvatarGroup from '@mui/material/AvatarGroup';
import Badge from '@mui/material/Badge';

// Avatar with fallback initials
<Avatar src="/user.jpg" alt="John Doe">JD</Avatar>

// Avatar group with overflow count
<AvatarGroup max={4}>
  {users.map((u) => <Avatar key={u.id} src={u.avatar} alt={u.name} />)}
</AvatarGroup>

// Notification badge on icon
<Badge badgeContent={unreadCount} color="error" max={99}>
  <NotificationsIcon />
</Badge>

// Online indicator dot
<Badge
  overlap="circular"
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
  variant="dot"
  color="success"
>
  <Avatar src="/user.jpg" />
</Badge>
```

### Tooltip

```tsx
import Tooltip from '@mui/material/Tooltip';

<Tooltip title="Delete this item" placement="top" arrow>
  <IconButton aria-label="delete"><DeleteIcon /></IconButton>
</Tooltip>

// Tooltip on disabled element (needs a wrapping span)
<Tooltip title="You don't have permission">
  <span>
    <Button disabled>Restricted action</Button>
  </span>
</Tooltip>
```

### Alert

```tsx
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';

<Alert severity="warning" variant="filled" onClose={handleClose}>
  <AlertTitle>Warning</AlertTitle>
  Your subscription expires in 3 days.
</Alert>

// severity: 'error' | 'warning' | 'info' | 'success'
// variant: 'standard' | 'filled' | 'outlined'
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

<TableContainer component={Paper} sx={{ maxHeight: 440 }}>
  <Table stickyHeader aria-label="users table" size="small">
    <TableHead>
      <TableRow>
        <TableCell>Name</TableCell>
        <TableCell align="right">Age</TableCell>
        <TableCell>Status</TableCell>
      </TableRow>
    </TableHead>
    <TableBody>
      {rows.map((row) => (
        <TableRow
          key={row.id}
          hover
          selected={selectedId === row.id}
          onClick={() => setSelectedId(row.id)}
          sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
        >
          <TableCell component="th" scope="row">{row.name}</TableCell>
          <TableCell align="right">{row.age}</TableCell>
          <TableCell>
            <Chip
              label={row.status}
              color={row.status === 'active' ? 'success' : 'default'}
              size="small"
            />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  </Table>
</TableContainer>
```

---

## Navigation Components

### AppBar

```tsx
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';

<AppBar position="sticky" color="default" elevation={1}>
  <Toolbar>
    <IconButton edge="start" onClick={toggleDrawer} aria-label="open menu">
      <MenuIcon />
    </IconButton>
    <Typography variant="h6" sx={{ flexGrow: 1 }}>App Name</Typography>
    <Button color="inherit" startIcon={<LoginIcon />}>Sign in</Button>
  </Toolbar>
</AppBar>
```

### Drawer

```tsx
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';

// Temporary drawer (modal overlay)
<Drawer
  anchor="left"
  open={drawerOpen}
  onClose={() => setDrawerOpen(false)}
  PaperProps={{ sx: { width: 280 } }}
>
  <Box role="presentation" onClick={() => setDrawerOpen(false)}>
    <List>
      {navItems.map((item) => (
        <ListItemButton
          key={item.path}
          selected={pathname === item.path}
          component={RouterLink}
          to={item.path}
        >
          <ListItemIcon>{item.icon}</ListItemIcon>
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  </Box>
</Drawer>

// Permanent drawer for desktop
<Drawer
  variant="permanent"
  sx={{ width: 240, '& .MuiDrawer-paper': { width: 240, boxSizing: 'border-box' } }}
>
  {drawerContent}
</Drawer>
```

### Tabs

```tsx
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';

<Tabs
  value={activeTab}
  onChange={(_, newValue) => setActiveTab(newValue)}
  aria-label="main navigation tabs"
  indicatorColor="primary"
  textColor="primary"
  variant="scrollable"
  scrollButtons="auto"
>
  <Tab label="Overview" value="overview" />
  <Tab label="Analytics" value="analytics" />
  <Tab label="Settings" value="settings" disabled />
</Tabs>
```

### Menu

```tsx
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';

const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

<IconButton onClick={(e) => setAnchorEl(e.currentTarget)} aria-label="account menu">
  <AccountCircleIcon />
</IconButton>
<Menu
  anchorEl={anchorEl}
  open={Boolean(anchorEl)}
  onClose={() => setAnchorEl(null)}
  transformOrigin={{ horizontal: 'right', vertical: 'top' }}
  anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
>
  <MenuItem onClick={handleProfile}>
    <ListItemIcon><PersonIcon /></ListItemIcon>
    Profile
  </MenuItem>
  <Divider />
  <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
    <ListItemIcon><LogoutIcon color="error" /></ListItemIcon>
    Logout
  </MenuItem>
</Menu>
```

### Breadcrumbs and Pagination

```tsx
import Breadcrumbs from '@mui/material/Breadcrumbs';
import Pagination from '@mui/material/Pagination';

// Breadcrumbs
<Breadcrumbs aria-label="breadcrumb">
  <Link component={RouterLink} to="/" underline="hover" color="inherit">Home</Link>
  <Link component={RouterLink} to="/products" underline="hover" color="inherit">Products</Link>
  <Typography color="text.primary">Laptop</Typography>
</Breadcrumbs>

// Pagination
<Pagination
  count={totalPages}
  page={currentPage}
  onChange={(_, page) => setCurrentPage(page)}
  color="primary"
  size="small"
  siblingCount={1}
  boundaryCount={1}
  showFirstButton
  showLastButton
/>
```

---

## Feedback Components

### Dialog

```tsx
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';

<Dialog
  open={open}
  onClose={handleClose}
  maxWidth="sm"
  fullWidth
  aria-labelledby="confirm-dialog-title"
>
  <DialogTitle id="confirm-dialog-title">Confirm deletion</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to delete <strong>{itemName}</strong>? This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} color="error" variant="contained" autoFocus>
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

### Snackbar

```tsx
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';

// Simple message
<Snackbar
  open={snackbarOpen}
  autoHideDuration={4000}
  onClose={() => setSnackbarOpen(false)}
  message="Changes saved"
  anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
/>

// With Alert for severity styling
<Snackbar open={open} autoHideDuration={6000} onClose={handleClose}>
  <Alert onClose={handleClose} severity="success" variant="filled" sx={{ width: '100%' }}>
    Profile updated successfully.
  </Alert>
</Snackbar>
```

### Progress and Loading States

```tsx
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import Backdrop from '@mui/material/Backdrop';
import Skeleton from '@mui/material/Skeleton';

// Indeterminate spinner
<CircularProgress size={24} />

// Determinate with percentage
<CircularProgress variant="determinate" value={uploadPercent} />

// Linear progress bar
<LinearProgress
  variant="determinate"
  value={progress}
  sx={{ height: 8, borderRadius: 4 }}
/>

// Loading overlay
{loading && (
  <Backdrop open sx={{ zIndex: (theme) => theme.zIndex.drawer + 1, color: '#fff' }}>
    <CircularProgress color="inherit" />
  </Backdrop>
)}

// Skeleton placeholder cards
{loading
  ? Array.from({ length: 6 }).map((_, i) => (
      <Card key={i}>
        <Skeleton variant="rectangular" height={140} />
        <CardContent>
          <Skeleton variant="text" width="80%" />
          <Skeleton variant="text" width="60%" />
        </CardContent>
      </Card>
    ))
  : items.map((item) => <ItemCard key={item.id} item={item} />)
}
```

---

## Layout: Card and Paper

```tsx
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardMedia from '@mui/material/CardMedia';
import CardActions from '@mui/material/CardActions';
import CardHeader from '@mui/material/CardHeader';
import Paper from '@mui/material/Paper';

<Card sx={{ maxWidth: 345 }} elevation={2}>
  <CardHeader
    avatar={<Avatar>{user.initials}</Avatar>}
    title={user.name}
    subheader={formatDate(post.createdAt)}
    action={<IconButton aria-label="settings"><MoreVertIcon /></IconButton>}
  />
  <CardMedia component="img" height="140" image={post.thumbnail} alt={post.title} />
  <CardContent>
    <Typography variant="body2" color="text.secondary">{post.excerpt}</Typography>
  </CardContent>
  <CardActions>
    <Button size="small">Read more</Button>
    <IconButton aria-label="like"><FavoriteIcon /></IconButton>
    <IconButton aria-label="share"><ShareIcon /></IconButton>
  </CardActions>
</Card>

// Paper as a surface container
<Paper elevation={0} variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
  {children}
</Paper>
```

## Layout: List

```tsx
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import ListSubheader from '@mui/material/ListSubheader';

<List
  subheader={<ListSubheader component="div">Recent files</ListSubheader>}
  sx={{ width: '100%', maxWidth: 360 }}
>
  {files.map((file) => (
    <React.Fragment key={file.id}>
      <ListItem
        disablePadding
        secondaryAction={
          <IconButton edge="end" onClick={() => handleDelete(file.id)}>
            <DeleteIcon />
          </IconButton>
        }
      >
        <ListItemButton onClick={() => handleOpen(file)}>
          <ListItemIcon><InsertDriveFileIcon /></ListItemIcon>
          <ListItemText primary={file.name} secondary={formatBytes(file.size)} />
        </ListItemButton>
      </ListItem>
      <Divider component="li" />
    </React.Fragment>
  ))}
</List>
```
