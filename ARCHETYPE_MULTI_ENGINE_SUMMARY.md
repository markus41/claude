# Archetype Multi-Engine Configuration - Complete Summary

## Deliverables Overview

This document summarizes the complete multi-engine archetype schema implementation, including JSON Schema, TypeScript types, migration guide, and reference examples.

---

## 1. JSON Schema (archetype.schema.json)

**Location:** `schemas/archetype.schema.json`

### Key Features

#### Core Schema Structure
- **Required fields:** `name`, `version`, `description`, `category`, `files`
- **Optional fields:** `tags`, `author`, `repository`, `engine`, `lifecycle`, `variables`, `dependencies`, `ignore`, `extends`
- **Version:** JSON Schema Draft-07
- **Validation:** Full JSON Schema validation with patterns, enums, and constraints

#### Engine Configuration
```json
{
  "engine": {
    "type": "handlebars | nunjucks | eta | ejs | copier | cookiecutter",
    "version": "^4.7.0",
    "config": {
      "handlebars": { /* engine-specific config */ }
    }
  }
}
```

**Supported Engines:**
- Handlebars (default when not specified)
- Nunjucks (Python Jinja2-like)
- Eta (high-performance JS)
- EJS (embedded JavaScript)
- Copier (Python with update support)
- Cookiecutter (Python legacy)

#### File-Level Engine Overrides
```json
{
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": {
      "type": "nunjucks",
      "config": { /* override config */ }
    }
  }
}
```

**Pattern Matching:**
- Supports glob patterns
- More specific patterns take precedence
- Allows mixed-engine templates in single archetype

#### Lifecycle Management
```json
{
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./scripts/migrate.sh",
        "description": "Migration description"
      }
    ],
    "updateStrategy": "prompt | overwrite | merge | skip",
    "hooks": {
      "preGenerate": ["cmd1", "cmd2"],
      "postGenerate": ["cmd3"],
      "preUpdate": ["cmd4"],
      "postUpdate": ["cmd5"]
    }
  }
}
```

**Lifecycle Features:**
- Migration scripts for version upgrades
- Update strategies (prompt user, overwrite, merge, skip)
- Pre/post hooks for generation and updates
- Supports Copier-style workflow

#### Variable System
```json
{
  "variables": [
    {
      "name": "projectName",
      "type": "string | number | boolean | array | object | enum | multiselect",
      "description": "Variable description",
      "required": true,
      "default": "value",
      "prompt": "Custom prompt text",
      "validation": {
        "pattern": "^[a-z0-9-]+$",
        "min": 3,
        "max": 50,
        "choices": ["option1", "option2"]
      },
      "when": "otherVar === true"
    }
  ]
}
```

**Variable Features:**
- 7 data types supported
- Regex pattern validation
- Min/max constraints
- Enum choices for dropdowns
- Conditional visibility (`when` clause)
- Custom prompts for interactive input

---

## 2. TypeScript Types (archetype.types.ts)

**Location:** `types/archetype.types.ts`

### Key Types

#### Core Interface
```typescript
export interface ArchetypeConfig {
  name: string;
  version: string;
  description: string;
  category: ArchetypeCategory;
  tags?: string[];
  author?: Author;
  repository?: Repository;
  engine?: EngineConfig;
  fileEngineOverrides?: Record<string, FileEngineOverride>;
  lifecycle?: Lifecycle;
  variables?: Variable[];
  dependencies?: Dependency[];
  files: string[];
  ignore?: string[];
  extends?: string;
}
```

#### Engine Types
```typescript
export type EngineType = 'handlebars' | 'nunjucks' | 'eta' | 'ejs' | 'copier' | 'cookiecutter';

export interface EngineConfig {
  type: EngineType;
  version?: string;
  config?: EngineSpecificConfig;
}

export interface EngineSpecificConfig {
  handlebars?: HandlebarsConfig;
  nunjucks?: NunjucksConfig;
  eta?: EtaConfig;
  ejs?: EJSConfig;
  copier?: CopierConfig;
  cookiecutter?: CookiecutterConfig;
}
```

#### Helper Functions
```typescript
// Type guards
export function isEngineType(value: any): value is EngineType;
export function isArchetypeCategory(value: any): value is ArchetypeCategory;

// Validation
export function validateArchetypeConfig(config: any): config is ArchetypeConfig;

// Utilities
export function getDefaultEngine(): EngineConfig;
export function mergeArchetypeConfigs(
  base: ArchetypeConfig,
  override: Partial<ArchetypeConfig>
): ArchetypeConfig;
```

### Type Safety Features

1. **Compile-time validation** via TypeScript
2. **Runtime validation** via type guards
3. **IntelliSense support** in IDEs
4. **Type narrowing** for conditional logic
5. **Merge utilities** for archetype inheritance

---

