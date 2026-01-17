/**
 * Environment Generator
 *
 * Generates Harness environment configurations with support for
 * Production/PreProduction types, infrastructure definitions,
 * variable overrides, and manifest overrides.
 */

import * as yaml from 'yaml';
import type {
  HarnessEnvironmentConfig,
  EnvironmentType,
} from '../types/harness.js';

export class EnvironmentGenerator {
  /**
   * Generate environment YAML from configuration
   */
  async generate(config: HarnessEnvironmentConfig): Promise<string> {
    const environmentYaml = this.buildEnvironmentStructure(config);
    return yaml.stringify(environmentYaml, {
      indent: 2,
      lineWidth: 120,
      aliasDuplicateObjects: false,
    });
  }

  /**
   * Generate development environment
   */
  async generateDevelopmentEnvironment(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string
  ): Promise<HarnessEnvironmentConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      type: 'PreProduction',
      description: 'Development environment',
      tags: {
        environment: 'dev',
        managed_by: 'harness',
      },
      variables: [
        {
          name: 'replicas',
          type: 'Number',
          value: '1',
        },
        {
          name: 'log_level',
          type: 'String',
          value: 'debug',
        },
      ],
    };
  }

  /**
   * Generate staging environment
   */
  async generateStagingEnvironment(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string
  ): Promise<HarnessEnvironmentConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      type: 'PreProduction',
      description: 'Staging environment',
      tags: {
        environment: 'staging',
        managed_by: 'harness',
      },
      variables: [
        {
          name: 'replicas',
          type: 'Number',
          value: '2',
        },
        {
          name: 'log_level',
          type: 'String',
          value: 'info',
        },
      ],
    };
  }

  /**
   * Generate production environment
   */
  async generateProductionEnvironment(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string
  ): Promise<HarnessEnvironmentConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      type: 'Production',
      description: 'Production environment',
      tags: {
        environment: 'prod',
        managed_by: 'harness',
      },
      variables: [
        {
          name: 'replicas',
          type: 'Number',
          value: '3',
        },
        {
          name: 'log_level',
          type: 'String',
          value: 'warn',
        },
        {
          name: 'enable_monitoring',
          type: 'String',
          value: 'true',
        },
      ],
    };
  }

  /**
   * Generate environment with overrides
   */
  async generateEnvironmentWithOverrides(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string,
    type: EnvironmentType,
    manifestOverrides?: Record<string, unknown>,
    variableOverrides?: Record<string, string>
  ): Promise<HarnessEnvironmentConfig> {
    const config: HarnessEnvironmentConfig = {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      type,
      description: `${type} environment with overrides`,
    };

    if (manifestOverrides || variableOverrides) {
      config.overrides = {};

      if (manifestOverrides) {
        config.overrides.manifests = [
          {
            identifier: 'override_values',
            type: 'Values',
            spec: {
              store: {
                type: 'Harness',
                spec: {},
              },
            },
          },
        ];
      }

      if (variableOverrides) {
        config.overrides.variables = Object.entries(variableOverrides).map(
          ([name, value]) => ({
            name,
            type: 'String',
            value,
          })
        );
      }
    }

    return config;
  }

  /**
   * Build environment structure object
   */
  private buildEnvironmentStructure(config: HarnessEnvironmentConfig): unknown {
    const identifier = config.identifier || this.generateIdentifier(config.name);

    const environment: Record<string, unknown> = {
      environment: {
        name: config.name,
        identifier,
        type: config.type,
        ...(config.description && { description: config.description }),
        ...(config.tags && { tags: config.tags }),
        orgIdentifier: config.orgIdentifier,
        projectIdentifier: config.projectIdentifier,
        ...(config.variables && config.variables.length > 0 && {
          variables: config.variables.map((v) => ({
            name: v.name,
            type: v.type,
            value: v.value,
          })),
        }),
        ...(config.overrides && {
          overrides: this.buildOverrides(config.overrides),
        }),
      },
    };

    return environment;
  }

  /**
   * Build overrides structure
   */
  private buildOverrides(overrides: any): Record<string, unknown> {
    const overridesObj: Record<string, unknown> = {};

    if (overrides.manifests && overrides.manifests.length > 0) {
      overridesObj.manifests = overrides.manifests.map((manifest: any) => ({
        identifier: manifest.identifier,
        type: manifest.type,
        spec: {
          store: {
            type: manifest.spec.store.type,
            spec: manifest.spec.store.spec,
          },
        },
      }));
    }

    if (overrides.configFiles && overrides.configFiles.length > 0) {
      overridesObj.configFiles = overrides.configFiles.map((configFile: any) => ({
        identifier: configFile.identifier,
        spec: {
          store: {
            type: configFile.spec.store.type,
            spec: configFile.spec.store.spec,
          },
        },
      }));
    }

    if (overrides.variables && overrides.variables.length > 0) {
      overridesObj.variables = overrides.variables.map((v: any) => ({
        name: v.name,
        type: v.type,
        value: v.value,
      }));
    }

    return overridesObj;
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
