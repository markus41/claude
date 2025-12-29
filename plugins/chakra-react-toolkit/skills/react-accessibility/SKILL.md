# React Accessibility with Chakra UI

This skill activates when implementing accessible React applications, ensuring WCAG 2.1 AA compliance, managing keyboard navigation, adding ARIA attributes, or leveraging Chakra UI's built-in accessibility features. It provides comprehensive guidance on focus management, screen reader support, semantic HTML, and testing for accessibility.

## Accessibility Fundamentals

### WCAG 2.1 Compliance

Ensure your application meets Web Content Accessibility Guidelines Level AA:

**Perceivable:** Information must be presentable to users in ways they can perceive.
- Provide text alternatives for non-text content
- Provide captions and alternatives for multimedia
- Create content that can be presented in different ways
- Make it easier for users to see and hear content

**Operable:** User interface components must be operable.
- Make all functionality available from keyboard
- Give users enough time to read and use content
- Do not design content that causes seizures
- Help users navigate and find content

**Understandable:** Information and operation must be understandable.
- Make text readable and understandable
- Make content appear and operate in predictable ways
- Help users avoid and correct mistakes

**Robust:** Content must be robust enough to work with assistive technologies.
- Maximize compatibility with current and future tools

### Semantic HTML

Use semantic HTML elements for proper document structure and screen reader navigation:

```tsx
import { Box, Container, Heading, Text } from '@chakra-ui/react';

// Use semantic HTML with 'as' prop
<Box as="main" role="main">
  <Container maxW="container.lg">
    <Box as="article">
      <Heading as="h1" size="2xl" mb={4}>
        Article Title
      </Heading>

      <Box as="section" mb={8}>
        <Heading as="h2" size="xl" mb={3}>
          Section Heading
        </Heading>
        <Text as="p">
          Section content with proper paragraph structure.
        </Text>
      </Box>

      <Box as="aside" borderLeft="4px" borderColor="blue.500" pl={4}>
        <Text>Complementary information</Text>
      </Box>
    </Box>
  </Container>
</Box>

// Navigation with proper semantics
<Box as="nav" role="navigation" aria-label="Main navigation">
  <Box as="ul" listStyleType="none" display="flex" gap={4}>
    <Box as="li">
      <Link href="/">Home</Link>
    </Box>
    <Box as="li">
      <Link href="/about">About</Link>
    </Box>
  </Box>
</Box>

// Skip to content link
<Link
  href="#main-content"
  position="absolute"
  left="-999px"
  _focus={{
    left: 4,
    top: 4,
    zIndex: 9999,
    bg: 'white',
    p: 2,
  }}
>
  Skip to main content
</Link>
<Box id="main-content" as="main" tabIndex={-1}>
  {/* Main content */}
</Box>
```

## Keyboard Navigation

### Focus Management

Implement proper keyboard navigation and focus management:

```tsx
import { useRef, useEffect } from 'react';
import {
  Box,
  Button,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  useDisclosure,
} from '@chakra-ui/react';

// Focus trap in modal (Chakra handles this automatically)
function AccessibleModal() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const initialRef = useRef(null);
  const finalRef = useRef(null);

  return (
    <>
      <Button ref={finalRef} onClick={onOpen}>
        Open Modal
      </Button>

      <Modal
        isOpen={isOpen}
        onClose={onClose}
        initialFocusRef={initialRef}
        finalFocusRef={finalRef}
      >
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Modal Title</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Input
              ref={initialRef}
              placeholder="Focus moves here on open"
            />
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
}

// Focus management on route change
function FocusOnRouteChange() {
  const mainRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Focus main content after route change
    mainRef.current?.focus();
  }, [location.pathname]);

  return (
    <Box
      ref={mainRef}
      as="main"
      tabIndex={-1}
      outline="none"
    >
      {/* Page content */}
    </Box>
  );
}

// Custom focus visible styles
<Button
  _focusVisible={{
    outline: '2px solid',
    outlineColor: 'blue.500',
    outlineOffset: '2px',
  }}
>
  Accessible Button
</Button>
```

### Keyboard Shortcuts

Implement keyboard shortcuts with proper ARIA announcements:

