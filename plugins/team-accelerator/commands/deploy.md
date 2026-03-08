---
name: team-accelerator:deploy
intent: Deploy applications to multi-cloud environments (Azure, AWS, GCP, Kubernetes) with support for Helm charts, GitHub Actions, and Harness pipelines
tags:
  - team-accelerator
  - command
  - deploy
inputs: []
risk: medium
cost: medium
description: Deploy applications to multi-cloud environments (Azure, AWS, GCP, Kubernetes) with support for Helm charts, GitHub Actions, and Harness pipelines
---

# Deploy Command

Deploy your application to multi-cloud environments with enterprise-grade deployment strategies.

## Usage

```bash
/deploy <target> <environment> [strategy]
```

## Examples

```bash
# Deploy to Azure Kubernetes Service in production
/deploy azure prod

# Deploy to AWS EKS with blue-green strategy
/deploy aws staging blue-green

# Deploy to all configured clouds
/deploy all dev

# Canary deployment to GCP GKE
/deploy gcp prod canary
```

## Execution Flow

When this command is invoked, perform the following steps:

### 1. Pre-Deployment Validation

```bash
# Validate deployment configuration exists
ls -la deployment/

# Check for required files based on target
# Azure: deployment/azure/ or deployment/helm/
# AWS: deployment/aws/ or deployment/helm/
# GCP: deployment/gcp/ or deployment/helm/
# K8s: deployment/k8s/ or deployment/helm/
```

Verify:
- Docker images are built and tagged
- Kubernetes manifests or Helm charts exist
- Environment-specific configurations are available
- Required secrets are configured

### 2. Build Container Images (if needed)

```bash
# Build with Docker
docker build -t ${DOCKER_REGISTRY}/${PROJECT_NAME}:${VERSION} .

# Or use cloud-native builds
# Azure
az acr build --registry ${ACR_NAME} --image ${PROJECT_NAME}:${VERSION} .

# AWS
aws ecr get-login-password | docker login --username AWS --password-stdin ${ECR_REGISTRY}
docker push ${ECR_REGISTRY}/${PROJECT_NAME}:${VERSION}

# GCP
gcloud builds submit --tag gcr.io/${PROJECT_ID}/${PROJECT_NAME}:${VERSION}
```

### 3. Deploy Based on Target

#### Azure (AKS)

```bash
# Get AKS credentials
az aks get-credentials --resource-group ${RESOURCE_GROUP} --name ${CLUSTER_NAME}

# Deploy with Helm
helm upgrade --install ${RELEASE_NAME} ./deployment/helm/${PROJECT_NAME} \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --values ./deployment/helm/${PROJECT_NAME}/values-${environment}.yaml \
  --set image.tag=${VERSION} \
  --wait \
  --timeout 10m
```

#### AWS (EKS)

```bash
# Update kubeconfig
aws eks update-kubeconfig --region ${AWS_REGION} --name ${CLUSTER_NAME}

# Deploy with Helm
helm upgrade --install ${RELEASE_NAME} ./deployment/helm/${PROJECT_NAME} \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --values ./deployment/helm/${PROJECT_NAME}/values-${environment}.yaml \
  --set image.repository=${ECR_REGISTRY}/${PROJECT_NAME} \
  --set image.tag=${VERSION} \
  --wait
```

#### GCP (GKE)

```bash
# Get GKE credentials
gcloud container clusters get-credentials ${CLUSTER_NAME} --zone ${ZONE} --project ${PROJECT_ID}

# Deploy with Helm
helm upgrade --install ${RELEASE_NAME} ./deployment/helm/${PROJECT_NAME} \
  --namespace ${NAMESPACE} \
  --create-namespace \
  --values ./deployment/helm/${PROJECT_NAME}/values-${environment}.yaml \
  --set image.repository=gcr.io/${PROJECT_ID}/${PROJECT_NAME} \
  --set image.tag=${VERSION} \
  --wait
```

#### Generic Kubernetes

```bash
# Apply manifests directly
kubectl apply -f deployment/k8s/${environment}/ --namespace ${NAMESPACE}

# Or use Helm
helm upgrade --install ${RELEASE_NAME} ./deployment/helm/${PROJECT_NAME} \
  --namespace ${NAMESPACE} \
  --values ./deployment/helm/${PROJECT_NAME}/values-${environment}.yaml \
  --wait
```

### 4. Deployment Strategy Implementation

#### Rolling Update (Default)
```yaml
strategy:
  type: RollingUpdate
  rollingUpdate:
    maxSurge: 1
    maxUnavailable: 0
```

#### Blue-Green
```bash
# Deploy to green environment
helm upgrade --install ${RELEASE_NAME}-green ./deployment/helm/${PROJECT_NAME} \
  --set deployment.color=green \
  --wait

# Run smoke tests
kubectl run smoke-test --image=curlimages/curl --rm -it -- \
  curl -s http://${SERVICE_NAME}-green/health

# Switch traffic
kubectl patch service ${SERVICE_NAME} -p '{"spec":{"selector":{"color":"green"}}}'
```

#### Canary
```bash
# Deploy canary with 10% traffic
helm upgrade --install ${RELEASE_NAME}-canary ./deployment/helm/${PROJECT_NAME} \
  --set replicaCount=1 \
  --set canary.enabled=true \
  --set canary.weight=10 \
  --wait

# Monitor metrics for 15 minutes
# If healthy, increase traffic gradually
```

### 5. Post-Deployment Verification

```bash
# Check deployment status
kubectl rollout status deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}

# Verify pods are running
kubectl get pods -n ${NAMESPACE} -l app=${PROJECT_NAME}

# Check service endpoints
kubectl get endpoints -n ${NAMESPACE} ${SERVICE_NAME}

# Run health checks
curl -s https://${APP_URL}/health | jq .

# Check recent logs
kubectl logs -n ${NAMESPACE} -l app=${PROJECT_NAME} --tail=50
```

### 6. Rollback (if needed)

```bash
# Helm rollback
helm rollback ${RELEASE_NAME} -n ${NAMESPACE}

# Kubernetes rollback
kubectl rollout undo deployment/${DEPLOYMENT_NAME} -n ${NAMESPACE}
```

## Integration with CI/CD

### GitHub Actions Trigger

```yaml
# .github/workflows/deploy.yml
on:
  workflow_dispatch:
    inputs:
      target:
        description: 'Deployment target'
        required: true
        type: choice
        options: [azure, aws, gcp, k8s]
      environment:
        description: 'Target environment'
        required: true
        type: choice
        options: [dev, staging, prod]
```

### Harness Pipeline Trigger

```bash
# Trigger Harness pipeline
harness pipeline execute \
  --org ${HARNESS_ORG} \
  --project ${HARNESS_PROJECT} \
  --pipeline deploy-${target} \
  --inputSet environment=${environment}
```

## Environment Variables Required

| Variable | Description | Example |
|----------|-------------|---------|
| `DOCKER_REGISTRY` | Container registry URL | `ghcr.io/org` |
| `PROJECT_NAME` | Application name | `my-api` |
| `VERSION` | Image version/tag | `1.0.0` or `${GITHUB_SHA}` |
| `NAMESPACE` | Kubernetes namespace | `production` |
| `CLUSTER_NAME` | K8s cluster name | `prod-cluster` |

## Output

After successful deployment, display:

```
✅ Deployment Complete

Target: ${target}
Environment: ${environment}
Strategy: ${strategy}
Version: ${VERSION}
Namespace: ${NAMESPACE}

Pods: 3/3 Running
Service: https://${APP_URL}
Health: ✅ Healthy

Deployment time: 2m 34s
```
