# Multi-Engine Template System

A unified template processing system for the Claude Code Templating Plugin, supporting multiple template engines with a consistent interface.

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│          Template Engine Factory                        │
│  - Engine registration                                   │
│  - Lazy loading                                          │
│  - Auto-detection                                        │
│  - Configuration management                              │
└────────────┬────────────────────────────────────────────┘
             │
             ├── Handlebars Engine Adapter
             │   └── BaseTemplateEngineAdapter
             │
             ├── Nunjucks Engine Adapter
             │   └── BaseTemplateEngineAdapter
             │
             ├── Eta Engine Adapter
             │   └── BaseTemplateEngineAdapter
             │
             ├── EJS Engine Adapter
             │   └── BaseTemplateEngineAdapter
             │
             └── Python Bridge Adapter
                 └── BaseTemplateEngineAdapter
```

## Supported Engines

| Engine | Status | Extensions | Use Case |
|--------|--------|------------|----------|
| **Handlebars** | ✅ Existing | `.hbs`, `.handlebars` | Claude Code archetypes, simple templates |
| **Nunjucks** | 🔄 To Implement | `.njk`, `.j2`, `.jinja2` | Copier/Cookiecutter compatibility |
| **Eta** | 🔄 To Implement | `.eta` | High-performance templating |
| **EJS** | 🔄 To Implement | `.ejs` | JavaScript-embedded templates |
| **Python Bridge** | 🔄 To Implement | N/A | Copier/Cookiecutter native support |

## Files

### Core Files

- **`types.ts`** - Complete TypeScript type definitions for all engines
- **`base-adapter.ts`** - Abstract base class with common functionality
- **`factory.ts`** - Central factory for engine management
- **`index.ts`** - Public API exports

### Adapter Files (To Be Implemented)

- **`adapters/handlebars-adapter.ts`** - Handlebars engine implementation
- **`adapters/nunjucks-adapter.ts`** - Nunjucks engine implementation
- **`adapters/eta-adapter.ts`** - Eta engine implementation
- **`adapters/ejs-adapter.ts`** - EJS engine implementation
- **`adapters/python-adapter.ts`** - Python bridge implementation

## Usage Examples

### Basic Usage

```typescript
import { createTemplateEngineFactory } from './engines';

// Create factory
const factory = createTemplateEngineFactory({
  defaultEngine: 'handlebars',
  lazyLoad: true,
  cacheInstances: true
});

// Get engine by type
const handlebars = await factory.getEngine('handlebars');
const result = handlebars.processString('Hello {{name}}!', {
  variables: { name: 'World' },
  computed: {},
  env: { cwd: process.cwd(), user: 'user', timestamp: new Date().toISOString(), date: '2024-01-01', platform: 'linux' }
});

// Get engine by extension
const engine = await factory.getEngineByExtension('.hbs');
const output = await engine.processFile('template.hbs', context);
```

### Auto-Detection

```typescript
// Detect engine from template content
const detection = factory.detectEngine(templateContent, 'file.njk');
console.log(detection);
// {
//   engine: 'nunjucks',
//   confidence: 0.95,
//   reason: "File extension '.njk' maps to nunjucks"
// }

// Get engine based on detection
const engine = await factory.getEngine(detection.engine);
```

### Custom Configuration

```typescript
const factory = createTemplateEngineFactory({
  defaultEngine: 'nunjucks',
  engines: {
    nunjucks: {
      autoEscape: true,
      strict: true,
      engineOptions: {
        trimBlocks: true,
        lstripBlocks: true
      }
    },
    handlebars: {
      engineOptions: {
        noEscape: false
      }
    }
  }
});
```

### Custom Extension Mapping

```typescript
// Add custom extension
factory.addExtensionMapping('.tmpl', 'handlebars');
factory.addExtensionMapping('.tpl', 'nunjucks');

// Remove mapping
factory.removeExtensionMapping('.tmpl');

// Get all mappings
const mappings = factory.getExtensionMappings();
```

### Using Base Adapter

```typescript
import { BaseTemplateEngineAdapter } from './engines';

class CustomEngineAdapter extends BaseTemplateEngineAdapter {
  processString(template: string, context: TemplateContext): string {
    // Implement engine-specific processing
    const ctx = this.buildContext(context);
    const result = this.customEngine.render(template, ctx);
    return this.normalizeOutput(result);
  }

  registerPartial(name: string, template: string): void {
    this.partials.set(name, template);
    this.customEngine.registerPartial(name, template);
  }

  registerHelper(name: string, fn: HelperFunction): void {
    this.helpers.set(name, fn);
    this.customEngine.registerHelper(name, fn);
  }

  validateTemplate(template: string): ValidationResult {
    try {
      this.customEngine.parse(template);
      return { valid: true };
    } catch (error) {
      return {
        valid: false,
        error: error.message
      };
    }
  }

  extractVariables(template: string): string[] {
    // Extract variables using regex or AST
    return [];
  }

