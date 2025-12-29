# Chakra UI Component Patterns

This skill activates when working with Chakra UI components, building responsive layouts, composing component hierarchies, or implementing design systems with Chakra UI v2. It provides comprehensive guidance on component composition, responsive props, style props, and common patterns for building accessible, maintainable React applications.

## Core Layout Components

Use Chakra's layout primitives to build flexible, responsive interfaces without writing custom CSS.

### Box Component

Use `Box` as the foundational building block for custom components. It accepts all style props and renders a `div` by default:

```tsx
import { Box } from '@chakra-ui/react';

// Basic box with style props
<Box bg="blue.500" color="white" p={4} borderRadius="md">
  Content
</Box>

// Using the 'as' prop to change rendered element
<Box as="section" maxW="container.lg" mx="auto">
  <Box as="h1" fontSize="2xl" fontWeight="bold">
    Heading
  </Box>
</Box>

// Responsive style props with array syntax
<Box
  width={['100%', '50%', '33.333%']}
  p={[2, 4, 6]}
  bg={['red.100', 'blue.100', 'green.100']}
>
  Responsive box
</Box>

// Object syntax for breakpoints
<Box
  display={{ base: 'block', md: 'flex' }}
  alignItems={{ md: 'center' }}
  gap={{ md: 4 }}
>
  Responsive content
</Box>
```

### Flex Component

Use `Flex` for flexbox layouts. It's a `Box` with `display: flex`:

```tsx
import { Flex, Box } from '@chakra-ui/react';

// Basic flex container
<Flex direction="row" align="center" justify="space-between" gap={4}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</Flex>

// Responsive flex direction
<Flex
  direction={{ base: 'column', md: 'row' }}
  wrap="wrap"
  gap={6}
>
  {items.map(item => (
    <Box key={item.id} flex="1" minW="200px">
      {item.content}
    </Box>
  ))}
</Flex>

// Centering pattern
<Flex h="100vh" align="center" justify="center">
  <Box>Centered content</Box>
</Flex>

// Flex with grow/shrink
<Flex>
  <Box flex="1">Grows to fill space</Box>
  <Box flexShrink={0} w="200px">Fixed width</Box>
</Flex>
```

### Stack Components

Use `Stack`, `HStack`, and `VStack` for consistent spacing between elements:

```tsx
import { Stack, HStack, VStack, Divider } from '@chakra-ui/react';

// Vertical stack with responsive spacing
<VStack spacing={[4, 6, 8]} align="stretch">
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</VStack>

// Horizontal stack
<HStack spacing={4} divider={<Divider orientation="vertical" />}>
  <Box>Item 1</Box>
  <Box>Item 2</Box>
  <Box>Item 3</Box>
</HStack>

// Responsive stack direction
<Stack
  direction={{ base: 'column', md: 'row' }}
  spacing={6}
  align={{ base: 'stretch', md: 'center' }}
>
  <Box flex="1">Main content</Box>
  <Box w={{ base: 'full', md: '300px' }}>Sidebar</Box>
</Stack>

// Stack with divider
<VStack
  spacing={0}
  divider={<Divider />}
  align="stretch"
>
  {items.map(item => (
    <Box key={item.id} p={4}>
      {item.content}
    </Box>
  ))}
</VStack>
```

### Grid Component

Use `Grid` for complex two-dimensional layouts:

```tsx
import { Grid, GridItem } from '@chakra-ui/react';

// Basic grid
<Grid templateColumns="repeat(3, 1fr)" gap={6}>
  <Box bg="blue.100" p={4}>1</Box>
  <Box bg="blue.100" p={4}>2</Box>
  <Box bg="blue.100" p={4}>3</Box>
</Grid>

// Responsive grid
<Grid
  templateColumns={{
    base: 'repeat(1, 1fr)',
    md: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
    xl: 'repeat(4, 1fr)'
  }}
  gap={[4, 6]}
>
  {items.map(item => (
    <Box key={item.id} bg="gray.50" p={4}>
      {item.content}
    </Box>
  ))}
</Grid>

// Grid with named areas
<Grid
  templateAreas={{
    base: `"header" "main" "footer"`,
    md: `"header header" "nav main" "footer footer"`
  }}
  templateColumns={{ base: '1fr', md: '200px 1fr' }}
  templateRows={{ base: 'auto 1fr auto', md: 'auto 1fr auto' }}
  gap={4}
  minH="100vh"
>
  <GridItem area="header" bg="blue.500">Header</GridItem>
  <GridItem area="nav" bg="gray.100">Nav</GridItem>
  <GridItem area="main" bg="white">Main</GridItem>
  <GridItem area="footer" bg="gray.900">Footer</GridItem>
</Grid>

// Auto-fit grid
<Grid
  templateColumns="repeat(auto-fit, minmax(250px, 1fr))"
  gap={6}
>
  {cards.map(card => (
    <Box key={card.id} bg="white" shadow="md" borderRadius="lg" p={6}>
      {card.content}
    </Box>
  ))}
</Grid>
```

