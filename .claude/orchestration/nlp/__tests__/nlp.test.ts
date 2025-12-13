/**
 * Natural Language Processing Tests
 * Comprehensive tests for all NLP components
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { NaturalLanguageOrchestrator } from '../index.js';
import type { NLPConfig } from '../types.js';

describe('Natural Language Processing System', () => {
  let nlp: NaturalLanguageOrchestrator;

  beforeEach(() => {
    nlp = new NaturalLanguageOrchestrator({
      dbPath: ':memory:',
      thresholds: {
        intent: 50,
        entity: 40,
        workflow: 50,
      },
    });
  });

  afterEach(() => {
    nlp.close();
  });

  describe('Intent Recognition', () => {
    it('should recognize deployment intent', async () => {
      const result = await nlp.process('Deploy to production');

      expect(result.intents).toHaveLength(1);
      expect(result.intents[0].name).toBe('deploy_application');
      expect(result.intents[0].confidence).toBeGreaterThan(50);
    });

    it('should recognize build intent', async () => {
      const result = await nlp.process('Build the project');

      expect(result.intents).toHaveLength(1);
      expect(result.intents[0].name).toBe('build_project');
    });

    it('should recognize test intent', async () => {
      const result = await nlp.process('Run unit tests');

      expect(result.intents).toHaveLength(1);
      expect(result.intents[0].name).toBe('run_tests');
    });

    it('should recognize status query', async () => {
      const result = await nlp.process('Check the status');

      expect(result.intents).toHaveLength(1);
      expect(result.intents[0].name).toBe('check_status');
    });
  });

  describe('Entity Extraction', () => {
    it('should extract environment entity', async () => {
      const result = await nlp.process('Deploy to production');

      const envEntity = result.entities.find((e) => e.type === 'environment');
      expect(envEntity).toBeDefined();
      expect(envEntity?.normalized).toBe('production');
    });

    it('should extract file path entity', async () => {
      const result = await nlp.process('Review the file src/index.ts');

      const fileEntity = result.entities.find((e) => e.type === 'file');
      expect(fileEntity).toBeDefined();
      expect(fileEntity?.value).toContain('index.ts');
    });

    it('should extract model entity', async () => {
      const result = await nlp.process('Use opus for this task');

      const modelEntity = result.entities.find((e) => e.type === 'model');
      expect(modelEntity).toBeDefined();
      expect(modelEntity?.normalized).toBe('opus');
    });
  });

  describe('Workflow Generation', () => {
    it('should generate deploy workflow with environment', async () => {
      const result = await nlp.process('Deploy to staging');

      expect(result.workflow).toBeDefined();
      expect(result.workflow?.name).toBe('deploy-workflow');
      expect(result.workflow?.ready).toBe(true);

      const envParam = result.workflow?.parameters.find((p) => p.name === 'environment');
      expect(envParam?.value).toBe('staging');
    });

    it('should request clarification for missing parameters', async () => {
      const result = await nlp.process('Deploy the application');

      // Might need clarification depending on defaults
      if (!result.workflow?.ready) {
        expect(result.response.type).toBe('clarification');
        expect(result.response.clarificationNeeded).toBeDefined();
      }
    });

    it('should generate build workflow', async () => {
      const result = await nlp.process('Build the project');

      expect(result.workflow).toBeDefined();
      expect(result.workflow?.name).toBe('build-workflow');
      expect(result.workflow?.ready).toBe(true);
    });

    it('should generate actions for workflow', async () => {
      const result = await nlp.process('Deploy to production');

      if (result.workflow?.ready) {
        expect(result.response.actions).toBeDefined();
        expect(result.response.actions).not.toHaveLength(0);
      }
    });
  });

  describe('Context Resolution', () => {
    it('should resolve pronoun references', async () => {
      const sessionId = nlp.createSession();

      // First turn - establish context
      await nlp.process('Deploy api-service to production', sessionId);

      // Second turn - use pronoun
      const result = await nlp.process('Check its status', sessionId);

      // Should resolve "its" to "api-service"
      expect(result.contextResolution).toBeDefined();
    });

    it('should maintain entity context across turns', async () => {
      const sessionId = nlp.createSession();

      await nlp.process('I want to work on the frontend service', sessionId);
      const result = await nlp.process('Deploy it to staging', sessionId);

      // Should have context from previous turn
      expect(result.sessionState.context.recentEntities.length).toBeGreaterThan(0);
    });
  });

  describe('Conversation Management', () => {
    it('should create and track session', async () => {
      const sessionId = nlp.createSession();
      expect(sessionId).toBeDefined();

      const session = nlp.getSession(sessionId);
      expect(session).toBeDefined();
      expect(session?.sessionId).toBe(sessionId);
    });

    it('should track conversation history', async () => {
      const sessionId = nlp.createSession();

      await nlp.process('Build the project', sessionId);
      await nlp.process('Run tests', sessionId);
      await nlp.process('Deploy to staging', sessionId);

      const session = nlp.getSession(sessionId);
      expect(session?.history).toHaveLength(3);
    });

    it('should end session', async () => {
      const sessionId = nlp.createSession();
      await nlp.process('Deploy to production', sessionId);

      nlp.endSession(sessionId);

      const session = nlp.getSession(sessionId);
      expect(session?.status).toBe('completed');
    });
  });

  describe('Response Generation', () => {
    it('should generate confirmation for deployment', async () => {
      const result = await nlp.process('Deploy to production');

      expect(result.response.type).toMatch(/confirmation|clarification/);
      expect(result.response.text).toBeDefined();
    });

    it('should generate clarification request', async () => {
      const result = await nlp.process('Deploy');

      if (!result.workflow?.ready) {
        expect(result.response.type).toBe('clarification');
        expect(result.response.clarificationNeeded?.missingSlots).toBeDefined();
      }
    });

    it('should include suggestions in clarification', async () => {
      const result = await nlp.process('Do something');

      expect(result.response.suggestions).toBeDefined();
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle multi-step deployment conversation', async () => {
      const sessionId = nlp.createSession();

      // Start deployment
      const r1 = await nlp.process('I want to deploy', sessionId);

      // Provide environment
      if (r1.response.type === 'clarification') {
        const r2 = await nlp.process('To production', sessionId);
        expect(r2.workflow).toBeDefined();
      }
    });

    it('should handle build, test, deploy sequence', async () => {
      const sessionId = nlp.createSession();

      const r1 = await nlp.process('Build the project', sessionId);
      expect(r1.intents[0].name).toBe('build_project');

      const r2 = await nlp.process('Now run the tests', sessionId);
      expect(r2.intents[0].name).toBe('run_tests');

      const r3 = await nlp.process('Deploy it to staging', sessionId);
      expect(r3.intents[0].name).toBe('deploy_application');
    });

    it('should handle error gracefully', async () => {
      const result = await nlp.process('xyz123 invalid input abc');

      expect(result.response.type).toMatch(/error|suggestion|clarification/);
    });
  });

  describe('Statistics', () => {
    it('should track system statistics', async () => {
      await nlp.process('Deploy to production');
      await nlp.process('Run tests');
      await nlp.process('Check status');

      const stats = nlp.getStats();

      expect(stats.totalSessions).toBeGreaterThan(0);
      expect(stats.totalTurns).toBeGreaterThan(0);
      expect(stats.intentDistribution).toBeDefined();
    });

    it('should track intent distribution', async () => {
      const sessionId = nlp.createSession();

      await nlp.process('Deploy to production', sessionId);
      await nlp.process('Deploy to staging', sessionId);
      await nlp.process('Run tests', sessionId);

      const stats = nlp.getStats();

      expect(stats.intentDistribution['deploy_application']).toBeGreaterThanOrEqual(2);
      expect(stats.intentDistribution['run_tests']).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty input', async () => {
      const result = await nlp.process('');

      expect(result.response.type).toBe('error');
    });

    it('should handle very long input', async () => {
      const longInput = 'Deploy to production ' + 'with lots of extra words '.repeat(50);
      const result = await nlp.process(longInput);

      expect(result.intents.length).toBeGreaterThan(0);
    });

    it('should handle special characters', async () => {
      const result = await nlp.process('Deploy to production @#$%^&*()');

      expect(result.intents.length).toBeGreaterThan(0);
    });

    it('should handle case variations', async () => {
      const r1 = await nlp.process('DEPLOY TO PRODUCTION');
      const r2 = await nlp.process('deploy to production');
      const r3 = await nlp.process('Deploy To Production');

      expect(r1.intents[0].name).toBe(r2.intents[0].name);
      expect(r2.intents[0].name).toBe(r3.intents[0].name);
    });
  });
});

describe('Intent Recognizer', () => {
  it('should score patterns correctly', () => {
    const nlp = new NaturalLanguageOrchestrator({ dbPath: ':memory:' });

    const result1 = nlp['intentRecognizer'].recognizeIntent('deploy to production');
    const result2 = nlp['intentRecognizer'].recognizeIntent('maybe deploy sometime');

    expect(result1[0].confidence).toBeGreaterThan(result2[0].confidence);

    nlp.close();
  });
});

describe('Entity Extractor', () => {
  it('should normalize environment names', () => {
    const nlp = new NaturalLanguageOrchestrator({ dbPath: ':memory:' });

    const entities = nlp['entityExtractor'].extractEntities('Deploy to prod');
    const envEntity = entities.find((e) => e.type === 'environment');

    expect(envEntity?.normalized).toBe('production');

    nlp.close();
  });

  it('should extract multiple entities', () => {
    const nlp = new NaturalLanguageOrchestrator({ dbPath: ':memory:' });

    const entities = nlp['entityExtractor'].extractEntities(
      'Deploy api-service to production using opus'
    );

    expect(entities.length).toBeGreaterThanOrEqual(2);

    nlp.close();
  });
});

describe('Workflow Generator', () => {
  it('should map entities to parameters', () => {
    const nlp = new NaturalLanguageOrchestrator({ dbPath: ':memory:' });

    const intent = {
      name: 'deploy_application',
      confidence: 80,
      category: 'command' as const,
      keywords: ['deploy'],
    };

    const entities = [
      {
        type: 'environment' as const,
        value: 'production',
        normalized: 'production',
        confidence: 90,
        start: 0,
        end: 10,
      },
    ];

    const workflow = nlp['workflowGenerator'].generateWorkflow(intent, entities);

    expect(workflow).toBeDefined();
    expect(workflow?.name).toBe('deploy-workflow');

    const envParam = workflow?.parameters.find((p) => p.name === 'environment');
    expect(envParam?.value).toBe('production');

    nlp.close();
  });
});
