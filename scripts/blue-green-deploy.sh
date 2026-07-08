#!/bin/bash
set -euo pipefail

# Blue-Green Deployment Script for Azeebo+
# Usage: ./blue-green-deploy.sh <namespace> <service> <image> [timeout_seconds]
#
# Arguments:
#   namespace       - Kubernetes namespace (e.g. azeebo, azeebo-staging)
#   service         - Service name (e.g. api-gateway, auth-service)
#   image           - Full container image reference (e.g. ghcr.io/org/image:tag)
#   timeout_seconds - Max seconds to wait for rollout (default: 300)

NAMESPACE="${1:?Usage: $0 <namespace> <service> <image> [timeout_seconds]}"
SERVICE="${2:?Usage: $0 <namespace> <service> <image> [timeout_seconds]}"
IMAGE="${3:?Usage: $0 <namespace> <service> <image> [timeout_seconds]}"
TIMEOUT="${4:-300}"

HEALTH_ENDPOINT="/health"
HEALTH_RETRIES=30
HEALTH_INTERVAL=10

# Service-to-port mapping for health checks
get_service_port() {
  case "$1" in
    auth-service) echo 3000 ;;
    user-service) echo 3001 ;;
    wallet-service) echo 3002 ;;
    payment-service) echo 3003 ;;
    content-service) echo 3004 ;;
    search-service) echo 3005 ;;
    notification-service) echo 3006 ;;
    reward-service) echo 3007 ;;
    analytics-service) echo 3008 ;;
    recommendation-service) echo 3009 ;;
    reality-service) echo 3010 ;;
    movie-service) echo 3011 ;;
    comedy-service) echo 3012 ;;
    api-gateway) echo 3013 ;;
    games-service) echo 3014 ;;
    queue-service) echo 3015 ;;
    lifestyle-service) echo 3016 ;;
    vertical-service) echo 3017 ;;
    creator-service) echo 3018 ;;
    media-service) echo 3019 ;;
    support-service) echo 3020 ;;
    sports-service) echo 3021 ;;
    moderation-service) echo 3022 ;;
    engagement-service) echo 3023 ;;
    messaging-service) echo 3024 ;;
    referral-service) echo 3025 ;;
    subscription-service) echo 3026 ;;
    *) echo 3013 ;;  # Default to gateway port
  esac
}

SERVICE_PORT=$(get_service_port "$SERVICE")

log() {
  echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*"
}

error() {
  log "ERROR: $*" >&2
  exit 1
}

cleanup_on_failure() {
  local exit_code=$?
  if [ $exit_code -ne 0 ]; then
    log "Deployment failed. Rolling back ${SERVICE} in namespace ${NAMESPACE}..."
    kubectl rollout undo "deployment/${SERVICE}" -n "${NAMESPACE}" 2>/dev/null || true
    kubectl rollout status "deployment/${SERVICE}" -n "${NAMESPACE}" --timeout="${TIMEOUT}s" 2>/dev/null || true
    error "Deployment of ${SERVICE} failed and has been rolled back."
  fi
}
trap cleanup_on_failure EXIT

log "=== Blue-Green Deployment ==="
log "Namespace:  ${NAMESPACE}"
log "Service:    ${SERVICE}"
log "Image:      ${IMAGE}"
log "Timeout:    ${TIMEOUT}s"

# Verify the deployment exists
if ! kubectl get "deployment/${SERVICE}" -n "${NAMESPACE}" >/dev/null 2>&1; then
  error "Deployment '${SERVICE}' not found in namespace '${NAMESPACE}'"
fi

# Capture current image for rollback reference
CURRENT_IMAGE=$(kubectl get "deployment/${SERVICE}" -n "${NAMESPACE}" \
  -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || echo "unknown")
log "Current image: ${CURRENT_IMAGE}"

# Determine which color slot is currently active by checking existing pods
CURRENT_REPLICAS=$(kubectl get "deployment/${SERVICE}" -n "${NAMESPACE}" \
  -o jsonpath='{.spec.replicas}' 2>/dev/null || echo "2")
