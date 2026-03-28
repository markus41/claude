---
name: base-headless
description: MUI Base (unstyled/headless) components and hooks — useButton, useInput, useMenu, useSlider for building custom UI
triggers:
  - headless
  - unstyled
  - MUI Base
  - useButton
  - useInput
  - useMenu
  - useSlider
  - custom UI
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

# MUI Base (Headless/Unstyled) Components

## What is MUI Base?

MUI Base (`@mui/base`) is a library of headless (unstyled) React components and hooks. Unlike Material UI, which ships with Material Design styles baked in, MUI Base provides only the logic, state management, accessibility, and keyboard interactions -- zero CSS. You bring your own styles using Tailwind, CSS Modules, styled-components, vanilla CSS, or any approach you prefer.

```bash
npm install @mui/base
# or
pnpm add @mui/base
```

Key characteristics:

- **Zero default styles** -- components render semantic HTML with no class names or CSS
- **Hooks-first API** -- every component has a corresponding hook (`useButton`, `useInput`, etc.) for maximum flexibility
- **WAI-ARIA compliant** -- accessibility is handled internally (focus management, keyboard navigation, ARIA attributes)
- **Small bundle** -- no theme provider, no emotion/styled-engine dependency
- **Composable** -- hooks return prop-getters (`getRootProps`, `getInputProps`) that you spread onto your own elements

## When to Use MUI Base

| Scenario | Use MUI Base? |
|----------|--------------|
| Building a custom design system (not Material Design) | Yes |
| Integrating with Tailwind CSS or other utility-first CSS | Yes |
| Need maximum control over rendered HTML and styles | Yes |
| Want Material Design out of the box | No -- use Material UI |
| Need a quick prototype with default styling | No -- use Material UI or Joy UI |
| Building a white-label product with multiple brand themes | Yes |

## Core Hooks

### useButton

Provides button behavior including click handling, disabled state, focus-visible detection, and keyboard activation.

```tsx
import { useButton } from '@mui/base/useButton';
import { useRef } from 'react';
import clsx from 'clsx';

interface CustomButtonProps {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
  variant?: 'primary' | 'secondary' | 'ghost';
}

function CustomButton({ children, disabled, onClick, variant = 'primary' }: CustomButtonProps) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { getRootProps, active, disabled: isDisabled, focusVisible } = useButton({
    disabled,
    rootRef: buttonRef,
  });

  return (
    <button
      {...getRootProps({ onClick })}
      className={clsx(
        'px-4 py-2 rounded-lg font-medium transition-all',
        variant === 'primary' && 'bg-blue-600 text-white hover:bg-blue-700',
        variant === 'secondary' && 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        variant === 'ghost' && 'bg-transparent text-gray-600 hover:bg-gray-100',
        active && 'scale-95',
        isDisabled && 'opacity-50 cursor-not-allowed',
        focusVisible && 'ring-2 ring-blue-400 ring-offset-2',
      )}
    >
      {children}
    </button>
  );
}
```

**Returned values from `useButton`:**

| Property | Type | Description |
|----------|------|-------------|
| `getRootProps` | `(externalProps?) => props` | Spread onto the root element (button/anchor) |
| `active` | `boolean` | True while the button is being pressed |
| `disabled` | `boolean` | Reflects the disabled state |
| `focusVisible` | `boolean` | True when focused via keyboard (not mouse) |

### useInput

Manages input state including focus, error, and adornment support.

