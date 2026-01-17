/**
 * Example: Canary Deployment
 *
 * Demonstrates creating a canary deployment pipeline with gradual rollout.
 */

import { HarnessExpertAgent } from '../src/agents/harness-expert.js';
import type { HarnessPipelineConfig } from '../src/types/harness.js';

async function createCanaryDeployment() {
  const agent = new HarnessExpertAgent();

  const config: HarnessPipelineConfig = {
    name: 'Canary Deployment Pipeline',
    identifier: 'canary_deployment',
    orgIdentifier: 'default',
    projectIdentifier: 'my_project',
    description: 'Gradual rollout with automated canary analysis',
    stages: [
      // Build Stage
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
                name: 'Build and Push',
                type: 'BuildAndPushDockerRegistry',
                spec: {
                  connectorRef: '<+input>',
                  repo: '<+input>',
                  tags: ['<+pipeline.sequenceId>'],
                },
              },
            ],
          },
        },
      },
      // Canary Deploy Stage
      {
        name: 'Canary Deploy',
        type: 'Deployment',
        spec: {
          deploymentType: 'Kubernetes',
          serviceConfig: {
            serviceRef: '<+input>',
          },
          environment: {
            environmentRef: 'production',
            infrastructureDefinitions: [
              {
                identifier: 'prod_k8s',
              },
            ],
          },
          execution: {
            steps: [
              // Deploy Canary (25%)
              {
                name: 'Deploy Canary 25%',
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
              // Wait for metrics
              {
                name: 'Wait for Metrics',
                type: 'Wait',
                spec: {
                  duration: '5m',
                },
              },
              // Verify Canary
              {
                name: 'Verify Canary',
                type: 'Http',
                spec: {
                  url: '<+service.variables.health_url>/canary',
                  method: 'GET',
                  assertion: '<+httpResponseCode> == 200',
                },
              },
              // Manual Approval
              {
                name: 'Approve Canary',
                type: 'HarnessApproval',
                spec: {
                  approvalMessage: 'Canary metrics look good. Proceed with full deployment?',
                  includePipelineExecutionHistory: true,
                  approvers: {
                    userGroups: ['<+input>'],
                    minimumCount: 1,
                    disallowPipelineExecutor: false,
                  },
                },
                timeout: '1h',
                when: {
                  stageStatus: 'Success',
                  condition: '<+pipeline.variables.require_approval> == "true"',
                },
              },
              // Delete Canary
              {
                name: 'Delete Canary',
                type: 'K8sCanaryDelete',
                spec: {},
                timeout: '10m',
              },
              // Full Deployment
              {
                name: 'Full Deployment',
                type: 'K8sRollingDeploy',
                spec: {
                  skipDryRun: false,
                },
                timeout: '10m',
              },
              // Post-deployment Verification
              {
                name: 'Post-Deployment Check',
                type: 'Http',
                spec: {
                  url: '<+service.variables.health_url>',
                  method: 'GET',
                  assertion: '<+httpResponseCode> == 200',
                },
                timeout: '1m',
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
              errors: ['Verification'],
              action: {
                type: 'StageRollback',
              },
            },
          },
          {
            onFailure: {
              errors: ['Timeout'],
              action: {
                type: 'Retry',
                spec: {
                  retryCount: 2,
                  retryIntervals: ['10s', '30s'],
                  onRetryFailure: {
                    type: 'StageRollback',
                  },
                },
              },
            },
          },
        ],
      },
    ],
    variables: [
      {
        name: 'require_approval',
        type: 'String',
        value: 'true',
        description: 'Require manual approval before full deployment',
      },
      {
        name: 'canary_timeout',
        type: 'String',
        value: '5m',
        description: 'Time to wait for canary metrics',
      },
    ],
    notificationRules: [
      {
        name: 'Deployment Notifications',
        pipelineEvents: ['PipelineSuccess', 'PipelineFailed'],
        notificationMethod: {
          type: 'Slack',
          spec: {
            webhookUrl: '<+secrets.getValue("slack_webhook")>',
          },
        },
      },
    ],
  };

  const result = await agent.createPipeline(config);

  if (result.success) {
    console.log('✅ Canary deployment pipeline created successfully!');
    console.log(`📄 Pipeline ID: ${result.data?.pipelineId}`);
    console.log(`💾 Saved to: ${result.data?.filePath}`);
    console.log('\n📋 Pipeline YAML:\n');
    console.log(result.data?.yaml);
  } else {
    console.error('❌ Failed to create pipeline:', result.error);
  }

  return result;
}

// Run the example
if (import.meta.url === `file://${process.argv[1]}`) {
  createCanaryDeployment().catch(console.error);
}

export { createCanaryDeployment };
