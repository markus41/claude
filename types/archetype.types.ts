/**
 * TypeScript Type Definitions for Archetype Configuration
 * Generated from archetype.schema.json
 *
 * @packageDocumentation
 */

/**
 * Supported template engine types
 */
export type EngineType =
  | 'handlebars'
  | 'nunjucks'
  | 'eta'
  | 'ejs'
  | 'copier'
  | 'cookiecutter';

/**
 * Archetype category classification
 */
export type ArchetypeCategory =
  | 'infrastructure'
  | 'service'
  | 'ui'
  | 'library'
  | 'tool'
  | 'agent'
  | 'documentation'
  | 'database'
  | 'integration';

/**
 * Variable data types
 */
export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'array'
  | 'object'
  | 'enum'
  | 'multiselect';

/**
 * Dependency package manager types
 */
export type DependencyType =
  | 'npm'
  | 'pip'
  | 'gem'
  | 'maven'
  | 'nuget'
  | 'cargo'
  | 'go';

/**
 * Update strategy for template updates
 */
export type UpdateStrategy = 'overwrite' | 'merge' | 'skip' | 'prompt';

/**
 * Repository type
 */
export type RepositoryType = 'git' | 'svn' | 'hg';

/**
 * Author information
 */
export interface Author {
  name?: string;
  email?: string;
  url?: string;
}

/**
 * Repository information
 */
export interface Repository {
  type?: RepositoryType;
  url?: string;
}

/**
 * Handlebars engine configuration
 */
export interface HandlebarsConfig {
  /** Disable HTML escaping */
  noEscape?: boolean;
  /** Enable strict mode */
  strict?: boolean;
  /** Assume all objects exist */
  assumeObjects?: boolean;
  /** Prevent indentation */
  preventIndent?: boolean;
  /** Paths to custom helper modules */
  helpers?: string[];
  /** Named partial paths */
  partials?: Record<string, string>;
}

/**
 * Nunjucks engine configuration
 */
export interface NunjucksConfig {
  /** Enable HTML autoescaping */
  autoescape?: boolean;
  /** Throw on undefined variables */
  throwOnUndefined?: boolean;
  /** Trim blocks */
  trimBlocks?: boolean;
  /** Strip leading whitespace */
  lstripBlocks?: boolean;
  /** Custom tag delimiters */
  tags?: {
    blockStart?: string;
    blockEnd?: string;
    variableStart?: string;
    variableEnd?: string;
    commentStart?: string;
    commentEnd?: string;
  };
  /** Custom filter definitions */
  filters?: Record<string, string>;
}

/**
 * Eta engine configuration
 */
export interface EtaConfig {
  /** Enable template caching */
  cache?: boolean;
  /** Enable HTML autoescaping */
  autoEscape?: boolean;
  /** Auto-trim whitespace */
  autoTrim?: boolean | [boolean, string];
  /** Template delimiter tags */
  tags?: [string, string];
  /** Plugin paths */
  plugins?: string[];
}

/**
 * EJS engine configuration
 */
export interface EJSConfig {
  /** Delimiter character */
  delimiter?: string;
  /** Opening delimiter */
  openDelimiter?: string;
  /** Closing delimiter */
  closeDelimiter?: string;
  /** Enable strict mode */
  strict?: boolean;
  /** Remove whitespace */
  rmWhitespace?: boolean;
  /** Escape function name */
  escape?: string;
}

/**
 * Copier engine configuration (Jinja2-based)
 */
export interface CopierConfig {
  /** Jinja2 environment options */
  envops?: {
    block_start_string?: string;
    block_end_string?: string;
    variable_start_string?: string;
    variable_end_string?: string;
    keep_trailing_newline?: boolean;
  };
  /** Patterns to exclude from copying */
  exclude?: string[];
  /** Files to skip if they exist in destination */
  skip_if_exists?: string[];
  /** Shell commands to run after copy */
  tasks?: string[];
}

/**
 * Cookiecutter engine configuration
 */
export interface CookiecutterConfig {
  /** Enable replay mode */
  replay?: boolean;
  /** Overwrite existing files */
  overwrite_if_exists?: boolean;
  /** Skip if file exists */
  skip_if_file_exists?: boolean;
  /** Use default config */
  default_config?: boolean;
}

/**
 * Engine-specific configuration union
 */
export interface EngineSpecificConfig {
  handlebars?: HandlebarsConfig;
  nunjucks?: NunjucksConfig;
  eta?: EtaConfig;
  ejs?: EJSConfig;
  copier?: CopierConfig;
  cookiecutter?: CookiecutterConfig;
  [key: string]: any; // Allow additional engine configs
}

/**
 * Template engine configuration
 */
export interface EngineConfig {
  /** Template engine type */
  type: EngineType;
  /** Optional semver constraint for engine version */
  version?: string;
  /** Engine-specific configuration options */
  config?: EngineSpecificConfig;
}

/**
 * File-level engine override
 */
export interface FileEngineOverride {
  /** Template engine type for this file pattern */
  type: EngineType;
  /** Engine-specific configuration */
  config?: EngineSpecificConfig;
}

/**
 * Migration definition for template updates
 */
export interface Migration {
  /** Target version for this migration */
  version: string;
  /** Path to migration script or inline command */
  script: string;
  /** Human-readable migration description */
  description?: string;
}

/**
 * Lifecycle hooks configuration
 */
export interface LifecycleHooks {
  /** Commands to run before generation */
  preGenerate?: string[];
  /** Commands to run after generation */
  postGenerate?: string[];
  /** Commands to run before updates */
  preUpdate?: string[];
  /** Commands to run after updates */
  postUpdate?: string[];
}

