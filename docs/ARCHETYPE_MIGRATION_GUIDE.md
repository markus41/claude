# Archetype Migration Guide: Single to Multi-Engine

## Overview

This guide helps you migrate existing archetypes from the single-engine (Handlebars-only) format to the new multi-engine format that supports Handlebars, Nunjucks, Eta, EJS, Copier, and Cookiecutter.

**Key Changes:**
- Added `engine` configuration object
- Support for per-file engine overrides via `fileEngineOverrides`
- Lifecycle hooks and migration support
- Backward compatibility maintained (defaults to Handlebars)

---

## Migration Strategies

### Strategy 1: No Changes Required (Default Handlebars)

**Best for:** Existing Handlebars archetypes that don't need other engines

**Action:** None required! Your archetype will continue to work with Handlebars as the default engine.

**Example:**
```json
{
  "name": "my-archetype",
  "version": "1.0.0",
  "description": "My existing archetype",
  "category": "service",
  "files": ["templates/**/*"]
}
```

This automatically uses Handlebars with default settings.

---

### Strategy 2: Explicit Handlebars Configuration

**Best for:** Handlebars archetypes that need custom settings (strict mode, custom helpers, etc.)

**Before:**
```json
{
  "name": "my-archetype",
  "version": "1.0.0",
  "description": "My existing archetype",
  "category": "service",
  "files": ["templates/**/*"]
}
```

**After:**
```json
{
  "name": "my-archetype",
  "version": "1.0.0",
  "description": "My existing archetype",
  "category": "service",
  "engine": {
    "type": "handlebars",
    "version": "^4.7.0",
    "config": {
      "handlebars": {
        "strict": true,
        "noEscape": false,
        "helpers": ["./helpers/custom-helpers.js"],
        "partials": {
          "header": "./partials/header.hbs",
          "footer": "./partials/footer.hbs"
        }
      }
    }
  },
  "files": ["templates/**/*"]
}
```

**Changes Made:**
1. Added `engine` object with explicit `type: "handlebars"`
2. Specified version constraint for reproducibility
3. Configured strict mode and custom helpers
4. Registered named partials

---

### Strategy 3: Switch to Alternative Engine

**Best for:** Projects migrating from Handlebars to Nunjucks/Eta/EJS

#### Example: Handlebars → Nunjucks

**Template Changes:**

**Before (Handlebars):**
```handlebars
{{! templates/config.yaml.hbs }}
service:
  name: {{serviceName}}
  version: {{version}}
  {{#if enableAuth}}
  auth:
    enabled: true
  {{/if}}
```

**After (Nunjucks):**
```jinja2
{# templates/config.yaml.njk #}
service:
  name: {{ serviceName }}
  version: {{ version }}
  {% if enableAuth %}
  auth:
    enabled: true
  {% endif %}
```

**Configuration Changes:**

```json
{
  "name": "my-archetype",
  "version": "2.0.0",
  "description": "My archetype (now with Nunjucks)",
  "category": "service",
  "engine": {
    "type": "nunjucks",
    "version": "^3.2.0",
    "config": {
      "nunjucks": {
        "autoescape": true,
        "throwOnUndefined": true,
        "trimBlocks": true
      }
    }
  },
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./scripts/migrate-to-nunjucks.sh",
        "description": "Convert Handlebars templates to Nunjucks"
      }
    ]
  },
  "files": ["templates/**/*.njk"]
}
```

---

### Strategy 4: Mixed-Engine Archetype

**Best for:** Complex archetypes where different file types benefit from different engines

**Use Case:**
- Configuration files (YAML/JSON) → Nunjucks (better whitespace control)
- Documentation (Markdown) → Handlebars (simpler syntax)
- Scripts (Shell/Python) → EJS (flexible delimiter support)

