---
name: create-toast
description: Generate toast notifications and alert systems using Chakra UI's useToast hook
argument-hint: "[toast-name] [type: basic|custom|promise]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a toast notification system with Chakra UI:

1. Parse toast component name and type from arguments
2. Generate TypeScript hook or component wrapper for useToast
3. Include preset configurations for common use cases
4. Support custom toast content and styling
5. Implement promise-based toasts for async operations
6. Add accessibility features

## Basic Toast Hook Template

```typescript
import { useToast, UseToastOptions } from '@chakra-ui/react';

export interface {ToastName}Options extends UseToastOptions {
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  isClosable?: boolean;
}

export const use{ToastName} = () => {
  const toast = useToast();

  const showToast = ({
    title,
    description,
    status = 'info',
    duration = 5000,
    isClosable = true,
    ...options
  }: {ToastName}Options) => {
    toast({
      title,
      description,
      status,
      duration,
      isClosable,
      position: 'top-right',
      variant: 'subtle',
      ...options,
    });
  };

  const success = (title: string, description?: string) => {
    showToast({ title, description, status: 'success' });
  };

  const error = (title: string, description?: string) => {
    showToast({ title, description, status: 'error', duration: 7000 });
  };

  const warning = (title: string, description?: string) => {
    showToast({ title, description, status: 'warning' });
  };

  const info = (title: string, description?: string) => {
    showToast({ title, description, status: 'info' });
  };

  const promise = async <T,>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string;
      error: string;
    }
  ): Promise<T> => {
    const loadingToast = toast({
      title: messages.loading,
      status: 'info',
      duration: null,
      isClosable: false,
      position: 'top-right',
    });

    try {
      const result = await promise;
      toast.close(loadingToast);
      toast({
        title: messages.success,
        status: 'success',
        duration: 5000,
        isClosable: true,
        position: 'top-right',
      });
      return result;
    } catch (err) {
      toast.close(loadingToast);
      toast({
        title: messages.error,
        description: err instanceof Error ? err.message : 'An error occurred',
        status: 'error',
        duration: 7000,
        isClosable: true,
        position: 'top-right',
      });
      throw err;
    }
  };

  return {
    show: showToast,
    success,
    error,
    warning,
    info,
    promise,
    close: toast.close,
    closeAll: toast.closeAll,
    isActive: toast.isActive,
  };
};
```

## Custom Toast Component Template

```typescript
import { ReactNode } from 'react';
import {
  useToast,
  Box,
  HStack,
  VStack,
  Text,
  IconButton,
  Icon,
} from '@chakra-ui/react';
import {
  CloseIcon,
  CheckCircleIcon,
  WarningIcon,
  InfoIcon,
} from '@chakra-ui/icons';

export interface CustomToastProps {
  id: string | number;
  title: string;
  description?: string;
  status?: 'success' | 'error' | 'warning' | 'info';
  onClose: () => void;
  action?: {
    label: string;
    onClick: () => void;
  };
}

const statusConfig = {
  success: {
    icon: CheckCircleIcon,
    bg: 'green.500',
    color: 'white',
  },
  error: {
    icon: WarningIcon,
    bg: 'red.500',
    color: 'white',
  },
  warning: {
    icon: WarningIcon,
    bg: 'orange.500',
    color: 'white',
  },
  info: {
    icon: InfoIcon,
    bg: 'blue.500',
    color: 'white',
  },
};

export const {ToastName}Component = ({
  id,
  title,
  description,
  status = 'info',
  onClose,
  action,
}: CustomToastProps) => {
  const config = statusConfig[status];

  return (
    <Box
      bg={config.bg}
      color={config.color}
      p={4}
      borderRadius="md"
      boxShadow="lg"
      maxW="md"
      minW="300px"
    >
      <HStack align="start" spacing={3}>
        <Icon as={config.icon} boxSize={5} mt={0.5} />

        <VStack align="stretch" spacing={1} flex={1}>
          <Text fontWeight="bold" fontSize="md">
            {title}
          </Text>
          {description && (
            <Text fontSize="sm" opacity={0.9}>
              {description}
            </Text>
          )}
          {action && (
            <Box
              as="button"
              onClick={action.onClick}
              fontSize="sm"
              fontWeight="semibold"
              textDecoration="underline"
              textAlign="left"
              mt={2}
              _hover={{ opacity: 0.8 }}
            >
              {action.label}
            </Box>
          )}
        </VStack>

        <IconButton
          aria-label="Close notification"
          icon={<CloseIcon />}
          size="sm"
          variant="ghost"
          color={config.color}
          onClick={onClose}
          _hover={{ bg: 'whiteAlpha.300' }}
        />
      </HStack>
    </Box>
  );
};

export const use{ToastName} = () => {
  const toast = useToast();

  const showCustomToast = ({
    title,
    description,
    status = 'info',
    duration = 5000,
    action,
  }: Omit<CustomToastProps, 'id' | 'onClose'>) => {
    toast({
      position: 'top-right',
      duration,
      render: ({ id, onClose }) => (
        <{ToastName}Component
          id={id}
          title={title}
          description={description}
          status={status}
          onClose={onClose}
          action={action}
        />
      ),
    });
  };

  return {
    show: showCustomToast,
    close: toast.close,
    closeAll: toast.closeAll,
  };
};
```

