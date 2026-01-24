# Archetype Examples: Multi-Engine Support

This directory contains reference implementations demonstrating the multi-engine archetype schema with various template engines and configurations.

## Quick Reference

| Example | Engine | Use Case | Complexity |
|---------|--------|----------|------------|
| `simple-handlebars/` | Handlebars (implicit) | Basic Node.js service | Minimal |
| `nunjucks-config/` | Nunjucks | YAML/JSON config generation | Simple |
| `copier-python/` | Copier | Python services with updates | Advanced |
| `multi-engine/` | Mixed (Handlebars, Nunjucks, EJS) | Full-featured microservice | Comprehensive |

---

## Example 1: Simple Handlebars (Backward Compatible)

**Location:** `simple-handlebars/archetype.json`

**Key Features:**
- No `engine` configuration (defaults to Handlebars)
- Minimal required fields
- Demonstrates backward compatibility
- Best for quick prototypes

**Use This When:**
- Creating simple templates
- Handlebars is sufficient for your needs
- You want minimal configuration overhead

**Template Syntax:**
```handlebars
{
  "name": "{{serviceName}}",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  }
}
```

---

## Example 2: Nunjucks Configuration Generator

**Location:** `nunjucks-config/archetype.json`

**Key Features:**
- Explicit Nunjucks engine with custom configuration
- Custom filters for YAML/JSON safety
- Lifecycle hooks for validation
- Optimized for whitespace-sensitive formats

**Use This When:**
- Generating YAML, JSON, or other structured configs
- Need precise whitespace control
- Want Python Jinja2-like syntax
- Require custom filters

**Template Syntax:**
```jinja2
{# config/deployment.yaml #}
apiVersion: apps/v1
kind: Deployment
metadata:
  name: {{ clusterName | yaml_safe }}
  namespace: {{ namespace }}
spec:
  replicas: {{ replicas }}
  {% if environment == 'production' %}
  strategy:
    type: RollingUpdate
  {% endif %}
```

**Custom Configuration:**
```json
{
  "engine": {
    "type": "nunjucks",
    "config": {
      "nunjucks": {
        "autoescape": false,
        "throwOnUndefined": true,
        "trimBlocks": true,
        "lstripBlocks": true
      }
    }
  }
}
```

---

## Example 3: Copier Python Service

**Location:** `copier-python/archetype.json`

**Key Features:**
- Copier engine for Python-ecosystem integration
- Advanced update/migration support
- Skip-if-exists for sensitive files
- Post-generation tasks (venv, pip install, tests)

**Use This When:**
- Building Python applications
- Need sophisticated update management
- Want Copier's answer replay feature
- Require migration scripts

**Template Syntax:**
```jinja2
# {{ project_name }}/pyproject.toml
[project]
name = "{{ project_slug }}"
version = "0.1.0"
description = "{{ description }}"
requires-python = ">={{ python_version }}"

{% if use_database %}
dependencies = [
    "sqlalchemy>=2.0.0",
    "alembic>=1.13.0",
]
{% endif %}
```

**Migration Example:**
```json
{
  "lifecycle": {
    "migrations": [
      {
        "version": "2.0.0",
        "script": "./scripts/migrations/upgrade-to-pydantic-v2.py",
        "description": "Breaking: Upgrade from Pydantic v1 to v2"
      }
    ],
    "updateStrategy": "merge"
  }
}
```

**Post-Generation Tasks:**
```json
{
  "engine": {
    "config": {
      "copier": {
        "tasks": [
          "python -m venv venv",
          "pip install -r requirements.txt",
          "pytest tests/ -v"
        ]
      }
    }
  }
}
```

---

## Example 4: Multi-Engine Service (Comprehensive)

**Location:** `multi-engine/archetype.json`

**Key Features:**
- Mixed template engines (Handlebars, Nunjucks, EJS)
- File-level engine overrides
- Complete lifecycle management
- Extensive variable validation
- All supported features demonstrated

**Use This When:**
- Need different engines for different file types
- Building complex, full-featured services
- Want reference for all available options
- Learning the complete schema

**Engine Configuration:**
```json
{
  "engine": {
    "type": "handlebars",
    "config": {
      "handlebars": {
        "strict": true,
        "helpers": ["./helpers/string-helpers.js"]
      }
    }
  },
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": {
      "type": "nunjucks"
    },
    "templates/scripts/**/*.sh": {
      "type": "ejs"
    }
  }
}
```

