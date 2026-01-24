# Archetype Multi-Engine Configuration - Complete Index

## Navigation Guide

This index provides quick access to all archetype multi-engine documentation, schemas, examples, and resources.

---

## 📋 Core Documentation

### Getting Started
| Document | Description | Audience |
|----------|-------------|----------|
| [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) | 1-page cheat sheet | All users |
| [Complete Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md) | Full implementation overview | Architects, implementers |
| [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md) | Detailed migration instructions | Archetype authors |
| [Examples README](examples/archetypes/README.md) | Example walkthroughs | Learners, developers |

### Technical Specifications
| File | Type | Purpose |
|------|------|---------|
| [archetype.schema.json](schemas/archetype.schema.json) | JSON Schema | Validation definition |
| [archetype.types.ts](types/archetype.types.ts) | TypeScript | Type definitions |

---

## 🔍 Find What You Need

### I want to...

#### Learn the Basics
1. Start with [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) (5 min read)
2. Review [simple-handlebars example](examples/archetypes/simple-handlebars/archetype.json)
3. Try generating a project

#### Migrate an Existing Archetype
1. Read [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md)
2. Choose migration strategy (backward compatible, switch engine, or mixed)
3. Follow step-by-step checklist
4. Validate with schema

#### Understand All Features
1. Read [Complete Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md)
2. Study [multi-engine example](examples/archetypes/multi-engine/archetype.json)
3. Review engine comparison matrix
4. Explore lifecycle management

#### Build a New Archetype
1. Choose an [example](examples/archetypes/) as starting point
2. Copy and customize archetype.json
3. Create templates with chosen engine
4. Validate against [schema](schemas/archetype.schema.json)
5. Test generation workflow

#### Implement Tooling
1. Study [TypeScript types](types/archetype.types.ts)
2. Review [JSON Schema](schemas/archetype.schema.json)
3. Examine validation functions
4. Reference [multi-engine example](examples/archetypes/multi-engine/archetype.json)

---

## 📚 Documentation Structure

```
claude/
├── ARCHETYPE_INDEX.md                          # This file - navigation hub
├── ARCHETYPE_QUICK_REFERENCE.md                # 1-page cheat sheet
├── ARCHETYPE_MULTI_ENGINE_SUMMARY.md           # Complete implementation guide
│
├── schemas/
│   └── archetype.schema.json                   # JSON Schema definition
│
├── types/
│   └── archetype.types.ts                      # TypeScript type definitions
│
├── docs/
│   └── ARCHETYPE_MIGRATION_GUIDE.md            # Step-by-step migration
│
└── examples/
    └── archetypes/
        ├── README.md                           # Examples overview
        ├── simple-handlebars/                  # Minimal example
        │   └── archetype.json
        ├── nunjucks-config/                    # Nunjucks example
        │   └── archetype.json
        ├── copier-python/                      # Copier example
        │   └── archetype.json
        └── multi-engine/                       # Complete reference
            ├── archetype.json
            ├── templates/
            ├── helpers/
            ├── filters/
            ├── partials/
            └── scripts/
```

---

## 🎯 By Use Case

### Use Case: Configuration Management
**Goal:** Generate YAML/JSON configs for Kubernetes, CI/CD, etc.

**Resources:**
- Example: [nunjucks-config](examples/archetypes/nunjucks-config/archetype.json)
- Engine: Nunjucks
- Features: Whitespace control, custom filters, validation hooks

**Template Syntax:**
```jinja2
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ configName | yaml_safe }}
data:
  {% for key, value in configData %}
  {{ key }}: {{ value }}
  {% endfor %}
```

---

### Use Case: Python Microservices
**Goal:** Generate FastAPI/Flask services with update support

**Resources:**
- Example: [copier-python](examples/archetypes/copier-python/archetype.json)
- Engine: Copier
- Features: Migrations, skip-if-exists, post-generation tasks

**Migration Script:**
```python
# scripts/migrations/upgrade-to-pydantic-v2.py
def migrate():
    # Update imports
    # Migrate field definitions
    # Run tests
    pass
```

---

### Use Case: Node.js Services
**Goal:** Generate TypeScript services with Docker, testing, CI/CD

**Resources:**
- Example: [multi-engine](examples/archetypes/multi-engine/archetype.json)
- Engines: Handlebars (code), Nunjucks (YAML), EJS (scripts)
- Features: Mixed engines, lifecycle hooks, extensive variables

**File Engine Map:**
- `src/**/*.ts` → Handlebars (simple syntax)
- `config/**/*.yaml` → Nunjucks (whitespace control)
- `scripts/**/*.sh` → EJS (flexible delimiters)

---

### Use Case: Documentation Generators
**Goal:** Generate project documentation, READMEs, ADRs

**Resources:**
- Example: [simple-handlebars](examples/archetypes/simple-handlebars/archetype.json)
- Engine: Handlebars (default)
- Features: Partials (header, footer), custom helpers

**Partials:**
```handlebars
{{> header}}

# {{projectName}}

{{description}}

{{> footer}}
```

---

## 🔧 By Engine

### Handlebars
**When:** General-purpose, simple templates, large ecosystem

