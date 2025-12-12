---
description: Add Framer Motion or Chakra transitions to components
arguments:
  - name: component
    description: Component name or path to animate
    required: true
  - name: type
    description: Animation type (entrance|exit|hover|tap|scroll|gesture|layout)
    required: false
  - name: library
    description: Animation library (framer-motion|chakra|both)
    required: false
  - name: preset
    description: Animation preset (fade|slide|scale|rotate|bounce|spring)
    required: false
---

# Add Animation to Component

Enhance the specified component with smooth, accessible animations.

## Component: $ARGUMENTS.component

## Configuration
- **Animation Type**: ${ARGUMENTS.type || 'entrance'}
- **Library**: ${ARGUMENTS.library || 'framer-motion'}
- **Preset**: ${ARGUMENTS.preset || 'fade'}

## Instructions

### 1. Framer Motion Animations

#### Entrance Animations
```typescript
import { motion } from 'framer-motion';

const fadeIn = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};

const slideUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.3, ease: 'easeOut' }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 }
};
```

#### Hover & Tap Animations
```typescript
const interactiveVariants = {
  hover: { scale: 1.05, transition: { duration: 0.2 } },
  tap: { scale: 0.95 }
};

<motion.div
  whileHover="hover"
  whileTap="tap"
  variants={interactiveVariants}
>
  {children}
</motion.div>
```

#### Scroll Animations
```typescript
import { motion, useScroll, useTransform } from 'framer-motion';

const { scrollYProgress } = useScroll();
const opacity = useTransform(scrollYProgress, [0, 0.5], [0, 1]);
const y = useTransform(scrollYProgress, [0, 0.5], [100, 0]);
```

#### Gesture Animations
```typescript
<motion.div
  drag
  dragConstraints={{ left: 0, right: 300, top: 0, bottom: 300 }}
  dragElastic={0.2}
  whileDrag={{ scale: 1.1 }}
>
  Draggable Element
</motion.div>
```

#### Layout Animations
```typescript
<motion.div layout layoutId="shared-element">
  {/* Content that animates during layout changes */}
</motion.div>
```

### 2. Chakra UI Transitions

#### Built-in Transitions
```typescript
import { Fade, ScaleFade, Slide, SlideFade, Collapse } from '@chakra-ui/react';

// Fade
<Fade in={isOpen}>
  <Box>Content</Box>
</Fade>

// Scale Fade
<ScaleFade initialScale={0.9} in={isOpen}>
  <Box>Content</Box>
</ScaleFade>

// Slide
<Slide direction="bottom" in={isOpen}>
  <Box>Content</Box>
</Slide>

// Slide Fade
<SlideFade in={isOpen} offsetY="20px">
  <Box>Content</Box>
</SlideFade>

// Collapse
<Collapse in={isOpen} animateOpacity>
  <Box>Content</Box>
</Collapse>
```

#### Chakra Motion Integration
```typescript
import { chakra, shouldForwardProp } from '@chakra-ui/react';
import { motion, isValidMotionProp } from 'framer-motion';

const MotionBox = chakra(motion.div, {
  shouldForwardProp: (prop) =>
    isValidMotionProp(prop) || shouldForwardProp(prop),
});

<MotionBox
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  bg="blue.500"
  p={4}
>
  Animated Chakra Box
</MotionBox>
```

### 3. Animation Presets

#### Fade Preset
```typescript
const fadePreset = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.3 }
};
```

#### Slide Preset
```typescript
const slidePreset = {
  initial: { x: -20, opacity: 0 },
  animate: { x: 0, opacity: 1 },
  exit: { x: 20, opacity: 0 },
  transition: { type: 'spring', stiffness: 300, damping: 30 }
};
```

#### Scale Preset
```typescript
const scalePreset = {
  initial: { scale: 0.8, opacity: 0 },
  animate: { scale: 1, opacity: 1 },
  exit: { scale: 0.8, opacity: 0 },
  transition: { type: 'spring', stiffness: 400, damping: 25 }
};
```

#### Bounce Preset
```typescript
const bouncePreset = {
  initial: { y: -50, opacity: 0 },
  animate: { y: 0, opacity: 1 },
  transition: { type: 'spring', bounce: 0.5 }
};
```

#### Spring Preset
```typescript
const springPreset = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: 'spring', stiffness: 500, damping: 30 }
};
```

## Accessibility Considerations

1. **Respect Motion Preferences**:
```typescript
import { useReducedMotion } from 'framer-motion';

const shouldReduceMotion = useReducedMotion();

const variants = shouldReduceMotion
  ? { initial: {}, animate: {} }
  : { initial: { opacity: 0 }, animate: { opacity: 1 } };
```

2. **Keep Animations Short**: Under 300ms for UI feedback
3. **Avoid Flashing**: Don't animate colors rapidly
4. **Provide Skip Options**: Allow users to skip long animations

## Output Files

Generated animation utilities will be placed in:
```
src/
├── components/
│   └── ${componentName}.tsx  (updated with animations)
└── utils/
    └── animations.ts  (reusable animation presets)
```
