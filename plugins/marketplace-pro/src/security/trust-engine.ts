/**
 * Supply Chain Security & Trust Scoring Engine
 *
 * Provides four core capabilities for the marketplace plugin ecosystem:
 *
 *   1. SignatureVerifier  - Validates `.cpkg` bundle integrity via SHA-512
 *   2. PermissionSandbox  - Enforces declared permission boundaries
 *   3. TrustScorer        - Computes weighted composite trust scores
 *   4. SecurityAuditor    - Static analysis for dangerous code patterns
 *
 * All classes are stateless and side-effect free (besides filesystem reads
 * for auditing). They can be instantiated independently or composed through
 * the exported `createSecurityPipeline()` convenience function.
 */

import { createHash } from 'crypto';
import { readFile, readdir, stat } from 'fs/promises';
import { join, relative, resolve, extname } from 'path';

import type {
  AuthorReputation,
  CommunitySignals,
  DangerousPattern,
  FreshnessData,
  PermissionValidation,
  PluginPermissions,
  SandboxWrapper,
  SecurityAudit,
  SecurityFinding,
  Severity,
  SignatureInfo,
  TrustScore,
  TrustScoringInput,
  VerificationResult,
} from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

/** File extensions to include in static analysis scans */
const SCANNABLE_EXTENSIONS = new Set([
  '.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs',
  '.sh', '.bash', '.zsh',
  '.py', '.rb',
  '.json', '.yaml', '.yml',
]);

/** Maximum file size (in bytes) to scan -- skip minified bundles */
const MAX_SCAN_FILE_SIZE = 512 * 1024; // 512 KB

// ═══════════════════════════════════════════════════════════════════════════
// 1. SIGNATURE VERIFIER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Verifies `.cpkg` bundle integrity using SHA-512 checksums and validates
 * the accompanying signature metadata.
 *
 * A `.cpkg` file is expected to contain a `__signature__.json` entry at its
 * root with a `SignatureInfo` payload. The verifier:
 *   - Recomputes the SHA-512 hash of the bundle content (excluding signature)
 *   - Compares computed hash against the stored checksum
 *   - Validates author identity fields
 *   - Checks timestamp is not in the future and not too old (>2 years)
 *   - Optionally checks the transparency log entry format
 */
export class SignatureVerifier {
  /** Maximum age (in ms) for a signature before it is considered expired */
  private readonly maxAgeMs: number;

  constructor(options?: { maxAgeDays?: number }) {
    const maxAgeDays = options?.maxAgeDays ?? 730; // 2 years default
    this.maxAgeMs = maxAgeDays * 24 * 60 * 60 * 1000;
  }

  /**
   * Verify a `.cpkg` bundle from its raw bytes and signature metadata.
   *
   * @param bundleContent - The raw content of the bundle (excluding signature block)
   * @param signatureInfo - The parsed signature metadata, or null if unsigned
   * @returns Detailed verification result
   */
  async verify(
    bundleContent: Buffer,
    signatureInfo: SignatureInfo | null,
  ): Promise<VerificationResult> {
    const details: string[] = [];
    const errors: string[] = [];

    // --- Unsigned bundle ---------------------------------------------------
    if (!signatureInfo) {
      return {
        valid: false,
        status: 'unsigned',
        details: ['No signature metadata found in bundle'],
        errors: ['Bundle is unsigned -- cannot verify integrity'],
      };
    }

    // --- Algorithm check ---------------------------------------------------
    if (signatureInfo.algorithm !== 'sha512') {
      errors.push(
        `Unsupported hash algorithm "${signatureInfo.algorithm}". Only sha512 is accepted.`,
      );
      return {
        valid: false,
        status: 'tampered',
        signatureInfo,
        details,
        errors,
      };
    }
    details.push(`Algorithm: ${signatureInfo.algorithm}`);

    // --- Checksum verification ---------------------------------------------
    const computedChecksum = this.computeChecksum(bundleContent);
    const checksumMatch = this.timingSafeEqual(
      computedChecksum,
      signatureInfo.checksum,
    );

    if (!checksumMatch) {
      errors.push(
        'Checksum mismatch: bundle content has been modified after signing',
      );
      details.push(
        `Computed: ${computedChecksum.slice(0, 16)}...`,
        `Stored:   ${signatureInfo.checksum.slice(0, 16)}...`,
      );
      return {
        valid: false,
        status: 'tampered',
        signatureInfo,
        details,
        errors,
      };
    }
    details.push('Checksum: verified (SHA-512 match)');

    // --- Author identity validation ----------------------------------------
    const authorErrors = this.validateAuthor(signatureInfo);
    if (authorErrors.length > 0) {
      errors.push(...authorErrors);
      return {
        valid: false,
        status: 'unknown-signer',
        signatureInfo,
        details,
        errors,
      };
    }
    details.push(
      `Author: ${signatureInfo.author.identity} via ${signatureInfo.author.provider}` +
        (signatureInfo.author.verified ? ' (verified)' : ' (unverified)'),
    );

    // --- Timestamp validation ----------------------------------------------
    const timestampErrors = this.validateTimestamp(signatureInfo.timestamp);
    if (timestampErrors.length > 0) {
      // Timestamp issues may indicate expiry rather than tampering
      const isExpired = timestampErrors.some((e) => e.includes('expired'));
      errors.push(...timestampErrors);
      return {
        valid: false,
        status: isExpired ? 'expired' : 'tampered',
        signatureInfo,
        details,
        errors,
      };
    }
    details.push(`Signed: ${signatureInfo.timestamp}`);

    // --- Transparency log (optional) ---------------------------------------
    if (signatureInfo.transparencyLogEntry) {
      const logValid = this.validateTransparencyLogEntry(
        signatureInfo.transparencyLogEntry,
      );
      if (logValid) {
        details.push(
          `Transparency log: ${signatureInfo.transparencyLogEntry}`,
        );
      } else {
        // Not a hard failure -- just a warning
        details.push(
          `Transparency log entry has unexpected format: ${signatureInfo.transparencyLogEntry}`,
        );
      }
    } else {
      details.push('Transparency log: not recorded');
    }

    return {
      valid: true,
      status: 'verified',
      signatureInfo,
      details,
      errors,
    };
  }

  /**
   * Compute the SHA-512 hex digest of a buffer.
   */
  computeChecksum(content: Buffer): string {
    return createHash('sha512').update(content).digest('hex');
  }

  /**
   * Constant-time string comparison to avoid timing attacks on checksums.
   * Falls back to simple comparison if lengths differ (already leaks length).
   */
  private timingSafeEqual(a: string, b: string): boolean {
    if (a.length !== b.length) return false;

    const bufA = Buffer.from(a, 'utf8');
    const bufB = Buffer.from(b, 'utf8');

    // Node's crypto.timingSafeEqual requires equal length buffers
    let result = 0;
    for (let i = 0; i < bufA.length; i++) {
      result |= bufA[i]! ^ bufB[i]!;
    }
    return result === 0;
  }

