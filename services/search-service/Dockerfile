FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/search-service/package.json ./services/search-service/

RUN pnpm install --frozen-lockfile

COPY services/search-service/src ./services/search-service/src
COPY services/search-service/tsconfig*.json ./services/search-service/
COPY services/search-service/prisma ./services/search-service/prisma

RUN pnpm --filter search-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Search Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/search-service/package.json ./services/search-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/search-service/dist ./services/search-service/dist
COPY --from=builder /app/services/search-service/prisma ./services/search-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3005/health || exit 1

CMD ["node", "services/search-service/dist/src/main.js"]
