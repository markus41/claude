/**
 * Core type definitions for the Claude Code Templating Plugin
 *
 * Establishes type-safe interfaces that support scalable template generation
 * and Harness pipeline automation across development workflows.
 */

export type {
  TemplateFormat,
  VariableType,
  TemplateVariable,
  ScaffoldSpec,
  ScaffoldResult,
  GeneratedFile,
  TemplateInfo,
  HarnessGeneratedResources,
  TemplateContext,
  EnvironmentContext,
  ITemplateEngine,
  ITemplateLoader,
  ProjectAnalysis,
  ProjectType,
  DetectedPattern,
} from './scaffold.js';
export { type ValidationResult as ScaffoldValidationResult } from './scaffold.js';
export * from './harness.js';
export * from './mcp.js';
export type {
  TemplateSource,
  TemplateSourceType,
  TemplateRegistryEntry,
  ITemplateRegistry,
  TemplateListOptions,
  TemplateSearchOptions,
  TemplateLoaderOptions,
  TemplateGenerationOptions,
  PostGenerationHook,
  PostHookContext,
  CookiecutterConfig,
  CookiecutterTemplate,
  CopierConfig,
  CopierQuestion,
  MavenArchetypeMetadata,
  MavenArchetypeProperty,
  MavenArchetypeFileSet,
  MavenArchetypeModule,
  TemplatePromptConfig,
  PromptSession,
  TemplateValidationError,
  TemplateValidationResult,
  TemplateDiffEntry,
  TemplateComparisonResult,
  ITemplateExtension,
  TemplateCacheEntry,
  ITemplateCache,
  CacheStats,
} from './template.js';
export * from './agents.js';
