---
name: animations-transitions
description: MUI transition components (Fade, Grow, Slide, Collapse, Zoom), custom transitions, TransitionGroup, and Framer Motion integration
triggers:
  - animation
  - transition
  - Fade
  - Grow
  - Slide
  - Collapse
  - Zoom
  - TransitionGroup
  - Framer Motion
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

# MUI Animations & Transitions

## 1. Built-in Transition Components

MUI provides five transition components built on top of `react-transition-group`. Each wraps a single child element and controls its enter/exit animation based on the `in` prop.

### Fade

Opacity transition from transparent to opaque.

```tsx
import { Fade, Box, Button } from '@mui/material';
import { useState } from 'react';

function FadeExample() {
  const [visible, setVisible] = useState(false);

  return (
    <>
      <Button onClick={() => setVisible((v) => !v)}>Toggle</Button>
      <Fade in={visible} timeout={300}>
        <Box sx={{ p: 2, bgcolor: 'primary.main', color: 'white' }}>
          Fading content
        </Box>
      </Fade>
    </>
  );
}
```

**Key props:**

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `in` | `boolean` | `false` | Controls visibility |
| `timeout` | `number \| { enter, exit }` | `300` | Duration in ms |
| `appear` | `boolean` | `true` | Animate on initial mount when `in` is true |
| `unmountOnExit` | `boolean` | `false` | Remove DOM node when exited |
| `mountOnEnter` | `boolean` | `false` | Defer first mount until `in` is true |

### Grow

Combined scale and opacity transition. The element grows from the center (or a custom origin) while fading in.

```tsx
import { Grow, Paper } from '@mui/material';

function GrowExample({ visible }: { visible: boolean }) {
  return (
    <Grow
      in={visible}
      timeout={500}
      style={{ transformOrigin: '0 0 0' }}
      {...(visible ? { timeout: 1000 } : {})}
    >
      <Paper elevation={4} sx={{ p: 3, width: 200 }}>
        Growing content
      </Paper>
    </Grow>
  );
}
```

**Custom transform origin:**

```tsx
<Grow in={open} style={{ transformOrigin: 'center top' }}>
  <MenuContent />
</Grow>
```

### Slide

Directional slide transition. The element slides in from an edge of the screen or a container.

```tsx
import { Slide, Paper } from '@mui/material';
import { useRef } from 'react';

function SlideExample({ visible }: { visible: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  return (
    <Box ref={containerRef} sx={{ overflow: 'hidden', height: 200 }}>
      <Slide
        direction="up"
        in={visible}
        container={containerRef.current}
        timeout={{ enter: 400, exit: 200 }}
      >
        <Paper sx={{ p: 2 }}>Slides up into view</Paper>
      </Slide>
    </Box>
  );
}
```

**`direction` values:** `'up'` | `'down'` | `'left'` | `'right'`

When `container` is provided, the element slides relative to that container instead of the viewport.

### Collapse

Height (or width) animation that expands/collapses content.

```tsx
import { Collapse, List, ListItem, ListItemText, Button, Box } from '@mui/material';

function CollapseExample() {
  const [expanded, setExpanded] = useState(false);

  return (
    <Box>
      <Button onClick={() => setExpanded((e) => !e)}>
        {expanded ? 'Collapse' : 'Expand'}
      </Button>
      <Collapse in={expanded} timeout="auto" unmountOnExit>
        <List>
          <ListItem><ListItemText primary="Item 1" /></ListItem>
          <ListItem><ListItemText primary="Item 2" /></ListItem>
          <ListItem><ListItemText primary="Item 3" /></ListItem>
        </List>
      </Collapse>
    </Box>
  );
}
```

**Horizontal collapse:**

```tsx
<Collapse in={open} orientation="horizontal" collapsedSize={40}>
  <Sidebar />
</Collapse>
```

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `collapsedSize` | `number \| string` | `'0px'` | Minimum size when collapsed (e.g., `40` to keep a peek visible) |
| `orientation` | `'vertical' \| 'horizontal'` | `'vertical'` | Direction of collapse |
| `timeout` | `number \| 'auto'` | `duration.standard` | `'auto'` calculates duration from height |

### Zoom

Scale transition from the center of the child element.