/**
 * Lifecycle configuration
 */
export interface Lifecycle {
  /** Migration scripts for template updates */
  migrations?: Migration[];
  /** Strategy for handling template updates */
  updateStrategy?: UpdateStrategy;
  /** Lifecycle hook commands */
  hooks?: LifecycleHooks;
}

/**
 * Variable validation rules
 */
export interface VariableValidation {
  /** Regex pattern for string validation */
  pattern?: string;
  /** Minimum value (number) or length (string/array) */
  min?: number;
  /** Maximum value (number) or length (string/array) */
  max?: number;
  /** Valid choices for enum/multiselect types */
  choices?: any[];
}

/**
 * Template variable definition
 */
export interface Variable {
  /** Variable name (camelCase recommended) */
  name: string;
  /** Variable data type */
  type: VariableType;
  /** Human-readable variable description */
  description?: string;
  /** Default value for the variable */
  default?: any;
  /** Whether this variable is required */
  required?: boolean;
  /** Custom prompt text for interactive input */
  prompt?: string;
  /** Validation rules */
  validation?: VariableValidation;
  /** Conditional expression for showing this variable */
  when?: string;
}

/**
 * Dependency definition
 */
export interface Dependency {
  /** Package name */
  name: string;
  /** Package manager type */
  type: DependencyType;
  /** Version constraint */
  version?: string;
  /** Whether this is a development dependency */
  dev?: boolean;
}

/**
 * Complete archetype configuration
 */
export interface ArchetypeConfig {
  /** Unique identifier for the archetype (kebab-case recommended) */
  name: string;
  /** Semantic version of the archetype */
  version: string;
  /** Human-readable description of the archetype's purpose */
  description: string;
  /** Primary category for archetype classification */
  category: ArchetypeCategory;
  /** Additional tags for discovery and filtering */
  tags?: string[];
  /** Archetype author information */
  author?: Author;
  /** Source repository information */
  repository?: Repository;
  /** Template engine configuration (defaults to handlebars if omitted) */
  engine?: EngineConfig;
  /** Per-file or per-pattern engine overrides for mixed-engine templates */
  fileEngineOverrides?: Record<string, FileEngineOverride>;
  /** Lifecycle hooks and update strategies */
  lifecycle?: Lifecycle;
  /** Template variables with validation and defaults */
  variables?: Variable[];
  /** Required dependencies for generated projects */
  dependencies?: Dependency[];
  /** File patterns to include in the archetype */
  files: string[];
  /** File patterns to exclude from the archetype */
  ignore?: string[];
  /** Parent archetype to inherit from */
  extends?: string;
}

/**
 * Type guard to check if a value is a valid EngineType
 */
export function isEngineType(value: any): value is EngineType {
  return (
    typeof value === 'string' &&
    ['handlebars', 'nunjucks', 'eta', 'ejs', 'copier', 'cookiecutter'].includes(
      value
    )
  );
}

/**
 * Type guard to check if a value is a valid ArchetypeCategory
 */
export function isArchetypeCategory(value: any): value is ArchetypeCategory {
  return (
    typeof value === 'string' &&
    [
      'infrastructure',
      'service',
      'ui',
      'library',
      'tool',
      'agent',
      'documentation',
      'database',
      'integration',
    ].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid UpdateStrategy
 */
export function isUpdateStrategy(value: any): value is UpdateStrategy {
  return (
    typeof value === 'string' &&
    ['overwrite', 'merge', 'skip', 'prompt'].includes(value)
  );
}

/**
 * Helper to get default engine config
 */
export function getDefaultEngine(): EngineConfig {
  return {
    type: 'handlebars',
    config: {
      handlebars: {
        noEscape: false,
        strict: false,
        assumeObjects: false,
        preventIndent: false,
      },
    },
  };
}

/**
 * Helper to validate archetype config structure
 */
export function validateArchetypeConfig(
  config: any
): config is ArchetypeConfig {
  if (!config || typeof config !== 'object') return false;

  // Check required fields
  const hasRequiredFields =
    typeof config.name === 'string' &&
    typeof config.version === 'string' &&
    typeof config.description === 'string' &&
    isArchetypeCategory(config.category) &&
    Array.isArray(config.files) &&
    config.files.length > 0;

  if (!hasRequiredFields) return false;

  // Validate engine if present
  if (config.engine) {
    if (!isEngineType(config.engine.type)) return false;
  }

  // Validate lifecycle.updateStrategy if present
  if (config.lifecycle?.updateStrategy) {
    if (!isUpdateStrategy(config.lifecycle.updateStrategy)) return false;
  }

  return true;
}

/**
 * Helper to merge archetype configs (for extends support)
 */
export function mergeArchetypeConfigs(
  base: ArchetypeConfig,
  override: Partial<ArchetypeConfig>
): ArchetypeConfig {
  return {
    ...base,
    ...override,
    variables: [...(base.variables || []), ...(override.variables || [])],
    dependencies: [
      ...(base.dependencies || []),
      ...(override.dependencies || []),
    ],
    files: [...base.files, ...(override.files || [])],
    ignore: [...(base.ignore || []), ...(override.ignore || [])],
    tags: [...(base.tags || []), ...(override.tags || [])],
    engine: override.engine || base.engine,
    fileEngineOverrides: {
      ...base.fileEngineOverrides,
      ...override.fileEngineOverrides,
    },
    lifecycle: {
      ...base.lifecycle,
      ...override.lifecycle,
      migrations: [
        ...(base.lifecycle?.migrations || []),
        ...(override.lifecycle?.migrations || []),
      ],
      hooks: {
        ...base.lifecycle?.hooks,
        ...override.lifecycle?.hooks,
      },
    },
  };
}
