/**
 * Supply Chain Security & Trust Scoring - Type Definitions
 *
 * Core type system for plugin verification, permission sandboxing,
 * trust scoring, and security auditing. These types form the contract
 * between the trust engine components and the rest of the marketplace.
 */

// ---------------------------------------------------------------------------
// Permission Model
// ---------------------------------------------------------------------------

/**
 * Declares the resource boundaries a plugin is allowed to access.
 *
 * Each key maps to an array of scope strings using a prefix convention:
 *   - filesystem: "read:./src", "write:./dist", "read:/tmp/*"
 *   - network:    exact hostnames or wildcard patterns "*.npmjs.org"
 *   - exec:       binary names the plugin may spawn
 *   - env:        environment variable names the plugin may read
 */
export interface PluginPermissions {
  filesystem?: string[];
  network?: string[];
  exec?: string[];
  env?: string[];
}

// ---------------------------------------------------------------------------
// Signature Verification
// ---------------------------------------------------------------------------

/**
 * Metadata attached to a signed `.cpkg` bundle.
 *
 * The checksum covers the entire bundle content (excluding the signature
 * block itself). The author block links the signature to a verified
 * identity from a supported identity provider.
 */
export interface SignatureInfo {
  /** Hash algorithm used (e.g. "sha512") */
  algorithm: string;
  /** Hex-encoded digest of the bundle content */
  checksum: string;
  /** Identity of the signer */
  author: {
    /** Display name or email tied to the identity provider */
    identity: string;
    /** Identity provider that vouches for the author ("github", "google") */
    provider: string;
    /** Whether the identity was verified against the provider at sign time */
    verified: boolean;
  };
  /** ISO-8601 timestamp of when the signature was created */
  timestamp: string;
  /** Optional reference to a transparency log entry (e.g. Rekor UUID) */
  transparencyLogEntry?: string;
}

/** Outcome of a signature verification attempt */
export interface VerificationResult {
  /** Whether the bundle passed all integrity checks */
  valid: boolean;
  /** Human-readable summary of the verification outcome */
  status: 'verified' | 'tampered' | 'unsigned' | 'expired' | 'unknown-signer';
  /** The signature metadata, if present */
  signatureInfo?: SignatureInfo;
  /** Detailed messages about each verification step */
  details: string[];
  /** Errors encountered during verification */
  errors: string[];
}

// ---------------------------------------------------------------------------
// Trust Scoring
// ---------------------------------------------------------------------------

/** A single factor contributing to the composite trust score */
export interface TrustFactor {
  /** Raw score for this factor (0-100) */
  score: number;
  /** Weight applied to this factor in the composite (0-1, all weights sum to 1) */
  weight: number;
  /** Human-readable explanation of how the score was derived */
  details: string;
}

/**
 * Composite trust score for a plugin.
 *
 * Computed as: overall = sum(factor.score * factor.weight) for all factors.
 * The grade maps the numeric score to a letter:
 *   A: 90-100, B: 80-89, C: 60-79, D: 40-59, F: 0-39
 */