```tsx
import { useInput } from '@mui/base/useInput';
import { useRef } from 'react';
import clsx from 'clsx';

interface CustomInputProps {
  placeholder?: string;
  value?: string;
  onChange?: React.ChangeEventHandler<HTMLInputElement>;
  error?: boolean;
  disabled?: boolean;
  startAdornment?: React.ReactNode;
  endAdornment?: React.ReactNode;
}

function CustomInput({
  placeholder,
  value,
  onChange,
  error,
  disabled,
  startAdornment,
  endAdornment,
}: CustomInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const {
    getRootProps,
    getInputProps,
    focused,
    error: hasError,
    disabled: isDisabled,
  } = useInput({
    value,
    onChange,
    error,
    disabled,
    inputRef,
  });

  return (
    <div
      {...getRootProps()}
      className={clsx(
        'flex items-center gap-2 px-3 py-2 border rounded-lg transition-colors',
        focused && 'border-blue-500 ring-1 ring-blue-500',
        hasError && 'border-red-500 ring-1 ring-red-500',
        isDisabled && 'bg-gray-100 opacity-60',
        !focused && !hasError && 'border-gray-300 hover:border-gray-400',
      )}
    >
      {startAdornment}
      <input
        {...getInputProps()}
        placeholder={placeholder}
        className="flex-1 outline-none bg-transparent text-sm"
      />
      {endAdornment}
    </div>
  );
}

// Usage
<CustomInput
  placeholder="Search..."
  startAdornment={<SearchIcon className="w-4 h-4 text-gray-400" />}
  endAdornment={<kbd className="text-xs text-gray-400">Ctrl+K</kbd>}
/>
```

**Returned values from `useInput`:**

| Property | Type | Description |
|----------|------|-------------|
| `getRootProps` | `(externalProps?) => props` | Spread onto the wrapper element |
| `getInputProps` | `(externalProps?) => props` | Spread onto the `<input>` element |
| `focused` | `boolean` | True when the input has focus |
| `error` | `boolean` | Reflects the error state |
| `disabled` | `boolean` | Reflects the disabled state |
| `value` | `string` | Current input value (controlled) |

### useMenu / useMenuItem

Build accessible dropdown menus with keyboard navigation, highlight management, and open/close state.

```tsx
import { useMenu } from '@mui/base/useMenu';
import { useMenuItem } from '@mui/base/useMenuItem';
import { useDropdown, DropdownContext } from '@mui/base/useDropdown';
import { useMenuButton } from '@mui/base/useMenuButton';
import { useRef, useState } from 'react';
import clsx from 'clsx';

function MenuButton({ children }: { children: React.ReactNode }) {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { getRootProps, active } = useMenuButton({ rootRef: buttonRef });

  return (
    <button
      {...getRootProps()}
      className={clsx(
        'px-4 py-2 bg-white border rounded-lg shadow-sm hover:bg-gray-50',
        active && 'bg-gray-100',
      )}
    >
      {children}
    </button>
  );
}

function MenuItem({
  children,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  const ref = useRef<HTMLLIElement>(null);
  const { getRootProps, highlighted, disabled: isDisabled } = useMenuItem({
    rootRef: ref,
    onClick,
    disabled,
  });

  return (
    <li
      {...getRootProps()}
      className={clsx(
        'px-4 py-2 text-sm cursor-pointer transition-colors',
        highlighted && 'bg-blue-50 text-blue-700',
        isDisabled && 'text-gray-400 cursor-not-allowed',
        !highlighted && !isDisabled && 'text-gray-700 hover:bg-gray-50',
      )}
    >
      {children}
    </li>
  );
}

function Menu({ children }: { children: React.ReactNode }) {
  const listboxRef = useRef<HTMLUListElement>(null);
  const { getListboxProps, open } = useMenu({ listboxRef });

  if (!open) return null;

  return (
    <ul
      {...getListboxProps()}
      className="absolute mt-1 w-56 bg-white border rounded-lg shadow-lg py-1 z-50"
    >
      {children}
    </ul>
  );
}

// Full dropdown composition
function CustomDropdown() {
  const { contextValue } = useDropdown();

  return (
    <DropdownContext.Provider value={contextValue}>
      <div className="relative inline-block">
        <MenuButton>Actions</MenuButton>
        <Menu>
          <MenuItem onClick={() => console.log('Edit')}>Edit</MenuItem>
          <MenuItem onClick={() => console.log('Duplicate')}>Duplicate</MenuItem>
          <MenuItem disabled>Archive</MenuItem>
          <MenuItem onClick={() => console.log('Delete')}>Delete</MenuItem>
        </Menu>
      </div>
    </DropdownContext.Provider>
  );
}
```

