#!/bin/bash
set -e

echo "========================================="
echo "Secret Rotation Automation Script"
echo "========================================="

AWS_REGION="${AWS_REGION:-us-east-1}"
SECRET_PREFIX="${SECRET_PREFIX:-azeebo}"
ROTATION_INTERVAL_DAYS="${ROTATION_INTERVAL_DAYS:-90}"
NOTIFICATION_EMAIL="${NOTIFICATION_EMAIL:-security@azeebo.com}"
SLACK_WEBHOOK_URL="${SLACK_WEBHOOK_URL:-}"

TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="/tmp/secret-rotation-${TIMESTAMP}.log"

declare -A SECRETS_TO_ROTATE
declare -a ROTATED_SECRETS
declare -a FAILED_SECRETS

log() {
  local message="[$(date '+%Y-%m-%d %H:%M:%S')] $1"
  echo "$message" | tee -a "$LOG_FILE"
}

check_prerequisites() {
  if ! command -v aws &> /dev/null; then
    log "❌ ERROR: AWS CLI is required but not installed"
    exit 1
  fi

  if ! command -v openssl &> /dev/null; then
    log "❌ ERROR: openssl is required but not installed"
    exit 1
  fi

  if ! command -v jq &> /dev/null; then
    log "❌ ERROR: jq is required but not installed"
    exit 1
  fi

  aws sts get-caller-identity > /dev/null 2>&1 || {
    log "❌ ERROR: AWS credentials not configured or invalid"
    exit 1
  }

  log "✅ Prerequisites check passed"
}

generate_secret() {
  local length="${1:-32}"
  openssl rand -base64 "$length" | tr -d '/+%' | head -c "$length"
}

get_secret_last_rotated() {
  local secret_name="$1"
  
  local metadata
  metadata=$(aws secretsmanager describe-secret \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --region "$AWS_REGION" \
    2>/dev/null || echo "")

  if [ -z "$metadata" ]; then
    echo "never"
    return
  fi

  local last_changed_date
  last_changed_date=$(echo "$metadata" | jq -r '.LastChangedDate // empty' 2>/dev/null)

  if [ -z "$last_changed_date" ]; then
    echo "never"
    return
  fi

  local last_changed_epoch
  last_changed_epoch=$(date -d "$last_changed_date" +%s 2>/dev/null || date -j -f "%Y-%m-%dT%H:%M:%S" "$last_changed_date" +%s 2>/dev/null)

  local current_epoch
  current_epoch=$(date +%s)

  local days_since_rotation=$(( (current_epoch - last_changed_epoch) / 86400 ))
  echo "$days_since_rotation"
}

rotate_database_password() {
  local secret_name="$1"
  local db_host="$2"
  local db_port="$3"
  local db_user="$4"

  log "🔄 Rotating database password: ${SECRET_PREFIX}/${secret_name}"

  local new_password
  new_password=$(generate_secret 48)

  local current_secret
  current_secret=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --region "$AWS_REGION" \
    --query SecretString \
    --output text 2>/dev/null || echo "")

  if [ -z "$current_secret" ]; then
    log "❌ Failed to retrieve current secret: ${secret_name}"
    FAILED_SECRETS+=("${secret_name}")
    return 1
  fi

  local new_secret
  new_secret=$(echo "$current_secret" | jq --arg pwd "$new_password" '.password = $pwd')

  aws secretsmanager update-secret \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --secret-string "$new_secret" \
    --region "$AWS_REGION" > /dev/null

  log "✅ Database password rotated: ${secret_name}"
  ROTATED_SECRETS+=("${secret_name}")
  return 0
}

rotate_api_key() {
  local secret_name="$1"
  local key_prefix="${2:-sk}"

  log "🔄 Rotating API key: ${SECRET_PREFIX}/${secret_name}"

  local new_key
  new_key="${key_prefix}_$(generate_secret 40)"

  local current_secret
  current_secret=$(aws secretsmanager get-secret-value \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --region "$AWS_REGION" \
    --query SecretString \
    --output text 2>/dev/null || echo "")

  if [ -z "$current_secret" ]; then
    log "❌ Failed to retrieve current secret: ${secret_name}"
    FAILED_SECRETS+=("${secret_name}")
    return 1
  fi

  local new_secret
  new_secret=$(echo "$current_secret" | jq --arg key "$new_key" '.apiKey = $key // .value = $key')

  aws secretsmanager update-secret \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --secret-string "$new_secret" \
    --region "$AWS_REGION" > /dev/null

  log "✅ API key rotated: ${secret_name}"
  ROTATED_SECRETS+=("${secret_name}")
  return 0
}