### Container Component

Use `Container` to center content and apply max-width constraints:

```tsx
import { Container } from '@chakra-ui/react';

// Standard container with max width
<Container maxW="container.lg" py={8}>
  <Box>Centered content</Box>
</Container>

// Multiple container sizes: sm (640px), md (768px), lg (1024px), xl (1280px), 2xl (1536px)
<Container maxW="container.xl" px={[4, 6, 8]}>
  <Box>Wide container</Box>
</Container>

// Center without max width constraint
<Container centerContent>
  <Box>Centered content</Box>
</Container>

// Nested containers for content hierarchy
<Container maxW="container.xl">
  <Box bg="gray.50" p={8}>
    <Container maxW="container.md">
      <Box>Nested narrower content</Box>
    </Container>
  </Box>
</Container>
```

## Responsive Design Patterns

### Breakpoint System

Chakra uses mobile-first breakpoints: base (0px), sm (480px), md (768px), lg (992px), xl (1280px), 2xl (1536px).

```tsx
// Array syntax applies styles from breakpoint up
<Box
  fontSize={['sm', 'md', 'lg', 'xl']}
  // sm at base, md at 480px+, lg at 768px+, xl at 992px+
/>

// Object syntax for specific breakpoints
<Box
  display={{ base: 'none', lg: 'block' }}
  // Hidden until lg breakpoint
/>

// Skip breakpoints using null
<Box
  p={[2, null, 4]}
  // 2 at base, unchanged at sm, 4 at md+
/>

// Combining array and object syntax
<Flex
  direction={['column', null, 'row']}
  gap={{ base: 4, lg: 8, xl: 12 }}
/>
```

### Responsive Patterns

```tsx
// Mobile menu pattern
<Box>
  <Flex
    as="nav"
    direction={{ base: 'column', md: 'row' }}
    display={{ base: isOpen ? 'flex' : 'none', md: 'flex' }}
    gap={{ base: 2, md: 6 }}
  >
    <Link>Home</Link>
    <Link>About</Link>
    <Link>Contact</Link>
  </Flex>
</Box>

// Card grid responsive
<Grid
  templateColumns={{
    base: '1fr',
    sm: 'repeat(2, 1fr)',
    lg: 'repeat(3, 1fr)',
    xl: 'repeat(4, 1fr)'
  }}
  gap={[4, 6, 8]}
>
  {cards.map(card => <Card key={card.id} {...card} />)}
</Grid>

// Sidebar layout
<Flex direction={{ base: 'column', lg: 'row' }} gap={6}>
  <Box
    w={{ base: 'full', lg: '250px' }}
    flexShrink={0}
    order={{ base: 2, lg: 1 }}
  >
    Sidebar
  </Box>
  <Box flex="1" order={{ base: 1, lg: 2 }}>
    Main content
  </Box>
</Flex>

// Show/hide based on breakpoint
<>
  <Box display={{ base: 'block', md: 'none' }}>
    Mobile version
  </Box>
  <Box display={{ base: 'none', md: 'block' }}>
    Desktop version
  </Box>
</>
```

## Style Props and the sx Prop

### Common Style Props

Use Chakra's style props for type-safe styling:

