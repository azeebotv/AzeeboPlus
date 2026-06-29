FROM node:22-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/engagement-service/src ./services/engagement/engagement-service/src
COPY services/engagement/engagement-service/tsconfig*.json ./services/engagement/engagement-service/
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma

RUN for i in 1 2 3 4 5; do pnpm --filter @azeebo/engagement-service prisma:generate && break || (echo "Retry prisma generate $i/5..." && sleep 15); done

WORKDIR /app/services/engagement/engagement-service
RUN nest build
WORKDIR /app

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Engagement Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/engagement-service/package.json ./services/engagement/engagement-service/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime.
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/engagement-service/dist ./services/engagement/engagement-service/dist
COPY services/engagement/engagement-service/prisma ./services/engagement/engagement-service/prisma
RUN for i in 1 2 3 4 5; do pnpm --filter @azeebo/engagement-service prisma:generate && break || (echo "Retry prisma generate $i/5..." && sleep 15); done

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3023

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3023/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/engagement/engagement-service/dist/main.js"]