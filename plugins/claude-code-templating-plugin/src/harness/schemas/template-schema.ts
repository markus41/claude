/**
 * Template Schema Definitions
 *
 * Provides JSON Schema validation for Harness template YAML to ensure
 * generated templates meet platform requirements.
 */

import type { HarnessTemplateConfig, HarnessTemplateType, HarnessTemplateScope } from '../../types/harness.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AjvInstance = any;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ValidateFunction = any;

/**
 * Create configured AJV instance
 */
function createAjv(): AjvInstance {
  // Use require for better ESM/CJS compatibility with AJV
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const AjvModule = require('ajv');
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const addFormatsModule = require('ajv-formats');

  const AjvClass = AjvModule.default ?? AjvModule;
  const ajv = new AjvClass({
    allErrors: true,
    verbose: true,
    strict: false,
  });

  const addFormatsFunc = addFormatsModule.default ?? addFormatsModule;
  addFormatsFunc(ajv);
  return ajv;
}

/**
 * Identifier pattern
 */
const IDENTIFIER_PATTERN = '^[a-zA-Z_][a-zA-Z0-9_]*$';

/**
 * Version label pattern (semantic versioning)
 */
const VERSION_PATTERN = '^v?\\d+(\\.\\d+)*(-[a-zA-Z0-9]+)?$';

/**
 * Template types
 */
const TEMPLATE_TYPES: HarnessTemplateType[] = [
  'Step',
  'Stage',
  'Pipeline',
  'StepGroup',
  'SecretManager',
];

/**
 * Template scopes
 */
const TEMPLATE_SCOPES: HarnessTemplateScope[] = [
  'project',
  'org',
  'account',
];

/**
 * Base template schema
 */
const baseTemplateSchema = {
  type: 'object',
  required: ['name', 'type', 'scope', 'versionLabel', 'spec'],
  properties: {
    name: {
      type: 'string',
      minLength: 1,
      maxLength: 128,
      description: 'Template display name',
    },
    identifier: {
      type: 'string',
      pattern: IDENTIFIER_PATTERN,
      description: 'Unique identifier for the template',
    },
    type: {
      type: 'string',
      enum: TEMPLATE_TYPES,
      description: 'Type of template (Step, Stage, Pipeline, etc.)',
    },
    scope: {
      type: 'string',
      enum: TEMPLATE_SCOPES,
      description: 'Template scope (project, org, account)',
    },
    orgIdentifier: {
      type: 'string',
      pattern: IDENTIFIER_PATTERN,
      description: 'Organization identifier (required for org/account scope)',
    },
    projectIdentifier: {
      type: 'string',
      pattern: IDENTIFIER_PATTERN,
      description: 'Project identifier (required for project scope)',
    },
    versionLabel: {
      type: 'string',
      pattern: VERSION_PATTERN,
      description: 'Version label (e.g., v1, 1.0.0)',
    },
    description: {
      type: 'string',
      maxLength: 1000,
      description: 'Template description',
    },
    tags: {
      type: 'object',
      additionalProperties: { type: 'string' },
      description: 'Key-value tags for organization',
    },
    spec: {
      type: 'object',
      description: 'Template specification (step, stage, or pipeline config)',
    },
  },
};

/**
 * Step template schema
 */
const stepTemplateSchema = {
  ...baseTemplateSchema,
  properties: {
    ...baseTemplateSchema.properties,
    type: { const: 'Step' },
    spec: {
      type: 'object',
      required: ['type'],
      properties: {
        type: { type: 'string' },
        timeout: { type: 'string' },
        spec: { type: 'object' },
      },
    },
  },
};

/**
 * Stage template schema
 */
const stageTemplateSchema = {
  ...baseTemplateSchema,
  properties: {
    ...baseTemplateSchema.properties,
    type: { const: 'Stage' },
    spec: {
      type: 'object',
      required: ['type'],
      properties: {
        type: { type: 'string' },
        spec: {
          type: 'object',
          properties: {
            cloneCodebase: { type: 'boolean' },
            infrastructure: { type: 'object' },
            serviceConfig: { type: 'object' },
            environment: { type: 'object' },
            execution: { type: 'object' },
          },
        },
        failureStrategies: { type: 'array' },
        when: { type: 'object' },
        variables: { type: 'array' },
      },
    },
  },
};

/**
 * Pipeline template schema
 */
const pipelineTemplateSchema = {
  ...baseTemplateSchema,
  properties: {
    ...baseTemplateSchema.properties,
    type: { const: 'Pipeline' },
    spec: {
      type: 'object',
      properties: {
        stages: { type: 'array' },
        variables: { type: 'array' },
        properties: { type: 'object' },
        notificationRules: { type: 'array' },
      },
    },
  },
};