```tsx
// Spacing (margin, padding)
<Box m={4} p={8} px={6} py={4} mt={2} mb={3} />

// Layout
<Box
  w="100%"
  maxW="400px"
  h="300px"
  minH="200px"
  display="flex"
  position="relative"
/>

// Color
<Box
  bg="blue.500"
  color="white"
  borderColor="gray.200"
  _hover={{ bg: 'blue.600' }}
/>

// Typography
<Box
  fontSize="lg"
  fontWeight="bold"
  lineHeight="tall"
  textAlign="center"
  textTransform="uppercase"
/>

// Border
<Box
  border="1px"
  borderTop="2px"
  borderColor="gray.300"
  borderRadius="md"
  borderStyle="dashed"
/>

// Shadow
<Box
  shadow="md"
  _hover={{ shadow: 'xl' }}
/>
```

### Pseudo Props

Use pseudo props for hover, focus, active states:

```tsx
<Box
  bg="white"
  _hover={{
    bg: 'gray.50',
    transform: 'translateY(-2px)',
    shadow: 'lg'
  }}
  _focus={{
    outline: 'none',
    boxShadow: 'outline'
  }}
  _active={{
    bg: 'gray.100'
  }}
  _disabled={{
    opacity: 0.4,
    cursor: 'not-allowed'
  }}
>
  Interactive element
</Box>

// Child selectors
<Box
  _first={{ mt: 0 }}
  _last={{ mb: 0 }}
  _even={{ bg: 'gray.50' }}
  _odd={{ bg: 'white' }}
/>

// Placeholder styling
<Input
  _placeholder={{
    color: 'gray.400',
    fontSize: 'sm'
  }}
/>

// Selection styling
<Box
  _selection={{
    bg: 'blue.200',
    color: 'blue.900'
  }}
>
  Selectable text
</Box>
```

### The sx Prop

Use `sx` for CSS properties not covered by style props:

```tsx
import { Box } from '@chakra-ui/react';

// Advanced CSS properties
<Box
  sx={{
    '&::-webkit-scrollbar': {
      width: '8px'
    },
    '&::-webkit-scrollbar-thumb': {
      background: 'gray.300',
      borderRadius: 'full'
    },
    '@media print': {
      display: 'none'
    }
  }}
>
  Content with custom scrollbar
</Box>

// Complex selectors
<Box
  sx={{
    '& > p': {
      marginBottom: 4
    },
    '& > p:last-child': {
      marginBottom: 0
    },
    '& a': {
      color: 'blue.500',
      textDecoration: 'underline'
    }
  }}
>
  {htmlContent}
</Box>

// Animation keyframes
<Box
  sx={{
    '@keyframes spin': {
      from: { transform: 'rotate(0deg)' },
      to: { transform: 'rotate(360deg)' }
    },
    animation: 'spin 2s linear infinite'
  }}
>
  Spinning element
</Box>
```

## Component Composition Patterns

### The as Prop

Use the `as` prop to change the rendered HTML element while preserving Chakra styling:

```tsx
// Semantic HTML
<Box as="article" p={6}>
  <Box as="h1" fontSize="3xl" mb={4}>Title</Box>
  <Box as="p" color="gray.600">Content</Box>
</Box>

// Custom components
<Box as={Link} to="/about" _hover={{ textDecor: 'underline' }}>
  About
</Box>

// Third-party components
<Box as={motion.div} animate={{ x: 100 }}>
  Animated with Framer Motion
</Box>

// Button as link
<Button as="a" href="/signup" target="_blank">
  Sign Up
</Button>
```

### Layered Styles

Build complex components by layering Box components:

```tsx
// Card component
<Box
  bg="white"
  shadow="md"
  borderRadius="lg"
  overflow="hidden"
  transition="all 0.2s"
  _hover={{ shadow: 'xl', transform: 'translateY(-4px)' }}
>
  <Box h="200px" bg="blue.500" />
  <Box p={6}>
    <Box as="h3" fontSize="xl" fontWeight="bold" mb={2}>
      Card Title
    </Box>
    <Box color="gray.600">
      Card description text
    </Box>
  </Box>
</Box>

// Badge on corner
<Box position="relative">
  <Box
    position="absolute"
    top={2}
    right={2}
    bg="red.500"
    color="white"
    px={2}
    py={1}
    borderRadius="md"
    fontSize="xs"
    fontWeight="bold"
    zIndex={1}
  >
    New
  </Box>
  <Box>Main content</Box>
</Box>
```

### Wrapper Components

Create reusable wrapper components with default styles:

