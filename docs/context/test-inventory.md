# Test Inventory

## Frontend Tests

| File | Type | What it covers |
|------|------|---------------|
| `src/stores/paletteStore.test.ts` | Unit | Palette store actions and selectors |
| `src/test/` | Various | Test utilities and setup |
<!-- Fill in: List additional test files as they are created -->

## Plugin Validation Scripts

| Script | Command | Purpose |
|--------|---------|---------|
| `scripts/check-plugin-context.mjs` | `pnpm check:plugin-context` | Validates plugin context size |
| `scripts/validate-plugin-schema.mjs` | `pnpm check:plugin-schema` | Validates plugin.json manifests |
| `scripts/lint-hooks.mjs` | `pnpm check:hooks` | Lints hook scripts |
| `scripts/generate-plugin-indexes.mjs` | `pnpm check:plugin-indexes` | Verifies generated indexes |

## E2E Tests

<!-- Fill in: List Playwright test files and key scenarios -->

## CI Test Workflows

| Workflow | Tests Run |
|----------|----------|
| `plugin-preflight.yml` | Plugin schema, context, hook validation |
| `no-tracked-node-modules.yml` | Ensures node_modules not committed |
| `home-assistant-architect-registry-check.yml` | HA plugin registry integrity |

## Missing Coverage

<!-- Fill in: Areas that need more tests -->