## 3. Migration Guide (ARCHETYPE_MIGRATION_GUIDE.md)

**Location:** `docs/ARCHETYPE_MIGRATION_GUIDE.md`

### Migration Strategies

#### Strategy 1: No Changes (Backward Compatible)
Existing Handlebars archetypes work without modification.

**Before/After:** Same configuration, implicit Handlebars

#### Strategy 2: Explicit Handlebars
Add engine configuration for custom settings.

**Migration:**
```json
// Add this block
{
  "engine": {
    "type": "handlebars",
    "version": "^4.7.0",
    "config": {
      "handlebars": {
        "strict": true,
        "helpers": ["./helpers/custom.js"]
      }
    }
  }
}
```

#### Strategy 3: Switch Engines
Convert templates and update configuration.

**Handlebars → Nunjucks:**
- Template syntax: `{{#if}}` → `{% if %}`
- Comment syntax: `{{! }}` → `{# #}`
- Loops: `{{#each}}` → `{% for %}`
- Includes: `{{> partial}}` → `{% include "partial.njk" %}`

#### Strategy 4: Mixed Engines
Use different engines for different file types.

**Example:**
- YAML configs → Nunjucks (whitespace control)
- Shell scripts → EJS (flexible delimiters)
- Documentation → Handlebars (simplicity)

### Migration Checklist

**Phase 1: Preparation**
- [ ] Review current templates
- [ ] Identify engine candidates
- [ ] Back up archetype.json

**Phase 2: Schema Update**
- [ ] Add `engine` object
- [ ] Configure `fileEngineOverrides`
- [ ] Add lifecycle hooks

**Phase 3: Template Migration**
- [ ] Convert template syntax
- [ ] Update file extensions
- [ ] Test rendering

**Phase 4: Lifecycle**
- [ ] Add hooks
- [ ] Create migration scripts
- [ ] Define update strategy

**Phase 5: Testing**
- [ ] Validate schema
- [ ] Generate test project
- [ ] Test all hooks

**Phase 6: Documentation**
- [ ] Update README
- [ ] Document breaking changes
- [ ] Bump version (semver)

### Versioning Rules

| Change Type | Version Bump |
|-------------|--------------|
| Add explicit engine (same behavior) | Patch (1.0.0 → 1.0.1) |
| Switch engine | Major (1.0.0 → 2.0.0) |
| Add lifecycle hooks | Minor (1.0.0 → 1.1.0) |
| Change variable requirements | Major (1.0.0 → 2.0.0) |
| Add optional variables | Minor (1.0.0 → 1.1.0) |

---

## 4. Reference Examples

**Location:** `examples/archetypes/`

### Example 1: simple-handlebars/

**Purpose:** Demonstrate backward compatibility

**Features:**
- No explicit engine configuration
- Minimal required fields
- Quick prototype template

**Best For:**
- Learning the basics
- Simple projects
- Handlebars-only use cases

### Example 2: nunjucks-config/

**Purpose:** YAML/JSON configuration generation

**Features:**
- Explicit Nunjucks configuration
- Custom filters (yaml_safe, json_stringify)
- Lifecycle validation hooks
- Whitespace control

**Best For:**
- Kubernetes configs
- CI/CD pipeline configs
- Infrastructure as Code

### Example 3: copier-python/

**Purpose:** Python services with update management

**Features:**
- Copier engine integration
- Migration scripts
- Skip-if-exists for secrets
- Post-generation tasks (venv, pip, pytest)

**Best For:**
- Python microservices
- FastAPI/Flask applications
- Projects needing update support

### Example 4: multi-engine/

**Purpose:** Comprehensive reference with all features

**Features:**
- Mixed engines (Handlebars, Nunjucks, EJS)
- File-level overrides
- Complete lifecycle management
- Extensive variable validation
- Custom helpers and filters
- All supported data types

**Best For:**
- Learning all schema features
- Complex multi-language projects
- Reference implementation

**Directory Structure:**
```
multi-engine/
├── archetype.json           # Complete configuration
├── templates/
│   ├── config/*.yaml       # Nunjucks templates
│   ├── scripts/*.sh        # EJS templates
│   ├── docs/*.md           # Handlebars templates
│   └── src/*.ts            # Handlebars templates
├── helpers/
│   ├── string-helpers.js
│   └── date-helpers.js
├── filters/
│   ├── uppercase.js
│   └── env-var.js
├── partials/
│   ├── header.hbs
│   └── footer.hbs
└── scripts/
    └── migrations/
        ├── init-v1.sh
        └── migrate-to-v2.sh
```

---

## 5. Engine Comparison Matrix

