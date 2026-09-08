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
# Stage 2 — Runtime : nginx static serve (prerendered + CSR fallback)
# Angular 21 outputs a request handler in server/server.mjs but no Node listener;
# this app is fully prerendered (or CSR for dynamic routes), so we serve the
# browser bundle as static files with SPA fallback to /index.html.
# NestJS backend lives on api.nedellec-julien.fr and is reached directly from the client.
# ==============================================================================
FROM nginx:alpine AS production

COPY --from=build /app/dist/angular-portfolio-app/browser /usr/share/nginx/html

RUN cat > /etc/nginx/conf.d/default.conf <<'NGINX'
server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    server_tokens off;

    # En-têtes de sécurité : Traefik ne pose que le TLS, le reste vient d'ici. La CSP complète
    # (script-src haché par page) vit dans la <meta> de chaque index.html ; frame-ancestors ne
    # peut être exprimé qu'en en-tête, d'où le second Content-Security-Policy.
    add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Content-Security-Policy "frame-ancestors 'none'" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=(), payment=(), usb=()" always;
    add_header Cross-Origin-Opener-Policy "same-origin" always;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/xml+rss;
    gzip_min_length 1024;

    # Hashed assets : long cache, immutable
    location ~* \.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico)$ {
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        add_header Strict-Transport-Security "max-age=63072000; includeSubDomains" always;
        add_header X-Content-Type-Options "nosniff" always;
        try_files $uri =404;
    }

    # SPA fallback : prerendered routes have their own index.html, others land on /index.html
    location / {
        try_files $uri $uri/index.html /index.html;
    }
}
NGINX

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/ >/dev/null || exit 1
