# Frontend Design System Plugin

**Version:** 1.0.0
**Author:** Markus Ahling
**License:** MIT

AI-powered frontend design system toolkit leveraging 263+ design styles from Obsidian vault with multi-tenant Keycloak theming integration. Enables precise design vocabulary and tenant-specific theme generation for modern web applications.

---

## Features

### Design Style Vocabulary
- **263+ Design Styles**: Curated design vocabulary from Obsidian vault
- **Style Search**: AI-powered semantic search across design patterns
- **Style Application**: Apply consistent design language to components
- **Design Tokens**: Automated token generation from style definitions

### Multi-Tenant Keycloak Theming
- **Tenant-Specific Themes**: Generate custom themes per Keycloak realm
- **Theme Synchronization**: Sync design tokens to Keycloak theme files
- **Authentication UI**: Customized login, registration, and account pages
- **Realm Management**: Multi-realm theme configuration and deployment

### CSS Generation
- **Multiple Formats**: Generate CSS Variables, Tailwind config, styled-components
- **Token Conversion**: Transform design tokens between formats
- **Framework Integration**: Support for React, Vue, Angular, Svelte
- **Build Optimization**: Tree-shaking and minimal CSS output

### Component Patterns
- **Reusable Components**: Design system component library
- **Composition Patterns**: Higher-order components and hooks
- **Accessibility First**: WCAG 2.1 AA/AAA compliance built-in
- **Responsive Design**: Mobile-first responsive patterns

---

## Installation

### Prerequisites
- Claude Code CLI installed
- Obsidian vault at `C:\Users\MarkusAhling\obsidian`
- MCP servers configured: `obsidian`, `context7` (optional)

### Install Plugin

```bash
# Clone or link plugin to Claude Code plugins directory
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude
git clone <plugin-repo> frontend-design-system

# Or symlink existing plugin
# ln -s /path/to/frontend-design-system .claude-plugins/frontend-design-system

# Verify installation
claude plugin list
```

### Configure Project

Create `.claude/frontend-design-system.local.md` in your project:

```markdown
# Frontend Design System - Project Configuration

## Design Token Paths

- **Tokens Directory**: `src/design-tokens/`
- **Component Library**: `src/components/`
- **Theme Output**: `src/themes/`

## Keycloak Integration

- **Keycloak URL**: `https://auth.example.com`
- **Default Realm**: `master`
- **Theme Directory**: `keycloak-themes/`
- **Tenant Realms**: `tenant-a`, `tenant-b`, `tenant-c`

## Technology Stack

- **CSS Framework**: Tailwind CSS v3.x
- **Component Library**: React 18+
- **State Management**: Zustand
- **Build Tool**: Vite
- **CSS-in-JS**: styled-components (optional)

## Design System Configuration

- **Primary Font**: Inter
- **Heading Font**: Outfit
- **Base Font Size**: 16px
- **Spacing Scale**: 4px base (0.25rem)
- **Breakpoints**: mobile (640px), tablet (768px), desktop (1024px), wide (1280px)

## Accessibility Requirements

- **WCAG Level**: AA (minimum)
- **Color Contrast**: 4.5:1 for normal text, 3:1 for large text
- **Keyboard Navigation**: Required for all interactive elements
- **Screen Reader**: ARIA labels required

## Style Preferences

- **Design Language**: Modern, clean, minimal
- **Color Palette**: Cool tones, accent blues
- **Animation**: Subtle micro-interactions
- **Shadow Style**: Soft, layered shadows
```

---

## Commands

| Command | Description | Usage |
|---------|-------------|-------|
| `/ds:style` | Apply or search design styles from 263+ vocabulary | `/ds:style search "card layout"` |
| `/ds:theme` | Generate or customize Keycloak tenant themes | `/ds:theme create tenant-a --realm=tenant-a` |
| `/ds:tokens` | Manage design tokens (colors, spacing, typography) | `/ds:tokens generate --format=css-vars` |
| `/ds:component` | Generate UI components with design patterns | `/ds:component create Button --variant=primary` |
| `/ds:palette` | Generate color palettes and theme variations | `/ds:palette generate --base=#0066CC` |
| `/ds:audit` | Audit accessibility and design consistency | `/ds:audit check --wcag=AA` |
| `/ds:convert` | Convert design tokens between formats | `/ds:convert tokens.json --to=tailwind` |
| `/ds:keycloak` | Manage Keycloak theme integration | `/ds:keycloak deploy --realm=tenant-a` |

---

## Agents

