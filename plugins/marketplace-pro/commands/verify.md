---
name: mp:verify
intent: Verify signature integrity of a .cpkg plugin bundle
tags:
  - marketplace-pro
  - command
  - verify
inputs: []
risk: medium
cost: medium
description: Verify signature integrity of a .cpkg plugin bundle
allowed-tools:
  - Read
  - Bash
  - Glob
---

# Verify Plugin Bundle Signature

Verify the cryptographic signature and integrity of a `.cpkg` plugin bundle or installed plugin.

## Usage

```bash
/mp:verify <target> [options]
```

## Arguments

| Argument | Description |
|----------|-------------|
| `target` | Path to a `.cpkg` file OR name of an installed plugin |
| `--check-log` | Also verify the transparency log entry (requires network) |
| `--verbose` | Show full checksum values and detailed verification steps |
| `--json` | Output raw JSON instead of formatted report |

## What It Does

1. Locates the bundle or plugin signature metadata
2. Reads the `__signature__.json` from the bundle (or `signature.json` from installed plugin)
3. Computes SHA-512 checksum of the bundle content
4. Compares computed checksum against the stored checksum
5. Validates author identity and timestamp
6. Optionally checks the transparency log entry format
7. Displays verification status with details

## Implementation

When this command is invoked, follow these steps:

### Step 1: Locate Target

For a `.cpkg` file path:
```typescript
const bundleContent = await readFile(targetPath);
const signatureInfo = extractSignatureFromBundle(bundleContent);
```

For an installed plugin name:
```typescript
const sigPath = `plugins/${pluginName}/.claude-plugin/signature.json`;
const signatureInfo = JSON.parse(await readFile(sigPath, 'utf-8'));
```

### Step 2: Verify Signature

```typescript
import { SignatureVerifier } from '../src/security/trust-engine';

const verifier = new SignatureVerifier();
const result = await verifier.verify(bundleContent, signatureInfo);
```

### Step 3: Display Results

Format and display the verification result as shown in the output section below.

## Examples

```bash
# Verify a .cpkg bundle file
/mp:verify ./downloads/my-plugin-1.2.0.cpkg

# Verify an installed plugin
/mp:verify my-plugin

# Verify with transparency log check
/mp:verify my-plugin --check-log

# Full detail output
/mp:verify my-plugin --verbose
```

## Output: Verified

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Signature Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Status:     VERIFIED
  Algorithm:  SHA-512
  Checksum:   a1b2c3d4e5f6...  (verified)

  Author:     user@example.com via github (verified)
  Signed:     2026-02-20T14:30:00Z
  Log Entry:  24f9a8b3-1234-4abc-9def-567890abcdef

  Verification Steps:
    [PASS] Checksum: SHA-512 match confirmed
    [PASS] Author: identity verified via github
    [PASS] Timestamp: within validity window
    [PASS] Transparency log: entry format valid

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Output: Failed Verification

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Signature Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Status:     TAMPERED
  Algorithm:  SHA-512

  Errors:
    [FAIL] Checksum mismatch: bundle content has been
           modified after signing
           Computed: 7f8e9d0c1b2a...
           Stored:   a1b2c3d4e5f6...

  WARNING: This bundle may have been tampered with.
  Do NOT install this plugin without investigating.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Output: Unsigned Bundle

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Signature Verification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  Status:     UNSIGNED

  This bundle does not contain a signature.
  Integrity cannot be verified.

  Recommendation:
    Ask the plugin author to sign their releases.
    Unsigned plugins receive a trust score penalty of -30 points.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

## Verification Status Codes

| Status | Meaning |
|--------|---------|
| VERIFIED | Bundle is intact and signature is valid |
| TAMPERED | Checksum mismatch -- content was modified after signing |
| UNSIGNED | No signature metadata found in bundle |
| EXPIRED | Signature is older than the maximum allowed age (2 years) |
| UNKNOWN-SIGNER | Author identity provider is not recognized |

## See Also

- `/mp:trust` - Full trust score and security audit
- Signature format: `src/security/types.ts` (SignatureInfo interface)
- Verification engine: `src/security/trust-engine.ts` (SignatureVerifier class)