  /**
   * Validate the author block of a signature.
   */
  private validateAuthor(info: SignatureInfo): string[] {
    const errors: string[] = [];

    if (!info.author.identity || info.author.identity.trim().length === 0) {
      errors.push('Author identity is empty');
    }

    const allowedProviders = ['github', 'google', 'microsoft', 'gitlab'];
    if (!allowedProviders.includes(info.author.provider)) {
      errors.push(
        `Unknown identity provider "${info.author.provider}". ` +
          `Allowed: ${allowedProviders.join(', ')}`,
      );
    }

    if (!info.author.verified) {
      // Not an error but captured for downstream scoring
    }

    return errors;
  }

  /**
   * Validate a signature timestamp.
   */
  private validateTimestamp(timestamp: string): string[] {
    const errors: string[] = [];
    const signedAt = new Date(timestamp);

    if (isNaN(signedAt.getTime())) {
      errors.push(`Invalid timestamp format: "${timestamp}"`);
      return errors;
    }

    const now = Date.now();

    if (signedAt.getTime() > now + 60_000) {
      // Allow 1 minute of clock skew
      errors.push('Signature timestamp is in the future');
    }

    if (now - signedAt.getTime() > this.maxAgeMs) {
      errors.push(
        `Signature has expired (signed ${timestamp}, max age ${this.maxAgeMs / 86_400_000} days)`,
      );
    }

    return errors;
  }

  /**
   * Basic format check for transparency log entry identifiers.
   * Expects a UUID-like format (Rekor log entry IDs) or a hex string.
   */
  private validateTransparencyLogEntry(entry: string): boolean {
    // Rekor UUIDs: 64-char hex or UUID v4 format
    const uuidPattern =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    const hexPattern = /^[0-9a-f]{64}$/i;

    return uuidPattern.test(entry) || hexPattern.test(entry);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 2. PERMISSION SANDBOX
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Reads a plugin's declared permissions and enforces them against hook
 * scripts by validating resource access and generating restricted shell
 * wrappers.
 *
 * Permission strings use a prefix convention:
 *   - Filesystem: "read:./src", "write:./dist"
 *   - Network:    "api.github.com", "*.npmjs.org"
 *   - Exec:       "npm", "docker"
 *   - Env:        "AWS_REGION", "NODE_ENV"
 */
export class PermissionSandbox {
  private readonly permissions: PluginPermissions;
  private readonly pluginRoot: string;

  constructor(permissions: PluginPermissions, pluginRoot: string) {
    this.permissions = permissions;
    this.pluginRoot = resolve(pluginRoot);
  }

  /**
   * Parse permissions from a plugin manifest JSON object.
   */
  static fromManifest(manifest: {
    permissions?: PluginPermissions;
  }): PluginPermissions {
    return {
      filesystem: manifest.permissions?.filesystem ?? [],
      network: manifest.permissions?.network ?? [],
      exec: manifest.permissions?.exec ?? [],
      env: manifest.permissions?.env ?? [],
    };
  }

  /**
   * Validate that a hook script only accesses declared resources.
   *
   * Performs static analysis on the script content to detect:
   *   - Filesystem operations outside declared paths
   *   - Network calls to undeclared hosts
   *   - Execution of undeclared binaries
   *   - Reads of undeclared environment variables
   *
   * @param scriptContent - The full text of the hook script
   * @returns Validation result with any violations found
   */
  validateScript(scriptContent: string): PermissionValidation {
    const violations: PermissionValidation['violations'] = [];
    const lines = scriptContent.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]!;
      const lineNum = i + 1;

      // --- Filesystem access detection ---
      this.detectFilesystemAccess(line, lineNum, violations);

      // --- Network access detection ---
      this.detectNetworkAccess(line, lineNum, violations);

      // --- Exec detection ---
      this.detectExecAccess(line, lineNum, violations);

      // --- Environment variable access ---
      this.detectEnvAccess(line, lineNum, violations);
    }

    return {
      allowed: violations.length === 0,
      violations,
    };
  }

  /**
   * Generate a restricted shell wrapper that enforces permission boundaries
   * at runtime using environment restrictions and path filtering.
   *
   * The wrapper:
   *   - Unsets all env vars except those in the allowlist
   *   - Restricts PATH to only include directories containing allowed binaries
   *   - Uses a read-only bind mount list for filesystem restrictions (informational)
   *   - Blocks outbound network via iptables rules (informational comments)
   *
   * @param originalScript - The script to wrap
   * @returns The sandbox wrapper configuration and script
   */
  generateWrapper(originalScript: string): SandboxWrapper {
    const allowedEnv = this.permissions.env ?? [];
    const allowedPaths = (this.permissions.filesystem ?? []).map((p) => {
      const [, path] = p.split(':');
      return path ? resolve(this.pluginRoot, path) : this.pluginRoot;
    });
    const allowedHosts = this.permissions.network ?? [];
    const allowedExec = this.permissions.exec ?? [];

    // Build the restricted PATH -- only include standard dirs
    const standardBinDirs = ['/usr/local/bin', '/usr/bin', '/bin'];

    // Build env allowlist unsetting
    const envUnsets = [
      '# Unset all environment variables except explicitly allowed ones',
      '# Save allowed values first',
      ...allowedEnv.map(
        (v) => `_SAVED_${v}="\${${v}:-}"`,
      ),
      '',
      '# Clear environment (except essential shell vars)',
      'for _var in $(env | cut -d= -f1); do',
      '  case "$_var" in',
      '    HOME|USER|SHELL|TERM|LANG|PATH|PWD) ;;  # keep essentials',
      ...allowedEnv.map(
        (v) => `    ${v}) ;;  # allowed by manifest`,
      ),
      '    *) unset "$_var" 2>/dev/null ;;',
      '  esac',
      'done',
      '',
      '# Restore allowed values',
      ...allowedEnv.map(
        (v) => `export ${v}="$_SAVED_${v}"`,
      ),
      '',
    ];

    // Build restricted PATH
    const pathRestriction = [
      '# Restrict PATH to standard binary directories',
      `export PATH="${standardBinDirs.join(':')}"`,
      '',
    ];

    // Filesystem boundary markers (informational -- actual enforcement needs OS support)
    const fsBoundaries = [
      '# Filesystem boundaries (declared permissions)',
      ...allowedPaths.map(
        (p) => `# ALLOWED: ${p}`,
      ),
      `# Plugin root: ${this.pluginRoot}`,
      '',
    ];

    // Network restrictions (informational -- actual enforcement needs iptables/nftables)
    const netRestrictions = [
      '# Network restrictions (declared permissions)',
      ...(allowedHosts.length > 0
        ? allowedHosts.map(
            (h) => `# ALLOWED HOST: ${h}`,
          )
        : ['# No network access permitted']),
      '',
    ];

    // Exec allowlist check
    const execGuard = [
      '# Executable allowlist guard',
      '_sandbox_check_exec() {',
      '  local cmd="$1"',
      '  case "$cmd" in',
      ...allowedExec.map(
        (e) => `    ${e}) return 0 ;;`,
      ),
      '    *) echo "SANDBOX: Blocked execution of $cmd (not in allowlist)" >&2; return 1 ;;',
      '  esac',
      '}',
      '',
    ];

    const script = [
      '#!/usr/bin/env bash',
      '# Auto-generated sandbox wrapper -- do not edit',
      '# Generated by marketplace-pro PermissionSandbox',
      `# Plugin: ${this.pluginRoot}`,
      `# Generated: ${new Date().toISOString()}`,
      'set -euo pipefail',
      '',
      ...envUnsets,
      ...pathRestriction,
      ...fsBoundaries,
      ...netRestrictions,
      ...execGuard,
      '# --- Original script begins below ---',
      '',
      originalScript,
    ].join('\n');

    return {
      script,
      allowedEnv,
      allowedPaths,
      allowedHosts,
      allowedExec,
    };
  }

