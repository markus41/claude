#!/bin/bash
# Audit script: Compare local build log with K8s running images
# Usage: ./docker-image-audit.sh [namespace] [context]

NAMESPACE="${1:-default}"
CONTEXT="${2:-}"
BUILD_LOG="${CLAUDE_PROJECT_DIR:-.}/.claude/logs/docker-builds.jsonl"

echo "=============================================="
echo "  Docker/K8s Image Audit Report"
echo "  Namespace: $NAMESPACE"
echo "  Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=============================================="
echo ""

# Section 1: Currently running images in K8s
echo "=== Running Images in K8s ==="
if command -v kubectl &>/dev/null; then
  KUBECTL_CMD="kubectl"
  [ -n "$CONTEXT" ] && KUBECTL_CMD="kubectl --context $CONTEXT"

  echo "Pods and their images:"
  $KUBECTL_CMD get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{range .spec.containers[*]}{.image}{"\t"}{.imagePullPolicy}{"\n"}{end}{end}' 2>/dev/null | column -t

  echo ""
  echo "Unique images:"
  $KUBECTL_CMD get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.image}{"\n"}{end}{end}' 2>/dev/null | sort -u

  echo ""
  echo "=== Image Pull Policies ==="
  $KUBECTL_CMD get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.image}{"\t"}{.imagePullPolicy}{"\n"}{end}{end}' 2>/dev/null | sort -u

  # Check for IfNotPresent on :latest (common caching bug)
  BAD_POLICY=$($KUBECTL_CMD get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}{range .spec.containers[*]}{.image}:{.imagePullPolicy}{"\n"}{end}{end}' 2>/dev/null | grep ':latest:IfNotPresent')
  if [ -n "$BAD_POLICY" ]; then
    echo ""
    echo "*** CACHING RISK DETECTED ***"
    echo "These images use :latest with IfNotPresent - they will NOT pull updated images:"
    echo "$BAD_POLICY"
    echo "Fix: Use 'Always' pull policy or use specific image tags"
  fi
else
  echo "kubectl not available - skipping K8s audit"
fi

echo ""

# Section 2: Recent builds from our tracker
echo "=== Recent Docker Builds (last 20) ==="
if [ -f "$BUILD_LOG" ]; then
  tail -20 "$BUILD_LOG" | jq -r '[.timestamp, .action, .image, .no_cache // "n/a"] | @tsv' 2>/dev/null | column -t
else
  echo "No build log found at $BUILD_LOG"
fi

echo ""

# Section 3: Helm releases
echo "=== Helm Releases ==="
if command -v helm &>/dev/null; then
  helm list -n "$NAMESPACE" 2>/dev/null | head -20
else
  echo "helm not available - skipping"
fi

echo ""

# Section 4: Volumes
echo "=== Persistent Volumes ==="
if command -v kubectl &>/dev/null; then
  $KUBECTL_CMD get pv 2>/dev/null | head -20
  echo ""
  echo "Persistent Volume Claims in $NAMESPACE:"
  $KUBECTL_CMD get pvc -n "$NAMESPACE" 2>/dev/null | head -20
else
  echo "kubectl not available - skipping"
fi

echo ""

# Section 5: Cross-reference builds vs deploys
echo "=== Build vs Deploy Cross-Reference ==="
if [ -f "$BUILD_LOG" ]; then
  LAST_BUILD=$(grep '"action":"build"\|"action":"acr_build"' "$BUILD_LOG" 2>/dev/null | tail -1)
  LAST_DEPLOY=$(grep '"action":"helm_deploy"' "$BUILD_LOG" 2>/dev/null | tail -1)

  if [ -n "$LAST_BUILD" ]; then
    BUILD_TIME=$(echo "$LAST_BUILD" | jq -r '.timestamp')
    BUILD_IMAGE=$(echo "$LAST_BUILD" | jq -r '.image')
    echo "Last build: $BUILD_IMAGE at $BUILD_TIME"
  fi

  if [ -n "$LAST_DEPLOY" ]; then
    DEPLOY_TIME=$(echo "$LAST_DEPLOY" | jq -r '.timestamp')
    DEPLOY_RELEASE=$(echo "$LAST_DEPLOY" | jq -r '.release')
    echo "Last deploy: $DEPLOY_RELEASE at $DEPLOY_TIME"

    if [ -n "$BUILD_TIME" ] && [ -n "$DEPLOY_TIME" ]; then
      # Simple string comparison works for ISO timestamps
      if [[ "$DEPLOY_TIME" < "$BUILD_TIME" ]]; then
        echo ""
        echo "*** STALE DEPLOY DETECTED ***"
        echo "Last build ($BUILD_TIME) is NEWER than last deploy ($DEPLOY_TIME)"
        echo "The running deployment may be using an older image!"
      fi
    fi
  fi
else
  echo "No build log available for cross-reference"
fi

echo ""
echo "=== Recommendations ==="
echo "1. Always use specific image tags (git SHA or semver), never :latest"
echo "2. Set imagePullPolicy: Always for images that change frequently"
echo "3. Use --no-cache on docker build when you suspect layer caching issues"
echo "4. Add --atomic --wait to helm upgrade for safer deploys"
echo "5. After building, always verify the new image is in your registry before deploying"
