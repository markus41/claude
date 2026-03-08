# scripts/

Build-time, validation, and data-processing scripts. Most scripts in the root of this directory relate to the plugin system. The `embedded/` and `excel/` subdirectories contain standalone Python utilities for Power Pages/Fabric deployment and Excel/Dataverse data processing respectively.

## Root scripts

### Validation and linting

| Script | Runtime | Purpose |
|--------|---------|---------|
| `check-no-tracked-deps.sh` | bash | Fails if `node_modules/`, `.pnpm/`, `.yarn/`, `dist/`, or `build/` are tracked by git |
| `validate-plugin-schema.mjs` | Node | Validates every plugin's `.claude-plugin/plugin.json` and `hooks/hooks.json` against the schemas in `schemas/` using AJV |
| `lint-hooks.mjs` | Node | Additional structural lint on `hooks/hooks.json` files: prompt length limits, valid event names, valid severities and scopes |
| `validate-archetype.ts` | ts-node | Validates an `archetype.json` file against `schemas/archetype.schema.json` with coloured terminal output |
| `check-plugin-context.mjs` | Node | Checks that each plugin's bootstrap files respect the token budget: max 120 lines and ~750 estimated tokens per file, max ~1200 total |

Run all validation together:

```bash
bash scripts/check-no-tracked-deps.sh
node scripts/validate-plugin-schema.mjs
node scripts/lint-hooks.mjs
node scripts/check-plugin-context.mjs
```

### Build and generation

| Script | Runtime | Purpose |
|--------|---------|---------|
| `generate-plugin-indexes.mjs` | Node | Scans every plugin's command `.md` files, validates YAML frontmatter fields (`name`, `intent`, `tags`, `inputs`, `risk`, `cost`), and writes missing frontmatter back. Produces the index files consumed by the plugin router |
| `expand-config.js` | Node | Reads `config.template.json`, substitutes `${VARIABLE}` placeholders from `.env`, and writes the resolved config. Use `--dry-run` to preview or `--validate` to check env vars only |
| `generate_cli_docs.py` | Python 3 | Parses command `.md` files for YAML frontmatter and `## Usage` blocks, then produces a human-readable and machine-readable CLI reference |

### Routing and profiling

| Script | Runtime | Purpose |
|--------|---------|---------|
| `plugin-router.mjs` | Node | Scores installed plugins against a natural-language query using token overlap on `intent` and `tags`, then ranks by cost/risk penalty. Used internally to route prompts to the right plugin |
| `profile-plugin-context.mjs` | Node | Measures token and line counts for each plugin's bootstrap files and compares against a stored baseline (`scripts/plugin-context-baseline.json`). Alerts when a plugin has grown beyond the allowed drift (80 tokens / 20 lines) |

## embedded/

Python scripts for deploying and configuring Microsoft Power Pages and Microsoft Fabric workspaces. These are run manually or via CI pipelines — they are not part of the Node build.

| Script | Purpose |
|--------|---------|
| `bootstrap_client_workspace.py` | Produces a deterministic workspace bootstrap manifest for downstream infrastructure automation. Takes `--client-code`, `--environment`, and `--region` arguments |
| `configure_power_pages_embed.py` | Configures Power Pages embedding settings for a client workspace |
| `deploy_semantic_model.py` | Deploys a Power BI / Fabric semantic model to a target workspace |

All three scripts accept `--help` for argument documentation and write structured JSON output to stdout.

## excel/

Python utilities for validating, normalising, and exporting Excel workbooks used in the TVS Microsoft deployment pipeline.

| Script | Purpose |
|--------|---------|
| `analyze_workbook.py` | Validates an `.xlsx` workbook against TVS validation profiles. Requires `--workbook` argument. Exits non-zero on validation failures |
| `normalize_workbook.py` | Applies field normalisation rules (date formats, number precision, string trimming) to a workbook in place |
| `export_to_dataverse.py` | Reads normalised workbook data and upserts records to Microsoft Dataverse via the Power Apps Web API |
| `export_to_fabric.py` | Reads normalised workbook data and writes it to a Microsoft Fabric Lakehouse delta table |

The `excel/` scripts depend on the `tvs-microsoft-deploy` plugin's `excel/validation_engine` module. Run them from the repo root or ensure `plugins/tvs-microsoft-deploy` is on `PYTHONPATH`:

```bash
cd /home/user/claude
python scripts/excel/analyze_workbook.py --workbook path/to/data.xlsx
```

## Adding a new script

- Place Node scripts as `.mjs` (ESM) or `.js` (CJS) in this directory.
- Place Python scripts in a named subdirectory if they belong to a specific subsystem.
- Add a shebang line (`#!/usr/bin/env node` or `#!/usr/bin/env python3`) and mark executable if the script is meant to be run directly.
- Document the script in this README with its runtime, purpose, and any required arguments.
- If the script is part of CI validation, add it to the `test` or `lint` steps in `package.json`.