| Agent | Model | Purpose | Use Cases |
|-------|-------|---------|-----------|
| **design-architect** | opus | Strategic design system architecture | Planning design system structure, token taxonomy, component hierarchy |
| **style-implementer** | sonnet | Implement design styles and CSS | Converting design vocabulary to CSS, applying styles to components |
| **theme-engineer** | sonnet | Multi-tenant Keycloak theme development | Creating tenant themes, customizing authentication UI |
| **component-designer** | sonnet | UI component design and implementation | Building reusable components with design tokens |
| **accessibility-auditor** | sonnet | WCAG compliance and accessibility testing | Auditing components, fixing accessibility issues |
| **responsive-specialist** | haiku | Responsive design across breakpoints | Mobile-first layouts, responsive patterns |

---

## Skills

| Skill | Description | Capabilities |
|-------|-------------|--------------|
| **design-styles** | 263+ design style vocabulary | Semantic search, style application, pattern recognition |
| **keycloak-theming** | Multi-tenant theme customization | Theme generation, realm config, login page customization |
| **css-generation** | CSS, Tailwind, CSS-in-JS generation | Token transformation, framework integration, optimization |
| **component-patterns** | Reusable component patterns | Composition, HOCs, render props, hooks patterns |
| **design-tokens** | Design token management | Token definition, transformation, synchronization |
| **accessibility** | WCAG 2.1 compliance | Color contrast, keyboard nav, screen reader support |

---

## Hooks

| Hook | Trigger | Purpose |
|------|---------|---------|
| **style-consistency** | `pre-commit` | Validate design style consistency across components |
| **accessibility-validator** | `pre-commit` | Run accessibility checks (axe-core, pa11y) |
| **theme-sync** | `post-token-update` | Sync design tokens to Keycloak theme files |
| **design-token-updater** | `on-demand` | Update tokens from Obsidian design styles |

---

## Configuration

### Project Configuration File

Create `.claude/frontend-design-system.local.md` in your project root with the following structure:

```markdown
# Frontend Design System - Project Configuration

## Design Token Paths
- **Tokens Directory**: [path to design tokens]
- **Component Library**: [path to components]

## Keycloak Integration
- **Keycloak URL**: [your Keycloak instance]
- **Default Realm**: [realm name]
- **Theme Directory**: [Keycloak themes path]

## Technology Stack
- **CSS Framework**: [Tailwind/Bootstrap/Custom]
- **Component Library**: [React/Vue/Angular/Svelte]
- **CSS-in-JS**: [styled-components/emotion/etc]

## Design System Preferences
[Your design system configuration]
```

### Environment Variables (Optional)

```bash
# Keycloak Configuration
export KEYCLOAK_URL="https://auth.example.com"
export KEYCLOAK_REALM="master"

# Design System Paths
export DESIGN_SYSTEM_PATH="./src/design-system"
```

---

## Technology Support

### CSS Frameworks
- **Tailwind CSS**: Full design token integration
- **CSS Variables**: Native custom properties
- **Sass/SCSS**: Token generation with variables
- **styled-components**: Theme provider integration
- **Emotion**: CSS-in-JS theme support

### Component Libraries
- **React**: Components, hooks, context
- **Vue**: Composition API, provide/inject
- **Angular**: Services, modules, theming
- **Svelte**: Stores, actions, slots

### Keycloak Theme Formats
- **FreeMarker Templates**: Login, registration, account pages
- **CSS Customization**: Theme-specific styles
- **Resource Bundles**: Internationalization support
- **JavaScript**: Custom client-side logic

---

## Quick Start Examples

### Generate Design Tokens

```bash
# Generate CSS variables from Obsidian design styles
/ds:tokens generate --format=css-vars --output=src/tokens/colors.css

# Generate Tailwind config
/ds:tokens generate --format=tailwind --output=tailwind.config.js
```

### Create Keycloak Theme

```bash
# Create new tenant theme
/ds:theme create tenant-a --realm=tenant-a --palette=blue

# Deploy theme to Keycloak
/ds:keycloak deploy --realm=tenant-a --theme=tenant-a
```

### Build Component Library

```bash
# Generate component with design system
/ds:component create Button --variant=primary,secondary,ghost

# Audit component accessibility
/ds:audit check src/components/Button.tsx --wcag=AA
```

### Search Design Styles

```bash
# Semantic search across 263+ styles
/ds:style search "modern card with shadow"

# Apply style to component
/ds:style apply "card-elevated" --to=src/components/Card.tsx
```

---

## Workflows

### New Multi-Tenant Theme

1. **Plan Theme**: Use `design-architect` agent to plan theme structure
2. **Generate Tokens**: Create design tokens with `/ds:tokens`
3. **Create Theme**: Generate Keycloak theme with `/ds:theme create`
4. **Customize UI**: Modify FreeMarker templates and styles
5. **Test Accessibility**: Audit with `/ds:audit check`
6. **Deploy**: Deploy to Keycloak with `/ds:keycloak deploy`

