FROM node:22.16.0-alpine AS builder
WORKDIR /app

RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Workspace packages ship dist-based exports (dist is gitignored), so build
# them before the app: tsc resolves @azeebo/* to packages/*/dist. Excluded:
# test-utils (needs @prisma/client generation) and contract-tests (its src is
# 100% *.spec.ts files, which .dockerignore strips from the context).
RUN pnpm -r --filter './packages/**' --filter '!@azeebo/test-utils' --filter '!@azeebo/contract-tests' run build

COPY apps/admin/src ./apps/admin/src
COPY apps/admin/client ./apps/admin/client
COPY apps/admin/tsconfig*.json ./apps/admin/
COPY apps/admin/prisma ./apps/admin/prisma

RUN i=0; until pnpm --filter @azeebo/admin prisma:generate; do \
      i=$((i+1)); \
      [ "$i" -ge 5 ] && echo "prisma generate failed 5 times" && exit 1; \
      echo "Retry prisma generate $i/5..."; sleep 15; \
    done
RUN pnpm --filter @azeebo/admin run build:client
RUN pnpm --filter @azeebo/admin run build

FROM node:22.16.0-alpine AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Admin Panel"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/admin/package.json ./apps/admin/

# Copy the BUILT packages (dist included) from the builder; the source tree's
# dist is gitignored and never lands in the context. .npmrc's
# shamefully-hoist is what lets the app resolve transitive deps from the root
# node_modules.
COPY --from=builder /app/packages ./packages

RUN for i in 1 2 3 4 5; do pnpm install --prod --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Re-apply the built packages AFTER the prod install: pnpm --prod rewires the
# workspace symlinks and, depending on the platform, can prune the packages'
# dist output. The app resolves @azeebo/* through node_modules symlinks that
# point back into ./packages, so the dist must be present in the final image.
COPY --from=builder /app/packages ./packages

RUN test -f packages/security/dist/index.js && test -f packages/feature-flags/dist/index.js

COPY --from=builder /app/apps/admin/dist ./apps/admin/dist
COPY --from=builder /app/apps/admin/client/dist ./apps/admin/client/dist
COPY --from=builder /app/apps/admin/prisma ./apps/admin/prisma
# The generated Prisma client is plain JS (index.js + engines) that tsc does
# not emit into dist/generated, yet the compiled code requires
# '../generated/prisma' relative to dist — so copy it there, not src/generated.
COPY --from=builder /app/apps/admin/src/generated ./apps/admin/dist/generated

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4016

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:4016/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/admin/dist/main.js"]
