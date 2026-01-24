#!/usr/bin/env ts-node
/**
 * Archetype Validation Script
 *
 * Validates archetype.json files against the schema and provides detailed feedback.
 *
 * Usage:
 *   npx ts-node scripts/validate-archetype.ts path/to/archetype.json
 *   npm run validate-archetype -- path/to/archetype.json
 */

import * as fs from 'fs';
import * as path from 'path';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import {
  ArchetypeConfig,
  validateArchetypeConfig,
  isEngineType,
  isArchetypeCategory,
  getDefaultEngine,
} from '../types/archetype.types';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  info: string[];
}

class ArchetypeValidator {
  private ajv: Ajv;
  private schema: any;
  private schemaPath: string;

  constructor() {
    this.ajv = new Ajv({ allErrors: true, verbose: true });
    addFormats(this.ajv);

    // Load schema
    this.schemaPath = path.resolve(__dirname, '../schemas/archetype.schema.json');
    this.schema = JSON.parse(fs.readFileSync(this.schemaPath, 'utf-8'));
    this.ajv.addSchema(this.schema, 'archetype');
  }

  /**
   * Validate archetype.json file
   */
  validateFile(filePath: string): ValidationResult {
    const result: ValidationResult = {
      valid: true,
      errors: [],
      warnings: [],
      info: [],
    };

    // Check file exists
    if (!fs.existsSync(filePath)) {
      result.valid = false;
      result.errors.push(`File not found: ${filePath}`);
      return result;
    }

    // Read and parse JSON
    let config: any;
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      config = JSON.parse(content);
    } catch (error) {
      result.valid = false;
      result.errors.push(`Invalid JSON: ${error.message}`);
      return result;
    }

    // JSON Schema validation
    const validate = this.ajv.getSchema('archetype');
    if (!validate) {
      result.valid = false;
      result.errors.push('Schema not loaded');
      return result;
    }

    const schemaValid = validate(config);
    if (!schemaValid) {
      result.valid = false;
      validate.errors?.forEach((error) => {
        const path = error.instancePath || '/';
        const message = error.message || 'Unknown error';
        result.errors.push(`${path}: ${message}`);
      });
    }

    // TypeScript type validation
    if (!validateArchetypeConfig(config)) {
      result.valid = false;
      result.errors.push('Failed TypeScript type validation');
    }

    // Additional validations
    this.validateEngine(config, result);
    this.validateVariables(config, result);
    this.validateFiles(config, path.dirname(filePath), result);
    this.validateLifecycle(config, path.dirname(filePath), result);
    this.addRecommendations(config, result);

