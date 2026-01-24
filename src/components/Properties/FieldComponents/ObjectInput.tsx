/**
 * ObjectInput Component
 *
 * Nested object field groups with collapsible sections.
 * Supports recursive field rendering for deep object structures.
 */

import React, { useState, useId } from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';
import * as LucideIcons from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ObjectInputProps<T extends FieldValues> {
  name: Path<T>;
  control: Control<T>;
  label?: string;
  description?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function ObjectInput<T extends FieldValues>({
  name,
  control,
  label,
  description,
  collapsible = true,
  defaultExpanded = true,
  children,
  className,
}: ObjectInputProps<T>) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const sectionId = useId();
  const descriptionId = useId();

  return (
    <div className={cn('border border-gray-200 dark:border-gray-700 rounded-md', className)}>
      {/* Header */}
      {label && (
        <div
          className={cn(
            'flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800',
            'border-b border-gray-200 dark:border-gray-700',
            collapsible && 'cursor-pointer'
          )}
          onClick={collapsible ? () => setIsExpanded(!isExpanded) : undefined}
        >
          <div className="flex-1">
            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
              {label}
            </h4>
            {description && (
              <p id={descriptionId} className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                {description}
              </p>
            )}
          </div>

          {collapsible && (
            <button
              type="button"
              aria-expanded={isExpanded}
              aria-controls={sectionId}
              className="p-1 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            >
              <motion.div
                initial={false}
                animate={{ rotate: isExpanded ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <LucideIcons.ChevronDown className="h-5 w-5" />
              </motion.div>
            </button>
          )}
        </div>
      )}

      {/* Content */}
      <AnimatePresence initial={false}>
        {(!collapsible || isExpanded) && (
          <motion.div
            id={sectionId}
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-4 space-y-4">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default ObjectInput;
