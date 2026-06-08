FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/referral-service/package.json ./services/engagement/referral-service/

RUN pnpm install --frozen-lockfile

COPY services/engagement/referral-service/src ./services/engagement/referral-service/src
COPY services/engagement/referral-service/tsconfig*.json ./services/engagement/referral-service/
COPY services/engagement/referral-service/prisma ./services/engagement/referral-service/prisma

RUN pnpm --filter referral-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Referral Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/referral-service/package.json ./services/engagement/referral-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/engagement/referral-service/dist ./services/engagement/referral-service/dist
COPY --from=builder /app/services/engagement/referral-service/prisma ./services/engagement/referral-service/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3025

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3025/health || exit 1

CMD ["node", "services/engagement/referral-service/dist/src/main.js"]
