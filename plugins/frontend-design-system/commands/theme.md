---
name: theme
intent: Generate and manage multi-tenant themes with Keycloak integration
tags:
  - frontend-design-system
  - command
  - theme
inputs: []
risk: medium
cost: medium
description: Generate and manage multi-tenant themes with Keycloak integration
allowed-tools:
  - Read
  - Write
  - Glob
  - Grep
  - Bash
---

# Multi-Tenant Theme Management Command

Create, update, and export multi-tenant themes with Keycloak realm integration and design token synchronization.

## Usage

```bash
/theme <action> [tenant]
```

## Arguments

- `action` (required): Action to perform - `create`, `update`, or `export`
- `tenant` (optional): Tenant/realm identifier (defaults to all tenants)

## Examples

```bash
# Create a new theme for tenant "acme"
/theme create acme

# Update existing theme for tenant "techcorp"
/theme update techcorp

# Export all themes to Keycloak-compatible format
/theme export

# Export specific tenant theme
/theme export acme
```

## Execution Flow

### 1. Tenant Discovery

```bash
# Scan for tenant configurations
# Look for: config/tenants/*.json or config/realms/*.json

# Example tenant config structure:
{
  "tenant_id": "acme",
  "realm": "acme-realm",
  "brand": {
    "name": "ACME Corporation",
    "primary_color": "#FF6B35",
    "secondary_color": "#004E89",
    "logo_url": "/assets/tenants/acme/logo.svg"
  },
  "keycloak": {
    "realm_name": "acme-realm",
    "theme_name": "acme-theme"
  }
}
```

### 2. Action: Create Theme

When creating a new multi-tenant theme:

#### Step 1: Generate Tenant Configuration

```json
// config/tenants/{tenant}.json
{
  "tenant_id": "{tenant}",
  "realm": "{tenant}-realm",
  "brand": {
    "name": "{Tenant Name}",
    "primary_color": "#0066CC",
    "secondary_color": "#00CC66",
    "accent_color": "#FFB800",
    "logo_url": "/assets/tenants/{tenant}/logo.svg",
    "favicon_url": "/assets/tenants/{tenant}/favicon.ico"
  },
  "typography": {
    "font_family": "Inter, sans-serif",
    "headings_font_family": "Inter, sans-serif"
  },
  "keycloak": {
    "realm_name": "{tenant}-realm",
    "theme_name": "{tenant}-theme",
    "parent_theme": "keycloak"
  },
  "features": {
    "dark_mode": true,
    "custom_fonts": false,
    "animations": true
  }
}
```

#### Step 2: Generate Design Tokens

```typescript
// themes/{tenant}/tokens.ts
export const tokens = {
  colors: {
    primary: {
      50: '#E6F2FF',
      100: '#BFDEFF',
      200: '#99CAFF',
      300: '#73B6FF',
      400: '#4DA2FF',
      500: '#0066CC', // Brand primary
      600: '#0052A3',
      700: '#003D7A',
      800: '#002952',
      900: '#001429',
    },
    secondary: {
      50: '#E6FFF2',
      100: '#BFFFE0',
      200: '#99FFCD',
      300: '#73FFBB',
      400: '#4DFFA8',
      500: '#00CC66', // Brand secondary
      600: '#00A352',
      700: '#007A3D',
      800: '#005229',
      900: '#002914',
    },
    accent: {
      500: '#FFB800',
    },
    background: {
      default: '#FFFFFF',
      paper: '#F5F5F5',
      dark: '#1A1A1A',
    },
    text: {
      primary: '#1A1A1A',
      secondary: '#666666',
      disabled: '#AAAAAA',
    },
  },
  typography: {
    fontFamily: {
      base: 'Inter, sans-serif',
      headings: 'Inter, sans-serif',
      mono: 'Fira Code, monospace',
    },
    fontSize: {
      xs: '0.75rem',
      sm: '0.875rem',
      base: '1rem',
      lg: '1.125rem',
      xl: '1.25rem',
      '2xl': '1.5rem',
      '3xl': '1.875rem',
      '4xl': '2.25rem',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  borderRadius: {
    sm: '0.25rem',
    md: '0.5rem',
    lg: '1rem',
    full: '9999px',
  },
  shadows: {
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
};
```

#### Step 3: Generate CSS Variables

