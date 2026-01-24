/**
 * Multi-Engine Template System
 *
 * Unified template processing system supporting multiple engines:
 * - Handlebars
 * - Nunjucks (Jinja2-compatible)
 * - Eta
 * - EJS
 * - Python Bridge (Copier/Cookiecutter)
 *
 * @module engines
 */

// Core types
export type {
  // Engine types
  EngineType,
  ITemplateEngine,
  EngineInfo,
  EngineCapabilities,

  // Configuration
  EngineConfig,
  HandlebarsConfig,
  NunjucksConfig,
  EtaConfig,
  EJSConfig,
  PythonBridgeConfig,
  AnyEngineConfig,

  // Validation
  ValidationResult,
  SyntaxError,

  // Functions
  HelperFunction,
  FilterFunction,

  // Results
  ProcessingResult,

  // Factory
  EngineFactoryConfig,
  EngineDetectionResult,
  EngineRegistryEntry,

  // Statistics
  EngineStats,

  // Features
  EngineFeatures,
  EngineLifecycleHooks,

  // Compilation
  CompilationOptions,
  ICompiledTemplate,

  // Re-exported from scaffold types
  TemplateContext,
  TemplateVariable,
  EnvironmentContext,
} from './types.js';

// Base adapter
export { BaseTemplateEngineAdapter } from './base-adapter.js';

// Factory
export {
  TemplateEngineFactory,
  createTemplateEngineFactory,
  getDefaultFactory,
  resetDefaultFactory,
} from './factory.js';

// Convenience re-exports when adapters are implemented
// These will be uncommented as adapters are created
// export { HandlebarsEngineAdapter } from './adapters/handlebars-adapter.js';
// export { NunjucksEngineAdapter } from './adapters/nunjucks-adapter.js';
// export { EtaEngineAdapter } from './adapters/eta-adapter.js';
// export { EJSEngineAdapter } from './adapters/ejs-adapter.js';
// export { PythonBridgeAdapter } from './adapters/python-adapter.js';
