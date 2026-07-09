#!/bin/bash
set -euo pipefail

# Secret Rotation Script for Azeebo+
# Generates new JWT secrets, updates Kubernetes secrets, rolling-restarts services.
#
# Required environment variables:
#   AWS_REGION               - AWS region for Secrets Manager
#   SECRET_PREFIX            - Prefix for secret names (e.g. azeebo)
#
# Optional environment variables:
#   ROTATION_INTERVAL_DAYS   - Minimum age before rotation (default: 90)
#   NOTIFICATION_EMAIL       - Email for rotation notifications
#   SLACK_WEBHOOK_URL        - Slack webhook for notifications
#   DB_HOST                  - PostgreSQL host (for DB password rotation)
#   DB_PORT                  - PostgreSQL port
#   DB_USER                  - PostgreSQL user
#   K8S_NAMESPACE            - Kubernetes namespace (default: azeebo)
#   DRY_RUN                  - Set to "true" for dry-run mode

AWS_REGION="${AWS_REGION:?AWS_REGION is required}"
SECRET_PREFIX="${SECRET_PREFIX:-azeebo}"
ROTATION_INTERVAL_DAYS="${ROTATION_INTERVAL_DAYS:-90}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-}"
K8S_NAMESPACE="${K8S_NAMESPACE:-azeebo}"
DRY_RUN="${DRY_RUN:-false}"

# Affected services that consume JWT secrets
AFFECTED_SERVICES=(
  api-gateway
  auth-service
  user-service
  wallet-service
  payment-service
  content-service
  creator-service
  notification-service
  reality-service
  movie-service
  comedy-service
  games-service
  sports-service
  lifestyle-service
  vertical-service
  moderation-service
  reward-service
  referral-service
  subscription-service
  messaging-service
  engagement-service
  support-service
  search-service
  recommendation-service
  analytics-service
  queue-service
  media-service
)

TIMESTAMP=$(date '+%Y%m%d-%H%M%S')
ROTATION_LOG="/tmp/secret-rotation-${TIMESTAMP}.log"
ERRORS=0

log() {
  local msg="[$(date '+%Y-%m-%d %H:%M:%S')] $*"
  echo "$msg" | tee -a "${ROTATION_LOG}"
}

send_slack() {
  local message="$1"
  if [ -n "${SLACK_WEBHOOK_URL:-}" ]; then
    curl -sf -X POST "${SLACK_WEBHOOK_URL}" \
      -H 'Content-type: application/json' \
      --data "{\"text\": \"${message}\"}" >/dev/null 2>&1 || true
  fi
}

send_email() {
  local subject="$1"
  local body="$2"
  if [ -n "${NOTIFICATION_EMAIL}" ] && command -v mail >/dev/null 2>&1; then
    echo "${body}" | mail -s "${subject}" "${NOTIFICATION_EMAIL}" 2>/dev/null || true
  fi
}

generate_secret() {
  openssl rand -base64 48 | tr -d '\n'
}

check_rotation_needed() {
  local secret_name="$1"
  local last_rotated

  last_rotated=$(aws secretsmanager describe-secret \
    --secret-id "${secret_name}" \
    --region "${AWS_REGION}" \
    --query 'LastRotatedDate' \
    --output text 2>/dev/null || echo "None")

  if [ "${last_rotated}" = "None" ] || [ "${last_rotated}" = "null" ]; then
    log "  Secret ${secret_name} has never been rotated"
    return 0
  fi

  local last_epoch
  last_epoch=$(date -d "${last_rotated}" +%s 2>/dev/null || \
    date -jf "%Y-%m-%dT%H:%M:%S" "${last_rotated}" +%s 2>/dev/null || echo "0")
  local now_epoch
  now_epoch=$(date +%s)
  local age_days=$(( (now_epoch - last_epoch) / 86400 ))

  log "  Secret ${secret_name} last rotated ${age_days} days ago"

  if [ "${age_days}" -ge "${ROTATION_INTERVAL_DAYS}" ]; then
    return 0
  else
    log "  Skipping ${secret_name} - only ${age_days} days old (threshold: ${ROTATION_INTERVAL_DAYS})"
    return 1
  fi
}

rotate_jwt_secret() {
  local secret_key="$1"
  local description="$2"

  log "Rotating ${description} (${secret_key})..."

  local secret_name="${SECRET_PREFIX}/${secret_key}"

  if ! check_rotation_needed "${secret_name}"; then
    return 0
  fi

  local new_value
  new_value=$(generate_secret)

  if [ "${DRY_RUN}" = "true" ]; then
    log "  [DRY RUN] Would update secret ${secret_name} with new value"
    return 0
  fi

  # Update or create the secret in AWS Secrets Manager
  if aws secretsmanager describe-secret --secret-id "${secret_name}" --region "${AWS_REGION}" >/dev/null 2>&1; then
    aws secretsmanager update-secret \
      --secret-id "${secret_name}" \
      --secret-string "${new_value}" \
      --region "${AWS_REGION}" \
      --rotate-secret 2>>"${ROTATION_LOG}"
    log "  Updated existing secret: ${secret_name}"
  else
    aws secretsmanager create-secret \
      --name "${secret_name}" \
      --secret-string "${new_value}" \
      --region "${AWS_REGION}" \
      --description "${description} for Azeebo+" 2>>"${ROTATION_LOG}"
    log "  Created new secret: ${secret_name}"
  fi

  # Update Kubernetes secret
  update_k8s_secret "${secret_key}" "${new_value}"
}

