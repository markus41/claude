---
name: contextual-intelligence
description: Project fingerprinting, association rule mining (Apriori), and cosine-similarity plugin recommendations
disable-model-invocation: false
---

# Contextual Plugin Intelligence

Analyze a project's technology stack and recommend plugins using machine learning techniques: $ARGUMENTS

## Overview

The intelligence module provides three core capabilities:

1. **Project Fingerprinting** — Scans a project directory to extract a feature vector covering frameworks, languages, infrastructure, and architectural patterns.
2. **Association Rule Mining (Apriori)** — Discovers which features commonly co-occur across projects, then identifies capability gaps in the current project.
3. **Plugin Recommendations** — Ranks available plugins by cosine similarity to the project fingerprint, weighted by gap-filling potential.

## Architecture

```
ProjectFingerprinter
  |
  |-- detectFrameworks()    -> package.json, pyproject.toml, go.mod, Cargo.toml
  |-- detectLanguages()     -> file extension distribution (recursive walk)
  |-- detectInfrastructure() -> config files (Dockerfile, Chart.yaml, .github/workflows, etc.)
  |-- detectPatterns()      -> monorepo, event-driven, api-gateway, microservices, serverless
  |-- findGaps()            -> uses AprioriMiner rules to identify missing capabilities
  |
  v
ProjectFingerprint { frameworks, languages, infrastructure, patterns, missing }
  |
  v
RecommendationEngine
  |-- buildVocabulary()     -> union of all feature terms
  |-- toBinaryVector()      -> project/plugin features -> [0,1,0,1,...] vectors
  |-- cosineSimilarity()    -> dot(A,B) / (||A|| * ||B||)
  |-- computeGapCoverage()  -> weighted gap fill score
  |-- recommend()           -> ranked PluginRecommendation[]
  |
  v
RecommendationReport { projectSummary, recommendations, gaps, scanDate }
```

## Key Algorithms

### Apriori Algorithm

The Apriori algorithm mines association rules from a dataset of project profiles. It works in two phases:

**Phase 1: Find Frequent Itemsets**

```
L1 = { items appearing in >= minSupport fraction of transactions }
k = 2
while L(k-1) is non-empty:
    Candidates = apriori-gen(L(k-1))  // join + prune
    Count each candidate's support across all transactions
    L(k) = candidates with support >= minSupport
    k++
```

The **Apriori principle** (anti-monotone property) states: if {A,B} is infrequent, no superset {A,B,C,...} can be frequent. This allows aggressive pruning of the candidate space.

**Phase 2: Generate Rules**

For each frequent itemset S where |S| >= 2:
```
For each item B in S:
    A = S \ {B}
    confidence = support(S) / support(A)
    lift = confidence / support({B})
    if confidence >= minConfidence: emit rule A => {B}
```

### Cosine Similarity

Projects and plugins are both represented as binary vectors over a shared vocabulary of feature terms:

```
vocabulary = sorted union of all terms
project_vector[i] = 1 if vocabulary[i] in project_features else 0
plugin_vector[i]  = 1 if vocabulary[i] in plugin_capabilities else 0

similarity = dot(project, plugin) / (norm(project) * norm(plugin))
```

### Final Scoring

```
relevance = 0.6 * cosine_similarity + 0.4 * gap_coverage
gap_coverage = sum(confidence[gap] for filled gaps) / sum(confidence[gap] for all gaps)
```

## File Structure

```
plugins/marketplace-pro/
  src/intelligence/
    types.ts          — All TypeScript interfaces
    fingerprint.ts    — ProjectFingerprinter, AprioriMiner, RecommendationEngine
  config/
    project-profiles.json  — Training dataset (~22 project profiles)
  commands/
    recommend.md      — /mp:recommend slash command
  skills/intelligence/
    SKILL.md          — This file
```

## Usage Examples

### Scan Current Project

```typescript
import { ProjectFingerprinter } from './src/intelligence/fingerprint.js';

const fp = new ProjectFingerprinter('/path/to/project');
const fingerprint = await fp.scan();

console.log('Frameworks:', fingerprint.frameworks);
console.log('Languages:', fingerprint.languages);
console.log('Infrastructure:', fingerprint.infrastructure);
console.log('Patterns:', fingerprint.patterns);
console.log('Missing capabilities:', fingerprint.missing);
```

### Mine Association Rules

```typescript
import { AprioriMiner } from './src/intelligence/fingerprint.js';

const profiles = [
  { features: ['typescript', 'react', 'nextjs', 'eslint', 'jest', 'ci-cd'] },
  { features: ['typescript', 'nodejs', 'express', 'docker', 'kubernetes', 'helm', 'ci-cd'] },
  { features: ['python', 'fastapi', 'docker', 'terraform', 'aws', 'monitoring'] },
  // ...more profiles
];

const miner = new AprioriMiner(profiles, 0.3, 0.6);
const rules = miner.mineRules();

for (const rule of rules) {
  console.log(
    `{${rule.antecedent.join(', ')}} => {${rule.consequent.join(', ')}}`,
    `support=${rule.support} confidence=${rule.confidence} lift=${rule.lift}`
  );
}
// Example output:
// {kubernetes, helm} => {ci-cd}  support=0.318 confidence=0.875 lift=1.05
// {docker, kubernetes} => {monitoring}  support=0.364 confidence=0.8 lift=1.12
```

### Get Plugin Recommendations

```typescript
import { RecommendationEngine } from './src/intelligence/fingerprint.js';
import type { PluginCapability } from './src/intelligence/types.js';

const plugins: PluginCapability[] = [
  {
    name: 'ci-pipeline-pro',
    description: 'CI/CD pipeline generator',
    capabilities: ['ci-cd', 'testing', 'deployment'],
    targetInfrastructure: ['docker', 'kubernetes'],
  },
  {
    name: 'monitoring-stack',
    description: 'Observability setup with Prometheus + Grafana',
    capabilities: ['monitoring', 'alerting', 'dashboards'],
    targetInfrastructure: ['kubernetes', 'docker'],
  },
];

const engine = new RecommendationEngine();
const report = engine.recommend(fingerprint, plugins);

for (const rec of report.recommendations) {
  console.log(`${rec.pluginName}: relevance=${rec.relevance}`);
  console.log(`  Reason: ${rec.reason}`);
  console.log(`  Gaps filled: ${rec.gapsFilled.join(', ')}`);
}
```

### Full Analysis (Convenience Function)

```typescript
import { analyzeProject } from './src/intelligence/fingerprint.js';

const report = await analyzeProject('/path/to/project', availablePlugins);
console.log(JSON.stringify(report, null, 2));
```

## Configuration

### Support and Confidence Thresholds

The AprioriMiner accepts two thresholds:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `minSupport` | 0.3 | Minimum fraction of profiles containing an itemset to be "frequent" |
| `minConfidence` | 0.6 | Minimum conditional probability for a rule to be emitted |

Lower support finds more rules but may include noise. Higher confidence produces more reliable gap predictions.

### Gap Filtering

Only gaps with confidence >= 0.6 are surfaced to users. This threshold is hardcoded in `ProjectFingerprinter.findGaps()` to avoid noisy suggestions.

### Training Data

The Apriori miner learns from `config/project-profiles.json`. Add new profiles to improve rule quality:

```json
{
  "label": "my-custom-stack",
  "features": ["typescript", "react", "nextjs", "docker", "ci-cd", "monitoring"]
}
```

More diverse profiles = better association rules = more accurate gap detection.
