#!/usr/bin/env bash
# ============================================================
# Azeebo+ Rollback
# ============================================================
# Rolls the deployed platform back to a previously published image tag.
#
# What is actually deployed: ONE container built from Dockerfile.all-in-one
# (Postgres, Redis, PgBouncer, every service and every frontend inside it).
# cd.yml / .github/workflows/cd.yml ships it as
#
#   ghcr.io/azeebotv/azeebo-all-in-one:<tag>
#     cd.yml publishes staging-<sha>, staging, production-<sha>, latest;
#     cd-all-in-one.yml publishes dev and <sha>.
#
# and runs it with `docker run --name azeebo[-staging] -p 3013 -p 4000
# -p 4014 -p 4016 --env-file /opt/azeebo/.env.<env>`. This script reproduces
# exactly that, so a rollback starts the same artifact the deploy started.
# (The old per-service `docker-compose.prod.yml` sed of `${service}:.*` matched
# nothing: that file builds from Dockerfiles and has no registry tags.)
#
# Usage:
#   ./rollback.sh <tag> [--dry-run] [--yes]
#   ./rollback.sh staging-1a2b3c4
#   ./rollback.sh dev --yes
#
# The tag is pulled BEFORE the running container is touched; if the pull fails
# the stack keeps serving the current image. If the rolled-back container fails
# its health check, the previous image is restored automatically.
#
# Env overrides:
#   ENVIRONMENT=staging|production   selects container name + env file
#                                   (staging -> azeebo-staging + .env.staging,
#                                    production -> azeebo + .env.production)
#   IMAGE_REPOS="<repo> <repo>"      registry repos to try, in order
#   IMAGE_REPO=<repo>                single repo shortcut (implies IMAGE_REPOS)
#   CONTAINER_NAME=<name>            override the container name
#   ENV_FILE=<path>                  override the env file passed to docker run
#   PORTS="3013 4000 4014 4016"      host ports to publish
#   HEALTH_CHECK_URL=<url>           default http://localhost:3013/health
#   HEALTH_CHECK_RETRIES / HEALTH_CHECK_INTERVAL
#   ASSUME_YES=1                     never prompt (same as --yes)
#   ROLLBACK_LOG=<path>              default /var/log/azeebo/rollback_<ts>.log
#   SLACK_WEBHOOK_URL=<url>          optional success/failure notification
#
# This script does NOT touch data. Rolling the image back does not reverse
# migrations the newer image already applied; see the note it prints at the end.
# ============================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# ---- Domain registry ----
# Source the generated hostnames so the operator sees which public domain this
# rollback converges on, and so a failure surfaces a missing registry file
# before any container moves (the helper exits non-zero in that case).
# shellcheck source=lib/domain-env.sh
. "${SCRIPT_DIR}/lib/domain-env.sh"

# ---- Arguments ----
TARGET_TAG=""
DRY_RUN=0
ASSUME_YES="${ASSUME_YES:-0}"

usage() {
    sed -n '/^# Usage:/,/^#$/p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//'
}

while [[ $# -gt 0 ]]; do
    case "$1" in
        --dry-run) DRY_RUN=1 ;;
        -y | --yes) ASSUME_YES=1 ;;
        -h | --help)
            usage
            exit 0
            ;;
        -*)
            echo "ERROR: unknown flag: $1" >&2
            usage >&2
            exit 1
            ;;
        *)
            if [[ -n "${TARGET_TAG}" ]]; then
                echo "ERROR: only one tag may be given (got '${TARGET_TAG}' and '$1')" >&2
                exit 1
            fi
            TARGET_TAG="$1"
            ;;
    esac
    shift
done

if [[ -z "${TARGET_TAG}" ]]; then
    echo "ERROR: no image tag given." >&2
    usage >&2
    exit 1
fi

# ---- Configuration ----
ENVIRONMENT="${ENVIRONMENT:-staging}"
case "${ENVIRONMENT}" in
    staging)
        DEFAULT_CONTAINER="azeebo-staging"
        DEFAULT_ENV_FILE="/opt/azeebo/.env.staging"
        PUBLIC_HOST="${STAGING_HOST}"
        ;;
    production | prod)
        ENVIRONMENT="production"
        DEFAULT_CONTAINER="azeebo"
        DEFAULT_ENV_FILE="/opt/azeebo/.env.production"
        PUBLIC_HOST="${BASE_DOMAIN}"
        ;;
    *)
        echo "ERROR: ENVIRONMENT must be 'staging' or 'production' (got '${ENVIRONMENT}')" >&2
        exit 1
        ;;
esac

