# MUI Component API Reference - Comprehensive Documentation

**Date Compiled**: 2026-03-28
**Sources**: Official Material UI Documentation, API References, Integration Guides

---

## 1. BUTTON COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'text' \| 'outlined' \| 'contained'` | `'text'` | Visual style of the button |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Button dimensions |
| `color` | `'primary' \| 'secondary' \| 'error' \| 'warning' \| 'info' \| 'success' \| 'inherit'` | `'primary'` | Semantic color palette |
| `disabled` | `boolean` | `false` | Disables interaction |
| `fullWidth` | `boolean` | `false` | Expands to container width |
| `startIcon` | `React.ReactNode` | - | Leading icon element |
| `endIcon` | `React.ReactNode` | - | Trailing icon element |
| `loading` | `boolean` | `false` | Shows loading indicator (v6.4.0+) |
| `loadingPosition` | `'start' \| 'end' \| 'center'` | `'center'` | Loading indicator placement |
| `loadingIndicator` | `React.ReactNode` | `CircularProgress` | Custom loading display |
| `type` | `'button' \| 'submit' \| 'reset'` | `'button'` | HTML button type |
| `href` | `string` | - | Makes button behave as link |
| `component` | `string \| React.ElementType` | `'button'` | Root element component |
| `sx` | `object` | - | System prop for custom styling |

### Advanced Patterns

**Loading State**: The Button is disabled as long as it's loading. Default loading indicator uses CircularProgress component.

```jsx
<Button loading={isLoading} loadingPosition="center">
  Submit
</Button>
```

**Icon Buttons**: Use `startIcon` and `endIcon` props to add icons before/after button text.

```jsx
<Button startIcon={<SaveIcon />} variant="contained">
  Save
</Button>
```

**ButtonGroup**: Group related buttons together with consistent styling.

### ButtonGroup API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'contained' \| 'outlined' \| 'text'` | `'outlined'` | Style variant for all buttons |
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size for all buttons |
| `color` | `'inherit' \| 'primary' \| 'secondary' \| 'error' \| 'info' \| 'success' \| 'warning'` | `'primary'` | Color for all buttons |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Button group direction |
| `disabled` | `boolean` | `false` | Disables all buttons |
| `disableElevation` | `boolean` | `false` | Removes elevation shadow |
| `fullWidth` | `boolean` | `false` | Makes all buttons full width |

### Accessibility Notes

- Focus-visible states include 3px outline with specific color offset for keyboard navigation
- Supports ARIA attributes inherited from underlying element
- Loading state should be announced to screen readers
- Icon buttons should have meaningful label text or aria-label

### Common Pitfalls

- Loading state was not available in versions before v6.4.0
- Icons alone don't satisfy accessibility without text or aria-label
- Button variant and size props cascade in ButtonGroup but can be overridden per button

---

## 2. TEXT FIELD COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `variant` | `'standard' \| 'filled' \| 'outlined'` | `'outlined'` | Input style variant |
| `size` | `'small' \| 'medium'` | `'medium'` | Input dimensions |
| `color` | `'primary' \| 'secondary' \| 'error' \| 'warning' \| 'info' \| 'success'` | `'primary'` | Focused underline color |
| `type` | `string` | `'text'` | HTML input type |
| `multiline` | `boolean` | `false` | Enable multi-line input |
| `rows` | `number` | - | Min visible rows for multiline |
| `maxRows` | `number` | - | Max rows before scroll (multiline) |
| `label` | `React.ReactNode` | - | Floating label text |
| `placeholder` | `string` | - | Input placeholder text |
| `value` | `string` | - | Controlled input value |
| `defaultValue` | `string` | - | Uncontrolled default value |
| `error` | `boolean` | `false` | Display error state |
| `helperText` | `React.ReactNode` | - | Guidance text below input |
| `disabled` | `boolean` | `false` | Disable interaction |
| `required` | `boolean` | `false` | Mark as required |
| `fullWidth` | `boolean` | `false` | Expand to container width |
| `autoFocus` | `boolean` | `false` | Focus on mount |
| `onChange` | `(event) => void` | - | Change handler |
| `onBlur` | `(event) => void` | - | Blur handler |
| `onFocus` | `(event) => void` | - | Focus handler |
| `InputProps` | `object` | - | Props passed to Input component |
| `InputLabelProps` | `object` | - | Props passed to InputLabel |
| `FormHelperTextProps` | `object` | - | Props passed to FormHelperText |

### TextField Variants

**Standard**: Minimal styling with bottom border indicator (legacy, less common in modern designs)

**Filled**: Semi-transparent background (FilledInput-bg: rgba(0, 0, 0, 0.06) in light mode)

**Outlined**: Complete border around input field (recommended, default)

### Adornments with InputAdornment

**Purpose**: Add prefix, suffix, or action to input (icons, units, buttons)

**InputAdornment Props**:

| Prop | Type | Values | Description |
|------|------|--------|-------------|
| `position` | `string` | `'start' \| 'end'` | Adornment placement |
| `variant` | `string` | `'standard' \| 'filled' \| 'outlined'` | Match TextField variant |

**Usage Pattern**:

