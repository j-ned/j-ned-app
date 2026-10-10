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
# and is reached directly from the client, except /api/storage/ (images) and
# /api/analytics/track (audience writes), relayed below.
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

# En-têtes helmet/CORS de l'API masqués sur chaque relais (Cache-Control, Content-Type, Content-Length gardés).
RUN cat > /etc/nginx/snippets/api-response-headers.conf <<'HEADERS'
proxy_hide_header Vary;
proxy_hide_header Set-Cookie;
proxy_hide_header X-Powered-By;
proxy_hide_header Access-Control-Allow-Origin;
proxy_hide_header Access-Control-Allow-Credentials;
proxy_hide_header Content-Security-Policy;
proxy_hide_header Cross-Origin-Opener-Policy;
proxy_hide_header Cross-Origin-Resource-Policy;
proxy_hide_header Origin-Agent-Cluster;
proxy_hide_header Referrer-Policy;
proxy_hide_header Strict-Transport-Security;
proxy_hide_header X-Content-Type-Options;
proxy_hide_header X-DNS-Prefetch-Control;
proxy_hide_header X-Download-Options;
proxy_hide_header X-Frame-Options;
proxy_hide_header X-Permitted-Cross-Domain-Policies;
proxy_hide_header X-XSS-Protection;
HEADERS

# Images servies depuis l'origine du site (pas de connexion TLS de plus vers api.) : nginx relaie
# /api/storage/ au service API par le réseau Docker. Le nom du service Dokploy est propre à
# l'environnement, d'où la variable surchargeable dans Dokploy ; seules les variables STORAGE_
# sont substituées dans le gabarit (les $variables nginx restent intactes).
ENV STORAGE_UPSTREAM=http://portfolio-jned-backend-oklc7p:3000 \
    NGINX_ENVSUBST_FILTER=STORAGE_

RUN mkdir -p /etc/nginx/templates /var/cache/nginx/storage \
 && cat > /etc/nginx/templates/default.conf.template <<'NGINX'
# `location` ignore la query string : c'est `?v=` qui distingue le sprite empreinté du nu.
map $arg_v $sprite_cache_control {
    ""      "public, max-age=0, must-revalidate";
    default "public, max-age=31536000, immutable";
}

# Images de l'API : clés empreintées (`<id>-<sha8>.avif`), donc cachables longtemps. La clé de
# cache ignore les paramètres sauf `variant` : une query string arbitraire ne peut ni remplir le
# cache ni contourner le relais.
proxy_cache_path /var/cache/nginx/storage levels=1:2 keys_zone=storage:10m max_size=1g inactive=30d use_temp_path=off;

server {
    listen 3000;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;
    server_tokens off;

    include /etc/nginx/snippets/security-headers.conf;

    # `Content-Type: text/html; charset=utf-8` (et text/xml, application/rss+xml) : sans charset,
    # les validateurs de flux et certains agrégateurs devinent l'encodage.
    charset utf-8;

    gzip on;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml application/rss+xml application/xml text/xml;
    gzip_min_length 1024;

    # Une URL inconnue est une vraie 404 : la coquille CSR (pas la home prérendue, ni son
    # <title>, son canonical et son état d'hydratation) avec le statut 404. Le routeur client
    # y affiche la page « non trouvée » ; une route ajoutée depuis le dernier build s'y affiche
    # aussi, le temps que le webhook Dokploy reconstruise l'image.
    error_page 404 /index.csr.html;

    # Cache immuable réservé aux URL qui changent avec le contenu ; tout autre fichier statique
    # est revalidé (ETag → 304), sinon un fichier modifié reste périmé un an chez le visiteur.

    # Chunks Angular : le nom porte le hash du contenu (regex entre guillemets à cause des `{}`)
    location ~ "^/(chunk|main|styles)-[A-Za-z0-9_-]{8}\.(js|css)$" {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    # Polices (version dans le nom) et visuels de démo (date de capture dans le nom)
    location ~ ^/(fonts|demos)/ {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "public, max-age=31536000, immutable" always;
        try_files $uri =404;
    }

    # Sprite d'icônes : immuable seulement via l'URL empreintée `?v=<SPRITE_VERSION>`
    location = /icons/sprite.svg {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control $sprite_cache_control always;
        try_files $uri =404;
    }

    location ~* \.(js|css|woff2?|ttf|otf|eot|png|jpe?g|gif|webp|avif|svg|ico)$ {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "public, max-age=0, must-revalidate" always;
        try_files $uri =404;
    }

    # `^~` : sans lui, la regex d'extensions ci-dessus capterait les `.avif` et chercherait un fichier.
    location ^~ /api/storage/ {
        include /etc/nginx/snippets/security-headers.conf;
        add_header X-Cache-Status $upstream_cache_status always;

        limit_except GET { deny all; }

        # Résolveur DNS de Docker, et upstream en variable : nginx démarre même si l'API est absente.
        resolver 127.0.0.11 valid=30s ipv6=off;
        set $storage_upstream ${STORAGE_UPSTREAM};
        proxy_pass $storage_upstream$uri$is_args$args;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        proxy_cache storage;
        proxy_cache_key "$uri|$arg_variant";
        proxy_cache_valid 200 365d;
        proxy_cache_valid 404 1m;
        proxy_cache_lock on;
        proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
        proxy_ignore_headers Set-Cookie Vary;

        include /etc/nginx/snippets/api-response-headers.conf;
    }

    # Mesure d'audience par l'origine du site : un beacon même origine part sans CORS ni pré-vol.
    location = /api/analytics/track {
        include /etc/nginx/snippets/security-headers.conf;

        limit_except POST { deny all; }
        client_max_body_size 4k;

        resolver 127.0.0.11 valid=30s ipv6=off;
        set $track_upstream ${STORAGE_UPSTREAM};
        proxy_pass $track_upstream$uri;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # XFF de Traefik tel quel ($proxy_add_x_forwarded_for ferait retenir une IP privée : mesure écartée).
        proxy_set_header X-Forwarded-For $http_x_forwarded_for;
        proxy_set_header Cookie "";
        proxy_set_header Authorization "";

        include /etc/nginx/snippets/api-response-headers.conf;
    }

    # Flux RSS : le type déclaré par les agrégateurs, pas le `text/xml` générique de l'extension
    location = /rss.xml {
        types { }
        default_type application/rss+xml;
        try_files $uri =404;
    }

    location ~ ^/offre-site-industrie/?$ {
        # Traefik termine le TLS devant : un Location absolu pointerait sur http://<host>:3000.
        absolute_redirect off;
        return 301 /offres/site-atelier$is_args$args;
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
