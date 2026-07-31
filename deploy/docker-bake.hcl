# ============================================================
# Coolify BuildKit Inline Cache Configuration
# ============================================================
# Use this when building with: DOCKER_BUILDKIT=1 docker buildx build \
#   --cache-from type=registry,ref=ghcr.io/azeebotv/build-cache \
#   --cache-to type=registry,ref=ghcr.io/azeebotv/build-cache,mode=max \
#   -f Dockerfile.all-in-one .
#
# This enables remote BuildKit cache so rebuilds are fast.
# ============================================================

# Build args for Coolify
cache-from: type=registry,ref=ghcr.io/azeebotv/build-cache:latest
cache-to: type=registry,ref=ghcr.io/azeebotv/build-cache:latest,mode=max
