/**
 * Harness Expert Agent
 *
 * Expert system for Harness CI/CD pipeline generation, template management,
 * and intelligent pipeline suggestions based on project analysis.
 */

import type {
  IHarnessExpertAgent,
  AgentExecutionResult,
  PipelineCreationResult,
  TemplateCreationResult,
  ProjectPipelineParams,
  PipelineSuggestion,
  ValidationResult,
  HarnessTemplateInfo,
  AgentLogEntry,
  AgentMetrics,
} from '../types/agents.js';
import type {
  HarnessPipelineConfig,
  HarnessTemplateConfig,
  HarnessStageConfig,
  HarnessStepConfig,
} from '../types/harness.js';
import type { ProjectAnalysis } from '../types/scaffold.js';
import { PipelineGenerator } from '../harness/pipeline-generator.js';
import { TemplateManager } from '../harness/template-manager.js';
import { ServiceGenerator } from '../harness/service-generator.js';
import { EnvironmentGenerator } from '../harness/environment-generator.js';
import { ValidationError } from '../types/agents.js';

/**
 * Harness Expert Agent implementation
 */
export class HarnessExpertAgent implements IHarnessExpertAgent {
  private pipelineGenerator: PipelineGenerator;
  private templateManager: TemplateManager;
  // @ts-expect-error Reserved for future service generation capabilities
  private readonly serviceGenerator: ServiceGenerator;
  // @ts-expect-error Reserved for future environment generation capabilities
  private readonly environmentGenerator: EnvironmentGenerator;
  private logs: AgentLogEntry[] = [];
  private metrics: AgentMetrics = {
    durationMs: 0,
    tokensUsed: 0,
    apiCalls: 0,
    filesRead: 0,
    filesWritten: 0,
    toolCalls: 0,
  };

  /**
   * Harness pipeline and template patterns
   * Used internally for pattern-based template generation
   */
  // @ts-expect-error Reserved for future pattern-based generation
  private readonly HARNESS_PATTERNS = {
    stepTemplates: {
      'shell-script': this.createShellScriptTemplate.bind(this),
      'http-request': this.createHttpRequestTemplate.bind(this),
      'k8s-deploy': this.createK8sDeployTemplate.bind(this),
      'terraform': this.createTerraformTemplate.bind(this),
      'docker-build': this.createDockerBuildTemplate.bind(this),
      'run-tests': this.createRunTestsTemplate.bind(this),
      'security-scan': this.createSecurityScanTemplate.bind(this),
    },
    stageTemplates: {
      'ci-build': this.createCIBuildStage.bind(this),
      'cd-deploy': this.createCDDeployStage.bind(this),
      'approval': this.createApprovalStage.bind(this),
      'custom': this.createCustomStage.bind(this),
      'security': this.createSecurityStage.bind(this),
    },
    pipelineTemplates: {
      'ci-cd': this.createCICDPipeline.bind(this),
      'gitops': this.createGitOpsPipeline.bind(this),
      'canary': this.createCanaryPipeline.bind(this),
      'blue-green': this.createBlueGreenPipeline.bind(this),
      'terraform': this.createTerraformPipeline.bind(this),
    },
  };

  constructor() {
    this.pipelineGenerator = new PipelineGenerator();
    this.templateManager = new TemplateManager();
    this.serviceGenerator = new ServiceGenerator();
    this.environmentGenerator = new EnvironmentGenerator();
  }

