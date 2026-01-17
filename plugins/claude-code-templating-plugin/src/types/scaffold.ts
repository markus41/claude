/**
 * Scaffolding type definitions for project generation
 *
 * Provides type-safe interfaces for universal scaffolding that supports
 * multiple template formats and streamlines project creation workflows.
 */

/**
 * Template format types supported by the scaffolding engine
 */
export type TemplateFormat =
  | 'handlebars'
  | 'cookiecutter'
  | 'copier'
  | 'maven-archetype'
  | 'harness'
  | 'custom';

/**
 * Variable types supported in template definitions
 */
export type VariableType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'choice'
  | 'multi-choice'
  | 'path'
  | 'email'
  | 'url'
  | 'uuid'
  | 'semver';

/**
 * Template variable definition
 */
export interface TemplateVariable {
  /** Variable identifier used in templates */
  name: string;
  /** Variable type determines validation and prompting behavior */
  type: VariableType;
  /** Human-readable prompt shown during interactive input */
  prompt: string;
  /** Default value if user doesn't provide input */
  default?: string | number | boolean | string[];
  /** Regex pattern for validation (string types only) */
  validation?: string;
  /** Available choices (for choice/multi-choice types) */
  choices?: string[];
  /** Help text explaining the variable purpose */
  description?: string;
  /** Whether this variable is required */
  required?: boolean;
  /** Conditional display based on other variable values */
  when?: string | ((answers: Record<string, unknown>) => boolean);
}

/**
 * Scaffold specification for project generation
 */
export interface ScaffoldSpec {
  /** Project name (kebab-case) */
  name: string;
  /** Project description */
  description?: string;
  /** Template source (name, URL, or path) */
  template: string;
  /** Template format override (auto-detected if not specified) */
  format?: TemplateFormat;
  /** Output directory (defaults to current directory + name) */
  outputPath?: string;
  /** Variable values for template substitution */
  variables?: Record<string, unknown>;
  /** Generate Harness pipeline alongside project */
  harnessIntegration?: boolean;
  /** Target environments for Harness pipeline */
  environments?: string[];
  /** Skip interactive prompts */
  nonInteractive?: boolean;
  /** Overwrite existing files */
  force?: boolean;
  /** Dry run (don't write files) */
  dryRun?: boolean;
  /** Verbose output */
  verbose?: boolean;
  /** Post-generation hooks to run */
  postHooks?: string[];
}

/**
 * Result of a scaffold operation
 */
export interface ScaffoldResult {
  /** Whether scaffolding succeeded */
  success: boolean;
  /** Output directory path */
  outputPath: string;
  /** List of generated files */
  files: GeneratedFile[];
  /** Any warnings during generation */
  warnings: string[];
  /** Error message if failed */
  error?: string;
  /** Generated Harness resources (if integration enabled) */
  harnessResources?: HarnessGeneratedResources;
  /** Template metadata */
  templateInfo: TemplateInfo;
  /** Execution time in milliseconds */
  durationMs: number;
}

/**
 * Information about a generated file
 */
export interface GeneratedFile {
  /** Relative path from output directory */
  path: string;
  /** Whether file was created or modified */
  action: 'created' | 'modified' | 'skipped';
  /** File size in bytes */
  size: number;
  /** File type/category */
  type?: 'source' | 'config' | 'test' | 'docs' | 'template' | 'other';
}

/**
 * Template metadata and information
 */
export interface TemplateInfo {
  /** Template name */
  name: string;
  /** Template version */
  version?: string;
  /** Template description */
  description?: string;
  /** Template author */
  author?: string;
  /** Template source URL or path */
  source: string;
  /** Detected or specified format */
  format: TemplateFormat;
  /** Variables defined in template */
  variables: TemplateVariable[];
}

/**
 * Generated Harness resources from integration
 */
export interface HarnessGeneratedResources {
  /** Pipeline YAML path */
  pipelinePath?: string;
  /** Service configuration path */
  servicePath?: string;
  /** Environment configurations */
  environments?: string[];
  /** Connector configurations */
  connectors?: string[];
}

/**
 * Template context for variable substitution
 */
export interface TemplateContext {
  /** User-provided variable values */
  variables: Record<string, unknown>;
  /** Computed values (dates, derived values, etc.) */
  computed: Record<string, unknown>;
  /** Environment information */
  env: EnvironmentContext;
}

/**
 * Environment context information
 */
export interface EnvironmentContext {
  /** Current working directory */
  cwd: string;
  /** Current user */
  user: string;
  /** Timestamp */
  timestamp: string;
  /** Date */
  date: string;
  /** Platform */
  platform: string;
}

/**
 * Template engine interface
 */
export interface ITemplateEngine {
  /** Process a template string with context */
  processString(template: string, context: TemplateContext): string;
  /** Process a template file with context */
  processFile(templatePath: string, context: TemplateContext): Promise<string>;
  /** Validate template syntax */
  validateTemplate(template: string): ValidationResult;
  /** Extract variables from template */
  extractVariables(template: string): string[];
}

/**
 * Validation result
 */
export interface ValidationResult {
  /** Whether validation passed */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Warnings */
  warnings?: string[];
}

/**
 * Template loader interface for different formats
 */
export interface ITemplateLoader {
  /** Format this loader handles */
  readonly format: TemplateFormat;
  /** Check if this loader can handle the given source */
  canHandle(source: string): Promise<boolean>;
  /** Load template metadata */
  loadMetadata(source: string): Promise<TemplateInfo>;
  /** Generate files from template */
  generate(
    source: string,
    outputPath: string,
    variables: Record<string, unknown>
  ): Promise<GeneratedFile[]>;
}

/**
 * Project analysis result for template generation
 */
export interface ProjectAnalysis {
  /** Project name */
  projectName?: string;
  /** Detected project type */
  projectType: ProjectType;
  /** Primary language */
  language: string;
  /** Detected frameworks */
  frameworks: string[];
  /** Package manager */
  packageManager?: string;
  /** Build tool */
  buildTool?: string;
  /** Test framework */
  testFramework?: string;
  /** Detected patterns */
  patterns: DetectedPattern[];
  /** Suggested template variables */
  suggestedVariables: Record<string, unknown>;
  /** Project dependencies */
  dependencies?: Record<string, string>;
  /** Development dependencies */
  devDependencies?: Record<string, string>;
  /** Has tests directory or test files */
  hasTests?: boolean;
  /** Has Dockerfile */
  hasDockerfile?: boolean;
  /** Has Kubernetes configs (.yaml files in k8s/ or similar) */
  hasKubernetesConfig?: boolean;
  /** Has Terraform files */
  hasTerraform?: boolean;
}

/**
 * Project types for scaffolding
 */
export type ProjectType =
  | 'microservice'
  | 'api'
  | 'webapp'
  | 'library'
  | 'cli'
  | 'etl-pipeline'
  | 'infrastructure'
  | 'monorepo'
  | 'unknown';

/**
 * Detected code pattern
 */
export interface DetectedPattern {
  /** Pattern name */
  name: string;
  /** Pattern category */
  category: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Files where pattern was detected */
  files: string[];
}
