# Natural Language Orchestration System

Convert natural language commands into executable workflows using pattern-based NLP.

## Overview

The Natural Language Orchestration system provides a comprehensive solution for:

- **Intent Recognition**: Pattern-based matching with keyword scoring
- **Entity Extraction**: Named entity recognition for files, services, environments, etc.
- **Workflow Generation**: Converting intents and entities into executable workflows
- **Context Resolution**: Tracking conversation state and resolving references
- **Response Generation**: Natural language responses with clarification support

## Features

- Zero external NLP dependencies (pattern-based)
- SQLite persistence for sessions and statistics
- Multi-turn conversation support
- Slot filling for missing parameters
- Context-aware entity resolution
- Extensible pattern registry
- Comprehensive statistics tracking

## Installation

```bash
cd .claude/orchestration/nlp
npm install
```

## Quick Start

```typescript
import { NaturalLanguageOrchestrator } from './nlp/index.js';

// Initialize
const nlp = new NaturalLanguageOrchestrator({
  dbPath: './data/nlp.db',
  thresholds: {
    intent: 60,
    entity: 50,
    workflow: 65,
  },
});

// Process natural language input
const result = await nlp.process('Deploy to production');

console.log('Intent:', result.intents[0].name);
console.log('Entities:', result.entities);
console.log('Workflow:', result.workflow);
console.log('Response:', result.response.text);

// Clean up
nlp.close();
```

## Usage Examples

### Basic Commands

```typescript
// Deployment
await nlp.process('Deploy to production');
await nlp.process('Deploy api-service to staging');
await nlp.process('Rollback the deployment');

// Build and Test
await nlp.process('Build the project');
await nlp.process('Run unit tests');
await nlp.process('Run integration tests');

// Status Queries
await nlp.process('Check the status');
await nlp.process('List all services');
await nlp.process('Show deployment status');

// Resource Management
await nlp.process('Create a new service');
await nlp.process('Update the configuration');
await nlp.process('Delete the resource');
```

### Multi-Turn Conversations

```typescript
const sessionId = nlp.createSession();

// First turn
const r1 = await nlp.process('I want to deploy', sessionId);
// Response: "I need to know the environment to continue."

// Second turn - provide missing information
const r2 = await nlp.process('To production', sessionId);
// Response: Confirmation with deployment workflow

// Third turn - reference previous context
const r3 = await nlp.process('Check its status', sessionId);
// "its" resolves to the deployed service from context
```

### Context Resolution

```typescript
const sessionId = nlp.createSession();

// Establish context
await nlp.process('I want to work on the api-service', sessionId);

// Use pronouns - they resolve to context
await nlp.process('Deploy it to staging', sessionId);
// "it" -> "api-service"

await nlp.process('Check its status', sessionId);
// "its" -> "api-service"

await nlp.process('Run the tests', sessionId);
// "the tests" -> tests for "api-service"
```

### Custom Patterns

```typescript
import { IntentRecognizer } from './nlp/index.js';

const recognizer = new IntentRecognizer('./data/nlp.db');

// Add custom intent pattern
recognizer.addPattern({
  intent: 'restart_service',
  category: 'command',
  pattern: /restart|reboot|bounce/i,
  requiredKeywords: ['restart'],
  optionalKeywords: ['service', 'pod', 'container'],
  negativeKeywords: ['cancel', 'stop'],
  baseConfidence: 75,
  priority: 9,
  examples: ['Restart the service', 'Reboot api-service'],
});
```

### Custom Entities

```typescript
import { EntityExtractor } from './nlp/index.js';

const extractor = new EntityExtractor('./data/nlp.db');

// Add custom entity definition
extractor.addDefinition({
  type: 'custom_resource',
  patterns: [/resource-[\w-]+/i],
  knownValues: ['resource-alpha', 'resource-beta'],
});
```

### Custom Workflows

```typescript
import { WorkflowGenerator } from './nlp/index.js';

const generator = new WorkflowGenerator('./data/nlp.db');

// Add workflow mapping
generator.addMapping({
  intent: 'restart_service',
  workflow: 'restart-workflow',
  requiredEntities: ['service'],
  optionalEntities: ['environment'],
  parameterMapping: {
    service: 'serviceName',
    environment: 'environment',
  },
  confirmationRequired: true,
});
```

