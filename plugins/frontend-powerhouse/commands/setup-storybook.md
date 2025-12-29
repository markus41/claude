---
name: setup-storybook
description: Initialize Storybook with Chakra UI integration and optimal configuration
allowed-tools:
  - Write
  - Read
  - Edit
  - Bash
  - Glob
---

# Setup Storybook Command

You are being invoked as the `/setup-storybook` slash command for the frontend-powerhouse plugin.

## Your Task

Initialize Storybook with Chakra UI integration, optimal configuration, and best practices. Use the **storybook-documenter** agent to set up the complete Storybook environment.

## Arguments

None required - this command sets up a complete Storybook configuration.

## Instructions

1. **Activate the storybook-documenter agent** via the Task tool
2. The agent will:
   - Install Storybook dependencies
   - Configure Storybook for React + TypeScript + Chakra UI
   - Set up preview decorators for Chakra provider
   - Configure addons (a11y, controls, actions, viewport)
   - Create example stories
   - Set up theme switching support
   - Configure MDX documentation
3. Ensure Storybook works with the existing build setup (Vite/Webpack)

## Expected Output Structure

```
.storybook/
├── main.ts                    # Storybook configuration
├── preview.tsx                # Preview configuration with decorators
├── manager.ts                 # Manager customization
└── theme.ts                   # Storybook UI theme

src/
└── stories/
    ├── Introduction.mdx       # Welcome documentation
    ├── DesignTokens.mdx      # Design system tokens
    └── Examples/
        ├── Button.stories.tsx
        ├── Form.stories.tsx
        └── Card.stories.tsx
```

## Storybook Configuration

### Main Configuration
```typescript
// .storybook/main.ts
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@chakra-ui/storybook-addon',
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

### Preview Configuration with Chakra
```typescript
// .storybook/preview.tsx
import { ChakraProvider } from '@chakra-ui/react';
import theme from '../src/theme';

export const decorators = [
  (Story) => (
    <ChakraProvider theme={theme}>
      <Story />
    </ChakraProvider>
  ),
];

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
  chakra: {
    theme,
  },
};
```

## Addons to Install

- **@storybook/addon-essentials**: Controls, actions, viewport, backgrounds, toolbars, measure, outline
- **@storybook/addon-a11y**: Accessibility testing
- **@storybook/addon-interactions**: Interaction testing
- **@chakra-ui/storybook-addon**: Chakra theme switcher
- **@storybook/addon-links**: Link between stories

## Features to Configure

### 1. Theme Switching
Enable switching between light/dark mode and different themes in Storybook.

### 2. Accessibility Testing
Automatic a11y checks for every story with violations highlighted.

### 3. Responsive Viewports
Preset viewports for mobile, tablet, desktop testing.

### 4. Auto-docs
Automatic documentation generation from component props.

### 5. MDX Documentation
Rich documentation with code examples.

## Example Story

```tsx
// src/components/Button/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['solid', 'outline', 'ghost', 'link'],
    },
    colorScheme: {
      control: 'select',
      options: ['brand', 'gray', 'red', 'green', 'blue'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Button',
    variant: 'solid',
    colorScheme: 'brand',
  },
};

export const Outline: Story = {
  args: {
    children: 'Button',
    variant: 'outline',
  },
};

export const WithIcon: Story = {
  args: {
    children: 'Download',
    leftIcon: <DownloadIcon />,
  },
};

export const Loading: Story = {
  args: {
    children: 'Please wait',
    isLoading: true,
  },
};
```

## Usage Examples

```bash
# Set up Storybook in the project
/setup-storybook
```

After setup, the command should provide:
1. Instructions to run Storybook: `npm run storybook`
2. Instructions to build Storybook: `npm run build-storybook`
3. Example stories created
4. Documentation URLs

## Delegation Pattern

```typescript
// Use Task tool to delegate to storybook-documenter
task: {
  agent: "storybook-documenter",
  prompt: "Initialize Storybook with Chakra UI integration, a11y addon, and example stories",
  model: "sonnet"
}
```

## Package.json Scripts

The agent should add these scripts:

```json
{
  "scripts": {
    "storybook": "storybook dev -p 6006",
    "build-storybook": "storybook build"
  }
}
```

## Quality Checklist

After setup, verify:
- [ ] Storybook starts without errors
- [ ] Chakra UI theme is applied correctly
- [ ] Dark mode toggle works
- [ ] Accessibility addon shows results
- [ ] Controls work for component props
- [ ] Actions log events properly
- [ ] MDX documentation renders correctly
- [ ] Example stories are visible

The agent should test the Storybook setup and report any issues.
