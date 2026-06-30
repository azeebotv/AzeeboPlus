FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/sports-service/package.json ./services/universes/sports-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/universes/sports-service/src ./services/universes/sports-service/src
COPY services/universes/sports-service/tsconfig*.json ./services/universes/sports-service/
COPY services/universes/sports-service/prisma ./services/universes/sports-service/prisma

RUN cd services/universes/sports-service && npx prisma generate
RUN pnpm --filter @azeebo/sports-service run build

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Sports Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/sports-service/package.json ./services/universes/sports-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/universes/sports-service/dist ./services/universes/sports-service/dist
COPY --from=builder /app/services/universes/sports-service/prisma ./services/universes/sports-service/prisma
# Copy the generated Prisma client (schema output = "../generated/prisma/client").
COPY --from=builder /app/services/universes/sports-service/generated ./services/universes/sports-service/generated

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3021

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3021/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/universes/sports-service/dist/main.js"]
