/**
 * Pipeline Schema Definitions
 *
 * Provides JSON Schema validation for Harness pipeline YAML to ensure
 * generated configurations meet platform requirements.
 */

import type { HarnessPipelineConfig, HarnessStageConfig } from '../../types/harness.js';

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
 * Pipeline identifier pattern
 */
const IDENTIFIER_PATTERN = '^[a-zA-Z_][a-zA-Z0-9_]*$';

/**
 * Harness expression pattern (e.g., <+input>, <+pipeline.name>)
 * @internal Used for regex validation in schemas
 */
const _EXPRESSION_PATTERN = '^(<\\+[a-zA-Z_.]+>|[^<]+)$';
void _EXPRESSION_PATTERN; // Suppress unused warning - reserved for future use

/**
 * Stage type enum
 */
const STAGE_TYPES = [
  'CI',
  'Deployment',
  'Approval',
  'Custom',
  'Pipeline',
  'FeatureFlag',
  'SecurityTests',
  'IACMTerraform',
  'IACMTerragrunt',
] as const;

/**
 * Step type enum
 */
const STEP_TYPES = [
  'Run',
  'RunTests',
  'Background',
  'BuildAndPushDockerRegistry',
  'BuildAndPushECR',
  'BuildAndPushGCR',
  'BuildAndPushACR',
  'Plugin',
  'RestoreCacheGCS',
  'SaveCacheGCS',
  'RestoreCacheS3',
  'SaveCacheS3',
  'GitClone',
  'ShellScript',
  'Http',
  'K8sRollingDeploy',
  'K8sRollingRollback',
  'K8sBlueGreenDeploy',
  'K8sCanaryDeploy',
  'K8sDelete',
  'K8sApply',
  'K8sBGSwapServices',
  'K8sCanaryDelete',
  'K8sScale',
  'TerraformPlan',
  'TerraformApply',
  'TerraformDestroy',
  'TerraformRollback',
  'HelmDeploy',
  'HelmRollback',
  'HarnessApproval',
  'JiraApproval',
  'ServiceNowApproval',
  'CustomApproval',
  'Wait',
  'Queue',
  'Barrier',
  'Template',
] as const;

/**
 * Step schema
 */
const stepSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 128 },
    identifier: { type: 'string', pattern: IDENTIFIER_PATTERN },
    type: { type: 'string', enum: STEP_TYPES },
    timeout: { type: 'string', pattern: '^[0-9]+[smhd]$' },
    spec: {
      type: 'object',
      additionalProperties: true,
    },
    failureStrategies: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          onFailure: {
            type: 'object',
            required: ['errors', 'action'],
            properties: {
              errors: { type: 'array', items: { type: 'string' } },
              action: {
                type: 'object',
                required: ['type'],
                properties: {
                  type: { type: 'string' },
                  spec: { type: 'object' },
                },
              },
            },
          },
        },
      },
    },
    when: {
      type: 'object',
      properties: {
        stageStatus: { type: 'string', enum: ['Success', 'Failure', 'All'] },
        condition: { type: 'string' },
      },
    },
  },
};

/**
 * Stage schema
 */
const stageSchema = {
  type: 'object',
  required: ['name', 'type'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 128 },
    identifier: { type: 'string', pattern: IDENTIFIER_PATTERN },
    description: { type: 'string', maxLength: 1000 },
    type: { type: 'string', enum: STAGE_TYPES },
    spec: {
      type: 'object',
      properties: {
        cloneCodebase: { type: 'boolean' },
        infrastructure: { type: 'object' },
        serviceConfig: { type: 'object' },
        environment: { type: 'object' },
        execution: {
          type: 'object',
          properties: {
            steps: {
              type: 'array',
              items: stepSchema,
            },
            rollbackSteps: {
              type: 'array',
              items: stepSchema,
            },
          },
        },
      },
    },
    failureStrategies: { type: 'array' },
    when: {
      type: 'object',
      properties: {
        pipelineStatus: { type: 'string', enum: ['Success', 'Failure', 'All'] },
        condition: { type: 'string' },
      },
    },
    variables: { type: 'array' },
    tags: { type: 'object' },
  },
};

