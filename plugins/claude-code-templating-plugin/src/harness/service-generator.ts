/**
 * Service Generator
 *
 * Generates Harness service configurations for various deployment types
 * including Kubernetes, Helm, Serverless, and custom services.
 */

import * as yaml from 'yaml';
import type { HarnessServiceConfig } from '../types/harness.js';

export class ServiceGenerator {
  /**
   * Generate service YAML from configuration
   */
  async generate(config: HarnessServiceConfig): Promise<string> {
    const serviceYaml = this.buildServiceStructure(config);
    return yaml.stringify(serviceYaml, {
      indent: 2,
      lineWidth: 120,
      aliasDuplicateObjects: false,
    });
  }

  /**
   * Generate Kubernetes service
   */
  async generateKubernetesService(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string,
    manifestPath: string,
    connectorRef: string
  ): Promise<HarnessServiceConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      description: `Kubernetes service for ${name}`,
      serviceDefinition: {
        type: 'Kubernetes',
        spec: {
          manifests: [
            {
              identifier: 'k8s_manifests',
              type: 'K8sManifest',
              spec: {
                store: {
                  type: 'Git',
                  spec: {
                    connectorRef,
                    gitFetchType: 'Branch',
                    branch: 'main',
                    paths: [manifestPath],
                  },
                },
                skipResourceVersioning: false,
              },
            },
          ],
          artifacts: {
            primary: {
              identifier: 'primary_artifact',
              type: 'DockerRegistry',
              spec: {
                connectorRef: '<+input>',
                imagePath: '<+input>',
                tag: '<+input>',
              },
            },
          },
        },
      },
    };
  }

  /**
   * Generate Helm service
   */
  async generateHelmService(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string,
    chartPath: string,
    connectorRef: string
  ): Promise<HarnessServiceConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      description: `Helm service for ${name}`,
      serviceDefinition: {
        type: 'NativeHelm',
        spec: {
          manifests: [
            {
              identifier: 'helm_chart',
              type: 'HelmChart',
              spec: {
                store: {
                  type: 'Git',
                  spec: {
                    connectorRef,
                    gitFetchType: 'Branch',
                    branch: 'main',
                    folderPath: chartPath,
                  },
                },
                skipResourceVersioning: false,
              },
            },
          ],
          artifacts: {
            primary: {
              identifier: 'primary_artifact',
              type: 'DockerRegistry',
              spec: {
                connectorRef: '<+input>',
                imagePath: '<+input>',
                tag: '<+input>',
              },
            },
          },
        },
      },
    };
  }

  /**
   * Generate Serverless service
   */
  async generateServerlessService(
    name: string,
    orgIdentifier: string,
    projectIdentifier: string,
    configPath: string,
    connectorRef: string
  ): Promise<HarnessServiceConfig> {
    return {
      name,
      identifier: this.generateIdentifier(name),
      orgIdentifier,
      projectIdentifier,
      description: `Serverless service for ${name}`,
      serviceDefinition: {
        type: 'ServerlessAwsLambda',
        spec: {
          manifests: [
            {
              identifier: 'serverless_config',
              type: 'K8sManifest', // Serverless uses generic manifest type
              spec: {
                store: {
                  type: 'Git',
                  spec: {
                    connectorRef,
                    gitFetchType: 'Branch',
                    branch: 'main',
                    paths: [configPath],
                  },
                },
              },
            },
          ],
          artifacts: {
            primary: {
              identifier: 'lambda_package',
              type: 'AmazonS3',
              spec: {
                connectorRef: '<+input>',
                bucket: '<+input>',
                filePathRegex: '.*\\.zip',
              },
            },
          },
        },
      },
    };
  }

  /**
   * Build service structure object
   */
  private buildServiceStructure(config: HarnessServiceConfig): unknown {
    const identifier = config.identifier || this.generateIdentifier(config.name);

    const service: Record<string, unknown> = {
      service: {
        name: config.name,
        identifier,
        ...(config.description && { description: config.description }),
        ...(config.tags && { tags: config.tags }),
        serviceDefinition: {
          type: config.serviceDefinition.type,
          spec: this.buildServiceSpec(config.serviceDefinition.spec),
        },
      },
    };

    return service;
  }

  /**
   * Build service spec
   */
  private buildServiceSpec(spec: any): Record<string, unknown> {
    const specObj: Record<string, unknown> = {};

    if (spec.manifests) {
      specObj.manifests = spec.manifests.map((manifest: any) => ({
        identifier: manifest.identifier,
        type: manifest.type,
        spec: {
          store: {
            type: manifest.spec.store.type,
            spec: manifest.spec.store.spec,
          },
          ...(manifest.spec.skipResourceVersioning !== undefined && {
            skipResourceVersioning: manifest.spec.skipResourceVersioning,
          }),
          ...(manifest.spec.valuesPaths && {
            valuesPaths: manifest.spec.valuesPaths,
          }),
        },
      }));
    }

    if (spec.artifacts) {
      const artifacts: Record<string, unknown> = {};

      if (spec.artifacts.primary) {
        artifacts.primary = {
          identifier: spec.artifacts.primary.identifier,
          type: spec.artifacts.primary.type,
          spec: spec.artifacts.primary.spec,
        };
      }

      if (spec.artifacts.sidecars && spec.artifacts.sidecars.length > 0) {
        artifacts.sidecars = spec.artifacts.sidecars.map((sidecar: any) => ({
          identifier: sidecar.identifier,
          type: sidecar.type,
          spec: sidecar.spec,
        }));
      }

      specObj.artifacts = artifacts;
    }

    if (spec.variables && spec.variables.length > 0) {
      specObj.variables = spec.variables.map((v: any) => ({
        name: v.name,
        type: v.type,
        value: v.value,
      }));
    }

    return specObj;
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
