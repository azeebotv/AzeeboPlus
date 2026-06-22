FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/notification-service/package.json ./services/engagement/notification-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/notification-service/src ./services/engagement/notification-service/src
COPY services/engagement/notification-service/tsconfig*.json ./services/engagement/notification-service/
COPY services/engagement/notification-service/prisma ./services/engagement/notification-service/prisma

RUN pnpm --filter @azeebo/notification-service run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Notification Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/notification-service/package.json ./services/engagement/notification-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/notification-service/dist ./services/engagement/notification-service/dist
COPY --from=builder /app/services/engagement/notification-service/prisma ./services/engagement/notification-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3006/health || exit 1

CMD ["node", "services/engagement/notification-service/dist/services/engagement/notification-service/src/main.js"]