```css
/* themes/{tenant}/variables.css */
:root[data-tenant="{tenant}"] {
  /* Brand Colors */
  --color-primary-50: #E6F2FF;
  --color-primary-500: #0066CC;
  --color-primary-900: #001429;
  --color-secondary-500: #00CC66;
  --color-accent-500: #FFB800;

  /* Background */
  --color-bg-default: #FFFFFF;
  --color-bg-paper: #F5F5F5;
  --color-bg-dark: #1A1A1A;

  /* Text */
  --color-text-primary: #1A1A1A;
  --color-text-secondary: #666666;
  --color-text-disabled: #AAAAAA;

  /* Typography */
  --font-family-base: 'Inter', sans-serif;
  --font-family-headings: 'Inter', sans-serif;
  --font-size-base: 1rem;

  /* Spacing */
  --spacing-xs: 0.25rem;
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --spacing-xl: 2rem;

  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

  /* Border Radius */
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 1rem;
}

/* Dark mode */
:root[data-tenant="{tenant}"][data-theme="dark"] {
  --color-bg-default: #1A1A1A;
  --color-bg-paper: #2A2A2A;
  --color-text-primary: #FFFFFF;
  --color-text-secondary: #CCCCCC;
}
```

#### Step 4: Generate React Theme Provider

```typescript
// themes/{tenant}/ThemeProvider.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { tokens } from './tokens';

interface ThemeContextValue {
  tenant: string;
  tokens: typeof tokens;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const ThemeProvider: React.FC<{ tenant: string; children: React.ReactNode }> = ({
  tenant,
  children,
}) => {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-tenant', tenant);
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  }, [tenant, darkMode]);

  const toggleDarkMode = () => setDarkMode(prev => !prev);

  return (
    <ThemeContext.Provider value={{ tenant, tokens, darkMode, toggleDarkMode }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
```

### 3. Action: Update Theme

When updating an existing theme:

1. **Load Existing Configuration**
```bash
# Read current tenant config
cat config/tenants/{tenant}.json

# Read current design tokens
cat themes/{tenant}/tokens.ts
```

2. **Prompt for Changes**
```
What would you like to update?
1. Brand colors (primary, secondary, accent)
2. Typography (fonts, sizes)
3. Spacing scale
4. Border radius values
5. Shadow definitions
6. Keycloak theme settings
7. Feature flags (dark mode, animations, etc.)
```

3. **Apply Updates**
- Regenerate tokens with new values
- Update CSS variables
- Regenerate Keycloak theme files if changed
- Update tenant configuration

4. **Validate Changes**
- Check color contrast ratios (WCAG AA compliance)
- Verify all token references are valid
- Test dark mode compatibility
- Validate Keycloak theme structure

### 4. Action: Export Theme

Export themes in Keycloak-compatible format:

```bash
# Export directory structure
keycloak-themes/
└── {tenant}-theme/
    ├── login/
    │   ├── theme.properties
    │   ├── resources/
    │   │   ├── css/
    │   │   │   ├── login.css
    │   │   │   └── styles.css
    │   │   ├── img/
    │   │   │   ├── logo.svg
    │   │   │   └── favicon.ico
    │   │   └── js/
    │   └── messages/
    │       └── messages_en.properties
    ├── account/
    │   ├── theme.properties
    │   └── resources/
    │       └── css/
    │           └── account.css
    └── email/
        ├── theme.properties
        └── html/
            └── template.ftl
```

#### theme.properties

```properties
parent=keycloak
import=common/keycloak

styles=css/login.css css/styles.css
```

#### login.css

```css
/* Keycloak Login Theme for {tenant} */

.login-pf body {
  background-color: var(--color-bg-default);
  font-family: var(--font-family-base);
}

#kc-header {
  background-image: url('../img/logo.svg');
  background-size: contain;
  background-repeat: no-repeat;
  height: 60px;
}

#kc-form-login {
  background-color: var(--color-bg-paper);
  border-radius: var(--radius-lg);
  padding: var(--spacing-xl);
  box-shadow: var(--shadow-lg);
}

.btn-primary {
  background-color: var(--color-primary-500);
  border-color: var(--color-primary-500);
  font-weight: var(--font-weight-semibold);
  border-radius: var(--radius-md);
  padding: var(--spacing-sm) var(--spacing-lg);
}

.btn-primary:hover {
  background-color: var(--color-primary-600);
  border-color: var(--color-primary-600);
}

.form-control {
  border-radius: var(--radius-sm);
  border: 1px solid var(--color-border-default);
  padding: var(--spacing-sm);
  font-size: var(--font-size-base);
}

.form-control:focus {
  border-color: var(--color-primary-500);
  outline: none;
  box-shadow: 0 0 0 3px var(--color-primary-100);
}

.alert-error {
  background-color: var(--color-error-50);
  color: var(--color-error-900);
  border-left: 4px solid var(--color-error-500);
  border-radius: var(--radius-sm);
  padding: var(--spacing-md);
}
```

#### Export Script

