/**
 * Multi-Engine Template System - Type Definitions
 *
 * Provides type-safe interfaces for a universal templating system that supports
 * multiple template engines: Handlebars, Nunjucks, Eta, EJS, and Python bridge (Copier/Cookiecutter).
 *
 * @module engines/types
 */

import type { TemplateContext } from '../types/scaffold.js';

/**
 * Supported template engine types
 */
export type EngineType =
  | 'handlebars'
  | 'nunjucks'
  | 'eta'
  | 'ejs'
  | 'python';

/**
 * Template engine capability flags
 */
export interface EngineCapabilities {
  /** Supports partial templates */
  partials: boolean;
  /** Supports custom helper functions */
  helpers: boolean;
  /** Supports inheritance/extends */
  inheritance: boolean;
  /** Supports async rendering */
  async: boolean;
  /** Supports streaming output */
  streaming: boolean;
  /** Supports auto-escaping */
  autoEscape: boolean;
  /** Supports custom filters */
  filters: boolean;
  /** Supports macros */
  macros: boolean;
  /** Supports includes */
  includes: boolean;
  /** Supports layouts */
  layouts: boolean;
}

/**
 * Engine information metadata
 */
export interface EngineInfo {
  /** Engine type identifier */
  type: EngineType;
  /** Engine display name */
  name: string;
  /** Engine version */
  version: string;
  /** Supported file extensions */
  extensions: string[];
  /** Engine capabilities */
  capabilities: EngineCapabilities;
  /** Engine description */
  description: string;
  /** Whether engine is currently available/loaded */
  available: boolean;
}

/**
 * Template validation result
 */
export interface ValidationResult {
  /** Whether template is valid */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
  /** Array of warnings */
  warnings?: string[];
  /** Array of syntax errors with location */
  syntaxErrors?: SyntaxError[];
}

/**
 * Syntax error with location information
 */
export interface SyntaxError {
  /** Error message */
  message: string;
  /** Line number (1-based) */
  line?: number;
  /** Column number (1-based) */
  column?: number;
  /** Error code */
  code?: string;
  /** Severity level */
  severity: 'error' | 'warning' | 'info';
}

/**
 * Helper function type for custom template helpers
 */
export type HelperFunction = (...args: any[]) => any;

/**
 * Filter function type for template filters (Nunjucks/EJS)
 */
export type FilterFunction = (value: any, ...args: any[]) => any;

/**
 * Template engine configuration options
 */
export interface EngineConfig {
  /** Enable auto-escaping of HTML */
  autoEscape?: boolean;
  /** Custom delimiters for interpolation */
  delimiters?: {
    /** Start delimiter for expressions */
    start?: string;
    /** End delimiter for expressions */
    end?: string;
  };
  /** Strict mode (throw errors on undefined variables) */
  strict?: boolean;
  /** Cache compiled templates */
  cache?: boolean;
  /** Base path for template resolution */
  basePath?: string;
  /** Custom file extensions to recognize */
  extensions?: string[];
  /** Engine-specific options */
  engineOptions?: Record<string, any>;
}

/**
 * Handlebars-specific configuration
 */
export interface HandlebarsConfig extends EngineConfig {
  /** Handlebars compile options */
  engineOptions?: {
    /** Prevent escaping */
    noEscape?: boolean;
    /** Track IDs for helpers */
    trackIds?: boolean;
    /** Known helpers for optimization */
    knownHelpers?: Record<string, boolean>;
    /** Known helpers only mode */
    knownHelpersOnly?: boolean;
    /** Assume objects are JS objects */
    assumeObjects?: boolean;
    /** Prevent indirect access */
    preventIndirect?: boolean;
    /** Explicit partial context */
    explicitPartialContext?: boolean;
  };
}

/**
 * Nunjucks-specific configuration
 */