    return result;
  }

  /**
   * Validate engine configuration
   */
  private validateEngine(config: any, result: ValidationResult): void {
    if (!config.engine) {
      result.info.push('No engine specified - will default to Handlebars');
      return;
    }

    const engine = config.engine;

    // Check engine type
    if (!isEngineType(engine.type)) {
      result.errors.push(`Invalid engine type: ${engine.type}`);
      result.valid = false;
    }

    // Check version format
    if (engine.version && !/^[~^]?\d+(\.\d+)?(\.\d+)?/.test(engine.version)) {
      result.warnings.push(`Engine version should be semver format: ${engine.version}`);
    }

    // Check engine-specific config
    if (engine.config && !engine.config[engine.type]) {
      result.warnings.push(
        `Engine config does not contain '${engine.type}' key. Expected: config.${engine.type}`
      );
    }

    // Validate helper paths (Handlebars)
    if (engine.config?.handlebars?.helpers) {
      engine.config.handlebars.helpers.forEach((helperPath: string) => {
        if (!helperPath.startsWith('./')) {
          result.warnings.push(
            `Helper path should be relative: ${helperPath} (use ./helpers/...)`
          );
        }
      });
    }

    // Validate filter paths (Nunjucks)
    if (engine.config?.nunjucks?.filters) {
      Object.entries(engine.config.nunjucks.filters).forEach(([name, filterPath]) => {
        if (typeof filterPath === 'string' && !filterPath.startsWith('./')) {
          result.warnings.push(
            `Filter path should be relative: ${filterPath} (use ./filters/...)`
          );
        }
      });
    }
  }

  /**
   * Validate variables configuration
   */
  private validateVariables(config: any, result: ValidationResult): void {
    if (!config.variables || config.variables.length === 0) {
      result.warnings.push('No variables defined - archetype will be static');
      return;
    }

    const variableNames = new Set<string>();

    config.variables.forEach((variable: any, index: number) => {
      const varPath = `variables[${index}]`;

      // Check duplicate names
      if (variableNames.has(variable.name)) {
        result.errors.push(`${varPath}: Duplicate variable name: ${variable.name}`);
        result.valid = false;
      }
      variableNames.add(variable.name);

      // Check name format (should be camelCase or snake_case)
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(variable.name)) {
        result.warnings.push(
          `${varPath}.name: Variable name should be camelCase or snake_case: ${variable.name}`
        );
      }

      // Check required + default conflict
      if (variable.required && variable.default !== undefined) {
        result.warnings.push(
          `${varPath}: Variable is required but has default value - default will be ignored`
        );
      }

      // Validate enum choices
      if (variable.type === 'enum' || variable.type === 'multiselect') {
        if (!variable.validation?.choices || variable.validation.choices.length === 0) {
          result.errors.push(
            `${varPath}: ${variable.type} type requires validation.choices`
          );
          result.valid = false;
        }

        if (variable.default && variable.validation?.choices) {
          const defaultValue = variable.default;
          const isMulti = Array.isArray(defaultValue);
          const valuesToCheck = isMulti ? defaultValue : [defaultValue];

          valuesToCheck.forEach((val: any) => {
            if (!variable.validation.choices.includes(val)) {
              result.warnings.push(
                `${varPath}: Default value '${val}' not in choices`
              );
            }
          });
        }
      }

      // Validate pattern
      if (variable.validation?.pattern) {
        try {
          new RegExp(variable.validation.pattern);
        } catch (error) {
          result.errors.push(`${varPath}.validation.pattern: Invalid regex`);
          result.valid = false;
        }
      }

      // Validate min/max
      if (variable.validation?.min !== undefined && variable.validation?.max !== undefined) {
        if (variable.validation.min > variable.validation.max) {
          result.errors.push(
            `${varPath}.validation: min (${variable.validation.min}) > max (${variable.validation.max})`
          );
          result.valid = false;
        }
      }

      // Check 'when' references valid variables
      if (variable.when) {
        const referencedVars = variable.when.match(/\b[a-zA-Z_][a-zA-Z0-9_]*\b/g) || [];
        referencedVars.forEach((refVar: string) => {
          if (!variableNames.has(refVar) && refVar !== 'true' && refVar !== 'false') {
            result.warnings.push(
              `${varPath}.when: References undefined variable: ${refVar}`
            );
          }
        });
      }
    });
  }

  /**
   * Validate file patterns exist
   */
  private validateFiles(config: any, basePath: string, result: ValidationResult): void {
    if (!config.files || config.files.length === 0) {
      result.errors.push('No files specified - archetype will be empty');
      result.valid = false;
      return;
    }

    // Check if templates directory exists
    const templatesPath = path.join(basePath, 'templates');
    if (!fs.existsSync(templatesPath)) {
      result.warnings.push(
        'templates/ directory not found - ensure file patterns are correct'
      );
    }

    // Check for common patterns
    const hasGlobPattern = config.files.some((pattern: string) =>
      pattern.includes('*')
    );
    if (!hasGlobPattern) {
      result.warnings.push('No glob patterns in files - consider using templates/**/*');
    }
  }

  /**
   * Validate lifecycle configuration
   */
  private validateLifecycle(
    config: any,
    basePath: string,
    result: ValidationResult
  ): void {
    if (!config.lifecycle) {
      result.info.push('No lifecycle configuration - hooks and migrations not defined');
      return;
    }

    const lifecycle = config.lifecycle;

    // Validate migrations
    if (lifecycle.migrations) {
      const versions = new Set<string>();

      lifecycle.migrations.forEach((migration: any, index: number) => {
        const migPath = `lifecycle.migrations[${index}]`;

        // Check duplicate versions
        if (versions.has(migration.version)) {
          result.warnings.push(
            `${migPath}: Duplicate migration version: ${migration.version}`
          );
        }
        versions.add(migration.version);

        // Check version format
        if (!/^\d+\.\d+\.\d+$/.test(migration.version)) {
          result.warnings.push(
            `${migPath}.version: Should be semver format (X.Y.Z): ${migration.version}`
          );
        }

        // Check script exists
        const scriptPath = path.join(basePath, migration.script);
        if (!fs.existsSync(scriptPath)) {
          result.warnings.push(
            `${migPath}.script: File not found: ${migration.script}`
          );
        } else {
          // Check if script is executable (Unix-like systems)
          try {
            const stats = fs.statSync(scriptPath);
            const isExecutable = (stats.mode & 0o111) !== 0;
            if (!isExecutable && process.platform !== 'win32') {
              result.warnings.push(
                `${migPath}.script: File not executable (try: chmod +x ${migration.script})`
              );
            }
          } catch (error) {
            // Ignore stat errors
          }
        }
      });
    }

    // Validate hooks
    if (lifecycle.hooks) {
      const hookTypes = ['preGenerate', 'postGenerate', 'preUpdate', 'postUpdate'];
      hookTypes.forEach((hookType) => {
        const commands = lifecycle.hooks[hookType];
        if (commands && commands.length > 0) {
          result.info.push(`Lifecycle hook defined: ${hookType} (${commands.length} commands)`);
        }
      });
    }

    // Validate update strategy
    if (lifecycle.updateStrategy) {
      const validStrategies = ['overwrite', 'merge', 'skip', 'prompt'];
      if (!validStrategies.includes(lifecycle.updateStrategy)) {
        result.errors.push(
          `lifecycle.updateStrategy: Invalid value: ${lifecycle.updateStrategy}`
        );
        result.valid = false;
      }
    }
  }

  /**
   * Add recommendations for best practices
   */
  private addRecommendations(config: any, result: ValidationResult): void {
    // Recommend adding tags
    if (!config.tags || config.tags.length === 0) {
      result.info.push('Recommendation: Add tags for better archetype discovery');
    }

    // Recommend adding author
    if (!config.author) {
      result.info.push('Recommendation: Add author information');
    }

    // Recommend adding repository
    if (!config.repository) {
      result.info.push('Recommendation: Add repository information for source tracking');
    }

    // Recommend semantic versioning
    if (!/^\d+\.\d+\.\d+/.test(config.version)) {
      result.warnings.push('Version should follow semantic versioning (X.Y.Z)');
    }

    // Recommend description length
    if (config.description && config.description.length < 20) {
      result.info.push('Recommendation: Add more detailed description (20+ characters)');
    }

    // Recommend ignore patterns
    if (!config.ignore || config.ignore.length === 0) {
      result.info.push(
        'Recommendation: Add ignore patterns (node_modules/, .DS_Store, *.log, etc.)'
      );
    }
  }

  /**
   * Print validation results
   */
  printResults(filePath: string, result: ValidationResult): void {
    console.log(`\n${colors.bright}Validating: ${colors.cyan}${filePath}${colors.reset}\n`);

    // Print errors
    if (result.errors.length > 0) {
      console.log(`${colors.red}${colors.bright}✗ Errors (${result.errors.length}):${colors.reset}`);
      result.errors.forEach((error) => {
        console.log(`  ${colors.red}•${colors.reset} ${error}`);
      });
      console.log();
    }

    // Print warnings
    if (result.warnings.length > 0) {
      console.log(
        `${colors.yellow}${colors.bright}⚠ Warnings (${result.warnings.length}):${colors.reset}`
      );
      result.warnings.forEach((warning) => {
        console.log(`  ${colors.yellow}•${colors.reset} ${warning}`);
      });
      console.log();
    }

    // Print info
    if (result.info.length > 0) {
      console.log(`${colors.blue}${colors.bright}ℹ Info (${result.info.length}):${colors.reset}`);
      result.info.forEach((info) => {
        console.log(`  ${colors.blue}•${colors.reset} ${info}`);
      });
      console.log();
    }

    // Print summary
    if (result.valid) {
      console.log(`${colors.green}${colors.bright}✓ Valid archetype.json${colors.reset}`);
      if (result.warnings.length === 0 && result.info.length === 0) {
        console.log(`  ${colors.green}No issues found!${colors.reset}`);
      }
    } else {
      console.log(`${colors.red}${colors.bright}✗ Invalid archetype.json${colors.reset}`);
      console.log(`  ${colors.red}Found ${result.errors.length} error(s)${colors.reset}`);
    }
    console.log();
  }
}

// Main execution
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: validate-archetype.ts <path-to-archetype.json>');
    console.error('\nExamples:');
    console.error('  npx ts-node scripts/validate-archetype.ts archetype.json');
    console.error('  npx ts-node scripts/validate-archetype.ts examples/archetypes/multi-engine/archetype.json');
    console.error(
      '  find examples/archetypes -name "archetype.json" -exec npx ts-node scripts/validate-archetype.ts {} \\;'
    );
    process.exit(1);
  }

  const validator = new ArchetypeValidator();
  let allValid = true;

  args.forEach((filePath) => {
    const result = validator.validateFile(filePath);
    validator.printResults(filePath, result);

    if (!result.valid) {
      allValid = false;
    }
  });

  process.exit(allValid ? 0 : 1);
}

// Run if executed directly
if (require.main === module) {
  main();
}

export { ArchetypeValidator, ValidationResult };
