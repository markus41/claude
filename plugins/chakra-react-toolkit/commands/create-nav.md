---
name: create-nav
description: Generate navigation components including menus, breadcrumbs, and tabs with Chakra UI
argument-hint: "[nav-name] [type: menu|breadcrumb|tabs|sidebar]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a navigation component with Chakra UI:

1. Parse navigation name and type from arguments
2. Generate TypeScript component with proper navigation patterns
3. Include accessibility features (keyboard navigation, ARIA attributes)
4. Support active state indication
5. Implement responsive behavior
6. Add icon support for menu items

## Navigation Menu Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  Flex,
  HStack,
  Link,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  IconButton,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  VStack,
} from '@chakra-ui/react';
import { HamburgerIcon } from '@chakra-ui/icons';

export interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
  isActive?: boolean;
  children?: NavItem[];
}

export interface {NavName}Props {
  items: NavItem[];
  logo?: ReactNode;
  actions?: ReactNode;
  onNavigate?: (href: string) => void;
}

export const {NavName} = ({
  items,
  logo,
  actions,
  onNavigate,
}: {NavName}Props) => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  const handleClick = (href: string) => (e: React.MouseEvent) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <Box as="nav" bg="white" borderBottomWidth="1px" px={4} py={3}>
      <Flex justify="space-between" align="center">
        {/* Logo */}
        <Box>{logo}</Box>

        {/* Desktop Navigation */}
        <HStack spacing={8} display={{ base: 'none', md: 'flex' }}>
          {items.map((item) =>
            item.children ? (
              <Menu key={item.label}>
                <MenuButton
                  as={Link}
                  fontWeight={item.isActive ? 'semibold' : 'normal'}
                  color={item.isActive ? 'blue.600' : 'gray.700'}
                  _hover={{ color: 'blue.600' }}
                >
                  {item.label}
                </MenuButton>
                <MenuList>
                  {item.children.map((child) => (
                    <MenuItem
                      key={child.label}
                      as={Link}
                      href={child.href}
                      onClick={handleClick(child.href)}
                      icon={child.icon}
                    >
                      {child.label}
                    </MenuItem>
                  ))}
                </MenuList>
              </Menu>
            ) : (
              <Link
                key={item.label}
                href={item.href}
                onClick={handleClick(item.href)}
                fontWeight={item.isActive ? 'semibold' : 'normal'}
                color={item.isActive ? 'blue.600' : 'gray.700'}
                _hover={{ color: 'blue.600' }}
                position="relative"
                _after={
                  item.isActive
                    ? {
                        content: '""',
                        position: 'absolute',
                        bottom: '-12px',
                        left: 0,
                        right: 0,
                        height: '2px',
                        bg: 'blue.600',
                      }
                    : undefined
                }
              >
                {item.label}
              </Link>
            )
          )}
        </HStack>

        {/* Actions */}
        <HStack spacing={4}>
          {actions}

          {/* Mobile Menu Button */}
          <IconButton
            display={{ base: 'flex', md: 'none' }}
            aria-label="Open menu"
            icon={<HamburgerIcon />}
            onClick={onOpen}
            variant="ghost"
          />
        </HStack>
      </Flex>

      {/* Mobile Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader>Menu</DrawerHeader>
          <DrawerBody>
            <VStack align="stretch" spacing={4}>
              {items.map((item) => (
                <Box key={item.label}>
                  <Link
                    href={item.href}
                    onClick={(e) => {
                      handleClick(item.href)(e);
                      onClose();
                    }}
                    fontWeight={item.isActive ? 'semibold' : 'normal'}
                    color={item.isActive ? 'blue.600' : 'gray.700'}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                  {item.children && (
                    <VStack align="stretch" pl={6} mt={2} spacing={2}>
                      {item.children.map((child) => (
                        <Link
                          key={child.label}
                          href={child.href}
                          onClick={(e) => {
                            handleClick(child.href)(e);
                            onClose();
                          }}
                          fontSize="sm"
                          color="gray.600"
                        >
                          {child.label}
                        </Link>
                      ))}
                    </VStack>
                  )}
                </Box>
              ))}
            </VStack>
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};
```

## Breadcrumb Template

```typescript
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbProps,
} from '@chakra-ui/react';
import { ChevronRightIcon } from '@chakra-ui/icons';

export interface BreadcrumbItemData {
  label: string;
  href?: string;
  isCurrentPage?: boolean;
}

export interface {NavName}Props extends BreadcrumbProps {
  items: BreadcrumbItemData[];
  onNavigate?: (href: string) => void;
}

export const {NavName} = ({
  items,
  onNavigate,
  ...props
}: {NavName}Props) => {
  const handleClick = (href?: string) => (e: React.MouseEvent) => {
    if (href && onNavigate) {
      e.preventDefault();
      onNavigate(href);
    }
  };

  return (
    <Breadcrumb separator={<ChevronRightIcon color="gray.500" />} {...props}>
      {items.map((item, index) => (
        <BreadcrumbItem
          key={index}
          isCurrentPage={item.isCurrentPage || index === items.length - 1}
        >
          {item.href ? (
            <BreadcrumbLink
              href={item.href}
              onClick={handleClick(item.href)}
            >
              {item.label}
            </BreadcrumbLink>
          ) : (
            <BreadcrumbLink>{item.label}</BreadcrumbLink>
          )}
        </BreadcrumbItem>
      ))}
    </Breadcrumb>
  );
};
```

## Tabs Template

```typescript
import { ReactNode } from 'react';
import {
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  TabsProps,
} from '@chakra-ui/react';

export interface TabItem {
  label: string;
  icon?: ReactNode;
  content: ReactNode;
  isDisabled?: boolean;
}

export interface {NavName}Props extends Omit<TabsProps, 'children'> {
  tabs: TabItem[];
  defaultIndex?: number;
  onChange?: (index: number) => void;
}

export const {NavName} = ({
  tabs,
  defaultIndex = 0,
  onChange,
  ...props
}: {NavName}Props) => {
  return (
    <Tabs
      defaultIndex={defaultIndex}
      onChange={onChange}
      variant="enclosed"
      {...props}
    >
      <TabList>
        {tabs.map((tab, index) => (
          <Tab key={index} isDisabled={tab.isDisabled}>
            {tab.icon && <Box mr={2}>{tab.icon}</Box>}
            {tab.label}
          </Tab>
        ))}
      </TabList>

      <TabPanels>
        {tabs.map((tab, index) => (
          <TabPanel key={index} p={4}>
            {tab.content}
          </TabPanel>
        ))}
      </TabPanels>
    </Tabs>
  );
};
```

## Sidebar Navigation Template

```typescript
import { ReactNode } from 'react';
import {
  Box,
  VStack,
  Link,
  Text,
  Collapse,
  useDisclosure,
  Flex,
  Icon,
} from '@chakra-ui/react';
import { ChevronDownIcon, ChevronRightIcon } from '@chakra-ui/icons';

export interface SidebarItem {
  label: string;
  href?: string;
  icon?: ReactNode;
  isActive?: boolean;
  children?: SidebarItem[];
}

export interface {NavName}Props {
  items: SidebarItem[];
  onNavigate?: (href: string) => void;
}

const SidebarNavItem = ({
  item,
  onNavigate,
  level = 0,
}: {
  item: SidebarItem;
  onNavigate?: (href: string) => void;
  level?: number;
}) => {
  const { isOpen, onToggle } = useDisclosure({ defaultIsOpen: item.isActive });

  const handleClick = (e: React.MouseEvent) => {
    if (item.children) {
      onToggle();
    } else if (item.href && onNavigate) {
      e.preventDefault();
      onNavigate(item.href);
    }
  };

  return (
    <Box>
      <Link
        href={item.href}
        onClick={handleClick}
        display="flex"
        alignItems="center"
        gap={3}
        px={4}
        py={2.5}
        pl={level * 4 + 4}
        bg={item.isActive ? 'blue.50' : 'transparent'}
        color={item.isActive ? 'blue.600' : 'gray.700'}
        fontWeight={item.isActive ? 'semibold' : 'normal'}
        _hover={{
          bg: item.isActive ? 'blue.100' : 'gray.100',
          textDecoration: 'none',
        }}
        borderLeftWidth={item.isActive ? '3px' : '0'}
        borderLeftColor="blue.600"
      >
        {item.icon && <Box>{item.icon}</Box>}
        <Text flex={1}>{item.label}</Text>
        {item.children && (
          <Icon
            as={isOpen ? ChevronDownIcon : ChevronRightIcon}
            transition="transform 0.2s"
          />
        )}
      </Link>

      {item.children && (
        <Collapse in={isOpen} animateOpacity>
          <VStack align="stretch" spacing={0}>
            {item.children.map((child, index) => (
              <SidebarNavItem
                key={index}
                item={child}
                onNavigate={onNavigate}
                level={level + 1}
              />
            ))}
          </VStack>
        </Collapse>
      )}
    </Box>
  );
};

export const {NavName} = ({ items, onNavigate }: {NavName}Props) => {
  return (
    <Box as="nav" w="full">
      <VStack align="stretch" spacing={0}>
        {items.map((item, index) => (
          <SidebarNavItem key={index} item={item} onNavigate={onNavigate} />
        ))}
      </VStack>
    </Box>
  );
};
```

## Navigation Patterns

1. Top navigation bar with dropdowns for desktop, drawer for mobile
2. Breadcrumbs for hierarchical navigation
3. Tabs for section switching within a page
4. Sidebar navigation for dashboard layouts with collapsible groups

## Accessibility Features

1. Use semantic nav element
2. Add aria-current="page" for active links
3. Support keyboard navigation (Tab, Arrow keys)
4. Include aria-label for icon-only buttons
5. Ensure sufficient color contrast
6. Make hover states visible

## Best Practices

1. Indicate current/active page clearly
2. Support both href and onClick navigation (for routing libraries)
3. Make navigation responsive (hide/show based on breakpoints)
4. Use consistent spacing and sizing
5. Group related items with visual separators
6. Support nested navigation with collapse/expand
7. Add loading states for async navigation
8. Provide visual feedback on hover/focus
9. Use icons consistently across nav items
10. Close mobile menu after navigation