rotate_jwt_secret() {
  local secret_name="$1"

  log "🔄 Rotating JWT secret: ${SECRET_PREFIX}/${secret_name}"

  local new_secret_value
  new_secret_value=$(generate_secret 64)

  local new_secret
  new_secret=$(jq -n --arg secret "$new_secret_value" '{"secret": $secret}')

  aws secretsmanager update-secret \
    --secret-id "${SECRET_PREFIX}/${secret_name}" \
    --secret-string "$new_secret" \
    --region "$AWS_REGION" > /dev/null

  log "✅ JWT secret rotated: ${secret_name}"
  ROTATED_SECRETS+=("${secret_name}")
  return 0
}

rotate_all_secrets() {
  log "🔄 Starting rotation for all secrets..."

  local secrets_list
  secrets_list=$(aws secretsmanager list-secrets \
    --region "$AWS_REGION" \
    --query "SecretList[?starts_with(Name, '${SECRET_PREFIX}/')].Name" \
    --output text)

  for secret_path in $secrets_list; do
    local secret_name
    secret_name=$(basename "$secret_path")

    local days_since_rotation
    days_since_rotation=$(get_secret_last_rotated "$secret_name")

    if [ "$days_since_rotation" = "never" ] || [ "$days_since_rotation" -ge "$ROTATION_INTERVAL_DAYS" ]; then
      log "📋 Secret needs rotation: ${secret_name} (last rotated: ${days_since_rotation} days ago)"

      case "$secret_name" in
        *db-password*|*database*)
          rotate_database_password "$secret_name" "${DB_HOST:-}" "${DB_PORT:-5432}" "${DB_USER:-postgres}"
          ;;
        *api-key*|*apikey*)
          rotate_api_key "$secret_name"
          ;;
        *jwt*|*token*)
          rotate_jwt_secret "$secret_name"
          ;;
        *)
          log "⚠️ Unknown secret type, skipping: ${secret_name}"
          ;;
      esac
    else
      log "✅ Secret is up to date: ${secret_name} (${days_since_rotation} days old)"
    fi
  done
}

notify_rotation_results() {
  local success_count=${#ROTATED_SECRETS[@]}
  local failed_count=${#FAILED_SECRETS[@]}

  local message="🔐 Secret Rotation Report\n"
  message+="Timestamp: ${TIMESTAMP}\n"
  message+="Success: ${success_count}\n"
  message+="Failed: ${failed_count}\n\n"

  if [ "$success_count" -gt 0 ]; then
    message+="✅ Rotated secrets:\n"
    for secret in "${ROTATED_SECRETS[@]}"; do
      message+="  - ${secret}\n"
    done
    message+="\n"
  fi

  if [ "$failed_count" -gt 0 ]; then
    message+="❌ Failed rotations:\n"
    for secret in "${FAILED_SECRETS[@]}"; do
      message+="  - ${secret}\n"
    done
    message+="\n"
  fi

  if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -s -X POST "$SLACK_WEBHOOK_URL" \
      -H 'Content-type: application/json' \
      --data "{\"text\": \"$(echo -e "$message")\"}" > /dev/null
    log "📧 Slack notification sent"
  fi

  if command -v mail &> /dev/null && [ -n "$NOTIFICATION_EMAIL" ]; then
    echo -e "$message" | mail -s "Secret Rotation Report - ${TIMESTAMP}" "$NOTIFICATION_EMAIL"
    log "📧 Email notification sent to ${NOTIFICATION_EMAIL}"
  fi

  log "$message"
}

trigger_service_restart() {
  log "🔄 Triggering service restarts to apply new secrets..."

  if command -v kubectl &> /dev/null; then
    local namespaces=("azeebo" "azeebo-staging")
    
    for namespace in "${namespaces[@]}"; do
      local deployments
      deployments=$(kubectl get deployments -n "$namespace" -o jsonpath='{.items[*].metadata.name}' 2>/dev/null || echo "")

      for deployment in $deployments; do
        log "🔄 Restarting deployment: ${deployment} in ${namespace}"
        kubectl rollout restart deployment/"$deployment" -n "$namespace" 2>/dev/null || {
          log "⚠️ Failed to restart deployment: ${deployment}"
        }
      done
    done

    log "✅ Service restarts triggered"
  else
    log "⚠️ kubectl not found, skipping service restarts"
  fi
}

main() {
  log "🚀 Starting secret rotation automation..."
  log "📅 Timestamp: ${TIMESTAMP}"
  log "🔄 Rotation interval: ${ROTATION_INTERVAL_DAYS} days"
  log ""

  check_prerequisites
  rotate_all_secrets
  trigger_service_restart
  notify_rotation_results

  log ""
  log "========================================="
  log "✅ Secret rotation completed!"
  log "========================================="
  log "📊 Success: ${#ROTATED_SECRETS[@]}"
  log "❌ Failed: ${#FAILED_SECRETS[@]}"
  log "📁 Log file: ${LOG_FILE}"
  log "========================================="

  if [ "${#FAILED_SECRETS[@]}" -gt 0 ]; then
    log "⚠️ Some secrets failed to rotate. Check logs for details."
    exit 1
  fi
}

main "$@"
