# frontend-design-system

**Version:** 1.0.0 | **License:** MIT | **Callsign:** Stylist
**Author:** Markus Ahling

## Purpose

This plugin provides an AI-powered frontend design system toolkit with 263+ design
styles and multi-tenant Keycloak theming. It exists because enterprise applications
serving multiple tenants need consistent design language that can be customized per
tenant -- from design tokens and component patterns through to Keycloak login pages --
without duplicating effort across each tenant theme.

The plugin bridges an Obsidian vault containing 263+ curated design styles with
automated CSS generation, component scaffolding, and Keycloak theme deployment. Its
agents handle everything from strategic design architecture (opus-level) through
responsive layout optimization (haiku-level), ensuring design quality at every scale.

## Directory Structure

```
frontend-design-system/
  .claude-plugin/plugin.json
  CLAUDE.md / CONTEXT_SUMMARY.md
  agents/                        # 6 agents
  commands/                      # 8 commands
  skills/                        # 4 skills (subdirectories with SKILL.md)
  hooks/                         # Style consistency, accessibility, theme sync
```

## Agents

| Agent | Model | Description |
|-------|-------|-------------|
| design-architect | opus | Strategic design system architecture and token taxonomy |
| style-implementer | sonnet | Convert design vocabulary to CSS and apply to components |
| theme-engineer | sonnet | Multi-tenant Keycloak theme development |
| component-designer | sonnet | Reusable UI component design and implementation |
| accessibility-auditor | sonnet | WCAG 2.1 compliance and accessibility testing |
| responsive-specialist | haiku | Mobile-first responsive design across breakpoints |

## Commands

| Command | Description |
|---------|-------------|
| `/ds:style` | Search and apply design styles from 263+ vocabulary |
| `/ds:theme` | Generate or customize Keycloak tenant themes |
| `/ds:tokens` | Manage design tokens (colors, spacing, typography) |
| `/ds:component` | Generate UI components with design patterns |
| `/ds:palette` | Generate color palettes and theme variations |
| `/ds:audit` | Audit accessibility and design consistency |
| `/ds:convert` | Convert design tokens between formats |
| `/ds:keycloak` | Manage Keycloak theme integration and deployment |

## Skills

- **design-styles** -- 263+ curated design style vocabulary with semantic search
- **keycloak-theming** -- Multi-tenant theme generation, realm config, login customization
- **css-generation** -- CSS Variables, Tailwind config, styled-components generation
- **component-patterns** -- Reusable component patterns, composition, hooks, accessibility

## CSS Output Formats

| Format | Use Case |
|--------|----------|
| CSS Variables | Native custom properties |
| Tailwind Config | Tailwind CSS integration |
| Sass/SCSS | Token generation with variables |
| styled-components | Theme provider integration |
| Emotion | CSS-in-JS theme support |

## Prerequisites

- Obsidian MCP server (for design style vocabulary access)
- Keycloak instance (for theme deployment)
- Context7 MCP server (optional, for library documentation)

**Environment variables:**
- `KEYCLOAK_URL` -- Keycloak server URL
- `KEYCLOAK_REALM` -- Default realm name

## Quick Start

```
/ds:style search "modern card with shadow"
/ds:tokens generate --format=css-vars --output=src/tokens/colors.css
/ds:component create Button --variant=primary,secondary,ghost
/ds:theme create tenant-a --realm=tenant-a --palette=blue
/ds:audit check --wcag=AA
/ds:keycloak deploy --realm=tenant-a
```
