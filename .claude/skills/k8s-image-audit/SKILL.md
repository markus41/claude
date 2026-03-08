---
name: k8s-image-audit
description: Audit K8s deployments for stale images, wrong pull policies, and volume issues. Use when debugging Helm deploy or image caching problems.
disable-model-invocation: true
---

# K8s Image & Deployment Audit

Audit the K8s cluster for image and deployment issues: $ARGUMENTS

## Checks to Perform

### 1. Image Freshness
```bash
# List all running images with their pull policies
kubectl get pods -n <namespace> -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.image}{"\t"}{.imagePullPolicy}{"\n"}{end}{end}'

# Check image creation dates
for pod in $(kubectl get pods -n <namespace> -o name); do
  IMAGE=$(kubectl get $pod -n <namespace> -o jsonpath='{.spec.containers[0].image}')
  echo "$pod -> $IMAGE"
done
```

### 2. Caching Risk Detection
```bash
# Find pods using :latest with IfNotPresent (BAD)
kubectl get pods -n <namespace> -o json | jq -r '.items[] | .spec.containers[] | select(.imagePullPolicy == "IfNotPresent" and (.image | endswith(":latest"))) | "\(.name): \(.image) - CACHING RISK"'

# Find pods without explicit imagePullPolicy
kubectl get pods -n <namespace> -o json | jq -r '.items[] | .spec.containers[] | select(.imagePullPolicy == null) | "\(.name): \(.image) - NO PULL POLICY SET"'
```

### 3. Helm Release Verification
```bash
# List releases with their chart versions and app versions
helm list -n <namespace> -o json | jq -r '.[] | "\(.name)\t\(.chart)\t\(.app_version)\t\(.status)\t\(.updated)"'

# Get the actual image from a helm release
helm get values <release> -n <namespace> -o json | jq '.image'
```

### 4. Volume Health
```bash
# Check PV/PVC status
kubectl get pv,pvc -n <namespace>

# Find orphaned PVCs
kubectl get pvc -n <namespace> -o json | jq -r '.items[] | select(.status.phase != "Bound") | .metadata.name'
```

### 5. Build vs Deploy Cross-Reference
- Check `.claude/logs/docker-builds.jsonl` for the last build timestamp
- Compare with the running image's creation timestamp
- Flag if the deploy is older than the latest build

## Output
- List of all running images with their tags and pull policies
- Flagged caching risks
- Stale image detections
- Volume health status
- Specific remediation steps for each issue found