```tsx
import { Zoom, Fab, AddIcon } from '@mui/material';

function ZoomFab({ visible }: { visible: boolean }) {
  return (
    <Zoom in={visible} timeout={200} unmountOnExit>
      <Fab color="primary" sx={{ position: 'fixed', bottom: 16, right: 16 }}>
        <AddIcon />
      </Fab>
    </Zoom>
  );
}
```

---

## 2. Usage Patterns

### Basic Pattern

```tsx
<Fade in={visible} timeout={300}>
  <Box>Content</Box>
</Fade>
```

### Ref Forwarding for Custom Components

MUI transition components pass a `ref` to their child. If the child is a custom component, it must forward the ref:

```tsx
import { forwardRef } from 'react';
import { Fade, FadeProps } from '@mui/material';

// Custom component that forwards ref
const CustomCard = forwardRef<HTMLDivElement, { title: string }>(
  function CustomCard({ title, ...props }, ref) {
    return (
      <div ref={ref} {...props}>
        <h3>{title}</h3>
      </div>
    );
  }
);

// Usage inside a transition
function AnimatedCard({ visible }: { visible: boolean }) {
  return (
    <Fade in={visible}>
      <CustomCard title="Hello" />
    </Fade>
  );
}
```

Without `forwardRef`, the transition will not work and React will warn about refs on function components.

### Conditional Rendering vs Visibility Toggle

**Visibility toggle** (keeps DOM node, hides with CSS):

```tsx
<Fade in={visible}>
  <Box>Always in DOM, opacity changes</Box>
</Fade>
```

**Conditional rendering** (removes DOM node on exit):

```tsx
<Fade in={visible} unmountOnExit mountOnEnter>
  <Box>Removed from DOM when hidden</Box>
</Fade>
```

Use `unmountOnExit` when:
- The hidden content is expensive (heavy components, iframes)
- You need to reset component state on re-entry
- You want to reduce DOM size for accessibility screen readers

Use visibility toggle when:
- You need instant re-show without remount cost
- The component maintains scroll position or form state

---

## 3. TransitionGroup -- Animating Lists

`TransitionGroup` from `react-transition-group` works with MUI transitions to animate items being added or removed from a list.

```tsx
import { TransitionGroup } from 'react-transition-group';
import {
  Collapse,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Button,
  Box,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import { useState } from 'react';

interface Item {
  id: number;
  name: string;
}

function AnimatedList() {
  const [items, setItems] = useState<Item[]>([
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Banana' },
    { id: 3, name: 'Cherry' },
  ]);

  const addItem = () => {
    const id = Date.now();
    setItems((prev) => [...prev, { id, name: `Item ${id}` }]);
  };

  const removeItem = (id: number) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  return (
    <Box>
      <Button onClick={addItem} variant="contained" sx={{ mb: 2 }}>
        Add Item
      </Button>
      <List>
        <TransitionGroup>
          {items.map((item) => (
            <Collapse key={item.id}>
              <ListItem
                secondaryAction={
                  <IconButton edge="end" onClick={() => removeItem(item.id)}>
                    <DeleteIcon />
                  </IconButton>
                }
              >
                <ListItemText primary={item.name} />
              </ListItem>
            </Collapse>
          ))}
        </TransitionGroup>
      </List>
    </Box>
  );
}
```

**Using Fade instead of Collapse for list items:**

```tsx
<TransitionGroup>
  {items.map((item) => (
    <Fade key={item.id} timeout={500}>
      <ListItem>
        <ListItemText primary={item.name} />
      </ListItem>
    </Fade>
  ))}
</TransitionGroup>
```

**Important:** Each child of `TransitionGroup` must have a unique `key`. The transition component (Collapse, Fade, etc.) should be the direct child of TransitionGroup, wrapping the actual content.

---

## 4. Custom Transitions

Create reusable transition components using the `Transition` component from `react-transition-group`.

### Using MUI's `styled` + Transition

