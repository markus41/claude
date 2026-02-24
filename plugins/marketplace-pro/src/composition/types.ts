/**
 * Intent-Based Composition Engine - Type Definitions
 *
 * Defines the contract for plugin capability matching, dependency resolution,
 * configuration inference, and composition planning.
 */

// ---------------------------------------------------------------------------
// Plugin manifest types (mirrors .claude-plugin/plugin.json structure)
// ---------------------------------------------------------------------------

/** Capability declarations within a plugin manifest. */
export interface PluginCapabilities {
  /** Capabilities this plugin provides to the ecosystem. */
  provides: string[];
  /** Capabilities this plugin requires from other plugins. */
  requires: string[];
  /** Capabilities that conflict with this plugin (cannot coexist). */
  conflicts?: string[];
}

/** Parsed plugin manifest from .claude-plugin/plugin.json. */
export interface PluginManifest {
  /** Unique plugin identifier (directory name / package name). */
  name: string;
  /** Semantic version string. */
  version: string;
  /** Human-readable description. */
  description: string;
  /** Minimal plugin operator context entrypoint (relative to plugin root). */
  contextEntry?: string;
  /** Extracted short context text loaded from contextEntry. */
  contextSummary?: string;
  /** Capability declarations. Absent means the plugin declares nothing. */
  capabilities?: PluginCapabilities;
  /** Optional module map for multi-module plugins. */
  modules?: Record<string, { description: string; entry: string }>;
}

// ---------------------------------------------------------------------------
// Intent specification (user-facing input)
// ---------------------------------------------------------------------------

/** A single capability requirement with an optional provider preference. */
export interface CapabilityRequirement {
  /** The capability identifier to satisfy (e.g. "plugin-composition"). */
  capability: string;
  /** Optional: prefer a specific plugin to provide this capability. */
  provider?: string;
}

/** Top-level intent specification that drives the composition engine. */
export interface IntentSpec {
  /** Human-readable description of the desired outcome. */
  intent: string;
  /** List of capabilities the user needs. */
  requirements: CapabilityRequirement[];
  /** Optional key-value constraints (e.g. { "env": "production" }). */
  constraints?: Record<string, string>;
}

// ---------------------------------------------------------------------------
// Composition plan (engine output)
// ---------------------------------------------------------------------------

/** A single plugin entry in the final composition plan. */
export interface PlannedPlugin {
  /** Plugin name. */
  name: string;
  /** Plugin version. */
  version: string;
  /** Execution/install order (0-indexed, lower = earlier). */
  order: number;
  /** Capabilities this plugin contributes to the plan. */
  provides: string[];
  /** Auto-inferred configuration for this plugin. */
  config: Record<string, unknown>;
}

/** The complete composition plan returned by the engine. */
export interface CompositionPlan {
  /** Original intent description. */
  intent: string;
  /** Ordered list of plugins in the plan. */
  plugins: PlannedPlugin[];
  /** Plugin names in install/execution order. */
  installOrder: string[];
  /** Non-fatal issues or suggestions. */
  warnings: string[];
}

// ---------------------------------------------------------------------------
// Dependency graph (intermediate representation)
// ---------------------------------------------------------------------------

/** A directed edge in the dependency graph. */
export interface DependencyEdge {
  /** The providing plugin (dependency). */
  from: string;
  /** The requiring plugin (dependent). */
  to: string;
  /** The capability that creates this dependency relationship. */
  capability: string;
}

/** The full dependency DAG produced by DependencyResolver. */
export interface DependencyGraph {
  /** All plugin names in the graph. */
  nodes: string[];
  /** Directed edges (from = provider, to = consumer). */
  edges: DependencyEdge[];
  /** Whether the graph contains cycles (making topological sort impossible). */
  hasCycles: boolean;
  /** Human-readable descriptions of detected cycles. */
  cycleDetails?: string[];
}

// ---------------------------------------------------------------------------
// Capability matching result (intermediate)
// ---------------------------------------------------------------------------

/** Details about how a single plugin was selected by the matcher. */
export interface MatchedPlugin {
  /** The plugin manifest. */
  manifest: PluginManifest;
  /** Which of the required capabilities this plugin covers. */
  coveredCapabilities: string[];
  /** Whether this plugin was preferred by the user's provider hint. */
  isPreferred: boolean;
}

/** Result of the capability matching phase. */
export interface MatchResult {
  /** Plugins selected to cover the requirements. */
  selected: MatchedPlugin[];
  /** Capabilities that no installed plugin can satisfy. */
  uncoveredCapabilities: string[];
  /** Capability conflicts detected between selected plugins. */
  conflicts: Array<{ capability: string; plugins: string[] }>;
}

// ---------------------------------------------------------------------------
// Configuration inference types
// ---------------------------------------------------------------------------

/** Technology fingerprint detected from the project root. */
export interface ProjectFingerprint {
  /** Detected technology stack entries (e.g. "typescript", "docker"). */
  technologies: string[];
  /** Map of detection source file to its detected features. */
  detectionSources: Record<string, string[]>;
}

/** Configuration generated for a single plugin. */
export interface InferredConfig {
  /** Plugin name. */
  pluginName: string;
  /** Auto-generated configuration key-value pairs. */
  config: Record<string, unknown>;
  /** Which detected technologies influenced this configuration. */
  basedOn: string[];
}

// ---------------------------------------------------------------------------
// Error types
// ---------------------------------------------------------------------------

/** Error thrown when the composition engine encounters an unrecoverable issue. */
export class CompositionError extends Error {
  constructor(
    message: string,
    public readonly code: CompositionErrorCode,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'CompositionError';
  }
}

/** Enumeration of composition error codes for programmatic handling. */
export enum CompositionErrorCode {
  /** No plugins found in the plugin directory. */
  NO_PLUGINS_FOUND = 'NO_PLUGINS_FOUND',
  /** Some required capabilities cannot be satisfied. */
  UNSATISFIABLE = 'UNSATISFIABLE',
  /** Dependency graph contains cycles. */
  CYCLIC_DEPENDENCY = 'CYCLIC_DEPENDENCY',
  /** Selected plugins have conflicting capabilities. */
  CONFLICT_DETECTED = 'CONFLICT_DETECTED',
  /** Intent specification is malformed. */
  INVALID_INTENT = 'INVALID_INTENT',
  /** File system / manifest read error. */
  MANIFEST_READ_ERROR = 'MANIFEST_READ_ERROR',
}
