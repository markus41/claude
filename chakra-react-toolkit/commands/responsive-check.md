---
name: responsive-check
description: Analyze responsive design across breakpoints
argument-hint: "[component-path] [--breakpoints=sm,md,lg,xl,2xl]"
allowed-tools: ["Read", "Glob", "Grep", "Write"]
---

# Responsive Design Analysis Command

When this command is invoked, analyze component(s) for responsive design patterns, identify issues, and generate recommendations for improving mobile, tablet, and desktop experiences.

## Execution Steps

1. **Locate Target Components**
   - Read specified component file(s)
   - Parse JSX to identify Chakra responsive props
   - Extract breakpoint usage patterns

2. **Analyze Responsive Patterns**
   - Check for responsive prop usage (object/array syntax)
   - Identify hardcoded values that should be responsive
   - Detect breakpoint inconsistencies
   - Find missing mobile/tablet optimizations

3. **Test Against Breakpoints**
   - Verify behavior at each breakpoint (sm, md, lg, xl, 2xl)
   - Check for overflow issues
   - Identify touch target sizes for mobile
   - Validate text readability across screen sizes

4. **Generate Report**
   - List responsive issues by severity
   - Provide code examples for fixes
   - Suggest responsive patterns to adopt
   - Create responsive test checklist

## Chakra Breakpoint System

```typescript
/**
 * Default Chakra UI breakpoints
 */
const breakpoints = {
  base: '0em',      // 0px (mobile-first)
  sm: '30em',       // 480px
  md: '48em',       // 768px (tablet)
  lg: '62em',       // 992px (desktop)
  xl: '80em',       // 1280px (large desktop)
  '2xl': '96em',    // 1536px (extra large)
};

/**
 * Responsive prop patterns in Chakra
 */
interface ResponsivePatterns {
  // Object syntax
  objectSyntax: {
    fontSize: { base: 'sm', md: 'md', lg: 'lg' };
    padding: { base: 4, md: 6, lg: 8 };
  };

  // Array syntax (shorthand)
  arraySyntax: {
    fontSize: ['sm', 'md', 'lg', 'xl'];  // base, sm, md, lg
    padding: [4, 6, 8];                   // base, sm, md
  };

  // useBreakpointValue hook
  hookUsage: {
    variant: useBreakpointValue({ base: 'mobile', md: 'desktop' });
  };
}
```

## Analysis Criteria

### Critical Issues

#### 1. Hardcoded Non-Responsive Values

```typescript
// BAD - Fixed sizes don't adapt to screen size
<Box width="800px" padding="40px">
  <Text fontSize="24px">Title</Text>
</Box>

// GOOD - Responsive values
<Box
  width={{ base: '100%', md: '90%', lg: '800px' }}
  padding={{ base: 4, md: 6, lg: 10 }}
>
  <Text fontSize={{ base: 'xl', md: '2xl', lg: '3xl' }}>
    Title
  </Text>
</Box>

// BETTER - Using Chakra's responsive container
<Container maxW="container.lg" px={{ base: 4, md: 6 }}>
  <Heading size={{ base: 'lg', md: 'xl', lg: '2xl' }}>
    Title
  </Heading>
</Container>
```

#### 2. Small Touch Targets on Mobile

```typescript
// BAD - Touch target too small (< 44px)
<IconButton
  icon={<CloseIcon />}
  size="xs"  // Only 24px on mobile
  aria-label="Close"
/>

// GOOD - Adequate touch target
<IconButton
  icon={<CloseIcon />}
  size={{ base: 'md', md: 'sm' }}  // 40px mobile, 32px desktop
  aria-label="Close"
/>

// BEST - Always meets minimum (44px)
<IconButton
  icon={<CloseIcon />}
  minW="44px"
  minH="44px"
  aria-label="Close"
/>
```

#### 3. Horizontal Overflow on Mobile

