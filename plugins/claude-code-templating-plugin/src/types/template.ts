/**
 * Template engine type definitions
 *
 * Provides type-safe interfaces for universal template processing that supports
 * multiple template formats and streamlines code generation workflows.
 */

import type { TemplateFormat, TemplateVariable, TemplateContext, GeneratedFile, TemplateInfo } from './scaffold.js';

/**
 * Template source types
 */
export type TemplateSourceType =
  | 'local'      // Local filesystem path
  | 'git'        // Git repository URL
  | 'github'     // GitHub shorthand (owner/repo)
  | 'npm'        // NPM package
  | 'url'        // Direct URL
  | 'embedded';  // Embedded in plugin

/**
 * Template source configuration
 */
export interface TemplateSource {
  /** Source type */
  type: TemplateSourceType;
  /** Source location (path, URL, or package name) */
  location: string;
  /** Git reference (branch, tag, or commit) */
  ref?: string;
  /** Subdirectory within source */
  subdirectory?: string;
  /** Checkout options for Git sources */
  checkout?: GitCheckoutOptions;
}

/**
 * Git checkout options
 */
export interface GitCheckoutOptions {
  /** Shallow clone depth */
  depth?: number;
  /** Sparse checkout patterns */
  sparse?: string[];
  /** Clone submodules */
  submodules?: boolean;
}

/**
 * Template registry entry
 */
export interface TemplateRegistryEntry {
  /** Template name */
  name: string;
  /** Template version */
  version: string;
  /** Template description */
  description: string;
  /** Template format */
  format: TemplateFormat;
  /** Template source */
  source: TemplateSource;
  /** Template author */
  author?: string;
  /** Template category */
  category?: string;
  /** Template tags */
  tags?: string[];
  /** Last updated date */
  updatedAt?: string;
  /** Download count */
  downloads?: number;
  /** Star rating */
  stars?: number;
}

/**
 * Template registry interface
 */
export interface ITemplateRegistry {
  /** List all templates */
  list(options?: TemplateListOptions): Promise<TemplateRegistryEntry[]>;
  /** Search templates */
  search(query: string, options?: TemplateSearchOptions): Promise<TemplateRegistryEntry[]>;
  /** Get template by name */
  get(name: string, version?: string): Promise<TemplateRegistryEntry | null>;
  /** Register a template */
  register(entry: TemplateRegistryEntry): Promise<void>;
  /** Unregister a template */
  unregister(name: string): Promise<void>;
  /** Refresh registry cache */
  refresh(): Promise<void>;
}

/**
 * Template list options
 */
export interface TemplateListOptions {
  /** Filter by format */
  format?: TemplateFormat;
  /** Filter by category */
  category?: string;
  /** Filter by tags */
  tags?: string[];
  /** Sort by field */
  sortBy?: 'name' | 'updatedAt' | 'downloads' | 'stars';
  /** Sort order */
  sortOrder?: 'asc' | 'desc';
  /** Pagination limit */
  limit?: number;
  /** Pagination offset */
  offset?: number;
}

/**
 * Template search options
 */
export interface TemplateSearchOptions extends TemplateListOptions {
  /** Include description in search */
  searchDescription?: boolean;
  /** Include tags in search */
  searchTags?: boolean;
  /** Fuzzy matching */
  fuzzy?: boolean;
}

/**
 * Template loader options
 */
export interface TemplateLoaderOptions {
  /** Cache directory for downloaded templates */
  cacheDir?: string;
  /** Cache TTL in seconds */
  cacheTTL?: number;
  /** Skip cache */
  skipCache?: boolean;
  /** Verbose logging */
  verbose?: boolean;
}

/**
 * Template generation options
 */
export interface TemplateGenerationOptions {
  /** Output directory */
  outputDir: string;
  /** Variable values */
  variables: Record<string, unknown>;
  /** Overwrite existing files */
  force?: boolean;
  /** Dry run mode */
  dryRun?: boolean;
  /** File patterns to include */
  include?: string[];
  /** File patterns to exclude */
  exclude?: string[];
  /** Transform function for file paths */
  pathTransform?: (path: string) => string;
  /** Transform function for file content */
  contentTransform?: (content: string, path: string) => string;
  /** Post-generation hooks */
  postHooks?: PostGenerationHook[];
}