/**
 * Template input definition schema
 * @internal Reserved for future use in input validation
 */
const _templateInputSchema = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    type: { type: 'string', enum: ['String', 'Number', 'Secret', 'Boolean'] },
    default: { type: ['string', 'number', 'boolean'] },
    required: { type: 'boolean' },
    description: { type: 'string' },
    allowedValues: { type: 'array' },
    regex: { type: 'string' },
    executionInput: { type: 'boolean' },
  },
};
void _templateInputSchema; // Suppress unused warning - reserved for future input validation

/**
 * Template Schema Validator
 */
export class TemplateSchemaValidator {
  private readonly ajv: AjvInstance;
  private readonly validateBase: ValidateFunction;
  private readonly validateStep: ValidateFunction;
  private readonly validateStage: ValidateFunction;
  private readonly validatePipeline: ValidateFunction;

  constructor() {
    this.ajv = createAjv();
    this.validateBase = this.ajv.compile(baseTemplateSchema);
    this.validateStep = this.ajv.compile(stepTemplateSchema);
    this.validateStage = this.ajv.compile(stageTemplateSchema);
    this.validatePipeline = this.ajv.compile(pipelineTemplateSchema);
  }

  /**
   * Validate a template configuration
   */
  validateTemplateConfig(config: HarnessTemplateConfig): ValidationResult {
    // First validate base structure
    const baseValid = this.validateBase(config);
    if (!baseValid) {
      return {
        valid: false,
        errors: this.formatErrors(this.validateBase.errors),
        warnings: [],
      };
    }

    // Validate scope requirements
    const scopeErrors = this.validateScopeRequirements(config);
    if (scopeErrors.length > 0) {
      return {
        valid: false,
        errors: scopeErrors,
        warnings: [],
      };
    }

    // Validate type-specific schema
    let typeValid: boolean;
    let typeValidator: ValidateFunction;

    switch (config.type) {
      case 'Step':
        typeValidator = this.validateStep;
        break;
      case 'Stage':
        typeValidator = this.validateStage;
        break;
      case 'Pipeline':
        typeValidator = this.validatePipeline;
        break;
      default:
        // StepGroup and SecretManager use base schema
        typeValidator = this.validateBase;
    }

    typeValid = typeValidator(config) as boolean;

    // Collect warnings
    const warnings = this.checkBestPractices(config);

    return {
      valid: typeValid,
      errors: this.formatErrors(typeValidator.errors),
      warnings,
    };
  }

  /**
   * Validate template reference string
   */
  validateTemplateRef(ref: string): ValidationResult {
    // Template ref format: <scope>.<identifier>
    // Examples: account.my_template, org.my_template, my_template
    const refPattern = /^(account\.|org\.)?[a-zA-Z_][a-zA-Z0-9_]*$/;

    if (!refPattern.test(ref)) {
      return {
        valid: false,
        errors: [{
          message: `Invalid template reference format: ${ref}. Expected: [scope.]identifier`,
        }],
        warnings: [],
      };
    }

    return { valid: true, errors: [], warnings: [] };
  }

  /**
   * Validate template inputs
   */
  validateTemplateInputs(
    template: HarnessTemplateConfig,
    inputs: Record<string, unknown>
  ): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    // Extract input definitions from template spec
    const inputDefs = this.extractInputDefinitions(template.spec);

    // Check required inputs
    for (const [name, def] of Object.entries(inputDefs)) {
      if (def.required && !(name in inputs)) {
        errors.push({
          message: `Missing required input: ${name}`,
          path: `inputs.${name}`,
        });
      }

      // Validate type if input provided
      if (name in inputs) {
        const value = inputs[name];
        const typeError = this.validateInputType(name, value, def);
        if (typeError) {
          errors.push(typeError);
        }
      }
    }

    // Check for unknown inputs
    for (const name of Object.keys(inputs)) {
      if (!(name in inputDefs)) {
        warnings.push({
          message: `Unknown input: ${name}. This input is not defined in the template.`,
          suggestion: 'Check the template definition for available inputs.',
        });
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate YAML content as template
   */
  validateYaml(yaml: string): ValidationResult {
    try {
      const { parse } = require('yaml');
      const content = parse(yaml);

      if (content?.template) {
        return this.validateTemplateConfig(content.template);
      }

      return {
        valid: false,
        errors: [{ message: 'YAML does not contain a template definition.' }],
        warnings: [],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: `YAML parse error: ${error instanceof Error ? error.message : String(error)}`,
        }],
        warnings: [],
      };
    }
  }

