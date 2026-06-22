FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/intelligence/recommendation-service/package.json ./services/intelligence/recommendation-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/intelligence/recommendation-service/src ./services/intelligence/recommendation-service/src
COPY services/intelligence/recommendation-service/tsconfig*.json ./services/intelligence/recommendation-service/
COPY services/intelligence/recommendation-service/prisma ./services/intelligence/recommendation-service/prisma

RUN pnpm --filter @azeebo/recommendation-service run build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Recommendation Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done && \
    addgroup -g 65532 -S nodejs && \
    apk add --no-cache tini && \
    adduser -S nodejs -u 65532

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/intelligence/recommendation-service/package.json ./services/intelligence/recommendation-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/intelligence/recommendation-service/dist ./services/intelligence/recommendation-service/dist
COPY --from=builder /app/services/intelligence/recommendation-service/prisma ./services/intelligence/recommendation-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3009

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3009/live || exit 1

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/intelligence/recommendation-service/dist/services/intelligence/recommendation-service/src/main.js"]
