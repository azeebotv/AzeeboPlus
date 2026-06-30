FROM node:22-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY apps/creator-portal/package.json ./apps/creator-portal/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY apps/creator-portal/src ./apps/creator-portal/src
COPY apps/creator-portal/tsconfig*.json ./apps/creator-portal/
COPY apps/creator-portal/prisma ./apps/creator-portal/prisma

RUN pnpm --filter @azeebo/creator-portal prisma generate
RUN pnpm --filter @azeebo/creator-portal run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Creator Portal"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN addgroup -g 65532 -S nodejs && \
    adduser -S nestjs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/creator-portal/package.json ./apps/creator-portal/
# Copy workspace packages so @azeebo/shared-types, @azeebo/security,
# @azeebo/logger, etc. are resolvable at runtime (pnpm install creates
# symlinks under node_modules pointing into packages/).
COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/apps/creator-portal/dist ./apps/creator-portal/dist
COPY --from=builder /app/apps/creator-portal/prisma ./apps/creator-portal/prisma
COPY --from=builder /app/apps/creator-portal/src/generated ./apps/creator-portal/src/generated

RUN chown -R nestjs:nodejs /app

USER nestjs

EXPOSE 4014

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:4014/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

CMD ["node", "apps/creator-portal/dist/main.js"]
