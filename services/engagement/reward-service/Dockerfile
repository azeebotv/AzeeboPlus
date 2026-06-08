FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/reward-service/package.json ./services/engagement/reward-service/

RUN pnpm install --frozen-lockfile

COPY services/engagement/reward-service/src ./services/engagement/reward-service/src
COPY services/engagement/reward-service/tsconfig*.json ./services/engagement/reward-service/
COPY services/engagement/reward-service/prisma ./services/engagement/reward-service/prisma

RUN pnpm --filter reward-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Reward Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/reward-service/package.json ./services/engagement/reward-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/engagement/reward-service/dist ./services/engagement/reward-service/dist
COPY --from=builder /app/services/engagement/reward-service/prisma ./services/engagement/reward-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3007

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3007/health || exit 1

CMD ["node", "services/engagement/reward-service/dist/src/main.js"]
