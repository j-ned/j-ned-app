# ---- Stage 1 : Build ----
FROM node:22-alpine AS build

# Installer pnpm (même version que le CI)
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

# Copier les fichiers de dépendances en premier (cache Docker)
COPY package.json pnpm-lock.yaml ./

# Installer les dépendances (identique au CI : --frozen-lockfile)
RUN pnpm install --frozen-lockfile

# Copier le reste du code source
COPY . .

# Vérifier le formatage (Prettier)
RUN pnpm run format:check

# Linter (ESLint)
RUN pnpm run lint

# Tests (Vitest)
RUN pnpm run test

# Build production Angular
RUN pnpm run build --configuration production

# Vérifier les artefacts (même check que le CI)
RUN test -f dist/angular-portfolio-app/index.html || (echo "Le fichier index.html est manquant" && exit 1)

# ---- Stage 2 : CLI (scripts serveur) ----
FROM node:22-alpine AS cli

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY --from=build /app/package.json /app/pnpm-lock.yaml ./
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/server ./server

ENTRYPOINT ["pnpm", "exec", "tsx"]

# ---- Stage 3 : Nginx + Hono API ----
FROM nginx:alpine AS production

# Installer Node.js pour l'API Hono et les migrations Drizzle
RUN apk add --no-cache nodejs npm

# Copier les artefacts du build Angular
COPY --from=build /app/dist/angular-portfolio-app /usr/share/nginx/html

# Pré-compresser les assets statiques en gzip (servis via gzip_static)
RUN find /usr/share/nginx/html -type f \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' \) \
    -exec gzip -9 -k {} \;

# Copier le serveur Hono + dépendances
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server /app/server

# Configuration nginx : SPA + proxy /api vers Hono
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # Allow file uploads up to 10MB
    client_max_body_size 10m;

    # Compression : fichiers pré-compressés (gzip -9 au build) + fallback dynamique
    gzip_static on;
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types
        text/plain
        text/css
        text/javascript
        application/javascript
        application/json
        application/xml
        image/svg+xml;

    # Security headers
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Proxy API vers le serveur Hono (^~ empêche les regex de prendre le dessus)
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Fichiers statiques hashés (CSS, JS) — cache immutable 1 an
    location ~* \.(?:css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Images et fonts — cache 30 jours (peuvent changer via S3)
    location ~* \.(?:woff2?|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # SPA fallback — index.html ne doit jamais être caché
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Script d'entrypoint : migration DB, démarrage Hono, puis Nginx
COPY <<'SCRIPT' /docker-entrypoint.sh
#!/bin/sh
set -e

# 1. Appliquer le schéma de la base de données
if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  cd /app && npx drizzle-kit push --config=server/drizzle.config.ts
  echo "Database schema applied successfully."
else
  echo "WARNING: DATABASE_URL not set, skipping database migration."
fi

# 2. Démarrer le serveur Hono en arrière-plan
echo "Starting Hono API server..."
cd /app && npx tsx server/index.ts &

# 3. Démarrer Nginx au premier plan
echo "Starting Nginx..."
exec nginx -g "daemon off;"
SCRIPT

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint.sh"]
