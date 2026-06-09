FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/user-service/package.json ./services/core/user-service/

RUN pnpm install --frozen-lockfile

COPY services/core/user-service/src ./services/core/user-service/src
COPY services/core/user-service/tsconfig*.json ./services/core/user-service/
COPY services/core/user-service/prisma ./services/core/user-service/prisma

RUN pnpm --filter @azeebo/user-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ User Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/user-service/package.json ./services/core/user-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/core/user-service/dist ./services/core/user-service/dist
COPY --from=builder /app/services/core/user-service/prisma ./services/core/user-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

CMD ["node", "services/core/user-service/dist/services/core/user-service/src/main.js"]
