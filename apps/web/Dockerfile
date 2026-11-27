# Build stage
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS builder
WORKDIR /app

# Install pnpm
RUN for i in 1 2 3 4 5; do npm install -g pnpm@10.33.2 && break || (echo "Retry $i/5..." && sleep 10); done

# Copy all workspace files for pnpm to resolve dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml tsconfig.json ./
COPY packages ./packages
COPY apps/web/package.json ./apps/web/

# Install ALL dependencies (including dev for building)
RUN for i in 1 2 3 4 5; do pnpm install --frozen-lockfile && break || (echo "Retry $i/5..." && sleep 10); done

# Copy web app source
COPY apps/web/src ./apps/web/src
COPY apps/web/next.config.js ./apps/web/
COPY apps/web/postcss.config.js ./apps/web/
COPY apps/web/tailwind.config.js ./apps/web/
COPY apps/web/tsconfig.json ./apps/web/
# Copy public dir if it exists
COPY apps/web/public ./apps/web/public/

# Build application (API_GATEWAY_URL used at runtime by next.config.js rewrites)
ARG NEXT_PUBLIC_API_URL=http://localhost:3013
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @azeebo/web run build

# Production stage
FROM node:22.16.0-alpine@sha256:41e4389f3d988d2ed55392df4db1420ad048ae53324a8e2b7c6d19508288107e AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebotv/AzeeboPlus"
LABEL org.opencontainers.image.description="Azeebo+ Web App"
LABEL org.opencontainers.image.licenses="Proprietary"

# Create non-root user
RUN apk add --no-cache tini && \
    addgroup -g 65532 -S nodejs && \
    adduser -S nodejs -u 65532

COPY --chown=nodejs:nodejs --from=builder /app/apps/web/.next ./apps/web/.next
COPY --chown=nodejs:nodejs --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --chown=nodejs:nodejs --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --chown=nodejs:nodejs --from=builder /app/node_modules ./node_modules
COPY --chown=nodejs:nodejs --from=builder /app/package.json ./package.json

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

ENV PORT=4000
EXPOSE 4000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD node -e "fetch('http://localhost:4000').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Start application
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "node_modules/next/dist/bin/next", "start"]
