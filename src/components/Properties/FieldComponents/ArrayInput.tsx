/**
 * ArrayInput Component
 *
 * Dynamic array field management with add/remove capabilities.
 * Supports nested field rendering for complex array items.
 */

import React, { useId } from 'react';
import { Controller, Control, FieldValues, Path, useFieldArray } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ArrayInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  required?: boolean;
  minItems?: number;
  maxItems?: number;
  disabled?: boolean;
  className?: string;
  renderItem?: (index: number) => React.ReactNode;
  addButtonText?: string;
}

export function ArrayInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  required = false,
  minItems,
  maxItems,
  disabled = false,
  className,
  renderItem,
  addButtonText = 'Add Item',
}: ArrayInputProps<T>) {
  const inputId = useId();
  const descriptionId = useId();
  const errorId = useId();

  const { fields, append, remove } = useFieldArray({
    control,
    name,
  });

  const canAdd = maxItems === undefined || fields.length < maxItems;
  const canRemove = minItems === undefined || fields.length > minItems;

  return (
    <div className={cn('space-y-2', className)}>
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

      <div className="space-y-2">
        {fields.map((field, index) => (
          <div key={field.id} className="flex items-start gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-md">
            <span className="text-xs font-mono text-gray-500 mt-2">{index}</span>
            <div className="flex-1">
              {renderItem ? renderItem(index) : (
                <Controller
                  name={`${name}.${index}` as Path<T>}
                  control={control}
                  render={({ field }) => (
                    <input
                      {...field}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={disabled}
                    />
                  )}
                />
              )}
            </div>
            {canRemove && !disabled && (
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 text-red-600 hover:bg-red-50 rounded"
                aria-label={`Remove item ${index}`}
              >
                <LucideIcons.Trash2 className="h-4 w-4" />
              </button>
            )}
          </div>
        ))}
      </div>

      {canAdd && !disabled && (
        <button
          type="button"
          onClick={() => append({} as any)}
          className={cn(
            'w-full px-4 py-2 border-2 border-dashed border-gray-300 rounded-md',
            'text-sm text-gray-600 hover:border-gray-400 hover:text-gray-700',
            'transition-colors duration-200',
            'flex items-center justify-center gap-2'
          )}
        >
          <LucideIcons.Plus className="h-4 w-4" />
          {addButtonText}
        </button>
      )}

      {minItems !== undefined && maxItems !== undefined && (
        <p className="text-xs text-gray-500">
          {fields.length} / {maxItems} items {minItems > 0 && `(min: ${minItems})`}
        </p>
      )}
    </div>
  );
}

export default ArrayInput;
