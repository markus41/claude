---
name: itg:gitops
description: Generate ArgoCD ApplicationSets and Harness GitX configuration
version: 1.0.0
category: infrastructure
author: Brookside BI
arguments:
  - name: name
    description: Application name
    required: true
    type: string
flags:
  - name: generator
    description: ApplicationSet generator type
    type: choice
    choices: [list, git, cluster, matrix, merge]
    default: list
  - name: environments
    description: Comma-separated environment list (for list generator)
    type: string
    default: "dev,staging,prod"
  - name: repo-url
    description: Git repository URL (for git generator)
    type: string
  - name: target-clusters
    description: Comma-separated cluster names (for cluster generator)
    type: string
  - name: output
    description: Output directory for GitOps manifests
    type: string
    default: "./gitops"
  - name: harness-gitx
    description: Include Harness GitX sync configuration
    type: boolean
    default: false
  - name: progressive-delivery
    description: Progressive delivery strategy
    type: choice
    choices: [none, canary, blue-green]
    default: none
  - name: analysis-template
    description: Include Argo Rollouts analysis templates
    type: boolean
    default: false
aliases:
  - itg:argocd
  - itg:applicationset
presets:
  - name: simple
    description: Basic list-based ApplicationSet
    flags:
      generator: list
      harness-gitx: false
      progressive-delivery: none
  - name: multi-cluster
    description: Cluster generator for multi-cluster deployments
    flags:
      generator: cluster
      progressive-delivery: canary
  - name: harness-integration
    description: Full Harness GitX integration with progressive delivery
    flags:
      generator: list
      harness-gitx: true
      progressive-delivery: canary
      analysis-template: true
---

# Generate GitOps ApplicationSets and Harness GitX Configuration

**Best for:** Creating declarative GitOps workflows with ArgoCD ApplicationSets, enabling automated multi-environment deployments with progressive delivery and Harness GitX integration.

## Overview

The `itg:gitops` command generates production-ready ArgoCD ApplicationSets for GitOps-based continuous delivery. It supports multiple generator types, progressive delivery strategies, and seamless integration with Harness GitX for unified pipeline orchestration.

**Business Value:**
- Automates deployment across multiple environments from a single manifest
- Enables GitOps best practices with declarative infrastructure
- Reduces deployment errors through automated reconciliation
- Provides progressive delivery with automated rollback
- Integrates with Harness for unified visibility and control
- Scales deployments across multiple clusters effortlessly

## ApplicationSet Generators

### List Generator

The most common pattern for multi-environment deployments.

**Use Case:** Deploy the same application to multiple environments (dev, staging, prod) with environment-specific configurations.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: {{name}}
  namespace: argocd
spec:
  generators:
    - list:
        elements:
          - environment: dev
            cluster: in-cluster
            namespace: {{name}}-dev
            replicaCount: "1"
            imageTag: develop
          - environment: staging
            cluster: staging-cluster
            namespace: {{name}}-staging
            replicaCount: "2"
            imageTag: staging
          - environment: prod
            cluster: prod-cluster
            namespace: {{name}}-prod
            replicaCount: "3"
            imageTag: stable
  template:
    metadata:
      name: '{{name}}-{{environment}}'
      labels:
        environment: '{{environment}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/{{name}}
        targetRevision: HEAD
        path: k8s/overlays/{{environment}}
        helm:
          parameters:
            - name: image.tag
              value: '{{imageTag}}'
            - name: replicaCount
              value: '{{replicaCount}}'
      destination:
        server: '{{cluster}}'
        namespace: '{{namespace}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Git Generator

Automatically discovers environments from repository directory structure.

**Use Case:** Dynamically deploy applications based on Git repository structure without hardcoding environments.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: {{name}}
  namespace: argocd
