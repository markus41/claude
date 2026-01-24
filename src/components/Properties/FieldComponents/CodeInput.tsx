/**
 * CodeInput Component
 *
 * Lightweight code input for small snippets with basic syntax highlighting.
 * For larger code blocks, integrates with CodeEditor component.
 */

import React, { useId, useRef, useEffect } from 'react';
import { Controller, Control, FieldValues, Path } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface CodeInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  language?: string;
  showLineNumbers?: boolean;
  minRows?: number;
  maxRows?: number;
  disabled?: boolean;
  readOnly?: boolean;
  className?: string;
  ariaLabel?: string;
  onFullScreenClick?: () => void;
}

export function CodeInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  placeholder,
  required = false,
  language = 'javascript',
  showLineNumbers = false,
  minRows = 3,
  maxRows = 10,
  disabled = false,
  readOnly = false,
  className,
  ariaLabel,
  onFullScreenClick,
}: CodeInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const value = target.value;
      target.value = value.substring(0, start) + '  ' + value.substring(end);
      target.selectionStart = target.selectionEnd = start + 2;
    }
  };

  return (
    <Controller
      name={name}
      control={control}
      render={({ field, fieldState: { error, invalid } }) => {
        const borderColorClass = invalid
          ? 'border-red-500 focus:ring-red-500 bg-red-50'
          : 'border-gray-300 focus:ring-blue-500';

        return (
          <div className={cn('space-y-1.5', className)}>
            {label && (
              <div className="flex items-center justify-between">
                <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  {label}
                  {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
                </label>
                {onFullScreenClick && (
                  <button
                    type="button"
                    onClick={onFullScreenClick}
                    className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    aria-label="Open in full screen editor"
                  >
                    <LucideIcons.Maximize2 className="h-3 w-3" />
                    Full Screen
                  </button>
                )}
              </div>
            )}

            {description && (
              <p id={descriptionId} className="text-xs text-gray-600 dark:text-gray-400">
                {description}
              </p>
            )}

            <div className="relative">
              <textarea
                {...field}
                ref={textareaRef}
                id={inputId}
                placeholder={placeholder}
                disabled={disabled}
                readOnly={readOnly}
                rows={minRows}
                onKeyDown={handleKeyDown}
                aria-label={ariaLabel || label}
                aria-invalid={invalid ? 'true' : 'false'}
                aria-describedby={error ? errorId : description ? descriptionId : undefined}
                aria-required={required ? 'true' : undefined}
                className={cn(
                  'w-full px-3 py-2 border rounded-md font-mono text-sm',
                  'focus:outline-none focus:ring-2 focus:ring-offset-1',
                  'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:text-gray-500',
                  'read-only:bg-gray-50 read-only:cursor-default',
                  'transition-colors duration-200',
                  'dark:bg-gray-900 dark:text-gray-100',
                  'resize-y',
                  borderColorClass
                )}
                style={{ minHeight: `${minRows * 1.5}rem`, maxHeight: `${maxRows * 1.5}rem` }}
              />
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

export default CodeInput;