**Key props from `useMenu`:**

| Property | Type | Description |
|----------|------|-------------|
| `getListboxProps` | `(externalProps?) => props` | Spread onto the `<ul>` element |
| `open` | `boolean` | Whether the menu is open |
| `highlightedValue` | `string \| null` | Currently highlighted item value |
| `dispatch` | `function` | Dispatch menu actions (highlight, select, close) |

### useSlider

Full slider behavior with thumb positioning, marks, range support, and value management.

```tsx
import { useSlider } from '@mui/base/useSlider';
import { useRef } from 'react';
import clsx from 'clsx';

interface CustomSliderProps {
  value?: number;
  defaultValue?: number;
  min?: number;
  max?: number;
  step?: number;
  onChange?: (event: Event, value: number | number[]) => void;
  marks?: boolean | Array<{ value: number; label?: string }>;
  disabled?: boolean;
}

function CustomSlider({
  value,
  defaultValue = 50,
  min = 0,
  max = 100,
  step = 1,
  onChange,
  marks,
  disabled,
}: CustomSliderProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const {
    getRootProps,
    getThumbProps,
    getRailProps,
    getTrackProps,
    active,
    values,
    dragging,
  } = useSlider({
    value: value !== undefined ? [value] : undefined,
    defaultValue: [defaultValue],
    min,
    max,
    step,
    onChange,
    disabled,
    rootRef,
  });

  const percentage = ((values[0] - min) / (max - min)) * 100;

  return (
    <div className="w-full py-4">
      <div
        {...getRootProps()}
        className={clsx(
          'relative h-2 cursor-pointer',
          disabled && 'opacity-50 cursor-not-allowed',
        )}
      >
        {/* Rail (background track) */}
        <span
          {...getRailProps()}
          className="absolute w-full h-full rounded-full bg-gray-200"
        />

        {/* Active track */}
        <span
          {...getTrackProps()}
          className="absolute h-full rounded-full bg-blue-500"
          style={{ width: `${percentage}%` }}
        />

        {/* Thumb */}
        <span
          {...getThumbProps(0)}
          className={clsx(
            'absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5',
            'rounded-full bg-white border-2 border-blue-500 shadow-md',
            'transition-shadow hover:shadow-lg',
            active === 0 && 'shadow-lg ring-4 ring-blue-100',
            dragging && 'scale-110',
          )}
          style={{ left: `${percentage}%` }}
        />
      </div>

      {/* Value label */}
      <div className="mt-2 text-sm text-gray-600 text-center">
        {values[0]}
      </div>
    </div>
  );
}

// Usage
<CustomSlider
  defaultValue={30}
  min={0}
  max={100}
  step={5}
  onChange={(_, val) => console.log(val)}
/>
```

**Returned values from `useSlider`:**

| Property | Type | Description |
|----------|------|-------------|
| `getRootProps` | `(externalProps?) => props` | Spread onto the container |
| `getThumbProps` | `(index) => props` | Spread onto each thumb element |
| `getRailProps` | `() => props` | Spread onto the rail (full track background) |
| `getTrackProps` | `() => props` | Spread onto the active track fill |
| `values` | `number[]` | Current value(s) -- array for range sliders |
| `active` | `number` | Index of the active thumb (-1 if none) |
| `dragging` | `boolean` | True while a thumb is being dragged |

### useSwitch

Toggle switch behavior with checked state management and accessibility.

