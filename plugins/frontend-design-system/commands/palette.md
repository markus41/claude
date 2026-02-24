---
name: palette
intent: Generate color palettes from design style characteristics
tags:
  - frontend-design-system
  - command
  - palette
inputs: []
risk: medium
cost: medium
description: Generate color palettes from design style characteristics
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Color Palette Generation Command

Generate comprehensive color palettes from design styles with semantic colors, contrast ratios, and accessibility validation.

## Usage

```bash
/palette <style_name> [mode]
```

## Arguments

- `style_name` (required): Design style name to extract palette from
- `mode` (optional): Color mode - `light`, `dark`, or `both` (default: `both`)

## Examples

```bash
# Generate full palette from Material Design
/palette "Material Design"

# Generate dark mode palette only
/palette Glassmorphism dark

# Generate both light and dark palettes
/palette Neumorphism both

# Generate light mode palette
/palette "Modern Minimalist" light
```

## Execution Flow

### 1. Load Design Style

Extract style characteristics and base colors from the design style database.

### 2. Generate Color Scales

For each primary color, generate a complete 50-900 scale:

```typescript
// utils/generateColorScale.ts
interface Color {
  h: number; // Hue (0-360)
  s: number; // Saturation (0-100)
  l: number; // Lightness (0-100)
}

export function generateColorScale(baseColor: string): Record<number, string> {
  const base = hexToHSL(baseColor);

  return {
    50: hslToHex({ ...base, l: 95 }),
    100: hslToHex({ ...base, l: 90 }),
    200: hslToHex({ ...base, l: 80 }),
    300: hslToHex({ ...base, l: 70 }),
    400: hslToHex({ ...base, l: 60 }),
    500: baseColor, // Base color
    600: hslToHex({ ...base, l: 45 }),
    700: hslToHex({ ...base, l: 35 }),
    800: hslToHex({ ...base, l: 25 }),
    900: hslToHex({ ...base, l: 15 }),
  };
}
```

### 3. Generate Semantic Colors

```typescript
// palettes/{style}/semantic.ts
export const semanticColors = {
  light: {
    // Background colors
    background: {
      default: '#FFFFFF',
      paper: '#FAFAFA',
      elevated: '#FFFFFF',
      overlay: 'rgba(0, 0, 0, 0.5)',
    },

    // Surface colors
    surface: {
      default: '#FFFFFF',
      hover: '#F5F5F5',
      active: '#EEEEEE',
      disabled: '#E0E0E0',
    },

    // Text colors
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.60)',
      disabled: 'rgba(0, 0, 0, 0.38)',
      hint: 'rgba(0, 0, 0, 0.38)',
      inverse: '#FFFFFF',
    },

    // Border colors
    border: {
      default: '#E0E0E0',
      light: '#F5F5F5',
      medium: '#BDBDBD',
      strong: '#9E9E9E',
      focus: '#2196F3',
      error: '#F44336',
    },

    // Divider
    divider: 'rgba(0, 0, 0, 0.12)',

    // State colors
    states: {
      hover: 'rgba(0, 0, 0, 0.04)',
      selected: 'rgba(33, 150, 243, 0.08)',
      focus: 'rgba(33, 150, 243, 0.12)',
      focusVisible: 'rgba(33, 150, 243, 0.3)',
      disabled: 'rgba(0, 0, 0, 0.12)',
    },
  },

  dark: {
    // Background colors
    background: {
      default: '#121212',
      paper: '#1E1E1E',
      elevated: '#2A2A2A',
      overlay: 'rgba(0, 0, 0, 0.7)',
    },

    // Surface colors
    surface: {
      default: '#1E1E1E',
      hover: '#2A2A2A',
      active: '#353535',
      disabled: '#404040',
    },

    // Text colors
    text: {
      primary: 'rgba(255, 255, 255, 0.87)',
      secondary: 'rgba(255, 255, 255, 0.60)',
      disabled: 'rgba(255, 255, 255, 0.38)',
      hint: 'rgba(255, 255, 255, 0.38)',
      inverse: 'rgba(0, 0, 0, 0.87)',
    },

    // Border colors
    border: {
      default: '#404040',
      light: '#2A2A2A',
      medium: '#757575',
      strong: '#9E9E9E',
      focus: '#64B5F6',
      error: '#EF5350',
    },

    // Divider
    divider: 'rgba(255, 255, 255, 0.12)',

    // State colors
    states: {
      hover: 'rgba(255, 255, 255, 0.08)',
      selected: 'rgba(100, 181, 246, 0.16)',
      focus: 'rgba(100, 181, 246, 0.24)',
      focusVisible: 'rgba(100, 181, 246, 0.3)',
      disabled: 'rgba(255, 255, 255, 0.12)',
    },
  },
};
```

### 4. Validate Contrast Ratios

