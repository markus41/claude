---
name: create-card
description: Generate Card components including stat displays and info cards with Chakra UI
argument-hint: "[card-name] [type: basic|stat|info|feature]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a card component with Chakra UI:

1. Parse card name and type from arguments
2. Generate TypeScript component with appropriate card structure
3. Include header, body, footer sections
4. Support different visual variants
5. Add hover effects and interactions
6. Implement responsive design

## Basic Card Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  BoxProps,
  Heading,
  Text,
  Image,
  Button,
  HStack,
  VStack,
  Divider,
} from '@chakra-ui/react';

export interface {CardName}Props extends BoxProps {
  title?: string;
  subtitle?: string;
  description?: string;
  image?: string;
  imageAlt?: string;
  children?: ReactNode;
  footer?: ReactNode;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: string;
    colorScheme?: string;
  }>;
  variant?: 'elevated' | 'outline' | 'filled';
}

const variantStyles = {
  elevated: {
    bg: 'white',
    boxShadow: 'md',
    _hover: { boxShadow: 'lg', transform: 'translateY(-2px)' },
  },
  outline: {
    bg: 'white',
    borderWidth: '1px',
    borderColor: 'gray.200',
    _hover: { borderColor: 'gray.300', boxShadow: 'sm' },
  },
  filled: {
    bg: 'gray.50',
    _hover: { bg: 'gray.100' },
  },
};

export const {CardName} = ({
  title,
  subtitle,
  description,
  image,
  imageAlt,
  children,
  footer,
  actions,
  variant = 'elevated',
  ...props
}: {CardName}Props) => {
  return (
    <Box
      borderRadius="lg"
      overflow="hidden"
      transition="all 0.2s"
      {...variantStyles[variant]}
      {...props}
    >
      {image && (
        <Image
          src={image}
          alt={imageAlt || title || 'Card image'}
          w="full"
          h="200px"
          objectFit="cover"
        />
      )}

      <VStack align="stretch" spacing={4} p={6}>
        {(title || subtitle) && (
          <VStack align="stretch" spacing={1}>
            {title && (
              <Heading size="md" color="gray.900">
                {title}
              </Heading>
            )}
            {subtitle && (
              <Text fontSize="sm" color="gray.600">
                {subtitle}
              </Text>
            )}
          </VStack>
        )}

        {description && (
          <Text color="gray.700" lineHeight="tall">
            {description}
          </Text>
        )}

        {children}

        {actions && actions.length > 0 && (
          <>
            <Divider />
            <HStack spacing={3}>
              {actions.map((action, index) => (
                <Button
                  key={index}
                  onClick={action.onClick}
                  variant={action.variant || 'solid'}
                  colorScheme={action.colorScheme || 'blue'}
                  size="sm"
                >
                  {action.label}
                </Button>
              ))}
            </HStack>
          </>
        )}

        {footer}
      </VStack>
    </Box>
  );
};
```

## Stat Card Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  StatGroup,
  BoxProps,
  Icon,
  HStack,
  VStack,
} from '@chakra-ui/react';

export interface {CardName}Props extends BoxProps {
  label: string;
  value: string | number;
  change?: {
    value: number;
    type: 'increase' | 'decrease';
  };
  helpText?: string;
  icon?: ReactNode;
  colorScheme?: 'blue' | 'green' | 'red' | 'purple' | 'orange';
}

const colorSchemes = {
  blue: { bg: 'blue.50', iconBg: 'blue.500', iconColor: 'white' },
  green: { bg: 'green.50', iconBg: 'green.500', iconColor: 'white' },
  red: { bg: 'red.50', iconBg: 'red.500', iconColor: 'white' },
  purple: { bg: 'purple.50', iconBg: 'purple.500', iconColor: 'white' },
  orange: { bg: 'orange.50', iconBg: 'orange.500', iconColor: 'white' },
};

export const {CardName} = ({
  label,
  value,
  change,
  helpText,
  icon,
  colorScheme = 'blue',
  ...props
}: {CardName}Props) => {
  const colors = colorSchemes[colorScheme];

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="lg"
      boxShadow="sm"
      borderWidth="1px"
      borderColor="gray.200"
      {...props}
    >
      <HStack spacing={4} align="start">
        {icon && (
          <Box
            p={3}
            borderRadius="lg"
            bg={colors.iconBg}
            color={colors.iconColor}
          >
            {icon}
          </Box>
        )}

        <Stat flex={1}>
          <StatLabel color="gray.600" fontSize="sm" fontWeight="medium">
            {label}
          </StatLabel>
          <StatNumber fontSize="3xl" fontWeight="bold" color="gray.900" mt={2}>
            {value}
          </StatNumber>
          {(change || helpText) && (
            <StatHelpText mb={0} mt={2}>
              {change && (
                <HStack spacing={1}>
                  <StatArrow type={change.type} />
                  <Box as="span" fontWeight="medium">
                    {Math.abs(change.value)}%
                  </Box>
                </HStack>
              )}
              {helpText}
            </StatHelpText>
          )}
        </Stat>
      </HStack>
    </Box>
  );
};
```

## Info Card Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  BoxProps,
  HStack,
  VStack,
  Text,
  Icon,
  CloseButton,
} from '@chakra-ui/react';
import { InfoIcon, WarningIcon, CheckCircleIcon } from '@chakra-ui/icons';