CONTAINER_NAME="${CONTAINER_NAME:-${DEFAULT_CONTAINER}}"
ENV_FILE="${ENV_FILE:-${DEFAULT_ENV_FILE}}"
PORTS="${PORTS:-3013 4000 4014 4016}"
HEALTH_CHECK_URL="${HEALTH_CHECK_URL:-http://localhost:3013/health}"
HEALTH_CHECK_RETRIES="${HEALTH_CHECK_RETRIES:-60}"
HEALTH_CHECK_INTERVAL="${HEALTH_CHECK_INTERVAL:-5}"
# The one image cd.yml publishes, the compose files interpolate, and the
# rollback workflow verifies. IMAGE_REPO overrides it for a fork or a mirror;
# keep the ref lowercase — Docker rejects uppercase repository names.
IMAGE_REPOS="${IMAGE_REPOS:-${IMAGE_REPO:-ghcr.io/azeebotv/azeebo-all-in-one}}"
read -r -a IMAGE_REPO_LIST <<<"${IMAGE_REPOS}"
read -r -a PORT_LIST <<<"${PORTS}"
ORIGINAL_IMAGE=""

# ---- Logging ----

init_log() {
    if [[ -z "${ROLLBACK_LOG:-}" ]]; then
        local stamp; stamp="$(date +%Y%m%d_%H%M%S)"
        if mkdir -p /var/log/azeebo 2>/dev/null && [[ -w /var/log/azeebo ]]; then
            ROLLBACK_LOG="/var/log/azeebo/rollback_${stamp}.log"
        else
            ROLLBACK_LOG="${TMPDIR:-/tmp}/azeebo-rollback_${stamp}.log"
        fi
    fi
    : >"${ROLLBACK_LOG}" 2>/dev/null || ROLLBACK_LOG="/dev/null"
}

log() {
    local timestamp; timestamp="$(date +"%Y-%m-%d %H:%M:%S")"
    printf '[%s] %s\n' "${timestamp}" "$*" | tee -a "${ROLLBACK_LOG}"
}

die() {
    log "ERROR: $*"
    exit 1
}

init_log

send_slack_notification() {
    local status="$1" message="$2" color="$3"
    if [[ -z "${SLACK_WEBHOOK_URL:-}" ]]; then
        return 0
    fi
    local payload
    payload=$(cat <<EOF
{
    "attachments": [
        {
            "color": "${color}",
            "title": "Azeebo+ Rollback - ${ENVIRONMENT}",
            "text": "${message}",
            "fields": [
                { "title": "Status", "value": "${status}", "short": true },
                { "title": "Environment", "value": "${ENVIRONMENT}", "short": true },
                { "title": "Target Tag", "value": "${TARGET_TAG}", "short": true },
                { "title": "Timestamp", "value": "$(date -u +"%Y-%m-%d %H:%M:%S UTC")", "short": true }
            ],
            "footer": "Azeebo+ DevOps",
            "ts": $(date +%s)
        }
    ]
}
EOF
)
    curl -s -X POST -H 'Content-type: application/json' --data "${payload}" "${SLACK_WEBHOOK_URL}" >/dev/null 2>&1 ||
        log "WARNING: failed to send Slack notification"
}

confirm() {
    local prompt="$1"
    if [[ "${ASSUME_YES}" == "1" ]]; then
        log "${prompt} — assumed yes (--yes)"
        return 0
    fi
    if [[ ! -t 0 ]]; then
        log "ERROR: ${prompt} needs confirmation but stdin is not a terminal; re-run with --yes"
        return 1
    fi
    read -r -p "${prompt} (y/N): " reply
    [[ "${reply}" =~ ^[Yy]$ ]]
}

# ---- Validation ----

validate_tag() {
    local tag="$1"
    if [[ ! "${tag}" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]]; then
        die "invalid image tag '${tag}': expected a docker tag (letters, digits, '.', '_', '-')"
    fi
    if [[ ! "${tag}" =~ ^(v?[0-9]+\.[0-9]+\.[0-9]+(-[A-Za-z0-9.]+)?|staging-[0-9a-fA-F]{7,40}|production-[0-9a-fA-F]{7,40}|sha-[0-9a-fA-F]{7,40}|[0-9a-fA-F]{7,40}|dev|latest)$ ]]; then
        log "WARNING: '${tag}' is not one of the tags the pipeline publishes (dev, <sha>, staging-<sha>, production-<sha>); continuing"
    fi
}

# The commit a sha-shaped tag points at, with any environment prefix removed.
tag_sha_hint() {
    local tag="$1" sha
    sha="${tag#staging-}"
    sha="${sha#production-}"
    sha="${sha#sha-}"
    if [[ "${sha}" =~ ^[0-9a-fA-F]{7,40}$ ]]; then
        printf '%s' "${sha}"
    fi
}