**Configuration:**
```json
{
  "name": "polyglot-archetype",
  "version": "1.0.0",
  "description": "Multi-engine archetype for diverse templates",
  "category": "service",
  "engine": {
    "type": "handlebars",
    "config": {
      "handlebars": {
        "strict": true
      }
    }
  },
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": {
      "type": "nunjucks",
      "config": {
        "nunjucks": {
          "trimBlocks": true,
          "lstripBlocks": true
        }
      }
    },
    "templates/scripts/**/*.sh": {
      "type": "ejs",
      "config": {
        "ejs": {
          "delimiter": "%",
          "rmWhitespace": true
        }
      }
    },
    "templates/docs/**/*.md": {
      "type": "handlebars"
    }
  },
  "files": ["templates/**/*"]
}
```

**Directory Structure:**
```
archetype/
├── archetype.json
├── templates/
│   ├── config/
│   │   └── app.yaml       # Uses Nunjucks (whitespace-sensitive)
│   ├── scripts/
│   │   └── setup.sh       # Uses EJS (flexible delimiters)
│   └── docs/
│       └── README.md      # Uses Handlebars (simple syntax)
```

---

## Lifecycle Hooks and Migrations

### Adding Lifecycle Hooks

**Use Case:** Run setup commands after generating a project

```json
{
  "lifecycle": {
    "hooks": {
      "preGenerate": [
        "echo 'Starting project generation...'",
        "mkdir -p .generated"
      ],
      "postGenerate": [
        "npm install",
        "npm run build",
        "git init",
        "git add .",
        "git commit -m 'Initial commit from archetype'"
      ]
    }
  }
}
```

### Adding Migration Support

**Use Case:** Help users upgrade from archetype v1 to v2

```json
{
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./scripts/migrate-v1-to-v2.sh",
        "description": "Migrate from legacy config format to new structure"
      },
      {
        "version": "2.1.0",
        "script": "./scripts/add-typescript-support.sh",
        "description": "Add TypeScript configuration and dependencies"
      }
    ],
    "updateStrategy": "prompt"
  }
}
```

**Migration Script Example (migrate-v1-to-v2.sh):**
```bash
#!/bin/bash
# Migration script for archetype v1 → v2

echo "Migrating from v1 to v2..."

# Rename old config
if [ -f "config.old.json" ]; then
  mv config.old.json config.v1.backup.json
fi

# Update package.json
if [ -f "package.json" ]; then
  jq '.scripts.start = "npm run dev"' package.json > package.json.tmp
  mv package.json.tmp package.json
fi

# Add new required files
touch .env.example
echo "Migration complete!"
```

---

## Step-by-Step Migration Checklist

### Phase 1: Preparation
- [ ] Review current archetype structure and template syntax
- [ ] Identify which templates would benefit from alternative engines
- [ ] Check for custom Handlebars helpers that need migration
- [ ] Back up existing archetype: `cp archetype.json archetype.json.backup`

### Phase 2: Schema Update
- [ ] Add `engine` object if using non-default settings
- [ ] Specify `engine.type` and `engine.version`
- [ ] Configure engine-specific settings in `engine.config`
- [ ] Add `fileEngineOverrides` if using mixed engines

### Phase 3: Template Migration
- [ ] Convert template syntax for new engine (if changing)
- [ ] Update file extensions (.hbs → .njk, .eta, .ejs, etc.)
- [ ] Test template rendering with sample variables
- [ ] Update `files` patterns if file extensions changed

### Phase 4: Lifecycle Configuration
- [ ] Add `lifecycle.hooks` for pre/post generation commands
- [ ] Create migration scripts for version upgrades
- [ ] Define `lifecycle.migrations` array
- [ ] Set `lifecycle.updateStrategy` (prompt/overwrite/merge/skip)

### Phase 5: Testing
- [ ] Validate archetype.json against schema: `ajv validate -s archetype.schema.json -d archetype.json`
- [ ] Generate test project with new configuration
- [ ] Verify all templates render correctly
- [ ] Test lifecycle hooks execute properly
- [ ] Test migration paths from previous versions

### Phase 6: Documentation
- [ ] Update archetype README with new engine information
- [ ] Document any breaking changes in CHANGELOG
- [ ] Add examples of new engine syntax
- [ ] Document migration path for existing users
- [ ] Bump version following semver (2.0.0 if breaking)

---

