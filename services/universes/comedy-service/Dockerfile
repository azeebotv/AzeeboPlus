FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/comedy-service/package.json ./services/universes/comedy-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/universes/comedy-service/src ./services/universes/comedy-service/src
COPY services/universes/comedy-service/tsconfig*.json ./services/universes/comedy-service/
COPY services/universes/comedy-service/prisma ./services/universes/comedy-service/prisma

RUN cd services/universes/comedy-service && npx prisma generate
RUN pnpm --filter @azeebo/comedy-service run build

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Comedy Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/comedy-service/package.json ./services/universes/comedy-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/universes/comedy-service/dist ./services/universes/comedy-service/dist
COPY --from=builder /app/services/universes/comedy-service/prisma ./services/universes/comedy-service/prisma
# Copy the generated Prisma client (schema output = "../generated/prisma/client").
COPY --from=builder /app/services/universes/comedy-service/generated ./services/universes/comedy-service/generated

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3012

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3012/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/universes/comedy-service/dist/main.js"]