**Examples:**
- [simple-handlebars](examples/archetypes/simple-handlebars/archetype.json)
- [multi-engine](examples/archetypes/multi-engine/archetype.json) (code templates)

**Documentation:**
- [Handlebars Official](https://handlebarsjs.com/)
- [Schema Config](schemas/archetype.schema.json#handlebars)

**Syntax:**
```handlebars
{{variable}}
{{#if condition}}...{{/if}}
{{#each items}}{{this}}{{/each}}
```

---

### Nunjucks
**When:** YAML/JSON configs, whitespace-sensitive, Python Jinja2 familiarity

**Examples:**
- [nunjucks-config](examples/archetypes/nunjucks-config/archetype.json)
- [multi-engine](examples/archetypes/multi-engine/archetype.json) (config templates)

**Documentation:**
- [Nunjucks Official](https://mozilla.github.io/nunjucks/)
- [Schema Config](schemas/archetype.schema.json#nunjucks)

**Syntax:**
```jinja2
{{ variable }}
{% if condition %}...{% endif %}
{% for item in items %}{{ item }}{% endfor %}
```

---

### EJS
**When:** Shell scripts, Terraform, custom delimiters, JavaScript-native

**Examples:**
- [multi-engine](examples/archetypes/multi-engine/archetype.json) (script templates)

**Documentation:**
- [EJS Official](https://ejs.co/)
- [Schema Config](schemas/archetype.schema.json#ejs)

**Syntax:**
```ejs
<%= variable %>
<% if (condition) { %>...<% } %>
<% items.forEach(item => { %><%= item %><% }); %>
```

---

### Copier
**When:** Python projects, update support, migrations, answer replay

**Examples:**
- [copier-python](examples/archetypes/copier-python/archetype.json)

**Documentation:**
- [Copier Official](https://copier.readthedocs.io/)
- [Schema Config](schemas/archetype.schema.json#copier)

**Migration:**
```json
{
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./migrate.py",
        "description": "Breaking changes"
      }
    ]
  }
}
```

---

### Eta
**When:** Performance-critical, TypeScript projects, plugin system

**Documentation:**
- [Eta Official](https://eta.js.org/)
- [Schema Config](schemas/archetype.schema.json#eta)

**Syntax:**
```eta
<%= it.variable %>
<% if (it.condition) { %>...<% } %>
```

---

### Cookiecutter
**When:** Legacy Python projects, simple scaffolding, large template ecosystem

**Documentation:**
- [Cookiecutter Official](https://cookiecutter.readthedocs.io/)
- [Schema Config](schemas/archetype.schema.json#cookiecutter)

---

## 📊 Feature Matrix

| Feature | Location | Example |
|---------|----------|---------|
| **Engine Configuration** | `engine` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **File Overrides** | `fileEngineOverrides` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **Lifecycle Hooks** | `lifecycle.hooks` | [copier-python](examples/archetypes/copier-python/archetype.json) |
| **Migrations** | `lifecycle.migrations` | [copier-python](examples/archetypes/copier-python/archetype.json) |
| **Variable Validation** | `variables[].validation` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **Conditional Variables** | `variables[].when` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **Custom Helpers** | `engine.config.handlebars.helpers` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **Custom Filters** | `engine.config.nunjucks.filters` | [nunjucks-config](examples/archetypes/nunjucks-config/archetype.json) |
| **Dependencies** | `dependencies` | [multi-engine](examples/archetypes/multi-engine/archetype.json) |
| **Archetype Inheritance** | `extends` | [Schema](schemas/archetype.schema.json) |

---

## 🎓 Learning Path

### Beginner (1-2 hours)
1. ✓ Read [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) (15 min)
2. ✓ Study [simple-handlebars example](examples/archetypes/simple-handlebars/archetype.json) (15 min)
3. ✓ Create minimal archetype.json (15 min)
4. ✓ Write simple templates (15 min)
5. ✓ Validate and generate (15 min)

**Outcome:** Can create basic Handlebars archetypes

---

### Intermediate (3-4 hours)
1. ✓ Read [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md) (30 min)
2. ✓ Study [nunjucks-config example](examples/archetypes/nunjucks-config/archetype.json) (30 min)
3. ✓ Learn Nunjucks syntax (30 min)
4. ✓ Create mixed-engine archetype (60 min)
5. ✓ Add lifecycle hooks (30 min)
6. ✓ Test generation workflow (30 min)

**Outcome:** Can use multiple engines and lifecycle hooks

---

### Advanced (5-8 hours)
1. ✓ Read [Complete Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md) (60 min)
2. ✓ Study [multi-engine example](examples/archetypes/multi-engine/archetype.json) (60 min)
3. ✓ Implement all variable types (60 min)
4. ✓ Create custom helpers/filters (60 min)
5. ✓ Write migration scripts (60 min)
6. ✓ Add comprehensive validation (30 min)
7. ✓ Test update workflow (60 min)

**Outcome:** Can build production-grade archetypes with all features

---

## 🔍 Search Index

### By Keyword

**Backward Compatibility**
- [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md#migration-checklist)
- [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md#strategy-1-no-changes-required)
- [Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md#1-json-schema)

**Custom Helpers**
- [Multi-Engine Example](examples/archetypes/multi-engine/archetype.json#engine.config.handlebars.helpers)
- [Examples README](examples/archetypes/README.md#pattern-3-custom-helper-functions)
- [Schema](schemas/archetype.schema.json#handlebarsConfig)

**File Overrides**
- [Multi-Engine Example](examples/archetypes/multi-engine/archetype.json#fileEngineOverrides)
- [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md#strategy-4-mixed-engine-archetype)
- [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md#common-patterns)

**Lifecycle Hooks**
- [Copier Example](examples/archetypes/copier-python/archetype.json#lifecycle.hooks)
- [Schema](schemas/archetype.schema.json#lifecycleHooks)
- [Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md#lifecycle-management)

**Migrations**
- [Copier Example](examples/archetypes/copier-python/archetype.json#lifecycle.migrations)
- [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md#adding-migration-support)
- [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md#migration-checklist)

**Validation**
- [Multi-Engine Example](examples/archetypes/multi-engine/archetype.json#variables)
- [Schema](schemas/archetype.schema.json#variableValidation)
- [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md#variable-types)

---

## 🛠️ Tools & Commands

### Validation
```bash
# Validate archetype.json
ajv validate -s schemas/archetype.schema.json -d archetype.json

# TypeScript type check
npx ts-node scripts/validate-archetype.ts archetype.json
```

### Generation
```bash
# Interactive generation
npm run archetype:generate --archetype=my-archetype --interactive

# Non-interactive with variables file
npm run archetype:generate \
  --archetype=my-archetype \
  --variables=vars.json \
  --output=./output
```

### Testing
```bash
# Test lifecycle hooks
npm run archetype:test-hooks --archetype=my-archetype --hook=postGenerate

# Test all examples
npm run test:archetypes

# Generate from all examples
for dir in examples/archetypes/*/; do
  npm run archetype:generate --archetype=$(basename $dir) --test
done
```

---

## 📞 Support & Resources

### Internal Resources
- [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) - Cheat sheet
- [Complete Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md) - Full guide
- [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md) - Step-by-step
- [Examples](examples/archetypes/README.md) - Working examples

### External Resources
- [JSON Schema Docs](https://json-schema.org/)
- [Handlebars Guide](https://handlebarsjs.com/guide/)
- [Nunjucks Templating](https://mozilla.github.io/nunjucks/templating.html)
- [Eta Documentation](https://eta.js.org/docs/intro)
- [EJS Documentation](https://ejs.co/#docs)
- [Copier Docs](https://copier.readthedocs.io/)
- [Cookiecutter Docs](https://cookiecutter.readthedocs.io/)

### Community
- GitHub Issues: [Report bugs, request features]
- Discussions: [Ask questions, share archetypes]
- Examples Repo: [Community archetype collection]

---

## 📋 Quick Links

### Most Common Tasks

| Task | Resource | Time |
|------|----------|------|
| Learn basics | [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) | 5 min |
| Create simple archetype | [simple-handlebars](examples/archetypes/simple-handlebars/) | 15 min |
| Migrate existing | [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md) | 30 min |
| Use mixed engines | [multi-engine](examples/archetypes/multi-engine/) | 60 min |
| Add lifecycle hooks | [Lifecycle docs](ARCHETYPE_MULTI_ENGINE_SUMMARY.md#lifecycle-management) | 20 min |
| Validate archetype | [Schema](schemas/archetype.schema.json) + `ajv` | 2 min |

---

## 🎯 Recommendations

### Start Here If...

**You're new to archetypes:**
→ [Quick Reference](ARCHETYPE_QUICK_REFERENCE.md) + [simple-handlebars example](examples/archetypes/simple-handlebars/)

**You have existing Handlebars archetypes:**
→ [Migration Guide](docs/ARCHETYPE_MIGRATION_GUIDE.md) (Strategy 1 or 2)

**You need to generate configs (YAML/JSON):**
→ [nunjucks-config example](examples/archetypes/nunjucks-config/)

**You're building Python projects:**
→ [copier-python example](examples/archetypes/copier-python/)

**You want to understand everything:**
→ [Complete Summary](ARCHETYPE_MULTI_ENGINE_SUMMARY.md)

**You're implementing tooling:**
→ [TypeScript types](types/archetype.types.ts) + [JSON Schema](schemas/archetype.schema.json)

---

## 📝 Document Summaries

### Quick Reference (1 page)
- Template syntax cheat sheet
- Common patterns
- Essential commands
- Troubleshooting table

### Complete Summary (30 pages)
- Full schema specification
- TypeScript type system
- All engine details
- Migration strategies
- Best practices
- Troubleshooting guide

### Migration Guide (20 pages)
- 4 migration strategies
- Step-by-step checklists
- Before/after examples
- Common pitfalls
- Testing procedures

### Examples README (15 pages)
- 4 complete examples
- Engine comparison
- Common patterns
- Testing instructions

---

**Last Updated:** 2026-01-20
**Version:** 1.0.0
**Maintainer:** Claude Orchestration Team
