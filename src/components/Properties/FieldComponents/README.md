# Field Components Library

Production-ready React Hook Form field components for the ACCOS Visual Flow Builder Properties Panel.

## Overview

This library provides eight specialized field components that integrate seamlessly with React Hook Form and Zod validation. Each component follows WCAG 2.1 AA accessibility standards and provides comprehensive keyboard navigation support.

## Components

### TextInput

Text input field with validation, character counting, and prefix/suffix icons.

```tsx
<TextInput
  name="email"
  control={formControl}
  label="Email Address"
  placeholder="you@example.com"
  prefixIcon="Mail"
  showCharacterCount
  maxLength={100}
  showSuccess
/>
```

**Features:**
- Min/max length validation
- Pattern matching support
- Character count indicator
- Prefix/suffix icons from lucide-react
- Success state visualization
- Full ARIA support

### NumberInput

Numeric input with range validation and increment/decrement controls.

```tsx
<NumberInput
  name="maxTokens"
  control={formControl}
  label="Maximum Tokens"
  min={1000}
  max={200000}
  step={1000}
  showStepControls
/>
```

**Features:**
- Min/max range validation
- Step increment/decrement buttons
- Keyboard arrow key support
- Format display (plain, percentage, currency)
- Range info display

### SelectInput

Dropdown select with search filtering and clear functionality.

```tsx
<SelectInput
  name="model"
  control={formControl}
  label="Model"
  options={modelOptions}
  searchable
  clearable
/>
```

**Features:**
- Search/filter capability
- Clear button for optional fields
- Grouped options support
- Full keyboard navigation
- ARIA combobox pattern

### BooleanInput

Toggle switch or checkbox for boolean values.

```tsx
<BooleanInput
  name="enabled"
  control={formControl}
  label="Enable Feature"
  variant="toggle"
  labelPosition="right"
/>
```

**Features:**
- Toggle switch and checkbox variants
- Smooth animations with framer-motion
- Label positioning (left/right)
- ARIA switch role for toggles
- Visual state transitions

### CodeInput

Lightweight code input for small snippets with tab support.

```tsx
<CodeInput
  name="script"
  control={formControl}
  label="Custom Script"
  language="javascript"
  showLineNumbers
  minRows={5}
  maxRows={15}
  onFullScreenClick={() => openCodeEditor()}
/>
```

**Features:**
- Tab key handling (inserts 2 spaces)
- Auto-resize textarea
- Line numbers option
- Full-screen toggle button
- Syntax language hints

### VariableInput

Text input with variable picker integration for {{ variable }} syntax.

```tsx
<VariableInput
  name="message"
  control={formControl}
  label="Message Template"
  availableVariables={['user.name', 'workflow.id']}
/>
```

**Features:**
- Variable syntax highlighting
- Autocomplete dropdown trigger
- Variable insertion at cursor
- Reference validation
- Built-in variables section

### ArrayInput

Dynamic array field management with add/remove capabilities.

```tsx
<ArrayInput
  name="tags"
  control={formControl}
  label="Tags"
  minItems={1}
  maxItems={10}
  renderItem={(index) => (
    <TextInput name={`tags.${index}`} control={formControl} />
  )}
/>
```

**Features:**
- Add/Remove item buttons
- Item index indicators
- Nested field support
- Min/max item constraints
- Bulk operations

### ObjectInput

Nested object field groups with collapsible sections.

```tsx
<ObjectInput
  name="config"
  control={formControl}
  label="Configuration"
  collapsible
  defaultExpanded
>
  <TextInput name="config.host" control={formControl} label="Host" />
  <NumberInput name="config.port" control={formControl} label="Port" />
</ObjectInput>
```

**Features:**
- Collapsible sections
- Recursive field rendering
- Visual grouping with borders
- Breadcrumb navigation for deep nesting
- Smooth expand/collapse animations

## Common Props

All field components share these common props:

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `name` | `Path<T>` | required | Field name registered with React Hook Form |
| `control` | `Control<T>` | required | React Hook Form control object |
| `label` | `string` | - | Input label text |
| `description` | `string` | - | Helper description text |
| `required` | `boolean` | `false` | Whether field is required |
| `disabled` | `boolean` | `false` | Whether field is disabled |
| `className` | `string` | - | Additional CSS classes |
| `ariaLabel` | `string` | - | ARIA label override |

## Accessibility

All components implement WCAG 2.1 AA standards:

- ✅ Proper label association (`htmlFor`, `aria-labelledby`)
- ✅ Error announcements (`role="alert"`)
- ✅ Validation state indication (`aria-invalid`)
- ✅ Helper text association (`aria-describedby`)
- ✅ Keyboard navigation support
- ✅ Focus visible states
- ✅ Required field indicators (`aria-required`)
- ✅ Disabled state handling

## Usage with React Hook Form

```tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { TextInput, NumberInput, BooleanInput } from './FieldComponents';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  age: z.number().min(18, 'Must be 18 or older'),
  newsletter: z.boolean(),
});

type FormData = z.infer<typeof schema>;

function MyForm() {
  const { control, handleSubmit } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onBlur',
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <TextInput name="name" control={control} label="Name" required />
      <NumberInput name="age" control={control} label="Age" min={18} max={120} />
      <BooleanInput name="newsletter" control={control} label="Subscribe to newsletter" />
      <button type="submit">Submit</button>
    </form>
  );
}
```

## Testing

Each component has comprehensive unit tests covering:

- Rendering with various prop combinations
- Validation scenarios
- Accessibility requirements
- Keyboard navigation
- State management
- Visual states (error, success, disabled)

Run tests:
```bash
npm test -- FieldComponents
```

## Performance

All components are optimized for performance:

- React Hook Form Controller for efficient re-renders
- Debounced validation (configured at form level)
- React.memo where appropriate
- Minimal dependencies
- Bundle size optimized

## Browser Support

- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile browsers (iOS Safari, Chrome Mobile)

## Contributing

When adding new field components:

1. Follow TDD (write tests first)
2. Implement full accessibility support
3. Document props and usage examples
4. Add to index.ts exports
5. Update this README

## License

Internal use only - ACCOS Platform
