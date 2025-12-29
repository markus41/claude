---
name: create-icon
description: Generate custom icon components wrapping Chakra UI Icon with TypeScript support
argument-hint: "[icon-name] [source: chakra|custom|react-icons]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create an icon component with Chakra UI:

1. Parse icon name and source type from arguments
2. Generate TypeScript component wrapping Chakra Icon
3. Support SVG path data for custom icons
4. Include size and color customization
5. Add accessibility attributes
6. Provide integration with react-icons library

## Custom SVG Icon Template

```typescript
import { Icon, IconProps } from '@chakra-ui/react';

export interface {IconName}Props extends IconProps {
  // Add custom props if needed
}

export const {IconName} = (props: {IconName}Props) => {
  return (
    <Icon viewBox="0 0 24 24" {...props}>
      {/* Replace with your SVG path data */}
      <path
        fill="currentColor"
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </Icon>
  );
};

// Usage:
// <{IconName} w={6} h={6} color="blue.500" />
```

## Icon Set Template

```typescript
import { Icon, IconProps, createIcon } from '@chakra-ui/react';

// Method 1: Using createIcon helper
export const {IconName}Solid = createIcon({
  displayName: '{IconName}Solid',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="currentColor"
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  ),
});

export const {IconName}Outline = createIcon({
  displayName: '{IconName}Outline',
  viewBox: '0 0 24 24',
  path: (
    <path
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
    />
  ),
});

// Method 2: Using Icon component
export const {IconName}Custom = (props: IconProps) => (
  <Icon viewBox="0 0 24 24" {...props}>
    <g fill="currentColor">
      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
    </g>
  </Icon>
);
```

## React Icons Integration Template

```typescript
import { Icon, IconProps } from '@chakra-ui/react';
import { FiStar, FiHeart, FiShoppingCart } from 'react-icons/fi';
import { AiFillStar } from 'react-icons/ai';
import { BsHeart } from 'react-icons/bs';

// Wrapper for consistent sizing and styling
export interface {IconName}Props extends IconProps {
  variant?: 'outline' | 'solid';
}

export const StarIcon = ({ variant = 'outline', ...props }: {IconName}Props) => {
  const iconMap = {
    outline: FiStar,
    solid: AiFillStar,
  };

  return <Icon as={iconMap[variant]} {...props} />;
};

export const HeartIcon = ({ variant = 'outline', ...props }: {IconName}Props) => {
  const iconMap = {
    outline: BsHeart,
    solid: AiFillStar,
  };

  return <Icon as={iconMap[variant]} {...props} />;
};

// Pre-configured icon with defaults
export const CartIcon = (props: IconProps) => (
  <Icon as={FiShoppingCart} w={5} h={5} color="gray.600" {...props} />
);

// Usage:
// <StarIcon variant="solid" w={6} h={6} color="yellow.400" />
// <HeartIcon variant="outline" w={5} h={5} color="red.500" />
```

## Icon Button Integration Template

```typescript
import { IconButton, IconButtonProps, Icon } from '@chakra-ui/react';
import { forwardRef } from 'react';

export interface {IconName}ButtonProps extends Omit<IconButtonProps, 'aria-label'> {
  label?: string;
}

export const {IconName}Button = forwardRef<HTMLButtonElement, {IconName}ButtonProps>(
  ({ label = 'Icon action', icon, ...props }, ref) => {
    return (
      <IconButton
        ref={ref}
        aria-label={label}
        icon={
          <Icon viewBox="0 0 24 24" w={5} h={5}>
            {/* Your SVG path */}
            <path
              fill="currentColor"
              d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
            />
          </Icon>
        }
        {...props}
      />
    );
  }
);

{IconName}Button.displayName = '{IconName}Button';

// Usage:
// <{IconName}Button label="Open menu" colorScheme="blue" />
```

## Multi-Color Icon Template

```typescript
import { Icon, IconProps, useToken } from '@chakra-ui/react';

export interface {IconName}Props extends IconProps {
  primaryColor?: string;
  secondaryColor?: string;
}

export const {IconName} = ({
  primaryColor = 'blue.500',
  secondaryColor = 'blue.300',
  ...props
}: {IconName}Props) => {
  const [primary, secondary] = useToken('colors', [primaryColor, secondaryColor]);

  return (
    <Icon viewBox="0 0 24 24" {...props}>
      {/* Primary color path */}
      <path
        fill={primary}
        d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
      />
      {/* Secondary color path */}
      <circle fill={secondary} cx="12" cy="12" r="3" />
    </Icon>
  );
};

// Usage:
// <{IconName} w={8} h={8} primaryColor="purple.500" secondaryColor="pink.300" />
```

## Animated Icon Template

```typescript
import { Icon, IconProps, keyframes } from '@chakra-ui/react';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
`;

export interface {IconName}Props extends IconProps {
  animation?: 'spin' | 'pulse' | 'none';
  animationDuration?: string;
}

export const {IconName} = ({
  animation = 'none',
  animationDuration = '2s',
  ...props
}: {IconName}Props) => {
  const animations = {
    spin: `${spin} ${animationDuration} linear infinite`,
    pulse: `${pulse} ${animationDuration} ease-in-out infinite`,
    none: undefined,
  };

  return (
    <Icon
      viewBox="0 0 24 24"
      animation={animations[animation]}
      {...props}
    >
      <path
        fill="currentColor"
        d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"
      />
    </Icon>
  );
};

// Usage:
// <{IconName} animation="spin" w={6} h={6} color="blue.500" />
```

## Icon Library Export Template

```typescript
// icons/index.ts
export { StarIcon } from './StarIcon';
export { HeartIcon } from './HeartIcon';
export { CartIcon } from './CartIcon';
export { MenuIcon } from './MenuIcon';
export { CloseIcon } from './CloseIcon';

// Export types
export type { StarIconProps } from './StarIcon';
export type { HeartIconProps } from './HeartIcon';

// Usage:
// import { StarIcon, HeartIcon } from '@/components/icons';
```

## Icon Sizes

Standard Chakra icon sizes:
- xs: 12px (3)
- sm: 16px (4)
- md: 20px (5)
- lg: 24px (6)
- xl: 32px (8)

Use w and h props: `<Icon w={6} h={6} />`

## Color Support

Icons inherit currentColor by default:
- Use `color` prop with Chakra color tokens
- Icons respond to parent text color
- Override specific paths with fill/stroke attributes

## Best Practices

1. Use 24x24 viewBox for consistency
2. Set displayName for better debugging
3. Use currentColor for flexible theming
4. Provide aria-label when used without text
5. Export both icon component and props type
6. Use createIcon for simple icons
7. Use Icon component for complex SVGs
8. Leverage react-icons for common icons
9. Keep SVG paths optimized and clean
10. Support both outline and solid variants
11. Make icons responsive with Chakra size props
12. Use forwardRef for icon buttons
13. Document custom color props clearly
