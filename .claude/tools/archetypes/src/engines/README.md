# Template Engines - Multi-Engine Support

Provides abstraction layer enabling both Node.js-native template engines and external engines via subprocess bridge, establishing scalable architecture for template processing across diverse technology stacks.

## Supported Engines

### 1. Handlebars (Default)
- **Syntax**: `{{ }}` for variables, `{{# }}` for blocks
- **Use Case**: Simple, fast templating with custom helpers
- **Runtime**: Node.js native
- **Extension**: `.hbs`

### 2. Nunjucks
- **Syntax**: `{{ }}` and `{% %}` (Jinja2-compatible)
- **Use Case**: Advanced templating with template inheritance
- **Runtime**: Node.js native
- **Extension**: `.njk`

### 3. Copier Bridge (External)
- **Syntax**: `{{ }}` and `{% %}` (Jinja2)
- **Use Case**: Project lifecycle management with template updates
- **Runtime**: Python 3.8+ with Copier installed
- **Extension**: `.jinja`, `.j2`
- **Special Feature**: Supports `copier update` for template versioning

## Architecture

### ITemplateEngine Interface

All engines implement a common interface for consistent usage:

```typescript
interface ITemplateEngine {
  processString(template: string, context: TemplateContext): Promise<string> | string;
  processFile(path: string, context: TemplateContext): Promise<string>;
  processFilename(filename: string, context: TemplateContext): string;
  validateTemplate(template: string): { valid: boolean; error?: string };
  extractVariables(template: string): string[];
  registerPartial(name: string, template: string): void;
  loadPartial(name: string, path: string): Promise<void>;
  getExtension(): string;
  getName(): string;
}
```

### Bridge Protocol

External engines communicate via JSON-based subprocess bridge:

1. **Request**: Write JSON to temp file with operation details
2. **Execute**: Spawn subprocess with request/response file paths
3. **Response**: Read JSON result from temp file
4. **Cleanup**: Remove temporary files

#### Bridge Request Types

```typescript
enum BridgeRequestType {
  RENDER = 'render',              // Template rendering
  UPDATE = 'update',              // Project update (Copier)
  VALIDATE = 'validate',          // Syntax validation
  EXTRACT_VARS = 'extract_vars',  // Variable extraction
  CHECK_VERSION = 'check_version' // Availability check
}
```

## Usage

### Basic Template Processing

```typescript
import { createTemplateEngine } from './engines';

// Use Handlebars (default)
const handlebars = createTemplateEngine('handlebars');
const context = handlebars.createContext({ name: 'World' });
const result = await handlebars.processString('Hello {{ name }}!', context);
// Output: "Hello World!\n"

// Use Nunjucks
const nunjucks = createTemplateEngine('nunjucks');
const result2 = await nunjucks.processString('{% if name %}Hi {{ name }}{% endif %}', context);

// Use Copier (if Python/Copier available)
const copier = createTemplateEngine('copier');
const result3 = await copier.processString('{{ name|upper }}', context);
```

### Engine Registry

```typescript
import { getRegistry } from './engines';

const registry = getRegistry();

// List available engines
const engines = registry.list();
console.log(engines); // ['handlebars', 'nunjucks', 'copier']

// Get engine by name
const engine = registry.get('handlebars');

// Get engine by file extension
const engineForHbs = registry.getByExtension('.hbs');
```

### Automatic Syntax Detection

```typescript
import { createSyntaxDetector, detectEngine } from './engines';

const detector = createSyntaxDetector();

// Detect from content
const template = '{% if condition %}{{ value }}{% endif %}';
const result = detector.detect(template);
console.log(result.engine);      // 'jinja2'
console.log(result.confidence);  // 0.95

// Quick helper
const engine = detectEngine(template);
console.log(engine); // 'jinja2'

// Detect from filename
const engine2 = detectEngine('', 'template.hbs');
console.log(engine2); // 'handlebars'
```

## Copier Bridge Setup

### Requirements

1. **Python 3.8+** installed and available in PATH
2. **Copier** package installed: `pip install copier`
3. **Jinja2** (installed automatically with Copier)

### Configuration

```typescript
import { CopierBridgeAdapter } from './engines';
import { join } from 'path';

const adapter = new CopierBridgeAdapter({
  pythonPath: 'python3',  // or 'python' on Windows
  runnerScript: join(__dirname, 'copier-runner.py'),
  timeout: 60000,         // 60 seconds
  tempDir: '/tmp',
  verbose: true,          // Enable debug logging
  maxRetries: 3
});

// Check availability
const available = await adapter.checkAvailability();
if (available) {
  console.log('Copier is ready!');
  console.log(adapter.getMetadata());
}
```

### Project Updates (Copier Feature)

```typescript
// Update existing project with new template version
const result = await adapter.updateProject(
  '/path/to/template',
  '/path/to/project',
  {
    answersFile: '.copier-answers.yml',
    skipAnsweredQuestions: true,
    force: false
  }
);

console.log('Files created:', result.filesCreated);
console.log('Files updated:', result.filesUpdated);
console.log('Answers saved to:', result.answersFile);
```

