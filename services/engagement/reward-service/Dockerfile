FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/reward-service/package.json ./services/engagement/reward-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/reward-service/src ./services/engagement/reward-service/src
COPY services/engagement/reward-service/tsconfig*.json ./services/engagement/reward-service/
COPY services/engagement/reward-service/prisma ./services/engagement/reward-service/prisma

RUN pnpm --filter @azeebo/reward-service run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Reward Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/reward-service/package.json ./services/engagement/reward-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/reward-service/dist ./services/engagement/reward-service/dist
COPY --from=builder /app/services/engagement/reward-service/prisma ./services/engagement/reward-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3007/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/engagement/reward-service/dist/services/engagement/reward-service/src/main.js"]