# ---- Docker helpers ----

current_image() {
    if ! command -v docker >/dev/null 2>&1; then
        return 0
    fi
    docker inspect --format='{{.Config.Image}}' "${CONTAINER_NAME}" 2>/dev/null || true
}

container_exists() {
    command -v docker >/dev/null 2>&1 &&
        [[ -n "$(docker ps -aq -f "name=^/${CONTAINER_NAME}$" 2>/dev/null)" ]]
}

# Pulls <repo>:<tag> from the first registry repo that has it. Runs BEFORE the
# live container is stopped, so a typo or an unpublished tag costs nothing.
RESOLVED_IMAGE=""
resolve_image() {
    local tag="$1" repo ref
    for repo in "${IMAGE_REPO_LIST[@]}"; do
        ref="${repo}:${tag}"
        log "Pulling ${ref}"
        if docker pull "${ref}" >>"${ROLLBACK_LOG}" 2>&1; then
            # Sets a global instead of printing: log() writes to stdout, so a
            # command substitution would capture the log lines as the image ref.
            RESOLVED_IMAGE="${ref}"
            return 0
        fi
        log "WARNING: pull failed for ${ref}"
    done
    return 1
}

run_container() {
    local image="$1" name="$2"
    local args=(-d --name "${name}" --restart unless-stopped --env-file "${ENV_FILE}")
    local port
    for port in "${PORT_LIST[@]}"; do
        args+=(-p "${port}:${port}")
    done
    docker run "${args[@]}" "${image}"
}

# Starts the target image under the real container name and waits for health.
start_target() {
    local image="$1"
    if container_exists; then
        log "Stopping ${CONTAINER_NAME}"
        docker stop "${CONTAINER_NAME}" >>"${ROLLBACK_LOG}" 2>&1 || true
        docker rm "${CONTAINER_NAME}" >>"${ROLLBACK_LOG}" 2>&1 || true
    fi
    log "Starting ${CONTAINER_NAME} with ${image}"
    if ! run_container "${image}" "${CONTAINER_NAME}" >>"${ROLLBACK_LOG}" 2>&1; then
        log "ERROR: docker run failed for ${image} (see ${ROLLBACK_LOG})"
        return 1
    fi
    return 0
}

wait_for_health() {
    local retries=0
    while [[ ${retries} -lt ${HEALTH_CHECK_RETRIES} ]]; do
        if curl -sf --max-time 5 "${HEALTH_CHECK_URL}" >/dev/null 2>&1; then
            log "HEALTHY: ${HEALTH_CHECK_URL} responded after $((retries * HEALTH_CHECK_INTERVAL))s"
            return 0
        fi
        retries=$((retries + 1))
        sleep "${HEALTH_CHECK_INTERVAL}"
    done
    log "UNHEALTHY: ${HEALTH_CHECK_URL} did not respond after $((HEALTH_CHECK_RETRIES * HEALTH_CHECK_INTERVAL))s"
    return 1
}

# Confirms the container is serving the commit the tag names, the way cd.yml's
# staging health check does. Only runs when /version exposes a commitSha.
verify_deployed_sha() {
    local hint; hint="$(tag_sha_hint "$1")"
    if [[ -z "${hint}" ]]; then
        return 0
    fi
    local version_url="${HEALTH_CHECK_URL%/health}/version"
    local body deployed
    body="$(curl -sf --max-time 10 "${version_url}" 2>/dev/null || true)"
    deployed="$(printf '%s' "${body}" | grep -o '"commitSha"[[:space:]]*:[[:space:]]*"[^"]*"' | head -1 | sed 's/.*"\([^"]*\)"$/\1/')"
    if [[ -z "${deployed}" || "${deployed}" == "dev" ]]; then
        log "WARNING: ${version_url} did not report a commitSha; skipping tag/SHA verification"
        return 0
    fi
    if [[ "${hint}" == "${deployed}"* || "${deployed}" == "${hint}"* ]]; then
        log "VERIFIED: running commit ${deployed} matches tag ${TARGET_TAG}"
        return 0
    fi
    log "ERROR: running commit ${deployed} does not match tag ${TARGET_TAG} (expected ${hint})"
    return 1
}

