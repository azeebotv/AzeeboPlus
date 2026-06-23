FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY apps/admin/src ./apps/admin/src
COPY apps/admin/tsconfig*.json ./apps/admin/
COPY apps/admin/prisma ./apps/admin/prisma

RUN for i in 1 2 3 4 5; do pnpm --filter @azeebo/admin prisma generate && break || (echo "Retry prisma generate $i/5..." && sleep 15); done
RUN pnpm --filter @azeebo/admin run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Admin Panel"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nestjs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/admin/package.json ./apps/admin/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/apps/admin/dist ./apps/admin/dist
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma
COPY --from=builder /app/apps/admin/src/generated ./apps/admin/src/generated

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3016/health || exit 1

CMD ["node", "apps/admin/dist/main.js"]