```jsx
<TextField
  label="Price"
  InputProps={{
    startAdornment: <InputAdornment position="start">$</InputAdornment>
  }}
/>

<TextField
  label="Password"
  type="password"
  InputProps={{
    endAdornment: <InputAdornment position="end">
      <IconButton onClick={toggleVisibility}>
        {showPassword ? <VisibilityIcon /> : <VisibilityOffIcon />}
      </IconButton>
    </InputAdornment>
  }}
/>
```

### Multiline Behavior

- Set `multiline={true}` to enable multi-line input
- Use `rows` prop to define minimum visible lines
- Use `maxRows` for maximum expandable lines
- Component expands as user types beyond maxRows height

```jsx
<TextField
  multiline
  rows={4}
  maxRows={8}
  placeholder="Your message here"
/>
```

### Validation & Error States

**Error State**: Set `error={true}` to display error styling (red borders/text)

**Helper Text**: Displays below input with validation feedback:

```jsx
<TextField
  error={hasError}
  helperText={hasError ? "Invalid email" : "Enter valid email"}
  type="email"
/>
```

**Validation Patterns**:
- HTML5 attributes: `type`, `pattern`, `required`, `minLength`, `maxLength`
- React state-based custom validation
- Form library integration (React Hook Form, Formik)

### Label Behavior

- Labels automatically animate upward when focused or filled
- Labels integrate seamlessly with filled/outlined variants
- Use `InputLabelProps={{ shrink: true }}` to force label upward
- Label shrinking issues with startAdornment can be controlled via shrink prop

### Dark Mode Support

TextField automatically adapts to both light and dark color schemes via `[data-mui-color-scheme="dark"]` selectors.

### Accessibility Notes

- `label` prop creates associated FormLabel for screen readers
- `helperText` is associated with input via aria-describedby
- `error` state should be clearly communicated to assistive technology
- Use `type="email"`, `type="password"` etc. for semantic HTML

### Common Pitfalls

- **InputProps vs inputProps**: InputProps (capitalized) for MUI components (Icons, buttons), inputProps (lowercase) for raw HTML attributes
- **Adornment Label Shrink**: TextField with startAdornment may require `InputLabelProps={{ shrink: true }}`
- **Deprecation**: InputProps becoming deprecated in favor of slotProps in MUI v6
- **Multiline Expand**: maxRows doesn't prevent scrolling, it just limits visible rows before scroll

### Migration Note (v5 → v6)

Use `slotProps.htmlInput` and `slotProps.input` instead of legacy `inputProps` and `InputProps` for better clarity.

---

## 3. DIALOG COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls visibility |
| `onClose` | `(event, reason) => void` | - | Callback when dialog requests close |
| `fullScreen` | `boolean` | `false` | Expand to full screen |
| `maxWidth` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| false` | `'sm'` | Maximum dialog width |
| `fullWidth` | `boolean` | `false` | Stretch to maxWidth |
| `TransitionComponent` | `React.ComponentType` | `Fade` | Animation component |
| `scroll` | `'paper' \| 'body'` | `'paper'` | Scroll behavior mode |
| `disableEscapeKeyDown` | `boolean` | `false` | Disable Escape key close |
| `onBackdropClick` | `() => void` | - | Backdrop click handler |
| `disableRestoreFocus` | `boolean` | `false` | Restore focus after close |
| `keepMounted` | `boolean` | `false` | Keep in DOM when closed |
| `PaperProps` | `object` | - | Props passed to Paper component |
| `BackdropProps` | `object` | - | Props passed to Backdrop |
| `component` | `string \| React.ElementType` | `'div'` | Root element |
| `sx` | `object` | - | System styling |

### Dialog Composition

**DialogTitle**: Header section (always visible in scroll="paper" mode)

**DialogContent**: Main content area (scrolls in scroll="paper" mode)

**DialogActions**: Bottom action buttons (always visible in scroll="paper" mode)

```jsx
<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
  <DialogTitle>Confirm Action</DialogTitle>
  <DialogContent>
    <DialogContentText>
      Are you sure you want to proceed?
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleConfirm} variant="contained">Confirm</Button>
  </DialogActions>
</Dialog>
```

### Scroll Behavior

**scroll="paper"** (default):
- Content scrolls within dialog paper
- DialogTitle always at top
- DialogActions always at bottom
- Only content scrolls

**scroll="body"**:
- Entire dialog scrolls within body
- Title and actions move off-screen
- Unusual UX but handles very long content
- Can interact with background while scrolling

**Common Issue**: When DialogContent/Actions nested in Form, layout breaks. Solution: `<form style={{ display: 'contents' }} />`

### Fullscreen & Responsive

**Responsive Fullscreen**:

```jsx
const fullScreen = useMediaQuery(theme.breakpoints.down('sm'));

<Dialog fullScreen={fullScreen} maxWidth="sm" fullWidth>
```

**Width Control**:

```jsx
<Dialog maxWidth="md" fullWidth>
  // Dialog expands to md breakpoint width
</Dialog>
```

### Form Dialog Pattern

```jsx
<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
  <DialogTitle>Create Item</DialogTitle>
  <DialogContent dividers>
    <TextField
      fullWidth
      label="Name"
      variant="outlined"
      margin="dense"
      value={formData.name}
      onChange={(e) => setFormData({...formData, name: e.target.value})}
    />
    <TextField
      fullWidth
      label="Description"
      multiline
      rows={4}
      variant="outlined"
      margin="dense"
      value={formData.description}
      onChange={(e) => setFormData({...formData, description: e.target.value})}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleCreate} variant="contained">Create</Button>
  </DialogActions>