```typescript
// utils/contrastRatio.ts
export function getContrastRatio(foreground: string, background: string): number {
  const fgLuminance = getRelativeLuminance(foreground);
  const bgLuminance = getRelativeLuminance(background);

  const lighter = Math.max(fgLuminance, bgLuminance);
  const darker = Math.min(fgLuminance, bgLuminance);

  return (lighter + 0.05) / (darker + 0.05);
}

export function validateWCAG(
  foreground: string,
  background: string,
  level: 'AA' | 'AAA' = 'AA',
  size: 'normal' | 'large' = 'normal'
): boolean {
  const ratio = getContrastRatio(foreground, background);

  if (level === 'AAA') {
    return size === 'large' ? ratio >= 4.5 : ratio >= 7;
  }

  return size === 'large' ? ratio >= 3 : ratio >= 4.5;
}
```

### 5. Generate Palette Files

#### TypeScript Palette

```typescript
// palettes/{style}/palette.ts
export const palette = {
  primary: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3', // Base
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  secondary: {
    50: '#FCE4EC',
    100: '#F8BBD0',
    200: '#F48FB1',
    300: '#F06292',
    400: '#EC407A',
    500: '#E91E63', // Base
    600: '#D81B60',
    700: '#C2185B',
    800: '#AD1457',
    900: '#880E4F',
  },

  accent: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800', // Base
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  // Semantic colors
  success: {
    50: '#E8F5E9',
    100: '#C8E6C9',
    200: '#A5D6A7',
    300: '#81C784',
    400: '#66BB6A',
    500: '#4CAF50',
    600: '#43A047',
    700: '#388E3C',
    800: '#2E7D32',
    900: '#1B5E20',
  },

  warning: {
    50: '#FFF3E0',
    100: '#FFE0B2',
    200: '#FFCC80',
    300: '#FFB74D',
    400: '#FFA726',
    500: '#FF9800',
    600: '#FB8C00',
    700: '#F57C00',
    800: '#EF6C00',
    900: '#E65100',
  },

  error: {
    50: '#FFEBEE',
    100: '#FFCDD2',
    200: '#EF9A9A',
    300: '#E57373',
    400: '#EF5350',
    500: '#F44336',
    600: '#E53935',
    700: '#D32F2F',
    800: '#C62828',
    900: '#B71C1C',
  },

  info: {
    50: '#E3F2FD',
    100: '#BBDEFB',
    200: '#90CAF9',
    300: '#64B5F6',
    400: '#42A5F5',
    500: '#2196F3',
    600: '#1E88E5',
    700: '#1976D2',
    800: '#1565C0',
    900: '#0D47A1',
  },

  neutral: {
    50: '#FAFAFA',
    100: '#F5F5F5',
    200: '#EEEEEE',
    300: '#E0E0E0',
    400: '#BDBDBD',
    500: '#9E9E9E',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
} as const;

export type Palette = typeof palette;
export type ColorScale = typeof palette.primary;
```

#### CSS Variables

```css
/* palettes/{style}/palette.css */
:root {
  /* Primary */
  --color-primary-50: #E3F2FD;
  --color-primary-100: #BBDEFB;
  --color-primary-200: #90CAF9;
  --color-primary-300: #64B5F6;
  --color-primary-400: #42A5F5;
  --color-primary-500: #2196F3;
  --color-primary-600: #1E88E5;
  --color-primary-700: #1976D2;
  --color-primary-800: #1565C0;
  --color-primary-900: #0D47A1;

  /* Secondary */
  --color-secondary-50: #FCE4EC;
  /* ... */

  /* Semantic - Light mode (default) */
  --color-background-default: #FFFFFF;
  --color-background-paper: #FAFAFA;
  --color-text-primary: rgba(0, 0, 0, 0.87);
  --color-text-secondary: rgba(0, 0, 0, 0.60);
  --color-border-default: #E0E0E0;
  --color-divider: rgba(0, 0, 0, 0.12);
}

/* Dark mode */
[data-theme="dark"] {
  --color-background-default: #121212;
  --color-background-paper: #1E1E1E;
  --color-text-primary: rgba(255, 255, 255, 0.87);
  --color-text-secondary: rgba(255, 255, 255, 0.60);
  --color-border-default: #404040;
  --color-divider: rgba(255, 255, 255, 0.12);
}
```

#### Tailwind Config

```javascript
// palettes/{style}/tailwind.palette.js
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: {
          50: '#E3F2FD',
          100: '#BBDEFB',
          200: '#90CAF9',
          300: '#64B5F6',
          400: '#42A5F5',
          500: '#2196F3',
          600: '#1E88E5',
          700: '#1976D2',
          800: '#1565C0',
          900: '#0D47A1',
        },
        // ... other colors
      },
    },
  },
};
```

### 6. Generate Accessibility Report