/**
 * Post-generation hook
 */
export interface PostGenerationHook {
  /** Hook name */
  name: string;
  /** Hook type */
  type: 'command' | 'function';
  /** Command to run (for command type) */
  command?: string;
  /** Function to execute (for function type) */
  fn?: (context: PostHookContext) => Promise<void>;
  /** Working directory */
  cwd?: string;
  /** Continue on error */
  continueOnError?: boolean;
}

/**
 * Post-hook execution context
 */
export interface PostHookContext {
  /** Output directory */
  outputDir: string;
  /** Generated files */
  files: GeneratedFile[];
  /** Template info */
  templateInfo: TemplateInfo;
  /** Variables used */
  variables: Record<string, unknown>;
}

/**
 * Cookiecutter template configuration
 */
export interface CookiecutterConfig {
  /** Default context values */
  default_context?: Record<string, unknown>;
  /** Abbreviations for templates */
  abbreviations?: Record<string, string>;
  /** Replay directory */
  replay_dir?: string;
  /** Cookiecutter version */
  cookiecutter_version?: string;
}

/**
 * Cookiecutter template definition (cookiecutter.json)
 */
export interface CookiecutterTemplate {
  /** Template variables and their defaults */
  [key: string]: unknown;
  /** Private context (prefixed with _) */
  _copy_without_render?: string[];
  _extensions?: string[];
  _output_dir?: string;
  _jinja2_env_vars?: Record<string, unknown>;
}

/**
 * Copier template configuration (copier.yml)
 */
export interface CopierConfig {
  /** Copier minimum version required */
  _min_copier_version?: string;
  /** Subdirectory to use as template root */
  _subdirectory?: string;
  /** Paths to exclude from template */
  _exclude?: string[];
  /** Skip generation if exists */
  _skip_if_exists?: string[];
  /** Tasks to run after generation */
  _tasks?: string[];
  /** Message to display after generation */
  _message_after_copy?: string;
  /** Message before copying */
  _message_before_copy?: string;
  /** Jinja extensions */
  _jinja_extensions?: string[];
  /** Template variables */
  [key: string]: CopierQuestion | unknown;
}

/**
 * Copier question definition
 */
