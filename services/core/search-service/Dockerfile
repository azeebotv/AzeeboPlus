FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/search-service/package.json ./services/core/search-service/

RUN pnpm install --frozen-lockfile

COPY services/core/search-service/src ./services/core/search-service/src
COPY services/core/search-service/tsconfig*.json ./services/core/search-service/
COPY services/core/search-service/prisma ./services/core/search-service/prisma

RUN pnpm --filter @azeebo/search-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Search Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/search-service/package.json ./services/core/search-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/core/search-service/dist ./services/core/search-service/dist
COPY --from=builder /app/services/core/search-service/prisma ./services/core/search-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["node", "services/core/search-service/dist/services/core/search-service/src/main.js"]