export interface {CardName}Props extends BoxProps {
  title?: string;
  description: string;
  status?: 'info' | 'warning' | 'success' | 'error';
  icon?: ReactNode;
  onClose?: () => void;
  variant?: 'subtle' | 'left-accent' | 'solid';
}

const statusConfig = {
  info: {
    icon: InfoIcon,
    colorScheme: 'blue',
    subtle: { bg: 'blue.50', color: 'blue.900', borderColor: 'blue.200' },
    solid: { bg: 'blue.500', color: 'white' },
  },
  warning: {
    icon: WarningIcon,
    colorScheme: 'orange',
    subtle: { bg: 'orange.50', color: 'orange.900', borderColor: 'orange.200' },
    solid: { bg: 'orange.500', color: 'white' },
  },
  success: {
    icon: CheckCircleIcon,
    colorScheme: 'green',
    subtle: { bg: 'green.50', color: 'green.900', borderColor: 'green.200' },
    solid: { bg: 'green.500', color: 'white' },
  },
  error: {
    icon: WarningIcon,
    colorScheme: 'red',
    subtle: { bg: 'red.50', color: 'red.900', borderColor: 'red.200' },
    solid: { bg: 'red.500', color: 'white' },
  },
};

export const {CardName} = ({
  title,
  description,
  status = 'info',
  icon,
  onClose,
  variant = 'subtle',
  ...props
}: {CardName}Props) => {
  const config = statusConfig[status];
  const DefaultIcon = config.icon;

  const variantStyles =
    variant === 'solid'
      ? config.solid
      : variant === 'left-accent'
      ? {
          ...config.subtle,
          borderLeftWidth: '4px',
          borderLeftColor: config.solid.bg,
        }
      : config.subtle;

  return (
    <Box
      p={4}
      borderRadius="md"
      borderWidth={variant === 'left-accent' ? '1px' : undefined}
      {...variantStyles}
      {...props}
    >
      <HStack align="start" spacing={3}>
        <Icon
          as={icon || DefaultIcon}
          boxSize={5}
          mt={0.5}
          color={variant === 'solid' ? 'white' : config.solid.bg}
        />

        <VStack align="stretch" spacing={1} flex={1}>
          {title && (
            <Text fontWeight="bold" fontSize="md">
              {title}
            </Text>
          )}
          <Text fontSize="sm" lineHeight="tall">
            {description}
          </Text>
        </VStack>

        {onClose && (
          <CloseButton
            size="sm"
            onClick={onClose}
            color={variant === 'solid' ? 'white' : 'inherit'}
          />
        )}
      </HStack>
    </Box>
  );
};
```

## Feature Card Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  BoxProps,
  VStack,
  Heading,
  Text,
  Icon,
  Center,
} from '@chakra-ui/react';

export interface {CardName}Props extends BoxProps {
  icon: ReactNode;
  title: string;
  description: string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'pink';
}

const colorSchemes = {
  blue: { iconBg: 'blue.100', iconColor: 'blue.600', accentColor: 'blue.500' },
  green: { iconBg: 'green.100', iconColor: 'green.600', accentColor: 'green.500' },
  purple: { iconBg: 'purple.100', iconColor: 'purple.600', accentColor: 'purple.500' },
  orange: { iconBg: 'orange.100', iconColor: 'orange.600', accentColor: 'orange.500' },
  pink: { iconBg: 'pink.100', iconColor: 'pink.600', accentColor: 'pink.500' },
};

export const {CardName} = ({
  icon,
  title,
  description,
  colorScheme = 'blue',
  ...props
}: {CardName}Props) => {
  const colors = colorSchemes[colorScheme];

  return (
    <Box
      p={6}
      bg="white"
      borderRadius="xl"
      borderWidth="1px"
      borderColor="gray.200"
      transition="all 0.3s"
      _hover={{
        borderColor: colors.accentColor,
        boxShadow: 'lg',
        transform: 'translateY(-4px)',
      }}
      {...props}
    >
      <VStack spacing={4} align="center" textAlign="center">
        <Center
          w={16}
          h={16}
          borderRadius="full"
          bg={colors.iconBg}
          color={colors.iconColor}
        >
          {icon}
        </Center>

        <Heading size="md" color="gray.900">
          {title}
        </Heading>

        <Text color="gray.600" lineHeight="tall">
          {description}
        </Text>
      </VStack>
    </Box>
  );
};
```

## Card Variants

1. Basic - General purpose content card
2. Stat - Metrics and statistics display
3. Info - Alerts, notifications, messages
4. Feature - Product features, services showcase

## Visual Styles

- elevated: Drop shadow with hover lift effect
- outline: Border only, subtle hover shadow
- filled: Background color with hover darkening
- left-accent: Colored left border for info cards
- solid: Full color background for alerts

## Best Practices

1. Use consistent border radius across cards
2. Add smooth hover transitions
3. Provide adequate padding for readability
4. Use appropriate image aspect ratios
5. Limit card width for better readability
6. Group related actions in footer
7. Use semantic color schemes (green for success, red for error)
8. Include loading states for async content
9. Make cards keyboard accessible
10. Support responsive grid layouts
