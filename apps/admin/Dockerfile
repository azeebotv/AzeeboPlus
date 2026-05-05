FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install -g pnpm && pnpm install

COPY . .
RUN pnpm prisma generate
RUN pnpm build

FROM node:20-alpine AS production

WORKDIR /app

RUN addgroup -g 1001 -S nodejs && adduser -S nestjs -u 1001

COPY --from=builder --chown=nestjs:nodejs /app/dist ./dist
COPY --from=builder --chown=nestjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nestjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nestjs:nodejs /app/package.json ./

USER nestjs

EXPOSE 3016

CMD ["node", "dist/main.js"]
