FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/sports-service/package.json ./services/universes/sports-service/

RUN pnpm install --frozen-lockfile

COPY services/universes/sports-service/src ./services/universes/sports-service/src
COPY services/universes/sports-service/tsconfig*.json ./services/universes/sports-service/
COPY services/universes/sports-service/prisma ./services/universes/sports-service/prisma

RUN pnpm --filter @azeebo/sports-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Sports Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/sports-service/package.json ./services/universes/sports-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/universes/sports-service/dist ./services/universes/sports-service/dist
COPY --from=builder /app/services/universes/sports-service/prisma ./services/universes/sports-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3017

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3017/health || exit 1

CMD ["node", "services/universes/sports-service/dist/services/universes/sports-service/src/main.js"]
