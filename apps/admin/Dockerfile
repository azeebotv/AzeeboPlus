# Azeebo+ Admin Panel — single-stage image.
#
# The repo's .dockerignore excludes **/dist/ from the build context, and the
# workspace packages ship dist-based exports (dist is gitignored). The dist
# must therefore be BUILT inside the image — cross-stage COPY of the built
# packages has proven unreliable here (the dist never reaches the runtime
# stage), so this is a single stage: install, build packages, build the app,
# all in the final image.
FROM node:22.16.0-alpine AS app

WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Admin Panel"
LABEL org.opencontainers.image.licenses="Proprietary"

RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532 && \
    for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json .npmrc ./
COPY packages ./packages
COPY apps/admin/package.json ./apps/admin/

RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Build the workspace packages BEFORE the app: tsc resolves @azeebo/* to
# packages/*/dist. Excluded: test-utils (needs @prisma/client generation) and
# contract-tests (its src is 100% *.spec.ts files, which .dockerignore strips
# from the context).
RUN pnpm -r --filter './packages/**' --filter '!@azeebo/test-utils' --filter '!@azeebo/contract-tests' run build


COPY apps/admin/src ./apps/admin/src
COPY apps/admin/client ./apps/admin/client
COPY apps/admin/tsconfig*.json ./apps/admin/
COPY apps/admin/prisma ./apps/admin/prisma

# The admin build script itself runs `prisma generate` (prebuild), which emits
# the generated client into apps/admin/src/generated.
RUN pnpm --filter @azeebo/admin run build:client
RUN pnpm --filter @azeebo/admin run build

# The generated Prisma client is plain JS (index.js + engines) that tsc does
# not emit into dist/generated, yet the compiled code requires
# '../generated/prisma' relative to dist — so copy it there in the image.
RUN cp -r apps/admin/src/generated apps/admin/dist/generated

# Fail fast if the workspace dist is missing from the final image.
RUN test -f packages/security/dist/index.js && test -f packages/feature-flags/dist/index.js

RUN chown -R nodejs:nodejs /app

USER nodejs

EXPOSE 4016

HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:4016/v1/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "apps/admin/dist/main.js"]
