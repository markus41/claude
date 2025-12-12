---
name: create-loader
description: Generate loading components including spinners, skeletons, and progress indicators with Chakra UI
argument-hint: "[loader-name] [type: spinner|skeleton|progress|overlay]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a loading component with Chakra UI:

1. Parse loader name and type from arguments
2. Generate TypeScript component with appropriate loading indicator
3. Support different sizes and color schemes
4. Include accessibility features (aria-label, role)
5. Provide flexible composition options
6. Add animation and visual feedback

## Spinner Loader Template

```typescript
import { ReactNode } from 'react';
import {
  Spinner,
  Center,
  VStack,
  Text,
  Box,
  SpinnerProps,
} from '@chakra-ui/react';

export interface {LoaderName}Props extends SpinnerProps {
  text?: string;
  subtext?: string;
  fullScreen?: boolean;
  overlay?: boolean;
}

export const {LoaderName} = ({
  text,
  subtext,
  fullScreen = false,
  overlay = false,
  size = 'xl',
  color = 'blue.500',
  ...props
}: {LoaderName}Props) => {
  const content = (
    <VStack spacing={4}>
      <Spinner
        thickness="4px"
        speed="0.65s"
        emptyColor="gray.200"
        color={color}
        size={size}
        {...props}
      />
      {text && (
        <Text fontSize="lg" fontWeight="medium" color="gray.700">
          {text}
        </Text>
      )}
      {subtext && (
        <Text fontSize="sm" color="gray.500">
          {subtext}
        </Text>
      )}
    </VStack>
  );

  if (fullScreen || overlay) {
    return (
      <Center
        position="fixed"
        top={0}
        left={0}
        right={0}
        bottom={0}
        bg={overlay ? 'blackAlpha.600' : 'white'}
        zIndex={9999}
      >
        {overlay ? <Box bg="white" p={8} borderRadius="lg">{content}</Box> : content}
      </Center>
    );
  }

  return <Center py={8}>{content}</Center>;
};
```

## Skeleton Loader Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  Skeleton,
  SkeletonCircle,
  SkeletonText,
  VStack,
  HStack,
  StackProps,
} from '@chakra-ui/react';

export interface {LoaderName}Props extends StackProps {
  type?: 'text' | 'card' | 'list' | 'profile' | 'table';
  count?: number;
  isLoaded?: boolean;
  children?: ReactNode;
}

const TextSkeleton = () => (
  <SkeletonText mt={4} noOfLines={4} spacing={4} skeletonHeight={2} />
);

const CardSkeleton = () => (
  <Box p={5} borderWidth="1px" borderRadius="lg">
    <Skeleton height="200px" mb={4} />
    <SkeletonText noOfLines={3} spacing={3} />
  </Box>
);

const ListSkeleton = () => (
  <HStack p={4} borderWidth="1px" borderRadius="md">
    <SkeletonCircle size="12" />
    <VStack align="stretch" flex={1} spacing={2}>
      <Skeleton height="20px" width="60%" />
      <Skeleton height="16px" width="40%" />
    </VStack>
  </HStack>
);

const ProfileSkeleton = () => (
  <VStack spacing={4}>
    <SkeletonCircle size="24" />
    <SkeletonText noOfLines={2} spacing={2} width="200px" textAlign="center" />
  </VStack>
);

const TableSkeleton = () => (
  <VStack spacing={2} align="stretch">
    <HStack spacing={4}>
      <Skeleton height="40px" flex={1} />
      <Skeleton height="40px" flex={1} />
      <Skeleton height="40px" flex={1} />
    </HStack>
  </VStack>
);

export const {LoaderName} = ({
  type = 'text',
  count = 1,
  isLoaded = false,
  children,
  ...props
}: {LoaderName}Props) => {
  if (isLoaded && children) {
    return <>{children}</>;
  }

  const skeletonComponents = {
    text: TextSkeleton,
    card: CardSkeleton,
    list: ListSkeleton,
    profile: ProfileSkeleton,
    table: TableSkeleton,
  };

  const SkeletonComponent = skeletonComponents[type];

  return (
    <VStack spacing={4} align="stretch" {...props}>
      {Array.from({ length: count }).map((_, index) => (
        <SkeletonComponent key={index} />
      ))}
    </VStack>
  );
};
```

## Progress Loader Template

```typescript
import { ReactNode } from 'react';
import {
  Progress,
  Box,
  VStack,
  Text,
  CircularProgress,
  CircularProgressLabel,
  ProgressProps,
} from '@chakra-ui/react';