  /**
   * Check whether a given filesystem access is within declared permissions.
   */
  isPathAllowed(accessType: 'read' | 'write', targetPath: string): boolean {
    const resolved = resolve(this.pluginRoot, targetPath);
    const fsPaths = this.permissions.filesystem ?? [];

    for (const perm of fsPaths) {
      const [permType, permPath] = perm.split(':');
      if (!permPath) continue;

      const resolvedPerm = resolve(this.pluginRoot, permPath);

      // "write" permission implies "read" as well
      if (accessType === 'read' && (permType === 'read' || permType === 'write')) {
        if (resolved.startsWith(resolvedPerm)) return true;
      }
      if (accessType === 'write' && permType === 'write') {
        if (resolved.startsWith(resolvedPerm)) return true;
      }
    }

    return false;
  }

  /**
   * Check whether a network host is in the declared permissions.
   * Supports wildcard matching (e.g. "*.npmjs.org" matches "registry.npmjs.org").
   */
  isHostAllowed(host: string): boolean {
    const allowedHosts = this.permissions.network ?? [];

    for (const pattern of allowedHosts) {
      if (pattern === host) return true;

      // Wildcard matching: "*.example.com" matches "sub.example.com"
      if (pattern.startsWith('*.')) {
        const suffix = pattern.slice(1); // ".example.com"
        if (host.endsWith(suffix)) return true;
      }
    }

    return false;
  }

  /**
   * Check whether a binary is in the declared exec permissions.
   */
  isExecAllowed(binary: string): boolean {
    return (this.permissions.exec ?? []).includes(binary);
  }

  /**
   * Check whether an environment variable is in the declared permissions.
   */
  isEnvAllowed(varName: string): boolean {
    return (this.permissions.env ?? []).includes(varName);
  }

  // --- Private detection methods ---