export interface NunjucksConfig extends EngineConfig {
  /** Nunjucks environment options */
  engineOptions?: {
    /** Automatically reload templates when changed */
    autoescape?: boolean;
    /** Throw errors on undefined variables */
    throwOnUndefined?: boolean;
    /** Trim blocks */
    trimBlocks?: boolean;
    /** Left strip blocks */
    lstripBlocks?: boolean;
    /** Watch template files for changes */
    watch?: boolean;
    /** Use async rendering */
    async?: boolean;
    /** Custom tags */
    tags?: {
      blockStart?: string;
      blockEnd?: string;
      variableStart?: string;
      variableEnd?: string;
      commentStart?: string;
      commentEnd?: string;
    };
  };
}

/**
 * Eta-specific configuration
 */
export interface EtaConfig extends EngineConfig {
  /** Eta template options */
  engineOptions?: {
    /** Variable name for template data */
    varName?: string;
    /** Remove whitespace around tags */
    rmWhitespace?: boolean;
    /** Use 'with' blocks */
    useWith?: boolean;
    /** Async mode */
    async?: boolean;
    /** Include function */
    include?: Function;
    /** Include file function */
    includeFile?: Function;
  };
}

/**
 * EJS-specific configuration
 */
export interface EJSConfig extends EngineConfig {
  /** EJS render options */
  engineOptions?: {
    /** Compiled functions are cached */
    cache?: boolean;
    /** Name of file (for error reporting) */
    filename?: string;
    /** Function execution context */
    context?: any;
    /** Compiled function */
    compileDebug?: boolean;
    /** Include debug source */
    debug?: boolean;
    /** Remove all whitespace */
    rmWhitespace?: boolean;
    /** Use 'with' blocks */
    _with?: boolean;
    /** Used by cache to store functions */
    client?: boolean;
  };
}

/**
 * Python bridge configuration for Copier/Cookiecutter
 */
export interface PythonBridgeConfig extends EngineConfig {
  /** Python executable path */
  pythonPath?: string;
  /** Copier/Cookiecutter executable path */
  executablePath?: string;
  /** Working directory for Python execution */
  workingDir?: string;
  /** Environment variables for Python process */
  env?: Record<string, string>;
  /** Timeout for Python operations (ms) */
  timeout?: number;
  /** Use Copier (true) or Cookiecutter (false) */
  useCopier?: boolean;
  /** Additional CLI arguments */
  additionalArgs?: string[];
}

/**
 * Engine configuration union type
 */
export type AnyEngineConfig =
  | HandlebarsConfig
  | NunjucksConfig
  | EtaConfig
  | EJSConfig
  | PythonBridgeConfig;

/**
 * Template file processing result
 */
export interface ProcessingResult {
  /** Rendered content */
  content: string;
  /** Processing time in milliseconds */
  durationMs: number;
  /** Warnings during processing */
  warnings?: string[];
  /** Whether file should be skipped */
  skip?: boolean;
}

/**
 * Template engine interface - all engines must implement this
 */
export interface ITemplateEngine {
  /**
   * Process a template string with context
   * @param template - Template string to process
   * @param context - Template context with variables
   * @returns Rendered string
   */
  processString(template: string, context: TemplateContext): string;

  /**
   * Process a template file with context
   * @param path - Path to template file
   * @param context - Template context with variables
   * @returns Promise resolving to rendered string
   */
  processFile(path: string, context: TemplateContext): Promise<string>;

  /**
   * Process filename template (e.g., "{{name}}.service.ts")
   * @param filename - Filename template
   * @param context - Template context with variables
   * @returns Rendered filename
   */
  processFilename(filename: string, context: TemplateContext): string;

  /**
   * Register a partial template
   * @param name - Partial name
   * @param template - Template content
   */
  registerPartial(name: string, template: string): void;

  /**
   * Register a helper function
   * @param name - Helper name
   * @param fn - Helper function
   */
  registerHelper(name: string, fn: HelperFunction): void;

  /**
   * Validate template syntax without rendering
   * @param template - Template string to validate
   * @returns Validation result
   */
  validateTemplate(template: string): ValidationResult;

