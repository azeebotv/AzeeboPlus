FROM node:22-alpine AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/vertical-service/package.json ./services/universes/vertical-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/universes/vertical-service/src ./services/universes/vertical-service/src
COPY services/universes/vertical-service/tsconfig*.json ./services/universes/vertical-service/
COPY services/universes/vertical-service/prisma ./services/universes/vertical-service/prisma

RUN pnpm --filter @azeebo/vertical-service run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Vertical Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 @nestjs/cli prisma@6.19.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/vertical-service/package.json ./services/universes/vertical-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/universes/vertical-service/dist ./services/universes/vertical-service/dist
COPY --from=builder /app/services/universes/vertical-service/prisma ./services/universes/vertical-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3021

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3021/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/universes/vertical-service/dist/services/universes/vertical-service/src/main.js"]
