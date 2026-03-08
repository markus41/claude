---
name: supply-chain-security
description: Supply chain security model for the marketplace plugin ecosystem
triggers:
  - plugin security
  - trust score
  - security audit
  - permission sandbox
  - verify plugin
  - plugin permissions
  - cpkg verify
  - dangerous patterns
---

# Supply Chain Security & Trust Scoring

This skill documents the marketplace plugin security model, including how plugins are verified, sandboxed, scored, and audited.

## Architecture Overview

The security module (`src/security/trust-engine.ts`) provides four interlocking components:

```
                   .cpkg Bundle
                       |
                       v
              +------------------+
              | SignatureVerifier |  Integrity check (SHA-512)
              +------------------+
                       |
                       v
              +------------------+
              | SecurityAuditor  |  Static code analysis
              +------------------+
                       |
                       v
              +------------------+
              | PermissionSandbox|  Permission boundary enforcement
              +------------------+
                       |
                       v
              +------------------+
              |   TrustScorer    |  Composite trust score (0-100)
              +------------------+
                       |
                       v
                  Trust Report
```

## 1. Signature Verification

### How It Works

Every `.cpkg` bundle can include a `__signature__.json` containing:

```json
{
  "algorithm": "sha512",
  "checksum": "a1b2c3d4e5f6...",
  "author": {
    "identity": "user@example.com",
    "provider": "github",
    "verified": true
  },
  "timestamp": "2026-02-20T14:30:00Z",
  "transparencyLogEntry": "24f9a8b3-1234-4abc-9def-567890abcdef"
}
```

The verifier:
1. Recomputes SHA-512 of the bundle content (excluding the signature block)
2. Performs constant-time comparison against the stored checksum
3. Validates the author identity against supported providers (github, google, microsoft, gitlab)
4. Checks the timestamp is not in the future and not expired (>2 years)
5. Optionally validates the transparency log entry format (Rekor UUID or hex)

### Using the Verifier

```typescript
import { SignatureVerifier } from './trust-engine';

const verifier = new SignatureVerifier();
const result = await verifier.verify(bundleBuffer, signatureInfo);

if (result.valid) {
  console.log('Bundle verified:', result.details);
} else {
  console.error('Verification failed:', result.status, result.errors);
}
```

### Verification Statuses

| Status | Meaning |
|--------|---------|
| `verified` | Checksum matches, author valid, timestamp in range |
| `tampered` | Checksum mismatch or invalid algorithm |
| `unsigned` | No signature metadata present |
| `expired` | Signature older than max age (default 2 years) |
| `unknown-signer` | Identity provider not in allowed list |

## 2. Permission Sandbox

### Permission Model

Plugins declare their resource requirements in the manifest:

```json
{
  "permissions": {
    "filesystem": ["read:./src", "write:./dist"],
    "network": ["api.github.com", "*.npmjs.org"],
    "exec": ["npm", "docker"],
    "env": ["AWS_REGION", "NODE_ENV"]
  }
}
```

**Permission string conventions:**
- **filesystem**: `<access>:<path>` where access is `read` or `write`. Write implies read. Paths are relative to plugin root.
- **network**: Exact hostnames or wildcard patterns (`*.example.com` matches any subdomain).
- **exec**: Binary names the plugin may spawn via child_process.
- **env**: Environment variable names the plugin may read from `process.env`.

### Script Validation

The sandbox statically analyzes hook scripts to detect undeclared resource access:

```typescript
import { PermissionSandbox } from './trust-engine';

const sandbox = new PermissionSandbox(
  { filesystem: ['read:./src'], network: ['api.github.com'], exec: ['npm'], env: ['NODE_ENV'] },
  '/path/to/plugin'
);

const result = sandbox.validateScript(hookScriptContent);
if (!result.allowed) {
  for (const v of result.violations) {
    console.warn(`Line ${v.line}: undeclared ${v.category} access to ${v.resource}`);
  }
}
```

### Shell Wrapper Generation

For runtime enforcement, the sandbox generates restricted shell wrappers:

```typescript
const wrapper = sandbox.generateWrapper(originalScript);
// wrapper.script contains the restricted bash script
// wrapper.allowedEnv lists exposed environment variables
// wrapper.allowedPaths lists accessible filesystem paths
```

The wrapper:
- Unsets all environment variables except those in the allowlist
- Restricts PATH to standard binary directories
- Includes an exec guard function that blocks undeclared binaries
- Documents filesystem and network boundaries (actual OS-level enforcement requires additional tooling)

## 3. Trust Scoring

### Scoring Formula

The trust score is a weighted linear combination of five factors:

```
overall = signed * 0.30
        + reputation * 0.20
        + codeAnalysis * 0.25
        + community * 0.15
        + freshness * 0.10
```

Each factor produces a 0-100 sub-score. The overall score maps to a letter grade:

| Grade | Range | Meaning |
|-------|-------|---------|
| A | 90-100 | Fully trusted |
| B | 80-89 | Good, minor concerns |
| C | 60-79 | Fair, review before installing |
| D | 40-59 | Poor, proceed with caution |
| F | 0-39 | Failing, do not install |

### Factor Details

**Signed & Verified (30%)**
- Binary: 100 if bundle is signed and verified, 0 otherwise
- This is the single most impactful factor