## Common Migration Patterns

### Pattern 1: Handlebars → Nunjucks Syntax Mapping

| Handlebars | Nunjucks | Notes |
|------------|----------|-------|
| `{{variable}}` | `{{ variable }}` | Nunjucks prefers spaces |
| `{{#if condition}}` | `{% if condition %}` | Block tags use `{%` |
| `{{#each items}}` | `{% for item in items %}` | Loop syntax differs |
| `{{else}}` | `{% else %}` | Else in block tags |
| `{{/if}}` | `{% endif %}` | Close with `end` prefix |
| `{{! comment }}` | `{# comment #}` | Comment syntax |
| `{{> partial}}` | `{% include "partial.njk" %}` | Include mechanism |

### Pattern 2: Adding Custom Filters/Helpers

**Handlebars Custom Helper:**
```json
{
  "engine": {
    "type": "handlebars",
    "config": {
      "handlebars": {
        "helpers": ["./helpers/string-helpers.js"]
      }
    }
  }
}
```

**helpers/string-helpers.js:**
```javascript
module.exports = {
  uppercase: (str) => str.toUpperCase(),
  slugify: (str) => str.toLowerCase().replace(/\s+/g, '-')
};
```

**Nunjucks Custom Filter:**
```json
{
  "engine": {
    "type": "nunjucks",
    "config": {
      "nunjucks": {
        "filters": {
          "uppercase": "./filters/uppercase.js",
          "slugify": "./filters/slugify.js"
        }
      }
    }
  }
}
```

### Pattern 3: Copier Integration (Python-based)

**For Python-heavy projects or teams already using Copier:**

```json
{
  "name": "python-service",
  "version": "1.0.0",
  "category": "service",
  "engine": {
    "type": "copier",
    "version": "^8.0.0",
    "config": {
      "copier": {
        "envops": {
          "block_start_string": "{%",
          "block_end_string": "%}",
          "variable_start_string": "{{",
          "variable_end_string": "}}",
          "keep_trailing_newline": true
        },
        "exclude": [
          "*.pyc",
          "__pycache__",
          ".git"
        ],
        "skip_if_exists": [
          ".env",
          "secrets.yaml"
        ],
        "tasks": [
          "pip install -r requirements.txt",
          "python -m pytest tests/"
        ]
      }
    }
  },
  "lifecycle": {
    "updateStrategy": "merge"
  }
}
```

---

## Breaking Changes and Versioning

### When to Bump Versions

| Change Type | Version Bump | Example |
|-------------|--------------|---------|
| Add `engine` config with same behavior | Patch (1.0.0 → 1.0.1) | Making Handlebars explicit |
| Switch to different engine | Major (1.0.0 → 2.0.0) | Handlebars → Nunjucks |
| Add lifecycle hooks (non-breaking) | Minor (1.0.0 → 1.1.0) | Add postGenerate hook |
| Change variable requirements | Major (1.0.0 → 2.0.0) | Make variable required |
| Add new optional variables | Minor (1.0.0 → 1.1.0) | Add new feature flag |

### Deprecation Strategy

When making breaking changes, support both old and new formats for one major version:

**Version 1.x (Old Format):**
```json
{
  "name": "my-archetype",
  "version": "1.5.0"
  // No engine config, uses Handlebars implicitly
}
```

**Version 2.0 (Transition - Support Both):**
```json
{
  "name": "my-archetype",
  "version": "2.0.0",
  "engine": {
    "type": "handlebars"
  },
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./scripts/warn-about-v3.sh",
        "description": "Warn users about upcoming v3 changes"
      }
    ]
  }
}
```

**Version 3.0 (New Format Only):**
```json
{
  "name": "my-archetype",
  "version": "3.0.0",
  "engine": {
    "type": "nunjucks"
  }
}
```

---

## Troubleshooting

### Issue: Templates Not Rendering

**Symptom:** Variables show as raw text (`{{variable}}`) in output

**Solutions:**
1. Verify `engine.type` matches template syntax
2. Check file extension matches engine (.hbs, .njk, .eta, .ejs)
3. Confirm `fileEngineOverrides` pattern matches file path
4. Test with minimal template to isolate issue