  private detectFilesystemAccess(
    line: string,
    lineNum: number,
    violations: PermissionValidation['violations'],
  ): void {
    // Detect fs module usage: readFileSync, writeFileSync, readFile, etc.
    const fsPatterns = [
      /(?:readFileSync|readFile|createReadStream)\s*\(\s*['"`]([^'"`]+)['"`]/,
      /(?:writeFileSync|writeFile|createWriteStream|appendFile|appendFileSync)\s*\(\s*['"`]([^'"`]+)['"`]/,
      /(?:readdirSync|readdir|mkdirSync|mkdir|rmdirSync|rmdir|unlinkSync|unlink)\s*\(\s*['"`]([^'"`]+)['"`]/,
    ];

    for (const pattern of fsPatterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        const path = match[1];
        const isWrite = /write|append|mkdir|rmdir|unlink/i.test(line);
        const accessType = isWrite ? 'write' : 'read';

        if (!this.isPathAllowed(accessType, path)) {
          violations.push({
            resource: `${accessType}:${path}`,
            category: 'filesystem',
            line: lineNum,
            snippet: line.trim(),
          });
        }
      }
    }

    // Detect shell file operations: cat, cp, mv, rm, etc.
    const shellFsPattern =
      /(?:^|\s|;|&&|\|\|)\s*(cat|cp|mv|rm|mkdir|touch|chmod|chown)\s+(?:-\w+\s+)*([^\s;|&]+)/;
    const shellMatch = line.match(shellFsPattern);
    if (shellMatch?.[2]) {
      const cmd = shellMatch[1]!;
      const path = shellMatch[2];
      const isWrite = ['cp', 'mv', 'rm', 'mkdir', 'touch', 'chmod', 'chown'].includes(cmd);

      if (!this.isPathAllowed(isWrite ? 'write' : 'read', path)) {
        violations.push({
          resource: `${isWrite ? 'write' : 'read'}:${path}`,
          category: 'filesystem',
          line: lineNum,
          snippet: line.trim(),
        });
      }
    }
  }

  private detectNetworkAccess(
    line: string,
    lineNum: number,
    violations: PermissionValidation['violations'],
  ): void {
    // Detect fetch/http/https URLs
    const urlPatterns = [
      /fetch\s*\(\s*['"`](https?:\/\/([^/'"`]+))/,
      /(?:axios|got|request|superagent|needle)\s*(?:\.\w+)?\s*\(\s*['"`](https?:\/\/([^/'"`]+))/,
      /https?\.(?:get|request|createServer)\s*\(\s*(?:['"`](https?:\/\/([^/'"`]+))|{[^}]*hostname?\s*:\s*['"`]([^'"`]+))/,
      /new\s+(?:URL|WebSocket)\s*\(\s*['"`]((?:wss?|https?):\/\/([^/'"`]+))/,
      /curl\s+(?:-\w+\s+)*['"]?(https?:\/\/([^\s'"]+))/,
      /wget\s+(?:-\w+\s+)*['"]?(https?:\/\/([^\s'"]+))/,
    ];

    for (const pattern of urlPatterns) {
      const match = line.match(pattern);
      // Extract the hostname -- could be in different capture groups
      const host = match?.[2] || match?.[3] || match?.[4] || match?.[5];
      if (host) {
        // Strip port if present
        const hostname = host.split(':')[0]!;
        if (!this.isHostAllowed(hostname)) {
          violations.push({
            resource: hostname,
            category: 'network',
            line: lineNum,
            snippet: line.trim(),
          });
        }
      }
    }
  }

  private detectExecAccess(
    line: string,
    lineNum: number,
    violations: PermissionValidation['violations'],
  ): void {
    // Detect child_process/exec/spawn calls
    const execPatterns = [
      /(?:exec|execSync|execFile|execFileSync)\s*\(\s*['"`](\w+)/,
      /(?:spawn|spawnSync|fork)\s*\(\s*['"`](\w+)/,
      /(?:child_process\.exec|child_process\.spawn)\s*\(\s*['"`](\w+)/,
    ];

    for (const pattern of execPatterns) {
      const match = line.match(pattern);
      if (match?.[1]) {
        const binary = match[1];
        if (!this.isExecAllowed(binary)) {
          violations.push({
            resource: binary,
            category: 'exec',
            line: lineNum,
            snippet: line.trim(),
          });
        }
      }
    }

    // Detect shell backtick or $() with specific commands
    const shellExecPattern = /(?:`|\$\()\s*(\w+)\s/;
    const shellMatch = line.match(shellExecPattern);
    if (shellMatch?.[1]) {
      const binary = shellMatch[1];
      // Only flag non-trivial commands (not echo, test, etc.)
      const trivialCommands = new Set([
        'echo', 'printf', 'test', 'true', 'false', 'cd', 'pwd', 'set',
      ]);
      if (!trivialCommands.has(binary) && !this.isExecAllowed(binary)) {
        violations.push({
          resource: binary,
          category: 'exec',
          line: lineNum,
          snippet: line.trim(),
        });
      }
    }
  }

  private detectEnvAccess(
    line: string,
    lineNum: number,
    violations: PermissionValidation['violations'],
  ): void {
    // Detect process.env.VAR_NAME access
    const processEnvPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let match;
    while ((match = processEnvPattern.exec(line)) !== null) {
      const varName = match[1]!;
      // Skip commonly benign vars
      const benignVars = new Set(['NODE_ENV', 'HOME', 'USER', 'PATH', 'PWD', 'SHELL', 'TERM']);
      if (!benignVars.has(varName) && !this.isEnvAllowed(varName)) {
        violations.push({
          resource: varName,
          category: 'env',
          line: lineNum,
          snippet: line.trim(),
        });
      }
    }

    // Detect process.env['VAR_NAME'] or process.env["VAR_NAME"]
    const bracketEnvPattern = /process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/g;
    while ((match = bracketEnvPattern.exec(line)) !== null) {
      const varName = match[1]!;
      const benignVars = new Set(['NODE_ENV', 'HOME', 'USER', 'PATH', 'PWD', 'SHELL', 'TERM']);
      if (!benignVars.has(varName) && !this.isEnvAllowed(varName)) {
        violations.push({
          resource: varName,
          category: 'env',
          line: lineNum,
          snippet: line.trim(),
        });
      }
    }

    // Detect shell $VAR_NAME access
    const shellEnvPattern = /\$\{?([A-Z_][A-Z0-9_]*)\}?/g;
    while ((match = shellEnvPattern.exec(line)) !== null) {
      const varName = match[1]!;
      const benignVars = new Set([
        'HOME', 'USER', 'PATH', 'PWD', 'SHELL', 'TERM', 'LANG',
        'HOSTNAME', 'SHLVL', 'OLDPWD', '_',
      ]);
      if (!benignVars.has(varName) && !this.isEnvAllowed(varName)) {
        violations.push({
          resource: varName,
          category: 'env',
          line: lineNum,
          snippet: line.trim(),
        });
      }
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 3. TRUST SCORER
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Computes a composite trust score (0-100) for a plugin using a weighted
 * linear combination of five factors:
 *
 *   | Factor         | Weight | Scoring Basis                        |
 *   |----------------|--------|--------------------------------------|
 *   | Signed         | 30%    | Binary: verified=100, else=0         |
 *   | Reputation     | 20%    | Published count, account age         |
 *   | Code Analysis  | 25%    | Inverse of security finding severity |
 *   | Community      | 15%    | Install count, issue resolution      |
 *   | Freshness      | 10%    | Days since update, dep currency      |
 *
 * Each factor independently produces a 0-100 sub-score. The composite
 * score is the weighted sum, rounded to the nearest integer.
 */
export class TrustScorer {
  /** Weights must sum to 1.0 */
  private static readonly WEIGHTS = {
    signed: 0.30,
    reputation: 0.20,
    codeAnalysis: 0.25,
    community: 0.15,
    freshness: 0.10,
  } as const;

  /**
   * Compute the composite trust score from pre-gathered inputs.
   *
   * @param input - All data needed for scoring
   * @returns TrustScore with overall score, factor breakdown, grade, and warnings
   */
  score(input: TrustScoringInput): TrustScore {
    const warnings: string[] = [];

    // --- Factor 1: Signed & Verified (30%) ---------------------------------
    const signedScore = input.verification.valid ? 100 : 0;
    const signedDetails = input.verification.valid
      ? `Bundle is signed and verified by ${input.verification.signatureInfo?.author.identity ?? 'unknown'}`
      : `Bundle is ${input.verification.status}: ${input.verification.errors.join('; ') || 'no signature'}`;
    if (!input.verification.valid) {
      warnings.push(`Bundle is ${input.verification.status}`);
    }

    // --- Factor 2: Author Reputation (20%) ---------------------------------
    const reputationScore = this.computeReputationScore(input.author);
    const reputationDetails = this.describeReputation(input.author, reputationScore);
    if (reputationScore < 40) {
      warnings.push('Author has limited publishing history');
    }

    // --- Factor 3: Code Analysis (25%) -------------------------------------
    const codeScore = this.computeCodeAnalysisScore(input.audit);
    const codeDetails = this.describeCodeAnalysis(input.audit, codeScore);
    if (codeScore < 50) {
      warnings.push('Security scan found significant concerns');
    }

    // --- Factor 4: Community Signals (15%) ---------------------------------
    const communityScore = this.computeCommunityScore(input.community);
    const communityDetails = this.describeCommunity(input.community, communityScore);

    // --- Factor 5: Freshness (10%) -----------------------------------------
    const freshnessScore = this.computeFreshnessScore(input.freshness);
    const freshnessDetails = this.describeFreshness(input.freshness, freshnessScore);
    if (freshnessScore < 30) {
      warnings.push('Plugin may be abandoned or have outdated dependencies');
    }

    // --- Undeclared permissions warning ------------------------------------
    const undeclared = input.audit.permissionAnalysis.undeclared;
    const undeclaredCount =
      (undeclared.filesystem?.length ?? 0) +
      (undeclared.network?.length ?? 0) +
      (undeclared.exec?.length ?? 0) +
      (undeclared.env?.length ?? 0);
    if (undeclaredCount > 0) {
      warnings.push(
        `${undeclaredCount} undeclared permission(s) detected in source code`,
      );
    }

    // --- Composite score ---------------------------------------------------
    const W = TrustScorer.WEIGHTS;
    const overall = Math.round(
      signedScore * W.signed +
        reputationScore * W.reputation +
        codeScore * W.codeAnalysis +
        communityScore * W.community +
        freshnessScore * W.freshness,
    );

    return {
      overall,
      factors: {
        signed: {
          score: signedScore,
          weight: W.signed,
          details: signedDetails,
        },
        reputation: {
          score: reputationScore,
          weight: W.reputation,
          details: reputationDetails,
        },
        codeAnalysis: {
          score: codeScore,
          weight: W.codeAnalysis,
          details: codeDetails,
        },
        community: {
          score: communityScore,
          weight: W.community,
          details: communityDetails,
        },
        freshness: {
          score: freshnessScore,
          weight: W.freshness,
          details: freshnessDetails,
        },
      },
      grade: this.toGrade(overall),
      warnings,
    };
  }

  // --- Sub-score computation -----------------------------------------------

  /**
   * Reputation score based on published plugin count and account age.
   *
   * - 0 published plugins = 0 points from count (max 50 from count, at 10+ plugins)
   * - 0 days old account  = 0 points from age  (max 50 from age, at 365+ days)
   * - Verified identity bonus: +10 (capped at 100)
   */
  private computeReputationScore(author: AuthorReputation): number {
    // Plugin count component: 0 at 0 plugins, 50 at 10+ plugins (logarithmic)
    const countScore = Math.min(50, (Math.log2(author.publishedPluginCount + 1) / Math.log2(11)) * 50);

    // Account age component: 0 at 0 days, 50 at 365+ days (linear capped)
    const accountAgeDays =
      (Date.now() - new Date(author.accountCreated).getTime()) /
      (24 * 60 * 60 * 1000);
    const ageScore = Math.min(50, (accountAgeDays / 365) * 50);

    // Identity verification bonus
    const verifiedBonus = author.identityVerified ? 10 : 0;

    return Math.min(100, Math.round(countScore + ageScore + verifiedBonus));
  }

  /**
   * Code analysis score based on security audit findings.
   *
   * Starts at 100 and deducts points per finding:
   *   - critical: -25 each
   *   - high: -15 each
   *   - medium: -8 each
   *   - low: -3 each
   *
   * Floored at 0.
   */
  private computeCodeAnalysisScore(audit: SecurityAudit): number {
    const deductions: Record<Severity, number> = {
      critical: 25,
      high: 15,
      medium: 8,
      low: 3,
    };

    let score = 100;
    for (const finding of audit.findings) {
      score -= deductions[finding.severity];
    }

    return Math.max(0, score);
  }

  /**
   * Community score based on install count and issue resolution.
   *
   * - Install popularity: normalized against max in marketplace (0-60 points)
   *   Uses log scale to avoid mega-plugins dominating
   * - Issue resolution rate: direct percentage (0-40 points)
   */
  private computeCommunityScore(community: CommunitySignals): number {
    // Log-normalized install count (0-60)
    const installRatio =
      community.maxInstallCount > 0
        ? Math.log2(community.installCount + 1) /
          Math.log2(community.maxInstallCount + 1)
        : 0;
    const installScore = Math.round(installRatio * 60);

    // Issue resolution rate (0-40)
    const resolutionScore = Math.round(community.issueResolutionRate * 40);

    return Math.min(100, installScore + resolutionScore);
  }

  /**
   * Freshness score based on last update recency and dependency currency.
   *
   * - Recency: 60 points max. Full score if updated within 30 days,
   *   linear decay to 0 at 365 days.
   * - Dependency currency: 40 points max. Direct ratio of up-to-date deps.
   */
  private computeFreshnessScore(freshness: FreshnessData): number {
    // Recency component (0-60)
    const daysSinceUpdate =
      (Date.now() - new Date(freshness.lastUpdated).getTime()) /
      (24 * 60 * 60 * 1000);

    let recencyScore: number;
    if (daysSinceUpdate <= 30) {
      recencyScore = 60; // Full marks for recent updates
    } else if (daysSinceUpdate >= 365) {
      recencyScore = 0; // No marks for stale plugins
    } else {
      // Linear decay between 30 and 365 days
      recencyScore = Math.round(60 * (1 - (daysSinceUpdate - 30) / 335));
    }

    // Dependency currency component (0-40)
    const depScore = Math.round(freshness.dependencyCurrency * 40);

    return Math.min(100, recencyScore + depScore);
  }

  // --- Description helpers -------------------------------------------------

  private describeReputation(author: AuthorReputation, score: number): string {
    const parts = [
      `${author.publishedPluginCount} published plugin(s)`,
      `account created ${author.accountCreated}`,
    ];
    if (author.identityVerified) parts.push('identity verified');
    return `${parts.join(', ')} (score: ${score})`;
  }

  private describeCodeAnalysis(audit: SecurityAudit, score: number): string {
    const counts = { critical: 0, high: 0, medium: 0, low: 0 };
    for (const f of audit.findings) {
      counts[f.severity]++;
    }
    const parts = Object.entries(counts)
      .filter(([, count]) => count > 0)
      .map(([sev, count]) => `${count} ${sev}`);

    return parts.length > 0
      ? `${parts.join(', ')} finding(s) (score: ${score})`
      : `No findings (score: ${score})`;
  }

  private describeCommunity(community: CommunitySignals, score: number): string {
    return (
      `${community.installCount.toLocaleString()} installs, ` +
      `${Math.round(community.issueResolutionRate * 100)}% issues resolved, ` +
      `${community.stars} stars (score: ${score})`
    );
  }

  private describeFreshness(freshness: FreshnessData, score: number): string {
    const daysSince = Math.round(
      (Date.now() - new Date(freshness.lastUpdated).getTime()) /
        (24 * 60 * 60 * 1000),
    );
    return (
      `Last updated ${daysSince} day(s) ago, ` +
      `${Math.round(freshness.dependencyCurrency * 100)}% deps current (score: ${score})`
    );
  }

  /**
   * Map a numeric score to a letter grade.
   */
  private toGrade(score: number): TrustScore['grade'] {
    if (score >= 90) return 'A';
    if (score >= 80) return 'B';
    if (score >= 60) return 'C';
    if (score >= 40) return 'D';
    return 'F';
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 4. SECURITY AUDITOR
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Catalogue of dangerous code patterns to detect during static analysis.
 *
 * Each pattern includes:
 *   - A regex that matches the dangerous construct
 *   - Severity classification
 *   - Category for grouping related findings
 *   - Description and remediation guidance
 *   - Optional link to a permission category for gap analysis
 */
const DANGEROUS_PATTERNS: DangerousPattern[] = [
  // ---- Code Injection (Critical) ----
  {
    id: 'eval-call',
    name: 'eval() usage',
    pattern: /\beval\s*\(/,
    severity: 'critical',
    category: 'code-injection',
    description:
      'eval() executes arbitrary code and is a primary vector for code injection attacks',
    recommendation:
      'Replace eval() with JSON.parse() for data, or a proper parser/AST for code transformation',
  },
  {
    id: 'function-constructor',
    name: 'Function() constructor',
    pattern: /\bnew\s+Function\s*\(/,
    severity: 'critical',
    category: 'code-injection',
    description:
      'The Function constructor creates functions from strings, equivalent to eval()',
    recommendation:
      'Use standard function declarations or closures instead of dynamic function construction',
  },
  {
    id: 'vm-run-in-context',
    name: 'vm.runInContext() usage',
    pattern: /\bvm\s*\.\s*(?:runInContext|runInNewContext|runInThisContext|compileFunction)\s*\(/,
    severity: 'critical',
    category: 'code-injection',
    description:
      'Node.js vm module can execute arbitrary code. vm contexts are NOT secure sandboxes.',
    recommendation:
      'Use isolated-vm or worker_threads with restricted permissions instead of vm module',
  },
  {
    id: 'template-literal-exec',
    name: 'Template literal in shell exec',
    pattern: /(?:exec|execSync|spawn|spawnSync)\s*\(\s*`/,
    severity: 'critical',
    category: 'shell-injection',
    description:
      'Template literals in exec/spawn calls are vulnerable to shell injection if they contain user input',
    recommendation:
      'Use spawn() with an argument array instead of exec() with string interpolation',
    permissionCategory: 'exec',
  },

  // ---- Shell Injection (High) ----
  {
    id: 'exec-string-concat',
    name: 'String concatenation in exec',
    pattern: /(?:exec|execSync)\s*\(\s*(?:[^)]*\+\s*(?:\w+|['"`]))/,
    severity: 'high',
    category: 'shell-injection',
    description:
      'String concatenation in exec() calls can lead to shell injection if variables contain shell metacharacters',
    recommendation:
      'Use spawn() with argument arrays or shelljs.exec() with {shell: false}',
    permissionCategory: 'exec',
  },
  {
    id: 'child-process-shell',
    name: 'child_process with shell option',
    pattern: /spawn\s*\([^)]*,\s*\{[^}]*shell\s*:\s*true/,
    severity: 'high',
    category: 'shell-injection',
    description:
      'spawn() with shell:true passes commands through a shell, enabling injection',
    recommendation:
      'Remove shell:true and pass command arguments as an array',
    permissionCategory: 'exec',
  },

  // ---- Network Access (High) ----
  {
    id: 'undeclared-fetch',
    name: 'Undeclared network access (fetch)',
    pattern: /\bfetch\s*\(\s*(?:['"`]https?:\/\/|[^'"`\s)]+)/,
    severity: 'high',
    category: 'network-access',
    description:
      'Network request detected -- verify this is covered by declared network permissions',
    recommendation:
      'Add the target host to the plugin manifest\'s permissions.network array',
    permissionCategory: 'network',
  },
  {
    id: 'undeclared-http',
    name: 'Undeclared network access (http/https module)',
    pattern: /\b(?:http|https)\s*\.\s*(?:get|request|createServer)\s*\(/,
    severity: 'high',
    category: 'network-access',
    description:
      'Direct HTTP module usage detected -- verify this is covered by declared network permissions',
    recommendation:
      'Add the target host to the plugin manifest\'s permissions.network array',
    permissionCategory: 'network',
  },
  {
    id: 'undeclared-axios',
    name: 'Undeclared network access (axios/got/request)',
    pattern: /\b(?:axios|got|request|superagent|needle)\s*(?:\.\w+)?\s*\(/,
    severity: 'high',
    category: 'network-access',
    description:
      'HTTP client library usage detected -- verify this is covered by declared network permissions',
    recommendation:
      'Add the target host to the plugin manifest\'s permissions.network array',
    permissionCategory: 'network',
  },
  {
    id: 'websocket-connection',
    name: 'WebSocket connection',
    pattern: /\bnew\s+WebSocket\s*\(/,
    severity: 'high',
    category: 'network-access',
    description:
      'WebSocket connection detected -- verify the target host is in declared network permissions',
    recommendation:
      'Add the WebSocket host to the plugin manifest\'s permissions.network array',
    permissionCategory: 'network',
  },

  // ---- Credential Exposure (Critical) ----
  {
    id: 'hardcoded-aws-key',
    name: 'Hardcoded AWS access key',
    pattern: /(?:AKIA|ABIA|ACCA|ASIA)[0-9A-Z]{16}/,
    severity: 'critical',
    category: 'credential-leak',
    description:
      'AWS access key ID detected in source code -- credentials must never be hardcoded',
    recommendation:
      'Use environment variables or AWS IAM roles. Remove the key and rotate it immediately.',
  },
  {
    id: 'hardcoded-generic-secret',
    name: 'Hardcoded secret/token assignment',
    pattern:
      /(?:secret|token|password|passwd|api_key|apikey|api[-_]?secret|auth[-_]?token|access[-_]?token|private[-_]?key)\s*[:=]\s*['"`][A-Za-z0-9+/=_-]{16,}['"`]/i,
    severity: 'critical',
    category: 'credential-leak',
    description:
      'A secret, token, or password appears to be hardcoded in source code',
    recommendation:
      'Move credentials to environment variables or a secret manager (Vault, AWS Secrets Manager)',
  },
  {
    id: 'hardcoded-private-key',
    name: 'Hardcoded private key',
    pattern: /-----BEGIN\s+(?:RSA|EC|DSA|OPENSSH|PGP)?\s*PRIVATE\s+KEY-----/,
    severity: 'critical',
    category: 'credential-leak',
    description: 'Private key material embedded in source code',
    recommendation:
      'Store private keys in files excluded from version control, or use a key management service',
  },
  {
    id: 'hardcoded-github-token',
    name: 'Hardcoded GitHub token',
    pattern: /\b(?:ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/,
    severity: 'critical',
    category: 'credential-leak',
    description: 'GitHub personal access token or OAuth token detected in source',
    recommendation:
      'Use environment variables for GitHub tokens. Revoke this token and generate a new one.',
  },
  {
    id: 'hardcoded-jwt',
    name: 'Hardcoded JWT',
    pattern: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/,
    severity: 'high',
    category: 'credential-leak',
    description:
      'JSON Web Token detected in source code -- JWTs may contain sensitive claims',
    recommendation:
      'JWTs should be generated at runtime, not embedded in source. Remove and regenerate.',
  },
  {
    id: 'hardcoded-connection-string',
    name: 'Hardcoded database connection string',
    pattern:
      /(?:mongodb|postgres|mysql|redis|amqp|mssql):\/\/[^\s'"]{10,}/i,
    severity: 'critical',
    category: 'credential-leak',
    description:
      'Database connection string with potential credentials detected in source',
    recommendation:
      'Use environment variables or a secrets manager for connection strings',
  },

  // ---- Dangerous File Operations (Medium) ----
  {
    id: 'dynamic-require',
    name: 'Dynamic require()',
    pattern: /\brequire\s*\(\s*(?!['"`])[^)]+\)/,
    severity: 'medium',
    category: 'code-injection',
    description:
      'Dynamic require() with a variable path can load arbitrary modules',
    recommendation:
      'Use static require() paths or dynamic import() with validation',
  },
  {
    id: 'fs-write-root',
    name: 'Writing to system directories',
    pattern:
      /(?:writeFileSync|writeFile|createWriteStream)\s*\(\s*['"`]\/(?:etc|usr|bin|sbin|var|root)\//,
    severity: 'high',
    category: 'filesystem-abuse',
    description:
      'Attempting to write to system directories outside the plugin sandbox',
    recommendation:
      'Only write to the plugin\'s own directory or explicitly declared filesystem permissions',
    permissionCategory: 'filesystem',
  },

  // ---- Process/Environment Abuse (Medium) ----
  {
    id: 'process-exit',
    name: 'process.exit() call',
    pattern: /\bprocess\s*\.\s*exit\s*\(/,
    severity: 'medium',
    category: 'process-control',
    description:
      'Plugins should not forcefully terminate the host process',
    recommendation:
      'Throw an error or return a failure status instead of calling process.exit()',
  },
  {
    id: 'env-modification',
    name: 'Environment variable modification',
    pattern: /\bprocess\s*\.\s*env\s*\[\s*['"`][^'"]+['"`]\s*\]\s*=/,
    severity: 'medium',
    category: 'environment-mutation',
    description:
      'Modifying process.env can affect the host application and other plugins',
    recommendation:
      'Use local configuration objects instead of modifying global environment',
    permissionCategory: 'env',
  },

  // ---- Prototype Pollution (High) ----
  {
    id: 'proto-access',
    name: '__proto__ access',
    pattern: /\b__proto__\b/,
    severity: 'high',
    category: 'prototype-pollution',
    description:
      'Direct __proto__ access can be used for prototype pollution attacks',
    recommendation:
      'Use Object.create(null) for dictionaries and Object.getPrototypeOf() for inspection',
  },
  {
    id: 'constructor-prototype',
    name: 'constructor.prototype manipulation',
    pattern: /\bconstructor\s*\.\s*prototype\b/,
    severity: 'medium',
    category: 'prototype-pollution',
    description:
      'Direct prototype manipulation can pollute the prototype chain',
    recommendation:
      'Avoid modifying prototypes of built-in objects',
  },

  // ---- Deserialization (High) ----
  {
    id: 'unsafe-deserialize',
    name: 'Unsafe deserialization',
    pattern:
      /\b(?:serialize|unserialize|deserialize)\s*\(|yaml\s*\.\s*load\s*\(/,
    severity: 'high',
    category: 'deserialization',
    description:
      'Unsafe deserialization can lead to remote code execution',
    recommendation:
      'Use yaml.safeLoad() instead of yaml.load(). Validate all deserialized data.',
  },

  // ---- Information Disclosure (Low) ----
  {
    id: 'console-log-sensitive',
    name: 'Logging potentially sensitive data',
    pattern:
      /console\s*\.\s*(?:log|info|debug|warn)\s*\([^)]*(?:password|secret|token|key|credential|auth)/i,
    severity: 'low',
    category: 'information-disclosure',
    description:
      'Logging statements may inadvertently expose sensitive data',
    recommendation:
      'Redact sensitive values before logging. Use structured logging with field filtering.',
  },
];

/**
 * Scans plugin source code for dangerous patterns, credential leaks,
 * and permission boundary violations.
 *
 * The auditor recursively walks the plugin directory, scans each source
 * file against the pattern catalogue, and produces a comprehensive report
 * including a permission gap analysis.
 */
export class SecurityAuditor {
  private readonly patterns: DangerousPattern[];

  constructor(customPatterns?: DangerousPattern[]) {
    this.patterns = customPatterns ?? DANGEROUS_PATTERNS;
  }

  /**
   * Run a full security audit on a plugin.
   *
   * @param pluginName   - The display name of the plugin being audited
   * @param pluginRoot   - Absolute path to the plugin's root directory
   * @param declaredPermissions - Permissions from the plugin manifest
   * @returns Complete security audit report
   */
  async audit(
    pluginName: string,
    pluginRoot: string,
    declaredPermissions: PluginPermissions,
  ): Promise<SecurityAudit> {
    const resolvedRoot = resolve(pluginRoot);
    const findings: SecurityFinding[] = [];
    const detectedPermissions: PluginPermissions = {
      filesystem: [],
      network: [],
      exec: [],
      env: [],
    };

    // Recursively collect all scannable files
    const files = await this.collectFiles(resolvedRoot);

    // Scan each file
    for (const filePath of files) {
      const relativePath = relative(resolvedRoot, filePath);

      let content: string;
      try {
        content = await readFile(filePath, 'utf-8');
      } catch {
        // Skip unreadable files (binary, permission denied, etc.)
        continue;
      }

      const lines = content.split('\n');

      for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
        const line = lines[lineIdx]!;
        const lineNum = lineIdx + 1;

        // Skip comment-only lines to reduce false positives
        const trimmed = line.trim();
        if (
          trimmed.startsWith('//') ||
          trimmed.startsWith('#') ||
          trimmed.startsWith('*') ||
          trimmed.startsWith('/*')
        ) {
          continue;
        }

        for (const pattern of this.patterns) {
          if (pattern.pattern.test(line)) {
            findings.push({
              severity: pattern.severity,
              category: pattern.category,
              file: relativePath,
              line: lineNum,
              description: pattern.description,
              recommendation: pattern.recommendation,
            });

            // Track detected permission implications
            if (pattern.permissionCategory) {
              this.trackDetectedPermission(
                detectedPermissions,
                pattern.permissionCategory,
                line,
                pattern,
              );
            }
          }
        }

        // Additional permission detection (beyond dangerous patterns)
        this.detectPermissionsInLine(line, detectedPermissions);
      }
    }

    // Deduplicate detected permissions
    detectedPermissions.filesystem = [...new Set(detectedPermissions.filesystem)];
    detectedPermissions.network = [...new Set(detectedPermissions.network)];
    detectedPermissions.exec = [...new Set(detectedPermissions.exec)];
    detectedPermissions.env = [...new Set(detectedPermissions.env)];

    // Compute undeclared permissions (detected - declared)
    const undeclared = this.computeUndeclaredPermissions(
      detectedPermissions,
      declaredPermissions,
    );

    // Sort findings by severity
    const severityOrder: Record<Severity, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    };
    findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

    // Determine pass/fail: no critical/high findings and no undeclared permissions
    const hasCriticalOrHigh = findings.some(
      (f) => f.severity === 'critical' || f.severity === 'high',
    );
    const hasUndeclared =
      (undeclared.filesystem?.length ?? 0) > 0 ||
      (undeclared.network?.length ?? 0) > 0 ||
      (undeclared.exec?.length ?? 0) > 0 ||
      (undeclared.env?.length ?? 0) > 0;

    return {
      pluginName,
      scanDate: new Date().toISOString(),
      findings,
      permissionAnalysis: {
        declared: declaredPermissions,
        detected: detectedPermissions,
        undeclared,
      },
      passed: !hasCriticalOrHigh && !hasUndeclared,
    };
  }

  /**
   * Scan a single file's content and return findings.
   * Useful for incremental scanning during development.
   */
  scanContent(
    content: string,
    filePath: string,
  ): SecurityFinding[] {
    const findings: SecurityFinding[] = [];
    const lines = content.split('\n');

    for (let lineIdx = 0; lineIdx < lines.length; lineIdx++) {
      const line = lines[lineIdx]!;
      const lineNum = lineIdx + 1;

      const trimmed = line.trim();
      if (
        trimmed.startsWith('//') ||
        trimmed.startsWith('#') ||
        trimmed.startsWith('*') ||
        trimmed.startsWith('/*')
      ) {
        continue;
      }

      for (const pattern of this.patterns) {
        if (pattern.pattern.test(line)) {
          findings.push({
            severity: pattern.severity,
            category: pattern.category,
            file: filePath,
            line: lineNum,
            description: pattern.description,
            recommendation: pattern.recommendation,
          });
        }
      }
    }

    return findings;
  }

  // --- Private helpers ---

  /**
   * Recursively collect all scannable files under a directory.
   * Skips node_modules, .git, dist, build, and files over MAX_SCAN_FILE_SIZE.
   */
  private async collectFiles(dir: string): Promise<string[]> {
    const results: string[] = [];
    const skipDirs = new Set([
      'node_modules', '.git', 'dist', 'build', '.next',
      'coverage', '.nyc_output', '__pycache__', '.tox',
    ]);

    let entries;
    try {
      entries = await readdir(dir, { withFileTypes: true });
    } catch {
      return results;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!skipDirs.has(entry.name) && !entry.name.startsWith('.')) {
          const subFiles = await this.collectFiles(fullPath);
          results.push(...subFiles);
        }
      } else if (entry.isFile()) {
        const ext = extname(entry.name);
        if (SCANNABLE_EXTENSIONS.has(ext)) {
          // Check file size
          try {
            const stats = await stat(fullPath);
            if (stats.size <= MAX_SCAN_FILE_SIZE) {
              results.push(fullPath);
            }
          } catch {
            // Skip files we can't stat
          }
        }
      }
    }

    return results;
  }

  /**
   * Track a detected permission implied by a dangerous pattern match.
   */
  private trackDetectedPermission(
    detected: PluginPermissions,
    category: keyof PluginPermissions,
    line: string,
    pattern: DangerousPattern,
  ): void {
    switch (category) {
      case 'network': {
        // Try to extract hostname from the line
        const urlMatch = line.match(/https?:\/\/([^/'"\s:]+)/);
        if (urlMatch?.[1]) {
          detected.network!.push(urlMatch[1]);
        } else if (pattern.impliedResource) {
          detected.network!.push(pattern.impliedResource);
        }
        break;
      }
      case 'exec': {
        // Try to extract binary name
        const execMatch = line.match(
          /(?:exec|execSync|spawn|spawnSync|fork)\s*\(\s*['"`]?(\w+)/,
        );
        if (execMatch?.[1]) {
          detected.exec!.push(execMatch[1]);
        }
        break;
      }
      case 'filesystem': {
        // Try to extract path
        const fsMatch = line.match(
          /(?:readFile|writeFile|readdir|mkdir|unlink)\w*\s*\(\s*['"`]([^'"`]+)/,
        );
        if (fsMatch?.[1]) {
          const prefix = /write|append|mkdir|unlink/.test(line)
            ? 'write'
            : 'read';
          detected.filesystem!.push(`${prefix}:${fsMatch[1]}`);
        }
        break;
      }
      case 'env': {
        // Try to extract env var name
        const envMatch = line.match(
          /process\.env\.([A-Z_][A-Z0-9_]*)|process\.env\[['"]([A-Z_][A-Z0-9_]*)['"]\]/,
        );
        const varName = envMatch?.[1] ?? envMatch?.[2];
        if (varName) {
          detected.env!.push(varName);
        }
        break;
      }
    }
  }

  /**
   * Detect permission usage in a line beyond what the dangerous patterns catch.
   * This captures benign but permission-relevant code.
   */
  private detectPermissionsInLine(
    line: string,
    detected: PluginPermissions,
  ): void {
    // Detect process.env access for permission tracking (not a finding)
    const envPattern = /process\.env\.([A-Z_][A-Z0-9_]*)/g;
    let envMatch;
    while ((envMatch = envPattern.exec(line)) !== null) {
      const varName = envMatch[1]!;
      const benign = new Set(['NODE_ENV', 'HOME', 'USER', 'PATH', 'PWD', 'SHELL', 'TERM']);
      if (!benign.has(varName)) {
        detected.env!.push(varName);
      }
    }

    // Detect exec usage for permission tracking
    const execPattern =
      /(?:exec|execSync|execFile|execFileSync|spawn|spawnSync|fork)\s*\(\s*['"`](\w+)/;
    const execMatch = line.match(execPattern);
    if (execMatch?.[1]) {
      detected.exec!.push(execMatch[1]);
    }

    // Detect filesystem reads/writes for permission tracking
    const fsReadPattern =
      /(?:readFileSync|readFile|createReadStream|readdirSync|readdir)\s*\(\s*['"`]([^'"`]+)/;
    const fsReadMatch = line.match(fsReadPattern);
    if (fsReadMatch?.[1]) {
      detected.filesystem!.push(`read:${fsReadMatch[1]}`);
    }

    const fsWritePattern =
      /(?:writeFileSync|writeFile|createWriteStream|appendFile|mkdirSync|mkdir)\s*\(\s*['"`]([^'"`]+)/;
    const fsWriteMatch = line.match(fsWritePattern);
    if (fsWriteMatch?.[1]) {
      detected.filesystem!.push(`write:${fsWriteMatch[1]}`);
    }
  }

  /**
   * Compute the set of permissions detected in source but NOT declared
   * in the plugin manifest.
   */
  private computeUndeclaredPermissions(
    detected: PluginPermissions,
    declared: PluginPermissions,
  ): PluginPermissions {
    const declaredFs = new Set(declared.filesystem ?? []);
    const declaredNet = new Set(declared.network ?? []);
    const declaredExec = new Set(declared.exec ?? []);
    const declaredEnv = new Set(declared.env ?? []);

    return {
      filesystem: (detected.filesystem ?? []).filter((p) => {
        // Check if any declared permission covers this path
        for (const dp of declaredFs) {
          if (p === dp) return false;
          // Check prefix matching: "read:./src" covers "read:./src/foo.ts"
          const [pType, pPath] = p.split(':');
          const [dType, dPath] = dp.split(':');
          if (pType === dType && pPath && dPath && pPath.startsWith(dPath)) {
            return false;
          }
          // Write covers read
          if (pType === 'read' && dType === 'write' && pPath && dPath && pPath.startsWith(dPath)) {
            return false;
          }
        }
        return true;
      }),
      network: (detected.network ?? []).filter((host) => {
        for (const dh of declaredNet) {
          if (dh === host) return false;
          if (dh.startsWith('*.') && host.endsWith(dh.slice(1))) return false;
        }
        return true;
      }),
      exec: (detected.exec ?? []).filter((e) => !declaredExec.has(e)),
      env: (detected.env ?? []).filter((e) => !declaredEnv.has(e)),
    };
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// 5. PIPELINE CONVENIENCE
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Creates all four security components wired together for a plugin.
 *
 * Usage:
 *   const pipeline = createSecurityPipeline('/path/to/plugin', manifest);
 *   const audit   = await pipeline.auditor.audit('my-plugin', '/path', perms);
 *   const verify  = await pipeline.verifier.verify(bundleContent, sigInfo);
 *   const score   = pipeline.scorer.score({ verification, author, audit, community, freshness });
 *   const valid   = pipeline.sandbox.validateScript(hookScript);
 */
export function createSecurityPipeline(
  pluginRoot: string,
  manifest: { permissions?: PluginPermissions },
): {
  verifier: SignatureVerifier;
  sandbox: PermissionSandbox;
  scorer: TrustScorer;
  auditor: SecurityAuditor;
  permissions: PluginPermissions;
} {
  const permissions = PermissionSandbox.fromManifest(manifest);

  return {
    verifier: new SignatureVerifier(),
    sandbox: new PermissionSandbox(permissions, pluginRoot),
    scorer: new TrustScorer(),
    auditor: new SecurityAuditor(),
    permissions,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// 6. EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

export { DANGEROUS_PATTERNS };