**Directory Structure:**
```
multi-engine/
├── archetype.json
├── templates/
│   ├── config/
│   │   └── app.yaml          # Nunjucks (custom delimiters)
│   ├── scripts/
│   │   └── deploy.sh         # EJS (flexible delimiters)
│   ├── docs/
│   │   └── README.md         # Handlebars (default)
│   └── src/
│       └── index.ts          # Handlebars
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

**Lifecycle Hooks:**
```json
{
  "lifecycle": {
    "hooks": {
      "preGenerate": [
        "echo 'Starting generation...'",
        "mkdir -p .generated"
      ],
      "postGenerate": [
        "npm install",
        "npm run build",
        "git init",
        "npm test"
      ]
    }
  }
}
```

---

## Engine Comparison

### When to Use Each Engine

#### Handlebars
**Best For:**
- General-purpose templating
- Simple variable substitution
- Logic-light templates
- When team is familiar with Mustache syntax

**Pros:**
- Simple, readable syntax
- Large ecosystem of helpers
- Good documentation
- Battle-tested

**Cons:**
- Limited built-in logic
- Less flexible than Nunjucks/EJS
- Requires custom helpers for complex operations

**Example:**
```handlebars
{{#if isDevelopment}}
  "debug": true,
{{/if}}
```

---

#### Nunjucks
**Best For:**
- YAML/JSON generation
- Configuration files
- When precise whitespace control is critical
- Python developers (similar to Jinja2)

**Pros:**
- Excellent whitespace control
- Rich built-in filters
- Block inheritance
- Powerful logic

**Cons:**
- Slightly more complex syntax
- Less npm ecosystem than Handlebars
- Steeper learning curve

**Example:**
```jinja2
{% if environment == 'production' %}
replicas: {{ replicas }}
{% else %}
replicas: 1
{% endif %}
```

---

#### EJS
**Best For:**
- Shell scripts
- Terraform/HCL files
- When you need custom delimiters
- JavaScript-native templating

**Pros:**
- Plain JavaScript in templates
- Extremely flexible delimiters
- No learning curve for JS developers
- Fast rendering

**Cons:**
- Can become messy with complex logic
- Less structured than Nunjucks
- Security concerns with eval-style syntax

**Example:**
```ejs
#!/bin/bash
<% if (enableDocker) { %>
docker build -t <%= projectName %>:latest .
<% } %>
```

---

#### Eta
**Best For:**
- High-performance templating
- Large-scale generation
- TypeScript projects
- When render speed is critical

**Pros:**
- Fastest template engine
- TypeScript-first
- Plugin system
- Small bundle size

**Cons:**
- Smaller ecosystem
- Less mature than alternatives
- Fewer built-in filters

**Example:**
```eta
<% if (it.useTypeScript) { %>
export const config = {
  name: "<%= it.projectName %>"
};
<% } %>
```

---

#### Copier
**Best For:**
- Python projects
- When you need sophisticated update management
- Answer replay/versioning
- Complex migration scenarios

**Pros:**
- Best-in-class update support
- Migration system
- Answer history
- Skip-if-exists logic

**Cons:**
- Python dependency
- Overkill for simple templates
- Requires Copier CLI

**Example:**
```jinja2
# copier.yml
project_name:
  type: str
  help: "Project name"

_tasks:
  - "pip install -r requirements.txt"
  - "pytest tests/"
```

---

#### Cookiecutter
**Best For:**
- Python projects (legacy)
- Simple project scaffolding
- When team already uses Cookiecutter

**Pros:**
- Mature, stable
- Large template ecosystem
- Simple JSON config

**Cons:**
- No update support
- Less flexible than Copier
- Python dependency

**Example:**
```json
{
  "project_name": "My Project",
  "project_slug": "{{ cookiecutter.project_name.lower().replace(' ', '_') }}"
}
```

---

## Testing Your Archetype

### Validation

```bash
# Validate against JSON Schema
npm install -g ajv-cli
ajv validate \
  -s schemas/archetype.schema.json \
  -d examples/archetypes/multi-engine/archetype.json

# TypeScript type checking
npx ts-node scripts/validate-archetype.ts examples/archetypes/multi-engine/archetype.json
```

### Generation Testing

```bash
# Test generation with sample variables
npm run archetype:generate \
  --archetype=multi-engine \
  --variables=test-variables.json \
  --output=.test-output

# Verify generated files
ls -la .test-output/
```

### Hook Testing

```bash
# Test lifecycle hooks in isolation
npm run archetype:test-hooks \
  --archetype=multi-engine \
  --hook=postGenerate
```

---

## Creating Your Own Archetype

### Step-by-Step Process

1. **Choose an Example as Starting Point**
   ```bash
   cp -r examples/archetypes/simple-handlebars my-archetype
   cd my-archetype
   ```

2. **Update archetype.json**
   ```json
   {
     "name": "my-custom-archetype",
     "version": "1.0.0",
     "description": "My custom archetype",
     "category": "service",
     "files": ["templates/**/*"]
   }
   ```

3. **Choose and Configure Engine**
   ```json
   {
     "engine": {
       "type": "nunjucks",
       "config": {
         "nunjucks": {
           "autoescape": false
         }
       }
     }
   }
   ```

4. **Create Templates**
   ```
   mkdir -p templates/src
   # Add your template files
   ```

5. **Define Variables**
   ```json
   {
     "variables": [
       {
         "name": "projectName",
         "type": "string",
         "required": true,
         "validation": {
           "pattern": "^[a-z0-9-]+$"
         }
       }
     ]
   }
   ```

6. **Validate**
   ```bash
   ajv validate -s schemas/archetype.schema.json -d archetype.json
   ```

7. **Test Generation**
   ```bash
   npm run archetype:generate --archetype=my-custom-archetype
   ```

---

## Common Patterns

### Pattern 1: Environment-Specific Configuration

```json
{
  "variables": [
    {
      "name": "environment",
      "type": "enum",
      "validation": {
        "choices": ["dev", "staging", "prod"]
      }
    }
  ],
  "fileEngineOverrides": {
    "templates/config/{{environment}}/**/*.yaml": {
      "type": "nunjucks"
    }
  }
}
```

### Pattern 2: Conditional File Inclusion

```json
{
  "variables": [
    {
      "name": "enableDocker",
      "type": "boolean",
      "default": true
    }
  ],
  "files": [
    "templates/**/*",
    "{{#if enableDocker}}docker/**/*{{/if}}"
  ]
}
```

### Pattern 3: Custom Helper Functions

**helpers/string-helpers.js:**
```javascript
module.exports = {
  uppercase: (str) => str.toUpperCase(),
  slugify: (str) => str.toLowerCase().replace(/\s+/g, '-'),
  pascalCase: (str) => str.replace(/(\w)(\w*)/g, (_, first, rest) =>
    first.toUpperCase() + rest.toLowerCase()
  )
};
```

**archetype.json:**
```json
{
  "engine": {
    "config": {
      "handlebars": {
        "helpers": ["./helpers/string-helpers.js"]
      }
    }
  }
}
```

**Template usage:**
```handlebars
export class {{pascalCase serviceName}}Service {
  // ...
}
```

---

## Troubleshooting

### Issue: Wrong Engine Applied

**Symptom:** Variables render as raw text

**Fix:** Check `fileEngineOverrides` pattern matches file path:
```json
{
  "fileEngineOverrides": {
    "templates/config/**/*.yaml": {  // Must match exactly
      "type": "nunjucks"
    }
  }
}
```

### Issue: Custom Helpers Not Found

**Symptom:** `Helper 'myHelper' not found`

**Fix:** Ensure path is relative to archetype root:
```json
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

### Issue: Lifecycle Hook Fails

**Symptom:** Hook exits with error

**Fix:** Test hook in isolation and add error handling:
```bash
#!/bin/bash
set -e  # Exit on error

if ! command -v npm &> /dev/null; then
  echo "npm not found. Skipping npm install."
  exit 0
fi

npm install
```

---

## Resources

- **JSON Schema:** `../../schemas/archetype.schema.json`
- **TypeScript Types:** `../../types/archetype.types.ts`
- **Migration Guide:** `../../docs/ARCHETYPE_MIGRATION_GUIDE.md`
- **Template Engine Docs:**
  - [Handlebars](https://handlebarsjs.com/)
  - [Nunjucks](https://mozilla.github.io/nunjucks/)
  - [Eta](https://eta.js.org/)
  - [EJS](https://ejs.co/)
  - [Copier](https://copier.readthedocs.io/)
  - [Cookiecutter](https://cookiecutter.readthedocs.io/)

---

## Contributing

When adding new examples:

1. Create a new directory under `examples/archetypes/{name}/`
2. Include complete `archetype.json`
3. Add sample templates in `templates/`
4. Document in this README under "Example {N}"
5. Validate against schema
6. Test generation workflow

**Example PR structure:**
```
examples/archetypes/my-new-example/
├── archetype.json
├── templates/
│   └── (template files)
├── helpers/ (if needed)
├── filters/ (if needed)
└── README.md (optional, for complex examples)
```