```bash
#!/bin/bash
# Export Keycloak theme for tenant: {tenant}

TENANT="{tenant}"
THEME_NAME="{tenant}-theme"
OUTPUT_DIR="keycloak-themes/$THEME_NAME"

# Create directory structure
mkdir -p "$OUTPUT_DIR/login/resources/css"
mkdir -p "$OUTPUT_DIR/login/resources/img"
mkdir -p "$OUTPUT_DIR/account/resources/css"
mkdir -p "$OUTPUT_DIR/email/html"

# Copy design tokens as CSS
cp "themes/$TENANT/variables.css" "$OUTPUT_DIR/login/resources/css/styles.css"

# Generate login.css with Keycloak-specific styles
cat > "$OUTPUT_DIR/login/resources/css/login.css" <<EOF
@import 'styles.css';
/* Keycloak login page styles */
EOF

# Copy logo and favicon
cp "assets/tenants/$TENANT/logo.svg" "$OUTPUT_DIR/login/resources/img/"
cp "assets/tenants/$TENANT/favicon.ico" "$OUTPUT_DIR/login/resources/img/"

# Create theme.properties
cat > "$OUTPUT_DIR/login/theme.properties" <<EOF
parent=keycloak
import=common/keycloak
styles=css/login.css css/styles.css
EOF

echo "✅ Keycloak theme exported to: $OUTPUT_DIR"
echo "Deploy to: \$KEYCLOAK_HOME/themes/$THEME_NAME"
```

### 5. Multi-Tenant Theme Switching

Generate runtime theme switching logic:

```typescript
// utils/tenant-theme-loader.ts
export const loadTenantTheme = async (tenantId: string) => {
  // Load tenant configuration
  const config = await import(`@/config/tenants/${tenantId}.json`);

  // Load design tokens
  const { tokens } = await import(`@/themes/${tenantId}/tokens`);

  // Apply CSS variables
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = `/themes/${tenantId}/variables.css`;
  document.head.appendChild(link);

  // Update favicon
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon && config.brand.favicon_url) {
    favicon.href = config.brand.favicon_url;
  }

  // Update page title
  document.title = config.brand.name;

  return { config, tokens };
};

// Hook for React
export const useTenantTheme = (tenantId: string) => {
  const [theme, setTheme] = useState(null);

  useEffect(() => {
    loadTenantTheme(tenantId).then(setTheme);
  }, [tenantId]);

  return theme;
};
```

## Keycloak Integration

### Realm-Specific Theme Assignment

```bash
# Using Keycloak Admin CLI
kcadm.sh update realms/{tenant}-realm -s loginTheme={tenant}-theme
kcadm.sh update realms/{tenant}-realm -s accountTheme={tenant}-theme
kcadm.sh update realms/{tenant}-realm -s emailTheme={tenant}-theme
```

### Theme Deployment

```bash
# Copy theme to Keycloak
cp -r keycloak-themes/{tenant}-theme $KEYCLOAK_HOME/themes/

# Restart Keycloak (in development)
docker restart keycloak

# In production, use volume mount:
# docker run -v ./keycloak-themes:/opt/keycloak/themes/custom
```

## Validation

After theme creation/update:

1. **Color Contrast Check**
```typescript
// Verify WCAG AA compliance (4.5:1 for normal text)
const contrastRatio = getContrastRatio(primaryColor, backgroundColor);
if (contrastRatio < 4.5) {
  console.warn('⚠️  Low contrast ratio detected');
}
```

2. **Token Completeness**
```bash
# Verify all required tokens are defined
grep -E "(color|font|spacing|shadow|radius)" themes/{tenant}/tokens.ts
```

3. **Keycloak Theme Structure**
```bash
# Validate Keycloak theme files
ls keycloak-themes/{tenant}-theme/login/theme.properties
ls keycloak-themes/{tenant}-theme/login/resources/css/
```

## Output

After successful execution:

```
✅ Theme {action} Complete for tenant: {tenant}

Files created:
- config/tenants/{tenant}.json
- themes/{tenant}/tokens.ts
- themes/{tenant}/variables.css
- themes/{tenant}/ThemeProvider.tsx
- keycloak-themes/{tenant}-theme/ (if export)

Next steps:
1. Import ThemeProvider in your app
2. Deploy Keycloak theme: cp -r keycloak-themes/{tenant}-theme $KEYCLOAK_HOME/themes/
3. Assign theme to realm: kcadm.sh update realms/{tenant}-realm -s loginTheme={tenant}-theme
4. Test theme: /theme-preview {tenant}
```

## Error Handling

- **Tenant not found**: Create new tenant configuration
- **Invalid colors**: Suggest color palette generator
- **Keycloak deployment failed**: Provide manual deployment instructions
- **Contrast ratio too low**: Suggest accessible color alternatives

## Related Commands

- `/palette {tenant}` - Generate tenant color palette
- `/tokens all {tenant}` - Export all design tokens
- `/keycloak generate {tenant}` - Generate Keycloak theme files only
- `/style {tenant}` - Apply custom design style to tenant
