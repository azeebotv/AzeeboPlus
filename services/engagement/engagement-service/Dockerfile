FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/engagement-service/src ./services/engagement/engagement-service/src
COPY services/engagement/engagement-service/tsconfig*.json ./services/engagement/engagement-service/
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma

# Single-pass Prisma client generation for every schema in this context
# (engagement-service + the workspace packages), mirroring Dockerfile.all-in-one's
# T-1 step — no per-service prisma:generate to drift.
COPY scripts/generate-prisma-clients.sh ./scripts/generate-prisma-clients.sh
RUN bash scripts/generate-prisma-clients.sh

WORKDIR /app/services/engagement/engagement-service
# Workspace build script = the single source of truth for what "built" means:
# prisma generate + tsc + copy the client into dist/prisma/client. Using it
# here (instead of a hand-rolled `nest build`) is what guarantees the image
# ships the same fresh client the schema declares.
RUN pnpm run build
WORKDIR /app

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Engagement Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime.
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/engagement-service/dist ./services/engagement/engagement-service/dist
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma
# Single-pass Prisma client generation (see builder stage note) — regenerates
# the client after the prod-only install wiped it.
COPY scripts/generate-prisma-clients.sh ./scripts/generate-prisma-clients.sh
RUN bash scripts/generate-prisma-clients.sh

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3023

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3023/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/engagement/engagement-service/dist/main.js"]