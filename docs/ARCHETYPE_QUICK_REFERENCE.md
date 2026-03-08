# Archetype Multi-Engine - Quick Reference Card

## 30-Second Overview

```json
{
  "name": "my-archetype",
  "version": "1.0.0",
  "category": "service",
  "engine": {
    "type": "handlebars | nunjucks | eta | ejs | copier | cookiecutter"
  },
  "files": ["templates/**/*"]
}
```

**Default:** Handlebars (no config needed)
**Mixed:** Use `fileEngineOverrides`
**Updates:** Add `lifecycle.migrations`

---

## Essential Commands

```bash
# Validate archetype.json
ajv validate -s schemas/archetype.schema.json -d archetype.json

# Generate project
npm run archetype:generate --archetype=my-archetype

# Test hooks
npm run archetype:test-hooks --hook=postGenerate
```

---

## Engine Quick Pick

| Need | Use | Syntax |
|------|-----|--------|
| Simple templates | Handlebars | `{{var}}` |
| YAML configs | Nunjucks | `{{ var }}` |
| Performance | Eta | `<%= var %>` |
| Shell scripts | EJS | `<% code %>` |
| Python + updates | Copier | `{{ var }}` |

---

## Template Syntax Cheat Sheet

### Handlebars
```handlebars
{{variable}}
{{#if condition}}...{{/if}}
{{#each items}}{{this}}{{/each}}
{{! comment }}
```

### Nunjucks
```jinja2
{{ variable }}
{% if condition %}...{% endif %}
{% for item in items %}{{ item }}{% endfor %}
{# comment #}
```

### EJS
```ejs
<%= variable %>
<% if (condition) { %>...<% } %>
<% items.forEach(item => { %><%= item %><% }); %>
<%# comment %>
```

---

## Common Patterns

### Mixed Engine Archetype
```json
{
  "engine": { "type": "handlebars" },
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": { "type": "nunjucks" },
    "templates/scripts/**/*.sh": { "type": "ejs" }
  }
}
```

### Lifecycle Hooks
```json
{
  "lifecycle": {
    "hooks": {
      "postGenerate": ["npm install", "npm test"]
    }
  }
}
```

### Variable Validation
```json
{
  "variables": [
    {
      "name": "projectName",
      "type": "string",
      "required": true,
      "validation": {
        "pattern": "^[a-z0-9-]+$",
        "min": 3,
        "max": 50
      }
    }
  ]
}
```

---

## Troubleshooting

| Problem | Check | Fix |
|---------|-------|-----|
| Raw variables in output | Engine type matches syntax | Set correct `engine.type` |
| Helper not found | Helper path | Use `./helpers/file.js` |
| Hook fails | Script exists & executable | `chmod +x script.sh` |
| Validation error | Required fields | Add name, version, category, files |

---

## File Structure

```
my-archetype/
├── archetype.json          # Configuration (required)
├── templates/              # Templates (required)
│   ├── config/*.yaml       # Nunjucks
│   ├── scripts/*.sh        # EJS
│   └── docs/*.md           # Handlebars
├── helpers/                # Handlebars helpers (optional)
├── filters/                # Nunjucks filters (optional)
├── partials/               # Handlebars partials (optional)
└── scripts/                # Lifecycle scripts (optional)
    └── migrations/
```

---

## Variable Types

| Type | Example | Validation |
|------|---------|------------|
| `string` | `"value"` | `pattern`, `min`, `max` |
| `number` | `3000` | `min`, `max` |
| `boolean` | `true` | - |
| `enum` | `"choice"` | `choices: ["a", "b"]` |
| `multiselect` | `["a", "c"]` | `choices: ["a", "b", "c"]` |
| `array` | `[1, 2, 3]` | `min`, `max` |
| `object` | `{key: "val"}` | - |

---

## Migration Checklist

### Existing Archetype → Multi-Engine

1. ✓ Backup: `cp archetype.json archetype.json.backup`
2. ✓ Choose engine: Add `"engine": {"type": "nunjucks"}`
3. ✓ Update templates: Convert syntax if changing engine
4. ✓ Validate: `ajv validate -s schema -d archetype.json`
5. ✓ Test: Generate sample project
6. ✓ Bump version: Follow semver (2.0.0 if breaking)

---

## Required vs Optional

### Required
```json
{
  "name": "my-archetype",
  "version": "1.0.0",
  "description": "Description",
  "category": "service",
  "files": ["templates/**/*"]
}
```

### Recommended
```json
{
  "tags": ["nodejs", "typescript"],
  "author": { "name": "Your Name" },
  "engine": { "type": "handlebars" }
}
```

### Advanced
```json
{
  "fileEngineOverrides": {},
  "lifecycle": { "hooks": {}, "migrations": [] },
  "variables": [],
  "dependencies": []
}
```

---

## Examples Location

| Example | Path | Purpose |
|---------|------|---------|
| Simple | `examples/archetypes/simple-handlebars/` | Minimal config |
| Nunjucks | `examples/archetypes/nunjucks-config/` | YAML generation |
| Copier | `examples/archetypes/copier-python/` | Python + updates |
| Complete | `examples/archetypes/multi-engine/` | All features |

---

## Resources

📄 **Full Docs:** `ARCHETYPE_MULTI_ENGINE_SUMMARY.md`
📋 **Migration:** `docs/ARCHETYPE_MIGRATION_GUIDE.md`
🔧 **Schema:** `schemas/archetype.schema.json`
💻 **Types:** `types/archetype.types.ts`
📚 **Examples:** `examples/archetypes/README.md`

---

## Version History

| Version | Changes |
|---------|---------|
| 1.0.0 | Initial multi-engine support |
| | - 6 template engines |
| | - File-level overrides |
| | - Lifecycle management |
| | - Backward compatible |
