---
paths:
  - "**/Dockerfile*"
  - "**/docker-compose*"
  - "**/*.yaml"
  - "**/*.yml"
  - "**/helm/**"
  - "**/charts/**"
  - "**/k8s/**"
  - "**/kubernetes/**"
---

# Docker, Kubernetes & Helm Rules

## Docker Build Rules
- NEVER build with only `:latest` tag. Always use a specific tag: `<git-sha>-<timestamp>` or semver
- Use `--no-cache --pull` for production builds to prevent stale layers
- Always push after building. Verify the image exists in the registry before deploying
- Use multi-stage builds to minimize image size
- Pin base image versions (e.g., `node:20.11-alpine`, not `node:latest`)
- Run as non-root user in production images
- Include HEALTHCHECK in Dockerfiles

## Kubernetes Rules
- ALWAYS set `imagePullPolicy: Always` for images with mutable tags
- NEVER use `imagePullPolicy: IfNotPresent` with `:latest` or branch tags
- Set resource requests AND limits for all containers
- Use readiness and liveness probes
- Use `podDisruptionBudget` for critical services
- Label all resources consistently: `app`, `version`, `component`, `managed-by`

## Helm Deploy Rules
- ALWAYS use `--set image.tag=<specific-tag>` to override chart defaults
- ALWAYS use `--atomic` for automatic rollback on failure
- ALWAYS use `--wait` to confirm healthy pods
- Use `helm diff` before `helm upgrade` to review changes
- Never deploy without verifying the image exists in the registry first
- Keep `values.yaml` in version control with `image.pullPolicy: Always`

## Common Caching Problems and Fixes
1. **K8s uses old image after push**: The image tag is the same but content changed. K8s cached the old image locally.
   - Fix: Use unique tags (git SHA) instead of reusing tags
   - Fix: Set `imagePullPolicy: Always`

2. **Helm deploy succeeds but pods show old code**: Helm updated the release but K8s didn't pull the new image.
   - Fix: Change the image tag to force a new pull
   - Fix: Add `--set image.pullPolicy=Always` to helm command

3. **Docker build uses cached layers**: Old layers are served from Docker's build cache.
   - Fix: `docker build --no-cache --pull` to force fresh build
   - Fix: `az acr build --no-cache` for ACR builds

4. **Image not found after deploy**: Image was built locally but not pushed, or pushed to wrong registry.
   - Fix: Always verify image in registry before deploying
   - Fix: Use CI/CD pipeline that builds, pushes, then deploys atomically

## Volume Rules
- Always use `StorageClass` with appropriate reclaim policy
- Set `Retain` reclaim policy for production data volumes
- Monitor PVC usage and set alerts for capacity thresholds
- Clean up orphaned PVCs that are no longer mounted by any pod
- Use `volumeClaimTemplates` in StatefulSets for consistent volume management
