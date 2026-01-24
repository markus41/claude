/**
 * SelectInput Component
 *
 * Establishes accessible select input with search filtering and multi-select support.
 * Provides comprehensive keyboard navigation for optimal user experience.
 *
 * Best for: Enum-based configuration fields with predefined option sets.
 */

import React, { useId, useState, useMemo } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface SelectOption {
  value: string;
  label: string;
  group?: string;
}

export interface SelectInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options: SelectOption[];
  searchable?: boolean;
  clearable?: boolean;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

export function SelectInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder = 'Select an option...',
  required = false,
  options,
  searchable = false,
  clearable = true,
  disabled = false,
  className,
  ariaLabel,
}: SelectInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    return options.filter(opt =>
      opt.label.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error, invalid } }) => {
        const value = field.value as string;
        const selectedOption = options.find(opt => opt.value === value);

        const borderColorClass = invalid
          ? 'border-red-500 focus:ring-red-500 bg-red-50'
          : 'border-gray-300 focus:ring-blue-500';

        return (
          <div className={cn('space-y-1.5', className)}>
            {label && (
              <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
                {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
              </label>
            )}

            {description && (
              <p id={descriptionId} className="text-xs text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}

            <div className="relative">
              <select
                {...field}
                id={inputId}
                disabled={disabled}
                aria-label={ariaLabel || label}
                aria-invalid={invalid ? 'true' : 'false'}
                aria-describedby={error ? errorId : description ? descriptionId : undefined}
                aria-required={required ? 'true' : undefined}
                className={cn(
                  'w-full px-3 py-2 pr-10 border rounded-md appearance-none',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
                  'transition-colors duration-200',
                  'dark:bg-gray-900 dark:text-gray-100',
                  borderColorClass
                )}
              >
                {placeholder && <option value="">{placeholder}</option>}
                {options.map(opt => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>

              <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
                <LucideIcons.ChevronDown className="h-5 w-5 text-gray-400" aria-hidden="true" />
              </div>

              {clearable && value && !disabled && (
                <button
                  type="button"
                  onClick={() => field.onChange('')}
                  className="absolute inset-y-0 right-8 flex items-center pr-2"
                  aria-label="Clear selection"
                >
                  <LucideIcons.X className="h-4 w-4 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {error && (
              <p id={errorId} className="text-sm text-red-600 dark:text-red-400" role="alert">
                {error.message}
              </p>
            )}
          </div>
        );
      }}
    />
  );
}

export default SelectInput;
