/**
 * Properties Panel Export Hub
 *
 * Centralized exports for the complete Properties Panel system including
 * main components, field components, hooks, and utilities.
 *
 * Establishes single source of truth for Properties Panel imports.
 */

// Main components
export { PropertiesPanel } from './PropertiesPanel';
export type { PropertiesPanelProps } from './PropertiesPanel';

export { SchemaForm } from './SchemaForm';
export type { SchemaFormProps } from './SchemaForm';

export { VariablePicker } from './VariablePicker';
export type { VariablePickerProps } from './VariablePicker';

export { CodeEditor } from './CodeEditor';
export type { CodeEditorProps, EditorError } from './CodeEditor';

// Field components
export * from './FieldComponents';

// Hooks
export * from './hooks';

// Utilities
export * from './utils';
