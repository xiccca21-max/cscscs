# syntax=docker/dockerfile:1
FROM node:20-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# Нет .env в контексте сборки; prisma.config.ts требует DIRECT_URL только для загрузки конфига (generate к БД не ходит)
ENV DIRECT_URL="postgresql://postgres:postgres@127.0.0.1:5432/cs_ne_go?schema=public"
RUN npx prisma generate
RUN npm run build

# Зависимости Prisma+pg+dotenv для `npx prisma db push` и `tsx prisma/seed-*.ts` (Next standalone их не включает)
FROM builder AS seed-modules
RUN mkdir -p /opt/seed-modules && cd /app/node_modules && \
    cp -r '@prisma' dotenv \
      pg pg-cloudflare pg-connection-string pg-int8 pg-numeric \
      pg-pool pg-protocol pg-types pgpass \
      postgres postgres-array postgres-bytea postgres-date postgres-interval postgres-range \
      split2 xtend \
      /opt/seed-modules/

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=seed-modules --chown=nextjs:nodejs /opt/seed-modules/ ./node_modules/
# Standalone не копирует prisma/ — без этого `exec app npx prisma db push` не находит схему
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./prisma.config.ts
RUN npm install -g prisma@7.5.0 tsx@4.21.0
USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
CMD ["node", "server.js"]
