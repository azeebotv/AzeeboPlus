FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY packages ./packages
COPY services/gateway/api-gateway/package.json ./services/gateway/api-gateway/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Workspace packages ship dist-based exports (dist is gitignored), so build
# them before the app: tsc resolves @azeebo/* to packages/*/dist. Excluded:
# test-utils (needs @prisma/client generation) and contract-tests (its src is
# 100% *.spec.ts files, which .dockerignore strips from the context).
RUN pnpm -r --filter './packages/**' --filter '!@azeebo/test-utils' --filter '!@azeebo/contract-tests' run build

COPY services/gateway/api-gateway/src ./services/gateway/api-gateway/src
COPY services/gateway/api-gateway/tsconfig*.json ./services/gateway/api-gateway/

RUN pnpm --filter @azeebo/api-gateway run build

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ API Gateway"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY services/gateway/api-gateway/package.json ./services/gateway/api-gateway/

# Copy the BUILT packages (dist included) from the builder; the source tree's
# dist is gitignored and never lands in the context. pnpm install --prod below
# re-links node_modules per the lockfile. .npmrc's shamefully-hoist is what
# lets the app resolve transitive deps from the root node_modules.
COPY --from=builder /app/packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/gateway/api-gateway/dist ./services/gateway/api-gateway/dist

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3013

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3013/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/gateway/api-gateway/dist/main.js"]