```tsx
import { Transition, TransitionStatus } from 'react-transition-group';
import { forwardRef, useRef } from 'react';
import { Box, BoxProps } from '@mui/material';

interface SlideRotateProps extends Omit<BoxProps, 'ref'> {
  in: boolean;
  timeout?: number;
  children: React.ReactNode;
}

const SlideRotate = forwardRef<HTMLDivElement, SlideRotateProps>(
  function SlideRotate({ in: inProp, timeout = 400, children, ...boxProps }, ref) {
    const nodeRef = useRef<HTMLDivElement>(null);

    const styles: Record<TransitionStatus, React.CSSProperties> = {
      entering: { opacity: 1, transform: 'translateX(0) rotate(0deg)' },
      entered: { opacity: 1, transform: 'translateX(0) rotate(0deg)' },
      exiting: { opacity: 0, transform: 'translateX(-100%) rotate(-10deg)' },
      exited: { opacity: 0, transform: 'translateX(-100%) rotate(-10deg)' },
      unmounted: {},
    };

    return (
      <Transition in={inProp} timeout={timeout} nodeRef={nodeRef} unmountOnExit>
        {(state) => (
          <Box
            ref={nodeRef}
            {...boxProps}
            sx={{
              transition: `all ${timeout}ms ease-in-out`,
              ...styles[state],
              ...boxProps.sx,
            }}
          >
            {children}
          </Box>
        )}
      </Transition>
    );
  }
);

// Usage
function Demo() {
  const [show, setShow] = useState(true);
  return (
    <SlideRotate in={show} timeout={500}>
      <Paper sx={{ p: 2 }}>Custom transition!</Paper>
    </SlideRotate>
  );
}
```

### Wrapping MUI Transitions for Reuse

```tsx
import { Slide, SlideProps } from '@mui/material';

// A preset "slide from right" transition component
function SlideFromRight(props: Omit<SlideProps, 'direction'>) {
  return <Slide direction="left" {...props} />;
}

// A combined Fade + Slide transition
function FadeSlideUp({
  in: inProp,
  children,
  timeout = 400,
}: {
  in: boolean;
  children: React.ReactElement;
  timeout?: number;
}) {
  return (
    <Fade in={inProp} timeout={timeout}>
      <div>
        <Slide in={inProp} direction="up" timeout={timeout}>
          {children}
        </Slide>
      </div>
    </Fade>
  );
}
```

---

## 5. Theme Transitions

MUI's theme provides a `transitions` object for consistent timing across the application.

### theme.transitions.create()

Generates a CSS transition string from property names and options:

```tsx
import { Box, useTheme } from '@mui/material';

function ThemedTransition() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        width: 100,
        height: 100,
        bgcolor: 'primary.main',
        transition: theme.transitions.create(['transform', 'opacity'], {
          duration: theme.transitions.duration.standard,
          easing: theme.transitions.easing.easeInOut,
        }),
        '&:hover': {
          transform: 'scale(1.1)',
          opacity: 0.8,
        },
      }}
    />
  );
}
```

### Using the Theme Callback in `sx`

```tsx
<Box
  sx={{
    transition: (theme) =>
      theme.transitions.create(['background-color', 'box-shadow'], {
        duration: theme.transitions.duration.short,
      }),
    '&:hover': {
      bgcolor: 'action.hover',
      boxShadow: 4,
    },
  }}
/>
```

### Available Duration Constants

| Constant | Value | Use case |
|----------|-------|----------|
| `shortest` | 150ms | Small UI feedback (ripple) |
| `shorter` | 200ms | Quick toggles |
| `short` | 250ms | Standard interactions |
| `standard` | 300ms | Default for most transitions |
| `complex` | 375ms | Multi-property changes |
| `enteringScreen` | 225ms | Elements entering viewport |
| `leavingScreen` | 195ms | Elements leaving viewport |

### Available Easing Constants

| Constant | Value | Use case |
|----------|-------|----------|
| `easeInOut` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard transitions |
| `easeOut` | `cubic-bezier(0.0, 0, 0.2, 1)` | Elements entering screen |
| `easeIn` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving screen |
| `sharp` | `cubic-bezier(0.4, 0, 0.6, 1)` | Elements that may return |

### Customizing Theme Transitions

```tsx
import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  transitions: {
    duration: {
      shortest: 100,
      shorter: 150,
      short: 200,
      standard: 250,
      complex: 300,
      enteringScreen: 200,
      leavingScreen: 150,
    },
    easing: {
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
      easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      sharp: 'cubic-bezier(0.4, 0, 0.6, 1)',
      // Custom easing:
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
    },
  },
});
```

---

## 6. sx-based CSS Transitions and Keyframes

### Hover Transitions with sx

```tsx
<Button
  sx={{
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: 6,
    },
    '&:active': {
      transform: 'translateY(0)',
      boxShadow: 2,
    },
  }}
>
  Animated Button
</Button>
```

### Keyframe Animations with @keyframes

