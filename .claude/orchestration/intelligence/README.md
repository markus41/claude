# Adaptive Intelligence Engine

ML-based routing and pattern recognition system that establishes data-driven decision-making to optimize model selection and improve system performance over time.

## Overview

The Intelligence Engine implements:

- **Feature Extraction**: Extract meaningful features from tasks for ML-based routing
- **Pattern Recognition**: Detect success, failure, and performance patterns
- **Anomaly Detection**: Statistical monitoring for performance, errors, and costs
- **ML Routing**: Multi-armed bandit algorithm for intelligent model selection
- **Continuous Learning**: Online learning from outcomes to improve decisions
- **Prediction**: Duration, cost, success, and quality forecasting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Intelligence Engine                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Feature    │  │   Pattern    │  │   Anomaly    │      │
│  │  Extractor   │  │  Recognizer  │  │   Detector   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │  ML Router   │  │ Continuous   │  │  Predictor   │      │
│  │  (Bandit)    │  │   Learner    │  │              │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           │
                           ▼
                    ┌──────────────┐
                    │   Database   │
                    │   (SQLite)   │
                    └──────────────┘
```

## Components

### Feature Extractor

Extracts three types of features from tasks:

- **Text Features**: Length, complexity, keywords, sentiment
- **Historical Features**: Success rates, average duration/cost, similar tasks
- **Context Features**: Agent load, time of day, recent error rates

### Pattern Recognizer

Detects patterns in task execution:

- **Success Patterns**: High success rate combinations (task type + model)
- **Failure Patterns**: Recurring failure scenarios
- **Performance Patterns**: Slow execution patterns
- **Cost Patterns**: High-cost execution patterns

### Anomaly Detector

Statistical anomaly detection:

- **Methods**: Z-score, IQR (Interquartile Range)
- **Types**: Performance, error rate, cost, quality
- **Severity**: Low, medium, high, critical

### ML Router

Multi-armed bandit algorithms for model selection:

- **UCB1**: Upper Confidence Bound (default)
- **Thompson Sampling**: Beta distribution sampling
- **Epsilon-Greedy**: Exploration-exploitation trade-off

### Continuous Learner

Online learning from routing outcomes:

- **Reward Calculation**: Based on success, quality, cost, latency
- **Model Updates**: Periodic parameter adjustments
- **Performance Tracking**: Learning effectiveness metrics

### Predictor

Forecasts task characteristics:

- **Duration**: Based on historical patterns and complexity
- **Cost**: Token-based estimation
- **Success Probability**: Historical success rates
- **Quality Score**: Expected output quality

## Usage

### Basic Integration

```typescript
import { IntelligenceEngine } from './intelligence';
import Database from 'better-sqlite3';

// Initialize database
const db = new Database('./orchestration.db');

// Define available models
const models = [
  {
    id: 'opus',
    name: 'opus',
    modelId: 'claude-opus-4-5-20251101',
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
  }
  // ... other models
];

// Create intelligence engine
const intelligence = new IntelligenceEngine(db, models, {
  enableIntelligentRouting: true,
  enablePatternRecognition: true,
  enableAnomalyDetection: true,
  enableContinuousLearning: true,
  bandit: {
    algorithm: 'ucb1',
    explorationConstant: Math.sqrt(2),
    initialPulls: 5
  }
});

// Get routing recommendation
const task = {
  task: 'Implement authentication system',
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

const recommendation = await intelligence.getRoutingRecommendation('task-123', task);

console.log('Recommended model:', recommendation.routing.recommendedModel);
console.log('Confidence:', recommendation.routing.confidence);
console.log('Predicted duration:', recommendation.predictions.duration.predictedValue, 'ms');
console.log('Predicted cost:', recommendation.predictions.cost.predictedValue, 'USD');
```

### Periodic Analysis

```typescript
// Run pattern recognition and anomaly detection
const analysis = await intelligence.runPeriodicAnalysis();

console.log('Detected patterns:', analysis.patterns.length);
console.log('Detected anomalies:', analysis.anomalies.length);

// Get intelligence statistics
const stats = await intelligence.getStats();

console.log('Total routing decisions:', stats.routing.totalDecisions);
console.log('Active patterns:', stats.patterns.activePatterns);
console.log('Unresolved anomalies:', stats.anomalies.unresolvedCount);
console.log('Learning events:', stats.learning.totalEvents);
```

### Learning from Outcomes

```typescript
// After task execution, feed outcome back for learning
const outcome = {
  id: 'outcome-123',
  routing_id: 'routing-123',
  success: true,
  quality_score: 85,
  actual_cost: 0.045,
  actual_latency: 4500,
  tokens_input: 2100,
  tokens_output: 950,
  used_fallback: false
};

await intelligence.learnFromOutcome(outcome);
```

## Database Schema

The intelligence engine uses the following tables:

- `ml_models`: Trained model parameters and metadata
- `feature_vectors`: Extracted task features
- `detected_patterns`: Identified patterns (success, failure, performance)
- `anomalies`: Detected anomalies with severity classification
- `learning_events`: Online learning events
- `predictions`: Model predictions with confidence intervals
- `bandit_arms`: Multi-armed bandit arm statistics
- `model_comparisons`: A/B testing results

## Configuration

### Intelligence Config

```typescript
interface IntelligenceConfig {
  enableIntelligentRouting: boolean;
  enablePatternRecognition: boolean;
  enableAnomalyDetection: boolean;
  enableContinuousLearning: boolean;

  bandit: {
    algorithm: 'ucb1' | 'thompson_sampling' | 'epsilon_greedy';
    explorationConstant?: number; // UCB1
    epsilon?: number; // Epsilon-Greedy
    initialPulls?: number;
  };

  patternRecognition: {
    minFrequency: number;
    minConfidence: number;
    windowSize: number;
  };

  anomalyDetection: {
    sensitivity: number; // 1-5
    methods: ('z_score' | 'iqr' | 'moving_average')[];
    windowSize: number;
  };

  learning: {
    learningRate: number;
    updateFrequency: number;
    minSamplesForUpdate: number;
  };

  prediction: {
    confidenceThreshold: number;
    predictionIntervalLevel: number;
  };
}
```

## Performance

The intelligence engine is designed for:

- **Low latency**: Feature extraction and prediction in <50ms
- **Scalability**: Handles 1000s of tasks with efficient database queries
- **Accuracy**: Prediction accuracy improves over time with continuous learning
- **Reliability**: Statistical methods with configurable sensitivity

## Testing

Run tests:

```bash
npm test
```

## Integration

The intelligence engine integrates with:

- **Routing System**: Provides intelligent model selection
- **Telemetry System**: Tracks metrics and performance
- **Context Management**: Optimizes context usage
- **Cost Tracking**: Minimizes costs while maintaining quality

## Future Enhancements

- Advanced ML models (gradient boosting, neural networks)
- Multi-objective optimization (Pareto frontier)
- Contextual bandit algorithms
- Deep reinforcement learning for routing
- Seasonal pattern detection
- Ensemble prediction models

## License

Proprietary - NABIP Association Management Platform