```typescript
// BAD - Can cause horizontal scroll
<Flex gap={8}>
  <Box minW="400px">Column 1</Box>
  <Box minW="400px">Column 2</Box>
  <Box minW="400px">Column 3</Box>
</Flex>

// GOOD - Stack on mobile, grid on desktop
<SimpleGrid
  columns={{ base: 1, md: 2, lg: 3 }}
  spacing={{ base: 4, md: 6, lg: 8 }}
>
  <Box>Column 1</Box>
  <Box>Column 2</Box>
  <Box>Column 3</Box>
</SimpleGrid>
```

#### 4. Fixed Positioning Issues

```typescript
// BAD - Fixed header with no mobile consideration
<Box
  position="fixed"
  top={0}
  width="100%"
  height="80px"
  zIndex={1000}
>
  <Flex justify="space-between" align="center" px={8}>
    {/* Complex desktop navigation */}
  </Flex>
</Box>

// GOOD - Responsive header
<Box
  position="fixed"
  top={0}
  width="100%"
  height={{ base: '60px', md: '80px' }}
  zIndex={1000}
>
  <Flex
    justify="space-between"
    align="center"
    px={{ base: 4, md: 8 }}
  >
    {/* Mobile: hamburger menu, Desktop: full nav */}
    <Hide below="md">
      <DesktopNav />
    </Hide>
    <Show below="md">
      <MobileMenuButton />
    </Show>
  </Flex>
</Box>
```

### Warning Issues

#### 1. Inconsistent Spacing Across Breakpoints

```typescript
// INCONSISTENT - Spacing jumps erratically
<VStack spacing={{ base: 2, md: 10, lg: 4 }}>
  {/* Base: 8px, md: 40px, lg: 16px - confusing progression */}
</VStack>

// CONSISTENT - Logical progression
<VStack spacing={{ base: 4, md: 6, lg: 8 }}>
  {/* Base: 16px, md: 24px, lg: 32px - smooth scaling */}
</VStack>
```

#### 2. Text Not Optimized for Reading Width

```typescript
// BAD - Text too wide on large screens
<Box>
  <Text fontSize="md">
    Very long paragraph that stretches across the entire screen width
    making it difficult to read on large desktop monitors...
  </Text>
</Box>

// GOOD - Constrained reading width
<Box maxW={{ base: '100%', md: '65ch', lg: '75ch' }}>
  <Text fontSize="md" lineHeight="tall">
    Comfortable paragraph width for optimal readability across
    all screen sizes...
  </Text>
</Box>
```

#### 3. Missing Hide/Show Components

```typescript
// BAD - Elements render but are invisible
<Box display={{ base: 'none', md: 'block' }}>
  <ComplexDesktopComponent />
</Box>

// BETTER - More semantic
<Hide below="md">
  <ComplexDesktopComponent />
</Hide>

// BEST - Conditional rendering
<Show above="md">
  <ComplexDesktopComponent />
</Show>
<Show below="md">
  <SimpleMobileComponent />
</Show>
```

### Informational (Best Practices)

#### 1. Mobile-First Design

```typescript
// GOOD - Mobile-first approach
<Box
  fontSize="md"           // Default mobile
  md={{ fontSize: 'lg' }} // Enhanced for tablet+
  lg={{ fontSize: 'xl' }} // Enhanced for desktop+
>

// BETTER - Explicit base value
<Box fontSize={{ base: 'md', md: 'lg', lg: 'xl' }}>
```

#### 2. Container Usage

```typescript
// Use Chakra containers for consistent max-widths
<Container maxW="container.xl">  {/* Max 1280px */}
  <Container maxW="container.lg">  {/* Max 960px */}
    <Container maxW="container.md">  {/* Max 768px */}
      <Container maxW="container.sm">  {/* Max 640px */}
```

#### 3. Grid vs Stack

```typescript
// Mobile: Stack, Desktop: Grid
<SimpleGrid
  columns={{ base: 1, md: 2, lg: 3 }}
  spacing={6}
>
  {items.map(item => <Card key={item.id}>{item}</Card>)}
</SimpleGrid>

// OR with Stack for more control
<Stack
  direction={{ base: 'column', md: 'row' }}
  spacing={4}
>
  <Box flex={1}>Left</Box>
  <Box flex={1}>Right</Box>
</Stack>
```

## Responsive Patterns Library

### Pattern 1: Responsive Typography