</Dialog>
```

### Confirmation Dialog Pattern

```jsx
<Dialog open={openConfirm} onClose={() => setOpenConfirm(false)}>
  <DialogTitle>Delete Permanently?</DialogTitle>
  <DialogContent>
    <DialogContentText>
      This action cannot be undone.
    </DialogContentText>
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenConfirm(false)}>Cancel</Button>
    <Button onClick={handleDelete} color="error" variant="contained">
      Delete
    </Button>
  </DialogActions>
</Dialog>
```

### Accessibility Notes

- Dialog automatically manages focus (moves to content on open)
- Escape key closes dialog by default (disablable)
- Backdrop click closes dialog by default
- aria-labelledby should connect to DialogTitle id
- DialogContentText for descriptive content

### Common Pitfalls

- **Scroll="body" with Forms**: Breaks layout; use `display: 'contents'` on form
- **Nested Dialogs**: Scroll behavior breaks with nested dialogs
- **MaxWidth vs FullWidth**: Need both for responsive width control
- **Transition Timing**: Default Fade may feel slow for instant UX

---

## 4. MODAL COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls visibility |
| `onClose` | `(event, reason) => void` | - | Callback when close requested |
| `children` | `React.ReactNode` | - | Modal content |
| `disableEscapeKeyDown` | `boolean` | `false` | Disable Escape key close |
| `disableAutoFocus` | `boolean` | `false` | Don't shift focus to modal |
| `disableEnforceFocus` | `boolean` | `false` | Allow focus to leave modal |
| `disableRestoreFocus` | `boolean` | `false` | Don't restore previous focus |
| `disableScrollLock` | `boolean` | `false` | Don't lock body scroll |
| `hideBackdrop` | `boolean` | `false` | Hide backdrop overlay |
| `BackdropComponent` | `React.ComponentType` | `Backdrop` | Custom backdrop |
| `BackdropProps` | `object` | - | Props for backdrop |
| `keepMounted` | `boolean` | `false` | Keep in DOM when closed |
| `onBackdropClick` | `() => void` | - | Backdrop click handler |
| `component` | `string \| React.ElementType` | `'div'` | Root element |
| `components` | `object` | - | Slot components |
| `componentsProps` | `object` | - | Slot props |
| `container` | `HTMLElement` | `document.body` | Mount container |
| `sx` | `object` | - | System styling |

### Focus Trap Behavior

Modal automatically manages focus:
- Moves focus to modal content on open
- Keeps focus within modal (TrapFocus wrapper)
- Restricts keyboard navigation to modal
- Restores focus to previously focused element on close

**Focus Props Control**:

```jsx
<Modal
  open={open}
  onClose={handleClose}
  disableAutoFocus={true}        // Don't auto-focus modal
  disableEnforceFocus={true}     // Allow focus to escape
  disableRestoreFocus={true}     // Don't restore previous focus
>
  {/* Content */}
</Modal>
```

### Backdrop Configuration

**Default Backdrop**: Semi-transparent dark overlay (click closes modal)

**Custom Backdrop**:

```jsx
<Modal
  open={open}
  onClose={handleClose}
  BackdropComponent={Backdrop}
  BackdropProps={{
    timeout: 500,
    sx: { backgroundColor: 'rgba(0, 0, 0, 0.5)' }
  }}
>
  {/* Content */}
</Modal>
```

**Hide Backdrop**:

```jsx
<Modal open={open} onClose={handleClose} hideBackdrop>
```

### Transition & Animation

Modal supports react-transition-group transitions:

```jsx
<Modal open={open} onClose={handleClose}>
  <Grow in={open} timeout={300}>
    <Box
      sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        bgcolor: 'background.paper',
        p: 4
      }}
    >
      Modal Content
    </Box>
  </Grow>
</Modal>
```

### KeepMounted Behavior

**keepMounted={false}** (default):
- Modal removed from DOM when closed
- Lighter DOM when many modals exist
- Transition plays on every open/close

**keepMounted={true}**:
- Modal stays in DOM, visibility controlled by `display: none`
- Better performance for frequently toggled modals
- Preserves component state between open/close

```jsx
<Modal open={open} onClose={handleClose} keepMounted>
  {/* Component preserves state even when visually closed */}
</Modal>
```

### Close Behavior Configuration

```jsx
<Modal
  open={open}
  onClose={handleClose}
  disableEscapeKeyDown={false}   // Default: Escape closes
  onBackdropClick={handleClose}  // Default: Click backdrop closes