## Promise Toast Template

```typescript
import { useToast } from '@chakra-ui/react';

export interface PromiseToastConfig<T> {
  promise: Promise<T>;
  loading: {
    title: string;
    description?: string;
  };
  success: {
    title: string;
    description?: string | ((data: T) => string);
  };
  error: {
    title: string;
    description?: string | ((error: Error) => string);
  };
}

export const use{ToastName} = () => {
  const toast = useToast();

  const promiseToast = async <T,>({
    promise,
    loading,
    success,
    error,
  }: PromiseToastConfig<T>): Promise<T> => {
    const toastId = toast({
      title: loading.title,
      description: loading.description,
      status: 'loading',
      duration: null,
      isClosable: false,
      position: 'bottom-right',
    });

    try {
      const data = await promise;

      toast.update(toastId, {
        title: success.title,
        description:
          typeof success.description === 'function'
            ? success.description(data)
            : success.description,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      return data;
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error');

      toast.update(toastId, {
        title: error.title,
        description:
          typeof error.description === 'function'
            ? error.description(errorObj)
            : error.description || errorObj.message,
        status: 'error',
        duration: 7000,
        isClosable: true,
      });

      throw err;
    }
  };

  return {
    promise: promiseToast,
  };
};

// Usage Example:
// const { promise } = use{ToastName}();
//
// const handleSubmit = async () => {
//   await promise({
//     promise: api.submitForm(data),
//     loading: {
//       title: 'Submitting form...',
//       description: 'Please wait',
//     },
//     success: {
//       title: 'Form submitted',
//       description: (data) => `Submitted with ID: ${data.id}`,
//     },
//     error: {
//       title: 'Submission failed',
//       description: (err) => err.message,
//     },
//   });
// };
```

## Toast Queue Manager Template

```typescript
import { useToast, UseToastOptions } from '@chakra-ui/react';
import { useRef } from 'react';

export interface ToastQueueItem extends UseToastOptions {
  id?: string;
  title: string;
  description?: string;
}

export const use{ToastName} = () => {
  const toast = useToast();
  const queueRef = useRef<ToastQueueItem[]>([]);
  const processingRef = useRef(false);

  const processQueue = async () => {
    if (processingRef.current || queueRef.current.length === 0) return;

    processingRef.current = true;
    const item = queueRef.current.shift();

    if (item) {
      toast({
        position: 'top',
        duration: 3000,
        isClosable: true,
        ...item,
      });

      // Wait for toast duration before showing next
      await new Promise((resolve) => setTimeout(resolve, 3500));
    }

    processingRef.current = false;
    if (queueRef.current.length > 0) {
      processQueue();
    }
  };

  const addToQueue = (item: ToastQueueItem) => {
    queueRef.current.push(item);
    processQueue();
  };

  const clearQueue = () => {
    queueRef.current = [];
    toast.closeAll();
  };

  return {
    add: addToQueue,
    clear: clearQueue,
    getQueueLength: () => queueRef.current.length,
  };
};
```

## Toast Positions

Configure toast position:
- top, top-left, top-right
- bottom, bottom-left, bottom-right

## Toast Variants

- subtle: Light colored background
- solid: Bold colored background
- left-accent: Left border with accent color
- top-accent: Top border with accent color

## Best Practices

1. Use appropriate status colors (success=green, error=red)
2. Set reasonable durations (5s for info, 7s for errors)
3. Make toasts dismissible with close button
4. Position toasts consistently (top-right or bottom-right)
5. Limit simultaneous toasts to avoid clutter
6. Include actionable buttons when relevant
7. Use promise toasts for async operations
8. Provide meaningful titles and descriptions
9. Update toast content for long-running operations
10. Test with screen readers for accessibility
11. Avoid toasts for critical errors (use modals instead)
12. Queue toasts to prevent overlap
