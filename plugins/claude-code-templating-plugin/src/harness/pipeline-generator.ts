/**
 * Pipeline Generator
 *
 * Generates complete Harness pipeline YAML with proper formatting,
 * variable substitution, and validation.
 */

import * as yaml from 'yaml';
import type { HarnessPipelineConfig } from '../types/harness.js';

export class PipelineGenerator {
  /**
   * Generate pipeline YAML from configuration
   */
  async generate(config: HarnessPipelineConfig): Promise<string> {
    const pipelineYaml = this.buildPipelineStructure(config);
    return yaml.stringify(pipelineYaml, {
      indent: 2,
      lineWidth: 120,
      aliasDuplicateObjects: false,
    });
  }

  /**
   * Build pipeline structure object
   */
  private buildPipelineStructure(config: HarnessPipelineConfig): unknown {
    const identifier = config.identifier || this.generateIdentifier(config.name);

    const pipeline: Record<string, unknown> = {
      pipeline: {
        name: config.name,
        identifier,
        ...(config.description && { description: config.description }),
        ...(config.tags && { tags: config.tags }),
        projectIdentifier: config.projectIdentifier,
        orgIdentifier: config.orgIdentifier,
        ...(config.properties && { properties: config.properties }),
        stages: config.stages.map((stage) => this.buildStage(stage)),
        ...(config.variables && config.variables.length > 0 && {
          variables: config.variables.map((v) => ({
            name: v.name,
            type: v.type,
            ...(v.description && { description: v.description }),
            ...(v.value !== undefined && { value: v.value }),
            ...(v.default !== undefined && { default: v.default }),
            ...(v.required !== undefined && { required: v.required }),
          })),
        }),
        ...(config.notificationRules && config.notificationRules.length > 0 && {
          notificationRules: config.notificationRules.map((rule) => ({
            name: rule.name,
            enabled: rule.enabled ?? true,
            pipelineEvents: rule.pipelineEvents,
            notificationMethod: {
              type: rule.notificationMethod.type,
              spec: rule.notificationMethod.spec,
            },
          })),
        }),
      },
    };

    return pipeline;
  }

  /**
   * Build stage structure
   */
  private buildStage(stage: any): Record<string, unknown> {
    const stageObj: Record<string, unknown> = {
      stage: {
        name: stage.name,
        identifier: stage.identifier || this.generateIdentifier(stage.name),
        ...(stage.description && { description: stage.description }),
        type: stage.type,
        spec: this.buildStageSpec(stage.spec, stage.type),
        ...(stage.failureStrategies && {
          failureStrategies: stage.failureStrategies.map((fs: any) => ({
            onFailure: {
              errors: fs.onFailure.errors,
              action: this.buildFailureAction(fs.onFailure.action),
            },
          })),
        }),
        ...(stage.when && {
          when: {
            pipelineStatus: stage.when.pipelineStatus,
            ...(stage.when.condition && { condition: stage.when.condition }),
          },
        }),
        ...(stage.variables && {
          variables: stage.variables,
        }),
        ...(stage.tags && { tags: stage.tags }),
      },
    };

    return stageObj;
  }

  /**
   * Build stage spec based on stage type
   */
  private buildStageSpec(spec: any, stageType: string): Record<string, unknown> {
    const specObj: Record<string, unknown> = {};

    // CI stage specific
    if (stageType === 'CI' && spec.cloneCodebase !== undefined) {
      specObj.cloneCodebase = spec.cloneCodebase;
    }

    // Infrastructure (CI, Custom)
    if (spec.infrastructure) {
      specObj.infrastructure = {
        type: spec.infrastructure.type,
        spec: spec.infrastructure.spec,
      };
    }

    // Service config (Deployment)
    if (spec.serviceConfig) {
      specObj.serviceConfig = {
        serviceRef: spec.serviceConfig.serviceRef,
        ...(spec.serviceConfig.serviceInputs && {
          serviceInputs: spec.serviceConfig.serviceInputs,
        }),
      };
    }

    // Environment (Deployment)
    if (spec.environment) {
      specObj.environment = {
        environmentRef: spec.environment.environmentRef,
        ...(spec.environment.deployToAll !== undefined && {
          deployToAll: spec.environment.deployToAll,
        }),
        ...(spec.environment.infrastructureDefinitions && {
          infrastructureDefinitions: spec.environment.infrastructureDefinitions,
        }),
      };
    }

    // Deployment type
    if (spec.deploymentType) {
      specObj.deploymentType = spec.deploymentType;
    }

    // Execution
    if (spec.execution) {
      specObj.execution = {
        steps: spec.execution.steps.map((step: any) => this.buildStep(step)),
        ...(spec.execution.rollbackSteps && {
          rollbackSteps: spec.execution.rollbackSteps.map((step: any) =>
            this.buildStep(step)
          ),
        }),
      };
    }

    return specObj;
  }

  /**
   * Build step structure
   */
  private buildStep(step: any): Record<string, unknown> {
    const stepObj: Record<string, unknown> = {
      step: {
        type: step.type,
        name: step.name,
        identifier: step.identifier || this.generateIdentifier(step.name),
        spec: { ...step.spec },
        ...(step.timeout && { timeout: step.timeout }),
        ...(step.failureStrategies && {
          failureStrategies: step.failureStrategies.map((fs: any) => ({
            onFailure: {
              errors: fs.onFailure.errors,
              action: this.buildFailureAction(fs.onFailure.action),
            },
          })),
        }),
        ...(step.when && {
          when: {
            stageStatus: step.when.stageStatus,
            ...(step.when.condition && { condition: step.when.condition }),
          },
        }),
      },
    };

    return stepObj;
  }

  /**
   * Build failure action structure
   */
  private buildFailureAction(action: any): Record<string, unknown> {
    const actionObj: Record<string, unknown> = {
      type: action.type,
    };

    if (action.spec) {
      actionObj.spec = {
        retryCount: action.spec.retryCount,
        retryIntervals: action.spec.retryIntervals,
        ...(action.spec.onRetryFailure && {
          onRetryFailure: this.buildFailureAction(action.spec.onRetryFailure),
        }),
      };
    }

    return actionObj;
  }

  /**
   * Generate identifier from name
   */
  private generateIdentifier(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }
}
