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

# ---- Stage 3 : Serveur statique + migration DB au démarrage ----
FROM nginx:alpine AS production

# Installer Node.js pour exécuter la migration Drizzle au démarrage
RUN apk add --no-cache nodejs npm

# Copier les artefacts du build Angular
COPY --from=build /app/dist/angular-portfolio-app /usr/share/nginx/html

# Copier le nécessaire pour db:push (Drizzle + schema + dépendances)
COPY --from=build /app/package.json /app/pnpm-lock.yaml /app/
COPY --from=build /app/node_modules /app/node_modules
COPY --from=build /app/server /app/server

# Configuration nginx pour le routing SPA (fallback vers index.html)
COPY <<'EOF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location ~* \.(?:css|js|woff2?|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF

# Script d'entrypoint : migration DB puis Nginx
COPY <<'SCRIPT' /docker-entrypoint-db.sh
#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  echo "Applying database schema..."
  cd /app && NODE_OPTIONS="--import tsx/esm" npx drizzle-kit push --config=server/drizzle.config.ts
  echo "Database schema applied successfully."
else
  echo "WARNING: DATABASE_URL not set, skipping database migration."
fi

exec nginx -g "daemon off;"
SCRIPT

RUN chmod +x /docker-entrypoint-db.sh

EXPOSE 80

ENTRYPOINT ["/docker-entrypoint-db.sh"]