```tsx
// Section wrapper
export const Section = ({ children, ...props }) => (
  <Box
    as="section"
    py={{ base: 12, md: 20 }}
    px={{ base: 4, md: 8 }}
    {...props}
  >
    <Container maxW="container.xl">
      {children}
    </Container>
  </Box>
);

// Card wrapper
export const Card = ({ children, ...props }) => (
  <Box
    bg="white"
    shadow="sm"
    borderRadius="lg"
    border="1px"
    borderColor="gray.200"
    p={6}
    {...props}
  >
    {children}
  </Box>
);

// Usage allows prop overrides
<Card bg="blue.50" borderColor="blue.200">
  Custom styled card
</Card>
```

## Common Component Patterns

### Hero Section

```tsx
<Box
  bg="blue.600"
  color="white"
  py={{ base: 20, md: 32 }}
>
  <Container maxW="container.lg">
    <VStack spacing={6} textAlign="center">
      <Box
        as="h1"
        fontSize={{ base: '4xl', md: '6xl' }}
        fontWeight="bold"
        lineHeight="shorter"
      >
        Welcome to Our App
      </Box>
      <Box fontSize={{ base: 'lg', md: 'xl' }} maxW="2xl">
        Build amazing things with Chakra UI
      </Box>
      <HStack spacing={4}>
        <Button size="lg" colorScheme="white" variant="solid">
          Get Started
        </Button>
        <Button size="lg" variant="outline" borderColor="white" color="white">
          Learn More
        </Button>
      </HStack>
    </VStack>
  </Container>
</Box>
```

### Feature Grid

```tsx
<Container maxW="container.xl" py={16}>
  <VStack spacing={12}>
    <Box textAlign="center" maxW="2xl">
      <Box as="h2" fontSize="4xl" fontWeight="bold" mb={4}>
        Features
      </Box>
      <Box color="gray.600" fontSize="lg">
        Everything you need to build modern applications
      </Box>
    </Box>

    <Grid
      templateColumns={{ base: '1fr', md: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' }}
      gap={8}
    >
      {features.map(feature => (
        <VStack key={feature.id} align="start" spacing={4}>
          <Box
            w={12}
            h={12}
            borderRadius="lg"
            bg="blue.500"
            display="flex"
            alignItems="center"
            justifyContent="center"
            color="white"
          >
            {feature.icon}
          </Box>
          <Box fontSize="xl" fontWeight="semibold">
            {feature.title}
          </Box>
          <Box color="gray.600">
            {feature.description}
          </Box>
        </VStack>
      ))}
    </Grid>
  </VStack>
</Container>
```

### Navigation Bar

```tsx
<Box
  as="nav"
  bg="white"
  borderBottom="1px"
  borderColor="gray.200"
  position="sticky"
  top={0}
  zIndex={10}
>
  <Container maxW="container.xl">
    <Flex h={16} alignItems="center" justifyContent="space-between">
      <Box fontSize="xl" fontWeight="bold">
        Logo
      </Box>

      <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
        <Link>Home</Link>
        <Link>Features</Link>
        <Link>Pricing</Link>
        <Link>Contact</Link>
      </HStack>

      <HStack spacing={4}>
        <Button variant="ghost">Log In</Button>
        <Button colorScheme="blue">Sign Up</Button>
      </HStack>
    </Flex>
  </Container>
</Box>
```

### Dashboard Layout

```tsx
<Flex minH="100vh">
  {/* Sidebar */}
  <Box
    w={{ base: 'full', md: '64' }}
    bg="gray.900"
    color="white"
    display={{ base: 'none', md: 'block' }}
  >
    <VStack spacing={1} align="stretch" p={4}>
      {menuItems.map(item => (
        <Box
          key={item.id}
          px={4}
          py={3}
          borderRadius="md"
          _hover={{ bg: 'gray.800' }}
          cursor="pointer"
        >
          {item.label}
        </Box>
      ))}
    </VStack>
  </Box>

  {/* Main content */}
  <Box flex="1" bg="gray.50">
    <Box
      as="header"
      bg="white"
      borderBottom="1px"
      borderColor="gray.200"
      px={8}
      py={4}
    >
      <Box fontSize="2xl" fontWeight="bold">
        Dashboard
      </Box>
    </Box>

    <Box p={8}>
      {/* Page content */}
    </Box>
  </Box>
</Flex>
```

Use these patterns as starting points and customize them with theme tokens and responsive props to match your design system requirements.