```tsx
import { useSwitch } from '@mui/base/useSwitch';
import clsx from 'clsx';

interface CustomSwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onChange?: (event: React.ChangeEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  label?: string;
}

function CustomSwitch({
  checked,
  defaultChecked,
  onChange,
  disabled,
  label,
}: CustomSwitchProps) {
  const {
    getInputProps,
    checked: isChecked,
    disabled: isDisabled,
    focusVisible,
  } = useSwitch({
    checked,
    defaultChecked,
    onChange,
    disabled,
  });

  return (
    <label className={clsx(
      'inline-flex items-center gap-3 cursor-pointer',
      isDisabled && 'opacity-50 cursor-not-allowed',
    )}>
      <span className="relative">
        <input {...getInputProps()} className="sr-only" />
        <span
          className={clsx(
            'block w-10 h-6 rounded-full transition-colors',
            isChecked ? 'bg-blue-600' : 'bg-gray-300',
            focusVisible && 'ring-2 ring-blue-400 ring-offset-2',
          )}
        />
        <span
          className={clsx(
            'absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform',
            isChecked && 'translate-x-4',
          )}
        />
      </span>
      {label && <span className="text-sm text-gray-700">{label}</span>}
    </label>
  );
}
```

### useSelect

Custom select/dropdown with option management, keyboard navigation, and multi-select support.

```tsx
import { useSelect } from '@mui/base/useSelect';
import { useRef, useState } from 'react';
import clsx from 'clsx';

interface Option {
  value: string;
  label: string;
  disabled?: boolean;
}

interface CustomSelectProps {
  options: Option[];
  value?: string;
  onChange?: (value: string | null) => void;
  placeholder?: string;
}

function CustomSelect({ options, value, onChange, placeholder = 'Select...' }: CustomSelectProps) {
  const listboxRef = useRef<HTMLUListElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const {
    getButtonProps,
    getListboxProps,
    getOptionProps,
    open,
    value: selectedValue,
    highlightedOption,
  } = useSelect<string, false>({
    listboxRef,
    buttonRef,
    options: options.map((opt) => ({
      value: opt.value,
      label: opt.label,
      disabled: opt.disabled,
    })),
    value,
    onChange: (_, newValue) => onChange?.(newValue),
  });

  const selectedLabel = options.find((o) => o.value === selectedValue)?.label;

  return (
    <div className="relative inline-block w-64">
      <button
        {...getButtonProps()}
        className={clsx(
          'w-full px-4 py-2 text-left bg-white border rounded-lg shadow-sm',
          'flex items-center justify-between',
          open && 'border-blue-500 ring-1 ring-blue-500',
          !open && 'border-gray-300 hover:border-gray-400',
        )}
      >
        <span className={selectedLabel ? 'text-gray-900' : 'text-gray-400'}>
          {selectedLabel || placeholder}
        </span>
        <ChevronDownIcon className={clsx('w-4 h-4 transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <ul
          {...getListboxProps()}
          className="absolute mt-1 w-full bg-white border rounded-lg shadow-lg py-1 z-50 max-h-60 overflow-auto"
        >
          {options.map((option) => (
            <li
              key={option.value}
              {...getOptionProps(option.value)}
              className={clsx(
                'px-4 py-2 text-sm cursor-pointer',
                highlightedOption === option.value && 'bg-blue-50 text-blue-700',
                option.value === selectedValue && 'font-medium',
                option.disabled && 'text-gray-400 cursor-not-allowed',
              )}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

### useTabs / useTab

Accessible tab navigation with panel association and keyboard support.

```tsx
import { useTabs } from '@mui/base/useTabs';
import { useTab } from '@mui/base/useTab';
import { useTabPanel } from '@mui/base/useTabPanel';
import { useTabsList } from '@mui/base/useTabsList';
import { useRef } from 'react';
import clsx from 'clsx';

function CustomTabs({ children, defaultValue }: { children: React.ReactNode; defaultValue: string }) {
  const { contextValue } = useTabs({ defaultValue });

  return (
    <TabsContext.Provider value={contextValue}>
      {children}
    </TabsContext.Provider>
  );
}

