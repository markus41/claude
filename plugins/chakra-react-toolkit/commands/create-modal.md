---
name: create-modal
description: Generate Modal, Drawer, or AlertDialog with Chakra UI and focus management
argument-hint: "[component-name] [type: modal|drawer|alert]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create an accessible overlay component with Chakra UI:

1. Parse component name and type (modal, drawer, or alert dialog)
2. Generate TypeScript component with proper focus management
3. Include accessibility features (aria-labels, focus trap, ESC to close)
4. Add customizable header, body, footer sections
5. Implement controlled open/close state
6. Support different sizes and placements

## Modal Template

```typescript
import { ReactNode, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  useDisclosure,
  ModalProps,
} from '@chakra-ui/react';

export interface {ComponentName}Props extends Omit<ModalProps, 'isOpen' | 'onClose' | 'children'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  closeButtonLabel?: string;
  primaryAction?: {
    label: string;
    onClick: () => void | Promise<void>;
    colorScheme?: string;
    isLoading?: boolean;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

export const {ComponentName} = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  closeButtonLabel = 'Close',
  primaryAction,
  secondaryAction,
  size = 'md',
  ...props
}: {ComponentName}Props) => {
  const initialRef = useRef<HTMLButtonElement>(null);
  const finalRef = useRef<HTMLButtonElement>(null);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size={size}
      initialFocusRef={initialRef}
      finalFocusRef={finalRef}
      isCentered
      {...props}
    >
      <ModalOverlay bg="blackAlpha.300" backdropFilter="blur(10px)" />
      <ModalContent>
        <ModalHeader>{title}</ModalHeader>
        <ModalCloseButton />

        <ModalBody pb={6}>{children}</ModalBody>

        <ModalFooter>
          {footer || (
            <>
              {secondaryAction && (
                <Button variant="ghost" mr={3} onClick={secondaryAction.onClick}>
                  {secondaryAction.label}
                </Button>
              )}
              {primaryAction ? (
                <Button
                  ref={initialRef}
                  colorScheme={primaryAction.colorScheme || 'blue'}
                  onClick={primaryAction.onClick}
                  isLoading={primaryAction.isLoading}
                >
                  {primaryAction.label}
                </Button>
              ) : (
                <Button ref={initialRef} onClick={onClose}>
                  {closeButtonLabel}
                </Button>
              )}
            </>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

// Hook for managing modal state
export const use{ComponentName} = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return {
    isOpen,
    onOpen,
    onClose,
  };
};
```

## Drawer Template

```typescript
import { ReactNode, useRef } from 'react';
import {
  Drawer,
  DrawerBody,
  DrawerFooter,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  Button,
  useDisclosure,
  DrawerProps,
} from '@chakra-ui/react';

export interface {ComponentName}Props extends Omit<DrawerProps, 'isOpen' | 'onClose' | 'children'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  placement?: 'left' | 'right' | 'top' | 'bottom';
}

export const {ComponentName} = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  placement = 'right',
  size = 'md',
  ...props
}: {ComponentName}Props) => {
  const btnRef = useRef<HTMLButtonElement>(null);

  return (
    <Drawer
      isOpen={isOpen}
      placement={placement}
      onClose={onClose}
      finalFocusRef={btnRef}
      size={size}
      {...props}
    >
      <DrawerOverlay />
      <DrawerContent>
        <DrawerCloseButton />
        <DrawerHeader borderBottomWidth="1px">{title}</DrawerHeader>

        <DrawerBody>{children}</DrawerBody>

        {footer && <DrawerFooter borderTopWidth="1px">{footer}</DrawerFooter>}
      </DrawerContent>
    </Drawer>
  );
};

export const use{ComponentName} = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return { isOpen, onOpen, onClose };
};
```

## AlertDialog Template

```typescript
import { ReactNode, useRef } from 'react';
import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogContent,
  AlertDialogOverlay,
  AlertDialogProps,
  Button,
  useDisclosure,
} from '@chakra-ui/react';

export interface {ComponentName}Props extends Omit<AlertDialogProps, 'isOpen' | 'onClose' | 'leastDestructiveRef' | 'children'> {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void | Promise<void>;
  isLoading?: boolean;
  colorScheme?: string;
}

export const {ComponentName} = ({
  isOpen,
  onClose,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  isLoading = false,
  colorScheme = 'red',
  ...props
}: {ComponentName}Props) => {
  const cancelRef = useRef<HTMLButtonElement>(null);

  const handleConfirm = async () => {
    await onConfirm();
    onClose();
  };

  return (
    <AlertDialog
      isOpen={isOpen}
      leastDestructiveRef={cancelRef}
      onClose={onClose}
      isCentered
      {...props}
    >
      <AlertDialogOverlay>
        <AlertDialogContent>
          <AlertDialogHeader fontSize="lg" fontWeight="bold">
            {title}
          </AlertDialogHeader>

          <AlertDialogBody>{description}</AlertDialogBody>

          <AlertDialogFooter>
            <Button ref={cancelRef} onClick={onClose} isDisabled={isLoading}>
              {cancelLabel}
            </Button>
            <Button
              colorScheme={colorScheme}
              onClick={handleConfirm}
              ml={3}
              isLoading={isLoading}
            >
              {confirmLabel}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialogOverlay>
    </AlertDialog>
  );
};

export const use{ComponentName} = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  return { isOpen, onOpen, onClose };
};
```

## Focus Management

1. Use initialFocusRef to set focus on modal open
2. Use finalFocusRef to return focus on close
3. Use leastDestructiveRef for AlertDialog cancel button
4. Implement keyboard navigation (Tab, ESC)
5. Trap focus within modal when open

## Size Options

Support Chakra's size variants:
- Modal: xs, sm, md, lg, xl, full
- Drawer: xs, sm, md, lg, xl, full
- AlertDialog: xs, sm, md, lg, xl

## Best Practices

1. Always provide title for accessibility
2. Use ModalCloseButton for easy dismissal
3. Implement ESC key to close (default in Chakra)
4. Add backdrop blur for visual depth
5. Center modals with isCentered
6. Use appropriate colorScheme for actions (red for destructive)
7. Show loading state during async operations
8. Provide custom hook for state management
9. Support custom footer for flexibility
10. Include proper ARIA labels and roles
11. Close modal after successful action completion
12. Disable actions during loading state
