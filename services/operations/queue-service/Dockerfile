FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/operations/queue-service/package.json ./services/operations/queue-service/

RUN pnpm install --frozen-lockfile

COPY services/operations/queue-service/src ./services/operations/queue-service/src
COPY services/operations/queue-service/tsconfig*.json ./services/operations/queue-service/
COPY services/operations/queue-service/prisma ./services/operations/queue-service/prisma

RUN pnpm --filter queue-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Queue Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/operations/queue-service/package.json ./services/operations/queue-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/operations/queue-service/dist ./services/operations/queue-service/dist
COPY --from=builder /app/services/operations/queue-service/prisma ./services/operations/queue-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3015

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3015/health || exit 1

CMD ["node", "services/operations/queue-service/dist/src/main.js"]
