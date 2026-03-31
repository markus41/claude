# Constraints

## Language and Runtime

- TypeScript 5.3+ in strict mode (`"strict": true`)
- ES module (`"type": "module"` in package.json)
- Target: ES2020 (via Vite/tsconfig)
- Node.js for build scripts and MCP servers

## Framework

- React 18 minimum (concurrent features assumed)
- Vite 5 as bundler (no webpack, no CRA)
- Tailwind CSS 3.4 for styling (no CSS-in-JS)

## State Management

- Zustand for client state (no Redux, no MobX)
- TanStack Query for server/async state
- Immer for immutable updates where needed

## Code Style

- ESLint with `@typescript-eslint` and React hooks plugin
- Max function length: 50 lines (from `.claude/rules/code-style.md`)
- Prefer `async/await` over raw Promises
- Named exports preferred over default exports

## Package Management

- pnpm as package manager
- Private package (not published to npm)

## Browser Support

<!-- Fill in: Minimum browser versions -->

## Plugin Constraints

- Every plugin must have a `.claude-plugin/plugin.json` manifest
- Plugin TypeScript files are reference implementations; they are not compiled by the root tsconfig
- Plugins needing Node.js APIs require their own `@types/node` if type-checked independently

## Performance Budgets

<!-- Fill in: Bundle size limits, load time targets -->
