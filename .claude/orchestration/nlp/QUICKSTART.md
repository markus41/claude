# Natural Language Orchestration - Quick Start Guide

## 5-Minute Setup

### Step 1: Install Dependencies

```bash
cd C:\Users\MarkusAhling\pro\alpha-0.1\claude\.claude\orchestration\nlp
npm install
```

### Step 2: Run Example

```bash
npm run example
```

This will execute `example.ts` showing 10 different usage scenarios.

### Step 3: Run Tests

```bash
npm test
```

This validates all components are working correctly.

## Basic Usage

### Minimal Example

```typescript
import { NaturalLanguageOrchestrator } from './orchestration/nlp/index.js';

// Create orchestrator
const nlp = new NaturalLanguageOrchestrator();

// Process command
const result = await nlp.process('Deploy to production');

// Check results
console.log('Intent:', result.intents[0].name);
console.log('Workflow:', result.workflow?.name);
console.log('Response:', result.response.text);

// Clean up
nlp.close();
```

### With Session Tracking

```typescript
const nlp = new NaturalLanguageOrchestrator({
  dbPath: './data/nlp.db'
});

// Create session
const sessionId = nlp.createSession('user-123');

// Multi-turn conversation
await nlp.process('I want to deploy', sessionId);
await nlp.process('To staging', sessionId);
await nlp.process('Check the status', sessionId);

// End session
nlp.endSession(sessionId);
nlp.close();
```

## Common Commands

The system recognizes these commands out of the box:

### Deployment
```
"Deploy to production"
"Deploy api-service to staging"
"Rollback the deployment"
```

### Build & Test
```
"Build the project"
"Run unit tests"
"Run integration tests"
```

### Status & Info
```
"Check the status"
"List all services"
"Show deployment status"
```

### Resource Management
```
"Create a new service"
"Update the configuration"
"Delete the resource"
```

## Configuration

### Simple Config

```typescript
const nlp = new NaturalLanguageOrchestrator({
  dbPath: './data/nlp.db',  // Persistent storage
});
```

### Advanced Config

```typescript
const nlp = new NaturalLanguageOrchestrator({
  dbPath: './data/nlp.db',

  // Confidence thresholds
  thresholds: {
    intent: 60,      // Only accept intents with 60%+ confidence
    entity: 50,      // Only accept entities with 50%+ confidence
    workflow: 65,    // Only accept workflows with 65%+ confidence
  },

  // Multi-intent detection
  multiIntent: {
    enabled: false,  // Disable for simpler processing
    maxIntents: 3,
  },

  // Context window
  contextWindow: {
    turns: 10,       // Remember last 10 turns
    entities: 20,    // Keep 20 entities in context
  },

  // Response settings
  response: {
    verbose: true,              // Detailed responses
    includeConfidence: true,    // Show confidence scores
    includeSuggestions: true,   // Include suggestions
  },
});
```

## Adding Custom Patterns

### Custom Intent

```typescript
import { IntentRecognizer } from './orchestration/nlp/index.js';

const recognizer = new IntentRecognizer('./data/nlp.db');

recognizer.addPattern({
  intent: 'restart_service',
  category: 'command',
  pattern: /restart|reboot/i,
  requiredKeywords: ['restart'],
  optionalKeywords: ['service', 'pod'],
  negativeKeywords: ['cancel'],
  baseConfidence: 75,
  priority: 8,
  examples: ['Restart the service', 'Reboot api-service'],
});
```

### Custom Entity

```typescript
import { EntityExtractor } from './orchestration/nlp/index.js';

const extractor = new EntityExtractor('./data/nlp.db');

extractor.addDefinition({
  type: 'region',
  patterns: [/us-west|us-east|eu-central/i],
  knownValues: ['us-west-1', 'us-east-1', 'eu-central-1'],
});
```

### Custom Workflow

```typescript
import { WorkflowGenerator } from './orchestration/nlp/index.js';

const generator = new WorkflowGenerator('./data/nlp.db');

generator.addMapping({
  intent: 'restart_service',
  workflow: 'restart-workflow',
  requiredEntities: ['service'],
  optionalEntities: ['environment'],
  parameterMapping: {
    service: 'serviceName',
    environment: 'env',
  },
  confirmationRequired: true,
});
```

## Getting Statistics

```typescript
const stats = nlp.getStats();

console.log('Sessions:', stats.totalSessions);
console.log('Turns:', stats.totalTurns);
console.log('Intents:', stats.intentDistribution);
console.log('Avg Confidence:', stats.avgConfidence);
console.log('Success Rates:', stats.successRates);
console.log('Performance:', stats.performance);
```

## Troubleshooting

### Issue: Intent not recognized

**Solution:** Check confidence threshold
```typescript
const nlp = new NaturalLanguageOrchestrator({
  thresholds: {
    intent: 40,  // Lower threshold
  },
});
```

### Issue: Entities not extracted

**Solution:** Add more patterns
```typescript
extractor.addDefinition({
  type: 'your_entity',
  patterns: [/your-pattern/i],
});
```

### Issue: Database errors

**Solution:** Check database path and permissions
```typescript
const nlp = new NaturalLanguageOrchestrator({
  dbPath: './data/nlp.db',  // Ensure directory exists
});
```

### Issue: Context not working

**Solution:** Use same sessionId
```typescript
const sessionId = nlp.createSession();
await nlp.process('first command', sessionId);
await nlp.process('second command', sessionId);  // Same ID
```

## Next Steps

1. **Read Documentation:** See `README.md` for full documentation
2. **Review Examples:** Check `example.ts` for usage patterns
3. **Run Tests:** Execute `npm test` to understand features
4. **Customize:** Add your own patterns, entities, and workflows
5. **Integrate:** Connect with your orchestration system

## File Structure

```
nlp/
├── index.ts                 # Main entry point
├── types.ts                 # TypeScript types
├── intent-recognizer.ts     # Intent matching
├── entity-extractor.ts      # Entity extraction
├── workflow-generator.ts    # Workflow creation
├── context-resolver.ts      # Reference resolution
├── conversation.ts          # Session management
├── response-generator.ts    # Response generation
├── example.ts               # Usage examples
├── README.md                # Full documentation
├── QUICKSTART.md            # This file
├── IMPLEMENTATION.md        # Implementation details
├── package.json             # Dependencies
├── tsconfig.json            # TypeScript config
└── __tests__/
    └── nlp.test.ts          # Test suite
```

## Support

For detailed information, see:
- `README.md` - Full documentation
- `IMPLEMENTATION.md` - Technical details
- `example.ts` - Working examples
- `__tests__/nlp.test.ts` - Test cases

## License

Part of the Claude Orchestration system.
