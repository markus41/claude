# Frontend Powerhouse

> Maximum-capacity frontend development plugin with 13 specialized subagents, ultrathink integration, and comprehensive React/Next.js/Chakra UI tooling.

## Overview

Frontend Powerhouse is a Claude Code plugin designed to **streamline frontend development workflows** and **improve development visibility** across React, Next.js, and Chakra UI projects. It leverages 13 specialized subagents with extended thinking (ultrathink) capabilities for complex architectural decisions.

## Features

### 13 Specialized Subagents

#### Ultrathink-Enabled (Extended Thinking)
| Agent | Purpose |
|-------|---------|
| `react-component-architect` | Component design, composition patterns, compound components |
| `accessibility-auditor` | WCAG 2.1 AA/AAA compliance with comprehensive reasoning |
| `performance-optimizer` | Core Web Vitals, bundle analysis, rendering optimization |
| `design-system-architect` | Design tokens, theming, variant systems |

#### Domain Specialists
| Agent | Purpose |
|-------|---------|
| `chakra-ui-specialist` | Chakra UI patterns, custom components, theme extensions |
| `nextjs-expert` | App Router, Server Components, SSR/SSG patterns |
| `state-management-expert` | Zustand, React Query, Context API patterns |
| `form-validation-architect` | React Hook Form + Zod integration |
| `animation-specialist` | Framer Motion, CSS transitions, micro-interactions |
| `responsive-design-expert` | Mobile-first, breakpoint systems, container queries |

#### Quality & Documentation
| Agent | Purpose |
|-------|---------|
| `frontend-test-generator` | Unit, integration, E2E test generation |
| `code-quality-reviewer` | Pattern validation, anti-pattern detection |
| `storybook-documenter` | Component stories and documentation |

### 6 Domain Skills

- **react-19-patterns** - React 19 hooks, concurrent features, use() API
- **chakra-ui-mastery** - Theming, style props, responsive design
- **nextjs-app-router** - App Router patterns, layouts, Server Actions
- **accessibility-wcag** - WCAG 2.1 guidelines, ARIA patterns
- **frontend-testing** - Testing strategies, mocking patterns
- **design-tokens** - Token architecture, semantic naming

### 8 Slash Commands

| Command | Description |
|---------|-------------|
| `/create-component` | Generate typed Chakra component with variants, tests, stories |
| `/audit-a11y` | Run comprehensive accessibility audit |
| `/analyze-performance` | Bundle size and Core Web Vitals analysis |
| `/generate-tests` | Create test suite (unit + integration + a11y) |
| `/create-theme` | Set up Chakra theme with design tokens |
| `/setup-storybook` | Initialize Storybook with Chakra integration |
| `/create-form` | Generate validated form with RHF + Zod |
| `/component-review` | Deep quality review with improvements |

### Automated Quality Hooks

- **component-structure-validator** - Validates component patterns on Write
- **accessibility-gate** - Checks a11y attributes on Edit
- **test-coverage-reminder** - Reminds about test coverage at session end

## Installation

### Option 1: Claude Code Plugin Directory

```bash
# Clone or copy to your plugins directory
cp -r frontend-powerhouse ~/.claude/plugins/
```

### Option 2: Project-Level Installation

```bash
# Copy to your project
cp -r frontend-powerhouse /your/project/.claude-plugin/
```

### Option 3: Development Mode

```bash
# Run Claude Code with plugin directory
claude --plugin-dir /path/to/frontend-powerhouse
```

## Prerequisites

### Required
- Claude Code CLI v1.0.0+
- Node.js 18+
- React 18+ or 19
- Next.js 14+ (for Next.js features)

### Recommended
- Chakra UI v2.8+
- TypeScript 5+
- Vitest or Jest
- Storybook 8+

## Configuration

### Environment Variables

```bash
# Optional: Context7 for library documentation
export CONTEXT7_API_KEY="your-api-key"
```

### MCP Server

The plugin includes Context7 MCP integration for up-to-date library documentation. Configure in your Claude settings or use the bundled `.mcp.json`.

## Usage Examples

### Create a New Component

```
/create-component Button primary
```

Creates a typed Chakra button component with:
- TypeScript interfaces
- Variant support (primary, secondary, outline)
- Test file with accessibility tests
- Storybook story

### Run Accessibility Audit

```
/audit-a11y src/components/Header.tsx
```

Uses ultrathink for comprehensive WCAG 2.1 analysis:
- Keyboard navigation check
- Screen reader compatibility
- Color contrast validation
- Focus management review

### Performance Analysis

```
/analyze-performance src/pages/Dashboard.tsx
```

Provides:
- Bundle size impact
- Rendering optimization opportunities
- Memoization recommendations
- Code splitting suggestions

## Technology Stack

| Area | Technologies |
|------|--------------|
| **Framework** | React 19, Next.js 14/15 |
| **UI Library** | Chakra UI v2/v3 |
| **State** | Zustand, React Query, Context API |
| **Forms** | React Hook Form, Zod |
| **Animation** | Framer Motion |
| **Testing** | Vitest, Jest, Testing Library, Playwright |
| **Documentation** | Storybook 8 |

## Architecture

```
frontend-powerhouse/
├── .claude-plugin/
│   └── plugin.json           # Plugin manifest
├── agents/                   # 13 specialized subagents
│   ├── react-component-architect.md
│   ├── accessibility-auditor.md
│   ├── performance-optimizer.md
│   ├── design-system-architect.md
│   ├── chakra-ui-specialist.md
│   ├── nextjs-expert.md
│   ├── state-management-expert.md
│   ├── form-validation-architect.md
│   ├── animation-specialist.md
│   ├── responsive-design-expert.md
│   ├── frontend-test-generator.md
│   ├── code-quality-reviewer.md
│   └── storybook-documenter.md
├── skills/                   # 6 domain skills
│   ├── react-19-patterns/
│   ├── chakra-ui-mastery/
│   ├── nextjs-app-router/
│   ├── accessibility-wcag/
│   ├── frontend-testing/
│   └── design-tokens/
├── commands/                 # 8 slash commands
├── hooks/                    # Quality gate hooks
├── scripts/                  # Utility scripts
└── .mcp.json                # MCP server config
```

## Extended Thinking (Ultrathink)

Four agents leverage Claude's extended thinking for complex analysis:

1. **react-component-architect** - Deep API design reasoning
2. **accessibility-auditor** - Multi-step WCAG compliance chains
3. **performance-optimizer** - Comprehensive optimization strategies
4. **design-system-architect** - Token hierarchy and theme planning

These agents use the `opus` model to access extended thinking capabilities.

## Contributing

Contributions are welcome! Please follow these guidelines:

1. Follow the existing agent/skill patterns
2. Include comprehensive triggering examples
3. Add tests for new commands
4. Update documentation

## License

MIT License - see LICENSE file for details.

## Author

**Brookside BI**
- Email: support@brooksidebi.com

---

*Built with Claude Code Plugin System - Driving measurable outcomes through structured frontend development.*