function TabsList({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { getRootProps } = useTabsList({ rootRef: ref });

  return (
    <div
      {...getRootProps()}
      className="flex border-b border-gray-200 gap-1"
    >
      {children}
    </div>
  );
}

function Tab({ value, children }: { value: string; children: React.ReactNode }) {
  const ref = useRef<HTMLButtonElement>(null);
  const { getRootProps, selected, highlighted } = useTab({ value, rootRef: ref });

  return (
    <button
      {...getRootProps()}
      className={clsx(
        'px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors',
        selected && 'border-blue-500 text-blue-600',
        !selected && 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300',
        highlighted && 'bg-gray-50',
      )}
    >
      {children}
    </button>
  );
}

function TabPanel({ value, children }: { value: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const { getRootProps, hidden } = useTabPanel({ value, rootRef: ref });

  if (hidden) return null;

  return (
    <div {...getRootProps()} className="py-4">
      {children}
    </div>
  );
}

// Usage
<CustomTabs defaultValue="tab1">
  <TabsList>
    <Tab value="tab1">Overview</Tab>
    <Tab value="tab2">Features</Tab>
    <Tab value="tab3">Pricing</Tab>
  </TabsList>
  <TabPanel value="tab1">Overview content...</TabPanel>
  <TabPanel value="tab2">Features content...</TabPanel>
  <TabPanel value="tab3">Pricing content...</TabPanel>
</CustomTabs>
```

## Tailwind CSS Integration

MUI Base hooks are the ideal companion for Tailwind CSS because they handle behavior while Tailwind handles presentation.

### Pattern: Hook + Tailwind utility classes

```tsx
import { useButton } from '@mui/base/useButton';
import { cva, type VariantProps } from 'class-variance-authority';

// Define variants with cva (class-variance-authority)
const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:ring-2 focus-visible:ring-offset-2',
  {
    variants: {
      variant: {
        default: 'bg-blue-600 text-white hover:bg-blue-700 focus-visible:ring-blue-500',
        destructive: 'bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-500',
        outline: 'border border-gray-300 bg-white hover:bg-gray-50 focus-visible:ring-gray-500',
        ghost: 'hover:bg-gray-100 focus-visible:ring-gray-500',
      },
      size: {
        sm: 'h-8 px-3 text-xs',
        md: 'h-10 px-4 text-sm',
        lg: 'h-12 px-6 text-base',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'md',
    },
  }
);

interface ButtonProps extends VariantProps<typeof buttonVariants> {
  children: React.ReactNode;
  disabled?: boolean;
  onClick?: React.MouseEventHandler;
}

function Button({ children, variant, size, disabled, onClick }: ButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const { getRootProps, active, focusVisible } = useButton({ disabled, rootRef: ref });

  return (
    <button
      {...getRootProps({ onClick })}
      className={clsx(
        buttonVariants({ variant, size }),
        active && 'scale-[0.98]',
        disabled && 'opacity-50 pointer-events-none',
      )}
    >
      {children}
    </button>
  );
}
```

### Pattern: Composing multiple hooks into a form

```tsx
function SearchForm() {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const { getInputProps, getRootProps: getInputRootProps, focused } = useInput({
    value: query,
    onChange: (e) => setQuery((e.target as HTMLInputElement).value),
    inputRef,
  });

  const buttonRef = useRef<HTMLButtonElement>(null);
  const { getRootProps: getButtonRootProps } = useButton({ rootRef: buttonRef });

  return (
    <form className="flex gap-2">
      <div
        {...getInputRootProps()}
        className={clsx(
          'flex-1 border rounded-lg px-3 py-2',
          focused ? 'border-blue-500 ring-1 ring-blue-500' : 'border-gray-300',
        )}
      >
        <input
          {...getInputProps()}
          placeholder="Search..."
          className="w-full outline-none bg-transparent"
        />
      </div>
      <button
        {...getButtonRootProps()}
        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
      >
        Search
      </button>
    </form>
  );
}
```

## Comparison: MUI Base vs Material UI vs Radix / Headless UI

| Feature | MUI Base | Material UI | Radix UI | Headless UI |
|---------|----------|-------------|----------|-------------|
| **Styles included** | None | Material Design | None | None |
| **API style** | Hooks + components | Components | Components (primitives) | Components |
| **Bundle size** | Small | Large | Small | Small |
| **Accessibility** | Built-in | Built-in | Built-in | Built-in |
| **TypeScript** | Full | Full | Full | Full |
| **Theme system** | None (bring your own) | Full theme provider | CSS variables | None |
| **Component count** | ~15 hooks | 40+ components | 25+ primitives | ~10 components |
| **Learning curve** | Moderate (hooks pattern) | Low (ready-made) | Low-moderate | Low |
| **Best for** | Custom design systems | Quick Material Design apps | Custom + Tailwind | Tailwind projects |
| **React Server Components** | Compatible | Needs 'use client' | Compatible | Compatible |
| **Maintained by** | MUI team | MUI team | WorkOS | Tailwind Labs |

### When to choose MUI Base over alternatives

- You are already using other MUI packages and want consistency in the hooks API
- You need more granular control than Radix provides (prop-getters vs render props)
- You want a single vendor for both unstyled and styled components (can mix `@mui/base` and `@mui/material`)
- You prefer the hooks-first pattern over compound component patterns used by Radix

### When to choose Radix or Headless UI instead

- You want a larger set of ready-made primitives (Radix has Dialog, Popover, Toast, Tooltip, etc.)
- You prefer the composition/slot pattern over hooks
- Your project is purely Tailwind-based and you want the tightest Tailwind integration (Headless UI)

---

## Advanced: OwnerState-Driven Slots

Slots receive `ownerState` — the component's internal state plus custom flags you inject.

```tsx
import Switch from '@mui/base/Switch';
import { styled } from '@mui/system';

// Extended owner state with custom "critical" flag
interface AdvancedOwnerState {
  checked: boolean;
  disabled: boolean;
  focusVisible: boolean;
  critical?: boolean;
}

const Track = styled('span', {
  shouldForwardProp: (prop) => prop !== 'ownerState',
})<{ ownerState: AdvancedOwnerState }>(({ ownerState }) => ({
  width: 46,
  height: 24,
  borderRadius: 999,
  backgroundColor: ownerState.checked
    ? ownerState.critical ? 'rgba(239,68,68,0.25)' : 'rgba(56,189,248,0.25)'
    : 'rgba(15,23,42,0.85)',
  transition: 'background-color 150ms ease',
}));

const Thumb = styled('span', {
  shouldForwardProp: (prop) => prop !== 'ownerState',
})<{ ownerState: AdvancedOwnerState }>(({ ownerState }) => ({
  position: 'absolute',
  top: 2,
  left: ownerState.checked ? 24 : 2,
  width: 20,
  height: 20,
  borderRadius: '50%',
  background: 'linear-gradient(135deg, #f9fafb, #e5e7eb)',
  transition: 'left 150ms cubic-bezier(0.4, 0, 0.2, 1)',
}));

// Inject custom ownerState via slotProps callback
<Switch
  slots={{ track: Track, thumb: Thumb, input: 'input' }}
  slotProps={{
    track: (baseOwnerState) => ({
      ownerState: { ...baseOwnerState, critical: true } as AdvancedOwnerState,
    }),
    thumb: (baseOwnerState) => ({
      ownerState: { ...baseOwnerState, critical: true } as AdvancedOwnerState,
    }),
    input: { className: 'sr-only' },
  }}
/>
```

**Pattern applies to all Base UI components** — Tabs, Menus, Comboboxes, Sliders.
Custom `ownerState` flags let you drive complex visual states from a single prop.

---

## Advanced: Slot Wrappers for Third-Party Libraries

Wrap external components in slot-compatible components that filter ownerState:

```tsx
// Prevent ownerState from leaking onto DOM of a third-party component
const ChartSlot = forwardRef<HTMLDivElement, { ownerState?: any; data: number[] }>(
  ({ ownerState, data, ...props }, ref) => {
    // Extract only what we need from ownerState
    const isExpanded = ownerState?.expanded ?? false;
    return (
      <div ref={ref} {...props}>
        <ThirdPartyChart data={data} height={isExpanded ? 400 : 200} />
      </div>
    );
  },
);
```
