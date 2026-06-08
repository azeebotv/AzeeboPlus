FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/games-service/package.json ./services/universes/games-service/

RUN pnpm install --frozen-lockfile

COPY services/universes/games-service/src ./services/universes/games-service/src
COPY services/universes/games-service/tsconfig*.json ./services/universes/games-service/
COPY services/universes/games-service/prisma ./services/universes/games-service/prisma

RUN pnpm --filter games-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Games Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/games-service/package.json ./services/universes/games-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/universes/games-service/dist ./services/universes/games-service/dist
COPY --from=builder /app/services/universes/games-service/prisma ./services/universes/games-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3012

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3012/health || exit 1

CMD ["node", "services/universes/games-service/dist/src/main.js"]
