FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/wallet-service/package.json ./services/core/wallet-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/core/wallet-service/src ./services/core/wallet-service/src
COPY services/core/wallet-service/tsconfig*.json ./services/core/wallet-service/
COPY services/core/wallet-service/prisma ./services/core/wallet-service/prisma

RUN pnpm --filter @azeebo/wallet-service run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Wallet Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/wallet-service/package.json ./services/core/wallet-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/core/wallet-service/dist ./services/core/wallet-service/dist
COPY --from=builder /app/services/core/wallet-service/prisma ./services/core/wallet-service/prisma
# The compiled prisma.service.js requires ../../prisma/client, resolved from
# dist/services/core/wallet-service/src/modules/database/prisma.service.js ->
# dist/services/core/wallet-service/src/prisma/client. The prisma generate step inside the
# builder stage emits the client to src/prisma/client (per the schema's
# `output = "../src/prisma/client"`), so copy it from there.
COPY --from=builder /app/services/core/wallet-service/src/prisma ./services/core/wallet-service/dist/services/core/wallet-service/src/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3002/health || exit 1

CMD ["node", "services/core/wallet-service/dist/services/core/wallet-service/src/main.js"]
