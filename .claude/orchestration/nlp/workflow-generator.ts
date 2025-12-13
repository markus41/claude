/**
 * Workflow Generation System
 * Converts recognized intents and entities into executable workflows
 */

import type {
  Intent,
  Entity,
  WorkflowMapping,
  WorkflowMappingRecord,
  GeneratedWorkflow,
  WorkflowParameter,
  GeneratedAction,
  ConversationContext,
} from './types.js';
import Database from 'better-sqlite3';

export class WorkflowGenerator {
  private db: Database.Database;
  private mappings: Map<string, WorkflowMapping> = new Map();

  constructor(dbPath: string) {
    this.db = new Database(dbPath);
    this.loadMappings();
  }

  /**
   * Generate workflow from intent and entities
   */
  generateWorkflow(
    intent: Intent,
    entities: Entity[],
    context?: ConversationContext
  ): GeneratedWorkflow | null {
    const mapping = this.mappings.get(intent.name);
    if (!mapping) {
      return null;
    }

    // Extract parameters from entities
    const parameters = this.extractParameters(mapping, entities, context);

    // Check for missing required parameters
    const missingParameters = this.findMissingParameters(mapping, parameters);

    // Calculate confidence
    const confidence = this.calculateConfidence(intent, parameters, missingParameters);

    return {
      name: mapping.workflow,
      parameters,
      confidence,
      missingParameters,
      ready: missingParameters.length === 0,
      sourceIntent: intent,
    };
  }

  /**
   * Generate actions from workflow
   */
  generateActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const actions: GeneratedAction[] = [];

    // Map workflow name to action types
    switch (workflow.name) {
      case 'deploy-workflow':
        actions.push(...this.generateDeployActions(workflow));
        break;

      case 'build-workflow':
        actions.push(...this.generateBuildActions(workflow));
        break;

      case 'test-workflow':
        actions.push(...this.generateTestActions(workflow));
        break;

      case 'review-workflow':
        actions.push(...this.generateReviewActions(workflow));
        break;

      case 'create-resource-workflow':
        actions.push(...this.generateCreateActions(workflow));
        break;

      case 'update-resource-workflow':
        actions.push(...this.generateUpdateActions(workflow));
        break;

      case 'delete-resource-workflow':
        actions.push(...this.generateDeleteActions(workflow));
        break;

      default:
        // Generic action
        actions.push({
          type: 'execute_workflow',
          description: `Execute ${workflow.name}`,
          parameters: this.parametersToRecord(workflow.parameters),
          order: 1,
          requiresConfirmation: true,
        });
    }

