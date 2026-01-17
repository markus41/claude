/**
 * Harness Expert Agent Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HarnessExpertAgent } from './harness-expert.js';
import type {
  HarnessPipelineConfig,
  HarnessTemplateConfig,
} from '../types/harness.js';
import type { ProjectPipelineParams } from '../types/agents.js';

describe('HarnessExpertAgent', () => {
  let agent: HarnessExpertAgent;

  beforeEach(() => {
    agent = new HarnessExpertAgent();
  });

  describe('createPipeline', () => {
    it('should create a basic CI/CD pipeline', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Test Pipeline',
        identifier: 'test_pipeline',
        orgIdentifier: 'default',
        projectIdentifier: 'test_project',
        stages: [
          {
            name: 'Build',
            type: 'CI',
            spec: {
              cloneCodebase: true,
              infrastructure: {
                type: 'KubernetesDirect',
                spec: {
                  connectorRef: 'k8s_connector',
                  namespace: 'harness',
                },
              },
              execution: {
                steps: [
                  {
                    name: 'Run Tests',
                    type: 'RunTests',
                    spec: {
                      language: 'node',
                      buildTool: 'npm',
                      args: 'test',
                    },
                  },
                ],
              },
            },
          },
        ],
      };

      const result = await agent.createPipeline(config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pipelineId).toBe('test_pipeline');
      expect(result.data?.yaml).toContain('pipeline:');
      expect(result.data?.yaml).toContain('name: Test Pipeline');
      expect(result.data?.filePath).toMatch(/\.harness\/.*\.yaml$/);
    });

    it('should include variables in pipeline', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Pipeline with Variables',
        orgIdentifier: 'default',
        projectIdentifier: 'test_project',
        stages: [],
        variables: [
          {
            name: 'environment',
            type: 'String',
            value: '<+input>',
            description: 'Target environment',
            required: true,
          },
        ],
      };

      const result = await agent.createPipeline(config);

      expect(result.success).toBe(true);
      expect(result.data?.yaml).toContain('variables:');
      expect(result.data?.yaml).toContain('name: environment');
    });

    it('should include notification rules', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Pipeline with Notifications',
        orgIdentifier: 'default',
        projectIdentifier: 'test_project',
        stages: [],
        notificationRules: [
          {
            name: 'Slack Notifications',
            pipelineEvents: ['PipelineFailed'],
            notificationMethod: {
              type: 'Slack',
              spec: {
                webhookUrl: 'https://hooks.slack.com/test',
              },
            },
          },
        ],
      };

      const result = await agent.createPipeline(config);

      expect(result.success).toBe(true);
      expect(result.data?.yaml).toContain('notificationRules:');
      expect(result.data?.yaml).toContain('Slack');
    });
  });

  describe('createTemplate', () => {
    it('should create a step template', async () => {
      const config: HarnessTemplateConfig = {
        name: 'Shell Script Template',
        identifier: 'shell_script_template',
        type: 'Step',
        scope: 'project',
        projectIdentifier: 'test_project',
        orgIdentifier: 'default',
        versionLabel: '1.0.0',
        spec: {
          name: 'Run Script',
          type: 'ShellScript',
          spec: {
            shell: 'Bash',
            script: '<+input>',
          },
        },
      };

      const result = await agent.createTemplate(config);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.templateId).toBe('shell_script_template');
      expect(result.data?.yaml).toContain('template:');
      expect(result.data?.yaml).toContain('type: Step');
      expect(result.data?.filePath).toMatch(/\.harness\/templates\/step\/.*\.yaml$/);
    });

    it('should create a stage template', async () => {
      const config: HarnessTemplateConfig = {
        name: 'CI Build Stage',
        type: 'Stage',
        scope: 'org',
        orgIdentifier: 'default',
        versionLabel: '1.0.0',
        spec: {
          name: 'Build',
          type: 'CI',
          spec: {
            cloneCodebase: true,
            execution: {
              steps: [
                {
                  name: 'Build',
                  type: 'Run',
                  spec: {
                    shell: 'Bash',
                    command: 'npm run build',
                  },
                },
              ],
            },
          },
        },
      };

      const result = await agent.createTemplate(config);

      expect(result.success).toBe(true);
      expect(result.data?.yaml).toContain('type: Stage');
    });

    it('should create a pipeline template', async () => {
      const config: HarnessTemplateConfig = {
        name: 'CI/CD Template',
        type: 'Pipeline',
        scope: 'account',
        versionLabel: '1.0.0',
        spec: {
          name: 'CI/CD Pipeline',
          orgIdentifier: 'default',
          projectIdentifier: '<+input>',
          stages: [
            {
              name: 'Build',
              type: 'CI',
              spec: {
                execution: {
                  steps: [],
                },
              },
            },
          ],
        },
      };

      const result = await agent.createTemplate(config);

      expect(result.success).toBe(true);
      expect(result.data?.yaml).toContain('type: Pipeline');
    });
  });

  describe('suggestPipeline', () => {
    it('should suggest pipeline for Node.js project with tests', async () => {
      const analysis = {
        projectName: 'my-app',
        projectType: 'webapp' as const,
        language: 'typescript',
        frameworks: ['react'],
        hasTests: true,
        hasDockerfile: true,
        hasKubernetesConfig: true,
        hasTerraform: false,
        dependencies: {},
        devDependencies: {},
        patterns: [],
        suggestedVariables: {},
      };

      const result = await agent.suggestPipeline(analysis);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.pipeline.stages.length).toBeGreaterThan(0);
      expect(result.data?.detectedPatterns).toContain('testing');
      expect(result.data?.detectedPatterns).toContain('docker');
      expect(result.data?.detectedPatterns).toContain('kubernetes');
      expect(result.data?.confidence).toBeGreaterThan(0.5);
    });

    it('should suggest Terraform pipeline for IaC project', async () => {
      const analysis = {
        projectName: 'infrastructure',
        projectType: 'infrastructure' as const,
        language: 'hcl',
        frameworks: [],
        hasTests: false,
        hasDockerfile: false,
        hasKubernetesConfig: false,
        hasTerraform: true,
        dependencies: {},
        devDependencies: {},
        patterns: [],
        suggestedVariables: {},
      };

      const result = await agent.suggestPipeline(analysis);

      expect(result.success).toBe(true);
      expect(result.data?.detectedPatterns).toContain('terraform');
    });

    it('should include reasoning in suggestion', async () => {
      const analysis = {
        projectName: 'test-app',
        projectType: 'api' as const,
        language: 'python',
        frameworks: ['fastapi'],
        hasTests: true,
        hasDockerfile: false,
        hasKubernetesConfig: false,
        hasTerraform: false,
        dependencies: {},
        devDependencies: {},
        patterns: [],
        suggestedVariables: {},
      };

      const result = await agent.suggestPipeline(analysis);

      expect(result.success).toBe(true);
      expect(result.data?.reasoning).toBeDefined();
      expect(result.data?.reasoning).toContain('api');
    });
  });

  describe('validatePipeline', () => {
    it('should validate correct pipeline YAML', async () => {
      const yaml = `
pipeline:
  name: Test Pipeline
  identifier: test_pipeline
  stages:
    - stage:
        name: Build
        type: CI
`;

      const result = await agent.validatePipeline(yaml);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(true);
      expect(result.data?.errors.length).toBe(0);
    });

    it('should detect empty YAML', async () => {
      const result = await agent.validatePipeline('');

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors.length).toBeGreaterThan(0);
      expect(result.data?.errors[0]!.code).toBe('EMPTY_YAML');
    });

    it('should detect missing pipeline key', async () => {
      const yaml = `
name: Test
identifier: test
`;

      const result = await agent.validatePipeline(yaml);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors.some((e) => e.code === 'MISSING_PIPELINE_KEY')).toBe(
        true
      );
    });

    it('should detect missing identifier', async () => {
      const yaml = `
pipeline:
  name: Test Pipeline
`;

      const result = await agent.validatePipeline(yaml);

      expect(result.success).toBe(true);
      expect(result.data?.valid).toBe(false);
      expect(result.data?.errors.some((e) => e.code === 'MISSING_IDENTIFIER')).toBe(
        true
      );
    });

    it('should warn about missing stages', async () => {
      const yaml = `
pipeline:
  name: Test Pipeline
  identifier: test_pipeline
`;

      const result = await agent.validatePipeline(yaml);

      expect(result.success).toBe(true);
      expect(result.data?.warnings.length).toBeGreaterThan(0);
      expect(result.data?.warnings[0]!.code).toBe('NO_STAGES');
    });
  });

  describe('listTemplates', () => {
    it('should list project templates', async () => {
      const result = await agent.listTemplates('project');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should list org templates', async () => {
      const result = await agent.listTemplates('org');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should list account templates', async () => {
      const result = await agent.listTemplates('account');

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.length).toBeGreaterThan(0);
    });

    it('should include template metadata', async () => {
      const result = await agent.listTemplates('account');

      expect(result.success).toBe(true);
      const template = result.data![0]!;
      expect(template.identifier).toBeDefined();
      expect(template.name).toBeDefined();
      expect(template.type).toBeDefined();
      expect(template.scope).toBeDefined();
      expect(template.versionLabel).toBeDefined();
    });
  });

  describe('createPipelineForProject', () => {
    it('should create pipeline for Node.js project', async () => {
      const params: ProjectPipelineParams = {
        projectPath: './test-app',
        projectType: 'nodejs',
        environments: ['dev', 'staging', 'prod'],
        includeCI: true,
        includeCD: true,
      };

      const result = await agent.createPipelineForProject(params);

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.yaml).toContain('pipeline:');
    });

    it('should merge user config with suggested pipeline', async () => {
      const params: ProjectPipelineParams = {
        projectPath: './test-app',
        projectType: 'python',
        environments: ['dev'],
        includeCI: true,
        config: {
          name: 'Custom Pipeline Name',
          description: 'Custom description',
        },
      };

      const result = await agent.createPipelineForProject(params);

      expect(result.success).toBe(true);
      expect(result.data?.yaml).toContain('Custom Pipeline Name');
      expect(result.data?.yaml).toContain('Custom description');
    });
  });

  describe('metrics tracking', () => {
    it('should track execution metrics', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Test Pipeline',
        orgIdentifier: 'default',
        projectIdentifier: 'test',
        stages: [],
      };

      const result = await agent.createPipeline(config);

      expect(result.metrics).toBeDefined();
      expect(result.metrics.durationMs).toBeGreaterThan(0);
      expect(result.metrics.filesWritten).toBe(1);
    });

    it('should track logs', async () => {
      const config: HarnessPipelineConfig = {
        name: 'Test Pipeline',
        orgIdentifier: 'default',
        projectIdentifier: 'test',
        stages: [],
      };

      const result = await agent.createPipeline(config);

      expect(result.logs).toBeDefined();
      expect(result.logs.length).toBeGreaterThan(0);
      expect(result.logs[0]!.level).toBeDefined();
      expect(result.logs[0]!.message).toBeDefined();
    });
  });
});
