/**
 * Intelligence Engine Tests
 *
 * Comprehensive test suite for ML-based routing and pattern recognition.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import Database from 'better-sqlite3';
import { IntelligenceEngine } from '../index';
import { FeatureExtractor } from '../feature-extractor';
import { PatternRecognizer } from '../pattern-recognizer';
import { AnomalyDetector } from '../anomaly-detector';
import { MLRouter } from '../ml-router';
import { Predictor } from '../predictor';
import type { TaskDescriptor, ModelProfile } from '../../routing/types';
import * as fs from 'fs';
import * as path from 'path';

describe('Intelligence Engine', () => {
  let db: Database.Database;
  let testDbPath: string;
  let models: ModelProfile[];

  beforeEach(() => {
    // Create test database
    testDbPath = path.join(__dirname, `test-${Date.now()}.db`);
    db = new Database(testDbPath);

    // Initialize schema
    const schemaPath = path.join(__dirname, '../../db/intelligence.sql');
    const schema = fs.readFileSync(schemaPath, 'utf-8');
    db.exec(schema);

    // Also initialize routing schema for dependencies
    const routingSchemaPath = path.join(__dirname, '../../db/routing.sql');
    if (fs.existsSync(routingSchemaPath)) {
      const routingSchema = fs.readFileSync(routingSchemaPath, 'utf-8');
      db.exec(routingSchema);
    }

    // Define test models
    models = [
      {
        id: 'opus',
        name: 'opus',
        modelId: 'claude-opus-4-5',
        provider: 'anthropic',
        strengths: ['architecture', 'planning'],
        costPer1kInputTokens: 0.015,
        costPer1kOutputTokens: 0.075,
        latencyMs: 5000,
        contextWindow: 200000,
        maxOutputTokens: 4096,
        qualityScore: 95,
        supportsExtendedThinking: true,
        supportsVision: true,
        supportsToolUse: true
      },
      {
        id: 'sonnet',
        name: 'sonnet',
        modelId: 'claude-sonnet-4-5',
        provider: 'anthropic',
        strengths: ['code-generation', 'analysis'],
        costPer1kInputTokens: 0.003,
        costPer1kOutputTokens: 0.015,
        latencyMs: 3000,
        contextWindow: 200000,
        maxOutputTokens: 4096,
        qualityScore: 90,
        supportsExtendedThinking: false,
        supportsVision: true,
        supportsToolUse: true
      },
      {
        id: 'haiku',
        name: 'haiku',
        modelId: 'claude-haiku-4',
        provider: 'anthropic',
        strengths: ['documentation', 'simple-task'],
        costPer1kInputTokens: 0.0008,
        costPer1kOutputTokens: 0.004,
        latencyMs: 1000,
        contextWindow: 200000,
        maxOutputTokens: 4096,
        qualityScore: 80,
        supportsExtendedThinking: false,
        supportsVision: true,
        supportsToolUse: true
      }
    ];
  });

  afterEach(() => {
    db.close();
    fs.unlinkSync(testDbPath);
  });

  describe('Feature Extractor', () => {
    it('should extract text features from task description', async () => {
      const extractor = new FeatureExtractor({ db });

      const task: TaskDescriptor = {
        task: 'Implement authentication system with JWT tokens and OAuth2',
        type: 'architecture',
        complexity: 'complex',
        pattern: 'multi-step',
        estimatedInputTokens: 2000,
        estimatedOutputTokens: 1000,
        requiresExtendedThinking: true,
        involvesCode: true,
        requiresCreativity: false,
        priority: 4
      };

      const features = await extractor.extractFeatures('test-task-1', task);

      expect(features.textFeatures.length).toBeGreaterThan(0);
      expect(features.textFeatures.complexity).toBeGreaterThan(0);
      expect(features.textFeatures.keywords.length).toBeGreaterThan(0);
      expect(features.textFeatures.hasCodeIndicators).toBe(false); // No code in description
      expect(features.vector.length).toBeGreaterThan(0);
    });

    it('should normalize feature vectors', async () => {
      const extractor = new FeatureExtractor({ db, normalize: true });

      const task: TaskDescriptor = {
        task: 'Simple documentation task',
        type: 'documentation',
        complexity: 'simple',
        pattern: 'single-shot',
        estimatedInputTokens: 500,
        estimatedOutputTokens: 300,
        requiresExtendedThinking: false,
        involvesCode: false,
        requiresCreativity: false,
        priority: 2
      };

      const features = await extractor.extractFeatures('test-task-2', task);

      // All features should be normalized to 0-1 range
      for (const value of features.vector) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });
  });

  describe('ML Router', () => {
    it('should select model using UCB1 algorithm', async () => {
      const router = new MLRouter({
        db,
        availableModels: models,
        algorithm: 'ucb1',
        explorationConstant: Math.sqrt(2),
        initialPulls: 5
      });

      const task: TaskDescriptor = {
        task: 'Design microservices architecture',
        type: 'architecture',
        complexity: 'complex',
        pattern: 'multi-step',
        estimatedInputTokens: 3000,
        estimatedOutputTokens: 1500,
        requiresExtendedThinking: true,
        involvesCode: true,
        requiresCreativity: true,
        priority: 5
      };

      const extractor = new FeatureExtractor({ db });
      const features = await extractor.extractFeatures('test-task-3', task);

      const prediction = await router.selectModel(task, features);

      expect(prediction.recommendedModel).toBeDefined();
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.confidence).toBeLessThanOrEqual(1);
      expect(prediction.alternatives.length).toBeGreaterThan(0);
      expect(prediction.reasoning.length).toBeGreaterThan(0);
    });

    it('should explore initially with insufficient pulls', async () => {
      const router = new MLRouter({
        db,
        availableModels: models,
        algorithm: 'ucb1',
        initialPulls: 10
      });

      const task: TaskDescriptor = {
        task: 'Write unit tests',
        type: 'testing',
        complexity: 'medium',
        pattern: 'single-shot',
        estimatedInputTokens: 1000,
        estimatedOutputTokens: 500,
        requiresExtendedThinking: false,
        involvesCode: true,
        requiresCreativity: false,
        priority: 3
      };

      const extractor = new FeatureExtractor({ db });
      const features = await extractor.extractFeatures('test-task-4', task);

      const prediction = await router.selectModel(task, features);

      // Should explore when arms have < initialPulls
      expect(prediction.reasoning.some(r => r.includes('Exploring'))).toBe(true);
    });
  });

  describe('Predictor', () => {
    it('should predict task duration', async () => {
      const predictor = new Predictor({ db });

      const task: TaskDescriptor = {
        task: 'Optimize database queries',
        type: 'code-generation',
        complexity: 'medium',
        pattern: 'iterative',
        estimatedInputTokens: 1500,
        estimatedOutputTokens: 800,
        requiresExtendedThinking: false,
        involvesCode: true,
        requiresCreativity: false,
        priority: 3
      };

      const extractor = new FeatureExtractor({ db });
      const features = await extractor.extractFeatures('test-task-5', task);

      const prediction = await predictor.predictDuration('test-task-5', task, features);

      expect(prediction.predictedValue).toBeGreaterThan(0);
      expect(prediction.confidence).toBeGreaterThan(0);
      expect(prediction.predictionInterval).toBeDefined();
      expect(prediction.predictionInterval!.lower).toBeLessThan(prediction.predictedValue);
      expect(prediction.predictionInterval!.upper).toBeGreaterThan(prediction.predictedValue);
    });

    it('should predict all metrics', async () => {
      const predictor = new Predictor({ db });

      const task: TaskDescriptor = {
        task: 'Refactor legacy code',
        type: 'refactoring',
        complexity: 'complex',
        pattern: 'multi-step',
        estimatedInputTokens: 2500,
        estimatedOutputTokens: 1200,
        requiresExtendedThinking: false,
        involvesCode: true,
        requiresCreativity: false,
        priority: 4
      };

      const extractor = new FeatureExtractor({ db });
      const features = await extractor.extractFeatures('test-task-6', task);

      const predictions = await predictor.predictAll('test-task-6', task, features);

      expect(predictions.duration).toBeDefined();
      expect(predictions.cost).toBeDefined();
      expect(predictions.success).toBeDefined();
      expect(predictions.quality).toBeDefined();

      expect(predictions.duration.predictedValue).toBeGreaterThan(0);
      expect(predictions.cost.predictedValue).toBeGreaterThan(0);
      expect(predictions.success.predictedValue).toBeGreaterThan(0);
      expect(predictions.success.predictedValue).toBeLessThanOrEqual(1);
      expect(predictions.quality.predictedValue).toBeGreaterThan(0);
      expect(predictions.quality.predictedValue).toBeLessThanOrEqual(100);
    });
  });

  describe('Pattern Recognizer', () => {
    it('should detect patterns when sufficient data exists', async () => {
      // Insert test data
      const insertDecision = db.prepare(`
        INSERT INTO routing_decisions (
          id, task_hash, task_text, task_type, complexity, pattern,
          model_selected, model_id, confidence, estimated_cost, estimated_latency,
          estimated_tokens_input, estimated_tokens_output
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertOutcome = db.prepare(`
        INSERT INTO routing_outcomes (
          id, routing_id, success, quality_score, actual_cost, actual_latency,
          tokens_input, tokens_output
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Create pattern: haiku fails on complex tasks
      for (let i = 0; i < 5; i++) {
        const routingId = `routing-${i}`;
        insertDecision.run(
          routingId,
          `hash-${i}`,
          'Complex task',
          'code-generation',
          'complex',
          'multi-step',
          'haiku',
          'claude-haiku-4',
          0.8,
          0.01,
          5000,
          2000,
          1000
        );

        insertOutcome.run(
          `outcome-${i}`,
          routingId,
          0, // Failure
          50,
          0.01,
          5000,
          2000,
          1000
        );
      }

      const recognizer = new PatternRecognizer({ db, minFrequency: 3 });
      const patterns = await recognizer.analyzePatterns();

      // Should detect failure pattern
      const failurePatterns = patterns.filter(p => p.type === 'failure');
      expect(failurePatterns.length).toBeGreaterThan(0);
    });
  });

  describe('Anomaly Detector', () => {
    it('should detect performance anomalies', async () => {
      // Insert normal data
      const insertDecision = db.prepare(`
        INSERT INTO routing_decisions (
          id, task_hash, task_text, task_type, complexity, pattern,
          model_selected, model_id, confidence, estimated_cost, estimated_latency,
          estimated_tokens_input, estimated_tokens_output
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertOutcome = db.prepare(`
        INSERT INTO routing_outcomes (
          id, routing_id, success, quality_score, actual_cost, actual_latency,
          tokens_input, tokens_output
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      // Normal latencies: ~3000ms
      for (let i = 0; i < 20; i++) {
        const routingId = `routing-${i}`;
        insertDecision.run(
          routingId,
          `hash-${i}`,
          'Normal task',
          'code-generation',
          'medium',
          'single-shot',
          'sonnet',
          'claude-sonnet-4-5',
          0.9,
          0.01,
          3000,
          1000,
          500
        );

        insertOutcome.run(
          `outcome-${i}`,
          routingId,
          1,
          85,
          0.01,
          3000 + Math.random() * 500, // Normal variation
          1000,
          500
        );
      }

      // Anomalous latency: 30000ms
      const anomalousRoutingId = 'routing-anomaly';
      insertDecision.run(
        anomalousRoutingId,
        'hash-anomaly',
        'Slow task',
        'code-generation',
        'medium',
        'single-shot',
        'sonnet',
        'claude-sonnet-4-5',
        0.9,
        0.01,
        3000,
        1000,
        500
      );

      insertOutcome.run(
        'outcome-anomaly',
        anomalousRoutingId,
        1,
        85,
        0.01,
        30000, // Anomaly!
        1000,
        500
      );

      const detector = new AnomalyDetector({ db, sensitivity: 3 });
      const anomalies = await detector.detectAnomalies();

      // Should detect performance anomaly
      const performanceAnomalies = anomalies.filter(a => a.type === 'performance');
      expect(performanceAnomalies.length).toBeGreaterThan(0);

      if (performanceAnomalies.length > 0) {
        const anomaly = performanceAnomalies[0];
        expect(anomaly.severity).toBeDefined();
        expect(anomaly.deviation).toBeGreaterThan(0);
      }
    });
  });

  describe('Intelligence Engine Integration', () => {
    it('should provide complete routing recommendation', async () => {
      const engine = new IntelligenceEngine(db, models, {
        enableIntelligentRouting: true,
        enablePatternRecognition: true,
        enableAnomalyDetection: true,
        enableContinuousLearning: true
      });

      const task: TaskDescriptor = {
        task: 'Implement OAuth2 authentication flow',
        type: 'architecture',
        complexity: 'complex',
        pattern: 'multi-step',
        estimatedInputTokens: 2500,
        estimatedOutputTokens: 1200,
        requiresExtendedThinking: true,
        involvesCode: true,
        requiresCreativity: false,
        priority: 5
      };

      const recommendation = await engine.getRoutingRecommendation('test-task-integrated', task);

      expect(recommendation.routing).toBeDefined();
      expect(recommendation.predictions).toBeDefined();
      expect(recommendation.features).toBeDefined();

      expect(recommendation.routing.recommendedModel).toBeDefined();
      expect(recommendation.predictions.duration).toBeDefined();
      expect(recommendation.predictions.cost).toBeDefined();
      expect(recommendation.predictions.success).toBeDefined();
      expect(recommendation.predictions.quality).toBeDefined();
    });

    it('should run periodic analysis', async () => {
      const engine = new IntelligenceEngine(db, models);

      const analysis = await engine.runPeriodicAnalysis();

      expect(analysis.patterns).toBeDefined();
      expect(analysis.anomalies).toBeDefined();
      expect(Array.isArray(analysis.patterns)).toBe(true);
      expect(Array.isArray(analysis.anomalies)).toBe(true);
    });

    it('should provide intelligence statistics', async () => {
      const engine = new IntelligenceEngine(db, models);

      const stats = await engine.getStats();

      expect(stats.routing).toBeDefined();
      expect(stats.patterns).toBeDefined();
      expect(stats.anomalies).toBeDefined();
      expect(stats.learning).toBeDefined();
      expect(stats.predictions).toBeDefined();
    });
  });
});