    return actions;
  }

  /**
   * Generate deploy actions
   */
  private generateDeployActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);
    const actions: GeneratedAction[] = [];

    // Build step
    actions.push({
      type: 'build',
      description: 'Build application',
      parameters: {
        target: params.service || 'application',
      },
      order: 1,
      requiresConfirmation: false,
    });

    // Test step (if not skipped)
    if (!params.skipTests) {
      actions.push({
        type: 'test',
        description: 'Run tests',
        parameters: {
          suite: 'pre-deploy',
        },
        order: 2,
        requiresConfirmation: false,
      });
    }

    // Deploy step
    actions.push({
      type: 'deploy',
      description: `Deploy to ${params.environment || 'production'}`,
      parameters: {
        environment: params.environment || 'production',
        service: params.service,
        version: params.version,
      },
      order: 3,
      requiresConfirmation: true,
    });

    // Verification step
    actions.push({
      type: 'verify',
      description: 'Verify deployment',
      parameters: {
        environment: params.environment || 'production',
        healthCheck: true,
      },
      order: 4,
      requiresConfirmation: false,
    });

    return actions;
  }

  /**
   * Generate build actions
   */
  private generateBuildActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'build',
        description: 'Build project',
        parameters: {
          target: params.target || 'all',
          docker: params.docker || false,
          optimize: params.optimize !== false,
        },
        order: 1,
        requiresConfirmation: false,
      },
    ];
  }

  /**
   * Generate test actions
   */
  private generateTestActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'test',
        description: `Run ${params.testType || 'all'} tests`,
        parameters: {
          suite: params.suite,
          type: params.testType || 'all',
          coverage: params.coverage !== false,
          parallel: params.parallel !== false,
        },
        order: 1,
        requiresConfirmation: false,
      },
    ];
  }

  /**
   * Generate review actions
   */
  private generateReviewActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'review',
        description: 'Review code',
        parameters: {
          target: params.target || 'current',
          checks: ['linting', 'formatting', 'security', 'quality'],
        },
        order: 1,
        requiresConfirmation: false,
      },
    ];
  }

  /**
   * Generate create actions
   */
  private generateCreateActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'create',
        description: `Create ${params.resourceType}`,
        parameters: {
          type: params.resourceType,
          name: params.name,
          template: params.template,
        },
        order: 1,
        requiresConfirmation: true,
      },
    ];
  }

  /**
   * Generate update actions
   */
  private generateUpdateActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'update',
        description: `Update ${params.resource}`,
        parameters: {
          resource: params.resource,
          changes: params.changes,
        },
        order: 1,
        requiresConfirmation: true,
      },
    ];
  }

  /**
   * Generate delete actions
   */
  private generateDeleteActions(workflow: GeneratedWorkflow): GeneratedAction[] {
    const params = this.parametersToRecord(workflow.parameters);

    return [
      {
        type: 'delete',
        description: `Delete ${params.resource}`,
        parameters: {
          resource: params.resource,
          force: params.force || false,
        },
        order: 1,
        requiresConfirmation: true,
      },
    ];
  }

  /**
   * Extract parameters from entities using mapping
   */
  private extractParameters(
    mapping: WorkflowMapping,
    entities: Entity[],
    context?: ConversationContext
  ): WorkflowParameter[] {
    const parameters: WorkflowParameter[] = [];
    const usedEntities = new Set<number>();

    // Map entities to parameters
    for (const [entityType, paramName] of Object.entries(mapping.parameterMapping)) {
      const entity = entities.find((e, idx) => e.type === entityType && !usedEntities.has(idx));

      if (entity) {
        const entityIdx = entities.indexOf(entity);
        usedEntities.add(entityIdx);

        parameters.push({
          name: paramName,
          value: entity.normalized || entity.value,
          source: entity,
          inferred: false,
          confidence: entity.confidence,
        });
      }
    }

    // Apply defaults for missing optional parameters
    if (mapping.defaults) {
      for (const [paramName, defaultValue] of Object.entries(mapping.defaults)) {
        if (!parameters.some((p) => p.name === paramName)) {
          parameters.push({
            name: paramName,
            value: defaultValue,
            inferred: true,
            confidence: 50,
          });
        }
      }
    }

    // Infer from context
    if (context) {
      this.inferFromContext(parameters, context, mapping);
    }

    return parameters;
  }

  /**
   * Infer parameters from conversation context
   */
  private inferFromContext(
    parameters: WorkflowParameter[],
    context: ConversationContext,
    mapping: WorkflowMapping
  ): void {
    // Infer environment from context
    if (!parameters.some((p) => p.name === 'environment')) {
      const contextEnv = context.preferences?.defaultEnvironment;
      if (contextEnv) {
        parameters.push({
          name: 'environment',
          value: contextEnv,
          inferred: true,
          confidence: 70,
        });
      }
    }

    // Infer service from active workflow
    if (!parameters.some((p) => p.name === 'service')) {
      const activeService = context.activeWorkflow;
      if (activeService) {
        parameters.push({
          name: 'service',
          value: activeService,
          inferred: true,
          confidence: 60,
        });
      }
    }

    // Infer from recent entities
    for (const recentEntity of context.recentEntities.slice(-5)) {
      const paramName = mapping.parameterMapping[recentEntity.type];
      if (paramName && !parameters.some((p) => p.name === paramName)) {
        parameters.push({
          name: paramName,
          value: recentEntity.normalized || recentEntity.value,
          source: recentEntity,
          inferred: true,
          confidence: Math.max(40, recentEntity.confidence - 20),
        });
      }
    }
  }

  /**
   * Find missing required parameters
   */
  private findMissingParameters(
    mapping: WorkflowMapping,
    parameters: WorkflowParameter[]
  ): string[] {
    const providedParams = new Set(parameters.map((p) => p.name));
    return mapping.requiredEntities.filter((entity) => {
      const paramName = mapping.parameterMapping[entity];
      return paramName && !providedParams.has(paramName);
    });
  }

  /**
   * Calculate workflow confidence
   */
  private calculateConfidence(
    intent: Intent,
    parameters: WorkflowParameter[],
    missingParameters: string[]
  ): number {
    let confidence = intent.confidence;

    // Penalty for missing required parameters
    confidence -= missingParameters.length * 20;

    // Boost for high-confidence parameters
    const avgParamConfidence =
      parameters.length > 0
        ? parameters.reduce((sum, p) => sum + p.confidence, 0) / parameters.length
        : 0;
    confidence = (confidence + avgParamConfidence) / 2;

    // Penalty for inferred parameters
    const inferredCount = parameters.filter((p) => p.inferred).length;
    confidence -= inferredCount * 5;

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Convert parameters array to record
   */
  private parametersToRecord(parameters: WorkflowParameter[]): Record<string, any> {
    const record: Record<string, any> = {};
    for (const param of parameters) {
      record[param.name] = param.value;
    }
    return record;
  }

  /**
   * Load workflow mappings from database
   */
  private loadMappings(): void {
    const rows = this.db
      .prepare(`SELECT * FROM workflow_mappings WHERE enabled = 1`)
      .all() as WorkflowMappingRecord[];

    for (const row of rows) {
      this.mappings.set(row.intent_name, {
        intent: row.intent_name,
        workflow: row.workflow_name,
        requiredEntities: JSON.parse(row.required_entities),
        optionalEntities: JSON.parse(row.optional_entities),
        parameterMapping: JSON.parse(row.parameter_mapping),
        confirmationRequired: row.confirmation_required,
        defaults: row.defaults_json ? JSON.parse(row.defaults_json) : undefined,
      });
    }
  }

  /**
   * Add workflow mapping
   */
  addMapping(mapping: Omit<WorkflowMapping, 'id'>): string {
    const id = `mapping-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    this.db
      .prepare(
        `INSERT INTO workflow_mappings (
          id, intent_name, workflow_name, required_entities, optional_entities,
          parameter_mapping, confirmation_required, defaults_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        id,
        mapping.intent,
        mapping.workflow,
        JSON.stringify(mapping.requiredEntities),
        JSON.stringify(mapping.optionalEntities),
        JSON.stringify(mapping.parameterMapping),
        mapping.confirmationRequired,
        mapping.defaults ? JSON.stringify(mapping.defaults) : null
      );

    this.loadMappings();
    return id;
  }

  /**
   * Get all mappings
   */
  getMappings(): Map<string, WorkflowMapping> {
    return this.mappings;
  }

  /**
   * Close database connection
   */
  close(): void {
    this.db.close();
  }
}