```tsx
import { useEffect } from 'react';
import { useToast } from '@chakra-ui/react';

function KeyboardShortcuts() {
  const toast = useToast();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Command/Ctrl + K for search
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        // Open search modal
        toast({
          title: 'Search opened',
          description: 'Press Escape to close',
          status: 'info',
          duration: 2000,
        });
      }

      // Escape to close
      if (e.key === 'Escape') {
        // Close modal/dialog
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toast]);

  return (
    <Box>
      {/* Include keyboard shortcuts guide */}
      <Box
        as="section"
        aria-label="Keyboard shortcuts"
        display="none"
        _focus={{ display: 'block' }}
      >
        <Heading size="md">Keyboard Shortcuts</Heading>
        <Box as="dl">
          <Box as="dt">Cmd/Ctrl + K</Box>
          <Box as="dd">Open search</Box>
          <Box as="dt">Escape</Box>
          <Box as="dd">Close modal</Box>
        </Box>
      </Box>
    </Box>
  );
}
```

### Tab Order and Focus Trap

Manage tab order and implement focus traps:

```tsx
import { useRef, useEffect } from 'react';

function FocusTrap({ children, isActive }: { children: React.ReactNode; isActive: boolean }) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => container.removeEventListener('keydown', handleTabKey);
  }, [isActive]);

  return (
    <Box ref={containerRef}>
      {children}
    </Box>
  );
}

// Usage in drawer or sidebar
<FocusTrap isActive={isOpen}>
  <Box>
    <Button onClick={onClose}>Close</Button>
    <Input placeholder="First focusable element" />
    <Button>Submit</Button>
  </Box>
</FocusTrap>
```

## ARIA Attributes

### ARIA Labels and Descriptions

Use ARIA attributes to provide context for assistive technologies:

```tsx
import { IconButton, Button, Box, Input } from '@chakra-ui/react';
import { SearchIcon, CloseIcon } from '@chakra-ui/icons';

// Icon buttons need aria-label
<IconButton
  aria-label="Search"
  icon={<SearchIcon />}
  onClick={handleSearch}
/>

<IconButton
  aria-label="Close modal"
  icon={<CloseIcon />}
  onClick={onClose}
/>

// Buttons with visible text don't need aria-label
<Button onClick={handleSubmit}>
  Submit Form
</Button>

// Descriptive text with aria-describedby
<Box>
  <Input
    id="email"
    aria-describedby="email-helper"
    placeholder="Email address"
  />
  <Text id="email-helper" fontSize="sm" color="gray.600">
    We'll never share your email with anyone else.
  </Text>
</Box>

// Loading state
<Button
  isLoading
  loadingText="Submitting"
  aria-busy="true"
  aria-live="polite"
>
  Submit
</Button>

// Error messages
<Box>
  <Input
    id="username"
    isInvalid={!!error}
    aria-invalid={!!error}
    aria-describedby="username-error"
  />
  {error && (
    <Text
      id="username-error"
      color="red.500"
      role="alert"
      aria-live="assertive"
    >
      {error}
    </Text>
  )}
</Box>
```

### ARIA Live Regions

Announce dynamic content changes to screen readers:

```tsx
import { Box, useToast } from '@chakra-ui/react';

// Status messages
<Box
  role="status"
  aria-live="polite"
  aria-atomic="true"
  position="absolute"
  left="-10000px"
  width="1px"
  height="1px"
  overflow="hidden"
>
  {statusMessage}
</Box>

// Alert messages (urgent)
<Box
  role="alert"
  aria-live="assertive"
  aria-atomic="true"
>
  {errorMessage}
</Box>

// Use Chakra's toast for announcements
function AccessibleToast() {
  const toast = useToast();

  const showToast = () => {
    toast({
      title: 'Action completed',
      description: 'Your changes have been saved.',
      status: 'success',
      duration: 5000,
      isClosable: true,
      // Toast automatically includes proper ARIA
    });
  };

  return <Button onClick={showToast}>Save</Button>;
}

// Loading spinner with announcement
<Box>
  <Spinner />
  <Box
    as="span"
    position="absolute"
    left="-10000px"
    aria-live="polite"
    aria-busy="true"
  >
    Loading content...
  </Box>
</Box>
```

### ARIA Expanded and Controls

Manage disclosure widgets and expandable content:

