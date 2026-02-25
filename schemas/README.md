# schemas/

JSON Schema files (Draft-07) used to validate plugin manifests, hook definitions, and archetype configurations. These schemas are the source of truth for what is considered a valid plugin or archetype — tooling in `scripts/` and CI enforce them at development time.

## Schema files

| File | Validates | Used by |
|------|-----------|---------|
| `plugin.schema.json` | Plugin manifest (`plugins/<name>/.claude-plugin/plugin.json`) | `scripts/validate-plugin-schema.mjs` |
| `hooks.schema.json` | Plugin hook definitions (`plugins/<name>/hooks/hooks.json`) | `scripts/validate-plugin-schema.mjs`, `scripts/lint-hooks.mjs` |
| `archetype.schema.json` | Archetype configuration files (`archetype.json`) | `scripts/validate-archetype.ts` |

## plugin.schema.json

Validates the `.claude-plugin/plugin.json` manifest required in every plugin directory. Required fields:

- `name` — plugin identifier (string)
- `version` — semver string (`^[0-9]+\.[0-9]+\.[0-9]+`)
- `description` — human-readable summary
- `keywords` — searchable tags
- `permissions` — declared permission requirements
- `capabilities` — what the plugin provides (commands, agents, skills, etc.)
- `context` — bootstrap file list and token budget hints

## hooks.schema.json

Validates hook definition files. Every hook must declare:

- `id` — unique hook identifier
- `event` — lifecycle event: one of `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PostToolUse`, `Stop`, `SessionEnd`, `PreCompact`, `TaskCompleted`
- `severity` — `advisory`, `warn`, or `block`
- `description` — what the hook does
- `trigger` — conditions under which the hook fires
- `handlers` — ordered list of actions to execute

Schema version is pinned to `"version": "2.0.0"`.

## archetype.schema.json

Validates archetype configuration files used by the scaffolding system. Required fields:

- `name` — kebab-case identifier (pattern: `^[a-z0-9-]+$`)
- `version` — semver
- `description` — 10–500 character summary
- `category` — one of: `infrastructure`, `service`, `ui`, `library`, `tool`, `agent`, `documentation`, `database`, and others
- `files` — template file manifest

## Validation

Run schema validation locally:

```bash
# Validate all plugin manifests and hook files
node scripts/validate-plugin-schema.mjs

# Validate a specific archetype config
npx ts-node scripts/validate-archetype.ts path/to/archetype.json
```

Validation is also run as part of `pnpm test`. A plugin with an invalid manifest or hook file will fail CI.

## Updating schemas

When adding new required or optional fields to a schema:

1. Edit the relevant `.json` file in this directory.
2. Update validation scripts if the new field needs custom logic beyond JSON Schema checks.
3. Update existing plugin manifests or archetype files that need the new field.
4. Document the change in the relevant plugin or archetype README.

Backwards-incompatible changes (removing required fields, changing types) require bumping `version` in the schema and providing a migration path for existing plugins.
