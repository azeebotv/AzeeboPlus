# Azeebo+ API Gateway — single-stage image.
#
# The repo's .dockerignore excludes **/dist/ from the build context, and the
# workspace packages ship dist-based exports (dist is gitignored). The dist
# must therefore be BUILT inside the image — cross-stage COPY of the built
# packages has proven unreliable here (the dist never reaches the runtime
# stage), so this is a single stage: install, build packages, build the app,
# all in the final image.
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS app

WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ API Gateway"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY --chown=nodejs:nodejs packages ./packages
COPY --chown=nodejs:nodejs services/gateway/api-gateway/package.json ./services/gateway/api-gateway/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Build the workspace packages BEFORE the app: tsc resolves @azeebo/* to
# packages/*/dist. Excluded: test-utils (needs @prisma/client generation) and
# contract-tests (its src is 100% *.spec.ts files, which .dockerignore strips
# from the context).
RUN pnpm -r --filter './packages/**' --filter '!@azeebo/test-utils' --filter '!@azeebo/contract-tests' run build



COPY --chown=nodejs:nodejs services/gateway/api-gateway/src ./services/gateway/api-gateway/src
COPY --chown=nodejs:nodejs services/gateway/api-gateway/tsconfig*.json ./services/gateway/api-gateway/

RUN pnpm --filter @azeebo/api-gateway run build

# Fail fast if the workspace dist is missing from the final image.
RUN test -f packages/security/dist/index.js && test -f packages/feature-flags/dist/index.js

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3013

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3013/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/gateway/api-gateway/dist/main.js"]
