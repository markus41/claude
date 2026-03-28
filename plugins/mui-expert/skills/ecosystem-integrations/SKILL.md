---
name: ecosystem-integrations
description: MUI ecosystem — FormEngine, react-jsonschema-form, Uniforms, schema-driven forms, Tailwind interop, Framer Motion, and third-party component libraries
triggers:
  - FormEngine
  - react-jsonschema-form
  - schema-driven forms
  - uniforms
  - JSON schema form
  - Tailwind MUI
  - Framer Motion MUI
  - third-party
  - form builder
  - dynamic forms
allowed-tools:
  - Read
  - Glob
  - Grep
  - Write
  - Edit
globs:
  - "*.tsx"
  - "*.ts"
---

# MUI Ecosystem Integrations

Third-party libraries, schema-driven form builders, styling interop, and animation
integrations that extend MUI's capabilities.

---

## Schema-Driven Form Builders

### FormEngine with MUI

JSON config renders live MUI forms with validation and event wiring.

```bash
npm install @react-form-builder/core @react-form-builder/components-material-ui
```

```tsx
import { FormViewer } from '@react-form-builder/core';
import { view as muiView } from '@react-form-builder/components-material-ui';

const contactForm = {
  tooltipType: 'MuiTooltip',
  errorType: 'MuiErrorWrapper',
  form: {
    key: 'Screen',
    type: 'Screen',
    children: [
      {
        key: 'name',
        type: 'MuiTextField',
        props: { label: { value: 'Full Name' } },
        schema: { validations: [{ key: 'required' }] },
      },
      {
        key: 'email',
        type: 'MuiTextField',
        props: { label: { value: 'Email' } },
        schema: { validations: [{ key: 'required' }, { key: 'email' }] },
      },
      {
        key: 'role',
        type: 'MuiSelect',
        props: {
          label: { value: 'Role' },
          options: { value: [
            { value: 'admin', label: 'Admin' },
            { value: 'user', label: 'User' },
          ]},
        },
      },
      {
        key: 'submit',
        type: 'MuiButton',
        props: {
          children: { value: 'Submit' },
          variant: { value: 'contained' },
        },
        events: {
          onClick: [
            { name: 'validate', type: 'common', args: { failOnError: true } },
            { name: 'onSubmit', type: 'custom' },
          ],
        },
      },
    ],
  },
};

function DynamicForm() {
  return (
    <FormViewer
      view={muiView}
      getForm={() => JSON.stringify(contactForm)}
      actions={{
        onSubmit: (e) => console.log('Form data:', e.data),
      }}
    />
  );
}
```

**MUI Components Pack** maps JSON types to real MUI components:
`MuiTextField`, `MuiSelect`, `MuiCheckbox`, `MuiSwitch`, `MuiButton`,
`MuiDialog`, `MuiCard`, `MuiAutocomplete`, `MuiDatePicker`, etc.

**Conditional Rendering** with `renderWhen`:
```json
{
  "key": "discountCode",
  "type": "MuiTextField",
  "props": { "label": { "value": "Discount Code" } },
  "renderWhen": { "value": "form.data.hasDiscount === true" }
}
```

### react-jsonschema-form with MUI

JSON Schema → MUI form rendering.

```bash
npm install @rjsf/core @rjsf/mui @rjsf/validator-ajv8
```

```tsx
import Form from '@rjsf/mui';
import validator from '@rjsf/validator-ajv8';

const schema = {
  type: 'object',
  required: ['name', 'email'],
  properties: {
    name: { type: 'string', title: 'Full Name' },
    email: { type: 'string', title: 'Email', format: 'email' },
    age: { type: 'integer', title: 'Age', minimum: 18 },
    role: {
      type: 'string',
      title: 'Role',
      enum: ['admin', 'editor', 'viewer'],
      enumNames: ['Administrator', 'Editor', 'Viewer'],
    },
    bio: { type: 'string', title: 'Biography' },
  },
};

const uiSchema = {
  bio: { 'ui:widget': 'textarea', 'ui:options': { rows: 4 } },
  role: { 'ui:widget': 'select' },
  'ui:order': ['name', 'email', 'age', 'role', 'bio'],
};

function JsonSchemaForm() {
  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      validator={validator}
      onSubmit={({ formData }) => console.log(formData)}
    />
  );
}
```

**Custom Widgets and Templates**:
```tsx
const widgets = {
  DateWidget: (props) => (
    <DatePicker value={dayjs(props.value)} onChange={(d) => props.onChange(d?.toISOString())} />
  ),
};

const templates = {
  ObjectFieldTemplate: (props) => (
    <Grid container spacing={2}>
      {props.properties.map((prop) => (
        <Grid key={prop.name} size={{ xs: 12, md: 6 }}>
          {prop.content}
        </Grid>
      ))}
    </Grid>
  ),
};

<Form schema={schema} widgets={widgets} templates={templates} validator={validator} />
```

