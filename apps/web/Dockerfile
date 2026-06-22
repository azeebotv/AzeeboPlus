# Build stage
FROM node:20.11.1-alpine3.19 AS builder
WORKDIR /app

# Install pnpm
RUN apk add --no-cache curl && \
    for i in 1 2 3 4 5; do npm install -g pnpm@9.15.0 @nestjs/cli prisma@5.22.0 && break || (echo "Retry $i/5..." && sleep 10); done

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
ARG NEXT_PUBLIC_API_URL=http://localhost:4000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_URL
RUN pnpm --filter @azeebo/web run build

# Production stage
FROM node:20.11.1-alpine3.19 AS runner
WORKDIR /app

LABEL org.opencontainers.image.source="https://github.com/azeebo/azeebo-plus"
LABEL org.opencontainers.image.description="Azeebo+ Web App"
LABEL org.opencontainers.image.licenses="Proprietary"

# Install runtime dependencies only
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY --from=builder /app/apps/web/.next ./apps/web/.next
COPY --from=builder /app/apps/web/package.json ./apps/web/package.json
COPY --from=builder /app/apps/web/next.config.js ./apps/web/next.config.js
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Change ownership
RUN chown -R nodejs:nodejs /app

# Switch to non-root user
USER nodejs

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
    CMD wget --no-verbose --tries=1 --spider http://localhost:3000 || exit 1

# Start application
CMD ["node", "node_modules/next/dist/bin/next", "start"]