## Architecture

### Components

1. **Intent Recognizer** (`intent-recognizer.ts`)
   - Pattern-based intent matching
   - Keyword extraction and scoring
   - Multi-intent detection support

2. **Entity Extractor** (`entity-extractor.ts`)
   - Named entity recognition
   - Pattern-based extraction
   - Entity normalization and validation

3. **Workflow Generator** (`workflow-generator.ts`)
   - Intent-to-workflow mapping
   - Parameter extraction from entities
   - Action generation for workflows

4. **Context Resolver** (`context-resolver.ts`)
   - Conversation context tracking
   - Pronoun and reference resolution
   - Context inheritance across turns

5. **Conversation Manager** (`conversation.ts`)
   - Session state management
   - Turn tracking and history
   - Slot filling for multi-turn dialogs

6. **Response Generator** (`response-generator.ts`)
   - Natural language response generation
   - Confirmation and clarification messages
   - Template-based responses

### Data Flow

```
User Input
    ↓
Context Resolution (resolve references)
    ↓
Intent Recognition (identify action)
    ↓
Entity Extraction (extract parameters)
    ↓
Workflow Generation (create executable plan)
    ↓
Response Generation (communicate with user)
    ↓
Conversation Update (save turn, update context)
```

## Configuration

### NLPConfig

```typescript
interface NLPConfig {
  // Database path
  dbPath: string;

  // Confidence thresholds
  thresholds: {
    intent: number;      // Minimum intent confidence (0-100)
    entity: number;      // Minimum entity confidence (0-100)
    workflow: number;    // Minimum workflow confidence (0-100)
  };

  // Multi-intent handling
  multiIntent: {
    enabled: boolean;
    maxIntents: number;
  };

  // Context window
  contextWindow: {
    turns: number;       // Number of previous turns to consider
    entities: number;    // Number of entities to keep in context
  };

  // Slot filling
  slotFilling: {
    maxAttempts: number;
    timeout: number;     // Session timeout (ms)
  };

  // Response generation
  response: {
    verbose: boolean;
    includeConfidence: boolean;
    includeSuggestions: boolean;
  };
}
```

### Default Configuration

```typescript
{
  dbPath: ':memory:',
  thresholds: {
    intent: 60,
    entity: 50,
    workflow: 65,
  },
  multiIntent: {
    enabled: false,
    maxIntents: 3,
  },
  contextWindow: {
    turns: 10,
    entities: 20,
  },
  slotFilling: {
    maxAttempts: 3,
    timeout: 300000, // 5 minutes
  },
  response: {
    verbose: false,
    includeConfidence: false,
    includeSuggestions: true,
  },
}
```

## Pre-defined Intents

The system comes with these built-in intents:

### Commands
- `deploy_application` - Deploy to environments
- `rollback_deployment` - Rollback deployments
- `build_project` - Build projects
- `run_tests` - Execute tests
- `review_code` - Code review
- `create_resource` - Create resources
- `update_resource` - Update resources
- `delete_resource` - Delete resources
- `debug_issue` - Debug problems

### Queries
- `check_status` - Check status
- `list_resources` - List resources
- `get_help` - Get help
- `monitor_system` - Monitor logs/metrics

### Configuration
- `configure_setting` - Configure settings

## Pre-defined Entities

Built-in entity types:

- `agent` - Agent names
- `workflow` - Workflow names
- `command` - Command names
- `file` - File paths
- `directory` - Directory paths
- `environment` - Environments (dev, staging, prod)
- `service` - Service names
- `resource` - Resource types
- `date` - Dates and times
- `number` - Numbers
- `identifier` - Generic identifiers
- `parameter` - Parameters
- `model` - LLM models
- `technology` - Technologies

## API Reference

### NaturalLanguageOrchestrator

#### `constructor(config?: Partial<NLPConfig>)`

Create a new orchestrator instance.

#### `async process(input: string, sessionId?: string): Promise<NLPAnalysisResult>`

Process natural language input and return analysis results.

#### `createSession(userId?: string): string`

Create a new conversation session.

