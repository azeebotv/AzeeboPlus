FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/reality-service/package.json ./services/reality-service/

RUN pnpm install --frozen-lockfile

COPY services/reality-service/src ./services/reality-service/src
COPY services/reality-service/tsconfig*.json ./services/reality-service/
COPY services/reality-service/prisma ./services/reality-service/prisma

RUN pnpm --filter reality-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Reality Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/reality-service/package.json ./services/reality-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/reality-service/dist ./services/reality-service/dist
COPY --from=builder /app/services/reality-service/prisma ./services/reality-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3010/health || exit 1

CMD ["node", "services/reality-service/dist/src/main.js"]
