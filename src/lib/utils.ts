/**
 * Utility Functions
 *
 * Establishes shared utility functions for className management and other
 * common operations across the application.
 */

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines className values using clsx and tailwind-merge for optimal
 * Tailwind CSS class composition without conflicts.
 *
 * @param inputs - Class values to merge
 * @returns Merged className string
 *
 * @example
 * ```tsx
 * cn('px-4 py-2', 'bg-blue-500', { 'text-white': true })
 * // Returns: "px-4 py-2 bg-blue-500 text-white"
 * ```
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
