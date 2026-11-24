#!/usr/bin/env bash
# ============================================================
# Loads platform hostnames from deploy/domains.env (generated from
# packages/shared-types/src/platform-domains.json by
# scripts/generate-domain-env.mjs). Source this file; do not execute it.
#
# Usage:
#   source "$(dirname "$0")/lib/domain-env.sh"
#   echo "$APP_HOST"
# ============================================================

_DOMAIN_ENV_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
_DOMAIN_ENV_FILE="${_DOMAIN_ENV_ROOT}/deploy/domains.env"

if [ ! -f "$_DOMAIN_ENV_FILE" ]; then
  echo "✗ ${_DOMAIN_ENV_FILE} is missing. Run: node scripts/generate-domain-env.mjs" >&2
  return 1 2>/dev/null || exit 1
fi

# shellcheck source=/dev/null
set -a
. "$_DOMAIN_ENV_FILE"
set +a
unset _DOMAIN_ENV_ROOT _DOMAIN_ENV_FILE