  /**
   * Extract variable names used in template
   * @param template - Template string
   * @returns Array of variable names
   */
  extractVariables(template: string): string[];

  /**
   * Get engine information and capabilities
   * @returns Engine metadata
   */
  getEngineInfo(): EngineInfo;
}

/**
 * Template engine factory configuration
 */
export interface EngineFactoryConfig {
  /** Default engine type to use */
  defaultEngine?: EngineType;
  /** Engine configurations by type */
  engines?: Partial<Record<EngineType, AnyEngineConfig>>;
  /** Enable lazy loading of engines */
  lazyLoad?: boolean;
  /** Cache engine instances */
  cacheInstances?: boolean;
  /** Custom extension mappings */
  extensionMap?: Record<string, EngineType>;
  /** Enable automatic engine detection */
  autoDetect?: boolean;
}

/**
 * Engine detection result
 */
export interface EngineDetectionResult {
  /** Detected engine type */
  engine: EngineType;
  /** Confidence score (0-1) */
  confidence: number;
  /** Reason for detection */
  reason: string;
  /** Detected file extensions */
  extensions?: string[];
}

/**
 * Engine registry entry
 */
export interface EngineRegistryEntry {
  /** Engine type */
  type: EngineType;
  /** Factory function to create engine instance */
  factory: (config?: AnyEngineConfig) => ITemplateEngine | Promise<ITemplateEngine>;
  /** Configuration for this engine */
  config?: AnyEngineConfig;
  /** Cached instance (if caching enabled) */
  instance?: ITemplateEngine;
  /** Whether engine is loaded */
  loaded: boolean;
  /** Load timestamp */
  loadedAt?: Date;
}

/**
 * Template engine statistics
 */
export interface EngineStats {
  /** Total templates processed */
  templatesProcessed: number;
  /** Total processing time (ms) */
  totalProcessingTime: number;
  /** Average processing time (ms) */
  averageProcessingTime: number;
  /** Number of errors */
  errors: number;
  /** Number of warnings */
  warnings: number;
  /** Cache hit ratio */
  cacheHitRatio?: number;
  /** Engine-specific stats */
  engineSpecific?: Record<string, any>;
}

/**
 * Template compilation options
 */
export interface CompilationOptions {
  /** Compile for async execution */
  async?: boolean;
  /** Optimize compiled template */
  optimize?: boolean;
  /** Include source maps */
  sourceMap?: boolean;
  /** Filename for error reporting */
  filename?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
}

/**
 * Compiled template interface
 */
export interface ICompiledTemplate {
  /** Render compiled template */
  render(context: TemplateContext): string | Promise<string>;
  /** Get compilation metadata */
  getMetadata(): Record<string, any>;
  /** Get source map if available */
  getSourceMap?(): any;
}

/**
 * Engine lifecycle hooks
 */
export interface EngineLifecycleHooks {
  /** Called before template processing */
  beforeProcess?: (template: string, context: TemplateContext) => void | Promise<void>;
  /** Called after template processing */
  afterProcess?: (result: string, template: string, context: TemplateContext) => string | Promise<string>;
  /** Called on processing error */
  onError?: (error: Error, template: string, context: TemplateContext) => void | Promise<void>;
  /** Called on engine initialization */
  onInit?: (engine: ITemplateEngine) => void | Promise<void>;
  /** Called on engine disposal */
  onDispose?: (engine: ITemplateEngine) => void | Promise<void>;
}

/**
 * Engine feature flags for conditional behavior
 */
export interface EngineFeatures {
  /** Support template compilation */
  compilation?: boolean;
  /** Support template preloading */
  preloading?: boolean;
  /** Support template watching */
  watching?: boolean;
  /** Support custom loaders */
  customLoaders?: boolean;
  /** Support middleware */
  middleware?: boolean;
  /** Support plugins */
  plugins?: boolean;
}

/**
 * Re-export common types from scaffold module
 */
export type { TemplateContext, TemplateVariable, EnvironmentContext } from '../types/scaffold.js';
