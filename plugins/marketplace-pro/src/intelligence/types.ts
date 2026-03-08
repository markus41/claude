/**
 * Contextual Plugin Intelligence — Type Definitions
 *
 * This module defines all interfaces used by the fingerprinting engine,
 * Apriori association rule miner, and recommendation engine.
 */

// ---------------------------------------------------------------------------
// Project Fingerprinting
// ---------------------------------------------------------------------------

/**
 * A complete fingerprint of a project's technology stack, infrastructure,
 * architectural patterns, and detected capability gaps.
 */
export interface ProjectFingerprint {
  /** Detected web/backend frameworks (e.g., "nextjs", "express", "fastapi") */
  frameworks: string[];

  /** Language distribution by file extension, values sum to ~1.0 */
  languages: Record<string, number>;

  /** Infrastructure tooling detected (e.g., "docker", "kubernetes", "terraform") */
  infrastructure: string[];

  /** Architectural patterns detected (e.g., "monorepo", "api-gateway", "event-driven") */
  patterns: string[];

  /** Capability gaps identified by association rule mining */
  missing: Array<{
    /** The feature that is expected but not detected */
    feature: string;
    /** Confidence that this feature should be present (0-1) */
    confidence: number;
    /** Features already present that are typically associated with the missing one */
    associatedWith: string[];
  }>;

  /** Raw list of significant files/dirs detected during scanning */
  detectedFiles: string[];
}

// ---------------------------------------------------------------------------
// Association Rule Mining (Apriori)
// ---------------------------------------------------------------------------

/**
 * An association rule discovered by the Apriori algorithm.
 *
 * Reads as: "Projects that have [antecedent] also tend to have [consequent]."
 */
export interface AssociationRule {
  /** If these features exist in a project... */
  antecedent: string[];
  /** ...then these features are also expected */
  consequent: string[];
  /** Proportion of all profiles containing the full itemset (0-1) */
  support: number;
  /** P(consequent | antecedent) — conditional probability (0-1) */
  confidence: number;
  /** confidence / P(consequent) — values >1 indicate positive association */
  lift: number;
}

// ---------------------------------------------------------------------------
// Plugin Recommendation
// ---------------------------------------------------------------------------

/**
 * A single plugin recommendation with relevance scoring and explanations.
 */
export interface PluginRecommendation {
  /** Name identifier of the recommended plugin */
  pluginName: string;
  /** Cosine similarity between project fingerprint and plugin capabilities (0-1) */
  relevance: number;
  /** Human-readable explanation of why this plugin is recommended */
  reason: string;
  /** Which missing capabilities this plugin would provide */
  gapsFilled: string[];
  /** Which existing project features matched the plugin's target domain */
  matchedFeatures: string[];
}

/**
 * The full output report of the recommendation engine.
 */
export interface RecommendationReport {
  /** High-level summary of the scanned project */
  projectSummary: {
    frameworks: string[];
    primaryLanguage: string;
    infraStack: string[];
    detectedPatterns: string[];
  };
  /** Ranked list of plugin recommendations (highest relevance first) */
  recommendations: PluginRecommendation[];
  /** Detected capability gaps from association rules */
  gaps: Array<{ feature: string; confidence: number }>;
  /** ISO 8601 timestamp of when the scan was performed */
  scanDate: string;
}

// ---------------------------------------------------------------------------
// Plugin Capability Descriptor (input to the recommendation engine)
// ---------------------------------------------------------------------------

/**
 * Describes a plugin's capabilities for matching against project fingerprints.
 * These are typically read from each plugin's plugin.json manifest.
 */
export interface PluginCapability {
  /** Plugin name identifier */
  name: string;
  /** Human-readable description */
  description: string;
  /** Set of capability/feature tags this plugin provides */
  capabilities: string[];
  /** Optional: frameworks this plugin is designed for */
  targetFrameworks?: string[];
  /** Optional: infrastructure this plugin integrates with */
  targetInfrastructure?: string[];
}

// ---------------------------------------------------------------------------
// Project Profile (training data for Apriori)
// ---------------------------------------------------------------------------

/**
 * A single project profile from the training dataset.
 * Each profile is a transaction (set of features) for the Apriori algorithm.
 */
export interface ProjectProfile {
  /** Optional label for the profile (e.g., "nextjs-fullstack") */
  label?: string;
  /** The set of features present in this project */
  features: string[];
}

// ---------------------------------------------------------------------------
// Apriori Algorithm Internal Types
// ---------------------------------------------------------------------------

/** A set of items represented as a sorted array of strings */
export type Itemset = string[];

/** A frequent itemset with its support count */
export interface FrequentItemset {
  items: Itemset;
  support: number;
}
