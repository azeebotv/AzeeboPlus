#!/usr/bin/env bash
# ============================================================
# coolify-set-image-tag.sh — select the image a Coolify Compose app deploys
# ============================================================
# The platform is one Compose app whose image is
#   ghcr.io/azeebotv/azeebo-all-in-one:${IMAGE_TAG:-dev}
# Coolify's deploy API cannot select a Docker tag: its `tag` parameter means a
# Coolify *resource-tag group*, and there is no `compose_file` parameter. The
# image tag a Compose deployment resolves comes from compose interpolation, so
# the version is selected by setting IMAGE_TAG on the application and letting
# Coolify redeploy.
#
# Usage:
#   COOLIFY_API_URL=https://coolify.example \
#   COOLIFY_API_TOKEN=<token> \
#   COOLIFY_APP_UUID=<uuid> \
#     ./coolify-set-image-tag.sh staging-1a2b3c4
#
# Exit codes:
#   0  IMAGE_TAG set (updated or created), or Coolify API not configured (warns)
#   1  configured but both PATCH and POST failed
#   2  bad usage (missing or malformed tag)
# ============================================================

set -euo pipefail

TAG="${1:-}"

if [[ -z "${TAG}" ]]; then
  echo "usage: $0 <image-tag>   (e.g. staging-1a2b3c4, production-1a2b3c4, dev)" >&2
  exit 2
fi
if [[ ! "${TAG}" =~ ^[A-Za-z0-9_][A-Za-z0-9._-]{0,127}$ ]]; then
  echo "✗ invalid image tag '${TAG}': expected a docker tag" >&2
  exit 2
fi

missing=()
[[ -n "${COOLIFY_API_URL:-}" ]] || missing+=("COOLIFY_API_URL")
[[ -n "${COOLIFY_API_TOKEN:-}" ]] || missing+=("COOLIFY_API_TOKEN")
[[ -n "${COOLIFY_APP_UUID:-}" ]] || missing+=("COOLIFY_APP_UUID")
if [[ ${#missing[@]} -gt 0 ]]; then
  echo "::warning::Coolify API not configured (missing ${missing[*]}) — cannot select image tag ${TAG}; the app will deploy whatever IMAGE_TAG it already holds" >&2
  exit 0
fi

API="${COOLIFY_API_URL%/}/api/v1"
ENDPOINT="${API}/applications/${COOLIFY_APP_UUID}/envs"
BODY=$(printf '{"key":"IMAGE_TAG","value":"%s","is_literal":true}' "${TAG}")
AUTH="Authorization: Bearer ${COOLIFY_API_TOKEN}"

# PATCH updates an existing variable; POST creates it. Try the update first so
# a routine deploy does not fail on "already exists".
if curl -fsS --max-time 30 --retry 3 \
  -X PATCH "${ENDPOINT}" \
  -H "${AUTH}" \
  -H "Content-Type: application/json" \
  -d "${BODY}" >/dev/null 2>&1; then
  echo "✅ Coolify IMAGE_TAG=${TAG} (updated)"
  exit 0
fi

echo "IMAGE_TAG=${TAG} not present yet — creating it"
if curl -fsS --max-time 30 --retry 3 \
  -X POST "${ENDPOINT}" \
  -H "${AUTH}" \
  -H "Content-Type: application/json" \
  -d "${BODY}" >/dev/null; then
  echo "✅ Coolify IMAGE_TAG=${TAG} (created)"
  exit 0
fi

echo "✗ could not set IMAGE_TAG=${TAG} on Coolify app ${COOLIFY_APP_UUID}" >&2
exit 1