#### `getSession(sessionId: string): ConversationState | null`

Get session by ID.

#### `endSession(sessionId: string): void`

End a conversation session.

#### `getStats(): NLPStats`

Get system statistics.

#### `close(): void`

Close all database connections.

### IntentRecognizer

#### `recognizeIntent(input: string, maxIntents?: number): Intent[]`

Recognize intents from input.

#### `addPattern(pattern: IntentPattern): string`

Add a new intent pattern.

#### `updatePattern(id: string, updates: Partial<IntentPattern>): void`

Update an existing pattern.

#### `deletePattern(id: string): void`

Delete a pattern.

### EntityExtractor

#### `extractEntities(input: string): Entity[]`

Extract all entities from input.

#### `extractByType(input: string, type: EntityType, definition: EntityDefinition): Entity[]`

Extract entities of specific type.

#### `addDefinition(definition: EntityDefinition): void`

Add entity definition.

### WorkflowGenerator

#### `generateWorkflow(intent: Intent, entities: Entity[], context?: ConversationContext): GeneratedWorkflow | null`

Generate workflow from intent and entities.

#### `generateActions(workflow: GeneratedWorkflow): GeneratedAction[]`

Generate actions from workflow.

#### `addMapping(mapping: WorkflowMapping): string`

Add workflow mapping.

## Statistics

Get system statistics:

```typescript
const stats = nlp.getStats();

console.log('Total sessions:', stats.totalSessions);
console.log('Active sessions:', stats.activeSessions);
console.log('Total turns:', stats.totalTurns);
console.log('Intent distribution:', stats.intentDistribution);
console.log('Average confidence:', stats.avgConfidence);
console.log('Success rates:', stats.successRates);
console.log('Performance:', stats.performance);
```

## Database Schema

The system uses SQLite with these main tables:

- `conversation_sessions` - Session state
- `conversation_turns` - Turn history
- `intent_patterns` - Intent definitions
- `workflow_mappings` - Intent-to-workflow mappings
- `entity_definitions` - Entity type definitions
- `intent_stats` - Intent usage statistics
- `entity_stats` - Entity usage statistics
- `workflow_stats` - Workflow generation statistics

Full-text search is enabled on conversation history.

## Testing

Run tests:

```bash
npm test
```

Test coverage includes:
- Intent recognition
- Entity extraction
- Workflow generation
- Context resolution
- Conversation management
- Response generation
- Multi-turn dialogs
- Edge cases

## Performance

Typical performance metrics:

- Intent recognition: < 10ms
- Entity extraction: < 5ms
- Workflow generation: < 5ms
- Total processing: < 50ms

Performance scales with:
- Number of intent patterns
- Number of entity definitions
- Conversation history size

## Best Practices

1. **Pattern Design**
   - Use specific required keywords
   - Add optional keywords for context
   - Include negative keywords to avoid false matches
   - Test patterns with example phrases

2. **Entity Normalization**
   - Always normalize entities (e.g., "prod" → "production")
   - Use known values for enumerated types
   - Implement custom normalizers for complex types

3. **Workflow Mapping**
   - Map required entities explicitly
   - Provide sensible defaults for optional parameters
   - Use confirmation for destructive actions

4. **Context Management**
   - Keep context window reasonable (10-20 turns)
   - Clear stale context periodically
   - Update context after each turn

5. **Error Handling**
   - Always provide suggestions in error messages
   - Generate clarification requests for low confidence
   - Implement fallbacks for unrecognized intents

## Limitations

- **Pattern-based**: No ML/AI, relies on patterns
- **English only**: Currently supports English only
- **No spelling correction**: Requires correct spelling
- **Single-language**: No multi-language support
- **Limited context**: Fixed context window size

## Future Enhancements

Possible improvements:

- [ ] ML-based intent classification
- [ ] Spell checking and autocorrection
- [ ] Multi-language support
- [ ] Voice input support
- [ ] Sentiment analysis
- [ ] Slot-filling improvements
- [ ] Better pronoun resolution
- [ ] Learning from feedback
- [ ] Intent disambiguation UI

## License

Part of the Claude Orchestration system.

## Support

For issues or questions, refer to the main orchestration documentation.