### Uniforms with MUI Bridge

Multi-schema form engine with pluggable styling bridges.

```bash
npm install uniforms uniforms-bridge-json-schema uniforms-mui
```

```tsx
import { AutoForm, AutoField, SubmitField } from 'uniforms-mui';
import { JSONSchemaBridge } from 'uniforms-bridge-json-schema';
import Ajv from 'ajv';

const ajv = new Ajv({ allErrors: true });
const schema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    email: { type: 'string', format: 'email' },
  },
  required: ['name', 'email'],
};

const bridge = new JSONSchemaBridge({ schema, validator: ajv.compile(schema) });

<AutoForm schema={bridge} onSubmit={(data) => save(data)}>
  <AutoField name="name" />
  <AutoField name="email" />
  <SubmitField />
</AutoForm>
```

### When to Use What

| Tool | Best For |
|------|----------|
| **FormEngine + MUI** | Admin builders, dynamic forms from metadata, runtime JSON config |
| **react-jsonschema-form + MUI** | JSON Schema-driven forms, API-defined schemas |
| **Uniforms + MUI** | Multi-schema support, rapid prototyping |
| **React Hook Form + MUI** | Hand-coded forms with type-safe validation (Zod) |
| **Formik + MUI** | Legacy projects already using Formik |

---

## Tailwind CSS + MUI Interop

### Using MUI with Tailwind

MUI and Tailwind can coexist. Key: Tailwind's preflight conflicts with MUI's CssBaseline.

**Setup** (`tailwind.config.ts`):
```ts
export default {
  // Important: disable preflight to avoid conflicts with CssBaseline
  corePlugins: {
    preflight: false,
  },
  // Scope Tailwind to avoid class conflicts
  important: '#root', // or use selector strategy
  content: ['./src/**/*.{ts,tsx}'],
};
```

**Emotion + Tailwind ordering** — ensure Emotion styles take precedence:
```tsx
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';

const cache = createCache({
  key: 'css',
  prepend: true, // Emotion styles inserted BEFORE Tailwind → Tailwind can override
});

<CacheProvider value={cache}>
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <App />
  </ThemeProvider>
</CacheProvider>
```

**Using Tailwind classes on MUI components**:
```tsx
// Tailwind classes work alongside sx prop
<Button className="rounded-full shadow-lg" sx={{ px: 4 }}>
  Mixed styling
</Button>

// Use Tailwind for layout, MUI for component styles
<Box className="flex items-center gap-4 p-6">
  <TextField label="Name" fullWidth />
  <Button variant="contained">Save</Button>
</Box>
```

### Base UI + Tailwind (Headless + Utility)

The cleanest integration: Base UI hooks for logic/a11y, Tailwind for all visuals.

```tsx
import { useButton } from '@mui/base/useButton';
import clsx from 'clsx';

function TailwindButton({ children, variant = 'primary', ...props }) {
  const { getRootProps, active, disabled, focusVisible } = useButton(props);

  return (
    <button
      {...getRootProps()}
      className={clsx(
        'rounded-lg px-4 py-2 font-medium transition-all duration-150',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800',
        variant === 'secondary' && 'bg-slate-200 text-slate-900 hover:bg-slate-300',
        disabled && 'opacity-50 cursor-not-allowed',
        focusVisible && 'ring-2 ring-blue-400 ring-offset-2',
        active && 'scale-95',
      )}
    >
      {children}
    </button>
  );
}
```

---

## Framer Motion + MUI

### AnimatePresence with MUI Dialog

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import Dialog from '@mui/material/Dialog';

function AnimatedDialog({ open, onClose, children }) {
  return (
    <AnimatePresence>
      {open && (
        <Dialog
          open={open}
          onClose={onClose}
          PaperComponent={motion.div}
          PaperProps={{
            initial: { opacity: 0, scale: 0.9, y: 20 },
            animate: { opacity: 1, scale: 1, y: 0 },
            exit: { opacity: 0, scale: 0.95, y: -10 },
            transition: { type: 'spring', stiffness: 300, damping: 25 },
          }}
        >
          {children}
        </Dialog>
      )}
    </AnimatePresence>
  );
}
```

### Base UI + Tailwind + Framer Motion (Hardware Switch)

```tsx
import { useSwitch } from '@mui/base/useSwitch';
import { motion } from 'framer-motion';