export interface TrustScore {
  /** Weighted composite score (0-100) */
  overall: number;
  /** Breakdown by scoring dimension */
  factors: {
    signed: TrustFactor;
    reputation: TrustFactor;
    codeAnalysis: TrustFactor;
    community: TrustFactor;
    freshness: TrustFactor;
  };
  /** Letter grade derived from the overall score */
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  /** Non-blocking concerns the user should be aware of */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Security Audit
// ---------------------------------------------------------------------------

/** Severity levels for security findings, ordered from most to least critical */
export type Severity = 'critical' | 'high' | 'medium' | 'low';

/** A single security finding from static analysis */
export interface SecurityFinding {
  /** Impact level */
  severity: Severity;
  /** Broad category (e.g. "code-injection", "credential-leak", "network-access") */
  category: string;
  /** Relative path to the file containing the finding */
  file: string;
  /** 1-based line number where the pattern was detected */
  line: number;
  /** What was found and why it matters */
  description: string;
  /** Suggested remediation */
  recommendation: string;
}

/**
 * Full security audit report for a plugin.
 *
 * Combines static code analysis findings with a permission gap analysis
 * that compares what the plugin declared vs. what it actually uses.
 */
export interface SecurityAudit {
  /** Name of the audited plugin */
  pluginName: string;
  /** ISO-8601 timestamp of when the scan was performed */
  scanDate: string;
  /** All security findings, sorted by severity */
  findings: SecurityFinding[];
  /** Permission gap analysis */
  permissionAnalysis: {
    /** Permissions listed in the plugin manifest */
    declared: PluginPermissions;
    /** Permissions detected via static analysis of plugin source */
    detected: PluginPermissions;
    /** Permissions detected in source but NOT declared in the manifest */
    undeclared: PluginPermissions;
  };
  /** True if no critical or high findings and no undeclared permissions */
  passed: boolean;
}

// ---------------------------------------------------------------------------
// Inputs for the trust engine
// ---------------------------------------------------------------------------

/** Data about the plugin author used for reputation scoring */
export interface AuthorReputation {
  /** Number of plugins published by this author */
  publishedPluginCount: number;
  /** Account creation date (ISO-8601) */
  accountCreated: string;
  /** Whether the author identity has been verified */
  identityVerified: boolean;
}

/** Community engagement signals for a plugin */
export interface CommunitySignals {
  /** Total number of installs */
  installCount: number;
  /** Maximum install count across all marketplace plugins (for normalization) */
  maxInstallCount: number;
  /** Ratio of issues that were resolved (0-1) */
  issueResolutionRate: number;
  /** Number of GitHub stars or equivalent */
  stars: number;
}

/** Freshness metadata for a plugin */
export interface FreshnessData {
  /** ISO-8601 date of last published update */
  lastUpdated: string;
  /** Number of dependencies that are up to date (0-1 ratio) */
  dependencyCurrency: number;
}

/** Aggregated input to the TrustScorer */
export interface TrustScoringInput {
  /** Signature verification result */
  verification: VerificationResult;
  /** Author reputation data */
  author: AuthorReputation;
  /** Security audit result (for code analysis factor) */
  audit: SecurityAudit;
  /** Community engagement signals */
  community: CommunitySignals;
  /** Freshness metadata */
  freshness: FreshnessData;
}

// ---------------------------------------------------------------------------
// Permission sandbox types
// ---------------------------------------------------------------------------

/** Result of validating a hook script against declared permissions */
export interface PermissionValidation {
  /** Whether the script stays within declared boundaries */
  allowed: boolean;
  /** Specific violations found */
  violations: Array<{
    /** The resource or action that was not declared */
    resource: string;
    /** Which permission category it falls under */
    category: keyof PluginPermissions;
    /** Line number in the script where the violation was found */
    line: number;
    /** The offending code snippet */
    snippet: string;
  }>;
}

/** A generated shell wrapper that enforces permission boundaries at runtime */
export interface SandboxWrapper {
  /** The restricted shell script content */
  script: string;
  /** Environment variables the wrapper will expose (allowlisted) */
  allowedEnv: string[];
  /** Filesystem paths the wrapper grants access to */
  allowedPaths: string[];
  /** Network hosts the wrapper permits outbound connections to */
  allowedHosts: string[];
  /** Binaries the wrapper permits execution of */
  allowedExec: string[];
}

// ---------------------------------------------------------------------------
// Dangerous patterns for static analysis
// ---------------------------------------------------------------------------

/** A pattern rule used by the SecurityAuditor scanner */
export interface DangerousPattern {
  /** Unique identifier for this pattern */
  id: string;
  /** Human-readable name */
  name: string;
  /** The regex to match against source code */
  pattern: RegExp;
  /** Severity when this pattern is found */
  severity: Severity;
  /** Category for grouping */
  category: string;
  /** What this pattern indicates */
  description: string;
  /** How to fix or mitigate */
  recommendation: string;
  /** Which permission category this relates to, if any */
  permissionCategory?: keyof PluginPermissions;
  /** What resource/host/binary this implies, if any */
  impliedResource?: string;
}