  /**
   * Create a Harness pipeline
   */
  async createPipeline(
    config: HarnessPipelineConfig
  ): Promise<AgentExecutionResult<PipelineCreationResult>> {
    const startTime = Date.now();
    this.log('info', 'Creating Harness pipeline', { config });

    try {
      // Generate pipeline YAML
      const yaml = await this.pipelineGenerator.generate(config);

      // Validate the generated YAML
      const validationResult = await this.validatePipeline(yaml);
      if (!validationResult.success || !validationResult.data?.valid) {
        throw new Error(
          `Pipeline validation failed: ${validationResult.data?.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      // Determine file path
      const identifier = config.identifier || this.generateIdentifier(config.name);
      const filePath = `.harness/${identifier}.yaml`;

      // Create result
      const result: PipelineCreationResult = {
        pipelineId: identifier,
        yaml,
        filePath,
        url: `https://app.harness.io/ng/#/account/${config.orgIdentifier}/module/cd/orgs/${config.orgIdentifier}/projects/${config.projectIdentifier}/pipelines/${identifier}/`,
      };

      this.metrics.durationMs = Date.now() - startTime;
      this.metrics.filesWritten = 1;

      return {
        success: true,
        data: result,
        logs: this.logs,
        filesModified: [filePath],
        metrics: this.metrics,
      };
    } catch (error) {
      this.log('error', 'Failed to create pipeline', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  /**
   * Create a Harness template
   */
  async createTemplate(
    config: HarnessTemplateConfig
  ): Promise<AgentExecutionResult<TemplateCreationResult>> {
    const startTime = Date.now();
    this.log('info', 'Creating Harness template', { config });

    try {
      // Generate template YAML
      const yaml = await this.templateManager.generate(config);

      // Validate the generated YAML
      const validationResult = await this.validatePipeline(yaml);
      if (!validationResult.success || !validationResult.data?.valid) {
        throw new Error(
          `Template validation failed: ${validationResult.data?.errors
            .map((e) => e.message)
            .join(', ')}`
        );
      }

      // Determine file path
      const identifier = config.identifier || this.generateIdentifier(config.name);
      const filePath = `.harness/templates/${config.type.toLowerCase()}/${identifier}.yaml`;

      // Create result
      const result: TemplateCreationResult = {
        templateId: identifier,
        versionLabel: config.versionLabel,
        yaml,
        filePath,
        url: `https://app.harness.io/ng/#/account/${config.orgIdentifier || 'ACCOUNT'}/module/cd/orgs/${config.orgIdentifier}/projects/${config.projectIdentifier}/templates/${identifier}/`,
      };

      this.metrics.durationMs = Date.now() - startTime;
      this.metrics.filesWritten = 1;

      return {
        success: true,
        data: result,
        logs: this.logs,
        filesModified: [filePath],
        metrics: this.metrics,
      };
    } catch (error) {
      this.log('error', 'Failed to create template', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  /**
   * Create pipeline for a scaffolded project
   */
  async createPipelineForProject(
    params: ProjectPipelineParams
  ): Promise<AgentExecutionResult<PipelineCreationResult>> {
    const startTime = Date.now();
    this.log('info', 'Creating pipeline for project', { params });

    try {
      // Detect project patterns
      const analysis = await this.analyzeProjectPath(params.projectPath);

      // Suggest pipeline based on detected patterns
      const suggestion = await this.suggestPipeline(analysis);
      if (!suggestion.success || !suggestion.data) {
        throw new Error('Failed to generate pipeline suggestion');
      }

      // Merge with user-provided config
      const pipelineConfig: HarnessPipelineConfig = {
        ...suggestion.data.pipeline,
        ...params.config,
      };

      // Create the pipeline
      return await this.createPipeline(pipelineConfig);
    } catch (error) {
      this.log('error', 'Failed to create pipeline for project', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  /**
   * Suggest optimal pipeline based on project patterns
   */
  async suggestPipeline(
    analysis: ProjectAnalysis
  ): Promise<AgentExecutionResult<PipelineSuggestion>> {
    const startTime = Date.now();
    this.log('info', 'Suggesting pipeline', { analysis });

    try {
      const detectedPatterns: string[] = [];
      const stages: HarnessStageConfig[] = [];

      // Detect CI patterns
      if (analysis.hasTests) {
        detectedPatterns.push('testing');
        stages.push(this.createCIBuildStage('Build & Test', analysis));
      }

      // Detect Docker patterns
      if (analysis.hasDockerfile) {
        detectedPatterns.push('docker');
        stages.push(this.createDockerBuildStage('Build Docker Image', analysis));
      }

      // Detect Kubernetes patterns
      if (analysis.hasKubernetesConfig) {
        detectedPatterns.push('kubernetes');
        stages.push(this.createK8sDeployStage('Deploy to Kubernetes', analysis));
      }

      // Detect Terraform patterns
      if (analysis.hasTerraform) {
        detectedPatterns.push('terraform');
        stages.push(this.createTerraformStage('Infrastructure', analysis));
      }

      // Build pipeline configuration
      const projectName = analysis.projectName || 'project';
      const pipeline: HarnessPipelineConfig = {
        name: `${projectName} Pipeline`,
        identifier: this.generateIdentifier(projectName),
        orgIdentifier: 'default',
        projectIdentifier: projectName.toLowerCase().replace(/[^a-z0-9_]/g, '_'),
        description: `Auto-generated pipeline for ${analysis.projectType} project`,
        stages,
        variables: [
          {
            name: 'environment',
            type: 'String',
            value: '<+input>',
            description: 'Target environment',
            required: true,
          },
        ],
        properties: analysis.language === 'typescript' || analysis.language === 'javascript'
          ? {
              ci: {
                codebase: {
                  connectorRef: '<+input>',
                  repoName: projectName,
                  build: {
                    type: 'branch',
                    spec: { branch: '<+input>' },
                  },
                },
              },
            }
          : undefined,
      };

      const suggestion: PipelineSuggestion = {
        pipeline,
        confidence: this.calculateConfidence(detectedPatterns),
        reasoning: `Detected ${analysis.projectType} project with ${detectedPatterns.join(', ')} capabilities`,
        detectedPatterns,
      };

      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: true,
        data: suggestion,
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    } catch (error) {
      this.log('error', 'Failed to suggest pipeline', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  /**
   * Validate pipeline YAML
   */
  async validatePipeline(
    yaml: string
  ): Promise<AgentExecutionResult<ValidationResult>> {
    const startTime = Date.now();
    this.log('info', 'Validating pipeline YAML');

    try {
      const errors: ValidationError[] = [];
      const warnings: ValidationError[] = [];

      // Basic YAML syntax validation
      if (!yaml || yaml.trim().length === 0) {
        errors.push({
          code: 'EMPTY_YAML',
          message: 'Pipeline YAML is empty',
        });
      }

      // Check for required fields
      if (!yaml.includes('pipeline:')) {
        errors.push({
          code: 'MISSING_PIPELINE_KEY',
          message: 'Pipeline YAML must contain a "pipeline:" key',
        });
      }

      // Check for identifier
      if (!yaml.includes('identifier:')) {
        errors.push({
          code: 'MISSING_IDENTIFIER',
          message: 'Pipeline must have an identifier',
        });
      }

      // Check for stages
      if (!yaml.includes('stages:')) {
        warnings.push({
          code: 'NO_STAGES',
          message: 'Pipeline has no stages defined',
        });
      }

      const result: ValidationResult = {
        valid: errors.length === 0,
        errors,
        warnings,
      };

      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: true,
        data: result,
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    } catch (error) {
      this.log('error', 'Failed to validate pipeline', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  /**
   * List available templates
   */
  async listTemplates(
    scope: 'project' | 'org' | 'account'
  ): Promise<AgentExecutionResult<HarnessTemplateInfo[]>> {
    const startTime = Date.now();
    this.log('info', 'Listing templates', { scope });

    try {
      const templates = await this.templateManager.list(scope);

      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: true,
        data: templates,
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    } catch (error) {
      this.log('error', 'Failed to list templates', { error });
      this.metrics.durationMs = Date.now() - startTime;

      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        logs: this.logs,
        filesModified: [],
        metrics: this.metrics,
      };
    }
  }

  // ========== Template Creation Methods ==========

  private createShellScriptTemplate(): HarnessStepConfig {
    return {
      name: 'Run Script',
      type: 'ShellScript',
      spec: {
        shell: 'Bash',
        script: '<+input>',
        outputVariables: [],
      },
      timeout: '10m',
    };
  }

  private createHttpRequestTemplate(): HarnessStepConfig {
    return {
      name: 'HTTP Request',
      type: 'Http',
      spec: {
        url: '<+input>',
        method: 'GET',
        headers: [],
        assertion: '<+httpResponseCode> == 200',
      },
      timeout: '10s',
    };
  }

  private createK8sDeployTemplate(): HarnessStepConfig {
    return {
      name: 'Deploy to Kubernetes',
      type: 'K8sRollingDeploy',
      spec: {
        skipDryRun: false,
      },
      timeout: '10m',
    };
  }

  private createTerraformTemplate(): HarnessStepConfig {
    return {
      name: 'Terraform Apply',
      type: 'TerraformApply',
      spec: {
        configuration: {
          type: 'Inline',
          spec: {
            configFiles: {
              store: {
                type: 'Git',
                spec: {
                  connectorRef: '<+input>',
                  gitFetchType: 'Branch',
                  branch: 'main',
                  folderPath: '<+input>',
                },
              },
            },
          },
        },
        provisionerIdentifier: '<+input>',
      },
      timeout: '10m',
    };
  }

  private createDockerBuildTemplate(): HarnessStepConfig {
    return {
      name: 'Build and Push Docker Image',
      type: 'BuildAndPushDockerRegistry',
      spec: {
        connectorRef: '<+input>',
        repo: '<+input>',
        tags: ['<+pipeline.sequenceId>', 'latest'],
        dockerfile: 'Dockerfile',
      },
      timeout: '10m',
    };
  }

  private createRunTestsTemplate(): HarnessStepConfig {
    return {
      name: 'Run Tests',
      type: 'RunTests',
      spec: {
        language: 'node',
        buildTool: 'npm',
        args: 'test',
        runOnlySelectedTests: true,
        preCommand: 'npm install',
      },
      timeout: '10m',
    };
  }

  private createSecurityScanTemplate(): HarnessStepConfig {
    return {
      name: 'Security Scan',
      type: 'Plugin',
      spec: {
        connectorRef: 'account.harnessImage',
        image: 'harness/sto-scanner:latest',
        settings: {
          product_name: '<+input>',
          scan_type: 'repository',
          policy_type: 'orchestratedScan',
        },
      },
      timeout: '10m',
    };
  }

  // ========== Stage Creation Methods ==========

  private createCIBuildStage(name: string, analysis: ProjectAnalysis): HarnessStageConfig {
    const steps: HarnessStepConfig[] = [
      {
        name: 'Install Dependencies',
        type: 'Run',
        spec: {
          shell: 'Bash',
          command: this.getInstallCommand(analysis.language),
        },
      },
    ];

    if (analysis.hasTests) {
      steps.push({
        name: 'Run Tests',
        type: 'RunTests',
        spec: {
          language: analysis.language,
          buildTool: this.getBuildTool(analysis.language),
          args: 'test',
          runOnlySelectedTests: true,
        },
      });
    }

    return {
      name,
      type: 'CI',
      spec: {
        cloneCodebase: true,
        infrastructure: {
          type: 'KubernetesDirect',
          spec: {
            connectorRef: '<+input>',
            namespace: '<+input>',
          },
        },
        execution: {
          steps,
        },
      },
    };
  }

  private createCDDeployStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'Deployment',
      spec: {
        deploymentType: 'Kubernetes',
        serviceConfig: {
          serviceRef: '<+input>',
        },
        environment: {
          environmentRef: '<+input>',
          infrastructureDefinitions: [
            {
              identifier: '<+input>',
            },
          ],
        },
        execution: {
          steps: [
            {
              name: 'Rolling Deployment',
              type: 'K8sRollingDeploy',
              spec: {
                skipDryRun: false,
              },
              timeout: '10m',
            },
          ],
          rollbackSteps: [
            {
              name: 'Rollback',
              type: 'K8sRollingRollback',
              spec: {},
              timeout: '10m',
            },
          ],
        },
      },
    };
  }

  private createApprovalStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'Approval',
      spec: {
        execution: {
          steps: [
            {
              name: 'Manual Approval',
              type: 'HarnessApproval',
              spec: {
                approvalMessage: 'Please review and approve',
                includePipelineExecutionHistory: true,
                approvers: {
                  userGroups: ['<+input>'],
                  minimumCount: 1,
                  disallowPipelineExecutor: false,
                },
              },
              timeout: '1d',
            },
          ],
        },
      },
    };
  }

  private createCustomStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'Custom',
      spec: {
        execution: {
          steps: [
            {
              name: 'Custom Script',
              type: 'ShellScript',
              spec: {
                shell: 'Bash',
                script: 'echo "Custom stage"',
              },
            },
          ],
        },
      },
    };
  }

  private createSecurityStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'SecurityTests',
      spec: {
        cloneCodebase: true,
        infrastructure: {
          type: 'KubernetesDirect',
          spec: {
            connectorRef: '<+input>',
            namespace: '<+input>',
          },
        },
        execution: {
          steps: [
            {
              name: 'SAST Scan',
              type: 'Plugin',
              spec: {
                connectorRef: 'account.harnessImage',
                image: 'harness/sto-scanner:latest',
                settings: {
                  product_name: 'semgrep',
                  scan_type: 'repository',
                  policy_type: 'orchestratedScan',
                },
              },
            },
          ],
        },
      },
    };
  }

  private createDockerBuildStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'CI',
      spec: {
        cloneCodebase: true,
        infrastructure: {
          type: 'KubernetesDirect',
          spec: {
            connectorRef: '<+input>',
            namespace: '<+input>',
          },
        },
        execution: {
          steps: [
            {
              name: 'Build and Push',
              type: 'BuildAndPushDockerRegistry',
              spec: {
                connectorRef: '<+input>',
                repo: '<+input>',
                tags: ['<+pipeline.sequenceId>', 'latest'],
                dockerfile: 'Dockerfile',
              },
              timeout: '10m',
            },
          ],
        },
      },
    };
  }

  private createK8sDeployStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return this.createCDDeployStage(name, _analysis);
  }

  private createTerraformStage(name: string, _analysis: ProjectAnalysis): HarnessStageConfig {
    return {
      name,
      type: 'IACMTerraform',
      spec: {
        execution: {
          steps: [
            {
              name: 'Terraform Plan',
              type: 'TerraformPlan',
              spec: {
                configuration: {
                  type: 'Inline',
                  spec: {
                    configFiles: {
                      store: {
                        type: 'Git',
                        spec: {
                          connectorRef: '<+input>',
                          gitFetchType: 'Branch',
                          branch: 'main',
                          folderPath: 'terraform/',
                        },
                      },
                    },
                  },
                },
                provisionerIdentifier: 'terraform',
              },
              timeout: '10m',
            },
            {
              name: 'Terraform Apply',
              type: 'TerraformApply',
              spec: {
                configuration: {
                  type: 'InheritFromPlan',
                },
                provisionerIdentifier: 'terraform',
              },
              timeout: '10m',
            },
          ],
        },
      },
    };
  }

  // ========== Pipeline Creation Methods ==========

  private createCICDPipeline(): HarnessPipelineConfig {
    return {
      name: 'CI/CD Pipeline',
      identifier: 'ci_cd_pipeline',
      orgIdentifier: 'default',
      projectIdentifier: '<+input>',
      stages: [
        this.createCIBuildStage('Build', {} as ProjectAnalysis),
        this.createCDDeployStage('Deploy', {} as ProjectAnalysis),
      ],
    };
  }

  private createGitOpsPipeline(): HarnessPipelineConfig {
    return {
      name: 'GitOps Pipeline',
      identifier: 'gitops_pipeline',
      orgIdentifier: 'default',
      projectIdentifier: '<+input>',
      stages: [
        this.createCIBuildStage('Build', {} as ProjectAnalysis),
        {
          name: 'Update Manifest',
          type: 'Custom',
          spec: {
            execution: {
              steps: [
                {
                  name: 'Update Image Tag',
                  type: 'ShellScript',
                  spec: {
                    shell: 'Bash',
                    script: 'yq eval ".image.tag = \\"<+pipeline.sequenceId>\\"" -i values.yaml',
                  },
                },
              ],
            },
          },
        },
      ],
    };
  }

  private createCanaryPipeline(): HarnessPipelineConfig {
    return {
      name: 'Canary Deployment',
      identifier: 'canary_deployment',
      orgIdentifier: 'default',
      projectIdentifier: '<+input>',
      stages: [
        this.createCIBuildStage('Build', {} as ProjectAnalysis),
        {
          name: 'Canary Deploy',
          type: 'Deployment',
          spec: {
            deploymentType: 'Kubernetes',
            serviceConfig: {
              serviceRef: '<+input>',
            },
            environment: {
              environmentRef: '<+input>',
              infrastructureDefinitions: [{ identifier: '<+input>' }],
            },
            execution: {
              steps: [
                {
                  name: 'Canary Deploy',
                  type: 'K8sCanaryDeploy',
                  spec: {
                    instanceSelection: {
                      type: 'Count',
                      spec: {
                        count: 1,
                      },
                    },
                    skipDryRun: false,
                  },
                  timeout: '10m',
                },
                {
                  name: 'Wait',
                  type: 'Wait',
                  spec: {
                    duration: '5m',
                  },
                },
                {
                  name: 'Canary Delete',
                  type: 'K8sCanaryDelete',
                  spec: {},
                  timeout: '10m',
                },
                {
                  name: 'Rolling Deploy',
                  type: 'K8sRollingDeploy',
                  spec: {
                    skipDryRun: false,
                  },
                  timeout: '10m',
                },
              ],
              rollbackSteps: [
                {
                  name: 'Rollback',
                  type: 'K8sRollingRollback',
                  spec: {},
                  timeout: '10m',
                },
              ],
            },
          },
        },
      ],
    };
  }

  private createBlueGreenPipeline(): HarnessPipelineConfig {
    return {
      name: 'Blue-Green Deployment',
      identifier: 'blue_green_deployment',
      orgIdentifier: 'default',
      projectIdentifier: '<+input>',
      stages: [
        this.createCIBuildStage('Build', {} as ProjectAnalysis),
        {
          name: 'Blue-Green Deploy',
          type: 'Deployment',
          spec: {
            deploymentType: 'Kubernetes',
            serviceConfig: {
              serviceRef: '<+input>',
            },
            environment: {
              environmentRef: '<+input>',
              infrastructureDefinitions: [{ identifier: '<+input>' }],
            },
            execution: {
              steps: [
                {
                  name: 'Blue-Green Deploy',
                  type: 'K8sBlueGreenDeploy',
                  spec: {
                    skipDryRun: false,
                  },
                  timeout: '10m',
                },
                {
                  name: 'Approval',
                  type: 'HarnessApproval',
                  spec: {
                    approvalMessage: 'Approve swap',
                    includePipelineExecutionHistory: true,
                    approvers: {
                      userGroups: ['<+input>'],
                      minimumCount: 1,
                    },
                  },
                  timeout: '1d',
                },
                {
                  name: 'Swap Services',
                  type: 'K8sBGSwapServices',
                  spec: {},
                  timeout: '10m',
                },
              ],
              rollbackSteps: [
                {
                  name: 'Swap Rollback',
                  type: 'K8sBGSwapServices',
                  spec: {},
                  timeout: '10m',
                },
              ],
            },
          },
        },
      ],
    };
  }

  private createTerraformPipeline(): HarnessPipelineConfig {
    return {
      name: 'Terraform Pipeline',
      identifier: 'terraform_pipeline',
      orgIdentifier: 'default',
      projectIdentifier: '<+input>',
      stages: [
        this.createTerraformStage('Infrastructure', {} as ProjectAnalysis),
      ],
    };
  }

  // ========== Helper Methods ==========

  private async analyzeProjectPath(_projectPath: string): Promise<ProjectAnalysis> {
    // Stub implementation - would analyze the actual project directory
    return {
      projectName: 'example-project',
      projectType: 'webapp',
      language: 'typescript',
      frameworks: ['react'],
      patterns: [],
      suggestedVariables: {},
      hasTests: true,
      hasDockerfile: true,
      hasKubernetesConfig: true,
      hasTerraform: false,
      dependencies: {},
      devDependencies: {},
    };
  }

  private generateIdentifier(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
  }

  private calculateConfidence(patterns: string[]): number {
    // Base confidence on number of detected patterns
    return Math.min(0.5 + patterns.length * 0.1, 0.95);
  }

  private getInstallCommand(language: string): string {
    const commands: Record<string, string> = {
      javascript: 'npm install',
      typescript: 'npm install',
      python: 'pip install -r requirements.txt',
      java: 'mvn install',
      go: 'go mod download',
      rust: 'cargo build',
    };
    return commands[language] || 'echo "No install command"';
  }

  private getBuildTool(language: string): string {
    const tools: Record<string, string> = {
      javascript: 'npm',
      typescript: 'npm',
      python: 'pytest',
      java: 'maven',
      go: 'go',
      rust: 'cargo',
    };
    return tools[language] || 'npm';
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: Record<string, unknown>): void {
    this.logs.push({
      timestamp: new Date(),
      level,
      message,
      data,
    });
  }
}