| Feature | Handlebars | Nunjucks | Eta | EJS | Copier | Cookiecutter |
|---------|-----------|----------|-----|-----|--------|--------------|
| **Learning Curve** | Low | Medium | Low | Low | High | Medium |
| **Performance** | Good | Good | Excellent | Good | Good | Good |
| **Whitespace Control** | Limited | Excellent | Good | Good | Excellent | Good |
| **Logic Complexity** | Limited | High | High | High | High | Medium |
| **Custom Functions** | Helpers | Filters | Plugins | Native JS | Filters | Functions |
| **Update Support** | No | No | No | No | Yes | No |
| **Python Integration** | No | No | No | No | Yes | Yes |
| **Ecosystem Size** | Large | Medium | Small | Large | Medium | Large |
| **Best For** | General | Config | Performance | Scripts | Python | Simple |

### Engine Selection Guide

**Choose Handlebars when:**
- Simple variable substitution
- Team familiar with Mustache
- Large helper ecosystem needed
- Logic-light templates

**Choose Nunjucks when:**
- Generating YAML/JSON
- Precise whitespace control needed
- Python Jinja2 familiarity
- Block inheritance wanted

**Choose Eta when:**
- Performance is critical
- TypeScript project
- Want smallest bundle
- Plugin system needed

**Choose EJS when:**
- Generating shell scripts
- Custom delimiters required
- JavaScript-native preferred
- Zero learning curve for JS devs

**Choose Copier when:**
- Python project
- Update/migration support essential
- Answer replay needed
- Skip-if-exists logic required

**Choose Cookiecutter when:**
- Legacy Python projects
- Simple scaffolding only
- No updates needed
- Large template ecosystem

---

## 6. Integration Workflow

### Development Workflow

```bash
# 1. Create archetype
mkdir my-archetype
cd my-archetype

# 2. Initialize archetype.json
cat > archetype.json <<EOF
{
  "name": "my-archetype",
  "version": "1.0.0",
  "description": "My archetype",
  "category": "service",
  "files": ["templates/**/*"]
}
EOF

# 3. Create templates
mkdir -p templates/src
echo 'console.log("{{projectName}}");' > templates/src/index.js

# 4. Validate
ajv validate -s schemas/archetype.schema.json -d archetype.json

# 5. Test generation
npm run archetype:generate --archetype=my-archetype
```

### Usage Workflow

```bash
# 1. List available archetypes
npm run archetype:list

# 2. Generate project
npm run archetype:generate \
  --archetype=multi-engine \
  --interactive

# 3. Update existing project
cd my-project
npm run archetype:update \
  --archetype=multi-engine \
  --version=2.0.0
```

### CI/CD Integration

```yaml
# .github/workflows/validate-archetypes.yml
name: Validate Archetypes

on: [push, pull_request]

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Install dependencies
        run: npm install -g ajv-cli

      - name: Validate all archetypes
        run: |
          for file in archetypes/*/archetype.json; do
            echo "Validating $file..."
            ajv validate \
              -s schemas/archetype.schema.json \
              -d "$file" || exit 1
          done

      - name: Test generation
        run: |
          npm run test:archetypes
```

---

## 7. Best Practices

### Schema Design

1. **Start Simple, Extend Later**
   - Begin with minimal configuration
   - Add complexity as needed
   - Use backward-compatible changes

2. **Choose Right Engine**
   - Match engine to content type
   - Consider team expertise
   - Evaluate update requirements

3. **Validate Early**
   - Use JSON Schema validation
   - Add TypeScript types
   - Test with sample data

4. **Document Everything**
   - Comment variable purposes
   - Explain engine choices
   - Provide migration guides

### Template Organization

1. **Consistent Structure**
   ```
   archetype/
   ├── archetype.json
   ├── templates/
   ├── helpers/
   ├── filters/
   ├── partials/
   └── scripts/migrations/
   ```

2. **File Naming**
   - Use engine-specific extensions (.hbs, .njk, .ejs)
   - Group by type (config/, scripts/, docs/)
   - Match final output structure

3. **Engine Overrides**
   - Use most specific patterns
   - Document override rationale
   - Test pattern matching

### Lifecycle Management

1. **Hooks**
   - Keep hooks idempotent
   - Add error handling
   - Log all operations
   - Test in isolation

2. **Migrations**
   - Version all migrations
   - Provide rollback scripts
   - Document breaking changes
   - Test migration paths

3. **Updates**
   - Use `prompt` strategy by default
   - Skip sensitive files
   - Backup before updates
   - Run tests after updates

---

## 8. Troubleshooting Guide

### Common Issues

#### Issue 1: Schema Validation Fails

**Symptom:** `ajv validation error`

**Causes:**
- Missing required fields
- Invalid enum value
- Pattern mismatch

**Solutions:**
```bash
# Detailed validation output
ajv validate \
  -s schemas/archetype.schema.json \
  -d archetype.json \
  --verbose

# Check specific field
jq '.engine.type' archetype.json
```

#### Issue 2: Wrong Engine Applied