**Author Reputation (20%)**
- Published plugin count: 0-50 points (logarithmic scale, caps at 10+ plugins)
- Account age: 0-50 points (linear, caps at 365+ days)
- Identity verification bonus: +10 points

**Code Analysis (25%)**
- Starts at 100, deducts per finding:
  - Critical: -25 each
  - High: -15 each
  - Medium: -8 each
  - Low: -3 each

**Community Signals (15%)**
- Install count: 0-60 points (log-normalized against marketplace max)
- Issue resolution rate: 0-40 points (direct percentage)

**Freshness (10%)**
- Recency: 0-60 points (full at <=30 days, zero at >=365 days, linear between)
- Dependency currency: 0-40 points (ratio of up-to-date dependencies)

### Using the Scorer

```typescript
import { TrustScorer } from './trust-engine';

const scorer = new TrustScorer();
const score = scorer.score({
  verification: verifyResult,
  author: { publishedPluginCount: 5, accountCreated: '2024-01-01', identityVerified: true },
  audit: auditResult,
  community: { installCount: 1200, maxInstallCount: 50000, issueResolutionRate: 0.85, stars: 45 },
  freshness: { lastUpdated: '2026-02-10', dependencyCurrency: 0.92 },
});

console.log(`Score: ${score.overall}/100 (${score.grade})`);
for (const [name, factor] of Object.entries(score.factors)) {
  console.log(`  ${name}: ${factor.score}/100 [${factor.weight * 100}%] -- ${factor.details}`);
}
```

## 4. Security Auditor

### What It Scans

The auditor scans all source files (`.ts`, `.js`, `.sh`, `.py`, `.json`, `.yaml`, etc.) for:

**Critical patterns:**
- `eval()` and `new Function()` -- code injection vectors
- `vm.runInContext()` -- unsafe VM execution
- Template literals in exec/spawn -- shell injection
- Hardcoded AWS keys, GitHub tokens, private keys, connection strings
- Hardcoded secrets/tokens/passwords (generic pattern)

**High patterns:**
- String concatenation in exec() calls
- `spawn()` with `shell: true`
- Undeclared network access (fetch, http, axios, WebSocket)
- Hardcoded JWTs
- `__proto__` access -- prototype pollution
- Unsafe deserialization (yaml.load)

**Medium patterns:**
- Dynamic `require()` with variable paths
- Writing to system directories (`/etc`, `/usr`, etc.)
- `process.exit()` in plugins
- Environment variable modification (`process.env[...] = ...`)
- `constructor.prototype` manipulation

**Low patterns:**
- Logging potentially sensitive data

### Running an Audit

```typescript
import { SecurityAuditor } from './trust-engine';

const auditor = new SecurityAuditor();
const report = await auditor.audit('my-plugin', '/path/to/plugin', declaredPermissions);

console.log(`Audit ${report.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Findings: ${report.findings.length}`);

// Permission gap analysis
if (report.permissionAnalysis.undeclared.network?.length) {
  console.warn('Undeclared network access:', report.permissionAnalysis.undeclared.network);
}
```

### Scan Configuration

Skip directories: `node_modules`, `.git`, `dist`, `build`, `.next`, `coverage`, `__pycache__`
Max file size: 512 KB (skip minified bundles)
Comment lines are excluded to reduce false positives.

### Custom Patterns

You can extend the scanner with custom patterns:

```typescript
import { SecurityAuditor, DANGEROUS_PATTERNS } from './trust-engine';
import type { DangerousPattern } from './types';

const customPattern: DangerousPattern = {
  id: 'custom-check',
  name: 'Custom security check',
  pattern: /dangerousFunction\s*\(/,
  severity: 'high',
  category: 'custom',
  description: 'Usage of dangerousFunction() detected',
  recommendation: 'Replace with safeAlternative()',
};

const auditor = new SecurityAuditor([...DANGEROUS_PATTERNS, customPattern]);
```

## 5. Pipeline Convenience

For typical usage, use `createSecurityPipeline()` to get all components wired together:

```typescript
import { createSecurityPipeline } from './trust-engine';

const manifest = JSON.parse(await readFile('plugin.json', 'utf-8'));
const pipeline = createSecurityPipeline('/path/to/plugin', manifest);

// All components ready:
// pipeline.verifier   -- SignatureVerifier
// pipeline.sandbox    -- PermissionSandbox
// pipeline.scorer     -- TrustScorer
// pipeline.auditor    -- SecurityAuditor
// pipeline.permissions -- parsed PluginPermissions
```

## Commands

| Command | Description |
|---------|-------------|
| `/mp:trust <plugin>` | Full trust score and security audit |
| `/mp:trust <plugin> --audit-only` | Security audit without scoring |
| `/mp:trust <plugin> --score-only` | Trust score summary |
| `/mp:verify <target>` | Verify `.cpkg` bundle or plugin signature |

## File Locations

| File | Purpose |
|------|---------|
| `src/security/types.ts` | All TypeScript interfaces and types |
| `src/security/trust-engine.ts` | Core engine implementation (4 classes) |
| `commands/trust.md` | `/mp:trust` command definition |
| `commands/verify.md` | `/mp:verify` command definition |
| `skills/security/SKILL.md` | This documentation |
