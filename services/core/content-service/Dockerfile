FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/content-service/package.json ./services/core/content-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/core/content-service/src ./services/core/content-service/src
COPY services/core/content-service/tsconfig*.json ./services/core/content-service/
COPY services/core/content-service/prisma ./services/core/content-service/prisma

RUN pnpm --filter @azeebo/content-service run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Content Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/content-service/package.json ./services/core/content-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/core/content-service/dist ./services/core/content-service/dist
COPY --from=builder /app/services/core/content-service/prisma ./services/core/content-service/prisma
# The compiled prisma.service.js requires ../../prisma/client, resolved from
# dist/services/core/content-service/src/modules/database/prisma.service.js ->
# dist/services/core/content-service/src/prisma/client. The prisma generate step inside the
# builder stage emits the client to src/prisma/client (per the schema's
# `output = "../src/prisma/client"`), so copy it from there.
COPY --from=builder /app/services/core/content-service/src/prisma ./services/core/content-service/dist/services/core/content-service/src/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3004/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/core/content-service/dist/services/core/content-service/src/main.js"]