spec:
  generators:
    - git:
        repoURL: https://github.com/org/{{name}}
        revision: HEAD
        directories:
          - path: k8s/overlays/*
  template:
    metadata:
      name: '{{name}}-{{path.basename}}'
      labels:
        environment: '{{path.basename}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/{{name}}
        targetRevision: HEAD
        path: '{{path}}'
      destination:
        server: https://kubernetes.default.svc
        namespace: '{{name}}-{{path.basename}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Cluster Generator

Deploy to multiple clusters automatically based on cluster labels.

**Use Case:** Multi-cluster deployments where application should be deployed to all clusters matching specific criteria.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: {{name}}
  namespace: argocd
spec:
  generators:
    - clusters:
        selector:
          matchLabels:
            environment: production
            region: us-west-2
  template:
    metadata:
      name: '{{name}}-{{name}}'
      labels:
        cluster: '{{name}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/{{name}}
        targetRevision: HEAD
        path: k8s/base
      destination:
        server: '{{server}}'
        namespace: {{name}}
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
        syncOptions:
          - CreateNamespace=true
```

### Matrix Generator

Combines multiple generators for complex deployment scenarios.

**Use Case:** Deploy multiple applications to multiple environments/clusters with cross-product combinations.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: {{name}}-matrix
  namespace: argocd
spec:
  generators:
    - matrix:
        generators:
          - git:
              repoURL: https://github.com/org/{{name}}
              revision: HEAD
              directories:
                - path: apps/*
          - list:
              elements:
                - environment: dev
                  cluster: in-cluster
                - environment: staging
                  cluster: staging-cluster
                - environment: prod
                  cluster: prod-cluster
  template:
    metadata:
      name: '{{path.basename}}-{{environment}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/{{name}}
        targetRevision: HEAD
        path: '{{path}}/overlays/{{environment}}'
      destination:
        server: '{{cluster}}'
        namespace: '{{path.basename}}-{{environment}}'
      syncPolicy:
        automated:
          prune: true
          selfHeal: true
```

### Merge Generator

Merge parameters from multiple generators.

**Use Case:** Combine cluster information with environment-specific configurations.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: ApplicationSet
metadata:
  name: {{name}}-merge
  namespace: argocd
spec:
  generators:
    - merge:
        mergeKeys:
          - name
        generators:
          - clusters:
              selector:
                matchLabels:
                  argocd.argoproj.io/secret-type: cluster
          - list:
              elements:
                - name: cluster-1
                  environment: prod
                  region: us-east-1
                - name: cluster-2
                  environment: prod
                  region: us-west-2
  template:
    metadata:
      name: '{{name}}-{{name}}'
    spec:
      project: default
      source:
        repoURL: https://github.com/org/{{name}}
        targetRevision: HEAD
        path: k8s/overlays/{{environment}}
      destination:
        server: '{{server}}'
        namespace: {{name}}
```

## Progressive Delivery with Argo Rollouts

### Canary Deployment

Gradually shift traffic to new version with automated rollback.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{name}}
  namespace: {{name}}-{{environment}}
spec:
  replicas: 3
  strategy:
    canary:
      steps:
        - setWeight: 20
        - pause: {duration: 5m}
        - setWeight: 40
        - pause: {duration: 5m}
        - setWeight: 60
        - pause: {duration: 5m}
        - setWeight: 80
        - pause: {duration: 5m}
      analysis:
        templates:
          - templateName: success-rate
        startingStep: 2
        args:
          - name: service-name
            value: {{name}}
      trafficRouting:
        istio:
          virtualService:
            name: {{name}}
            routes:
              - primary
  revisionHistoryLimit: 3
  selector:
    matchLabels:
      app: {{name}}
  template:
    metadata:
      labels:
        app: {{name}}
    spec:
      containers:
        - name: {{name}}
          image: {{image}}
          ports:
            - containerPort: 8080
```

### Blue-Green Deployment

Complete cutover with instant rollback capability.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Rollout
metadata:
  name: {{name}}
  namespace: {{name}}-{{environment}}
spec:
  replicas: 3
  strategy:
    blueGreen:
      activeService: {{name}}-active
      previewService: {{name}}-preview
      autoPromotionEnabled: false
      scaleDownDelaySeconds: 30
      prePromotionAnalysis:
        templates:
          - templateName: smoke-tests
        args:
          - name: service-name
            value: {{name}}-preview
      postPromotionAnalysis:
        templates:
          - templateName: success-rate
        args:
          - name: service-name
            value: {{name}}-active
  selector:
    matchLabels:
      app: {{name}}
  template:
    metadata:
      labels:
        app: {{name}}
    spec:
      containers:
        - name: {{name}}
          image: {{image}}
```

### Analysis Template - Success Rate

Automated metrics-based rollback decisions.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: success-rate
  namespace: {{name}}-{{environment}}
spec:
  args:
    - name: service-name
  metrics:
    - name: success-rate
      interval: 60s
      successCondition: result[0] >= 0.95
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(
              http_requests_total{
                service="{{args.service-name}}",
                status!~"5.."
              }[5m]
            ))
            /
            sum(rate(
              http_requests_total{
                service="{{args.service-name}}"
              }[5m]
            ))
```

### Analysis Template - Latency

Monitor performance during rollout.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: latency-check
  namespace: {{name}}-{{environment}}
spec:
  args:
    - name: service-name
  metrics:
    - name: p95-latency
      interval: 60s
      successCondition: result[0] <= 500
      failureLimit: 3
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            histogram_quantile(0.95,
              sum(rate(
                http_request_duration_seconds_bucket{
                  service="{{args.service-name}}"
                }[5m]
              )) by (le)
            ) * 1000
```

### Analysis Template - Error Rate

Detect error spikes during deployment.

```yaml
apiVersion: argoproj.io/v1alpha1
kind: AnalysisTemplate
metadata:
  name: error-rate
  namespace: {{name}}-{{environment}}
spec:
  args:
    - name: service-name
  metrics:
    - name: error-rate
      interval: 60s
      successCondition: result[0] <= 0.05
      failureLimit: 2
      provider:
        prometheus:
          address: http://prometheus.monitoring:9090
          query: |
            sum(rate(
              http_requests_total{
                service="{{args.service-name}}",
                status=~"5.."
              }[5m]
            ))
            /
            sum(rate(
              http_requests_total{
                service="{{args.service-name}}"
              }[5m]
            ))
```

## Harness GitX Integration

### Harness GitX Sync Configuration

Enable bi-directional sync between Harness and Git.

```yaml
# .harness/gitx-config.yaml
gitx:
  enabled: true
  repository: https://github.com/org/{{name}}
  branch: main
  syncMode: bidirectional
  entities:
    - type: Pipeline
      paths:
        - .harness/pipelines/**/*.yaml
    - type: Service
      paths:
        - .harness/services/**/*.yaml
    - type: Environment
      paths:
        - .harness/environments/**/*.yaml
    - type: Infrastructure
      paths:
        - .harness/infrastructure/**/*.yaml
  webhooks:
    enabled: true
    triggers:
      - branch: main
        events:
          - push
      - branch: develop
        events:
          - push
          - pull_request
