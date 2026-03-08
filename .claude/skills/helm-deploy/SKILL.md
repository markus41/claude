---
name: helm-deploy
description: Safe Helm deployment with image verification, cache busting, and rollback safety. Prevents deploying stale images.
disable-model-invocation: true
---

# Safe Helm Deploy

Deploy via Helm with image verification: $ARGUMENTS

## Pre-Deploy Checklist
1. **Verify the image exists in the registry**
   ```bash
   # ACR
   az acr repository show-tags --name <registry> --repository <image> --orderby time_desc --top 5
   # Docker Hub
   docker manifest inspect <registry>/<image>:<tag>
   ```

2. **Check what's currently running**
   ```bash
   helm list -n <namespace>
   kubectl get pods -n <namespace> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.image}{"\n"}{end}{end}'
   ```

3. **Diff the changes before applying**
   ```bash
   helm diff upgrade <release> <chart> -n <namespace> \
     --set image.tag=<new-tag> \
     --set image.pullPolicy=Always \
     -f values.yaml
   ```

## Deploy Command Template
```bash
helm upgrade --install <release> <chart> \
  --namespace <namespace> \
  --set image.repository=<registry>/<image> \
  --set image.tag=<specific-tag> \
  --set image.pullPolicy=Always \
  --atomic \
  --wait \
  --timeout 5m \
  -f values.yaml
```

## Post-Deploy Verification
```bash
# Verify new pods are running
kubectl rollout status deployment/<deployment> -n <namespace>

# Verify the correct image is running
kubectl get pods -n <namespace> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.image}{"\n"}{end}{end}'

# Check pod logs for startup errors
kubectl logs -l app=<app> -n <namespace> --tail=50
```

## Rollback (if needed)
```bash
helm rollback <release> -n <namespace>
# Or to a specific revision:
helm history <release> -n <namespace>
helm rollback <release> <revision> -n <namespace>
```

## Critical Rules
- ALWAYS use `--set image.tag=<specific>` with a unique tag (git SHA, semver)
- ALWAYS use `--set image.pullPolicy=Always` to force fresh pulls
- ALWAYS use `--atomic` for automatic rollback on failure
- ALWAYS use `--wait` to confirm pods are healthy
- NEVER deploy with `:latest` as the only tag
- ALWAYS verify the image exists in registry BEFORE deploying
