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
RUN pnpm run build -- --configuration production

# Vérifier les artefacts (même check que le CI)
RUN test -f browser/index.html || (echo "Le fichier index.html est manquant" && exit 1)

# ---- Stage 2 : Serveur statique ----
FROM nginx:alpine AS production

# Copier les artefacts du build Angular
COPY --from=build /app/browser /usr/share/nginx/html

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

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]