```typescript
/**
 * Typography scale that adapts to screen size
 */
<VStack align="start" spacing={4}>
  <Heading
    as="h1"
    fontSize={{ base: '2xl', sm: '3xl', md: '4xl', lg: '5xl' }}
    lineHeight="shorter"
  >
    Responsive Heading
  </Heading>

  <Text
    fontSize={{ base: 'sm', md: 'md', lg: 'lg' }}
    lineHeight={{ base: 'base', md: 'tall' }}
    maxW="65ch"
  >
    Body text with comfortable reading width
  </Text>
</VStack>
```

### Pattern 2: Responsive Navigation

```typescript
/**
 * Desktop: Horizontal nav, Mobile: Hamburger menu
 */
function ResponsiveNav() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box>
      {/* Desktop Navigation */}
      <Hide below="md">
        <HStack spacing={8}>
          <Link>Home</Link>
          <Link>About</Link>
          <Link>Services</Link>
          <Link>Contact</Link>
        </HStack>
      </Hide>

      {/* Mobile Navigation */}
      <Show below="md">
        <IconButton
          icon={<HamburgerIcon />}
          onClick={onToggle}
          aria-label="Open menu"
        />
        <Drawer isOpen={isOpen} onClose={onToggle}>
          <DrawerContent>
            <VStack spacing={4} p={4}>
              <Link>Home</Link>
              <Link>About</Link>
              <Link>Services</Link>
              <Link>Contact</Link>
            </VStack>
          </DrawerContent>
        </Drawer>
      </Show>
    </Box>
  );
}
```

### Pattern 3: Responsive Card Grid

```typescript
/**
 * 1 column mobile, 2 tablet, 3 desktop, 4 large desktop
 */
<SimpleGrid
  columns={{ base: 1, sm: 2, lg: 3, xl: 4 }}
  spacing={{ base: 4, md: 6, lg: 8 }}
  px={{ base: 4, md: 8, lg: 12 }}
>
  {cards.map(card => (
    <Card key={card.id}>
      <CardHeader>
        <Heading size={{ base: 'sm', md: 'md' }}>
          {card.title}
        </Heading>
      </CardHeader>
      <CardBody>
        <Text fontSize={{ base: 'sm', md: 'md' }}>
          {card.description}
        </Text>
      </CardBody>
    </Card>
  ))}
</SimpleGrid>
```

### Pattern 4: Responsive Modal

```typescript
/**
 * Full screen on mobile, centered on desktop
 */
<Modal
  isOpen={isOpen}
  onClose={onClose}
  size={{ base: 'full', md: 'lg', lg: 'xl' }}
>
  <ModalContent
    mx={{ base: 0, md: 4 }}
    my={{ base: 0, md: 12 }}
  >
    <ModalHeader fontSize={{ base: 'lg', md: 'xl' }}>
      Modal Title
    </ModalHeader>
    <ModalBody p={{ base: 4, md: 6 }}>
      Modal content
    </ModalBody>
  </ModalContent>
</Modal>
```

### Pattern 5: Responsive Images

```typescript
/**
 * Images that scale appropriately
 */
<Box
  width="100%"
  maxW={{ base: '100%', md: '600px', lg: '800px' }}
  mx="auto"
>
  <Image
    src={imageUrl}
    alt="Description"
    width="100%"
    height="auto"
    objectFit="cover"
    borderRadius={{ base: 'none', md: 'lg' }}
  />
</Box>
```

## useBreakpointValue Hook Analysis

```typescript
/**
 * Detect and validate useBreakpointValue usage
 */
function ComponentWithDynamicValue() {
  // Check if hook is used correctly
  const columns = useBreakpointValue(
    { base: 1, md: 2, lg: 3 },
    { fallback: 'md' }  // Always provide fallback for SSR
  );

  return <SimpleGrid columns={columns}>{/* ... */}</SimpleGrid>;
}
```

## Report Format