>
```

### Scroll Lock Behavior

By default, Modal locks body scroll to prevent scrolling behind overlay. Disable with:

```jsx
<Modal open={open} onClose={handleClose} disableScrollLock>
```

### Accessibility Notes

- TrapFocus component manages keyboard navigation
- Focus automatically moves to modal content
- Escape key closes by default
- Screen readers can navigate within modal
- Backdrop has role="presentation"

### Common Pitfalls

- **keepMounted Performance**: Keeping many modals mounted can degrade performance
- **Focus Management**: disableAutoFocus breaks expected UX for users
- **Escape Key**: Many users expect Escape to close; disable only when necessary
- **Backdrop Click**: Consider UX when disabling backdrop click closure

### Difference: Modal vs Dialog

- **Modal**: Low-level, minimal structure, full customization control
- **Dialog**: High-level wrapper, includes DialogTitle/Content/Actions helpers
- Use Modal for custom overlays, Dialog for standard dialogs

---

## 5. SNACKBAR COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Controls visibility |
| `autoHideDuration` | `number \| null` | `null` | Auto-close delay (ms) |
| `onClose` | `(event, reason) => void` | - | Close callback |
| `message` | `React.ReactNode` | - | Message content |
| `action` | `React.ReactNode` | - | Action button/element |
| `anchorOrigin` | `{ vertical, horizontal }` | `{ vertical: 'bottom', horizontal: 'left' }` | Screen position |
| `TransitionComponent` | `React.ComponentType` | `Grow` | Animation component |
| `TransitionProps` | `object` | - | Props for transition |
| `disableWindowBlurListener` | `boolean` | `false` | Auto-hide on blur |
| `resumeHideDuration` | `number` | `1000` | Resume hide after focus |
| `ClickAwayListenerProps` | `object` | - | Props for click away listener |
| `ContentProps` | `object` | - | Props for content wrapper |
| `sx` | `object` | - | System styling |

### Positioning Configuration

**anchorOrigin Prop**: Controls screen position

```jsx
<Snackbar
  open={open}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert severity="success">Saved successfully!</Alert>
</Snackbar>
```

**Common Positions**:
- Bottom-left (default): `{ vertical: 'bottom', horizontal: 'left' }`
- Bottom-right: `{ vertical: 'bottom', horizontal: 'right' }`
- Bottom-center: `{ vertical: 'bottom', horizontal: 'center' }`
- Top-left: `{ vertical: 'top', horizontal: 'left' }`
- Top-right: `{ vertical: 'top', horizontal: 'right' }`
- Top-center: `{ vertical: 'top', horizontal: 'center' }`

### Auto-Hide Duration

```jsx
<Snackbar
  open={open}
  autoHideDuration={3000}  // Close after 3 seconds
  onClose={handleClose}
>
  <Alert severity="info">Processing...</Alert>
</Snackbar>
```

**Recommendations**: Provide 4-6 seconds for users to read and potentially interact. Set to null to disable auto-close.

### Transition Types

**Default (Grow)**:

```jsx
<Snackbar open={open} onClose={handleClose}>
  {/* Grows from bottom */}
</Snackbar>
```

**Slide Transition**:

```jsx
<Snackbar
  open={open}
  onClose={handleClose}
  TransitionComponent={Slide}
  TransitionProps={{ direction: 'up' }}
>
  {/* Slides up */}
</Snackbar>
```

**Fade Transition**:

```jsx
<Snackbar
  open={open}
  onClose={handleClose}
  TransitionComponent={Fade}
>
  {/* Fades in */}
</Snackbar>
```

### Consecutive Snackbar Handling

**Problem**: Multiple snackbars stack or overlap when rendered simultaneously.

**Solution**: Manage a queue of messages:

```jsx
const [snackPack, setSnackPack] = useState([]);
const [open, setOpen] = useState(false);
const [messageInfo, setMessageInfo] = useState(undefined);

const handleAddAlert = (message) => {
  setSnackPack((prev) => [...prev, { message, key: new Date().getTime() }]);
};

const handleClose = (event, reason) => {
  if (reason === 'clickaway') return;
  setOpen(false);
};

const handleExited = () => {
  setSnackPack((prev) => prev.slice(1));
  setOpen(snackPack.length > 1);
};

useEffect(() => {
  if (snackPack.length && !messageInfo) {
    setMessageInfo({ ...snackPack[0] });
    setOpen(true);
  } else if (snackPack.length && messageInfo && open) {
    // Already showing one
  }
}, [snackPack, messageInfo, open]);

return (
  <>
    <Snackbar
      key={messageInfo?.key}
      open={open}
      autoHideDuration={3000}
      onClose={handleClose}
      onExited={handleExited}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity="success">{messageInfo?.message}</Alert>
    </Snackbar>
  </>
);
```

**Important**: Add the `key` prop to ensure independent treatment of each message. Without it, messages update-in-place and autoHideDuration may be canceled.

### Action Buttons

```jsx
const action = (
  <Button color="secondary" size="small" onClick={handleUndo}>
    Undo
  </Button>
);

<Snackbar
  open={open}
  autoHideDuration={3000}
  onClose={handleClose}
  message="Item deleted"
  action={action}
/>
```

### Combined with Alert Component

**Best Practice Pattern**:

```jsx
<Snackbar
  open={open}
  autoHideDuration={4000}
  onClose={handleClose}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert onClose={handleClose} severity="success" sx={{ width: '100%' }}>
    Changes saved successfully!
  </Alert>
