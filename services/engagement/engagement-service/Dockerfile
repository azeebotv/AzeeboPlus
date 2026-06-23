FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/engagement-service/src ./services/engagement/engagement-service/src
COPY services/engagement/engagement-service/tsconfig*.json ./services/engagement/engagement-service/
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma

RUN for i in 1 2 3 4 5; do pnpm --filter @azeebo/engagement-service prisma:generate && break || (echo "Retry prisma generate $i/5..." && sleep 15); done

WORKDIR /app/services/engagement/engagement-service
RUN nest build
WORKDIR /app

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Engagement Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime.
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/engagement-service/dist ./services/engagement/engagement-service/dist
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma
RUN for i in 1 2 3 4 5; do pnpm --filter @azeebo/engagement-service prisma:generate && break || (echo "Retry prisma generate $i/5..." && sleep 15); done

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3023

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3023/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/engagement/engagement-service/dist/services/engagement/engagement-service/src/main.js"]