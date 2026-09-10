# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1 — Build : Angular prerender + CSR
# ==============================================================================
FROM node:22-alpine AS build

RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile

COPY . .
RUN pnpm run build --configuration production \
 && test -f dist/angular-portfolio-app/browser/index.html

# ==============================================================================
# Stage 2 — Runtime : nginx static serve (prerendered + CSR shell)
# Angular 22 (outputMode server) emits a request handler but no Node listener; every public
# route is prerendered at build (index.html per route) and the rest is client-rendered from
# index.csr.html, the shell without hydration state. NestJS lives on api.nedellec-julien.fr
# and is reached directly from the client.
# ==============================================================================
FROM nginx:alpine AS production

COPY --from=build /app/dist/angular-portfolio-app/browser /usr/share/nginx/html

# En-têtes de sécurité : Traefik ne pose que le TLS, le reste vient d'ici. La CSP complète
# (script-src haché par page) vit dans la <meta> de chaque page ; frame-ancestors ne peut être
# exprimé qu'en en-tête, d'où le second Content-Security-Policy. Un `add_header` dans une
# `location` annule ceux du `server` (héritage non cumulatif) : le snippet est inclus partout.
RUN mkdir -p /etc/nginx/snippets && cat > /etc/nginx/snippets/security-headers.conf <<'HEADERS'
add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "DENY" always;
add_header Content-Security-Policy "frame-ancestors 'none'" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
HEADERS

RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    server_tokens off;

    include /etc/nginx/snippets/security-headers.conf;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml+rss;
    gzip_min_length 1024;

    # Une URL inconnue est une vraie 404 : la coquille CSR (pas la home prérendue, ni son
    # <title>, son canonical et son état d'hydratation) avec le statut 404. Le routeur client
    # y affiche la page « non trouvée » ; une route ajoutée depuis le dernier build s'y affiche
    # aussi, le temps que le webhook Dokploy reconstruise l'image.
    error_page 404 /index.csr.html;

    # Hashed assets : long cache, immutable
    location ~* \.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico)$ {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    # Routes rendues côté client (RenderMode.Client dans app.routes.server.ts) : coquille CSR, 200
    location ~ ^/(login|two-factor|admin)(/|$) {
        try_files /index.csr.html =404;
    }

    # Routes prérendues : leur propre index.html ; sinon 404
    location / {
        try_files $uri $uri/index.html =404;
    }
}
NGINX

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/ >/dev/null || exit 1