```tsx
import { keyframes } from '@mui/system';
import { Box } from '@mui/material';

const pulse = keyframes`
  0% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0.4);
  }
  70% {
    transform: scale(1.05);
    box-shadow: 0 0 0 10px rgba(25, 118, 210, 0);
  }
  100% {
    transform: scale(1);
    box-shadow: 0 0 0 0 rgba(25, 118, 210, 0);
  }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const shimmer = keyframes`
  0% { background-position: -200% 0; }
  100% { background-position: 200% 0; }
`;

function KeyframeExamples() {
  return (
    <>
      {/* Pulsing notification badge */}
      <Box
        sx={{
          width: 12,
          height: 12,
          borderRadius: '50%',
          bgcolor: 'error.main',
          animation: `${pulse} 2s infinite`,
        }}
      />

      {/* Spinning loader */}
      <Box
        sx={{
          width: 40,
          height: 40,
          border: '3px solid',
          borderColor: 'grey.300',
          borderTopColor: 'primary.main',
          borderRadius: '50%',
          animation: `${spin} 1s linear infinite`,
        }}
      />

      {/* Shimmer loading placeholder */}
      <Box
        sx={{
          width: '100%',
          height: 20,
          borderRadius: 1,
          background: (theme) =>
            `linear-gradient(90deg, ${theme.palette.grey[200]} 25%, ${theme.palette.grey[100]} 50%, ${theme.palette.grey[200]} 75%)`,
          backgroundSize: '200% 100%',
          animation: `${shimmer} 1.5s ease-in-out infinite`,
        }}
      />
    </>
  );
}
```

### Combining Keyframes with Theme

```tsx
const fadeInUp = keyframes`
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

<Card
  sx={{
    animation: `${fadeInUp} 0.5s ease-out`,
    animationFillMode: 'both',
    animationDelay: '0.1s',
  }}
/>
```

### Staggered Animations

```tsx
function StaggeredList({ items }: { items: string[] }) {
  return (
    <List>
      {items.map((item, index) => (
        <ListItem
          key={item}
          sx={{
            animation: `${fadeInUp} 0.4s ease-out both`,
            animationDelay: `${index * 0.05}s`,
          }}
        >
          <ListItemText primary={item} />
        </ListItem>
      ))}
    </List>
  );
}
```

---

## 7. Framer Motion Integration

Framer Motion provides more advanced animation capabilities that work well alongside MUI components.

### Install

```bash
npm install framer-motion
```

### AnimatePresence with MUI Dialog

```tsx
import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';

const MotionDialogContent = motion.create(DialogContent);

function AnimatedDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          PaperProps={{
            component: motion.div,
            initial: { opacity: 0, scale: 0.9, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.9, y: 20 },
            transition: { duration: 0.3, ease: 'easeOut' },
          }}
        >
          <DialogTitle>Animated Dialog</DialogTitle>
          <MotionDialogContent
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            Content appears with a slight delay after the dialog scales in.
          </MotionDialogContent>
          <DialogActions>
            <Button onClick={onClose}>Close</Button>
          </DialogActions>
        </Dialog>
      )}
    </AnimatePresence>
  );
}
```

### Layout Animations with MUI Components

```tsx
import { motion, LayoutGroup } from 'framer-motion';
import { Card, CardContent, Typography, Grid, Box } from '@mui/material';

const MotionCard = motion.create(Card);

function LayoutAnimationGrid({ items }: { items: Item[] }) {
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <LayoutGroup>
      <Grid container spacing={2}>
        {items.map((item) => (
          <Grid size={{ xs: 12, sm: selected === item.id ? 12 : 6 }} key={item.id}>
            <MotionCard
              layout
              layoutId={item.id}
              onClick={() =>
                setSelected(selected === item.id ? null : item.id)
              }
              sx={{ cursor: 'pointer' }}
              transition={{ duration: 0.4, ease: 'easeInOut' }}
            >
              <CardContent>
                <Typography variant="h6">{item.title}</Typography>
                <AnimatePresence>
                  {selected === item.id && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                    >
                      <Typography>{item.description}</Typography>
                    </motion.div>
                  )}
                </AnimatePresence>
              </CardContent>
            </MotionCard>
          </Grid>
        ))}
      </Grid>
    </LayoutGroup>
  );
}
```

### Animated List with AnimatePresence

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import { List, ListItem, ListItemText, IconButton } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';

const MotionListItem = motion.create(ListItem);

