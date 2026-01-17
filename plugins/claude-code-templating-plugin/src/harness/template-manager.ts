/**
 * Template Manager
 *
 * Manages Harness templates including creation, versioning,
 * and scope management across project, org, and account levels.
 */

import * as yaml from 'yaml';
import type {
  HarnessTemplateConfig,
  HarnessTemplateScope,
} from '../types/harness.js';
import type { HarnessTemplateInfo } from '../types/agents.js';

export class TemplateManager {
  /**
   * Generate template YAML from configuration
   */
  async generate(config: HarnessTemplateConfig): Promise<string> {
    const templateYaml = this.buildTemplateStructure(config);
    return yaml.stringify(templateYaml, {
      indent: 2,
      lineWidth: 120,
      aliasDuplicateObjects: false,
    });
  }

  /**
   * List available templates at a specific scope
   */
  async list(scope: HarnessTemplateScope): Promise<HarnessTemplateInfo[]> {
    // Stub implementation - would query Harness API or local registry
    const builtInTemplates: HarnessTemplateInfo[] = [
      {
        identifier: 'shell_script_template',
        name: 'Shell Script Template',
        type: 'Step',
        scope: 'account',
        versionLabel: '1.0.0',
        description: 'Execute shell scripts with output variables',
      },
      {
        identifier: 'http_request_template',
        name: 'HTTP Request Template',
        type: 'Step',
        scope: 'account',
        versionLabel: '1.0.0',
        description: 'Make HTTP requests with assertion support',
      },
      {
        identifier: 'k8s_deploy_template',
        name: 'Kubernetes Deploy Template',
        type: 'Step',
        scope: 'account',
        versionLabel: '1.0.0',
        description: 'Deploy to Kubernetes with rolling strategy',
      },
      {
        identifier: 'ci_build_stage',
        name: 'CI Build Stage',
        type: 'Stage',
        scope: 'org',
        versionLabel: '1.0.0',
        description: 'Complete CI build stage with tests',
      },
      {
        identifier: 'cd_deploy_stage',
        name: 'CD Deploy Stage',
        type: 'Stage',
        scope: 'org',
        versionLabel: '1.0.0',
        description: 'Complete CD deployment stage',
      },
    ];

    return builtInTemplates.filter((t) => this.matchesScope(t.scope, scope));
  }

  /**
   * Build template structure object
   */
  private buildTemplateStructure(config: HarnessTemplateConfig): unknown {
    const identifier = config.identifier || this.generateIdentifier(config.name);

    const template: Record<string, unknown> = {
      template: {
        name: config.name,
        identifier,
        versionLabel: config.versionLabel,
        type: config.type,
        ...(config.description && { description: config.description }),
        ...(config.tags && { tags: config.tags }),
        ...(config.projectIdentifier && {
          projectIdentifier: config.projectIdentifier,
        }),
        ...(config.orgIdentifier && { orgIdentifier: config.orgIdentifier }),
        spec: this.buildTemplateSpec(config),
      },
    };

    return template;
  }

  /**
   * Build template spec based on template type
   */
  private buildTemplateSpec(config: HarnessTemplateConfig): Record<string, unknown> {
    switch (config.type) {
      case 'Step':
        return this.buildStepTemplateSpec(config.spec as any);
      case 'Stage':
        return this.buildStageTemplateSpec(config.spec as any);
      case 'Pipeline':
        return this.buildPipelineTemplateSpec(config.spec as any);
      case 'StepGroup':
        return this.buildStepGroupTemplateSpec(config.spec as any);
      default:
        throw new Error(`Unsupported template type: ${config.type}`);
    }
  }

  /**
   * Build step template spec
   */
  private buildStepTemplateSpec(step: any): Record<string, unknown> {
    return {
      type: step.type,
      ...(step.timeout && { timeout: step.timeout }),
      spec: { ...step.spec },
    };
  }

  /**
   * Build stage template spec
   */
  private buildStageTemplateSpec(stage: any): Record<string, unknown> {
    return {
      type: stage.type,
      spec: {
        ...(stage.spec.cloneCodebase !== undefined && {
          cloneCodebase: stage.spec.cloneCodebase,
        }),
        ...(stage.spec.infrastructure && {
          infrastructure: stage.spec.infrastructure,
        }),
        ...(stage.spec.serviceConfig && {
          serviceConfig: stage.spec.serviceConfig,
        }),
        ...(stage.spec.environment && {
          environment: stage.spec.environment,
        }),
        ...(stage.spec.execution && {
          execution: stage.spec.execution,
        }),
      },
    };
  }

  /**
   * Build pipeline template spec
   */
  private buildPipelineTemplateSpec(pipeline: any): Record<string, unknown> {
    return {
      stages: pipeline.stages,
      ...(pipeline.variables && { variables: pipeline.variables }),
      ...(pipeline.properties && { properties: pipeline.properties }),
    };
  }

  /**
   * Build step group template spec
   */
  private buildStepGroupTemplateSpec(stepGroup: any): Record<string, unknown> {
    return {
      steps: stepGroup.steps || [],
      ...(stepGroup.rollbackSteps && { rollbackSteps: stepGroup.rollbackSteps }),
    };
  }

  /**
   * Check if template scope matches requested scope
   */
  private matchesScope(
    templateScope: string,
    requestedScope: HarnessTemplateScope
  ): boolean {
    const scopeHierarchy = ['project', 'org', 'account'];
    const templateLevel = scopeHierarchy.indexOf(templateScope);
    const requestedLevel = scopeHierarchy.indexOf(requestedScope);

    // Templates at higher levels are available at lower levels
    return templateLevel >= requestedLevel;
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
