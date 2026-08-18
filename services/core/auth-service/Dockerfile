# T-C12: Pin base image to digest for reproducible builds
# Resolve: docker pull node:22.16.0-alpine && docker inspect --format='{{index .RepoDigests 0}}' node:22.16.0-alpine
# Then replace tag with: FROM node:22.16.0-alpine@sha256:<RESOLVED_DIGEST> AS builder
FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/auth-service/package.json ./services/core/auth-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/core/auth-service/src ./services/core/auth-service/src
COPY services/core/auth-service/tsconfig*.json ./services/core/auth-service/
COPY services/core/auth-service/prisma ./services/core/auth-service/prisma

# Single-pass Prisma client generation for every schema in this context
# (auth-service + the workspace packages), mirroring Dockerfile.all-in-one's
# T-1 step — no per-service prisma:generate to drift.
COPY scripts/generate-prisma-clients.sh ./scripts/generate-prisma-clients.sh
RUN bash scripts/generate-prisma-clients.sh
RUN pnpm --filter @azeebo/auth-service run build

# T-C12: Pin runner stage to same digest as builder
FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Auth Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/auth-service/package.json ./services/core/auth-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/core/auth-service/dist ./services/core/auth-service/dist
COPY --from=builder /app/services/core/auth-service/prisma ./services/core/auth-service/prisma
# The compiled prisma.service.js requires ../../prisma/client, resolved from
# dist/services/core/auth-service/src/modules/database/prisma.service.js →
# dist/services/core/auth-service/src/prisma/client. The prisma generate step
# inside the builder stage emits the client to src/prisma/client (per the
# schema's `output = "../src/prisma/client"`), so copy it from there.
COPY --from=builder /app/services/core/auth-service/src/prisma ./services/core/auth-service/dist/services/core/auth-service/src/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3000/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/core/auth-service/dist/main.js"]