```tsx
import { useState } from 'react';
import { Box, Button, Collapse } from '@chakra-ui/react';

// Accordion pattern
function AccessibleAccordion() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Box>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="accordion-content"
        rightIcon={isOpen ? <ChevronUpIcon /> : <ChevronDownIcon />}
      >
        Toggle Section
      </Button>

      <Collapse in={isOpen}>
        <Box id="accordion-content" p={4}>
          Collapsible content
        </Box>
      </Collapse>
    </Box>
  );
}

// Dropdown menu
function AccessibleMenu() {
  const { isOpen, onToggle } = useDisclosure();

  return (
    <Box position="relative">
      <Button
        onClick={onToggle}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-controls="dropdown-menu"
      >
        Menu
      </Button>

      {isOpen && (
        <Box
          id="dropdown-menu"
          role="menu"
          position="absolute"
          bg="white"
          shadow="lg"
          borderRadius="md"
          p={2}
        >
          <Button
            role="menuitem"
            variant="ghost"
            w="full"
            justifyContent="flex-start"
          >
            Option 1
          </Button>
          <Button
            role="menuitem"
            variant="ghost"
            w="full"
            justifyContent="flex-start"
          >
            Option 2
          </Button>
        </Box>
      )}
    </Box>
  );
}
```

## Chakra UI Built-in Accessibility

### Accessible Form Controls

Leverage Chakra's built-in form accessibility:

```tsx
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  Select,
  Checkbox,
  Radio,
  RadioGroup,
  Stack,
} from '@chakra-ui/react';

// Form with proper labeling
<FormControl id="email" isRequired isInvalid={!!emailError}>
  <FormLabel>Email address</FormLabel>
  <Input
    type="email"
    value={email}
    onChange={(e) => setEmail(e.target.value)}
  />
  <FormHelperText>We'll never share your email.</FormHelperText>
  {emailError && (
    <FormErrorMessage>{emailError}</FormErrorMessage>
  )}
</FormControl>

// Select with proper labeling
<FormControl id="country">
  <FormLabel>Country</FormLabel>
  <Select placeholder="Select country">
    <option value="us">United States</option>
    <option value="ca">Canada</option>
    <option value="mx">Mexico</option>
  </Select>
</FormControl>

// Radio group
<FormControl as="fieldset">
  <FormLabel as="legend">Notification preference</FormLabel>
  <RadioGroup defaultValue="email">
    <Stack spacing={4}>
      <Radio value="email">Email</Radio>
      <Radio value="sms">SMS</Radio>
      <Radio value="both">Both</Radio>
    </Stack>
  </RadioGroup>
</FormControl>

// Checkbox with description
<Checkbox defaultChecked>
  I agree to the{' '}
  <Link href="/terms" textDecoration="underline">
    terms and conditions
  </Link>
</Checkbox>
```

### Accessible Buttons and Links

Use appropriate components for actions:

```tsx
import { Button, Link, IconButton } from '@chakra-ui/react';
import { ExternalLinkIcon } from '@chakra-ui/icons';

// Button for actions (no href)
<Button onClick={handleSubmit} isLoading={isSubmitting}>
  Submit
</Button>

// Link for navigation (has href)
<Button as="a" href="/page">
  Go to Page
</Button>

// External link
<Link href="https://example.com" isExternal>
  External Site <ExternalLinkIcon mx="2px" />
</Link>

// Disabled state with explanation
<Tooltip label="Complete the form to enable">
  <Button isDisabled>
    Submit
  </Button>
</Tooltip>

// Icon button with label
<IconButton
  aria-label="Delete item"
  icon={<DeleteIcon />}
  colorScheme="red"
  variant="ghost"
/>
```

### Accessible Modals and Dialogs

Use Chakra's modal components with proper ARIA:

```tsx
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
} from '@chakra-ui/react';

// Standard modal
<Modal isOpen={isOpen} onClose={onClose}>
  <ModalOverlay />
  <ModalContent>
    <ModalHeader>Modal Title</ModalHeader>
    <ModalCloseButton />
    <ModalBody>
      Modal content
    </ModalBody>
    <ModalFooter>
      <Button onClick={onClose}>Close</Button>
    </ModalFooter>
  </ModalContent>
</Modal>

// Alert dialog for destructive actions
<AlertDialog
  isOpen={isOpen}
  leastDestructiveRef={cancelRef}
  onClose={onClose}
>
  <AlertDialogOverlay>
    <AlertDialogContent>
      <AlertDialogHeader>Delete Account</AlertDialogHeader>
      <AlertDialogBody>
        Are you sure? This action cannot be undone.
      </AlertDialogBody>
      <AlertDialogFooter>
        <Button ref={cancelRef} onClick={onClose}>
          Cancel
        </Button>
        <Button colorScheme="red" onClick={handleDelete} ml={3}>
          Delete
        </Button>
      </AlertDialogFooter>
    </AlertDialogContent>
  </AlertDialogOverlay>
</AlertDialog>
```

