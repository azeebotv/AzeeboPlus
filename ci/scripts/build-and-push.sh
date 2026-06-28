#!/bin/bash
set -euo pipefail

# ============================================================
# Azeebo+ Docker Build & Push Script
# ============================================================
# Builds the all-in-one image and pushes to a container registry.
# Use this instead of letting Coolify build — the image is built
# once, pushed to registry, and Coolify pulls it.
#
# Usage:
#   ./ci/scripts/build-and-push.sh [--no-cache] [registry] [tag]
#
# Examples:
#   ./ci/scripts/build-and-push.sh                          # defaults to ghcr.io
#   ./ci/scripts/build-and-push.sh --no-cache               # clean build, ghcr.io
#   ./ci/scripts/build-and-push.sh ghcr.io/azeebo-plus v1.0
#   ./ci/scripts/build-and-push.sh docker.io/azeeboplus v1.0
#
# Flags:
#   --no-cache    Skip registry cache (forces full rebuild from scratch)
#
# Environment:
#   REGISTRY        - Container registry (default: ghcr.io/azeebo-plus)
#   IMAGE_TAG       - Image tag (default: latest)
#   NEXT_PUBLIC_API_URL - API URL for the web build
# ============================================================

NO_CACHE=""
if [ "${1:-}" = "--no-cache" ]; then
  NO_CACHE=1
  shift
fi

REGISTRY="${1:-${REGISTRY:-ghcr.io/azeebo-plus}}"
IMAGE_TAG="${2:-${IMAGE_TAG:-latest}}"
IMAGE_NAME="${REGISTRY}/azeebo-all-in-one:${IMAGE_TAG}"
CACHE_IMAGE="${REGISTRY}/build-cache:latest"

echo "==> Building ${IMAGE_NAME}"
if [ -n "${NO_CACHE}" ]; then
  echo "    *** NO-CACHE MODE: full rebuild from scratch ***"
else
  echo "    Cache: ${CACHE_IMAGE}"
fi

# Ensure BuildKit is enabled
export DOCKER_BUILDKIT=1

# Common build args
BUILD_ARGS=(
  --file Dockerfile.all-in-one
  --tag "${IMAGE_NAME}"
  --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}"
)

# Cache args
if [ -n "${NO_CACHE}" ]; then
  BUILD_ARGS+=(--no-cache)
else
  BUILD_ARGS+=(
    --cache-from "type=registry,ref=${CACHE_IMAGE}"
    --cache-to "type=registry,ref=${CACHE_IMAGE},mode=max"
  )
fi

# Build and push
docker buildx build "${BUILD_ARGS[@]}" --push .

echo "==> Pushed ${IMAGE_NAME}"

# Also tag as latest if not already
if [ "${IMAGE_TAG}" != "latest" ]; then
  LATEST_ARGS=(
    --file Dockerfile.all-in-one
    --tag "${REGISTRY}/azeebo-all-in-one:latest"
    --build-arg NEXT_PUBLIC_API_URL="${NEXT_PUBLIC_API_URL:-https://app.azeeboplus.com}"
  )

  if [ -n "${NO_CACHE}" ]; then
    LATEST_ARGS+=(--no-cache)
  else
    LATEST_ARGS+=(
      --cache-from "type=registry,ref=${CACHE_IMAGE}"
    )
  fi

  docker buildx build "${LATEST_ARGS[@]}" --push .
  echo "==> Also tagged as latest"
fi

echo "==> Done. Configure Coolify to pull ${IMAGE_NAME} instead of building."
echo "    In Coolify: Application → Source → Docker Image → ${IMAGE_NAME}"
