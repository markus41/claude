/**
 * Template Engine Factory
 *
 * Central factory for creating and managing template engine instances.
 * Supports multiple engines with lazy loading, configuration, and auto-detection.
 *
 * Features:
 * - Engine registration and retrieval
 * - Lazy loading of engine implementations
 * - Extension-based auto-detection
 * - Configuration management per engine
 * - Instance caching for performance
 *
 * @module engines/factory
 */

import type {
  ITemplateEngine,
  EngineType,
  EngineFactoryConfig,
  EngineRegistryEntry,
  EngineDetectionResult,
  AnyEngineConfig,
  EngineInfo,
} from './types.js';

/**
 * Template Engine Factory
 *
 * Manages creation and lifecycle of template engines.
 * Provides lazy loading, auto-detection, and configuration management.
 */
export class TemplateEngineFactory {
  private config: Required<EngineFactoryConfig>;
  private registry: Map<EngineType, EngineRegistryEntry>;
  private defaultExtensionMap: Map<string, EngineType>;

  /**
   * Create a new template engine factory
   * @param config - Factory configuration
   */
  constructor(config: EngineFactoryConfig = {}) {
    this.config = {
      defaultEngine: config.defaultEngine || 'handlebars',
      engines: config.engines || {},
      lazyLoad: config.lazyLoad !== false,
      cacheInstances: config.cacheInstances !== false,
      extensionMap: config.extensionMap || {},
      autoDetect: config.autoDetect !== false,
    };

    this.registry = new Map();
    this.defaultExtensionMap = this.createDefaultExtensionMap();
    this.registerDefaultEngines();
  }

  /**
   * Create default extension to engine type mapping
   */
  private createDefaultExtensionMap(): Map<string, EngineType> {
    return new Map([
      ['.hbs', 'handlebars'],
      ['.handlebars', 'handlebars'],
      ['.njk', 'nunjucks'],
      ['.nunjucks', 'nunjucks'],
      ['.j2', 'nunjucks'], // Jinja2 templates use Nunjucks (similar syntax)
      ['.jinja2', 'nunjucks'],
      ['.eta', 'eta'],
      ['.ejs', 'ejs'],
      ['.copier', 'python'],
      ['.cookiecutter', 'python'],
    ]);
  }

  /**
   * Register default engine factories
   * Uses lazy loading - engines are only loaded when first used
   */
  private registerDefaultEngines(): void {
    // Handlebars engine
    this.register('handlebars', async (config) => {
      const { HandlebarsEngineAdapter } = await import('./adapters/handlebars-adapter.js');
      return new HandlebarsEngineAdapter(config as any);
    });

    // Nunjucks engine
    this.register('nunjucks', async (config) => {
      const { NunjucksEngineAdapter } = await import('./adapters/nunjucks-adapter.js');
      return new NunjucksEngineAdapter(config as any);
    });

    // Eta engine
    this.register('eta', async (config) => {
      const { EtaEngineAdapter } = await import('./adapters/eta-adapter.js');
      return new EtaEngineAdapter(config as any);
    });

    // EJS engine
    this.register('ejs', async (config) => {
      const { EJSEngineAdapter } = await import('./adapters/ejs-adapter.js');
      return new EJSEngineAdapter(config as any);
    });

    // Python bridge (Copier/Cookiecutter)
    this.register('python', async (config) => {
      const { PythonBridgeAdapter } = await import('./adapters/python-adapter.js');
      return new PythonBridgeAdapter(config as any);
    });
  }

  /**
   * Register an engine factory function
   *
   * @param type - Engine type identifier
   * @param factory - Factory function that creates engine instance
   * @param config - Optional configuration for this engine
   */
  public register(
    type: EngineType,
    factory: (config?: AnyEngineConfig) => ITemplateEngine | Promise<ITemplateEngine>,
    config?: AnyEngineConfig
  ): void {
    this.registry.set(type, {
      type,
      factory,
      config,
      loaded: false,
    });
  }

  /**
   * Unregister an engine
   *
   * @param type - Engine type to unregister
   */
  public async unregister(type: EngineType): Promise<void> {
    const entry = this.registry.get(type);
    if (entry?.instance) {
      // Dispose of instance if it has a dispose method
      if ('dispose' in entry.instance && typeof entry.instance.dispose === 'function') {
        await entry.instance.dispose();
      }
    }
    this.registry.delete(type);
  }