/**
 * Default workflow mappings
 */
export const DEFAULT_WORKFLOW_MAPPINGS: Array<Omit<WorkflowMapping, 'id'>> = [
  {
    intent: 'deploy_application',
    workflow: 'deploy-workflow',
    requiredEntities: ['environment'],
    optionalEntities: ['service', 'version'],
    parameterMapping: {
      environment: 'environment',
      service: 'service',
      number: 'version',
    },
    confirmationRequired: true,
    defaults: {
      environment: 'staging',
    },
  },
  {
    intent: 'rollback_deployment',
    workflow: 'rollback-workflow',
    requiredEntities: ['environment'],
    optionalEntities: ['service', 'number'],
    parameterMapping: {
      environment: 'environment',
      service: 'service',
      number: 'version',
    },
    confirmationRequired: true,
  },
  {
    intent: 'build_project',
    workflow: 'build-workflow',
    requiredEntities: [],
    optionalEntities: ['service', 'directory'],
    parameterMapping: {
      service: 'target',
      directory: 'workdir',
    },
    confirmationRequired: false,
  },
  {
    intent: 'run_tests',
    workflow: 'test-workflow',
    requiredEntities: [],
    optionalEntities: ['service', 'identifier'],
    parameterMapping: {
      service: 'suite',
      identifier: 'testType',
    },
    confirmationRequired: false,
  },
  {
    intent: 'review_code',
    workflow: 'review-workflow',
    requiredEntities: [],
    optionalEntities: ['file', 'directory'],
    parameterMapping: {
      file: 'target',
      directory: 'target',
    },
    confirmationRequired: false,
  },
  {
    intent: 'create_resource',
    workflow: 'create-resource-workflow',
    requiredEntities: ['resource'],
    optionalEntities: ['identifier'],
    parameterMapping: {
      resource: 'resourceType',
      identifier: 'name',
    },
    confirmationRequired: true,
  },
  {
    intent: 'check_status',
    workflow: 'status-workflow',
    requiredEntities: [],
    optionalEntities: ['service', 'environment'],
    parameterMapping: {
      service: 'service',
      environment: 'environment',
    },
    confirmationRequired: false,
  },
];
