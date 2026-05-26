# Build stage
FROM node:20-alpine AS builder
WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy all workspace files for pnpm to resolve dependencies
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY packages ./packages
COPY services ./services
COPY apps/web ./apps/web

# Install ALL dependencies (including dev for building)
RUN pnpm install

# Copy source
COPY . .

# Build application
RUN pnpm --filter web build

# Production stage
FROM node:20-alpine AS runner
WORKDIR /app

# Install runtime dependencies only
RUN apk add --no-cache curl

# Create non-root user
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001

COPY package.json pnpm-lock.yaml ./
RUN npm install -g pnpm
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/public ./public
COPY --from=builder /app/node_modules ./node_modules

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
