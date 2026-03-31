# Architecture Decision Records — Memory

## ADR-001: Plugin-Based Architecture

- **Decision**: Plugin-based architecture over monolith
- **Rationale**: Each domain (Jira, deployment, marketplace, etc.) has distinct concerns. Plugins allow independent development, testing, and versioning. Users install only what they need.
- **Consequences**: Requires plugin manifest schema, registry system, and install/uninstall lifecycle management. More upfront infrastructure, but better extensibility and maintainability.

## ADR-002: Zustand + Immer Over Redux

- **Decision**: Zustand with immer middleware for state management
- **Rationale**: Redux requires excessive boilerplate (actions, reducers, selectors, thunks) for the state complexity of this project. Zustand is lighter, supports TypeScript naturally, and immer middleware enables safe nested mutations.
- **Consequences**: Stores are simpler to write and test. Team must use immer middleware for complex state. Server state is handled by TanStack Query, not Zustand.

## ADR-003: Custom MCP Servers Over External APIs

- **Decision**: Build custom MCP servers (code-quality-gate, deploy-intelligence, etc.) instead of calling external APIs directly
- **Rationale**: MCP provides a standardized tool interface that Claude can invoke natively. Custom servers give tighter integration, local execution (stdio transport), and no network latency for project-specific operations.
- **Consequences**: Must maintain MCP server code. Servers run as child processes. Configuration lives in `.mcp.json`. External services (Perplexity, Firecrawl) still use remote MCP where local execution is not possible.

## ADR-004: Split Memory in Rules Directory

- **Decision**: Store project memory across multiple scoped rule files instead of a single `MEMORY.md`
- **Rationale**: A single memory file becomes unwieldy as the project grows. Splitting into `memory-profile.md`, `memory-preferences.md`, `memory-decisions.md`, and `memory-patterns.md` allows scoped loading and easier maintenance.
- **Consequences**: Claude loads all rule files anyway (no path scoping on memory files), but organization is clearer. Each file has a focused purpose.

## ADR-005: Vitest + Playwright Testing Stack

- **Decision**: Vitest for unit/integration tests, Playwright for E2E
- **Rationale**: Vitest is Vite-native (instant HMR in tests, shared config). Playwright provides cross-browser E2E testing with better DX than Cypress for React apps.
- **Consequences**: Test files use `.test.ts` / `.spec.ts` convention. Vitest config in `vitest.config.ts`. Playwright config in `playwright.config.ts`.
