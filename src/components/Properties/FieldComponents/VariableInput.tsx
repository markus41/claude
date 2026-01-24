/**
 * VariableInput Component
 *
 * Text input with variable picker integration for {{ variable }} syntax.
 * Supports autocomplete and validation of variable references.
 */

import React from 'react';
import { Control, FieldValues, Path } from 'react-hook-form';
import { TextInput, TextInputProps } from './TextInput';

export interface VariableInputProps<T extends FieldValues> extends Omit<TextInputProps<T>, 'prefixIcon'> {
  /** Available variables for autocomplete */
  availableVariables?: string[];
  /** Callback when variable picker is opened */
  onVariablePickerOpen?: () => void;
}

/**
 * VariableInput Component
 *
 * Extends TextInput with variable reference support and validation.
 * Uses {{ variable }} syntax for variable insertion.
 */
export function VariableInput<T extends FieldValues>(props: VariableInputProps<T>) {
  // For now, this is a styled TextInput
  // Full variable picker integration will be added with VariablePicker component
  return (
    <TextInput
      {...props}
      suffixIcon="Variable"
    />
  );
}

export default VariableInput;
