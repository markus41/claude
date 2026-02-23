/**
 * Federated Registry Protocol - Type Definitions
 *
 * Defines contracts for multi-registry resolution, policy enforcement,
 * lockfile management, and conflict detection across federated plugin sources.
 */

// ---------------------------------------------------------------------------
// Registry configuration
// ---------------------------------------------------------------------------

/** Configuration for a single registry source. */
export interface RegistryConfig {
  /** Human-readable registry name (used as identifier). */
  name: string;
  /** URL or local path to the registry index. */
  url: string;
  /** Resolution priority — higher values are checked first. */
  priority: number;
  /**
   * Authentication method.
   * - "oidc:<provider>" — OpenID Connect via named provider
   * - "token:<ENV_VAR>" — Bearer token from environment variable
   * - "none" — No authentication
   */
  auth?: string;
  /**
   * Policy mode controlling how plugins from this registry are treated.
   * - "enforce" — Only policy-approved plugins allowed
   * - "allow-listed" — Only explicitly allow-listed plugins permitted
   * - "open" — All plugins allowed (subject to deny rules)
   */
  policy: 'enforce' | 'allow-listed' | 'open';
  /** Whether this registry is active. */
  enabled: boolean;
}

/** Top-level federation configuration (stored in .claude/registries.json). */
export interface FederationConfig {
  /** Ordered list of registry sources. */
  registries: RegistryConfig[];
  /** Default settings for federation behavior. */
  defaults: {
    /** Cache time-to-live in seconds. */
    cacheTTL: number;
    /**
     * How to handle the same plugin appearing in multiple registries.
     * - "highest-priority" — Use the registry with highest priority
     * - "error" — Fail with a conflict error
     * - "prompt" — Ask the user to choose
     */
    conflictResolution: 'highest-priority' | 'error' | 'prompt';
  };
}

// ---------------------------------------------------------------------------
// Registry data (fetched from registries)
// ---------------------------------------------------------------------------

/** A single plugin entry as listed in a registry index. */
export interface RegistryPluginEntry {
  /** Plugin name. */
  name: string;
  /** Latest version available. */
  version: string;
  /** Human-readable description. */
  description?: string;
  /** SHA-512 integrity hash of the package contents. */
  integrity: string;
  /** URL or path to download the plugin package (.cpkg). */
  resolved: string;
  /** List of plugin dependencies by name. */
  dependencies?: string[];
  /** Whether the package is cryptographically signed. */
  signed?: boolean;
  /** Trust score (0-100) assigned by the registry. */
  trustScore?: number;
  /** Available versions. */
  versions?: string[];
}

/** The full registry index as fetched from a registry source. */
export interface RegistryIndex {
  /** Registry metadata version. */
  version: number;
  /** When this index was last updated (ISO timestamp). */
  updatedAt: string;
  /** Map of plugin name to plugin entry. */
  plugins: Record<string, RegistryPluginEntry>;
}

/** Cached registry data with expiry tracking. */
export interface CachedRegistry {
  /** The registry configuration. */
  config: RegistryConfig;
  /** The fetched index data (null if fetch failed). */
  index: RegistryIndex | null;
  /** When this cache entry was created (epoch ms). */
  fetchedAt: number;
  /** When this cache entry expires (epoch ms). */
  expiresAt: number;
  /** Error message if the fetch failed. */
  error?: string;
}

// ---------------------------------------------------------------------------
// Resolution results
// ---------------------------------------------------------------------------

/** The resolved source for a plugin after multi-registry resolution. */
export interface ResolvedPlugin {
  /** Plugin name. */
  name: string;
  /** Plugin version. */
  version: string;
  /** SHA-512 integrity hash. */
  integrity: string;
  /** Registry that provided this resolution. */
  source: string;
  /** Full URL or path to the package. */
  resolved: string;
  /** Plugin dependencies. */
  dependencies: string[];
  /** Whether the package is signed. */
  signed: boolean;
  /** Trust score from the source registry. */
  trustScore: number;
  /** Whether conflicts were detected during resolution. */
  hadConflicts: boolean;
  /** Details of detected conflicts, if any. */
  conflicts?: RegistryConflict;
}