export interface {LoaderName}Props extends Omit<ProgressProps, 'value'> {
  value?: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  type?: 'linear' | 'circular';
  variant?: 'determinate' | 'indeterminate';
}

export const {LoaderName} = ({
  value,
  max = 100,
  label,
  showValue = true,
  type = 'linear',
  variant = 'determinate',
  colorScheme = 'blue',
  size = 'md',
  ...props
}: {LoaderName}Props) => {
  const percentage = variant === 'determinate' && value !== undefined
    ? Math.round((value / max) * 100)
    : undefined;

  if (type === 'circular') {
    return (
      <VStack spacing={3}>
        <CircularProgress
          value={percentage}
          color={`${colorScheme}.500`}
          size={size === 'sm' ? '60px' : size === 'md' ? '80px' : '120px'}
          isIndeterminate={variant === 'indeterminate'}
          {...props}
        >
          {showValue && percentage !== undefined && (
            <CircularProgressLabel fontSize={size === 'sm' ? 'sm' : 'md'}>
              {percentage}%
            </CircularProgressLabel>
          )}
        </CircularProgress>
        {label && (
          <Text fontSize="sm" color="gray.600">
            {label}
          </Text>
        )}
      </VStack>
    );
  }

  return (
    <Box w="full">
      {(label || showValue) && (
        <VStack align="stretch" spacing={2} mb={2}>
          {label && (
            <Text fontSize="sm" fontWeight="medium" color="gray.700">
              {label}
            </Text>
          )}
          {showValue && percentage !== undefined && (
            <Text fontSize="sm" color="gray.600">
              {percentage}% complete
            </Text>
          )}
        </VStack>
      )}
      <Progress
        value={percentage}
        colorScheme={colorScheme}
        size={size}
        isIndeterminate={variant === 'indeterminate'}
        hasStripe={variant === 'indeterminate'}
        isAnimated
        {...props}
      />
    </Box>
  );
};
```

## Overlay Loader Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  Center,
  Spinner,
  VStack,
  Text,
  Portal,
} from '@chakra-ui/react';

export interface {LoaderName}Props {
  isLoading: boolean;
  children: ReactNode;
  text?: string;
  spinnerSize?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  overlay?: 'full' | 'local';
  colorScheme?: string;
}

export const {LoaderName} = ({
  isLoading,
  children,
  text = 'Loading...',
  spinnerSize = 'xl',
  overlay = 'local',
  colorScheme = 'blue',
}: {LoaderName}Props) => {
  const loader = (
    <Center
      position={overlay === 'full' ? 'fixed' : 'absolute'}
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="blackAlpha.600"
      zIndex={overlay === 'full' ? 9999 : 10}
      backdropFilter="blur(4px)"
    >
      <Box bg="white" p={8} borderRadius="lg" boxShadow="xl">
        <VStack spacing={4}>
          <Spinner
            thickness="4px"
            speed="0.65s"
            emptyColor="gray.200"
            color={`${colorScheme}.500`}
            size={spinnerSize}
          />
          <Text fontWeight="medium" color="gray.700">
            {text}
          </Text>
        </VStack>
      </Box>
    </Center>
  );

  if (overlay === 'full') {
    return (
      <>
        {children}
        {isLoading && <Portal>{loader}</Portal>}
      </>
    );
  }

  return (
    <Box position="relative">
      {children}
      {isLoading && loader}
    </Box>
  );
};
```

## Skeleton Variants

Create skeleton patterns for common layouts:
- Text: Multiple lines with varying widths
- Card: Image + text content
- List: Avatar + two-line text
- Profile: Circular avatar + centered text
- Table: Multiple rows and columns
- Form: Labels and input fields

## Progress Types

1. Linear Progress
   - Determinate: Shows specific percentage
   - Indeterminate: Continuous animation
   - With label and value display

2. Circular Progress
   - Percentage in center
   - Different sizes
   - Color schemes

## Loading States

- Spinner: Simple, indefinite loading
- Skeleton: Content placeholder while loading
- Progress: Task completion tracking
- Overlay: Block interaction during loading

## Best Practices

1. Use skeletons for initial page loads
2. Use spinners for button actions
3. Use progress bars for file uploads or multi-step processes
4. Match skeleton shape to actual content
5. Provide meaningful loading text
6. Don't show multiple loading states simultaneously
7. Use overlay loaders to prevent interaction during critical operations
8. Include aria-label for accessibility
9. Set appropriate sizes for context
10. Use color schemes that match your brand
11. Animate smoothly with CSS transitions
12. Support both determinate and indeterminate states
