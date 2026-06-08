FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/content-service/package.json ./services/core/content-service/

RUN pnpm install --frozen-lockfile

COPY services/core/content-service/src ./services/core/content-service/src
COPY services/core/content-service/tsconfig*.json ./services/core/content-service/
COPY services/core/content-service/prisma ./services/core/content-service/prisma

RUN pnpm --filter content-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Content Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/content-service/package.json ./services/core/content-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/core/content-service/dist ./services/core/content-service/dist
COPY --from=builder /app/services/core/content-service/prisma ./services/core/content-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3004

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3004/health || exit 1

CMD ["node", "services/core/content-service/dist/src/main.js"]
