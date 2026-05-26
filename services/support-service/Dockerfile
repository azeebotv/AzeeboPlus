FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/support-service/package.json ./services/support-service/

RUN pnpm install --frozen-lockfile

COPY services/support-service/src ./services/support-service/src
COPY services/support-service/tsconfig*.json ./services/support-service/
COPY services/support-service/prisma ./services/support-service/prisma

RUN pnpm --filter support-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Support Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/support-service/package.json ./services/support-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/support-service/dist ./services/support-service/dist
COPY --from=builder /app/services/support-service/prisma ./services/support-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3020

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3020/health || exit 1

CMD ["node", "services/support-service/dist/src/main.js"]
