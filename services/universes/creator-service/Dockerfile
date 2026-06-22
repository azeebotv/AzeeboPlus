FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/operations/creator-service/package.json ./services/operations/creator-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/operations/creator-service/src ./services/operations/creator-service/src
COPY services/operations/creator-service/tsconfig*.json ./services/operations/creator-service/
COPY services/operations/creator-service/prisma ./services/operations/creator-service/prisma

RUN pnpm --filter @azeebo/creator-service run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Creator Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/operations/creator-service/package.json ./services/operations/creator-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/operations/creator-service/dist ./services/operations/creator-service/dist
COPY --from=builder /app/services/operations/creator-service/prisma ./services/operations/creator-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3018

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3018/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/operations/creator-service/dist/services/operations/creator-service/src/main.js"]
