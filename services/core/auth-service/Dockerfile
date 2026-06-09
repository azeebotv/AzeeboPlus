FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/core/auth-service/package.json ./services/core/auth-service/

RUN pnpm install --frozen-lockfile

COPY services/core/auth-service/src ./services/core/auth-service/src
COPY services/core/auth-service/tsconfig*.json ./services/core/auth-service/
COPY services/core/auth-service/prisma ./services/core/auth-service/prisma

RUN pnpm --filter @azeebo/auth-service build

FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Auth Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache curl && \
    npm install -g pnpm@9.15.0 && \
    addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/core/auth-service/package.json ./services/core/auth-service/

RUN pnpm install --prod --frozen-lockfile

COPY --from=builder /app/services/core/auth-service/dist ./services/core/auth-service/dist
COPY --from=builder /app/services/core/auth-service/prisma ./services/core/auth-service/prisma
# The compiled prisma.service.js requires ../../prisma/client, resolved from
# dist/services/core/auth-service/src/modules/database/prisma.service.js →
# dist/services/core/auth-service/src/prisma/client. The prisma generate step
# inside the builder stage emits the client to src/prisma/client (per the
# schema's `output = "../src/prisma/client"`), so copy it from there.
COPY --from=builder /app/services/core/auth-service/src/prisma ./services/core/auth-service/dist/services/core/auth-service/src/prisma

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

CMD ["node", "services/core/auth-service/dist/services/core/auth-service/src/main.js"]