function MotionList({ items, onRemove }: { items: Item[]; onRemove: (id: string) => void }) {
  return (
    <List>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <MotionListItem
            key={item.id}
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 50, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3 }}
            secondaryAction={
              <IconButton onClick={() => onRemove(item.id)}>
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemText primary={item.name} />
          </MotionListItem>
        ))}
      </AnimatePresence>
    </List>
  );
}
```

### Shared Layout Animations (Tabs)

```tsx
import { motion } from 'framer-motion';
import { Tabs, Tab, Box } from '@mui/material';

function AnimatedTabs() {
  const [tab, setTab] = useState(0);
  const tabs = ['Overview', 'Details', 'Settings'];

  return (
    <Box>
      <Box sx={{ display: 'flex', gap: 1, position: 'relative' }}>
        {tabs.map((label, i) => (
          <Box
            key={label}
            onClick={() => setTab(i)}
            sx={{
              px: 2,
              py: 1,
              cursor: 'pointer',
              position: 'relative',
              zIndex: 1,
              color: tab === i ? 'primary.contrastText' : 'text.primary',
              transition: 'color 0.3s',
            }}
          >
            {tab === i && (
              <motion.div
                layoutId="activeTab"
                style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 8,
                  background: '#1976d2',
                  zIndex: -1,
                }}
                transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              />
            )}
            {label}
          </Box>
        ))}
      </Box>
    </Box>
  );
}
```

---

## 8. Component-Specific Transitions

### Dialog Enter/Exit

Override the default Dialog transition:

```tsx
import { Dialog, Slide } from '@mui/material';
import { TransitionProps } from '@mui/material/transitions';
import { forwardRef } from 'react';

