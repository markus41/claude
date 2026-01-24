/**
 * Multi-Engine Template System - Usage Examples
 *
 * Demonstrates various usage patterns for the template engine factory and adapters.
 *
 * @module engines/examples
 */

import {
  createTemplateEngineFactory,
  getDefaultFactory,
  type TemplateContext,
  type EngineFactoryConfig,
} from './index.js';

/**
 * Example 1: Basic factory usage
 */
export async function example1_BasicFactoryUsage() {
  // Create a factory with default settings
  const factory = createTemplateEngineFactory();

  // Get an engine by type
  const handlebars = await factory.getEngine('handlebars');

  // Create a template context
  const context: TemplateContext = {
    variables: {
      name: 'World',
      language: 'TypeScript',
    },
    computed: {
      timestamp: new Date().toISOString(),
    },
    env: {
      cwd: process.cwd(),
      user: process.env.USER || 'unknown',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  // Process a template
  const result = handlebars.processString('Hello {{name}}! You are using {{language}}.', context);
  console.log(result);
  // Output: Hello World! You are using TypeScript.
}

/**
 * Example 2: Auto-detection from file extension
 */
export async function example2_AutoDetection() {
  const factory = createTemplateEngineFactory({
    autoDetect: true,
  });

  // Get engine based on file extension
  const hbsEngine = await factory.getEngineByExtension('.hbs');
  const njkEngine = await factory.getEngineByExtension('.njk');
  const etaEngine = await factory.getEngineByExtension('.eta');

  console.log('Handlebars engine:', hbsEngine.getEngineInfo().name);
  console.log('Nunjucks engine:', njkEngine.getEngineInfo().name);
  console.log('Eta engine:', etaEngine.getEngineInfo().name);
}

/**
 * Example 3: Content-based detection
 */
export async function example3_ContentDetection() {
  const factory = createTemplateEngineFactory();

  // Detect engine from template content
  const handlebarsTemplate = 'Hello {{name}}!';
  const nunjucksTemplate = '{% for item in items %}{{item}}{% endfor %}';
  const ejsTemplate = '<% if (name) { %><%= name %><% } %>';

  const detection1 = factory.detectEngine(handlebarsTemplate);
  const detection2 = factory.detectEngine(nunjucksTemplate);
  const detection3 = factory.detectEngine(ejsTemplate);

  console.log('Detection 1:', detection1);
  console.log('Detection 2:', detection2);
  console.log('Detection 3:', detection3);
}

/**
 * Example 4: Custom configuration per engine
 */
export async function example4_CustomConfiguration() {
  const config: EngineFactoryConfig = {
    defaultEngine: 'nunjucks',
    engines: {
      handlebars: {
        autoEscape: false,
        engineOptions: {
          noEscape: true,
        },
      },
      nunjucks: {
        autoEscape: true,
        strict: true,
        engineOptions: {
          trimBlocks: true,
          lstripBlocks: true,
          throwOnUndefined: true,
        },
      },
      eta: {
        cache: true,
        engineOptions: {
          rmWhitespace: true,
          async: true,
        },
      },
    },
  };

  const factory = createTemplateEngineFactory(config);

  // Each engine uses its custom configuration
  const nunjucks = await factory.getEngine('nunjucks');
  const handlebars = await factory.getEngine('handlebars');

  console.log('Nunjucks info:', nunjucks.getEngineInfo());
  console.log('Handlebars info:', handlebars.getEngineInfo());
}

/**
 * Example 5: Custom extension mappings
 */
export async function example5_CustomExtensions() {
  const factory = createTemplateEngineFactory();

  // Add custom mappings
  factory.addExtensionMapping('.tmpl', 'handlebars');
  factory.addExtensionMapping('.tpl', 'nunjucks');
  factory.addExtensionMapping('.template', 'eta');

  // Get engine by custom extension
  const engine = await factory.getEngineByExtension('.tmpl');
  console.log('Engine for .tmpl:', engine.getEngineInfo().name);

  // View all mappings
  const mappings = factory.getExtensionMappings();
  console.log('All extension mappings:', mappings);
}

/**
 * Example 6: Helper and partial registration
 */
export async function example6_HelpersAndPartials() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  // Register custom helper
  engine.registerHelper('shout', (text: string) => text.toUpperCase() + '!!!');

  // Register partial
  engine.registerPartial('header', '<h1>{{title}}</h1>');

  // Use in template
  const context: TemplateContext = {
    variables: {
      title: 'Welcome',
      message: 'hello world',
    },
    computed: {},
    env: {
      cwd: process.cwd(),
      user: 'user',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  const result = engine.processString(
    '{{> header}}\n<p>{{shout message}}</p>',
    context
  );
  console.log(result);
  // Output: <h1>Welcome</h1>
  //         <p>HELLO WORLD!!!</p>
}

/**
 * Example 7: Template validation
 */
export async function example7_TemplateValidation() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  // Valid template
  const validTemplate = 'Hello {{name}}!';
  const validResult = engine.validateTemplate(validTemplate);
  console.log('Valid template:', validResult);

  // Invalid template
  const invalidTemplate = 'Hello {{name}';
  const invalidResult = engine.validateTemplate(invalidTemplate);
  console.log('Invalid template:', invalidResult);
}

/**
 * Example 8: Variable extraction
 */
export async function example8_VariableExtraction() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  const template = `
    Hello {{name}}!
    You are {{age}} years old.
    Your email is {{email}}.
    {{#if premium}}You have premium access.{{/if}}
  `;

  const variables = engine.extractVariables(template);
  console.log('Extracted variables:', variables);
  // Output: ['name', 'age', 'email', 'premium']
}

/**
 * Example 9: File processing
 */
export async function example9_FileProcessing() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  const context: TemplateContext = {
    variables: {
      projectName: 'my-awesome-app',
      author: 'John Doe',
    },
    computed: {
      year: new Date().getFullYear(),
    },
    env: {
      cwd: process.cwd(),
      user: process.env.USER || 'unknown',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  // Process a template file
  try {
    const result = await engine.processFile('./templates/README.md.hbs', context);
    console.log('Processed file:', result);
  } catch (error) {
    console.error('File processing failed:', error);
  }
}

/**
 * Example 10: Filename processing
 */
export async function example10_FilenameProcessing() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  const context: TemplateContext = {
    variables: {
      serviceName: 'user',
    },
    computed: {},
    env: {
      cwd: process.cwd(),
      user: 'user',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  // Process template filenames
  const filename1 = engine.processFilename('{{serviceName}}.service.ts.hbs', context);
  const filename2 = engine.processFilename('{{pascalCase serviceName}}Controller.ts.hbs', context);

  console.log('Filename 1:', filename1); // user.service.ts
  console.log('Filename 2:', filename2); // UserController.ts
}

/**
 * Example 11: Singleton factory usage
 */
export async function example11_SingletonFactory() {
  // Get default factory (singleton)
  const factory1 = getDefaultFactory();
  const factory2 = getDefaultFactory();

  console.log('Same instance:', factory1 === factory2); // true

  // Use the default factory
  const engine = await factory1.getEngine('handlebars');
  console.log('Engine type:', engine.getEngineInfo().type);
}

/**
 * Example 12: Engine information
 */
export async function example12_EngineInformation() {
  const factory = createTemplateEngineFactory();

  // Get info for all engines
  const allInfo = await factory.getAllEngineInfo();

  for (const [type, info] of allInfo.entries()) {
    console.log(`\nEngine: ${type}`);
    console.log(`  Name: ${info.name}`);
    console.log(`  Version: ${info.version}`);
    console.log(`  Extensions: ${info.extensions.join(', ')}`);
    console.log(`  Capabilities:`);
    console.log(`    - Partials: ${info.capabilities.partials}`);
    console.log(`    - Helpers: ${info.capabilities.helpers}`);
    console.log(`    - Async: ${info.capabilities.async}`);
    console.log(`    - Auto-escape: ${info.capabilities.autoEscape}`);
  }
}

/**
 * Example 13: Preloading engines
 */
export async function example13_Preloading() {
  const factory = createTemplateEngineFactory({
    lazyLoad: true, // Engines load on first use by default
  });

  console.log('Preloading all engines...');
  const startTime = Date.now();

  // Load all engines upfront
  await factory.preloadAll();

  const loadTime = Date.now() - startTime;
  console.log(`All engines loaded in ${loadTime}ms`);

  // Now engine access is instant (no lazy loading delay)
  const engine = await factory.getEngine('handlebars');
  console.log('Engine ready:', engine.getEngineInfo().name);
}

/**
 * Example 14: Cache management
 */
export async function example14_CacheManagement() {
  const factory = createTemplateEngineFactory({
    cacheInstances: true,
  });

  // Get engine (creates and caches)
  const engine1 = await factory.getEngine('handlebars');
  console.log('Engine 1 loaded');

  // Get same engine (returns cached instance)
  const engine2 = await factory.getEngine('handlebars');
  console.log('Same instance:', engine1 === engine2);

  // Clear cache
  factory.clearCache();
  console.log('Cache cleared');

  // Get engine again (creates new instance)
  const engine3 = await factory.getEngine('handlebars');
  console.log('New instance:', engine1 === engine3); // false
}

/**
 * Example 15: Error handling
 */
export async function example15_ErrorHandling() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  const context: TemplateContext = {
    variables: {},
    computed: {},
    env: {
      cwd: process.cwd(),
      user: 'user',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  // Handle SKIP_FILE error
  try {
    const template = '{{skipFile true}}Content';
    engine.processString(template, context);
  } catch (error) {
    if (error instanceof Error && error.message === 'SKIP_FILE') {
      console.log('File should be skipped');
    }
  }

  // Handle template syntax error
  try {
    const template = 'Hello {{name';
    engine.processString(template, context);
  } catch (error) {
    console.error('Template error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Example 16: Standard helpers showcase
 */
export async function example16_StandardHelpers() {
  const factory = createTemplateEngineFactory();
  const engine = await factory.getEngine('handlebars');

  const context: TemplateContext = {
    variables: {
      name: 'john doe',
      projectName: 'my-awesome-project',
    },
    computed: {},
    env: {
      cwd: process.cwd(),
      user: 'user',
      timestamp: new Date().toISOString(),
      date: new Date().toLocaleDateString(),
      platform: process.platform,
    },
  };

  const template = `
    Uppercase: {{uppercase name}}
    Lowercase: {{lowercase name}}
    Capitalize: {{capitalize name}}
    Pascal Case: {{pascalCase projectName}}
    Camel Case: {{camelCase projectName}}
    Snake Case: {{snakeCase projectName}}
    Kebab Case: {{kebabCase projectName}}
    Current Year: {{year}}
    UUID: {{uuid}}
    Default: {{default missing "fallback value"}}
  `;

  const result = engine.processString(template, context);
  console.log(result);
}

/**
 * Run all examples
 */
export async function runAllExamples() {
  console.log('=== Example 1: Basic Factory Usage ===');
  await example1_BasicFactoryUsage();

  console.log('\n=== Example 2: Auto-Detection ===');
  await example2_AutoDetection();

  console.log('\n=== Example 3: Content Detection ===');
  await example3_ContentDetection();

  console.log('\n=== Example 4: Custom Configuration ===');
  await example4_CustomConfiguration();

  console.log('\n=== Example 5: Custom Extensions ===');
  await example5_CustomExtensions();

  console.log('\n=== Example 6: Helpers and Partials ===');
  await example6_HelpersAndPartials();

  console.log('\n=== Example 7: Template Validation ===');
  await example7_TemplateValidation();

  console.log('\n=== Example 8: Variable Extraction ===');
  await example8_VariableExtraction();

  console.log('\n=== Example 9: File Processing ===');
  await example9_FileProcessing();

  console.log('\n=== Example 10: Filename Processing ===');
  await example10_FilenameProcessing();

  console.log('\n=== Example 11: Singleton Factory ===');
  await example11_SingletonFactory();

  console.log('\n=== Example 12: Engine Information ===');
  await example12_EngineInformation();

  console.log('\n=== Example 13: Preloading ===');
  await example13_Preloading();

  console.log('\n=== Example 14: Cache Management ===');
  await example14_CacheManagement();

  console.log('\n=== Example 15: Error Handling ===');
  await example15_ErrorHandling();

  console.log('\n=== Example 16: Standard Helpers ===');
  await example16_StandardHelpers();
}