</Snackbar>
```

### Accessibility Notes

- Message should be clear and concise
- Action buttons should have clear labels
- Auto-hide duration allows users time to read
- aria-live="polite" on content for screen readers
- Avoid auto-closing critical messages

### Common Pitfalls

- **Stacking Multiple**: Without queue management, snackbars overlap
- **Key Prop Missing**: Consecutive snackbars update-in-place without it
- **Auto-hide Too Short**: Users can't read message in time
- **Auto-hide Disabled**: Messages persist, cluttering UI
- **No Action Button**: Users can't undo or take action on notification

---

## 6. CARD COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `raised` | `boolean` | `false` | Adds shadow elevation |
| `variant` | `'outlined' \| 'elevation'` | `'elevation'` | Style variant |
| `elevation` | `number` | `1` | Shadow depth (0-24) |
| `sx` | `object` | - | System styling |
| `className` | `string` | - | CSS class |
| `component` | `string \| React.ElementType` | `'div'` | Root element |

### Card Composition Pattern

Cards are composition-based. Combine only the components you need:

**Core Components**:
- **Card**: Container surface
- **CardContent**: Content padding + spacing
- **CardMedia**: Images, videos, icons
- **CardHeader**: Title, subtitle, avatar
- **CardActions**: Action buttons, links
- **CardActionArea**: Makes card/section clickable

```jsx
<Card>
  <CardHeader
    avatar={<Avatar>R</Avatar>}
    title="Recipe Card"
    subheader="September 14, 2024"
  />
  <CardMedia
    component="img"
    height="194"
    image="recipe.jpg"
    alt="Recipe"
  />
  <CardContent>
    <Typography variant="body2" color="text.secondary">
      This impressive dish combines freshly grilled ingredients...
    </Typography>
  </CardContent>
  <CardActions disableSpacing>
    <IconButton>
      <FavoriteIcon />
    </IconButton>
    <IconButton>
      <ShareIcon />
    </IconButton>
  </CardActions>
</Card>
```

### Elevation & Raised Variants

**Default (Elevation)**: Shadow depth controlled by `elevation` prop (0-24)

```jsx
<Card elevation={4}>
  {/* Medium elevation shadow */}
</Card>
```

**Raised**: Boolean for enhanced shadow (equivalent to elevation={8} or higher)

```jsx
<Card raised>
  {/* Prominent shadow elevation */}
</Card>
```

**Outlined Variant**: Border instead of shadow

```jsx
<Card variant="outlined">
  {/* Subtle border styling */}
</Card>
```

### Expandable Card Pattern

```jsx
const [expanded, setExpanded] = useState(false);

const handleExpandClick = () => {
  setExpanded(!expanded);
};

<Card>
  <CardHeader
    title="Card Title"
    action={
      <IconButton
        expand={expanded}
        onClick={handleExpandClick}
        sx={{
          transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 250ms cubic-bezier(0.4, 0, 0.2, 1)'
        }}
      >
        <ExpandMoreIcon />
      </IconButton>
    }
  />
  <CardContent>
    <Typography>Visible content</Typography>
  </CardContent>
  <Collapse in={expanded} timeout="auto" unmountOnExit>
    <CardContent>
      <Typography>Expanded content - hidden by default</Typography>
    </CardContent>
  </Collapse>
</Card>
```

### CardActionArea (Clickable Region)

Makes entire card or section act as single clickable target:

```jsx
<Card>
  <CardActionArea onClick={handleClick}>
    <CardMedia component="img" height="140" image="photo.jpg" />
    <CardContent>
      <Typography gutterBottom variant="h5">
        Clickable Card
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Entire card acts as button
      </Typography>
    </CardContent>
  </CardActionArea>
  <CardActions>
    <Button size="small">Learn More</Button>
  </CardActions>
</Card>
```

### CardMedia Usage

**Image**:

```jsx
<CardMedia
  component="img"
  height="140"
  image="photo.jpg"
  alt="Card image"
/>
```

**Video**:

```jsx
<CardMedia
  component="iframe"
  height="315"
  src="https://www.youtube.com/embed/video-id"
/>
```

**Custom Content**:

```jsx
<CardMedia sx={{ backgroundColor: '#f5f5f5', height: 200 }}>
  <Box sx={{ p: 2 }}>
    {/* Custom content instead of image */}
  </Box>
</CardMedia>
```

### CardHeader Features

```jsx
<CardHeader
  avatar={<Avatar aria-label="recipe">R</Avatar>}
  action={<IconButton><MoreVertIcon /></IconButton>}
  title="Title"
  subheader="September 14, 2024"
/>
```

### CardActions Spacing

```jsx
<CardActions>
  {/* Buttons automatically spaced */}
</CardActions>

<CardActions disableSpacing>
  {/* No automatic spacing */}