  getEngineInfo(): EngineInfo {
    return {
      type: 'custom',
      name: 'Custom Engine',
      version: '1.0.0',
      extensions: ['.custom'],
      capabilities: {
        partials: true,
        helpers: true,
        inheritance: false,
        async: false,
        streaming: false,
        autoEscape: true,
        filters: false,
        macros: false,
        includes: true,
        layouts: false
      },
      description: 'Custom template engine',
      available: true
    };
  }
}
```

## Interface: ITemplateEngine

All template engines must implement this interface:

```typescript
interface ITemplateEngine {
  // Core processing methods
  processString(template: string, context: TemplateContext): string;
  processFile(path: string, context: TemplateContext): Promise<string>;
  processFilename(filename: string, context: TemplateContext): string;

  // Template management
  registerPartial(name: string, template: string): void;
  registerHelper(name: string, fn: HelperFunction): void;

  // Validation and analysis
  validateTemplate(template: string): ValidationResult;
  extractVariables(template: string): string[];

  // Metadata
  getEngineInfo(): EngineInfo;
}
```

## Standard Helpers

All engine adapters inherit these standard helpers from `BaseTemplateEngineAdapter`:

### String Manipulation
- `uppercase`, `lowercase`, `capitalize`, `trim`
- `pascalCase`, `camelCase`, `snakeCase`, `kebabCase`, `dotCase`

### Date/Time
- `year`, `date`, `timestamp`

### Utilities
- `default` - Provide fallback values
- `replace` - String replacement
- `uuid` - Generate UUIDs
- `license` - Generate license headers

## Engine-Specific Features

### Handlebars
- Harness pipeline expressions (`harnessInput`, `harnessVar`, etc.)
- Block helpers (`if`, `each`, `with`, `unless`)
- Nested partials
- Custom decorators

### Nunjucks (Jinja2-compatible)
- Template inheritance (`extends`, `block`)
- Includes with context
- Macros
- Filters
- Tests
- Compatible with Copier/Cookiecutter templates

### Eta
- High-performance compilation
- Async template rendering
- File includes
- Layouts
- Configurable delimiters

### EJS
- JavaScript expressions
- Include files
- Custom delimiters
- Client-side compilation support

### Python Bridge
- Native Copier execution
- Native Cookiecutter execution
- Python template functions
- Jinja2 extensions
- Post-generation tasks

## Configuration Options

### Common Options (All Engines)

```typescript
interface EngineConfig {
  autoEscape?: boolean;        // Enable HTML auto-escaping
  strict?: boolean;             // Throw on undefined variables
  cache?: boolean;              // Cache compiled templates
  basePath?: string;            // Base path for includes
  extensions?: string[];        // Custom file extensions
  engineOptions?: Record<string, any>;  // Engine-specific options
}
```

### Delimiters

Customize template delimiters:

```typescript
{
  delimiters: {
    start: '<%',
    end: '%>'
  }
}
```

## Performance

### Lazy Loading

Engines are loaded only when first requested:

```typescript
const factory = createTemplateEngineFactory({ lazyLoad: true });
// Handlebars not loaded yet

const engine = await factory.getEngine('handlebars');
// Now Handlebars is loaded
```

### Instance Caching

Engine instances are cached by default:

```typescript
const factory = createTemplateEngineFactory({ cacheInstances: true });

const engine1 = await factory.getEngine('handlebars');
const engine2 = await factory.getEngine('handlebars');
// engine1 === engine2 (same instance)
```

### Preloading

Preload all engines to avoid lazy-loading delays:

```typescript
await factory.preloadAll();
```

## Error Handling

All engines provide consistent error handling:

```typescript
try {
  const result = engine.processString(template, context);
} catch (error) {
  if (error.message === 'SKIP_FILE') {
    // File should be skipped
  } else {
    // Template processing error
    console.error('Processing failed:', error.message);
  }
}
```

## Testing

Each engine adapter should have comprehensive tests covering:

- ✅ Template processing (string, file, filename)
- ✅ Variable extraction
- ✅ Template validation
- ✅ Helper registration
- ✅ Partial registration
- ✅ Error handling
- ✅ Context building
- ✅ Statistics tracking

## Migration Path

### From Current System

The current `TemplateEngine` class can be migrated to `HandlebarsEngineAdapter`:

1. Create `adapters/handlebars-adapter.ts` extending `BaseTemplateEngineAdapter`
2. Move Handlebars-specific code from `core/template-engine.ts`
3. Update imports to use factory pattern
4. Add other engine adapters as needed

### Backward Compatibility

For backward compatibility, export a default Handlebars instance:

```typescript
export const templateEngine = await getDefaultFactory().getEngine('handlebars');
```

## Next Steps

1. **Implement Handlebars Adapter** - Migrate existing `TemplateEngine` class
2. **Implement Nunjucks Adapter** - For Copier/Cookiecutter compatibility
3. **Implement Eta Adapter** - High-performance option
4. **Implement EJS Adapter** - JavaScript-native templating
5. **Implement Python Bridge** - Native Copier/Cookiecutter support
6. **Integration Tests** - Test all engines with real templates
7. **Performance Benchmarks** - Compare engine performance
8. **Documentation** - Update plugin docs with multi-engine usage

## References

- [Handlebars Documentation](https://handlebarsjs.com/)
- [Nunjucks Documentation](https://mozilla.github.io/nunjucks/)
- [Eta Documentation](https://eta.js.org/)
- [EJS Documentation](https://ejs.co/)
- [Copier Documentation](https://copier.readthedocs.io/)
- [Cookiecutter Documentation](https://cookiecutter.readthedocs.io/)
