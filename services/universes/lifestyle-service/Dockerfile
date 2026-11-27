# ============================================================================
# Canonical parameterized Dockerfile for every NestJS service.
#
# This file is the single source of truth: each per-service Dockerfile
# (services/*/*/Dockerfile) is rendered from it by
# `scripts/check-dockerfile-drift.mjs --update`, which also gates CI against
# the rendered output. Do not edit per-service files directly — edit this
# template, re-render, and commit.
#
# Render args (see the args table in scripts/check-dockerfile-drift.mjs):
#   SERVICE_PATH   repo-relative service dir, e.g. services/core/auth-service
#   SERVICE_NAME   image description label, e.g. Azeebo+ Auth Service
#   PORT           exposed port + healthcheck port
#   PRISMA         inline | script | none
#                    inline: `npx prisma generate` against this service's
#                            schema in the builder stage
#                    script: scripts/generate-prisma-clients.sh — generates
#                            clients for EVERY schema in the context (service
#                            + workspace packages). Load-bearing for services
#                            whose build resolves other packages' clients.
#   CLIENT_COPY    client | src | none — extra runtime copy of the generated
#                    client, matching where each service's compiled code
#                    resolves it from:
#                    client: src/prisma/client → dist/prisma/client
#                    src:    src/prisma        → dist/<SERVICE_PATH>/src/prisma
#                    none:   no extra copy (client resolvable from dist, or
#                            the service has no prisma client at all)
#
# NOTE: this template is not directly buildable (conditional lines are
# Docker comments and ${VARS} are substituted by the renderer). Build the
# rendered per-service Dockerfiles.
# ============================================================================

FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/lifestyle-service/package.json ./services/universes/lifestyle-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/universes/lifestyle-service/src ./services/universes/lifestyle-service/src
COPY services/universes/lifestyle-service/tsconfig*.json ./services/universes/lifestyle-service/
COPY services/universes/lifestyle-service/prisma ./services/universes/lifestyle-service/prisma
COPY scripts/generate-prisma-clients.sh ./scripts/generate-prisma-clients.sh
RUN bash scripts/generate-prisma-clients.sh
RUN pnpm --filter ./services/universes/lifestyle-service run build

FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Lifestyle Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY --chown=nodejs:nodejs package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY --chown=nodejs:nodejs services/universes/lifestyle-service/package.json ./services/universes/lifestyle-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY --chown=nodejs:nodejs packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --chown=nodejs:nodejs --from=builder /app/services/universes/lifestyle-service/dist ./services/universes/lifestyle-service/dist

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3016/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/universes/lifestyle-service/dist/main.js"]