log "Current replica count: ${CURRENT_REPLICAS}"

# Update the deployment with the new image
log "Updating deployment image..."
kubectl set image "deployment/${SERVICE}" "${SERVICE}=${IMAGE}" -n "${NAMESPACE}"

# Annotate the deployment with deployment metadata
kubectl annotate "deployment/${SERVICE}" -n "${NAMESPACE}" \
  --overwrite \
  "azeebo/last-deployed-image=${IMAGE}" \
  "azeebo/last-deployed-at=$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  "azeebo/previous-image=${CURRENT_IMAGE}" 2>/dev/null || true

# Wait for rollout to complete
log "Waiting for rollout to complete (timeout: ${TIMEOUT}s)..."
if ! kubectl rollout status "deployment/${SERVICE}" -n "${NAMESPACE}" --timeout="${TIMEOUT}s"; then
  error "Rollout did not complete within ${TIMEOUT}s"
fi

# Verify all pods are running
log "Verifying pod status..."
READY_PODS=$(kubectl get pods -n "${NAMESPACE}" \
  -l "app=${SERVICE}" \
  -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' 2>/dev/null \
  | grep -c "True" || echo "0")

if [ "${READY_PODS}" -lt 1 ]; then
  error "No ready pods found for ${SERVICE}"
fi
log "Ready pods: ${READY_PODS}"

# Health check verification
log "Running health checks..."
HEALTH_OK=false

for i in $(seq 1 "${HEALTH_RETRIES}"); do
  # Get the service ClusterIP endpoint
  SERVICE_IP=$(kubectl get "svc/${SERVICE}" -n "${NAMESPACE}" \
    -o jsonpath='{.spec.clusterIP}' 2>/dev/null || echo "")

  if [ -z "${SERVICE_IP}" ] || [ "${SERVICE_IP}" = "None" ]; then
    # Fall back to pod IP if no service exists
    POD_IP=$(kubectl get pods -n "${NAMESPACE}" -l "app=${SERVICE}" \
      -o jsonpath='{.items[0].status.podIP}' 2>/dev/null || echo "")
    TARGET="${POD_IP}"
  else
    TARGET="${SERVICE_IP}"
  fi

  if [ -z "${TARGET}" ]; then
    log "  Attempt ${i}/${HEALTH_RETRIES}: No target available yet..."
    sleep "${HEALTH_INTERVAL}"
    continue
  fi

  # Execute health check from within the cluster using a curl pod
  if kubectl run "health-check-${SERVICE}-$$" \
    --rm -i --restart=Never \
    --image=curlimages/curl:latest \
    --namespace="${NAMESPACE}" \
    --command -- curl -sf --max-time 10 "http://${TARGET}:${SERVICE_PORT:-3013}${HEALTH_ENDPOINT}" >/dev/null 2>&1; then
    HEALTH_OK=true
    log "  Health check passed on attempt ${i}"
    break
  else
    log "  Attempt ${i}/${HEALTH_RETRIES}: Health check failed, retrying in ${HEALTH_INTERVAL}s..."
    sleep "${HEALTH_INTERVAL}"
  fi
done

if [ "${HEALTH_OK}" != "true" ]; then
  error "Health checks failed after ${HEALTH_RETRIES} attempts"
fi

# Final verification - confirm the running image matches
DEPLOYED_IMAGE=$(kubectl get "deployment/${SERVICE}" -n "${NAMESPACE}" \
  -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null)

if [ "${DEPLOYED_IMAGE}" != "${IMAGE}" ]; then
  error "Deployed image mismatch: expected '${IMAGE}', got '${DEPLOYED_IMAGE}'"
fi

# Disable the failure trap since we succeeded
trap - EXIT

log "=== Deployment Complete ==="
log "Service: ${SERVICE}"
log "Image:   ${IMAGE}"
log "Status:  Healthy and serving traffic"
