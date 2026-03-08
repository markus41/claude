---
name: mp:trust
intent: Compute supply chain trust score and security audit for a plugin
tags:
  - marketplace-pro
  - command
  - trust
inputs: []
risk: medium
cost: medium
description: Compute supply chain trust score and security audit for a plugin
allowed-tools:
  - Read
  - Grep
  - Glob
  - Bash
---

# Plugin Trust Score & Security Audit

Run a full supply chain security analysis on a plugin, computing a composite trust score and detailed security audit.

## Usage

```bash
/mp:trust <plugin-name> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `plugin-name` | Name of the installed plugin to analyze |
| `--audit-only` | Only run the security audit (skip trust scoring) |
| `--score-only` | Only compute the trust score (skip detailed audit output) |
| `--verbose` | Show all findings including low severity |
| `--json` | Output raw JSON instead of formatted report |

## What It Does

1. Locates the plugin in `plugins/<plugin-name>/`
2. Reads the plugin manifest (`.claude-plugin/plugin.json`) for declared permissions
3. Runs `SecurityAuditor.audit()` -- scans all source files for dangerous patterns
4. Runs `TrustScorer.score()` -- computes weighted composite trust score
5. Compares declared vs detected permissions to find undeclared access
6. Displays formatted report with actionable recommendations

## Implementation

When this command is invoked, follow these steps:

### Step 1: Locate Plugin

```typescript
const pluginRoot = `plugins/${pluginName}`;
const manifestPath = `${pluginRoot}/.claude-plugin/plugin.json`;
```

Read the manifest and extract `permissions` field. If no manifest exists, report error and exit.

### Step 2: Run Security Audit

Use `SecurityAuditor` from `src/security/trust-engine.ts`:

```typescript
import { SecurityAuditor, TrustScorer, createSecurityPipeline } from '../src/security/trust-engine';

const pipeline = createSecurityPipeline(pluginRoot, manifest);
const audit = await pipeline.auditor.audit(pluginName, pluginRoot, pipeline.permissions);
```

### Step 3: Compute Trust Score

Gather inputs and run the scorer:

```typescript
const score = pipeline.scorer.score({
  verification,  // from signature check
  author,         // from registry metadata
  audit,          // from step 2
  community,      // from registry metadata
  freshness,      // from manifest/git metadata
});
```

### Step 4: Display Results

Format and display the report as shown in the output section below.

## Examples

```bash
# Full trust analysis
/mp:trust my-plugin

# Security audit only (faster, no network lookups)
/mp:trust my-plugin --audit-only

# Just the trust score summary
/mp:trust my-plugin --score-only

# Machine-readable output
/mp:trust my-plugin --json
```

## Output: Full Report

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Supply Chain Trust Report: my-plugin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  TRUST SCORE: 78/100 (Grade: C)

  Factor Breakdown:
  ──────────────────────────────────────────────────────────
  Signed & Verified   [30%]  100/100  Bundle signed by user@github (verified)
  Author Reputation   [20%]   65/100  3 published plugins, account 2y old
  Code Analysis       [25%]   52/100  1 high, 2 medium findings
  Community Signals   [15%]   85/100  12,450 installs, 92% issues resolved
  Freshness           [10%]   80/100  Updated 15 days ago, 90% deps current

  Warnings:
  ──────────────────────────────────────────────────────────
  ! Security scan found significant concerns
  ! 2 undeclared permission(s) detected in source code

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Security Audit
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Scan Date: 2026-02-23T10:30:00Z
  Files Scanned: 24
  Status: FAILED (1 high, 2 medium findings)

  Findings:
  ──────────────────────────────────────────────────────────
  [HIGH] network-access in src/api/client.ts:42
    Undeclared network access (fetch)
    -> Add target host to permissions.network

  [MEDIUM] code-injection in src/utils/transform.ts:18
    Dynamic require() with variable path
    -> Use static require() paths or validate input

  [MEDIUM] environment-mutation in src/config.ts:7
    Environment variable modification
    -> Use local config objects instead of process.env

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Permission Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Declared Permissions:
    filesystem: read:./src, write:./dist
    network:    api.github.com
    exec:       npm
    env:        AWS_REGION

  Detected in Source:
    filesystem: read:./src, write:./dist, read:./config
    network:    api.github.com, registry.npmjs.org
    exec:       npm, docker
    env:        AWS_REGION, DATABASE_URL

  UNDECLARED (not in manifest):
    ! network:    registry.npmjs.org
    ! exec:       docker
    ! env:        DATABASE_URL

  Recommendation:
    Add undeclared permissions to plugin.json or remove
    the undeclared access from source code.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Output: Score Only (--score-only)

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Trust Score: my-plugin
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  SCORE: 78/100 (Grade: C)

  Signed        [30%]  100   Author Reputation  [20%]  65
  Code Analysis [25%]   52   Community          [15%]  85
  Freshness     [10%]   80

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Output: Audit Only (--audit-only)

Displays only the "Security Audit" and "Permission Analysis" sections from the full report.

## Grade Thresholds

| Grade | Score Range | Meaning |
|-------|-------------|---------|
| A | 90-100 | Excellent -- fully trusted, signed, clean audit |
| B | 80-89 | Good -- minor concerns only |
| C | 60-79 | Fair -- some issues to review before installing |
| D | 40-59 | Poor -- significant concerns, proceed with caution |
| F | 0-39 | Failing -- do not install without thorough review |

## See Also

- `/mp:verify` - Verify a specific `.cpkg` bundle signature
- Plugin manifest permissions: `.claude-plugin/plugin.json`
- Security engine source: `src/security/trust-engine.ts`