### Component Library Development

1. **Design System Architecture**: Plan with `design-architect`
2. **Token Setup**: Generate design tokens for all primitives
3. **Component Creation**: Build components with `component-designer`
4. **Responsive Design**: Optimize with `responsive-specialist`
5. **Accessibility**: Validate with `accessibility-auditor`
6. **Documentation**: Generate component docs with examples

---

## Integration with Obsidian Vault

The plugin leverages your Obsidian vault's design style vocabulary:

**Design Styles Location**: `C:\Users\MarkusAhling\obsidian\System\Design-Styles\`

**Expected Structure**:
```
System/
  Design-Styles/
    Colors.md         # Color vocabulary
    Typography.md     # Font and text styles
    Spacing.md        # Spacing scale
    Shadows.md        # Shadow definitions
    Layouts.md        # Layout patterns
    Components.md     # Component styles
```

**Access via MCP**:
```python
# Read design styles from Obsidian
styles = mcp__obsidian__get_file_contents(
    filepath="System/Design-Styles/Colors.md"
)
```

---

## Troubleshooting

### Common Issues

#### Design Styles Not Loading

**Problem**: Design styles from Obsidian vault are not accessible.

**Solutions**:
1. Verify Obsidian MCP server is running and configured
2. Check vault path in `plugin.json` resources section
3. Ensure design styles exist at `System/Design-Styles/` in your vault
4. Test MCP connection: `mcp__obsidian__list_files_in_dir("System/Design-Styles")`

#### Keycloak Theme Deployment Fails

**Problem**: Theme fails to deploy to Keycloak server.

**Solutions**:
1. Verify `KEYCLOAK_URL` environment variable is set correctly
2. Check authentication credentials and admin permissions
3. Ensure target realm exists before theme deployment
4. Verify theme directory structure matches Keycloak requirements:
   ```
   themes/
     {theme-name}/
       login/
         theme.properties
         resources/css/
         template/*.ftl
   ```

#### CSS Token Generation Errors

**Problem**: Design tokens fail to generate CSS output.

**Solutions**:
1. Validate token JSON structure with `/ds:tokens validate`
2. Check for circular references in token definitions
3. Ensure output path is writable
4. Review token format compatibility with target framework

#### Hooks Not Triggering

**Problem**: Pre-commit or post-tool hooks don't execute.

**Solutions**:
1. Verify hook scripts have execute permissions: `chmod +x hooks/scripts/*.sh`
2. Check `hooks.json` configuration matches Claude Code hook event types
3. Ensure file patterns match files being modified
4. Review hook script for syntax errors: `bash -n hooks/scripts/<script>.sh`

#### Accessibility Audit Failures

**Problem**: Accessibility audit reports unexpected errors.

**Solutions**:
1. Install required audit tools: `npm install -g axe-core pa11y`
2. Ensure components render valid HTML
3. Check for proper ARIA attribute usage
4. Verify color contrast ratios meet WCAG requirements (4.5:1 for normal text)

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
# Set debug environment variable
export DS_DEBUG=true

# Run command with verbose output
/ds:audit check --verbose

# Check Claude Code plugin logs
claude logs --plugin=frontend-design-system
```

### Getting Help

1. Check the [hooks README](hooks/README.md) for hook-specific issues
2. Review command documentation in `commands/` directory
3. Open an issue on GitHub with:
   - Claude Code version
   - Plugin version
   - Error message and stack trace
   - Steps to reproduce

---

## Contributing

To extend the plugin:

1. Add new commands in `commands/` directory
2. Create specialized agents in `agents/`
3. Add skills in `skills/`
4. Implement hooks in `hooks/`
5. Document workflows in `workflows/`

---

## Resources

- **Obsidian Vault**: `C:\Users\MarkusAhling\obsidian`
- **Design Styles**: `System/Design-Styles/`
- **Keycloak Themes**: `Resources/Keycloak-Themes/`
- **Documentation**: [Claude Code Plugin Guide](https://docs.claude.ai/plugins)

---

## Support

For issues, questions, or contributions:

- **Repository**: [GitHub](https://github.com/markus41/claude/tree/main/frontend-design-system)
- **Obsidian Vault**: `C:\Users\MarkusAhling\obsidian\Repositories\markus41\claude.md`

---

## License

MIT License - See LICENSE file for details

---

**Built with**: Claude Code, Obsidian MCP, 263+ Design Styles, Keycloak Theme Engine