  /**
   * Get or create a template engine instance
   *
   * @param type - Engine type to retrieve
   * @param config - Optional configuration override
   * @returns Template engine instance
   * @throws Error if engine type is not registered
   */
  public async getEngine(
    type: EngineType,
    config?: AnyEngineConfig
  ): Promise<ITemplateEngine> {
    const entry = this.registry.get(type);

    if (!entry) {
      throw new Error(
        `Template engine '${type}' is not registered. Available engines: ${this.getAvailableEngines().join(', ')}`
      );
    }

    // Return cached instance if available and no config override
    if (this.config.cacheInstances && entry.instance && !config) {
      return entry.instance;
    }

    // Create new instance
    const engineConfig = config || entry.config || this.config.engines[type];
    const instance = await entry.factory(engineConfig);

    // Cache instance if caching enabled and no config override
    if (this.config.cacheInstances && !config) {
      entry.instance = instance;
      entry.loaded = true;
      entry.loadedAt = new Date();
    }

    return instance;
  }

  /**
   * Get the default engine instance
   *
   * @returns Default template engine instance
   */
  public async getDefaultEngine(): Promise<ITemplateEngine> {
    return this.getEngine(this.config.defaultEngine);
  }

  /**
   * Get engine by file extension
   *
   * @param extension - File extension (with or without leading dot)
   * @returns Template engine instance
   * @throws Error if extension is not mapped to any engine
   */
  public async getEngineByExtension(extension: string): Promise<ITemplateEngine> {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;

    // Check custom extension map first
    const customType = this.config.extensionMap[ext];
    if (customType) {
      return this.getEngine(customType);
    }

    // Check default extension map
    const defaultType = this.defaultExtensionMap.get(ext);
    if (defaultType) {
      return this.getEngine(defaultType);
    }

    // Fall back to default engine
    if (this.config.autoDetect) {
      return this.getDefaultEngine();
    }

    throw new Error(
      `No engine registered for extension '${ext}'. Register a custom mapping or enable autoDetect.`
    );
  }

  /**
   * Detect engine type from template content
   *
   * @param template - Template string to analyze
   * @param filename - Optional filename for extension-based detection
   * @returns Detection result with engine type and confidence
   */
  public detectEngine(template: string, filename?: string): EngineDetectionResult {
    const detections: EngineDetectionResult[] = [];

    // Extension-based detection (highest confidence)
    if (filename) {
      const ext = this.extractExtension(filename);
      const engineType =
        this.config.extensionMap[ext] || this.defaultExtensionMap.get(ext);

      if (engineType) {
        detections.push({
          engine: engineType,
          confidence: 0.95,
          reason: `File extension '${ext}' maps to ${engineType}`,
          extensions: [ext],
        });
      }
    }

    // Content-based detection (lower confidence)
    detections.push(...this.detectFromContent(template));

    // Sort by confidence (descending)
    detections.sort((a, b) => b.confidence - a.confidence);

    // Return highest confidence detection or default
    return (
      detections[0] || {
        engine: this.config.defaultEngine,
        confidence: 0.5,
        reason: 'Default engine (no specific markers detected)',
      }
    );
  }

  /**
   * Detect engine from template content patterns
   */
  private detectFromContent(template: string): EngineDetectionResult[] {
    const results: EngineDetectionResult[] = [];

    // Handlebars detection
    if (/\{\{[^}]+\}\}/.test(template)) {
      results.push({
        engine: 'handlebars',
        confidence: 0.7,
        reason: 'Handlebars-style delimiters detected: {{ }}',
      });
    }

