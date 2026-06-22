#!/bin/bash
# Docker Base Image Digest Resolver
# Resolves mutable Docker image tags to their SHA256 digests for reproducible builds.
# Usage: ./ci/scripts/resolve-docker-digests.sh
#
# This script outputs the digest pinning commands for all Dockerfiles.
# Run after each upstream base image update and commit the results.

set -euo pipefail

IMAGES=(
  "node:20.11.1-alpine3.19"
  "postgres:15-alpine"
  "redis:7-alpine"
)

echo "# Docker Base Image Digest Pinning"
echo "# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "# Apply these digests to Dockerfiles for reproducible builds."
echo ""

for image in "${IMAGES[@]}"; do
  echo "Resolving digest for ${image}..."
  
  DIGEST=$(docker pull "${image}" 2>/dev/null && docker inspect --format='{{index .RepoDigests 0}}' "${image}" 2>/dev/null | sed 's/.*@//')
  
  if [ -n "$DIGEST" ]; then
    echo "# ${image} -> ${DIGEST}"
    echo "FROM ${image}@${DIGEST}"
  else
    echo "# WARNING: Could not resolve digest for ${image}"
    echo "# Run: docker pull ${image} && docker inspect --format='{{index .RepoDigests 0}}' ${image}"
  fi
  echo ""
done

echo "# To apply: replace FROM lines in all Dockerfiles with the digest-pinned versions above."
echo "# Verify: grep -r 'FROM node:' --include='Dockerfile' . | grep '@sha256:'"
