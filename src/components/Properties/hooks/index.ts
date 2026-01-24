/**
 * Properties Panel Hooks Export Hub
 *
 * Centralized exports for all Properties Panel hooks.
 * Establishes single source of truth for hook imports.
 */

// Auto-save hook
export { useAutoSave, formatLastSaved, getSaveStatusDisplay } from './useAutoSave';
export type { UseAutoSaveOptions, UseAutoSaveReturn, SaveStatus } from './useAutoSave';

// Schema form hook
export { useSchemaForm, getFieldError, getFieldProps } from './useSchemaForm';
export type { UseSchemaFormOptions, UseSchemaFormReturn } from './useSchemaForm';

// Variable picker hook
export {
  useVariablePicker,
  getVariableIcon,
  getCategoryMetadata,
} from './useVariablePicker';
export type {
  VariableOption,
  UseVariablePickerOptions,
  UseVariablePickerReturn,
} from './useVariablePicker';