/** A conflict detected when the same plugin exists in multiple registries. */
export interface RegistryConflict {
  /** The plugin name that conflicts. */
  pluginName: string;
  /** All sources where this plugin was found. */
  sources: Array<{
    /** Registry name. */
    registry: string;
    /** Version in this registry. */
    version: string;
    /** Integrity hash in this registry. */
    integrity: string;
  }>;
  /** How the conflict was resolved. */
  resolution: string;
}

// ---------------------------------------------------------------------------
// Policy engine
// ---------------------------------------------------------------------------

/** A single policy rule for plugin access control. */
export interface PolicyRule {
  /** What this rule does when matched. */
  action: 'allow' | 'deny' | 'require';
  /** Glob patterns matching plugin names. */
  plugins: string[];
  /** Optional registry name filter — rule only applies to plugins from this source. */
  source?: string;
  /** Exemption conditions — if ALL conditions are met, the rule is bypassed. */
  unless?: {
    /** Trust score threshold (e.g. ">= 80"). */
    trust_score?: string;
    /** Whether the plugin must be signed. */
    signed?: boolean;
  };
  /** Human-readable explanation for this rule. */
  reason: string;
}

/** Top-level policy configuration (from .claude/policies/plugins.yaml). */
export interface PolicyConfig {
  /** Ordered list of policy rules (first match wins). */
  rules: PolicyRule[];
}

/** The result of evaluating a plugin against the policy engine. */
export interface PolicyDecision {
  /** Whether the plugin is allowed to be installed/used. */
  allowed: boolean;
  /** The rule that matched (null if no rule matched — default allow). */
  rule: PolicyRule | null;
  /** Human-readable explanation of the decision. */
  reason: string;
  /** Non-fatal warnings (e.g. missing required plugins). */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Lockfile
// ---------------------------------------------------------------------------

/** A single plugin entry in the lockfile. */
export interface LockfileEntry {
  /** Exact version installed. */
  version: string;
  /** SHA-512 integrity hash at install time. */
  integrity: string;
  /** Registry name that provided the plugin. */
  source: string;
  /** Full URL or path to the package. */
  resolved: string;
  /** Plugin dependencies by name. */
  dependencies: string[];
  /** ISO timestamp when this plugin was installed/locked. */
  installedAt: string;
}

/** The complete lockfile recording exact installed state. */
export interface Lockfile {
  /** Lockfile format version. */
  lockVersion: number;
  /** ISO timestamp when this lockfile was generated. */
  generatedAt: string;
  /** Map of registry name to URL for provenance tracking. */
  registries: Record<string, string>;
  /** Map of plugin name to locked entry. */
  plugins: Record<string, LockfileEntry>;
}

/** A diff between two lockfile states for PR review. */
export interface LockfileDiff {
  /** Plugins that were added. */
  added: Array<{ name: string; version: string; source: string }>;
  /** Plugins that were removed. */
  removed: Array<{ name: string; version: string }>;
  /** Plugins whose version changed. */
  updated: Array<{ name: string; from: string; to: string }>;
  /** Plugins whose source registry changed (even if same version). */
  sourceChanged: Array<{ name: string; from: string; to: string }>;
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/** Error codes for federation-related failures. */
export enum FederationErrorCode {
  /** No registries are configured. */
  NO_REGISTRIES = 'NO_REGISTRIES',
  /** All registries failed to respond. */
  ALL_REGISTRIES_UNAVAILABLE = 'ALL_REGISTRIES_UNAVAILABLE',
  /** Plugin not found in any registry. */
  PLUGIN_NOT_FOUND = 'PLUGIN_NOT_FOUND',
  /** Same plugin in multiple registries with different content (unresolved). */
  UNRESOLVED_CONFLICT = 'UNRESOLVED_CONFLICT',
  /** Policy denied the plugin installation. */
  POLICY_DENIED = 'POLICY_DENIED',
  /** Lockfile integrity mismatch detected. */
  INTEGRITY_MISMATCH = 'INTEGRITY_MISMATCH',
  /** Lockfile format version not supported. */
  UNSUPPORTED_LOCK_VERSION = 'UNSUPPORTED_LOCK_VERSION',
  /** Configuration file is malformed or missing. */
  CONFIG_ERROR = 'CONFIG_ERROR',
  /** Policy configuration is malformed. */
  POLICY_CONFIG_ERROR = 'POLICY_CONFIG_ERROR',
}

/** Error thrown by federation engine components. */
export class FederationError extends Error {
  constructor(
    message: string,
    public readonly code: FederationErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'FederationError';
  }
}