**Symptom:** Variables render as raw text

**Causes:**
- Incorrect `fileEngineOverrides` pattern
- Missing engine configuration
- File extension mismatch

**Solutions:**
```json
// Check pattern specificity
{
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": {  // Must match file path
      "type": "nunjucks"
    }
  }
}
```

#### Issue 3: Custom Helpers Not Found

**Symptom:** `Helper 'myHelper' not found`

**Causes:**
- Incorrect helper path
- Wrong export format
- Engine not loaded

**Solutions:**
```javascript
// Correct helper format (helpers/my-helpers.js)
module.exports = {
  myHelper: function(value) {
    return value.toUpperCase();
  }
};
```

```json
// Correct path in archetype.json
{
  "engine": {
    "config": {
      "handlebars": {
        "helpers": ["./helpers/my-helpers.js"]  // Relative to archetype.json
      }
    }
  }
}
```

#### Issue 4: Lifecycle Hook Fails

**Symptom:** Hook exits with non-zero code

**Causes:**
- Missing command
- Incorrect script path
- Permission denied

**Solutions:**
```bash
# Add error handling to hook script
#!/bin/bash
set -e  # Exit on error

if ! command -v npm &> /dev/null; then
  echo "npm not found, skipping..."
  exit 0
fi

npm install || {
  echo "npm install failed"
  exit 1
}
```

```bash
# Make script executable
chmod +x scripts/migrations/migrate.sh
```

---

## 9. Implementation Checklist

### For Schema Authors

- [ ] Define all required fields
- [ ] Add optional fields with defaults
- [ ] Create validation patterns
- [ ] Document all properties
- [ ] Provide examples
- [ ] Test with JSON Schema validator

### For Type Authors

- [ ] Create interfaces matching schema
- [ ] Add type guards
- [ ] Implement validation functions
- [ ] Add utility helpers
- [ ] Test TypeScript compilation
- [ ] Generate documentation

### For Archetype Authors

- [ ] Choose appropriate engine(s)
- [ ] Configure engine settings
- [ ] Create templates
- [ ] Define variables with validation
- [ ] Add lifecycle hooks
- [ ] Write migration scripts
- [ ] Test generation workflow
- [ ] Document usage

### For Tool Implementers

- [ ] Parse archetype.json
- [ ] Validate against schema
- [ ] Load correct engine
- [ ] Apply file overrides
- [ ] Execute lifecycle hooks
- [ ] Handle migrations
- [ ] Support update strategies
- [ ] Provide CLI interface

---

## 10. Future Enhancements

### Planned Features

1. **Additional Engines**
   - Liquid (Shopify)
   - Pug/Jade
   - Mustache (standalone)
   - Velocity (Java)

2. **Schema Extensions**
   - Conditional dependencies
   - Dynamic variable defaults
   - Variable transformations
   - Nested archetype composition

3. **Tooling**
   - Visual archetype builder
   - Interactive CLI wizard
   - VS Code extension
   - Web-based generator

4. **Integration**
   - Package manager integration (npm, pip, cargo)
   - CI/CD templates
   - IDE plugins
   - Git hooks

---

## Resources

### Documentation
- **JSON Schema:** `schemas/archetype.schema.json`
- **TypeScript Types:** `types/archetype.types.ts`
- **Migration Guide:** `docs/ARCHETYPE_MIGRATION_GUIDE.md`
- **Examples README:** `examples/archetypes/README.md`

### External Resources
- [JSON Schema Specification](https://json-schema.org/)
- [Handlebars Documentation](https://handlebarsjs.com/)
- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/)
- [Eta Documentation](https://eta.js.org/)
- [EJS Documentation](https://ejs.co/)
- [Copier Documentation](https://copier.readthedocs.io/)
- [Cookiecutter Documentation](https://cookiecutter.readthedocs.io/)

### Tools
- **JSON Schema Validator:** `npm install -g ajv-cli`
- **TypeScript Compiler:** `npm install -g typescript`
- **Template Engines:** See individual documentation

---

## Summary

The multi-engine archetype schema provides:

✅ **Backward Compatibility** - Existing archetypes work unchanged
✅ **Engine Flexibility** - 6 template engines supported
✅ **Mixed Templates** - Per-file engine overrides
✅ **Lifecycle Management** - Hooks and migrations
✅ **Type Safety** - JSON Schema + TypeScript
✅ **Comprehensive Documentation** - Migration guide + examples
✅ **Production Ready** - Validated, tested, extensible

**Key Design Principles:**
1. **Default to Handlebars** - Zero config for existing archetypes
2. **Explicit Over Implicit** - Clear engine configuration
3. **Progressive Enhancement** - Add complexity as needed
4. **Developer Experience** - Intuitive, well-documented, validated

This implementation supports sustainable archetype evolution while maintaining simplicity for basic use cases.