# Puts the pre-rollback image back. Best effort: it reports what the operator
# must do by hand rather than leaving the host without a container.
restore_previous() {
    if [[ -z "${ORIGINAL_IMAGE}" ]]; then
        log "WARNING: no previous image recorded; nothing to restore automatically"
        return 1
    fi
    log "Restoring previous image ${ORIGINAL_IMAGE}"
    # A failed `docker run` can still have created (or claimed the name of) a
    # container, so clear it unconditionally before starting the old image.
    docker rm -f "${CONTAINER_NAME}" >>"${ROLLBACK_LOG}" 2>&1 || true
    if run_container "${ORIGINAL_IMAGE}" "${CONTAINER_NAME}" >>"${ROLLBACK_LOG}" 2>&1 &&
        wait_for_health; then
        log "RESTORED: previous image ${ORIGINAL_IMAGE} is healthy again"
        return 0
    fi
    log "ERROR: automatic restore to ${ORIGINAL_IMAGE} failed; start it manually:"
    log "  docker run -d --name ${CONTAINER_NAME} --restart unless-stopped --env-file ${ENV_FILE} \\"
    log "    $(printf -- '-p %s ' "${PORT_LIST[@]}")${ORIGINAL_IMAGE}"
    return 1
}

# ---- Main ----

main() {
    log "=================================================="
    log "Azeebo+ rollback to tag: ${TARGET_TAG}"
    log "Environment: ${ENVIRONMENT}"
    log "Container:   ${CONTAINER_NAME}"
    log "Public host: ${PUBLIC_HOST:-<unset>}"
    if [[ "${DRY_RUN}" == "1" ]]; then
        log "Mode:        DRY RUN — no container is changed"
    fi
    log "=================================================="

    validate_tag "${TARGET_TAG}"

    # Fail before stopping anything if the deployment's env file is missing:
    # docker run would otherwise start a container with defaults and no secrets.
    if [[ ! -f "${ENV_FILE}" ]]; then
        die "env file not found: ${ENV_FILE} (set ENV_FILE=<path> to override)"
    fi
    if ! command -v curl >/dev/null 2>&1; then
        die "curl is required for the post-rollback health check"
    fi

    if [[ "${DRY_RUN}" == "1" ]]; then
        log "Image candidates: ${IMAGE_REPOS}"
        log "Ports:            ${PORTS}"
        log "Env file:         ${ENV_FILE}"
        log "Health check:     ${HEALTH_CHECK_URL}"
        if command -v docker >/dev/null 2>&1; then
            log "Current image:    $(current_image)"
        else
            log "Current image:    <docker not available>"
        fi
        log "Plan: docker pull <candidate>:${TARGET_TAG}, replace ${CONTAINER_NAME}, poll ${HEALTH_CHECK_URL}"
        return 0
    fi

    if ! command -v docker >/dev/null 2>&1; then
        die "docker is not installed or not on PATH"
    fi

    ORIGINAL_IMAGE="$(current_image)"
    if [[ -z "${ORIGINAL_IMAGE}" ]]; then
        log "WARNING: no running ${CONTAINER_NAME} container found; this is a cold start, not a rollback"
    else
        log "Current image: ${ORIGINAL_IMAGE}"
        if [[ "${ORIGINAL_IMAGE##*:}" == "${TARGET_TAG}" ]]; then
            log "WARNING: ${CONTAINER_NAME} already runs tag ${TARGET_TAG}"
            confirm "Roll back to the same tag anyway?" || {
                log "Rollback cancelled"
                exit 0
            }
        elif ! confirm "Roll ${ENVIRONMENT} from ${ORIGINAL_IMAGE} back to ${TARGET_TAG}?"; then
            log "Rollback cancelled"
            exit 0
        fi
    fi

    if ! resolve_image "${TARGET_TAG}"; then
        send_slack_notification "FAILED" "Image tag ${TARGET_TAG} not found in ${IMAGE_REPOS}" "#ff0000"
        die "could not pull ${TARGET_TAG} from any of: ${IMAGE_REPOS} (nothing was stopped)"
    fi
    local resolved="${RESOLVED_IMAGE}"
    log "Resolved image: ${resolved}"

    if ! start_target "${resolved}"; then
        restore_previous || true
        send_slack_notification "FAILED" "Container failed to start with ${TARGET_TAG}" "#ff0000"
        exit 1
    fi

    if ! wait_for_health || ! verify_deployed_sha "${TARGET_TAG}"; then
        log "Rollback target ${TARGET_TAG} is not healthy"
        restore_previous || true
        send_slack_notification "FAILED" "Rollback to ${TARGET_TAG} failed its health check; previous image restored" "#ff0000"
        exit 1
    fi

    send_slack_notification "SUCCESS" "Rollback to ${TARGET_TAG} completed" "#36a64f"

    log "=================================================="
    log "Rollback completed: ${CONTAINER_NAME} now runs ${resolved}"
    log "Data was NOT touched. If the reverted release applied migrations,"
    log "verify schema compatibility before calling this resolved."
    log "Log file: ${ROLLBACK_LOG}"
    log "=================================================="
}

main "$@"