</CardActions>
```

### Accessibility Notes

- CardActionArea should have meaningful role (inherits button)
- CardMedia should have alt text if image
- Expandable cards should have aria-expanded
- Action buttons should have clear labels

### Common Pitfalls

- **Composition Over Props**: Card doesn't have a "simple" mode; build with components
- **CardActionArea Overuse**: Don't nest clickable elements inside
- **Elevation Consistency**: Match elevation across card collection
- **CardActions Width**: Buttons may wrap on mobile without proper sizing

---

## 7. LINK COMPONENT

### Core API Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `href` | `string` | - | URL destination |
| `underline` | `'always' \| 'hover' \| 'none'` | `'always'` | Underline behavior |
| `color` | `'primary' \| 'secondary' \| 'success' \| 'error' \| 'warning' \| 'info' \| 'inherit' \| 'textPrimary' \| 'textSecondary'` | `'primary'` | Text color |
| `variant` | `'inherit' \| 'body1' \| 'body2' \| 'button' \| 'caption' \| 'h1'-'h6' \| 'overline' \| 'subtitle1' \| 'subtitle2'` | `'inherit'` | Typography variant |
| `component` | `string \| React.ElementType` | `'a'` | Root element |
| `target` | `string` | - | Link target (`_blank`, `_self`, etc.) |
| `rel` | `string` | - | Link relationship (`noopener`, `noreferrer`) |
| `noWrap` | `boolean` | `false` | Prevent text wrapping |
| `sx` | `object` | - | System styling |

### Underline Behavior

**always** (default): Underline always visible

```jsx
<Link underline="always" href="/page">
  Link Text
</Link>
```

**hover**: Underline only on hover

```jsx
<Link underline="hover" href="/page">
  Link Text
</Link>
```

**none**: No underline

```jsx
<Link underline="none" href="/page">
  Link Text
</Link>
```

### target="_blank" & Security

When opening links in new tabs, always set rel prop for security:

```jsx
<Link
  href="https://external-site.com"
  target="_blank"
  rel="noopener noreferrer"
>
  External Link
</Link>
```

**Why**:
- `noopener` prevents new page accessing `window.opener`
- `noreferrer` prevents referrer information leaking
- Runs in separate process for security

### React Router Integration

Use `component` prop to integrate with React Router:

```jsx
import { Link as RouterLink } from 'react-router-dom';

<Link component={RouterLink} to="/dashboard">
  Dashboard
</Link>
```

**Note**: Router's Link uses `to` prop instead of `href`

### Next.js Integration

Use MUI Link with Next.js Link for client-side navigation:

```jsx
import NextLink from 'next/link';

<Link component={NextLink} href="/about">
  About
</Link>
```

### TanStack Router Integration

```jsx
import { Link as TanStackLink } from '@tanstack/react-router';

<Link component={TanStackLink} to="/about">
  About
</Link>
```

### Color Variants

```jsx
<Link color="primary" href="#">Primary</Link>
<Link color="secondary" href="#">Secondary</Link>
<Link color="success" href="#">Success</Link>
<Link color="error" href="#">Error</Link>
<Link color="warning" href="#">Warning</Link>
<Link color="info" href="#">Info</Link>
<Link color="inherit" href="#">Inherit</Link>
<Link color="textPrimary" href="#">Text Primary</Link>
<Link color="textSecondary" href="#">Text Secondary</Link>
```

### Typography Variant Integration

```jsx
<Link variant="h6" href="#">Heading Link</Link>
<Link variant="body1" href="#">Body Link</Link>
<Link variant="caption" href="#">Small Link</Link>
```

### Styling with sx

```jsx
<Link
  href="/page"
  sx={{
    fontSize: 14,
    fontWeight: 'bold',
    '&:hover': {
      textDecoration: 'underline',
      color: 'primary.dark'
    }
  }}
>
  Custom Link
</Link>
```

### Accessibility Notes

- Link must have meaningful text content
- `rel="noopener noreferrer"` required for target="_blank"
- Keyboard navigation automatically supported
- Color alone insufficient for conveying information (must have underline or context)
- External link icon helps users understand navigation

### Common Pitfalls

- **Missing rel on target="_blank"**: Security vulnerability
- **Color Accessibility**: Contrast ratio must meet WCAG standards
- **Router Integration**: Forgetting `component` prop loses routing benefits
- **Underline=none**: May reduce link discoverability

---

## 8. CSS BASELINE & SCOPED CSS BASELINE

### CssBaseline Component

**Purpose**: Applies global CSS reset and establishes foundational styling for entire application.

### Core Features

**Global Reset**:
- Sets `box-sizing: border-box` on all elements
- Normalizes margins and padding across browsers
- Resets form elements
- Removes default styles

**Body Styling**:
- Applies `theme.typography.body1` to `<body>` element
- Sets color from theme palette
- Configures font family and line height

**Typography Defaults**:
- Sets font-weight for `<b>` and `<strong>` to `theme.typography.fontWeightBold`
- Configures heading elements with theme typography
- Enables `-webkit-font-smoothing` for better Roboto display

**HTML & Body**:
```css
<html> {
  box-sizing: border-box;
  color-scheme: light;
}
<body> {
  margin: 0;
  color: theme.typography.body1.color;
  font-family: theme.typography.fontFamily;
  line-height: theme.typography.body1.lineHeight;
}
```

### Implementation

**Global Application**:

```jsx
import { CssBaseline } from '@mui/material';

function App() {
  return (
    <>
      <CssBaseline />
      {/* Application content */}
    </>
  );
}
```

### ScopedCssBaseline Component

**Purpose**: Apply reset only to children elements (useful for progressive migration).

### Key Difference

- **CssBaseline**: Global (affects entire page)
- **ScopedCssBaseline**: Scoped (affects only wrapped children)

### Use Cases

**Progressive Migration**:
```jsx
<ScopedCssBaseline>
  <NewComponentUsingMUI />