### Issue: Custom Helpers Not Working

**Symptom:** `Helper 'myHelper' not found` error

**Solutions:**
1. Verify helper file path is relative to archetype root
2. Check helper file exports correct format for engine
3. Ensure `engine.config` includes helper registration
4. Test helper in isolation with engine's CLI

### Issue: Migration Script Fails

**Symptom:** Migration exits with error code

**Solutions:**
1. Check script has execute permissions: `chmod +x script.sh`
2. Verify script path is correct in `migrations[].script`
3. Test script manually in generated project
4. Add error handling and logging to script
5. Use `updateStrategy: "prompt"` to catch issues early

### Issue: Mixed-Engine Pattern Match

**Symptom:** Wrong engine applied to file

**Solutions:**
1. Check pattern specificity (more specific patterns win)
2. Use absolute paths from archetype root
3. Test pattern with glob tester: `echo templates/config/*.yaml | grep "pattern"`
4. Add debug logging to see which pattern matched

---

## Validation Tools

### Validate archetype.json Against Schema

```bash
# Using AJV CLI
npm install -g ajv-cli
ajv validate \
  -s schemas/archetype.schema.json \
  -d archetypes/my-archetype/archetype.json
```

### TypeScript Type Checking

```typescript
import { ArchetypeConfig, validateArchetypeConfig } from './types/archetype.types';
import archetypeJson from './archetype.json';

if (validateArchetypeConfig(archetypeJson)) {
  const config: ArchetypeConfig = archetypeJson;
  console.log(`Valid archetype: ${config.name} v${config.version}`);
} else {
  console.error('Invalid archetype configuration');
}
```

### Pre-commit Hook

```bash
#!/bin/bash
# .git/hooks/pre-commit

# Validate all archetype.json files before commit
for file in archetypes/*/archetype.json; do
  echo "Validating $file..."
  ajv validate -s schemas/archetype.schema.json -d "$file" || exit 1
done

echo "All archetypes valid!"
```

---

## Examples Directory Reference

After migration, your archetype directory should look like:

```
archetypes/
├── my-handlebars-archetype/
│   ├── archetype.json          # Engine not specified (defaults to Handlebars)
│   └── templates/
│       └── *.hbs
├── my-nunjucks-archetype/
│   ├── archetype.json          # engine.type: "nunjucks"
│   └── templates/
│       └── *.njk
├── my-mixed-archetype/
│   ├── archetype.json          # Has fileEngineOverrides
│   └── templates/
│       ├── config/*.yaml       # Uses Nunjucks
│       ├── docs/*.md           # Uses Handlebars
│       └── scripts/*.sh        # Uses EJS
└── my-copier-archetype/
    ├── archetype.json          # engine.type: "copier"
    ├── copier.yml              # Copier-specific config
    └── templates/
        └── *.py.jinja
```

---

## Support and Resources

- **JSON Schema:** `schemas/archetype.schema.json`
- **TypeScript Types:** `types/archetype.types.ts`
- **Example Archetypes:** `examples/archetypes/`
- **Template Engine Docs:**
  - [Handlebars](https://handlebarsjs.com/guide/)
  - [Nunjucks](https://mozilla.github.io/nunjucks/templating.html)
  - [Eta](https://eta.js.org/docs/intro)
  - [EJS](https://ejs.co/#docs)
  - [Copier](https://copier.readthedocs.io/)
  - [Cookiecutter](https://cookiecutter.readthedocs.io/)

---

## Summary

The migration to multi-engine support provides:

✅ **Backward Compatibility** - Existing Handlebars archetypes work unchanged
✅ **Engine Flexibility** - Choose the best engine for your use case
✅ **Mixed Templates** - Different engines for different file types
✅ **Lifecycle Management** - Hooks and migrations for updates
✅ **Type Safety** - TypeScript types and JSON Schema validation

Most archetypes require **zero changes** to continue working. For advanced use cases, the new features provide powerful customization options while maintaining simplicity for basic scenarios.
