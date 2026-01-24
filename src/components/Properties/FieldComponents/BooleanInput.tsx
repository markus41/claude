/**
 * BooleanInput Component
 *
 * Establishes accessible boolean input with toggle switch and checkbox variants.
 * Provides smooth visual transitions and full keyboard support.
 *
 * Best for: Boolean configuration flags with clear on/off states.
 *
 * @example
 * ```tsx
 * <BooleanInput
 *   name="enabled"
 *   control={formControl}
 *   label="Enable Feature"
 *   variant="toggle"
 * />
 * ```
 */

import React, { useId } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

/**
 * BooleanInput component props
 */
export interface BooleanInputProps<T extends FieldValues> {
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

  // Features
  /** Input variant (toggle or checkbox) */
  variant?: 'toggle' | 'checkbox';
  /** Label position relative to input */
  labelPosition?: 'left' | 'right';

  // State
  /** Whether field is disabled */
  disabled?: boolean;

  // Styling
  /** Additional CSS classes */
  className?: string;

  // Accessibility
  /** ARIA label override */
  ariaLabel?: string;
}

/**
 * BooleanInput Component
 *
 * Provides accessible boolean input with toggle and checkbox variants.
 */
export function BooleanInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  variant = 'toggle',
  labelPosition = 'right',
  disabled = false,
  className,
  ariaLabel,
}: BooleanInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => {
        const checked = Boolean(field.value);

        if (variant === 'toggle') {
          return (
            <div className={cn('space-y-1.5', className)}>
              <div className={cn(
                'flex items-center',
                labelPosition === 'left' ? 'flex-row-reverse justify-end' : 'flex-row'
              )}>
                {/* Toggle Switch */}
                <button
                  type="button"
                  role="switch"
                  id={inputId}
                  aria-checked={checked}
                  aria-label={ariaLabel || label}
                  aria-describedby={description ? descriptionId : undefined}
                  disabled={disabled}
                  onClick={() => field.onChange(!checked)}
                  className={cn(
                    'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent',
                    'transition-colors duration-200 ease-in-out',
                    'focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                    'disabled:opacity-50 disabled:cursor-not-allowed',
                    checked ? 'bg-blue-600' : 'bg-gray-200'
                  )}
                >
                  <motion.span
                    initial={false}
                    animate={{ x: checked ? 20 : 0 }}
                    transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                    className={cn(
                      'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0',
                      'transition duration-200 ease-in-out'
                    )}
                    aria-hidden="true"
                  />
                </button>

                {/* Label */}
                {label && (
                  <label
                    htmlFor={inputId}
                    className={cn(
                      'text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer',
                      labelPosition === 'left' ? 'mr-3' : 'ml-3',
                      disabled && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    {label}
                  </label>
                )}
              </div>

              {/* Description */}
              {description && (
                <p
                  id={descriptionId}
                  className="text-xs text-gray-600 dark:text-gray-400"
                >
                  {description}
                </p>
              )}
            </div>
          );
        }

        // Checkbox variant
        return (
          <div className={cn('space-y-1.5', className)}>
            <div className="flex items-center">
              <input
                {...field}
                id={inputId}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                aria-label={ariaLabel || label}
                aria-describedby={description ? descriptionId : undefined}
                className={cn(
                  'h-4 w-4 rounded border-gray-300 text-blue-600',
                  'focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
                  'disabled:opacity-50 disabled:cursor-not-allowed',
                  'transition-colors duration-200',
                  'cursor-pointer'
                )}
              />

              {/* Label */}
              {label && (
                <label
                  htmlFor={inputId}
                  className={cn(
                    'ml-2 text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer',
                    disabled && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  {label}
                </label>
              )}
            </div>

            {/* Description */}
            {description && (
              <p
                id={descriptionId}
                className="text-xs text-gray-600 dark:text-gray-400 ml-6"
              >
                {description}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export default BooleanInput;