/**
 * Pipeline schema
 */
const pipelineSchema = {
  type: 'object',
  required: ['name', 'orgIdentifier', 'projectIdentifier', 'stages'],
  properties: {
    name: { type: 'string', minLength: 1, maxLength: 128 },
    identifier: { type: 'string', pattern: IDENTIFIER_PATTERN },
    orgIdentifier: { type: 'string', pattern: IDENTIFIER_PATTERN },
    projectIdentifier: { type: 'string', pattern: IDENTIFIER_PATTERN },
    description: { type: 'string', maxLength: 1000 },
    tags: {
      type: 'object',
      additionalProperties: { type: 'string' },
    },
    repository: {
      type: 'object',
      properties: {
        connectorRef: { type: 'string' },
        repoName: { type: 'string' },
        branch: { type: 'string' },
        filePath: { type: 'string' },
      },
    },
    stages: {
      type: 'array',
      minItems: 1,
      items: stageSchema,
    },
    variables: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string', enum: ['String', 'Number', 'Secret'] },
          value: { type: 'string' },
          default: { type: 'string' },
          description: { type: 'string' },
          required: { type: 'boolean' },
        },
      },
    },
    notificationRules: {
      type: 'array',
      items: {
        type: 'object',
        required: ['name', 'pipelineEvents', 'notificationMethod'],
        properties: {
          name: { type: 'string' },
          pipelineEvents: { type: 'array', items: { type: 'string' } },
          notificationMethod: { type: 'object' },
          enabled: { type: 'boolean' },
        },
      },
    },
    properties: {
      type: 'object',
      properties: {
        ci: {
          type: 'object',
          properties: {
            codebase: {
              type: 'object',
              properties: {
                connectorRef: { type: 'string' },
                repoName: { type: 'string' },
                build: { type: 'object' },
              },
            },
          },
        },
      },
    },
  },
};

/**
 * Pipeline Schema Validator
 */
export class PipelineSchemaValidator {
  private readonly ajv: AjvInstance;
  private readonly validatePipeline: ValidateFunction;
  private readonly validateStage: ValidateFunction;
  private readonly validateStep: ValidateFunction;

  constructor() {
    this.ajv = createAjv();
    this.validatePipeline = this.ajv.compile(pipelineSchema);
    this.validateStage = this.ajv.compile(stageSchema);
    this.validateStep = this.ajv.compile(stepSchema);
  }

  /**
   * Validate a pipeline configuration
   */
  validatePipelineConfig(config: HarnessPipelineConfig): ValidationResult {
    const valid = this.validatePipeline(config);
    return {
      valid: valid as boolean,
      errors: this.formatErrors(this.validatePipeline.errors),
    };
  }

  /**
   * Validate a stage configuration
   */
  validateStageConfig(config: HarnessStageConfig): ValidationResult {
    const valid = this.validateStage(config);
    return {
      valid: valid as boolean,
      errors: this.formatErrors(this.validateStage.errors),
    };
  }

  /**
   * Validate a step configuration
   */
  validateStepConfig(config: unknown): ValidationResult {
    const valid = this.validateStep(config);
    return {
      valid: valid as boolean,
      errors: this.formatErrors(this.validateStep.errors),
    };
  }

  /**
   * Validate raw YAML content
   */
  validateYaml(yaml: string): ValidationResult {
    try {
      // Use js-yaml to parse
      const { parse } = require('yaml');
      const content = parse(yaml);

      if (content?.pipeline) {
        return this.validatePipelineConfig(content.pipeline);
      }

      if (content?.stage) {
        return this.validateStageConfig(content.stage);
      }

      if (content?.step) {
        return this.validateStepConfig(content.step);
      }

      return {
        valid: false,
        errors: [{ message: 'Unknown YAML structure. Expected pipeline, stage, or step.' }],
      };
    } catch (error) {
      return {
        valid: false,
        errors: [{
          message: `YAML parse error: ${error instanceof Error ? error.message : String(error)}`,
        }],
      };
    }
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
 * Create validator instance
 */
export function createPipelineSchemaValidator(): PipelineSchemaValidator {
  return new PipelineSchemaValidator();
}

export default PipelineSchemaValidator;