    // Nunjucks/Jinja2 detection
    if (/\{%[^%]+%\}/.test(template) || /\{\{[^}]+\}\}/.test(template)) {
      results.push({
        engine: 'nunjucks',
        confidence: 0.75,
        reason: 'Nunjucks-style block tags detected: {% %}',
      });
    }

    // EJS detection
    if (/<%[^>]+%>/.test(template)) {
      results.push({
        engine: 'ejs',
        confidence: 0.8,
        reason: 'EJS-style delimiters detected: <% %>',
      });
    }

    // Eta detection (similar to EJS but with specific patterns)
    if (/<%-?[^>]+%>/.test(template) && /\*\s*@eta/i.test(template)) {
      results.push({
        engine: 'eta',
        confidence: 0.85,
        reason: 'Eta-specific patterns detected',
      });
    }

    return results;
  }

  /**
   * Extract file extension from filename
   */
  private extractExtension(filename: string): string {
    const match = filename.match(/(\.[^.]+)$/);
    return match ? match[1]! : '';
  }

  /**
   * Get list of available engine types
   *
   * @returns Array of registered engine types
   */
  public getAvailableEngines(): EngineType[] {
    return Array.from(this.registry.keys());
  }

  /**
   * Check if an engine type is registered
   *
   * @param type - Engine type to check
   * @returns True if engine is registered
   */
  public hasEngine(type: EngineType): boolean {
    return this.registry.has(type);
  }

  /**
   * Get engine information for a specific type
   *
   * @param type - Engine type
   * @returns Engine info or null if not loaded yet
   */
  public async getEngineInfo(type: EngineType): Promise<EngineInfo | null> {
    const entry = this.registry.get(type);
    if (!entry) {
      return null;
    }

    // If instance exists, get info from it
    if (entry.instance) {
      return entry.instance.getEngineInfo();
    }

    // Otherwise, need to load the engine to get info
    if (this.config.lazyLoad) {
      const engine = await this.getEngine(type);
      return engine.getEngineInfo();
    }

    return null;
  }

  /**
   * Get information for all registered engines
   *
   * @returns Map of engine types to their info
   */
  public async getAllEngineInfo(): Promise<Map<EngineType, EngineInfo>> {
    const infoMap = new Map<EngineType, EngineInfo>();

    for (const type of this.getAvailableEngines()) {
      const info = await this.getEngineInfo(type);
      if (info) {
        infoMap.set(type, info);
      }
    }

    return infoMap;
  }

  /**
   * Preload all registered engines
   * Useful for avoiding lazy-loading delays at runtime
   */
  public async preloadAll(): Promise<void> {
    const promises = this.getAvailableEngines().map((type) => this.getEngine(type));
    await Promise.all(promises);
  }

  /**
   * Clear all cached engine instances
   */
  public clearCache(): void {
    for (const entry of this.registry.values()) {
      entry.instance = undefined;
      entry.loaded = false;
      entry.loadedAt = undefined;
    }
  }

  /**
   * Dispose of all engine instances and clear registry
   */
  public async dispose(): Promise<void> {
    const disposePromises: Promise<void>[] = [];

    for (const entry of this.registry.values()) {
      if (entry.instance && 'dispose' in entry.instance) {
        disposePromises.push(
          (entry.instance.dispose as () => Promise<void>)().catch((error) => {
            console.error(`Error disposing engine ${entry.type}:`, error);
          })
        );
      }
    }

    await Promise.all(disposePromises);
    this.registry.clear();
  }

  /**
   * Get factory configuration
   */
  public getConfig(): Required<EngineFactoryConfig> {
    return { ...this.config };
  }

  /**
   * Update factory configuration
   * Note: Does not affect already-loaded engine instances
   */
  public updateConfig(config: Partial<EngineFactoryConfig>): void {
    this.config = {
      ...this.config,
      ...config,
    };
  }

  /**
   * Add custom extension mapping
   *
   * @param extension - File extension (with or without leading dot)
   * @param engineType - Engine type to use for this extension
   */
  public addExtensionMapping(extension: string, engineType: EngineType): void {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    this.config.extensionMap[ext] = engineType;
  }

  /**
   * Remove custom extension mapping
   *
   * @param extension - File extension to remove
   */
  public removeExtensionMapping(extension: string): void {
    const ext = extension.startsWith('.') ? extension : `.${extension}`;
    delete this.config.extensionMap[ext];
  }

  /**
   * Get all extension mappings (custom + default)
   */
  public getExtensionMappings(): Record<string, EngineType> {
    const mappings: Record<string, EngineType> = {};

    // Add default mappings
    for (const [ext, type] of this.defaultExtensionMap.entries()) {
      mappings[ext] = type;
    }

    // Override with custom mappings
    for (const [ext, type] of Object.entries(this.config.extensionMap)) {
      mappings[ext] = type;
    }

    return mappings;
  }

  /**
   * Set the default engine type
   *
   * @param type - Engine type to use as default
   */
  public setDefaultEngine(type: EngineType): void {
    if (!this.hasEngine(type)) {
      throw new Error(`Cannot set default engine to unregistered type: ${type}`);
    }
    this.config.defaultEngine = type;
  }

  /**
   * Get the current default engine type
   */
  public getDefaultEngineType(): EngineType {
    return this.config.defaultEngine;
  }
}

/**
 * Create a default template engine factory instance
 *
 * @param config - Optional factory configuration
 * @returns New factory instance
 */
export function createTemplateEngineFactory(
  config?: EngineFactoryConfig
): TemplateEngineFactory {
  return new TemplateEngineFactory(config);
}

/**
 * Singleton factory instance for convenience
 * Note: For testing or multiple configurations, create separate factory instances
 */
let defaultFactory: TemplateEngineFactory | null = null;

/**
 * Get the default singleton factory instance
 *
 * @returns Default factory instance
 */
export function getDefaultFactory(): TemplateEngineFactory {
  if (!defaultFactory) {
    defaultFactory = new TemplateEngineFactory();
  }
  return defaultFactory;
}

/**
 * Reset the default factory instance
 * Useful for testing or reconfiguration
 */
export async function resetDefaultFactory(): Promise<void> {
  if (defaultFactory) {
    await defaultFactory.dispose();
    defaultFactory = null;
  }
}
