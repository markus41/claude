/**
 * TextInput Component Tests
 *
 * Comprehensive test coverage for TextInput field component including
 * validation, accessibility, and keyboard navigation scenarios.
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput } from './TextInput';

// Test wrapper component with React Hook Form
const TestWrapper: React.FC<{
  schema?: z.ZodType;
  defaultValues?: Record<string, unknown>;
  onSubmit?: (data: unknown) => void;
  children: (control: any) => React.ReactNode;
}> = ({ schema, defaultValues = {}, onSubmit = vi.fn(), children }) => {
  const form = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues,
    mode: 'onBlur',
  });

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {children(form.control)}
      <button type="submit">Submit</button>
    </form>
  );
};

describe('TextInput', () => {
  describe('Rendering', () => {
    it('renders with label and placeholder', () => {
      const schema = z.object({ name: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="name"
              control={control}
              label="Name"
              placeholder="Enter your name"
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByLabelText('Name')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Enter your name')).toBeInTheDocument();
    });

    it('renders with description text', () => {
      const schema = z.object({ email: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="email"
              control={control}
              label="Email"
              description="We'll never share your email"
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByText("We'll never share your email")).toBeInTheDocument();
    });

    it('displays required indicator when field is required', () => {
      const schema = z.object({ username: z.string().min(1, 'Required') });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="username"
              control={control}
              label="Username"
              required
            />
          )}
        </TestWrapper>
      );

      expect(screen.getByText('*')).toBeInTheDocument();
    });

    it('renders with prefix icon', () => {
      const schema = z.object({ search: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="search"
              control={control}
              label="Search"
              prefixIcon="Search"
            />
          )}
        </TestWrapper>
      );

      // Input should have extra left padding for icon
      const input = screen.getByLabelText('Search');
      expect(input).toHaveClass('pl-10');
    });

    it('renders with suffix icon', () => {
      const schema = z.object({ password: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="password"
              control={control}
              label="Password"
              suffixIcon="Eye"
            />
          )}
        </TestWrapper>
      );

      // Input should have extra right padding for icon
      const input = screen.getByLabelText('Password');
      expect(input).toHaveClass('pr-10');
    });
  });

  describe('Validation', () => {
    it('validates minLength constraint', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        name: z.string().min(3, 'Name must be at least 3 characters'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="name"
              control={control}
              label="Name"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Name');

      await user.type(input, 'ab');
      await user.tab(); // Trigger onBlur validation

      await waitFor(() => {
        expect(screen.getByText('Name must be at least 3 characters')).toBeInTheDocument();
      });
    });

    it('validates maxLength constraint', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        code: z.string().max(5, 'Code must be at most 5 characters'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="code"
              control={control}
              label="Code"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Code');

      await user.type(input, 'abcdef');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Code must be at most 5 characters')).toBeInTheDocument();
      });
    });

    it('validates pattern constraint', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        zipCode: z.string().regex(/^\d{5}$/, 'Zip code must be 5 digits'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="zipCode"
              control={control}
              label="Zip Code"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Zip Code');

      await user.type(input, 'abc');
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText('Zip code must be 5 digits')).toBeInTheDocument();
      });
    });

    it('displays character count for maxLength fields', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        bio: z.string().max(100),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="bio"
              control={control}
              label="Bio"
              showCharacterCount
              maxLength={100}
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Bio');

      expect(screen.getByText('0 / 100')).toBeInTheDocument();

      await user.type(input, 'Hello');

      await waitFor(() => {
        expect(screen.getByText('5 / 100')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('associates label with input using htmlFor', () => {
      const schema = z.object({ field: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field Label"
            />
          )}
        </TestWrapper>
      );

      const label = screen.getByText('Field Label');
      const input = screen.getByLabelText('Field Label');

      expect(label).toHaveAttribute('for', input.id);
    });

    it('sets aria-invalid on validation error', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        email: z.string().email('Invalid email'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="email"
              control={control}
              label="Email"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Email');

      await user.type(input, 'invalid');
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
      });
    });

    it('sets aria-describedby for error message', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field: z.string().min(1, 'Required'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByText('Required');
        expect(input).toHaveAttribute('aria-describedby', errorElement.id);
      });
    });

    it('announces errors to screen readers with role="alert"', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field: z.string().min(1, 'Required'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        const errorElement = screen.getByText('Required');
        expect(errorElement).toHaveAttribute('role', 'alert');
      });
    });

    it('sets aria-required for required fields', () => {
      const schema = z.object({ field: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
              required
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('aria-required', 'true');
    });
  });

  describe('Keyboard Navigation', () => {
    it('supports Tab key navigation', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <>
              <TextInput name="field1" control={control} label="Field 1" />
              <TextInput name="field2" control={control} label="Field 2" />
            </>
          )}
        </TestWrapper>
      );

      const field1 = screen.getByLabelText('Field 1');
      const field2 = screen.getByLabelText('Field 2');

      field1.focus();
      expect(field1).toHaveFocus();

      await user.tab();
      expect(field2).toHaveFocus();
    });

    it('supports Shift+Tab for reverse navigation', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field1: z.string(),
        field2: z.string(),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <>
              <TextInput name="field1" control={control} label="Field 1" />
              <TextInput name="field2" control={control} label="Field 2" />
            </>
          )}
        </TestWrapper>
      );

      const field1 = screen.getByLabelText('Field 1');
      const field2 = screen.getByLabelText('Field 2');

      field2.focus();
      expect(field2).toHaveFocus();

      await user.tab({ shift: true });
      expect(field1).toHaveFocus();
    });
  });

  describe('States', () => {
    it('disables input when disabled prop is true', () => {
      const schema = z.object({ field: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
              disabled
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');
      expect(input).toBeDisabled();
    });

    it('makes input readonly when readOnly prop is true', () => {
      const schema = z.object({ field: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
              readOnly
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');
      expect(input).toHaveAttribute('readonly');
    });

    it('applies custom className', () => {
      const schema = z.object({ field: z.string() });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
              className="custom-class"
            />
          )}
        </TestWrapper>
      );

      // Get the root wrapper div (space-y-1.5)
      const container = screen.getByLabelText('Field').parentElement?.parentElement;
      expect(container).toHaveClass('custom-class');
    });
  });

  describe('Visual States', () => {
    it('displays error state styling on validation failure', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field: z.string().min(1, 'Required'),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');

      await user.click(input);
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveClass('border-red-500');
      });
    });

    it('displays success state when showSuccess is true and valid', async () => {
      const user = userEvent.setup();
      const schema = z.object({
        field: z.string().min(3),
      });

      render(
        <TestWrapper schema={schema}>
          {(control) => (
            <TextInput
              name="field"
              control={control}
              label="Field"
              showSuccess
            />
          )}
        </TestWrapper>
      );

      const input = screen.getByLabelText('Field');

      await user.type(input, 'valid');
      await user.tab();

      await waitFor(() => {
        expect(input).toHaveClass('border-green-500');
      });
    });
  });
});