</ScopedCssBaseline>
{/* Old components outside still use old styles */}
```

**Multiple Theme Regions**:
```jsx
<ThemeProvider theme={theme1}>
  <ScopedCssBaseline>
    {/* Theme 1 region */}
  </ScopedCssBaseline>
</ThemeProvider>

<ThemeProvider theme={theme2}>
  <ScopedCssBaseline>
    {/* Theme 2 region */}
  </ScopedCssBaseline>
</ThemeProvider>
```

### Scoping Pattern

**Important**: Import ScopedCssBaseline first to avoid box-sizing conflicts:

```jsx
// Correct order
import { ScopedCssBaseline } from '@mui/material';
import YourComponent from './YourComponent';

<ScopedCssBaseline>
  <YourComponent />
</ScopedCssBaseline>
```

### Dark Mode Support

Both CssBaseline and ScopedCssBaseline support dark mode via `data-mui-color-scheme` attributes:

```jsx
<html data-mui-color-scheme="dark">
```

Automatically applies dark mode typography and colors when enabled.

### @layer CSS Technique

MUI uses `@layer` declarations to manage CSS cascade specificity without requiring wrapper components:

```css
@layer reset, components, utilities
```

This allows predictable cascading without specificity wars.

### Box-Sizing Configuration

All elements inherit box-sizing: border-box:

```css
*,
*::before,
*::after {
  box-sizing: inherit;
}
```

Prevents padding/border from exceeding declared width.

### Typography Reset

- **Headings**: `<h1>`-`<h6>` reset to normal weight and size
- **Paragraphs**: `<p>` margin reset to 0
- **Lists**: `<ol>`, `<ul>` reset to list-style: none
- **Body**: Sets `theme.typography.body1` defaults

### Accessibility Notes

- CssBaseline improves semantic HTML consistency
- Typography reset maintains readability hierarchy
- Color-scheme ensures dark mode readability
- Font smoothing improves text rendering quality

### Common Pitfalls

- **Multiple CssBaseline**: Only use once globally
- **ScopedCssBaseline Order**: Import first to avoid conflicts
- **Inheritance Issues**: Some legacy CSS may conflict with reset
- **Custom Resets**: Avoid adding custom resets that override CssBaseline

### Reset Behavior Details

**Removed**:
- Default button styles
- Default input styles
- Default list styles
- Margin on elements like `<h1>`, `<p>`

**Normalized**:
- Form elements (`input`, `select`, `textarea`)
- Line height consistency
- Font size consistency
- Color inheritance

---

## COMMON PATTERNS & BEST PRACTICES

### Form Pattern with Validation

```jsx
import { TextField, Button, Box, Alert } from '@mui/material';
import { useState } from 'react';

function ContactForm() {
  const [formData, setFormData] = useState({ email: '', message: '' });
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};

    if (!formData.email.includes('@')) {
      newErrors.email = 'Invalid email';
    }
    if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
    }

    if (Object.keys(newErrors).length === 0) {
      setSuccess(true);
      setFormData({ email: '', message: '' });
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ maxWidth: 500, mx: 'auto' }}>
      {success && (
        <Alert severity="success" onClose={() => setSuccess(false)}>
          Message sent successfully!
        </Alert>
      )}

      <TextField
        fullWidth
        label="Email"
        name="email"
        type="email"
        value={formData.email}
        onChange={handleChange}
        error={!!errors.email}
        helperText={errors.email}
        margin="normal"
      />

      <TextField
        fullWidth
        label="Message"
        name="message"
        multiline
        rows={4}
        value={formData.message}
        onChange={handleChange}
        error={!!errors.message}
        helperText={errors.message}
        margin="normal"
      />

      <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }}>
        Send Message
      </Button>
    </Box>
  );
}
```

### Global Notification System

```jsx
import { Snackbar, Alert } from '@mui/material';
import { createContext, useState, useCallback } from 'react';

export const NotificationContext = createContext();

export function NotificationProvider({ children }) {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((message, severity = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, severity }]);
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      {notifications.map(notification => (
        <Snackbar
          key={notification.id}
          open={true}
          autoHideDuration={4000}
          onClose={() => removeNotification(notification.id)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert
            severity={notification.severity}
            onClose={() => removeNotification(notification.id)}
          >
            {notification.message}
          </Alert>
        </Snackbar>
      ))}
    </NotificationContext.Provider>
  );
}

// Usage
import { useContext } from 'react';