function HardwareSwitch({ label, ...props }) {
  const { checked, disabled, focusVisible, getInputProps } = useSwitch(props);

  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      {label && <span className="text-sm font-medium text-slate-200">{label}</span>}
      <div className="relative">
        <input {...getInputProps()} className="sr-only" />

        {/* Track */}
        <motion.div
          className={`
            relative flex h-9 w-16 items-center rounded-full px-1
            border border-slate-700/80 bg-slate-900/90
            shadow-[0_0_0_1px_rgba(15,23,42,0.9),0_8px_18px_rgba(0,0,0,0.85)]
            ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}
          `}
          animate={{
            boxShadow: checked
              ? '0 0 0 1px rgba(56,189,248,0.75), 0 16px 35px rgba(8,47,73,0.9)'
              : '0 0 0 1px rgba(15,23,42,0.95), 0 10px 25px rgba(0,0,0,0.9)',
          }}
          whileTap={{ scale: 0.97 }}
          transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        >
          {/* LED indicator */}
          <motion.div
            className="pointer-events-none absolute left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full"
            animate={{
              backgroundColor: checked ? 'rgba(56,189,248,1)' : 'rgba(148,163,184,0.5)',
              boxShadow: checked ? '0 0 10px rgba(56,189,248,0.9)' : '0 0 4px rgba(148,163,184,0.6)',
            }}
          />

          {/* Thumb */}
          <motion.div
            className="relative z-10 h-7 w-7 rounded-full bg-gradient-to-br from-slate-100 to-slate-400 shadow-lg flex items-center justify-center"
            layout
            animate={{ x: checked ? 26 : 0 }}
            transition={{ type: 'spring', stiffness: 550, damping: 30, mass: 0.4 }}
          >
            <motion.div
              className="h-4 w-4 rounded-full bg-slate-900/90 shadow-[inset_0_0_4px_rgba(0,0,0,0.75)]"
              animate={{
                boxShadow: checked
                  ? 'inset 0 0 6px rgba(56,189,248,0.9)'
                  : 'inset 0 0 3px rgba(0,0,0,0.8)',
              }}
            />
          </motion.div>

          {/* Focus ring */}
          {focusVisible && (
            <span className="pointer-events-none absolute -inset-1 rounded-full ring-2 ring-sky-400/80 ring-offset-2 ring-offset-slate-900" />
          )}
        </motion.div>
      </div>
    </label>
  );
}
```

### Animated Lists with MUI

```tsx
import { AnimatePresence, motion } from 'framer-motion';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

function AnimatedList({ items }) {
  return (
    <List>
      <AnimatePresence initial={false}>
        {items.map((item) => (
          <motion.div
            key={item.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          >
            <ListItem>
              <ListItemText primary={item.name} secondary={item.email} />
            </ListItem>
          </motion.div>
        ))}
      </AnimatePresence>
    </List>
  );
}
```

---

## Custom Theme-Registered Components

Register your own component in the MUI theme so it responds to theme changes like a built-in.

```tsx
// 1. Define the component
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';

interface StatProps {
  label: string;
  value: string | number;
  trend?: 'up' | 'down' | 'flat';
}

const StatRoot = styled(Box, {
  name: 'MuiStat',    // Register in theme as MuiStat
  slot: 'Root',
})(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  gap: theme.spacing(0.5),
  padding: theme.spacing(2, 3),
  borderRadius: theme.shape.borderRadius * 2,
  border: `1px solid ${theme.palette.divider}`,
}));

export function Stat({ label, value, trend }: StatProps) {
  return (
    <StatRoot>
      <Typography variant="caption" color="text.secondary">{label}</Typography>
      <Typography variant="h4">{value}</Typography>
      {trend && <TrendIndicator trend={trend} />}
    </StatRoot>
  );
}

// 2. Register in theme
const theme = createTheme({
  components: {
    MuiStat: {
      defaultProps: {},
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor: theme.palette.background.paper,
          '&:hover': { borderColor: theme.palette.primary.main },
        }),
      },
      variants: [
        {
          props: { variant: 'highlighted' },
          style: ({ theme }) => ({
            borderColor: theme.palette.primary.main,
            backgroundColor: theme.palette.primary.light + '10',
          }),
        },
      ],
    },
  },
});

// 3. TypeScript augmentation
declare module '@mui/material/styles' {
  interface Components {
    MuiStat?: {
      defaultProps?: Partial<StatProps>;
      styleOverrides?: { root?: any };
      variants?: any[];
    };
  }
}
```

---

## Theme as Rules Engine

Encode design decisions in the theme and enforce at compile time:

```ts
// Restrict allowed Button variants in your design system
declare module '@mui/material/Button' {
  interface ButtonPropsVariantOverrides {
    contained: true;
    outlined: true;
    text: false;     // ← disable 'text' variant at compile time
    dashed: true;    // ← add custom variant
    gradient: true;  // ← add custom variant
  }

  interface ButtonPropsColorOverrides {
    inherit: false;  // ← disable inherit color
    brand: true;     // ← add custom brand color
    neutral: true;   // ← add custom neutral color
  }

  interface ButtonPropsSizeOverrides {
    extraLarge: true; // ← add custom size
  }
}
```

Now `<Button variant="text">` is a TypeScript error, enforcing design rules at compile time.
