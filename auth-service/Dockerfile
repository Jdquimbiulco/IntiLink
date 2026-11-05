# ── Build stage ──────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build
# Copiar el SQL de migración al directorio dist
RUN mkdir -p dist/migrations && cp src/migrations/001_init.sql dist/migrations/

# ── Production stage ──────────────────────────────────────────
FROM node:20-alpine
WORKDIR /app
RUN apk add --no-cache openssl
COPY package*.json ./
RUN npm install --omit=dev
COPY --from=builder /app/dist ./dist
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod 700 ./docker-entrypoint.sh
EXPOSE 4000
CMD ["./docker-entrypoint.sh"]
