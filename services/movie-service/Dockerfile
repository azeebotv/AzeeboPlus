FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages/*/package.json ./packages/
COPY services/movie-service/package.json ./services/movie-service/

RUN pnpm install --frozen-lockfile

COPY services/movie-service/src ./services/movie-service/src
COPY services/movie-service/tsconfig*.json ./services/movie-service/
COPY services/movie-service/prisma ./services/movie-service/prisma

RUN pnpm --filter movie-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Movie Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/movie-service/package.json ./services/movie-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/movie-service/dist ./services/movie-service/dist
COPY --from=builder /app/services/movie-service/prisma ./services/movie-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3016/health || exit 1

CMD ["node", "services/movie-service/dist/src/main.js"]
