/**
 * Natural Language Orchestration - Usage Examples
 * Demonstrates how to use the NLP system for command processing
 */

import { NaturalLanguageOrchestrator } from './index.js';

async function main() {
  // Initialize the orchestrator
  const nlp = new NaturalLanguageOrchestrator({
    dbPath: './data/nlp-example.db',
    thresholds: {
      intent: 60,
      entity: 50,
      workflow: 65,
    },
    response: {
      verbose: true,
      includeConfidence: true,
      includeSuggestions: true,
    },
  });

  console.log('='.repeat(70));
  console.log('Natural Language Orchestration - Examples');
  console.log('='.repeat(70));

  // Example 1: Simple deployment command
  console.log('\n📝 Example 1: Simple deployment command');
  console.log('Input: "Deploy to production"');
  const result1 = await nlp.process('Deploy to production');
  console.log('Intent:', result1.intents[0].name, `(${result1.intents[0].confidence}%)`);
  console.log('Entities:', result1.entities.map((e) => `${e.type}=${e.value}`).join(', '));
  console.log('Workflow:', result1.workflow?.name);
  console.log('Response:', result1.response.text);
  console.log('Processing Time:', result1.processingTime, 'ms');

  // Example 2: Build and test
  console.log('\n📝 Example 2: Build and test sequence');
  console.log('Input: "Build the project"');
  const result2 = await nlp.process('Build the project');
  console.log('Intent:', result2.intents[0].name);
  console.log('Workflow:', result2.workflow?.name);
  console.log('Actions:', result2.response.actions?.length || 0);

  console.log('\nInput: "Run unit tests"');
  const result3 = await nlp.process('Run unit tests');
  console.log('Intent:', result3.intents[0].name);
  console.log('Workflow:', result3.workflow?.name);

  // Example 3: Multi-turn conversation
  console.log('\n📝 Example 3: Multi-turn conversation with context');
  const sessionId = nlp.createSession('user-123');

  console.log('Turn 1: "I want to deploy the api-service"');
  const r1 = await nlp.process('I want to deploy the api-service', sessionId);
  console.log('Response:', r1.response.text);

  console.log('\nTurn 2: "To staging"');
  const r2 = await nlp.process('To staging', sessionId);
  console.log('Response:', r2.response.text);
  console.log('Workflow Ready:', r2.workflow?.ready);

  console.log('\nTurn 3: "Check its status"');
  const r3 = await nlp.process('Check its status', sessionId);
  console.log('Resolved Text:', r3.contextResolution?.resolvedText);
  console.log('Response:', r3.response.text);

  // Example 4: Status queries
  console.log('\n📝 Example 4: Status and information queries');
  console.log('Input: "Check the deployment status"');
  const result4 = await nlp.process('Check the deployment status');
  console.log('Intent:', result4.intents[0].name);
  console.log('Category:', result4.intents[0].category);

  console.log('\nInput: "List all services"');
  const result5 = await nlp.process('List all services');
  console.log('Intent:', result5.intents[0].name);

  // Example 5: Complex deployment with service and environment
  console.log('\n📝 Example 5: Complex deployment command');
  console.log('Input: "Deploy frontend-service to production"');
  const result6 = await nlp.process('Deploy frontend-service to production');
  console.log('Entities:');
  result6.entities.forEach((e) => {
    console.log(`  - ${e.type}: ${e.value} → ${e.normalized} (${e.confidence}%)`);
  });
  console.log('Workflow Parameters:');
  result6.workflow?.parameters.forEach((p) => {
    const inferred = p.inferred ? ' (inferred)' : '';
    console.log(`  - ${p.name}: ${p.value}${inferred}`);
  });

  // Example 6: Clarification needed
  console.log('\n📝 Example 6: Clarification needed');
  console.log('Input: "Deploy the application"');
  const result7 = await nlp.process('Deploy the application');
  if (result7.response.clarificationNeeded) {
    console.log('Missing:', result7.response.clarificationNeeded.missingSlots.join(', '));
    console.log('Suggestions:');
    result7.response.clarificationNeeded.suggestedQuestions?.forEach((q) => {
      console.log(`  - ${q}`);
    });
  }

  // Example 7: Error handling
  console.log('\n📝 Example 7: Error handling');
  console.log('Input: "xyz invalid command abc"');
  const result8 = await nlp.process('xyz invalid command abc');
  console.log('Response Type:', result8.response.type);
  console.log('Response:', result8.response.text);
  if (result8.response.suggestions) {
    console.log('Suggestions:', result8.response.suggestions.join(', '));
  }

  // Example 8: Reference resolution
  console.log('\n📝 Example 8: Reference resolution with pronouns');
  const sessionId2 = nlp.createSession();

  console.log('Turn 1: "Deploy api-service to staging"');
  await nlp.process('Deploy api-service to staging', sessionId2);

  console.log('Turn 2: "Now test it"');
  const r4 = await nlp.process('Now test it', sessionId2);
  console.log('Original:', 'Now test it');
  console.log('Resolved:', r4.contextResolution?.resolvedText);
  console.log('Intent:', r4.intents[0].name);

  // Example 9: Statistics
  console.log('\n📊 System Statistics');
  const stats = nlp.getStats();
  console.log('Total Sessions:', stats.totalSessions);
  console.log('Active Sessions:', stats.activeSessions);
  console.log('Total Turns:', stats.totalTurns);
  console.log('Intent Distribution:', JSON.stringify(stats.intentDistribution, null, 2));
  console.log('Average Confidence:');
  console.log('  - Intent:', stats.avgConfidence.intent.toFixed(1), '%');
  console.log('  - Entity:', stats.avgConfidence.entity.toFixed(1), '%');
  console.log('  - Workflow:', stats.avgConfidence.workflow.toFixed(1), '%');
  console.log('Performance:');
  console.log('  - Avg Processing Time:', stats.performance.avgProcessingTime.toFixed(1), 'ms');

  // Example 10: Session management
  console.log('\n📝 Example 10: Session management');
  const session = nlp.getSession(sessionId);
  if (session) {
    console.log('Session ID:', session.sessionId);
    console.log('User ID:', session.userId);
    console.log('Status:', session.status);
    console.log('History Length:', session.history.length);
    console.log('Entities in Context:', session.context.recentEntities.length);
  }

  // End sessions
  nlp.endSession(sessionId);
  nlp.endSession(sessionId2);

  console.log('\n' + '='.repeat(70));
  console.log('Examples completed successfully!');
  console.log('='.repeat(70));

  // Clean up
  nlp.close();
}

// Run examples
main().catch(console.error);