function MyComponent() {
  const { addNotification } = useContext(NotificationContext);

  const handleSave = () => {
    addNotification('Saved successfully!', 'success');
  };

  return <Button onClick={handleSave}>Save</Button>;
}
```

### Modal Dialog with Form

```jsx
<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
  <DialogTitle>Create New Item</DialogTitle>
  <DialogContent dividers>
    <TextField
      autoFocus
      fullWidth
      label="Item Name"
      type="text"
      variant="outlined"
      margin="dense"
      value={itemName}
      onChange={(e) => setItemName(e.target.value)}
    />
    <TextField
      fullWidth
      label="Description"
      multiline
      rows={4}
      variant="outlined"
      margin="dense"
      value={description}
      onChange={(e) => setDescription(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={handleClose}>Cancel</Button>
    <Button onClick={handleCreate} variant="contained">
      Create
    </Button>
  </DialogActions>
</Dialog>
```

### Responsive Card Grid

```jsx
import { Grid, Card, CardMedia, CardContent, Typography } from '@mui/material';

function CardGrid({ items }) {
  return (
    <Grid container spacing={2}>
      {items.map(item => (
        <Grid item xs={12} sm={6} md={4} key={item.id}>
          <Card>
            <CardMedia
              component="img"
              height="200"
              image={item.image}
              alt={item.title}
            />
            <CardContent>
              <Typography gutterBottom variant="h5">
                {item.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {item.description}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}
```

---

## INTEGRATION PATTERNS

### Form Library Integration

**React Hook Form**:

```jsx
import { useForm, Controller } from 'react-hook-form';
import { TextField, Button } from '@mui/material';

function FormWithHookForm() {
  const { control, handleSubmit } = useForm({
    defaultValues: { email: '', password: '' }
  });

  const onSubmit = (data) => console.log(data);

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Controller
        name="email"
        control={control}
        rules={{ required: 'Email is required' }}
        render={({ field, fieldState: { error } }) => (
          <TextField
            {...field}
            label="Email"
            error={!!error}
            helperText={error?.message}
            fullWidth
            margin="normal"
          />
        )}
      />
      <Button type="submit" variant="contained">Submit</Button>
    </form>
  );
}
```

### Custom Hook for Snackbar

```jsx
export function useSnackbar() {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState('info');

  const showSnackbar = (msg, sev = 'info') => {
    setMessage(msg);
    setSeverity(sev);
    setOpen(true);
  };

  const handleClose = (event, reason) => {
    if (reason === 'clickaway') return;
    setOpen(false);
  };

  const snackbar = (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={handleClose}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
    >
      <Alert severity={severity} onClose={handleClose}>
        {message}
      </Alert>
    </Snackbar>
  );

  return { showSnackbar, snackbar };
}
```

---

## ACCESSIBILITY COMPLIANCE

### WCAG 2.1 AA Checklist

**Button**:
- [ ] Has text label or aria-label
- [ ] Keyboard accessible (Tab, Enter, Space)
- [ ] Focus visible state
- [ ] Color not sole differentiator (disabled state clear)

**TextField**:
- [ ] Associated label (connected via htmlFor)
- [ ] Error messages associated (aria-describedby)
- [ ] Validation announced to screen readers
- [ ] Required status indicated

**Dialog**:
- [ ] Title associated (aria-labelledby)
- [ ] Focus managed (moves to dialog, trapped, restored)
- [ ] Escape key closes
- [ ] Background doesn't scroll

**Snackbar**:
- [ ] Aria-live="polite" for announcement
- [ ] Sufficient time to read (4-6 seconds)
- [ ] Action buttons keyboard accessible
- [ ] Contrast ratio >= 4.5:1 for normal text

**Link**:
- [ ] Underline or other visual indicator
- [ ] Meaningful link text (not "click here")
- [ ] Color contrast >= 4.5:1
- [ ] rel="noopener noreferrer" for target="_blank"

---

## KEY TAKEAWAYS

1. **Composition Over Props**: Cards, Dialogs, and Modals use composition patterns
2. **Variant System**: Most components support variant, size, color props
3. **Form Integration**: TextField integrates with form libraries and state management
4. **Focus Management**: Modal and Dialog automatically handle focus, Snackbar requires manual queue
5. **Responsive Design**: Components support sx prop for system styling and responsive values
6. **Accessibility Built-In**: All components include WCAG-compliant focus, keyboard, and screen reader support
7. **Dark Mode**: Components automatically adapt via data-mui-color-scheme
8. **Router Integration**: Link supports custom components for routing libraries
9. **TypeScript**: All props fully typed in @mui/material package

---

## RESOURCES

[Button API - Material UI](https://mui.com/material-ui/api/button/)
[TextField API - Material UI](https://mui.com/material-ui/api/text-field/)
[Dialog API - Material UI](https://mui.com/material-ui/api/dialog/)
[Modal API - Material UI](https://mui.com/material-ui/api/modal/)
[Snackbar API - Material UI](https://mui.com/material-ui/api/snackbar/)
[Card API - Material UI](https://mui.com/material-ui/api/card/)
[Link API - Material UI](https://mui.com/material-ui/api/link/)
[CSS Baseline - Material UI](https://mui.com/material-ui/react-css-baseline/)
[React Text Field - Material UI](https://mui.com/material-ui/react-text-field/)
[React Dialog - Material UI](https://mui.com/material-ui/react-dialog/)
[React Modal - Material UI](https://mui.com/material-ui/react-modal/)
[React Snackbar - Material UI](https://mui.com/material-ui/react-snackbar/)
[React Card - Material UI](https://mui.com/material-ui/react-card/)
[React Link - Material UI](https://mui.com/material-ui/react-link/)
[InputAdornment API - Material UI](https://mui.com/material-ui/api/input-adornment/)
[ButtonGroup API - Material UI](https://mui.com/material-ui/api/button-group/)
[Routing Libraries - Material UI](https://mui.com/material-ui/integrations/routing/)

