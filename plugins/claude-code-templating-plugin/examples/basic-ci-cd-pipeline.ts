/**
 * Example: Basic CI/CD Pipeline
 *
 * Demonstrates creating a simple CI/CD pipeline with build, test, and deploy stages.
 */

import { HarnessExpertAgent } from '../src/agents/harness-expert.js';
import type { HarnessPipelineConfig } from '../src/types/harness.js';

async function createBasicCICDPipeline() {
  const agent = new HarnessExpertAgent();

  const config: HarnessPipelineConfig = {
    name: 'Basic CI/CD Pipeline',
    identifier: 'basic_ci_cd',
    orgIdentifier: 'default',
    projectIdentifier: 'my_project',
    description: 'Simple build, test, and deploy pipeline',
    tags: {
      team: 'platform',
      environment: 'production',
    },
    stages: [
      // CI Build Stage
      {
        name: 'Build',
        type: 'CI',
        spec: {
          cloneCodebase: true,
          infrastructure: {
            type: 'KubernetesDirect',
            spec: {
              connectorRef: '<+input>',
              namespace: 'harness-delegate',
            },
          },
          execution: {
            steps: [
              {
                name: 'Install Dependencies',
                type: 'Run',
                spec: {
                  shell: 'Bash',
                  command: 'npm ci',
                },
                timeout: '5m',
              },
              {
                name: 'Lint Code',
                type: 'Run',
                spec: {
                  shell: 'Bash',
                  command: 'npm run lint',
                },
                timeout: '2m',
              },
              {
                name: 'Run Tests',
                type: 'RunTests',
                spec: {
                  language: 'node',
                  buildTool: 'npm',
                  args: 'test',
                  runOnlySelectedTests: true,
                },
                timeout: '10m',
              },
              {
                name: 'Build Application',
                type: 'Run',
                spec: {
                  shell: 'Bash',
                  command: 'npm run build',
                },
                timeout: '5m',
              },
              {
                name: 'Build Docker Image',
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
        failureStrategies: [
          {
            onFailure: {
              errors: ['AllErrors'],
              action: {
                type: 'Abort',
              },
            },
          },
        ],
      },
      // CD Deploy Stage
      {
        name: 'Deploy to Dev',
        type: 'Deployment',
        spec: {
          deploymentType: 'Kubernetes',
          serviceConfig: {
            serviceRef: '<+input>',
          },
          environment: {
            environmentRef: 'dev',
            infrastructureDefinitions: [
              {
                identifier: 'dev_k8s',
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
              {
                name: 'Health Check',
                type: 'Http',
                spec: {
                  url: '<+service.variables.health_url>',
                  method: 'GET',
                  assertion: '<+httpResponseCode> == 200',
                },
                timeout: '30s',
              },
            ],
            rollbackSteps: [
              {
                name: 'Rollback Deployment',
                type: 'K8sRollingRollback',
                spec: {},
                timeout: '10m',
              },
            ],
          },
        },
        failureStrategies: [
          {
            onFailure: {
              errors: ['AllErrors'],
              action: {
                type: 'StageRollback',
              },
            },
          },
        ],
      },
    ],
    variables: [
      {
        name: 'environment',
        type: 'String',
        value: 'dev',
        description: 'Target environment',
      },
      {
        name: 'notify_on_failure',
        type: 'String',
        value: 'true',
        description: 'Send notifications on failure',
      },
    ],
    notificationRules: [
      {
        name: 'Failure Notifications',
        pipelineEvents: ['PipelineFailed', 'StageFailed'],
        notificationMethod: {
          type: 'Slack',
          spec: {
            webhookUrl: '<+secrets.getValue("slack_webhook")>',
          },
        },
        enabled: true,
      },
    ],
    properties: {
      ci: {
        codebase: {
          connectorRef: '<+input>',
          repoName: '<+input>',
          build: {
            type: 'branch',
            spec: {
              branch: '<+input>',
            },
          },
        },
      },
    },
  };

  const result = await agent.createPipeline(config);

  if (result.success) {
    console.log('✅ Pipeline created successfully!');
    console.log(`📄 Pipeline ID: ${result.data?.pipelineId}`);
    console.log(`💾 Saved to: ${result.data?.filePath}`);
    console.log(`🔗 URL: ${result.data?.url}`);
    console.log('\n📋 Pipeline YAML:\n');
    console.log(result.data?.yaml);
  } else {
    console.error('❌ Failed to create pipeline:', result.error);
  }

  return result;
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  createBasicCICDPipeline().catch(console.error);
}

export { createBasicCICDPipeline };