```markdown
# Color Palette Accessibility Report - {style}

## WCAG Compliance

### Text on Background

| Foreground | Background | Contrast Ratio | WCAG AA | WCAG AAA |
|------------|------------|----------------|---------|----------|
| Primary 500 | White | 4.52:1 | ✅ Pass | ❌ Fail |
| Primary 700 | White | 7.21:1 | ✅ Pass | ✅ Pass |
| Text Primary | Bg Default | 15.8:1 | ✅ Pass | ✅ Pass |
| Text Secondary | Bg Default | 7.2:1 | ✅ Pass | ✅ Pass |

### Recommendations

1. ✅ All primary text colors meet WCAG AA standards
2. ⚠️  Primary-500 on white backgrounds requires large text (18px+) for AAA compliance
3. ✅ Dark mode colors meet accessibility standards
4. ⚠️  Warning-400 has low contrast on white - use Warning-600 for text

## Color Blindness Simulation

Testing palette with common color vision deficiencies:

- Protanopia (Red-blind): Primary and Error colors may appear similar
- Deuteranopia (Green-blind): Success and Warning colors distinguishable
- Tritanopia (Blue-blind): Primary and Secondary colors clear

Recommendation: Use icons and labels alongside color indicators.
```

### 7. Generate Color Swatches (HTML Preview)

```html
<!-- palettes/{style}/preview.html -->
<!DOCTYPE html>
<html>
<head>
  <title>{style} Color Palette</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      padding: 2rem;
      background: #f5f5f5;
    }

    .palette-section {
      margin-bottom: 2rem;
    }

    .palette-title {
      font-size: 1.5rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .color-scale {
      display: flex;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }

    .color-swatch {
      flex: 1;
      padding: 2rem 1rem;
      text-align: center;
      color: white;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .color-value {
      display: block;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      opacity: 0.9;
    }
  </style>
</head>
<body>
  <h1>{style} Color Palette</h1>

  <div class="palette-section">
    <div class="palette-title">Primary</div>
    <div class="color-scale">
      <div class="color-swatch" style="background: #E3F2FD; color: #000;">
        50<span class="color-value">#E3F2FD</span>
      </div>
      <!-- More swatches... -->
    </div>
  </div>

  <!-- More palette sections... -->
</body>
</html>
```

### 8. Generate Color Usage Guide

```markdown
# {style} Color Palette Usage Guide

## Primary Colors

Use for:
- Primary actions (buttons, links)
- Active navigation items
- Progress indicators
- Focus states

```tsx
<Button style={{ backgroundColor: palette.primary[500] }}>
  Primary Action
</Button>
```

## Secondary Colors

Use for:
- Secondary actions
- Alternative emphasis
- Accents and highlights

## Semantic Colors

### Success (Green)
- Success messages
- Completed states
- Positive indicators

### Warning (Orange/Yellow)
- Warning messages
- Caution states
- Important notices

### Error (Red)
- Error messages
- Failed states
- Destructive actions

### Info (Blue)
- Informational messages
- Help text
- Tips and hints

## Neutral Colors

Use for:
- Text colors (700-900 for light mode)
- Backgrounds (50-200)
- Borders and dividers (200-400)
- Disabled states (400-500)

## Dark Mode

All colors have been optimized for dark mode. Use lighter shades (100-400) for dark backgrounds:

```css
[data-theme="dark"] {
  --text-primary: var(--color-primary-200);
  --background: var(--color-neutral-900);
}
```
```

## Output

```
✅ Color Palette Generated: {style}

Mode: {mode}
Colors: {count} scales

Files created:
- palettes/{style}/palette.ts (TypeScript)
- palettes/{style}/palette.css (CSS variables)
- palettes/{style}/semantic.ts (Semantic colors)
- palettes/{style}/tailwind.palette.js (Tailwind config)
- palettes/{style}/preview.html (Visual preview)
- palettes/{style}/accessibility-report.md
- palettes/{style}/usage-guide.md

Accessibility:
✅ WCAG AA compliance: 98%
⚠️  WCAG AAA compliance: 87%
✅ Color blindness tested

Next steps:
1. Review preview: open palettes/{style}/preview.html
2. Import palette: import { palette } from '@/palettes/{style}/palette';
3. Check accessibility report for recommendations
4. Apply to components: /component button {style}
```

## Validation

- All color scales must have values for 50, 100, 200, ..., 900
- Primary text must have 4.5:1 contrast ratio on backgrounds (WCAG AA)
- Large text (18px+) must have 3:1 contrast ratio (WCAG AA)
- Verify color values are valid hex codes
- Test dark mode color combinations

## Related Commands

- `/style {style}` - Apply full design style
- `/tokens colors {style}` - Export color tokens only
- `/theme create {tenant}` - Create tenant theme with palette
- `/component button {style}` - Generate components with palette