```

### Harness GitOps Agent Configuration

Connect ArgoCD with Harness GitOps.

```yaml
# .harness/gitops-agent.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: gitops-agent-config
  namespace: harness-gitops
data:
  AGENT_ID: "{{harness-account-id}}"
  ACCOUNT_IDENTIFIER: "{{harness-account}}"
  PROJECT_IDENTIFIER: "{{harness-project}}"
  ORG_IDENTIFIER: "{{harness-org}}"
  ARGOCD_SERVER: "argocd-server.argocd.svc.cluster.local"
  ARGOCD_NAMESPACE: "argocd"
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: gitops-agent
  namespace: harness-gitops
spec:
  replicas: 1
  selector:
    matchLabels:
      app: gitops-agent
  template:
    metadata:
      labels:
        app: gitops-agent
    spec:
      serviceAccountName: gitops-agent
      containers:
        - name: agent
          image: harness/gitops-agent:latest
          env:
            - name: AGENT_ID
              valueFrom:
                configMapKeyRef:
                  name: gitops-agent-config
                  key: AGENT_ID
            - name: ACCOUNT_IDENTIFIER
              valueFrom:
                configMapKeyRef:
                  name: gitops-agent-config
                  key: ACCOUNT_IDENTIFIER
```

### Harness Pipeline with GitOps Stage

Combine traditional pipelines with GitOps deployments.

```yaml
pipeline:
  name: {{name}}-gitops-pipeline
  identifier: {{name}}_gitops_pipeline
  projectIdentifier: {{project}}
  orgIdentifier: {{org}}
  stages:
    - stage:
        name: Build
        identifier: build
        type: CI
        spec:
          cloneCodebase: true
          execution:
            steps:
              - step:
                  type: BuildAndPushDockerRegistry
                  name: Build and Push
                  identifier: build_push
                  spec:
                    connectorRef: docker_hub
                    repo: org/{{name}}
                    tags:
                      - <+pipeline.sequenceId>

    - stage:
        name: Update GitOps Manifest
        identifier: update_manifest
        type: Custom
        spec:
          execution:
            steps:
              - step:
                  type: ShellScript
                  name: Update Image Tag
                  identifier: update_tag
                  spec:
                    shell: Bash
                    source:
                      type: Inline
                      spec:
                        script: |
                          git clone https://github.com/org/{{name}}-gitops
                          cd {{name}}-gitops

                          # Update kustomization.yaml with new image tag
                          sed -i "s|newTag:.*|newTag: <+pipeline.sequenceId>|g" k8s/overlays/*/kustomization.yaml

                          git add .
                          git commit -m "Update image to <+pipeline.sequenceId>"
                          git push

    - stage:
        name: ArgoCD Sync
        identifier: argocd_sync
        type: GitOps
        spec:
          applications:
            - name: {{name}}-dev
              waitForSync: true
              timeout: 5m
            - name: {{name}}-staging
              waitForSync: true
              timeout: 5m
              requireApproval: true
            - name: {{name}}-prod
              waitForSync: true
              timeout: 10m
              requireApproval: true
```

## Usage Examples

### Basic Multi-Environment ApplicationSet

Generate a simple list-based ApplicationSet for three environments:

```bash
/itg:gitops my-application \
  --generator list \
  --environments "dev,staging,prod"
```

**Generated Output:**
```
✓ Generating GitOps manifests for: my-application
✓ Generator type: list
✓ Environments: dev, staging, prod

Created files:
  ✓ ./gitops/applicationset.yaml
  ✓ ./gitops/dev/kustomization.yaml
  ✓ ./gitops/staging/kustomization.yaml
  ✓ ./gitops/prod/kustomization.yaml
  ✓ ./gitops/README.md

Next steps:
  1. Review generated ApplicationSet: ./gitops/applicationset.yaml
  2. Customize environment overlays in ./gitops/{env}/
  3. Apply to cluster: kubectl apply -f ./gitops/applicationset.yaml
  4. Monitor sync: argocd app list
```

### Git Directory-Based Discovery

Automatically detect environments from Git repository structure:

```bash
/itg:gitops my-service \
  --generator git \
  --repo-url https://github.com/org/my-service
```

**Generated Output:**
```
✓ Analyzing repository structure...
✓ Detected directories: k8s/overlays/dev, k8s/overlays/staging, k8s/overlays/prod
✓ Generated ApplicationSet with git directory generator

The ApplicationSet will automatically:
  - Discover new environments when directories are added
  - Create Applications for each overlay directory
  - Sync changes when directory contents are modified
```

### Multi-Cluster Deployment

Deploy to all clusters matching specific labels:

```bash
/itg:gitops platform-service \
  --generator cluster \
  --target-clusters "prod-us-east-1,prod-us-west-2,prod-eu-west-1"
```

**Generated Output:**
```
✓ Generating cluster-based ApplicationSet
✓ Target clusters: 3

Created:
  ✓ ./gitops/applicationset-cluster.yaml
  ✓ ./gitops/cluster-config.yaml

The ApplicationSet will deploy to all clusters with labels:
  environment: production

Add new clusters by registering them with ArgoCD and matching labels.
```

### Canary Deployment with Analysis

Generate progressive delivery configuration with automated rollback:

```bash
/itg:gitops api-service \
  --generator list \
  --environments "staging,prod" \
  --progressive-delivery canary \
  --analysis-template
```

**Generated Output:**
```
✓ Generating ApplicationSet with canary deployment
✓ Including Argo Rollouts configuration
✓ Creating analysis templates

Created files:
  ✓ ./gitops/applicationset.yaml
  ✓ ./gitops/rollout-canary.yaml
  ✓ ./gitops/analysis-templates/success-rate.yaml
  ✓ ./gitops/analysis-templates/latency-check.yaml
  ✓ ./gitops/analysis-templates/error-rate.yaml
  ✓ ./gitops/services/active-service.yaml
  ✓ ./gitops/services/canary-service.yaml

Canary strategy:
  - 20% traffic → 5min pause → analyze
  - 40% traffic → 5min pause → analyze
  - 60% traffic → 5min pause → analyze
  - 80% traffic → 5min pause → analyze
  - 100% traffic

Automatic rollback on:
  - Success rate < 95%
  - p95 latency > 500ms
  - Error rate > 5%
```

### Blue-Green with Harness GitX

Full Harness integration with blue-green deployment:

```bash
/itg:gitops web-app \
  --preset harness-integration \
  --progressive-delivery blue-green
```

**Generated Output:**
```
✓ Using preset: harness-integration
✓ Progressive delivery: blue-green
✓ Harness GitX: enabled
✓ Analysis templates: enabled

Created files:
  ✓ ./gitops/applicationset.yaml
  ✓ ./gitops/rollout-bluegreen.yaml
  ✓ ./gitops/services/active-service.yaml
  ✓ ./gitops/services/preview-service.yaml
  ✓ ./gitops/analysis-templates/smoke-tests.yaml
  ✓ ./gitops/analysis-templates/success-rate.yaml
  ✓ .harness/gitx-config.yaml
  ✓ .harness/gitops-agent.yaml
  ✓ .harness/pipelines/gitops-pipeline.yaml

Harness GitX Integration:
  ✓ Bi-directional sync enabled
  ✓ GitOps agent configuration created
  ✓ Unified pipeline with GitOps stage

Next steps:
  1. Install Harness GitOps agent: kubectl apply -f .harness/gitops-agent.yaml
  2. Configure GitX in Harness UI
  3. Apply ApplicationSet: kubectl apply -f ./gitops/applicationset.yaml
  4. Trigger pipeline from Harness
```

### Matrix Generator for Multiple Apps

Deploy multiple microservices to multiple environments:

```bash
/itg:gitops microservices-platform \
  --generator matrix \
  --environments "dev,staging,prod" \
  --repo-url https://github.com/org/microservices
```

**Generated Output:**
```
✓ Generating matrix ApplicationSet
✓ Combining git directory discovery with environment list

Matrix configuration:
  Apps discovered: auth-service, user-service, payment-service
  Environments: dev, staging, prod
  Total Applications: 9 (3 apps × 3 environments)

The ApplicationSet will create:
  - auth-service-dev
  - auth-service-staging
  - auth-service-prod
  - user-service-dev
  - user-service-staging
  - user-service-prod
  - payment-service-dev
  - payment-service-staging
  - payment-service-prod
```

### Custom Output Directory

Organize GitOps manifests in a specific location:

```bash
/itg:gitops backend-api \
  --generator list \
  --environments "qa,uat,prod" \
  --output ./infrastructure/gitops \
  --harness-gitx
```

## Generated File Structure

### Basic ApplicationSet

```
gitops/
├── applicationset.yaml              # Main ApplicationSet definition
├── README.md                        # Deployment instructions
└── overlays/
    ├── dev/
    │   ├── kustomization.yaml
    │   └── patches.yaml
    ├── staging/
    │   ├── kustomization.yaml
    │   └── patches.yaml
    └── prod/
        ├── kustomization.yaml
        └── patches.yaml
```

### With Progressive Delivery

```
gitops/
├── applicationset.yaml
├── rollout-canary.yaml             # or rollout-bluegreen.yaml
├── services/
│   ├── active-service.yaml
│   ├── canary-service.yaml         # or preview-service.yaml
│   └── stable-service.yaml
├── analysis-templates/
│   ├── success-rate.yaml
│   ├── latency-check.yaml
│   ├── error-rate.yaml
│   └── smoke-tests.yaml
└── overlays/
    └── [environments...]
```

### With Harness GitX Integration

```
gitops/
├── applicationset.yaml
├── [progressive delivery files...]
└── .harness/
    ├── gitx-config.yaml
    ├── gitops-agent.yaml
    └── pipelines/
        ├── gitops-pipeline.yaml
        ├── build-and-sync.yaml
        └── rollback-pipeline.yaml
```

## Integration with Other Commands

### Complete GitOps Workflow

```bash
# 1. Generate Kubernetes manifests
/itg:k8s my-app --output ./k8s

# 2. Generate ApplicationSet
/itg:gitops my-app \
  --generator list \
  --environments "dev,staging,prod" \
  --progressive-delivery canary \
  --analysis-template

# 3. Generate Harness pipeline
/itg:harness my-app-pipeline \
  --type ci-cd \
  --include-triggers

# 4. Validate generated manifests
kubectl apply --dry-run=client -f ./gitops/
```

### CI/CD Integration

```bash
# Generate GitOps manifests
/itg:gitops api-service --harness-gitx

# Generate CI pipeline that updates GitOps repo
/itg:harness api-build-pipeline --type ci

# The pipeline will:
# 1. Build and push image
# 2. Update image tag in GitOps repo
# 3. Trigger ArgoCD sync via Harness
# 4. Monitor rollout progress
# 5. Execute analysis templates
# 6. Auto-rollback on failure
```

## ArgoCD Application Health

The generated ApplicationSets create Applications with health checks:

```yaml
# Application health is determined by:
status:
  health:
    status: Healthy  # Progressing, Degraded, Suspended, Missing, Unknown
  sync:
    status: Synced   # OutOfSync, Unknown
  operationState:
    phase: Succeeded # Running, Failed
```

## Sync Policies

### Automated Sync

Applications automatically sync when changes are detected:

```yaml
syncPolicy:
  automated:
    prune: true      # Delete resources not in Git
    selfHeal: true   # Revert manual changes
    allowEmpty: false
  syncOptions:
    - CreateNamespace=true
    - PruneLast=true
    - RespectIgnoreDifferences=true
```

### Manual Sync

Require manual approval for syncing:

```yaml
syncPolicy:
  syncOptions:
    - CreateNamespace=true
  retry:
    limit: 5
    backoff:
      duration: 5s
      factor: 2
      maxDuration: 3m
```

## Progressive Delivery Patterns

### Canary with Traffic Splitting

```yaml
strategy:
  canary:
    trafficRouting:
      istio:
        virtualService:
          name: my-app
          routes:
            - primary
    steps:
      - setWeight: 10
      - pause: {duration: 2m}
      - setWeight: 25
      - pause: {duration: 5m}
      - setWeight: 50
      - pause: {duration: 10m}
```

### Blue-Green with Manual Promotion

```yaml
strategy:
  blueGreen:
    activeService: my-app-active
    previewService: my-app-preview
    autoPromotionEnabled: false
    previewReplicaCount: 1
    scaleDownDelaySeconds: 300
```

## Troubleshooting

### ApplicationSet Not Creating Applications

**Problem:** ApplicationSet exists but no Applications are created

**Solution:**
1. Check ApplicationSet controller logs: `kubectl logs -n argocd deploy/argocd-applicationset-controller`
2. Verify generator parameters match repository structure
3. Confirm ArgoCD has access to Git repository
4. Check for validation errors: `kubectl describe applicationset <name>`

### Sync Failures

**Problem:** Applications stuck in OutOfSync state

**Solution:**
1. Check Application health: `argocd app get <app-name>`
2. Review sync status: `argocd app sync <app-name> --dry-run`
3. Check resource conflicts: `kubectl get events -n <namespace>`
4. Verify RBAC permissions for ArgoCD service account

### Rollout Not Progressing

**Problem:** Canary/Blue-Green deployment stuck

**Solution:**
1. Check Argo Rollouts controller: `kubectl logs -n argo-rollouts deploy/argo-rollouts`
2. Verify analysis template queries return valid results
3. Check service mesh configuration (Istio/SMI)
4. Review rollout status: `kubectl argo rollouts get rollout <name> -w`

### Harness GitX Sync Issues

**Problem:** Changes not syncing between Harness and Git

**Solution:**
1. Verify GitX agent is running: `kubectl get pods -n harness-gitops`
2. Check agent logs: `kubectl logs -n harness-gitops deploy/gitops-agent`
3. Confirm webhook configuration in GitHub/GitLab
4. Validate Harness API token and permissions
5. Review sync configuration in Harness UI

## Best Practices

### Repository Structure

**Recommended layout for GitOps:**
```
my-app/
├── base/                    # Base Kubernetes manifests
│   ├── deployment.yaml
│   ├── service.yaml
│   └── kustomization.yaml
├── overlays/                # Environment-specific overlays
│   ├── dev/
│   ├── staging/
│   └── prod/
└── gitops/
    └── applicationset.yaml  # ApplicationSet definition
```

### Namespace Conventions

- Use predictable namespace naming: `{app}-{environment}`
- Example: `my-app-dev`, `my-app-staging`, `my-app-prod`
- Include namespace in Application metadata for clarity

### Secret Management

**Use sealed-secrets or external secrets operator:**
```yaml
apiVersion: external-secrets.io/v1beta1
kind: ExternalSecret
metadata:
  name: my-app-secrets
spec:
  secretStoreRef:
    name: aws-secrets-manager
    kind: SecretStore
  target:
    name: my-app-secrets
  data:
    - secretKey: db-password
      remoteRef:
        key: prod/my-app/db-password
```

### Analysis Templates

- Start with conservative thresholds and adjust based on metrics
- Use multiple metrics for comprehensive health checks
- Set appropriate `failureLimit` to avoid false positives
- Test analysis templates in staging before production

### Sync Windows

Control when deployments can occur:

```yaml
syncPolicy:
  syncOptions:
    - CreateNamespace=true
  syncWindows:
    - kind: allow
      schedule: "0 9-17 * * 1-5"  # Business hours, weekdays only
      duration: 8h
      applications:
        - my-app-prod
```

## Performance Considerations

### ApplicationSet Scale

- **Small deployments:** 1-10 Applications - Any generator works well
- **Medium deployments:** 10-100 Applications - Prefer list or git generators
- **Large deployments:** 100+ Applications - Use cluster generator with careful label design

### Sync Performance

- Enable parallel sync for independent applications
- Use selective sync for large manifests
- Configure resource tracking for faster sync detection
- Optimize Kustomize overlays to reduce duplication

## Security

### RBAC for ApplicationSets

```yaml
apiVersion: rbac.authorization.k8s.io/v1
kind: Role
metadata:
  name: applicationset-reader
  namespace: argocd
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["applicationsets"]
    verbs: ["get", "list", "watch"]
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  name: applicationset-manager
rules:
  - apiGroups: ["argoproj.io"]
    resources: ["applicationsets"]
    verbs: ["*"]
  - apiGroups: ["argoproj.io"]
    resources: ["applications"]
    verbs: ["*"]
```

### Progressive Delivery Security

- Require analysis templates for production deployments
- Use preview services in isolated namespaces
- Implement automated rollback on security metric violations
- Gate production deployments with approval stages

## Related Commands

- `/itg:k8s` - Generate Kubernetes manifests for GitOps repo
- `/itg:harness` - Generate Harness pipelines with GitOps integration
- `/itg:terraform` - Generate infrastructure for Kubernetes clusters
- `/itg:analyze` - Analyze existing GitOps configurations
- `/itg:validate` - Validate ApplicationSet and Rollout definitions

## Resources

### ArgoCD Documentation

- ApplicationSets: https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/
- Generators: https://argo-cd.readthedocs.io/en/stable/operator-manual/applicationset/Generators/

### Argo Rollouts Documentation

- Progressive Delivery: https://argoproj.github.io/argo-rollouts/
- Analysis Templates: https://argoproj.github.io/argo-rollouts/features/analysis/

### Harness Documentation

- GitOps: https://developer.harness.io/docs/continuous-delivery/gitops/
- GitX: https://developer.harness.io/docs/platform/git-experience/

## See Also

- **Kubernetes Generator:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/k8s.md`
- **Harness Pipeline Generator:** `.claude/tools/plugin-cli/infrastructure-template-generator/commands/harness.md`
- **GitOps Agent:** `.claude/tools/plugin-cli/infrastructure-template-generator/agents/gitops-generator.md`
