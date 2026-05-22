# ─── Stage 1 : Build ────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .
RUN npm run build

# ─── Stage 2 : Serve avec nginx ─────────────────────────────────────────────
FROM nginx:alpine

# Config nginx (SPA + proxy /api vers le backend)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Fichiers statiques buildés
COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
