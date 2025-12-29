---
name: create-layout
description: Generate page layouts using Chakra's Stack, Grid, Flex, and Container components
argument-hint: "[layout-name] [layout-type: stack|grid|flex|dashboard]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a layout component with Chakra UI:

1. Parse layout name and type from arguments
2. Generate appropriate layout structure (Stack, Grid, Flex, or composite)
3. Include responsive breakpoints
4. Add TypeScript interfaces for sections/slots
5. Implement common layout patterns (sidebar, header, footer, main)
6. Support flexible content areas with proper spacing

## Layout Templates

### Stack Layout (Vertical/Horizontal)

```typescript
import { ReactNode } from 'react';
import { VStack, HStack, StackProps, Container } from '@chakra-ui/react';

export interface {LayoutName}Props extends StackProps {
  header?: ReactNode;
  main: ReactNode;
  footer?: ReactNode;
  sidebar?: ReactNode;
  direction?: 'vertical' | 'horizontal';
}

export const {LayoutName} = ({
  header,
  main,
  footer,
  sidebar,
  direction = 'vertical',
  ...props
}: {LayoutName}Props) => {
  const Stack = direction === 'vertical' ? VStack : HStack;

  return (
    <Stack spacing={0} minH="100vh" align="stretch" {...props}>
      {header && (
        <Container as="header" maxW="container.xl" py={4}>
          {header}
        </Container>
      )}

      <Stack flex={1} spacing={0} direction={sidebar ? 'row' : 'column'}>
        {sidebar && (
          <Container as="aside" maxW="xs" py={6} borderRightWidth="1px">
            {sidebar}
          </Container>
        )}

        <Container as="main" maxW="container.xl" flex={1} py={6}>
          {main}
        </Container>
      </Stack>

      {footer && (
        <Container as="footer" maxW="container.xl" py={4} borderTopWidth="1px">
          {footer}
        </Container>
      )}
    </Stack>
  );
};
```

### Grid Layout

```typescript
import { ReactNode } from 'react';
import { Grid, GridItem, GridProps, Box } from '@chakra-ui/react';

export interface {LayoutName}Props extends GridProps {
  header?: ReactNode;
  sidebar?: ReactNode;
  main: ReactNode;
  aside?: ReactNode;
  footer?: ReactNode;
}

export const {LayoutName} = ({
  header,
  sidebar,
  main,
  aside,
  footer,
  ...props
}: {LayoutName}Props) => {
  return (
    <Grid
      templateAreas={{
        base: `"header"
               "main"
               "footer"`,
        md: `"header header header"
             "sidebar main aside"
             "footer footer footer"`,
      }}
      templateColumns={{
        base: '1fr',
        md: sidebar && aside ? '200px 1fr 200px' : sidebar ? '200px 1fr' : '1fr',
      }}
      templateRows={{
        base: 'auto 1fr auto',
        md: 'auto 1fr auto',
      }}
      minH="100vh"
      gap={0}
      {...props}
    >
      {header && (
        <GridItem area="header" borderBottomWidth="1px" p={4}>
          {header}
        </GridItem>
      )}

      {sidebar && (
        <GridItem area="sidebar" borderRightWidth="1px" p={6}>
          {sidebar}
        </GridItem>
      )}

      <GridItem area="main" p={6}>
        {main}
      </GridItem>

      {aside && (
        <GridItem area="aside" borderLeftWidth="1px" p={6}>
          {aside}
        </GridItem>
      )}

      {footer && (
        <GridItem area="footer" borderTopWidth="1px" p={4}>
          {footer}
        </GridItem>
      )}
    </Grid>
  );
};
```

### Flex Layout (Responsive)

```typescript
import { ReactNode } from 'react';
import { Flex, Box, FlexProps } from '@chakra-ui/react';

export interface {LayoutName}Props extends FlexProps {
  header?: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
  footer?: ReactNode;
  sidebarPosition?: 'left' | 'right';
}

export const {LayoutName} = ({
  header,
  main,
  sidebar,
  footer,
  sidebarPosition = 'left',
  ...props
}: {LayoutName}Props) => {
  return (
    <Flex direction="column" minH="100vh" {...props}>
      {header && (
        <Box as="header" borderBottomWidth="1px" p={4}>
          {header}
        </Box>
      )}

      <Flex flex={1} direction={{ base: 'column', md: 'row' }}>
        {sidebar && sidebarPosition === 'left' && (
          <Box
            as="aside"
            w={{ base: 'full', md: '250px' }}
            borderRightWidth={{ base: 0, md: '1px' }}
            p={6}
          >
            {sidebar}
          </Box>
        )}

        <Box as="main" flex={1} p={6}>
          {main}
        </Box>

        {sidebar && sidebarPosition === 'right' && (
          <Box
            as="aside"
            w={{ base: 'full', md: '250px' }}
            borderLeftWidth={{ base: 0, md: '1px' }}
            p={6}
          >
            {sidebar}
          </Box>
        )}
      </Flex>

      {footer && (
        <Box as="footer" borderTopWidth="1px" p={4}>
          {footer}
        </Box>
      )}
    </Flex>
  );
};
```

### Dashboard Layout

```typescript
import { ReactNode } from 'react';
import { Grid, GridItem, Box, GridProps } from '@chakra-ui/react';

export interface {LayoutName}Props extends GridProps {
  topBar: ReactNode;
  navigation: ReactNode;
  main: ReactNode;
  sidebar?: ReactNode;
}

export const {LayoutName} = ({
  topBar,
  navigation,
  main,
  sidebar,
  ...props
}: {LayoutName}Props) => {
  return (
    <Grid
      templateAreas={{
        base: `"topbar"
               "nav"
               "main"`,
        lg: `"topbar topbar"
             "nav main"
             "nav sidebar"`,
      }}
      templateColumns={{
        base: '1fr',
        lg: sidebar ? '250px 1fr' : '250px 1fr',
      }}
      templateRows={{
        base: 'auto auto 1fr',
        lg: 'auto 1fr auto',
      }}
      h="100vh"
      gap={0}
      {...props}
    >
      <GridItem area="topbar" bg="white" borderBottomWidth="1px" p={4}>
        {topBar}
      </GridItem>

      <GridItem
        area="nav"
        bg="gray.50"
        borderRightWidth="1px"
        overflowY="auto"
        p={4}
      >
        {navigation}
      </GridItem>

      <GridItem area="main" overflowY="auto" p={6}>
        {main}
      </GridItem>

      {sidebar && (
        <GridItem area="sidebar" borderTopWidth="1px" p={4}>
          {sidebar}
        </GridItem>
      )}
    </Grid>
  );
};
```

## Responsive Patterns

1. Use Chakra's responsive object syntax for breakpoints
2. Stack vertically on mobile, side-by-side on desktop
3. Hide/show sections based on screen size with `display` prop
4. Adjust spacing and padding for mobile views
5. Use Container with maxW for content width constraints

## Best Practices

1. Use semantic HTML elements (header, main, aside, footer)
2. Set minH="100vh" on root layout for full viewport height
3. Make layouts scrollable with overflowY="auto" on content areas
4. Use Grid for complex layouts, Flex for simpler ones
5. Provide named grid areas for clarity
6. Support optional sections (sidebar, footer, etc.)
7. Use border props for visual separation
8. Apply consistent spacing with Chakra tokens
9. Export Props interface for composition
10. Default to mobile-first responsive design
