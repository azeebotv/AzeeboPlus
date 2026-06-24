FROM node:22-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/universes/vertical-service/package.json ./services/universes/vertical-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/universes/vertical-service/src ./services/universes/vertical-service/src
COPY services/universes/vertical-service/tsconfig*.json ./services/universes/vertical-service/
COPY services/universes/vertical-service/prisma ./services/universes/vertical-service/prisma

RUN cd services/universes/vertical-service && npx prisma generate
RUN pnpm --filter @azeebo/vertical-service run build

FROM node:22-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Vertical Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/universes/vertical-service/package.json ./services/universes/vertical-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/universes/vertical-service/dist ./services/universes/vertical-service/dist
COPY --from=builder /app/services/universes/vertical-service/prisma ./services/universes/vertical-service/prisma
# Copy the generated Prisma client (schema output = "../generated/prisma/client").
COPY --from=builder /app/services/universes/vertical-service/generated ./services/universes/vertical-service/generated

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3017

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3017/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/universes/vertical-service/dist/services/universes/vertical-service/src/main.js"]
