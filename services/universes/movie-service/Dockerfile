FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/movie-service/package.json ./services/universes/movie-service/

RUN pnpm install --frozen-lockfile

COPY services/universes/movie-service/src ./services/universes/movie-service/src
COPY services/universes/movie-service/tsconfig*.json ./services/universes/movie-service/
COPY services/universes/movie-service/prisma ./services/universes/movie-service/prisma

RUN pnpm --filter @azeebo/movie-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Movie Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/movie-service/package.json ./services/universes/movie-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/universes/movie-service/dist ./services/universes/movie-service/dist
COPY --from=builder /app/services/universes/movie-service/prisma ./services/universes/movie-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3016

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3016/health || exit 1

CMD ["node", "services/universes/movie-service/dist/services/universes/movie-service/src/main.js"]
