/**
 * TextInput Component
 *
 * Establishes accessible text input field with comprehensive validation support.
 * Integrates with React Hook Form for form state management and Zod for runtime validation.
 * Provides visual feedback for validation states and supports prefix/suffix icons.
 *
 * Best for: Text-based form fields requiring real-time validation with accessibility support.
 *
 * @example
 * ```tsx
 * <TextInput
 *   name="email"
 *   control={formControl}
 *   label="Email Address"
 *   placeholder="you@example.com"
 *   prefixIcon="mail"
 *   showCharacterCount
 *   maxLength={100}
 * />
 * ```
 */

import React, { useId, useMemo } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * TextInput component props
 */
export interface TextInputProps<T extends FieldValues> {
  // React Hook Form integration
  /** Field name registered with React Hook Form */
  name: Path<T>;
  /** React Hook Form control object */
  control: Control<T>;

  // Labeling
  /** Input label text */
  label?: string;
  /** Helper description text */
  description?: string;
  /** Placeholder text */
  placeholder?: string;

  // Validation
  /** Whether field is required */
  required?: boolean;
  /** Maximum character length */
  maxLength?: number;
  /** Minimum character length */
  minLength?: number;

  // Features
  /** Show character count indicator */
  showCharacterCount?: boolean;
  /** Show success state when valid */
  showSuccess?: boolean;
  /** Prefix icon name from lucide-react */
  prefixIcon?: keyof typeof LucideIcons;
  /** Suffix icon name from lucide-react */
  suffixIcon?: keyof typeof LucideIcons;
  /** Input type attribute */
  type?: 'text' | 'email' | 'password' | 'url' | 'tel' | 'search';

  // State
  /** Whether field is disabled */
  disabled?: boolean;
  /** Whether field is read-only */
  readOnly?: boolean;

  // Styling
  /** Additional CSS classes */
  className?: string;

  // Accessibility
  /** ARIA label override */
  ariaLabel?: string;
}

/**
 * TextInput Component
 *
 * Provides accessible text input with validation states, icons, and character counting.
 * Integrates seamlessly with React Hook Form and Zod validation schemas.
 */
export function TextInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required = false,
  maxLength,
  minLength,
  showCharacterCount = false,
  showSuccess = false,
  prefixIcon,
  suffixIcon,
  type = 'text',
  disabled = false,
  readOnly = false,
  className,
  ariaLabel,
}: TextInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();

  // Icon components
  const PrefixIcon = prefixIcon ? (LucideIcons[prefixIcon] as React.ComponentType<{ className?: string }>) : null;
  const SuffixIcon = suffixIcon ? (LucideIcons[suffixIcon] as React.ComponentType<{ className?: string }>) : null;

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error, invalid, isDirty } }) => {
        const value = field.value as string || '';
        const characterCount = value.length;
        const showSuccessState = showSuccess && !invalid && isDirty && value.length > 0;

        // Determine input border color based on validation state
        const borderColorClass = invalid
          ? 'border-red-500 focus:ring-red-500 bg-red-50'
          : showSuccessState
          ? 'border-green-500 focus:ring-green-500'
          : 'border-gray-300 focus:ring-blue-500';

        // Build aria-describedby references
        const ariaDescribedBy = useMemo(() => {
          const ids: string[] = [];
          if (description) ids.push(descriptionId);
          if (error) ids.push(errorId);
          return ids.length > 0 ? ids.join(' ') : undefined;
        }, [description, error, descriptionId, errorId]);

        return (
          <div className={cn('space-y-1.5', className)}>
            {/* Label */}
            {label && (
              <label
                htmlFor={inputId}
                className="block text-sm font-medium text-gray-700 dark:text-gray-300"
              >
                {label}
                {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
              </label>
            )}

            {/* Description */}
            {description && (
              <p
                id={descriptionId}
                className="text-xs text-gray-600 dark:text-gray-400"
              >
                {description}
              </p>
            )}

            {/* Input Container */}
            <div className="relative">
              {/* Prefix Icon */}
              {PrefixIcon && (
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <PrefixIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* Input */}
              <input
                {...field}
                id={inputId}
                type={type}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                maxLength={maxLength}
                minLength={minLength}
                aria-label={ariaLabel || label}
                aria-invalid={invalid ? 'true' : 'false'}
                aria-describedby={ariaDescribedBy}
                aria-required={required ? 'true' : undefined}
                className={cn(
                  'w-full px-3 py-2 border rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
                  'read-only:bg-gray-50 read-only:cursor-default',
                  'transition-colors duration-200',
                  'dark:bg-gray-900 dark:text-gray-100',
                  'dark:disabled:bg-gray-800',
                  borderColorClass,
                  PrefixIcon && 'pl-10',
                  SuffixIcon && 'pr-10'
                )}
              />

              {/* Suffix Icon */}
              {SuffixIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <SuffixIcon
                    className="h-5 w-5 text-gray-400"
                    aria-hidden="true"
                  />
                </div>
              )}

              {/* Success Indicator */}
              {showSuccessState && !SuffixIcon && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <LucideIcons.CheckCircle
                    className="h-5 w-5 text-green-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Character Count */}
            {showCharacterCount && maxLength && (
              <div className="flex justify-end">
                <span
                  className={cn(
                    'text-xs',
                    characterCount > maxLength * 0.9
                      ? 'text-red-600 dark:text-red-400'
                      : 'text-gray-500 dark:text-gray-400'
                  )}
                  aria-live="polite"
                >
                  {characterCount} / {maxLength}
                </span>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <p
                id={errorId}
                className="text-sm text-red-600 dark:text-red-400"
                role="alert"
              >
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export default TextInput;
