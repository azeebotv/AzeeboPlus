# ============================================================
# Coolify BuildKit Inline Cache Configuration
# ============================================================
# Use this when building with: DOCKER_BUILDKIT=1 docker buildx build \
#   --cache-from type=registry,ref=ghcr.io/azeebo-plus/build-cache \
#   --cache-to type=registry,ref=ghcr.io/azeebo-plus/build-cache,mode=max \
#   -f Dockerfile.all-in-one .
#
# This enables remote BuildKit cache so rebuilds are fast.
# ============================================================

# Syntax: must be first line in Dockerfile (handled via build arg)
# DOCKER_BUILDKIT=1

# Build args for Coolify
target: production
cache-from: type=registry,ref=ghcr.io/azeebo-plus/build-cache:latest
cache-to: type=registry,ref=ghcr.io/azeebo-plus/build-cache:latest,mode=max
