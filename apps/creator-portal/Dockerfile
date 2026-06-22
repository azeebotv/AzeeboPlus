FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY apps/creator-portal/package.json ./apps/creator-portal/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY apps/creator-portal/src ./apps/creator-portal/src
COPY apps/creator-portal/tsconfig*.json ./apps/creator-portal/
COPY apps/creator-portal/prisma ./apps/creator-portal/prisma

RUN pnpm --filter @azeebo/creator-portal prisma generate
RUN pnpm --filter @azeebo/creator-portal run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Creator Portal"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nestjs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/creator-portal/package.json ./apps/creator-portal/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/apps/creator-portal/dist ./apps/creator-portal/dist
COPY --from=builder /app/apps/creator-portal/prisma ./apps/creator-portal/prisma
COPY --from=builder /app/apps/creator-portal/src/generated ./apps/creator-portal/src/generated

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3014

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3014/health || exit 1

CMD ["node", "apps/creator-portal/dist/main.js"]
