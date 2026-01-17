/**
 * Schema Validator
 *
 * Validates template configurations and generated output using JSON Schema.
 * Supports:
 * - Template configuration validation
 * - Generated file validation
 * - Custom validation rules
 * - Detailed error messages
 * - Multiple schema formats
 */

import Ajv from 'ajv';
import type { ValidateFunction, ErrorObject } from 'ajv';
import addFormats from 'ajv-formats';
import type { TemplateValidationResult, TemplateValidationError } from '../../types/template.js';
import type { TemplateInfo } from '../../types/scaffold.js';

export class SchemaValidator {
  private ajv: any;
  private validators: Map<string, ValidateFunction>;

  constructor() {
    this.ajv = new (Ajv as any)({
      allErrors: true,
      verbose: true,
      strict: false
    });

    // Add format validators
    (addFormats as any)(this.ajv);

    // Add custom formats
    this.registerCustomFormats();

    this.validators = new Map();

    // Register built-in schemas
    this.registerBuiltInSchemas();
  }

  /**
   * Register custom format validators
   */
  private registerCustomFormats(): void {
    // Kebab-case format
    this.ajv.addFormat('kebab-case', {
      type: 'string',
      validate: (value: string) => /^[a-z][a-z0-9-]*$/.test(value)
    });

    // Snake_case format
    this.ajv.addFormat('snake_case', {
      type: 'string',
      validate: (value: string) => /^[a-z][a-z0-9_]*$/.test(value)
    });

    // PascalCase format
    this.ajv.addFormat('pascal-case', {
      type: 'string',
      validate: (value: string) => /^[A-Z][a-zA-Z0-9]*$/.test(value)
    });

    // camelCase format
    this.ajv.addFormat('camel-case', {
      type: 'string',
      validate: (value: string) => /^[a-z][a-zA-Z0-9]*$/.test(value)
    });

    // Semver format
    this.ajv.addFormat('semver', {
      type: 'string',
      validate: (value: string) =>
        /^\d+\.\d+\.\d+(-[a-zA-Z0-9.-]+)?(\+[a-zA-Z0-9.-]+)?$/.test(value)
    });

    // Package name format
    this.ajv.addFormat('package-name', {
      type: 'string',
      validate: (value: string) =>
        /^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(value)
    });

    // Maven groupId format
    this.ajv.addFormat('maven-group-id', {
      type: 'string',
      validate: (value: string) =>
        /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(value)
    });

    // Maven artifactId format
    this.ajv.addFormat('maven-artifact-id', {
      type: 'string',
      validate: (value: string) => /^[a-z][a-z0-9-]*$/.test(value)
    });
  }

  /**
   * Register built-in validation schemas
   */
  private registerBuiltInSchemas(): void {
    // Template variable schema
    const variableSchema = {
      type: 'object',
      required: ['name', 'type', 'prompt'],
      properties: {
        name: { type: 'string', minLength: 1 },
        type: {
          type: 'string',
          enum: ['string', 'number', 'boolean', 'choice', 'multi-choice', 'path', 'email', 'url', 'uuid', 'semver']
        },
        prompt: { type: 'string', minLength: 1 },
        default: {},
        validation: { type: 'string' },
        choices: { type: 'array', items: { type: 'string' } },
        description: { type: 'string' },
        required: { type: 'boolean' },
        when: {}
      }
    };

    this.registerSchema('template-variable', variableSchema);

    // Template info schema
    const templateInfoSchema = {
      type: 'object',
      required: ['name', 'source', 'format', 'variables'],
      properties: {
        name: { type: 'string', minLength: 1 },
        version: { type: 'string', format: 'semver' },
        description: { type: 'string' },
        author: { type: 'string' },
        source: { type: 'string' },
        format: {
          type: 'string',
          enum: ['handlebars', 'cookiecutter', 'copier', 'maven-archetype', 'harness', 'custom']
        },
        variables: {
          type: 'array',
          items: { $ref: '#/definitions/variable' }
        }
      },
      definitions: {
        variable: variableSchema
      }
    };

    this.registerSchema('template-info', templateInfoSchema);

    // Cookiecutter config schema
    const cookiecutterSchema = {
      type: 'object',
      patternProperties: {
        '^[^_].*': {} // Any property not starting with _
      },
      properties: {
        _copy_without_render: {
          type: 'array',
          items: { type: 'string' }
        },
        _extensions: {
          type: 'array',
          items: { type: 'string' }
        },
        _output_dir: { type: 'string' },
        _jinja2_env_vars: { type: 'object' }
      }
    };

    this.registerSchema('cookiecutter-config', cookiecutterSchema);

    // Copier config schema
    const copierSchema = {
      type: 'object',
      properties: {
        _min_copier_version: { type: 'string' },
        _subdirectory: { type: 'string' },
        _exclude: {
          type: 'array',
          items: { type: 'string' }
        },
        _skip_if_exists: {
          type: 'array',
          items: { type: 'string' }
        },
        _tasks: {
          type: 'array',
          items: { type: 'string' }
        },
        _message_after_copy: { type: 'string' },
        _message_before_copy: { type: 'string' },
        _jinja_extensions: {
          type: 'array',
          items: { type: 'string' }
        }
      }
    };

    this.registerSchema('copier-config', copierSchema);

    // Harness template schema
    const harnessSchema = {
      type: 'object',
      required: ['template'],
      properties: {
        template: {
          type: 'object',
          required: ['name', 'identifier', 'type'],
          properties: {
            name: { type: 'string', minLength: 1 },
            identifier: { type: 'string', format: 'kebab-case' },
            versionLabel: { type: 'string' },
            type: {
              type: 'string',
              enum: ['Pipeline', 'Stage', 'Step', 'StepGroup', 'Service', 'Infrastructure']
            },
            spec: { type: 'object' },
            projectIdentifier: { type: 'string' },
            orgIdentifier: { type: 'string' }
          }
        }
      }
    };

    this.registerSchema('harness-template', harnessSchema);
  }

