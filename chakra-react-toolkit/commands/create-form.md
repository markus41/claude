---
name: create-form
description: Generate accessible forms with Chakra form controls, validation patterns, and TypeScript
argument-hint: "[form-name] [fields...]"
allowed-tools: ["Read", "Write", "Glob", "Grep"]
---

# Instructions for Claude

When this command is invoked, create a fully-typed Chakra UI form component:

1. Parse the form name and field definitions from arguments
2. Generate TypeScript interfaces for form data and props
3. Create form component with Chakra form controls
4. Include validation logic and error display
5. Add submit handler with proper typing
6. Implement accessibility features (labels, error messages, focus management)

## Form Template

```typescript
import { useState, FormEvent } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  FormErrorMessage,
  FormHelperText,
  Input,
  VStack,
  useToast,
} from '@chakra-ui/react';

export interface {FormName}Data {
  // Define form fields here
  email: string;
  password: string;
  name?: string;
}

export interface {FormName}Props {
  onSubmit: (data: {FormName}Data) => void | Promise<void>;
  initialValues?: Partial<{FormName}Data>;
  isLoading?: boolean;
}

interface FormErrors {
  [key: string]: string;
}

export const {FormName} = ({
  onSubmit,
  initialValues = {},
  isLoading = false,
}: {FormName}Props) => {
  const [formData, setFormData] = useState<{FormName}Data>({
    email: initialValues.email || '',
    password: initialValues.password || '',
    name: initialValues.name || '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const toast = useToast();

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        if (!value) return 'Email is required';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return 'Invalid email format';
        }
        return '';
      case 'password':
        if (!value) return 'Password is required';
        if (value.length < 8) return 'Password must be at least 8 characters';
        return '';
      default:
        return '';
    }
  };

  const handleChange = (field: keyof {FormName}Data) => (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const value = e.target.value;
    setFormData((prev) => ({ ...prev, [field]: value }));

    if (touched.has(field)) {
      const error = validateField(field, value);
      setErrors((prev) => ({ ...prev, [field]: error }));
    }
  };

  const handleBlur = (field: string) => () => {
    setTouched((prev) => new Set(prev).add(field));
    const value = formData[field as keyof {FormName}Data];
    const error = validateField(field, value);
    setErrors((prev) => ({ ...prev, [field]: error }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate all fields
    const newErrors: FormErrors = {};
    Object.keys(formData).forEach((key) => {
      const error = validateField(key, formData[key as keyof {FormName}Data]);
      if (error) newErrors[key] = error;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      setTouched(new Set(Object.keys(formData)));
      return;
    }

    try {
      await onSubmit(formData);
      toast({
        title: 'Success',
        description: 'Form submitted successfully',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Submission failed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit} w="full" maxW="md">
      <VStack spacing={4} align="stretch">
        <FormControl isInvalid={touched.has('email') && !!errors.email} isRequired>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={handleChange('email')}
            onBlur={handleBlur('email')}
            placeholder="you@example.com"
          />
          {errors.email && <FormErrorMessage>{errors.email}</FormErrorMessage>}
        </FormControl>

        <FormControl isInvalid={touched.has('password') && !!errors.password} isRequired>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={handleChange('password')}
            onBlur={handleBlur('password')}
          />
          {errors.password && <FormErrorMessage>{errors.password}</FormErrorMessage>}
          <FormHelperText>Must be at least 8 characters</FormHelperText>
        </FormControl>

        <FormControl isInvalid={touched.has('name') && !!errors.name}>
          <FormLabel htmlFor="name">Name (Optional)</FormLabel>
          <Input
            id="name"
            value={formData.name}
            onChange={handleChange('name')}
            onBlur={handleBlur('name')}
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isLoading}
          loadingText="Submitting"
          w="full"
          mt={4}
        >
          Submit
        </Button>
      </VStack>
    </Box>
  );
};
```

## Field Types Support

Generate appropriate Chakra inputs based on field types:
- Text: Input with type="text"
- Email: Input with type="email" and email validation
- Password: Input with type="password" and strength requirements
- Number: NumberInput component
- Select: Select component with options
- Textarea: Textarea component
- Checkbox: Checkbox component
- Radio: RadioGroup with Radio options
- Date: Input with type="date"

## Validation Patterns

1. Real-time validation on blur
2. Show errors only after field is touched
3. Re-validate on change after first blur
4. Validate all fields on submit
5. Custom validation functions per field type
6. Async validation support for API checks

## Best Practices

1. Use FormControl for each field with isRequired and isInvalid
2. Always include htmlFor on FormLabel matching Input id
3. Provide helpful FormHelperText for complex fields
4. Use FormErrorMessage for validation errors
5. Implement keyboard navigation (tab order)
6. Add ARIA attributes for screen readers
7. Show loading state during submission
8. Handle both sync and async onSubmit
9. Provide toast feedback for success/error
10. Support controlled component pattern with initialValues
