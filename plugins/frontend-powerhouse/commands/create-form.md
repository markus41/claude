---
name: create-form
description: Generate validated form with React Hook Form, Zod schema, and Chakra UI
argument-hint: form-name [fields...]
allowed-tools:
  - Write
  - Read
  - Edit
  - Bash
---

# Create Form Command

You are being invoked as the `/create-form` slash command for the frontend-powerhouse plugin.

## Your Task

Generate a fully-validated form component using React Hook Form + Zod validation + Chakra UI components. Use the **form-validation-architect** agent to create production-ready forms.

## Arguments

- **form-name** (required): Name of the form (e.g., "LoginForm", "RegistrationForm", "ContactForm")
- **fields** (optional): Space or comma-separated field definitions in format `name:type`
  - Types: text|email|password|number|tel|url|textarea|select|checkbox|radio|date|file
  - Example: `email:email password:password remember:checkbox`

If no fields provided, the agent will create a generic form structure that can be customized.

## Instructions

1. **Activate the form-validation-architect agent** via the Task tool
2. Parse the field definitions to understand form structure
3. The agent will create:
   - Zod schema with comprehensive validation rules
   - React Hook Form integration with TypeScript types
   - Chakra UI form components with error states
   - Accessible form with proper ARIA attributes
   - Submit handler with error handling
   - Example usage in Storybook
4. Follow form best practices (validation, accessibility, UX)

## Expected Output Structure

```
src/components/{FormName}/
├── index.ts                           # Barrel export
├── {FormName}.tsx                     # Form component
├── schema.ts                          # Zod validation schema
├── types.ts                           # TypeScript types
├── __tests__/
│   └── {FormName}.test.tsx           # Form tests
└── {FormName}.stories.tsx            # Storybook story
```

## Field Type Mapping

| Field Type | Chakra Component | Zod Validation |
|------------|------------------|----------------|
| text       | Input            | z.string()     |
| email      | Input type="email" | z.string().email() |
| password   | Input type="password" | z.string().min(8) |
| number     | NumberInput      | z.number()     |
| tel        | Input type="tel" | z.string().regex() |
| url        | Input type="url" | z.string().url() |
| textarea   | Textarea         | z.string()     |
| select     | Select           | z.enum()       |
| checkbox   | Checkbox         | z.boolean()    |
| radio      | RadioGroup       | z.enum()       |
| date       | Input type="date" | z.date()      |
| file       | Input type="file" | z.instanceof() |

## Usage Examples

```bash
# Create login form
/create-form LoginForm email:email password:password remember:checkbox

# Create registration form
/create-form RegistrationForm name:text email:email password:password confirmPassword:password agree:checkbox

# Create contact form
/create-form ContactForm name:text email:email subject:text message:textarea

# Create profile form
/create-form ProfileForm firstName:text lastName:text bio:textarea avatar:file birthdate:date

# Create generic form (customize later)
/create-form SettingsForm
```

## Example Output

### Zod Schema
```typescript
// schema.ts
import { z } from 'zod';

export const loginFormSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  remember: z.boolean().optional(),
});

export type LoginFormData = z.infer<typeof loginFormSchema>;
```

### Form Component
```tsx
// LoginForm.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  FormControl,
  FormLabel,
  FormErrorMessage,
  Input,
  Checkbox,
  Button,
  VStack,
} from '@chakra-ui/react';
import { loginFormSchema, LoginFormData } from './schema';

export interface LoginFormProps {
  onSubmit: (data: LoginFormData) => void | Promise<void>;
  isLoading?: boolean;
}

export function LoginForm({ onSubmit, isLoading }: LoginFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginFormSchema),
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <VStack spacing={4} align="stretch">
        <FormControl isInvalid={!!errors.email}>
          <FormLabel htmlFor="email">Email</FormLabel>
          <Input
            id="email"
            type="email"
            {...register('email')}
            aria-describedby="email-error"
          />
          <FormErrorMessage id="email-error">
            {errors.email?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl isInvalid={!!errors.password}>
          <FormLabel htmlFor="password">Password</FormLabel>
          <Input
            id="password"
            type="password"
            {...register('password')}
            aria-describedby="password-error"
          />
          <FormErrorMessage id="password-error">
            {errors.password?.message}
          </FormErrorMessage>
        </FormControl>

        <FormControl>
          <Checkbox {...register('remember')}>Remember me</Checkbox>
        </FormControl>

        <Button
          type="submit"
          colorScheme="brand"
          isLoading={isLoading || isSubmitting}
        >
          Sign In
        </Button>
      </VStack>
    </form>
  );
}
```

## Validation Features

The generated form should include:

### Built-in Validations
- **Required fields**: Proper error messages
- **Email validation**: RFC 5322 compliant
- **Password strength**: Minimum length, complexity rules
- **URL validation**: Valid URL format
- **Phone validation**: International format support
- **File validation**: Size, type restrictions

### Custom Validations
```typescript
// Example custom validation
z.string().refine(
  (val) => val !== 'admin',
  { message: 'Username cannot be "admin"' }
)

// Password confirmation
z.object({
  password: z.string().min(8),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});
```

## Accessibility Requirements

- Proper `<label>` association with inputs
- ARIA attributes for error messages
- Focus management on validation errors
- Keyboard navigation support
- Screen reader announcements for errors
- Clear error message formatting

## Delegation Pattern

```typescript
// Use Task tool to delegate to form-validation-architect
task: {
  agent: "form-validation-architect",
  prompt: `Create form "${formName}" with fields: ${fields.join(', ')}. Include React Hook Form, Zod validation, and Chakra UI components.`,
  model: "sonnet"
}
```

## Additional Features

The agent may optionally add:
- Multi-step form wizard
- Conditional field rendering
- Async validation (API calls)
- Auto-save draft functionality
- Field-level validation on blur
- Success/error toast notifications

After form creation, the agent should:
1. Create comprehensive tests for validation
2. Generate Storybook stories showing all states
3. Document usage examples
4. Verify form is accessible
