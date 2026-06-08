FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/intelligence/analytics-service/package.json ./services/intelligence/analytics-service/

RUN pnpm install --frozen-lockfile

COPY services/intelligence/analytics-service/src ./services/intelligence/analytics-service/src
COPY services/intelligence/analytics-service/tsconfig*.json ./services/intelligence/analytics-service/
COPY services/intelligence/analytics-service/prisma ./services/intelligence/analytics-service/prisma

RUN pnpm --filter analytics-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Analytics Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/intelligence/analytics-service/package.json ./services/intelligence/analytics-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/intelligence/analytics-service/dist ./services/intelligence/analytics-service/dist
COPY --from=builder /app/services/intelligence/analytics-service/prisma ./services/intelligence/analytics-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3008/health || exit 1

CMD ["node", "services/intelligence/analytics-service/dist/src/main.js"]