const SlideUpTransition = forwardRef(function SlideUpTransition(
  props: TransitionProps & { children: React.ReactElement },
  ref: React.Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

// Full-screen dialog with slide-up entrance
<Dialog
  open={open}
  onClose={handleClose}
  fullScreen
  TransitionComponent={SlideUpTransition}
>
  {/* ... */}
</Dialog>
```

### Drawer Slide

Drawers use Slide internally. Customize via `SlideProps`:

```tsx
<Drawer
  open={open}
  onClose={handleClose}
  anchor="right"
  SlideProps={{
    timeout: { enter: 400, exit: 300 },
    easing: {
      enter: 'cubic-bezier(0.0, 0, 0.2, 1)',
      exit: 'cubic-bezier(0.4, 0, 1, 1)',
    },
  }}
>
  <DrawerContent />
</Drawer>
```

### Snackbar Transitions

```tsx
import { Snackbar, Slide, Grow, Fade } from '@mui/material';

// Slide from top
function SlideDown(props: TransitionProps) {
  return <Slide {...props} direction="down" />;
}

<Snackbar
  open={open}
  onClose={handleClose}
  TransitionComponent={SlideDown}
  autoHideDuration={3000}
  anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
  message="Notification"
/>

// Grow from the anchor
<Snackbar
  open={open}
  TransitionComponent={Grow}
  message="Growing notification"
/>
```

### Menu and Popover Transitions

```tsx
import { Menu, MenuItem, Fade, Zoom } from '@mui/material';

// Fade menu instead of default Grow
<Menu
  open={open}
  anchorEl={anchorEl}
  onClose={handleClose}
  TransitionComponent={Fade}
  transitionDuration={200}
>
  <MenuItem>Option 1</MenuItem>
  <MenuItem>Option 2</MenuItem>
</Menu>

// Zoom popover
<Popover
  open={open}
  anchorEl={anchorEl}
  TransitionComponent={Zoom}
  transitionDuration={{ enter: 300, exit: 150 }}
>
  <Box sx={{ p: 2 }}>Popover content</Box>
</Popover>
```

### Accordion Collapse

Accordion uses Collapse internally. Customize via `TransitionProps` and `TransitionComponent`:

```tsx
import { Accordion, AccordionSummary, AccordionDetails, Fade } from '@mui/material';

<Accordion
  TransitionProps={{ unmountOnExit: true }}
  slotProps={{
    transition: {
      timeout: 500,
    },
  }}
>
  <AccordionSummary expandIcon={<ExpandMoreIcon />}>
    <Typography>Section Title</Typography>
  </AccordionSummary>
  <AccordionDetails>
    <Typography>Lazy-mounted content that unmounts on collapse.</Typography>
  </AccordionDetails>
</Accordion>
```

### Skeleton Pulse Customization

Override the default pulse animation of Skeleton:

```tsx
import { Skeleton, keyframes } from '@mui/material';

const customPulse = keyframes`
  0% { opacity: 1; }
  50% { opacity: 0.3; }
  100% { opacity: 1; }
`;

<Skeleton
  variant="rectangular"
  width={210}
  height={118}
  sx={{
    animation: `${customPulse} 2s ease-in-out infinite`,
    bgcolor: 'grey.200',
  }}
/>

// Wave animation variant
<Skeleton variant="text" animation="wave" />

// Disable animation
<Skeleton variant="circular" width={40} height={40} animation={false} />
```

---

## 9. Performance Tips

### Use GPU-Accelerated Properties

Only animate `transform` and `opacity` for smooth 60fps animations. These properties do not trigger layout or paint:

```tsx
// GOOD: GPU-accelerated
sx={{
  transition: 'transform 0.3s, opacity 0.3s',
  '&:hover': {
    transform: 'translateY(-4px) scale(1.02)',
    opacity: 0.9,
  },
}}

// BAD: Triggers layout recalculation
sx={{
  transition: 'width 0.3s, height 0.3s, margin 0.3s',
  '&:hover': {
    width: 300,     // layout thrash
    height: 200,    // layout thrash
    marginTop: 10,  // layout thrash
  },
}}
```

### will-change Hint

Tell the browser to prepare for upcoming animations:

```tsx
<Box
  sx={{
    willChange: 'transform, opacity',
    transition: (theme) =>
      theme.transitions.create(['transform', 'opacity'], {
        duration: theme.transitions.duration.standard,
      }),
    '&:hover': {
      transform: 'scale(1.05)',
    },
  }}
/>
```

**Important:** Only apply `will-change` to elements that will actually animate. Overuse wastes GPU memory. Remove it after the animation completes for one-shot animations:

```tsx
function AnimateOnce({ children }: { children: React.ReactNode }) {
  const [animated, setAnimated] = useState(false);

  return (
    <Box
      sx={{
        willChange: animated ? 'auto' : 'transform',
        animation: `${fadeInUp} 0.5s ease-out both`,
      }}
      onAnimationEnd={() => setAnimated(true)}
    >
      {children}
    </Box>
  );
}
```

### Avoid Layout Thrash

Do not read layout properties (offsetHeight, getBoundingClientRect) in the middle of an animation frame. Batch reads before writes:

```tsx
// BAD: read-write-read-write causes forced reflows
elements.forEach((el) => {
  const height = el.offsetHeight; // read (forces layout)
  el.style.transform = `translateY(${height}px)`; // write
});

// GOOD: batch all reads, then all writes
const heights = elements.map((el) => el.offsetHeight);
elements.forEach((el, i) => {
  el.style.transform = `translateY(${heights[i]}px)`;
});
```

### Reduce Motion for Accessibility

Respect the user's `prefers-reduced-motion` setting:

```tsx
const prefersReducedMotion = keyframes`/* empty */`;

<Box
  sx={{
    animation: `${pulse} 2s infinite`,
    '@media (prefers-reduced-motion: reduce)': {
      animation: 'none',
    },
  }}
/>
```

Or globally via the theme:

```tsx
const theme = createTheme({
  transitions: {
    // Check user preference
    create: (props, options) => {
      if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        return 'none';
      }
      return createTheme().transitions.create(props, options);
    },
  },
});
```

### Transition Performance Checklist

- Animate only `transform` and `opacity` whenever possible
- Use `will-change` sparingly and only on elements about to animate
- Prefer `unmountOnExit` on heavy content behind transitions
- Use `timeout="auto"` on Collapse to get natural-feeling durations
- Set `appear={false}` to skip initial mount animations when not needed
- Use `requestAnimationFrame` for JavaScript-driven animations
- Respect `prefers-reduced-motion` for accessibility compliance
- Avoid animating `box-shadow` directly; use `::after` pseudo-element with opacity instead:

```tsx
<Box
  sx={{
    position: 'relative',
    '&::after': {
      content: '""',
      position: 'absolute',
      inset: 0,
      borderRadius: 'inherit',
      boxShadow: 6,
      opacity: 0,
      transition: 'opacity 0.3s',
    },
    '&:hover::after': {
      opacity: 1,
    },
  }}
/>
```
