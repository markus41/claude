/**
 * NumberInput Component
 *
 * Establishes accessible numeric input field with range validation and step controls.
 * Integrates with React Hook Form for form state management and provides visual
 * increment/decrement buttons for improved usability.
 *
 * Best for: Numeric configuration fields requiring precise value control with validation.
 *
 * @example
 * ```tsx
 * <NumberInput
 *   name="maxTokens"
 *   control={formControl}
 *   label="Maximum Tokens"
 *   min={1000}
 *   max={200000}
 *   step={1000}
 *   showStepControls
 * />
 * ```
 */

import React, { useId, useMemo } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * NumberInput component props
 */
export interface NumberInputProps<T extends FieldValues> {
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
  /** Minimum numeric value */
  min?: number;
  /** Maximum numeric value */
  max?: number;
  /** Step increment */
  step?: number;

  // Features
  /** Show increment/decrement step controls */
  showStepControls?: boolean;
  /** Show success state when valid */
  showSuccess?: boolean;
  /** Format display (plain, percentage, currency) */
  format?: 'plain' | 'percentage' | 'currency';
  /** Currency symbol for currency format */
  currencySymbol?: string;

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
 * NumberInput Component
 *
 * Provides accessible number input with range validation, step controls, and formatting.
 * Integrates seamlessly with React Hook Form and Zod validation schemas.
 */
export function NumberInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required = false,
  min,
  max,
  step = 1,
  showStepControls = false,
  showSuccess = false,
  format = 'plain',
  currencySymbol = '$',
  disabled = false,
  readOnly = false,
  className,
  ariaLabel,
}: NumberInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();

  // Format value for display
  const formatValue = (value: number | null | undefined): string => {
    if (value == null) return '';

    switch (format) {
      case 'percentage':
        return `${value}%`;
      case 'currency':
        return `${currencySymbol}${value.toLocaleString()}`;
      default:
        return String(value);
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error, invalid, isDirty } }) => {
        const value = field.value as number | null | undefined;
        const showSuccessState = showSuccess && !invalid && isDirty && value != null;

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

        // Step control handlers
        const increment = () => {
          if (disabled || readOnly) return;
          const currentValue = value ?? 0;
          const newValue = currentValue + step;
          if (max !== undefined && newValue > max) return;
          field.onChange(newValue);
        };

        const decrement = () => {
          if (disabled || readOnly) return;
          const currentValue = value ?? 0;
          const newValue = currentValue - step;
          if (min !== undefined && newValue < min) return;
          field.onChange(newValue);
        };

        // Handle keyboard events
        const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
          if (e.key === 'ArrowUp') {
            e.preventDefault();
            increment();
          } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            decrement();
          }
        };

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
            <div className="relative flex items-center">
              {/* Input */}
              <input
                {...field}
                id={inputId}
                type="number"
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                min={min}
                max={max}
                step={step}
                value={value ?? ''}
                onChange={(e) => {
                  const val = e.target.value;
                  field.onChange(val === '' ? null : Number(val));
                }}
                onKeyDown={handleKeyDown}
                aria-label={ariaLabel || label}
                aria-invalid={invalid ? 'true' : 'false'}
                aria-describedby={ariaDescribedBy}
                aria-required={required ? 'true' : undefined}
                aria-valuemin={min}
                aria-valuemax={max}
                aria-valuenow={value ?? undefined}
                className={cn(
                  'w-full px-3 py-2 border rounded-md',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
                  'read-only:bg-gray-50 read-only:cursor-default',
                  'transition-colors duration-200',
                  'dark:bg-gray-900 dark:text-gray-100',
                  'dark:disabled:bg-gray-800',
                  '[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none',
                  borderColorClass,
                  showStepControls && 'pr-20'
                )}
              />

              {/* Step Controls */}
              {showStepControls && (
                <div className="absolute right-1 flex flex-col">
                  <button
                    type="button"
                    onClick={increment}
                    disabled={disabled || readOnly || (max !== undefined && (value ?? 0) >= max)}
                    className={cn(
                      'px-2 py-0.5 border border-gray-300 bg-white rounded-t',
                      'hover:bg-gray-50 active:bg-gray-100',
                      'disabled:bg-gray-100 disabled:cursor-not-allowed',
                      'transition-colors duration-150'
                    )}
                    aria-label="Increment value"
                  >
                    <LucideIcons.ChevronUp className="h-3 w-3" />
                  </button>
                  <button
                    type="button"
                    onClick={decrement}
                    disabled={disabled || readOnly || (min !== undefined && (value ?? 0) <= min)}
                    className={cn(
                      'px-2 py-0.5 border border-gray-300 bg-white rounded-b border-t-0',
                      'hover:bg-gray-50 active:bg-gray-100',
                      'disabled:bg-gray-100 disabled:cursor-not-allowed',
                      'transition-colors duration-150'
                    )}
                    aria-label="Decrement value"
                  >
                    <LucideIcons.ChevronDown className="h-3 w-3" />
                  </button>
                </div>
              )}

              {/* Success Indicator */}
              {showSuccessState && !showStepControls && (
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <LucideIcons.CheckCircle
                    className="h-5 w-5 text-green-500"
                    aria-hidden="true"
                  />
                </div>
              )}
            </div>

            {/* Range Info */}
            {(min !== undefined || max !== undefined) && !error && (
              <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
                {min !== undefined && <span>Min: {min}</span>}
                {max !== undefined && <span>Max: {max}</span>}
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

export default NumberInput;