## Color and Contrast

### WCAG Color Contrast

Ensure sufficient color contrast (4.5:1 for normal text, 3:1 for large text):

```tsx
import { Box, Text, useColorModeValue } from '@chakra-ui/react';

// High contrast text
<Box bg="blue.600">
  <Text color="white" fontSize="md">
    {/* 7:1 contrast ratio - AAA compliant */}
    High contrast text
  </Text>
</Box>

// Use Chakra's color tokens for accessible combinations
<Box bg="gray.100">
  <Text color="gray.900">
    {/* Meets WCAG AA */}
    Dark text on light background
  </Text>
</Box>

// Avoid low contrast
// ❌ Bad: gray.400 on white (2.6:1)
// ✅ Good: gray.600 on white (4.7:1)
<Text color="gray.600">Accessible text</Text>

// Test contrast programmatically
const bgColor = useColorModeValue('white', 'gray.800');
const textColor = useColorModeValue('gray.900', 'white');

<Box bg={bgColor}>
  <Text color={textColor}>
    Auto-adjusting for color mode
  </Text>
</Box>
```

### Color Blind Friendly

Don't rely solely on color to convey information:

```tsx
// Use icons with color
<HStack spacing={2}>
  <CheckIcon color="green.500" />
  <Text>Success</Text>
</HStack>

<HStack spacing={2}>
  <WarningIcon color="red.500" />
  <Text>Error</Text>
</HStack>

// Use patterns with color
<Box
  bg="green.500"
  border="2px solid"
  borderColor="green.700"
  p={4}
>
  <HStack>
    <CheckIcon />
    <Text color="white">Success message</Text>
  </HStack>
</Box>

// Accessible status indicators
<Badge
  colorScheme="green"
  leftIcon={<CheckIcon />}
>
  Active
</Badge>

<Badge
  colorScheme="red"
  leftIcon={<WarningIcon />}
>
  Inactive
</Badge>
```

## Testing Accessibility

### Manual Testing Checklist

Perform these manual accessibility tests:

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Ensure focus visible on all elements
   - Test Escape key to close modals
   - Verify Enter/Space activate buttons

2. **Screen Reader Testing**
   - Test with NVDA (Windows) or VoiceOver (Mac)
   - Ensure all content is announced
   - Verify landmarks are properly identified
   - Check form field labels are announced

3. **Zoom Testing**
   - Test at 200% zoom
   - Ensure no horizontal scrolling
   - Verify content doesn't overlap

4. **Color Contrast**
   - Use browser dev tools to check contrast
   - Test in dark mode if applicable
   - Verify focus indicators are visible

### Automated Testing with jest-axe

Use jest-axe for automated accessibility testing:

```tsx
// Install: npm install --save-dev jest-axe

import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChakraProvider } from '@chakra-ui/react';

expect.extend(toHaveNoViolations);

describe('Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ChakraProvider>
        <YourComponent />
      </ChakraProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('form should be accessible', async () => {
    const { container } = render(
      <ChakraProvider>
        <FormControl id="email">
          <FormLabel>Email</FormLabel>
          <Input type="email" />
        </FormControl>
      </ChakraProvider>
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

### Testing Focus Management

Test keyboard navigation and focus:

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

describe('Focus Management', () => {
  it('should trap focus in modal', async () => {
    const user = userEvent.setup();

    render(
      <Modal isOpen onClose={onClose}>
        <ModalContent>
          <Button id="first">First</Button>
          <Button id="last">Last</Button>
        </ModalContent>
      </Modal>
    );

    const firstButton = screen.getByRole('button', { name: /first/i });
    const lastButton = screen.getByRole('button', { name: /last/i });

    // Focus should start on first element
    expect(firstButton).toHaveFocus();

    // Tab to last element
    await user.tab();
    expect(lastButton).toHaveFocus();

    // Tab should cycle back to first
    await user.tab();
    expect(firstButton).toHaveFocus();
  });
});
```

Use these accessibility patterns consistently to create inclusive applications that work for all users, including those using assistive technologies.