  /**
   * Register a validation schema
   */
  registerSchema(name: string, schema: object): void {
    const validator = this.ajv.compile(schema);
    this.validators.set(name, validator);
  }

  /**
   * Validate template configuration
   */
  validateTemplateConfig(
    config: unknown,
    schemaName: string
  ): TemplateValidationResult {
    const validator = this.validators.get(schemaName);

    if (!validator) {
      return {
        valid: false,
        errors: [
          {
            code: 'SCHEMA_NOT_FOUND',
            message: `Schema '${schemaName}' not found`,
            severity: 'error'
          }
        ],
        warnings: []
      };
    }

    const valid = validator(config);

    if (valid) {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

    const errors = this.formatErrors(validator.errors || []);

    return {
      valid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Validate template info
   */
  validateTemplateInfo(templateInfo: TemplateInfo): TemplateValidationResult {
    const result = this.validateTemplateConfig(templateInfo, 'template-info');

    if (result.valid) {
      // Additional validation for variables
      const variableErrors: TemplateValidationError[] = [];

      for (const variable of templateInfo.variables) {
        // Check if choices are provided for choice types
        if (
          (variable.type === 'choice' || variable.type === 'multi-choice') &&
          (!variable.choices || variable.choices.length === 0)
        ) {
          variableErrors.push({
            code: 'INVALID_VARIABLE',
            message: `Variable '${variable.name}' of type '${variable.type}' must have choices`,
            severity: 'error'
          });
        }

        // Check if validation regex is valid
        if (variable.validation) {
          try {
            new RegExp(variable.validation);
          } catch (error) {
            variableErrors.push({
              code: 'INVALID_REGEX',
              message: `Variable '${variable.name}' has invalid validation regex: ${error}`,
              severity: 'error'
            });
          }
        }
      }

      if (variableErrors.length > 0) {
        return {
          valid: false,
          errors: variableErrors,
          warnings: [],
          templateInfo
        };
      }

      result.templateInfo = templateInfo;
    }

    return result;
  }

  /**
   * Validate against custom schema
   */
  validate(data: unknown, schema: object): TemplateValidationResult {
    const validator = this.ajv.compile(schema);
    const valid = validator(data);

    if (valid) {
      return {
        valid: true,
        errors: [],
        warnings: []
      };
    }

    const errors = this.formatErrors(validator.errors || []);

    return {
      valid: false,
      errors,
      warnings: []
    };
  }

  /**
   * Format AJV errors to template validation errors
   */
  private formatErrors(errors: ErrorObject[]): TemplateValidationError[] {
    return errors.map(error => ({
      code: error.keyword.toUpperCase(),
      message: this.formatErrorMessage(error),
      file: undefined,
      line: undefined,
      column: undefined,
      severity: 'error' as const,
      suggestion: this.getSuggestion(error)
    }));
  }

  /**
   * Format error message
   */
  private formatErrorMessage(error: ErrorObject): string {
    const path = error.instancePath || 'root';

    switch (error.keyword) {
      case 'required':
        return `${path} is missing required property '${error.params.missingProperty}'`;
      case 'type':
        return `${path} should be ${error.params.type}`;
      case 'enum':
        return `${path} should be one of: ${error.params.allowedValues.join(', ')}`;
      case 'format':
        return `${path} should match format '${error.params.format}'`;
      case 'minLength':
        return `${path} should have at least ${error.params.limit} characters`;
      case 'maxLength':
        return `${path} should have at most ${error.params.limit} characters`;
      case 'pattern':
        return `${path} should match pattern '${error.params.pattern}'`;
      default:
        return error.message || `Validation error at ${path}`;
    }
  }

  /**
   * Get suggestion for error
   */
  private getSuggestion(error: ErrorObject): string | undefined {
    switch (error.keyword) {
      case 'required':
        return `Add the required property '${error.params.missingProperty}'`;
      case 'type':
        return `Change the value to type '${error.params.type}'`;
      case 'enum':
        return `Use one of the allowed values: ${error.params.allowedValues.join(', ')}`;
      case 'format':
        return `Format the value according to '${error.params.format}' format`;
      default:
        return undefined;
    }
  }
}

/**
 * Create a schema validator instance
 */
export function createSchemaValidator(): SchemaValidator {
  return new SchemaValidator();
}