export interface CopierQuestion {
  /** Question type */
  type?: 'str' | 'int' | 'float' | 'bool' | 'json' | 'yaml';
  /** Help text */
  help?: string;
  /** Default value */
  default?: unknown;
  /** Choices (for select type) */
  choices?: unknown[] | Record<string, unknown>;
  /** Multi-select */
  multiselect?: boolean;
  /** Validation regex */
  validator?: string;
  /** When condition */
  when?: string | boolean;
  /** Secret (hide input) */
  secret?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Maven archetype metadata
 */
export interface MavenArchetypeMetadata {
  /** Archetype name */
  name: string;
  /** Archetype artifact ID */
  artifactId: string;
  /** Archetype group ID */
  groupId: string;
  /** Archetype version */
  version: string;
  /** Description */
  description?: string;
  /** Required properties */
  requiredProperties?: MavenArchetypeProperty[];
  /** File sets */
  fileSets?: MavenArchetypeFileSet[];
  /** Modules */
  modules?: MavenArchetypeModule[];
}

/**
 * Maven archetype property
 */
export interface MavenArchetypeProperty {
  /** Property key */
  key: string;
  /** Default value */
  defaultValue?: string;
  /** Validation regex */
  validationRegex?: string;
}

/**
 * Maven archetype file set
 */
export interface MavenArchetypeFileSet {
  /** Is filtered (process variables) */
  filtered?: boolean;
  /** Is packaged (apply package structure) */
  packaged?: boolean;
  /** Encoding */
  encoding?: string;
  /** Directory */
  directory: string;
  /** Includes */
  includes?: string[];
  /** Excludes */
  excludes?: string[];
}

/**
 * Maven archetype module
 */
export interface MavenArchetypeModule {
  /** Module ID */
  id: string;
  /** Module directory */
  dir: string;
  /** Module name */
  name?: string;
  /** File sets */
  fileSets?: MavenArchetypeFileSet[];
}

/**
 * Template variable prompt configuration
 */
export interface TemplatePromptConfig {
  /** Variable definition */
  variable: TemplateVariable;
  /** Prompt message */
  message: string;
  /** Input mask (for sensitive values) */
  mask?: boolean;
  /** Transformer function */
  transformer?: (value: unknown) => unknown;
  /** Validator function */
  validator?: (value: unknown) => boolean | string;
  /** Filter function */
  filter?: (value: unknown) => unknown;
}

/**
 * Interactive prompt session
 */
export interface PromptSession {
  /** Prompt for all variables */
  promptAll(variables: TemplateVariable[]): Promise<Record<string, unknown>>;
  /** Prompt for a single variable */
  prompt(config: TemplatePromptConfig): Promise<unknown>;
  /** Confirm action */
  confirm(message: string, defaultValue?: boolean): Promise<boolean>;
  /** Select from choices */
  select(
    message: string,
    choices: Array<{ name: string; value: unknown }>,
    defaultValue?: unknown
  ): Promise<unknown>;
}

/**
 * Template validation error
 */
export interface TemplateValidationError {
  /** Error code */
  code: string;
  /** Error message */
  message: string;
  /** File path where error occurred */
  file?: string;
  /** Line number */
  line?: number;
  /** Column number */
  column?: number;
  /** Severity */
  severity: 'error' | 'warning' | 'info';
  /** Suggested fix */
  suggestion?: string;
}

/**
 * Template validation result
 */
export interface TemplateValidationResult {
  /** Whether template is valid */
  valid: boolean;
  /** Validation errors */
  errors: TemplateValidationError[];
  /** Validation warnings */
  warnings: TemplateValidationError[];
  /** Template info (if valid) */
  templateInfo?: TemplateInfo;
}

/**
 * Template diff entry
 */
export interface TemplateDiffEntry {
  /** File path */
  path: string;
  /** Diff type */
  type: 'added' | 'modified' | 'deleted' | 'unchanged';
  /** Content diff (if modified) */
  diff?: string;
  /** Old content (for modified/deleted) */
  oldContent?: string;
  /** New content (for added/modified) */
  newContent?: string;
}

/**
 * Template comparison result
 */
export interface TemplateComparisonResult {
  /** Diff entries */
  entries: TemplateDiffEntry[];
  /** Summary statistics */
  summary: {
    added: number;
    modified: number;
    deleted: number;
    unchanged: number;
  };
}

/**
 * Template extension interface for custom loaders
 */
export interface ITemplateExtension {
  /** Extension name */
  readonly name: string;
  /** Supported file extensions */
  readonly fileExtensions: string[];
  /** Initialize extension */
  initialize(): Promise<void>;
  /** Process template file */
  process(
    content: string,
    context: TemplateContext,
    filePath: string
  ): Promise<string>;
  /** Cleanup */
  dispose(): Promise<void>;
}

/**
 * Template cache entry
 */
export interface TemplateCacheEntry {
  /** Cache key */
  key: string;
  /** Template info */
  templateInfo: TemplateInfo;
  /** Local path */
  localPath: string;
  /** Created timestamp */
  createdAt: Date;
  /** Expires timestamp */
  expiresAt: Date;
  /** Source hash */
  sourceHash: string;
}

/**
 * Template cache interface
 */
export interface ITemplateCache {
  /** Get cached template */
  get(key: string): Promise<TemplateCacheEntry | null>;
  /** Set cached template */
  set(entry: TemplateCacheEntry): Promise<void>;
  /** Delete cached template */
  delete(key: string): Promise<void>;
  /** Clear all cache */
  clear(): Promise<void>;
  /** Get cache statistics */
  stats(): Promise<CacheStats>;
}

/**
 * Cache statistics
 */
export interface CacheStats {
  /** Total entries */
  entries: number;
  /** Total size in bytes */
  size: number;
  /** Hit count */
  hits: number;
  /** Miss count */
  misses: number;
  /** Hit rate */
  hitRate: number;
}