## Error Handling

### Bridge Errors

```typescript
import { BridgeError, BridgeErrorType } from './engines';

try {
  const result = await copierEngine.processString(template, context);
} catch (error) {
  if (error instanceof BridgeError) {
    switch (error.type) {
      case BridgeErrorType.PYTHON_NOT_FOUND:
        console.error('Python not installed or not in PATH');
        break;
      case BridgeErrorType.COPIER_NOT_INSTALLED:
        console.error('Install Copier: pip install copier');
        break;
      case BridgeErrorType.TIMEOUT:
        console.error('Template processing timed out');
        break;
      case BridgeErrorType.SUBPROCESS_ERROR:
        console.error('Template syntax error:', error.message);
        console.error('Details:', error.details);
        break;
    }
  }
}
```

### Graceful Degradation

The engine registry automatically handles unavailable engines:

```typescript
const registry = getRegistry();

// Copier registered only if available
if (registry.has('copier')) {
  console.log('Copier available for use');
} else {
  console.log('Falling back to Handlebars/Nunjucks');
}
```

## Performance Considerations

### Engine Selection

| Engine | Startup | Processing | Updates | Use When |
|--------|---------|------------|---------|----------|
| Handlebars | Instant | Fast | No | Simple templates, high throughput |
| Nunjucks | Instant | Fast | No | Template inheritance needed |
| Copier | ~100ms | Moderate | Yes | Template versioning required |

### Optimization Tips

1. **Cache availability checks**: Result is cached after first check
2. **Batch operations**: Minimize subprocess spawns for Copier
3. **Use filename regex**: Avoid async calls for simple filename substitution
4. **Prefer sync validation**: Use `validateTemplate()` for quick checks

## Testing

### Unit Tests

```bash
npm test -- copier-bridge.test.ts
```

### Integration Tests (Requires Python/Copier)

```bash
# Install dependencies
pip install copier jinja2

# Run integration tests
npm test -- --testPathPattern=copier-bridge
```

### Mock Tests (No Python Required)

```typescript
// Tests automatically skip when Python unavailable
it('should process template', async () => {
  const available = await adapter.checkAvailability();
  if (!available) {
    console.log('Skipping: Python/Copier not available');
    return;
  }

  // Test code here
});
```

## Security Considerations

### Subprocess Bridge

1. **Input Validation**: All requests validated with Zod schemas
2. **Timeout Protection**: Prevents runaway subprocess execution
3. **Temp File Cleanup**: Automatic cleanup even on errors
4. **No Code Injection**: JSON-based communication, no eval()
5. **Sandboxed Execution**: Python runs in subprocess, isolated from Node.js

### Template Security

- **No arbitrary code execution** in templates
- **Jinja2 sandboxing** prevents filesystem access
- **Variable escaping** by default in all engines
- **Partial validation** prevents path traversal

## Troubleshooting

### Copier Bridge Not Available

**Symptom**: `registry.has('copier')` returns `false`

**Solutions**:
1. Verify Python installation: `python --version` or `python3 --version`
2. Install Copier: `pip install copier`
3. Check PATH includes Python executable
4. On Windows, use `pythonPath: 'python'` not `'python3'`
5. Enable verbose mode for detailed error logs

### Template Syntax Errors

**Symptom**: `BridgeError` with `SUBPROCESS_ERROR`

**Solutions**:
1. Validate syntax: `adapter.validateTemplate(template)`
2. Check variable names match context
3. Verify Jinja2 syntax ({% %} for statements, {{ }} for variables)
4. Use `extractVariables()` to see required variables

### Timeout Errors

**Symptom**: `BridgeError` with `TIMEOUT`

**Solutions**:
1. Increase timeout: `timeout: 120000` (2 minutes)
2. Simplify template complexity
3. Check for infinite loops in template logic
4. Verify Python/Copier not hanging

## File Structure

```
engines/
├── ITemplateEngine.ts           # Core interface definition
├── types.ts                     # Additional type definitions
├── bridge-protocol.ts           # JSON bridge types and schemas
├── handlebars-adapter.ts        # Handlebars implementation
├── nunjucks-adapter.ts          # Nunjucks implementation
├── copier-bridge.ts             # Copier bridge adapter
├── copier-runner.py             # Python subprocess handler
├── syntax-detector.ts           # Automatic syntax detection
├── index.ts                     # Public exports and registry
├── __tests__/
│   └── copier-bridge.test.ts   # Bridge adapter tests
└── README.md                    # This file
```

## Contributing

When adding new template engines:

1. Implement `ITemplateEngine` interface
2. Add engine to registry in `index.ts`
3. Create comprehensive tests
4. Document syntax and use cases
5. Handle availability detection
6. Provide error recovery strategies

## License

Part of the Claude Code Archetype System
