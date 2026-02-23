#!/bin/bash
# K8s Volume and Storage Tracker
# Usage: ./k8s-volume-tracker.sh [namespace] [context]

NAMESPACE="${1:-default}"
CONTEXT="${2:-}"
KUBECTL="kubectl"
[ -n "$CONTEXT" ] && KUBECTL="kubectl --context $CONTEXT"

echo "=============================================="
echo "  K8s Volume & Storage Report"
echo "  Namespace: $NAMESPACE"
echo "  Generated: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
echo "=============================================="
echo ""

# PV overview
echo "=== Persistent Volumes (Cluster-wide) ==="
$KUBECTL get pv -o custom-columns='NAME:.metadata.name,CAPACITY:.spec.capacity.storage,ACCESS:.spec.accessModes[0],RECLAIM:.spec.persistentVolumeReclaimPolicy,STATUS:.status.phase,CLAIM:.spec.claimRef.name,STORAGECLASS:.spec.storageClassName' 2>/dev/null
echo ""

# PVC overview
echo "=== Persistent Volume Claims (ns: $NAMESPACE) ==="
$KUBECTL get pvc -n "$NAMESPACE" -o custom-columns='NAME:.metadata.name,STATUS:.status.phase,VOLUME:.spec.volumeName,CAPACITY:.status.capacity.storage,STORAGECLASS:.spec.storageClassName,AGE:.metadata.creationTimestamp' 2>/dev/null
echo ""

# Pods with volumes
echo "=== Pods with Mounted Volumes ==="
$KUBECTL get pods -n "$NAMESPACE" -o jsonpath='{range .items[*]}Pod: {.metadata.name}{"\n"}{range .spec.volumes[*]}  Volume: {.name} -> {.persistentVolumeClaim.claimName}{.configMap.name}{.secret.secretName}{.emptyDir}{"\n"}{end}{"\n"}{end}' 2>/dev/null
echo ""

# Storage classes
echo "=== Storage Classes ==="
$KUBECTL get storageclass -o custom-columns='NAME:.metadata.name,PROVISIONER:.provisioner,RECLAIM:.reclaimPolicy,BINDING:.volumeBindingMode,DEFAULT:.metadata.annotations.storageclass\.kubernetes\.io/is-default-class' 2>/dev/null
echo ""

# Volume usage (if metrics available)
echo "=== Volume Capacity Warnings ==="
$KUBECTL top pod -n "$NAMESPACE" 2>/dev/null || echo "Metrics server not available for capacity data"
echo ""

# Dangling PVCs (bound to deleted pods)
echo "=== Potential Orphaned PVCs ==="
PVCS=$($KUBECTL get pvc -n "$NAMESPACE" -o jsonpath='{range .items[*]}{.metadata.name}{"\n"}{end}' 2>/dev/null)
for PVC in $PVCS; do
  USED_BY=$($KUBECTL get pods -n "$NAMESPACE" -o jsonpath="{range .items[*]}{range .spec.volumes[*]}{.persistentVolumeClaim.claimName}{end}{end}" 2>/dev/null | grep -c "$PVC")
  if [ "$USED_BY" -eq 0 ]; then
    echo "  ORPHANED: $PVC (not mounted by any pod)"
  fi
done
echo ""
echo "Done."