```markdown
# Responsive Design Analysis Report

**Component:** src/components/ProductGrid.tsx
**Generated:** [timestamp]
**Breakpoints Analyzed:** base, sm, md, lg, xl, 2xl

## Summary
- Critical Issues: 3
- Warnings: 5
- Best Practice Suggestions: 2

---

## Critical Issues

### 1. Fixed Width Causing Horizontal Scroll (Line 45)
**Severity:** Critical
**Impact:** Mobile users experience horizontal scrolling

**Current Code:**
```tsx
<Box width="1200px" padding="40px">
  <Grid templateColumns="repeat(3, 1fr)">
    {/* ... */}
  </Grid>
</Box>
```

**Recommended Fix:**
```tsx
<Container maxW="container.xl" px={{ base: 4, md: 6, lg: 8 }}>
  <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
    {/* ... */}
  </SimpleGrid>
</Container>
```

### 2. Touch Targets Too Small (Lines 67-72)
**Severity:** Critical
**Impact:** Difficult to tap on mobile devices (iOS/Android guidelines require 44x44px minimum)

**Current Code:**
```tsx
<IconButton size="xs" icon={<DeleteIcon />} />
```

**Recommended Fix:**
```tsx
<IconButton
  size={{ base: 'md', md: 'sm' }}
  minW="44px"
  minH="44px"
  icon={<DeleteIcon />}
  aria-label="Delete item"
/>
```

---

## Warnings

### 1. Inconsistent Spacing Scale (Line 89)
**Impact:** Jarring visual experience when resizing

**Current Code:**
```tsx
<VStack spacing={{ base: 2, md: 12, lg: 4 }}>
```

**Recommended Fix:**
```tsx
<VStack spacing={{ base: 4, md: 6, lg: 8 }}>
```

---

## Best Practices

### 1. Consider Using Hide/Show Components
Lines 101-105 use display prop for responsive visibility. Consider using semantic Hide/Show.

**Current:**
```tsx
<Box display={{ base: 'none', md: 'block' }}>
```

**Suggested:**
```tsx
<Hide below="md">
```

---

## Breakpoint Behavior Summary

| Breakpoint | Width | Layout | Issues |
|-----------|-------|--------|--------|
| base (mobile) | 0-479px | Single column | ❌ Horizontal scroll, small touch targets |
| sm (mobile landscape) | 480-767px | Single column | ⚠️ Spacing inconsistent |
| md (tablet) | 768-991px | 2 columns | ✅ No issues |
| lg (desktop) | 992-1279px | 3 columns | ✅ No issues |
| xl (large desktop) | 1280-1535px | 3 columns | ✅ No issues |
| 2xl (extra large) | 1536px+ | 3 columns | ✅ No issues |

---

## Responsive Checklist

- [ ] All touch targets >= 44x44px on mobile
- [ ] No horizontal scrolling at any breakpoint
- [ ] Text remains readable (12px minimum)
- [ ] Images scale appropriately
- [ ] Navigation accessible on mobile
- [ ] Forms usable on small screens
- [ ] Modals don't overflow viewport
- [ ] Cards/grids reflow properly

---

## Next Steps

1. Fix critical issues (horizontal scroll, touch targets)
2. Test on real devices (iOS Safari, Android Chrome)
3. Run accessibility audit: `claude /a11y-audit`
4. Consider adding responsive tests: `claude /test-component --responsive`

## Recommended Tools
- Chrome DevTools Device Mode
- Firefox Responsive Design Mode
- BrowserStack for real device testing
```

## Usage Examples

```bash
# Analyze specific component
claude /responsive-check src/components/ProductGrid.tsx

# Analyze all components in directory
claude /responsive-check src/components/

# Check specific breakpoints only
claude /responsive-check src/pages/Home.tsx --breakpoints=base,md,xl
```

## Integration with Testing

Suggest adding responsive snapshot tests after analysis:

```typescript
// ProductGrid.responsive.test.tsx
describe('ProductGrid - Responsive', () => {
  const breakpoints = ['base', 'md', 'lg', 'xl'];

  breakpoints.forEach(breakpoint => {
    it(`renders correctly at ${breakpoint}`, () => {
      // Set viewport
      cy.viewport(getBreakpointWidth(breakpoint), 800);

      // Take snapshot
      cy.matchImageSnapshot(`product-grid-${breakpoint}`);
    });
  });
});
```