update_k8s_secret() {
  local key="$1"
  local value="$2"

  if [ "${DRY_RUN}" = "true" ]; then
    log "  [DRY RUN] Would update k8s secret ${SECRET_PREFIX}-secrets key ${key}"
    return 0
  fi

  # Check if the k8s secret exists
  if kubectl get secret "${SECRET_PREFIX}-secrets" -n "${K8S_NAMESPACE}" >/dev/null 2>&1; then
    # Update existing secret
    kubectl create secret generic "${SECRET_PREFIX}-secrets" \
      --namespace "${K8S_NAMESPACE}" \
      --from-literal="${key}=${value}" \
      --dry-run=client -o yaml | kubectl apply -f - 2>>"${ROTATION_LOG}"
    log "  Updated k8s secret: ${SECRET_PREFIX}-secrets key=${key}"
  else
    # Create new secret
    kubectl create secret generic "${SECRET_PREFIX}-secrets" \
      --namespace "${K8S_NAMESPACE}" \
      --from-literal="${key}=${value}" 2>>"${ROTATION_LOG}"
    log "  Created k8s secret: ${SECRET_PREFIX}-secrets key=${key}"
  fi
}

restart_affected_services() {
  log "Rolling restart of affected services..."

  for service in "${AFFECTED_SERVICES[@]}"; do
    # Check if the deployment exists
    if ! kubectl get "deployment/${service}" -n "${K8S_NAMESPACE}" >/dev/null 2>&1; then
      log "  Skipping ${service} - not found in namespace ${K8S_NAMESPACE}"
      continue
    fi

    if [ "${DRY_RUN}" = "true" ]; then
      log "  [DRY RUN] Would restart deployment/${service}"
      continue
    fi

    log "  Restarting ${service}..."
    kubectl rollout restart "deployment/${service}" -n "${K8S_NAMESPACE}" 2>>"${ROTATION_LOG}" || {
      log "  WARNING: Failed to restart ${service}"
      ERRORS=$((ERRORS + 1))
    }
  done

  if [ "${DRY_RUN}" != "true" ]; then
    log "Waiting for rollouts to complete..."
    for service in "${AFFECTED_SERVICES[@]}"; do
      if kubectl get "deployment/${service}" -n "${K8S_NAMESPACE}" >/dev/null 2>&1; then
        log "  Waiting for ${service}..."
        kubectl rollout status "deployment/${service}" -n "${K8S_NAMESPACE}" \
          --timeout=300s 2>>"${ROTATION_LOG}" || {
          log "  WARNING: Rollout timeout for ${service}"
          ERRORS=$((ERRORS + 1))
        }
      fi
    done
  fi
}

validate_secrets() {
  log "Validating rotated secrets..."

  if [ "${DRY_RUN}" = "true" ]; then
    log "  [DRY RUN] Skipping validation"
    return 0
  fi

  # Verify the k8s secret contains the new keys
  local secret_data
  secret_data=$(kubectl get secret "${SECRET_PREFIX}-secrets" -n "${K8S_NAMESPACE}" \
    -o jsonpath='{.data}' 2>/dev/null || echo "{}")

  for key in JWT_ACCESS_SECRET JWT_REFRESH_SECRET; do
    if echo "${secret_data}" | grep -q "${key}"; then
      log "  ✓ ${key} present in k8s secret"
    else
      log "  ✗ ${key} MISSING from k8s secret"
      ERRORS=$((ERRORS + 1))
    fi
  done

  # Verify at least one pod has restarted with new secrets
  log "  Checking pod status..."
  READY_PODS=$(kubectl get pods -n "${K8S_NAMESPACE}" \
    -l "app=api-gateway" \
    -o jsonpath='{range .items[*]}{.status.conditions[?(@.type=="Ready")].status}{"\n"}{end}' 2>/dev/null \
    | grep -c "True" || echo "0")

  if [ "${READY_PODS}" -gt 0 ]; then
    log "  ✓ API Gateway has ready pods (${READY_PODS})"
  else
    log "  ✗ API Gateway has no ready pods"
    ERRORS=$((ERRORS + 1))
  fi
}

log "=== Azeebo+ Secret Rotation ==="
log "Mode:        $([ "${DRY_RUN}" = "true" ] && echo "DRY RUN" || echo "LIVE")"
log "Namespace:   ${K8S_NAMESPACE}"
log "Interval:    ${ROTATION_INTERVAL_DAYS} days"
log "Log file:    ${ROTATION_LOG}"

# Rotate JWT secrets
rotate_jwt_secret "JWT_ACCESS_SECRET" "JWT Access Token Signing Secret"
rotate_jwt_secret "JWT_REFRESH_SECRET" "JWT Refresh Token Signing Secret"

# Rotate API keys
rotate_jwt_secret "API_GATEWAY_KEY" "API Gateway Internal Key"

# Restart affected services
restart_affected_services

# Validate
validate_secrets

# Summary
log "=== Rotation Summary ==="
log "Errors: ${ERRORS}"

if [ "${ERRORS}" -gt 0 ]; then
  send_slack "🚨 Azeebo+ Secret Rotation: ${ERRORS} error(s) encountered. Log: ${ROTATION_LOG}"
  send_email "Azeebo+ Secret Rotation Warning" "Secret rotation completed with ${ERRORS} error(s). Check log: ${ROTATION_LOG}"
  exit 1
else
  send_slack "✅ Azeebo+ Secret Rotation Complete. All secrets rotated and services restarted."
  send_email "Azeebo+ Secret Rotation Complete" "All secrets rotated successfully."
  log "Secret rotation completed successfully"
fi
