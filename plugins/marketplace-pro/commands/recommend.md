---
name: mp:recommend
description: Scan the current project and recommend plugins based on detected stack, patterns, and capability gaps
arguments: "[--verbose] [--dir <path>] [--top <n>]"
---

# Plugin Recommendation Engine

Analyze the current project and recommend relevant plugins: $ARGUMENTS

## Process

### 1. Scan Project Fingerprint

Run the ProjectFingerprinter to detect the project's technology stack:

```typescript
import { ProjectFingerprinter } from '../src/intelligence/fingerprint.js';

const projectDir = '$DIR' || process.cwd();
const fingerprinter = new ProjectFingerprinter(projectDir);
const fingerprint = await fingerprinter.scan();
```

Display the fingerprint summary:

```
=== Project Fingerprint ===
Frameworks:  [list detected frameworks]
Languages:   [language: proportion for each]
Infra:       [list infrastructure]
Patterns:    [list architectural patterns]
Files:       [list of detected config files]
```

### 2. Detect Capability Gaps

The Apriori association rule miner automatically runs during scanning to find missing capabilities. Display the gaps:

```
=== Detected Gaps ===
For each gap:
  - [feature] (confidence: [X]%) — typically found with: [associated features]
```

If `--verbose` is specified, also show the full list of mined association rules:

```
=== Association Rules (--verbose) ===
{antecedent} => {consequent}
  support: X%  confidence: Y%  lift: Z
```

### 3. Recommend Plugins

Load available plugins from the registry and run the RecommendationEngine:

```typescript
import { RecommendationEngine } from '../src/intelligence/fingerprint.js';

const engine = new RecommendationEngine();
const report = engine.recommend(fingerprint, availablePlugins, topN);
```

Display ranked recommendations:

```
=== Plugin Recommendations ===
Rank  Plugin                 Relevance  Gaps Filled
----  --------------------   ---------  ----------------------
1.    [plugin-name]          [0.XX]     [gap1, gap2]
      Reason: [human-readable explanation]

2.    [plugin-name]          [0.XX]     [gap1]
      Reason: [human-readable explanation]
...
```

### 4. Summary

```
=== Summary ===
Project: [primary language] / [frameworks] / [infra]
Patterns: [detected patterns]
Gaps found: [N] capability gaps detected
Recommendations: [M] plugins ranked by relevance
Scan date: [ISO timestamp]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `--verbose` | Show full association rules and detailed scoring breakdown |
| `--dir <path>` | Scan a specific directory (default: current working directory) |
| `--top <n>` | Number of recommendations to show (default: 10) |

## Examples

```
/mp:recommend
/mp:recommend --verbose
/mp:recommend --dir /path/to/project --top 5
/mp:recommend --verbose --top 20
```

## How It Works

1. **Fingerprinting**: Scans package.json, pyproject.toml, go.mod, Cargo.toml, and directory structure to detect frameworks, languages, infrastructure, and patterns.

2. **Association Mining (Apriori)**: Uses a dataset of ~20 realistic project profiles to learn which features commonly co-occur. When your project has {kubernetes, helm} but not {ci-cd}, and 85% of projects with kubernetes+helm also have ci-cd, that becomes a detected gap.

3. **Cosine Similarity**: Converts both project features and plugin capabilities into binary vectors over a shared vocabulary. Computes cosine similarity to measure feature overlap.

4. **Gap-Weighted Scoring**: Final relevance = 60% cosine similarity + 40% gap coverage (weighted by confidence). Plugins that fill high-confidence gaps rank higher.