  /**
   * Validate scope requirements
   */
  private validateScopeRequirements(config: HarnessTemplateConfig): ValidationError[] {
    const errors: ValidationError[] = [];

    switch (config.scope) {
      case 'project':
        if (!config.projectIdentifier) {
          errors.push({
            message: 'projectIdentifier is required for project-scoped templates',
            path: 'projectIdentifier',
          });
        }
        if (!config.orgIdentifier) {
          errors.push({
            message: 'orgIdentifier is required for project-scoped templates',
            path: 'orgIdentifier',
          });
        }
        break;
      case 'org':
        if (!config.orgIdentifier) {
          errors.push({
            message: 'orgIdentifier is required for org-scoped templates',
            path: 'orgIdentifier',
          });
        }
        break;
      case 'account':
        // Account scope doesn't require org or project
        break;
    }

    return errors;
  }

  /**
   * Check best practices
   */
  private checkBestPractices(config: HarnessTemplateConfig): ValidationWarning[] {
    const warnings: ValidationWarning[] = [];

    // Check for description
    if (!config.description) {
      warnings.push({
        message: 'Template has no description. Consider adding one for better discoverability.',
        suggestion: 'Add a description field explaining what this template does.',
      });
    }

    // Check for tags
    if (!config.tags || Object.keys(config.tags).length === 0) {
      warnings.push({
        message: 'Template has no tags. Tags help with organization and search.',
        suggestion: 'Add tags like "category: ci" or "team: platform".',
      });
    }

    // Check version label format
    if (config.versionLabel && !config.versionLabel.match(/^v?\d+\.\d+\.\d+$/)) {
      warnings.push({
        message: 'Version label does not follow semantic versioning.',
        suggestion: 'Use semantic versioning (e.g., v1.0.0) for better version management.',
      });
    }

    return warnings;
  }

  /**
   * Extract input definitions from spec
   */
  private extractInputDefinitions(
    spec: unknown
  ): Record<string, InputDefinition> {
    const inputs: Record<string, InputDefinition> = {};

    // Recursively find <+input> placeholders
    const findInputs = (obj: unknown, path = ''): void => {
      if (typeof obj === 'string') {
        if (obj.includes('<+input>')) {
          const name = path.split('.').pop() || 'unknown';
          inputs[name] = { type: 'String', required: true };
        }
      } else if (Array.isArray(obj)) {
        obj.forEach((item, index) => findInputs(item, `${path}[${index}]`));
      } else if (obj && typeof obj === 'object') {
        Object.entries(obj as Record<string, unknown>).forEach(([key, value]) => {
          findInputs(value, path ? `${path}.${key}` : key);
        });
      }
    };

    findInputs(spec);
    return inputs;
  }

  /**
   * Validate input type
   */
  private validateInputType(
    name: string,
    value: unknown,
    def: InputDefinition
  ): ValidationError | null {
    switch (def.type) {
      case 'String':
        if (typeof value !== 'string') {
          return { message: `Input ${name} must be a string`, path: `inputs.${name}` };
        }
        break;
      case 'Number':
        if (typeof value !== 'number') {
          return { message: `Input ${name} must be a number`, path: `inputs.${name}` };
        }
        break;
      case 'Boolean':
        if (typeof value !== 'boolean') {
          return { message: `Input ${name} must be a boolean`, path: `inputs.${name}` };
        }
        break;
    }
    return null;
  }

  /**
   * Format AJV errors
   */
  private formatErrors(errors: ValidateFunction['errors']): ValidationError[] {
    if (!errors) return [];

    return errors.map((error: { message?: string; instancePath?: string; keyword?: string; params?: Record<string, unknown> }) => ({
      message: error.message || 'Unknown validation error',
      path: error.instancePath,
      keyword: error.keyword,
      params: error.params,
    }));
  }
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

/**
 * Validation error
 */
export interface ValidationError {
  message: string;
  path?: string;
  keyword?: string;
  params?: Record<string, unknown>;
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  message: string;
  suggestion?: string;
}

/**
 * Input definition
 */
interface InputDefinition {
  type: 'String' | 'Number' | 'Boolean' | 'Secret';
  required?: boolean;
  default?: unknown;
  allowedValues?: unknown[];
}

/**
 * Create validator instance
 */
export function createTemplateSchemaValidator(): TemplateSchemaValidator {
  return new TemplateSchemaValidator();
}

export default TemplateSchemaValidator;
