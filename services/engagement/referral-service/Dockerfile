FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY services/engagement/referral-service/package.json ./services/engagement/referral-service/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY services/engagement/referral-service/src ./services/engagement/referral-service/src
COPY services/engagement/referral-service/tsconfig*.json ./services/engagement/referral-service/
COPY services/engagement/referral-service/prisma ./services/engagement/referral-service/prisma

RUN cd services/engagement/referral-service && npx prisma generate

RUN pnpm --filter @azeebo/referral-service run build

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Referral Service"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY services/engagement/referral-service/package.json ./services/engagement/referral-service/

COPY packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

COPY --from=builder /app/services/engagement/referral-service/dist ./services/engagement/referral-service/dist
COPY --from=builder /app/services/engagement/referral-service/prisma ./services/engagement/referral-service/prisma
# The compiled prisma.service.js resolves the generated client from
# dist/prisma/client. The workspace build script emits it there (schema
# output = "../src/prisma/client"); this COPY backstops it with the builder
# stage's fresh client so the image can never ship a stale or missing one
# even if the dist copy step were skipped.
COPY --from=builder /app/services/engagement/referral-service/src/prisma/client ./services/engagement/referral-service/dist/prisma/client

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 3025

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "fetch('http://localhost:3025/live').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "services/engagement/referral-service/dist/main.js"]
