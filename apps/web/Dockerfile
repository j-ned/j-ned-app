# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1 — Sources et dépendances
# ==============================================================================
FROM node:26-alpine AS source

RUN npm install --global pnpm@10.33.2

# Contexte de build : la racine du monorepo (lockfile commun). Seuls les manifestes du workspace et
# de cette application entrent avant l'installation, pour garder la couche en cache.
WORKDIR /repo

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --filter @portfolio/web

COPY apps/web apps/web

WORKDIR /repo/apps/web

# ==============================================================================
# Stage 2 — Build : Angular (rendu serveur à la requête, prérendu des pages statiques, CSR)
# ==============================================================================
FROM source AS build

RUN pnpm run build --configuration production \
 && test -f dist/angular-portfolio-app/browser/index.csr.html \
 && test -f dist/angular-portfolio-app/server/server.mjs \
 && test -f dist/angular-portfolio-app/server/csp-manifest.json

# ==============================================================================
# Stage 3 — Dépendances d'exécution du bundle serveur : `jsdom` est externe
# (`externalDependencies` d'angular.json), importé par le rendu des articles.
# ==============================================================================
FROM node:26-alpine AS deps

RUN npm install --global pnpm@10.33.2

WORKDIR /repo

# `pnpm deploy` : node_modules autonome de cette seule application, depuis le lockfile commun.
# `--legacy` : sans lui, pnpm exige `injectWorkspacePackages` pour tout le workspace.
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml .npmrc ./
COPY apps/web/package.json apps/web/
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm --filter @portfolio/web deploy --prod --legacy --frozen-lockfile --ignore-scripts /app

# ==============================================================================
# Stage 4 — Runtime : nginx devant Node, dans la même image (HTML rendu et chunks hachés sortent
# du même build). nginx sert les fichiers (chunks, prérendu des pages statiques, coquille CSR),
# relaie /api/ à l'API (images en cache, mesure sans cookie, le reste tel quel), et ne transmet à Node (127.0.0.1:4000)
# que la liste fermée des routes de contenu, rendues à chaque requête depuis l'API.
# ==============================================================================
FROM nginx:alpine AS production

# Même Node que l'étage de build ; l'entrypoint officiel de nginx (gabarits envsubst) est conservé.
# Node tourne sous un utilisateur système sans shell (su-exec), nginx garde son modèle habituel.
COPY --from=node:26-alpine /usr/local/bin/node /usr/local/bin/node
RUN apk add --no-cache libatomic libstdc++ su-exec \
 && adduser -S -D -H -s /sbin/nologin ssr \
 && node --version

# L'image nginx livre sa page d'accueil et une page 50x : retirées, seul le build est servi.
RUN rm -rf /usr/share/nginx/html/*
COPY --from=build /repo/apps/web/dist/angular-portfolio-app/browser /usr/share/nginx/html
COPY --from=build /repo/apps/web/dist/angular-portfolio-app/server /app/server
COPY --from=deps /app/node_modules /app/node_modules

# En-têtes de sécurité : le proxy de bordure ne pose que le TLS, le reste vient d'ici. La CSP complète
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

# En-têtes helmet/CORS de l'API masqués sur chaque relais (Cache-Control, Content-Type, Content-Length,
# Set-Cookie gardés : seuls les relais des images et de la mesure retirent les cookies).
RUN cat > /etc/nginx/snippets/api-response-headers.conf <<'HEADERS'
proxy_hide_header Vary;
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

# Service API joint par le réseau Docker : relais nginx (images, mesure) et rendu Node. Seule
# API_UPSTREAM est substituée dans le gabarit (les $variables nginx restent intactes).
# VISITOR_IP_HEADER : l'en-tête que nginx écrit lui-même pour le rendu (snippet ci-dessous).
ENV API_UPSTREAM=http://api:3000 \
    NGINX_ENVSUBST_FILTER=API_UPSTREAM \
    VISITOR_IP_HEADER=x-real-ip

# Relais vers le rendu Node. Host forcé : Angular refuse tout hôte hors `allowedHosts` (SSRF) et
# l'URL d'API ne dérive jamais de la requête. Les en-têtes de proxy entrants sont vidés (Angular
# les ignore et le signale à chaque requête) ; l'IP du visiteur passe dans `X-Real-IP`, toujours
# réécrit ici (vide : en-tête retiré), jamais repris du client.
RUN cat > /etc/nginx/snippets/ssr-proxy.conf <<'PROXY'
proxy_pass http://127.0.0.1:4000;
proxy_http_version 1.1;
proxy_set_header Connection "";
proxy_set_header Host nedellec-julien.fr;
proxy_set_header Forwarded "";
proxy_set_header X-Forwarded-For "";
proxy_set_header X-Forwarded-Host "";
proxy_set_header X-Forwarded-Proto "";
proxy_set_header X-Forwarded-Port "";
proxy_set_header X-Forwarded-Prefix "";
proxy_set_header X-Real-IP $ssr_visitor;
proxy_connect_timeout 2s;
proxy_read_timeout 10s;
gzip_proxied any;
PROXY

# Micro-cache d'une seconde devant Node : une écriture admin reste visible au rechargement suivant
# (nginx compte en secondes entières : au plus 2 s), sans purge à déclencher, et une copie périmée est
# servie si Node ou l'API échoue (Node répond 503 quand l'amont tombe). Seuls 200 et 404 sont mis en
# cache, jamais une 503. Le Cache-Control de Node (`no-cache`, pour le navigateur) est ignoré ici,
# sinon nginx ne garderait rien.
RUN cat > /etc/nginx/snippets/ssr-cache.conf <<'CACHE'
proxy_cache ssr;
proxy_cache_key "$uri$is_args$args";
proxy_cache_valid 200 404 1s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_background_update off;
proxy_cache_lock on;
proxy_ignore_headers Cache-Control Expires Set-Cookie;
proxy_hide_header Set-Cookie;
add_header X-Cache-Status $upstream_cache_status always;
limit_req zone=ssr_render burst=50 nodelay;
CACHE

RUN mkdir -p /etc/nginx/templates /var/cache/nginx/storage /var/cache/nginx/ssr \
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

# HTML et flux rendus par Node : une entrée expirée reste sur disque (`inactive`) et n'est servie
# que si Node répond 5xx ou ne répond pas.
proxy_cache_path /var/cache/nginx/ssr levels=1:2 keys_zone=ssr:10m max_size=200m inactive=7d use_temp_path=off;

# Visiteur : tout le trafic public arrive par le tunnel Cloudflare, qui écrit lui-même
# `CF-Connecting-IP` (une valeur envoyée par le client y est remplacée) ; Traefik, derrière le tunnel,
# ne voit que l'adresse de cloudflared et l'écrit dans X-Forwarded-For. Sans l'en-tête de Cloudflare
# (accès par le réseau local), la dernière entrée de X-Forwarded-For, celle de Traefik (les entrées
# antérieures viennent du client et se forgent). Ce conteneur ne s'expose donc jamais sans ces proxys
# devant lui. Transmis à Node et à l'API, et clé du débit par visiteur sur les routes rendues (une
# query string arbitraire force un rendu) ; sans aucun en-tête, l'adresse de la connexion.
map $http_x_forwarded_for $forwarded_last {
    "~(?:^|,)\s*(?<last>[^,\s]+)\s*$" $last;
    default "";
}
map $http_cf_connecting_ip $ssr_visitor {
    "" $forwarded_last;
    default $http_cf_connecting_ip;
}
# Pays déduit de l'adresse par Cloudflare (`XX` : inconnu), transmis à l'API sous le nom qu'elle lit.
map $http_cf_ipcountry $visitor_country {
    "XX" "";
    "~^[A-Z][A-Z]$" $http_cf_ipcountry;
    default "";
}
map $ssr_visitor $ssr_client {
    ""      $binary_remote_addr;
    default $ssr_visitor;
}
limit_req_zone $ssr_client zone=ssr_render:10m rate=10r/s;
limit_req_status 429;

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
    # y affiche la page « non trouvée ». Les slugs inconnus des routes de contenu reçoivent leur
    # 404 du rendu Node ; une route ajoutée au code n'existe qu'après le déploiement de l'image.
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
    location ~ ^/fonts/ {
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
        set $storage_upstream ${API_UPSTREAM};
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
        proxy_hide_header Set-Cookie;

        include /etc/nginx/snippets/api-response-headers.conf;
    }

    # Mesure d'audience par l'origine du site : un beacon même origine part sans CORS ni pré-vol.
    location = /api/analytics/track {
        include /etc/nginx/snippets/security-headers.conf;

        limit_except POST { deny all; }
        client_max_body_size 4k;

        resolver 127.0.0.11 valid=30s ipv6=off;
        set $track_upstream ${API_UPSTREAM};
        proxy_pass $track_upstream$uri;
        proxy_http_version 1.1;
        proxy_set_header Connection "";

        # Adresse du visiteur seule : la chaîne reçue finit par une adresse privée (cloudflared), que
        # l'API retiendrait, et la mesure serait écartée. Pays : celui de Cloudflare, jamais un en-tête
        # du visiteur.
        proxy_set_header X-Forwarded-For $ssr_visitor;
        proxy_set_header X-Visitor-Country $visitor_country;
        proxy_set_header Cookie "";
        proxy_set_header Authorization "";
        proxy_hide_header Set-Cookie;

        include /etc/nginx/snippets/api-response-headers.conf;
    }

    # Reste de l'API, relayé par l'origine du site (ADR-0034) : pour le navigateur, site et API sont
    # une seule origine, donc ni CORS ni cookie partagé entre sous-domaines (cookie `__Host-`,
    # `SameSite=Strict`). `^~` : la regex d'extensions ne capte pas une URL d'API. Les relais plus
    # précis ci-dessus (images, mesure) gardent leur cache et leurs restrictions.
    location ^~ /api/ {
        include /etc/nginx/snippets/security-headers.conf;

        # Plus gros envoi accepté par l'API : un fichier de 4 Mo, plus l'enveloppe multipart.
        client_max_body_size 5m;

        resolver 127.0.0.11 valid=30s ipv6=off;
        set $api_upstream ${API_UPSTREAM};
        proxy_pass $api_upstream$request_uri;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_read_timeout 60s;

        # Adresse du visiteur seule : l'API retient la dernière entrée de l'en-tête.
        proxy_set_header X-Forwarded-For $ssr_visitor;
        proxy_set_header X-Visitor-Country $visitor_country;

        include /etc/nginx/snippets/api-response-headers.conf;
    }

    # Offres et prise de rendez-vous retirées (spec 029) : 410 Gone, qui désindexe plus vite qu'un
    # 404 et dit que la page ne reviendra pas. Le corps est le shell client (page introuvable), servi
    # avec ce même statut.
    location ~ ^/(offres|offre-site-industrie|rendez-vous)(/|$) {
        error_page 410 /index.csr.html;
        return 410;
    }

    # Routes rendues côté client (RenderMode.Client dans app.routes.server.ts) : coquille CSR, 200.
    # `no-cache` : sans lui, le navigateur garde l'ancienne coquille (cache heuristique sur
    # Last-Modified) et charge l'ancien bundle après un déploiement.
    location ~ ^/(login|two-factor|admin)(/|$) {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "no-cache" always;
        try_files /index.csr.html =404;
    }

    # Routes rendues à chaque requête (RenderMode.Server dans app.routes.server.ts), liste fermée :
    # une URL inconnue (scanners, /wp-login.php) ne réveille pas Node et garde le 404 ci-dessus.
    location ~ ^/(about|projects(/[^/]+)?|blog(/[^/]+)?|atelier(/(plaquettes|decodeur))?)?/?$ {
        limit_except GET { deny all; }
        include /etc/nginx/snippets/security-headers.conf;
        include /etc/nginx/snippets/ssr-proxy.conf;
        include /etc/nginx/snippets/ssr-cache.conf;
    }

    # Sitemap et flux RSS rendus à la requête depuis l'API, avec le même micro-cache.
    location ~ ^/(sitemap|rss)\.xml$ {
        limit_except GET { deny all; }
        include /etc/nginx/snippets/security-headers.conf;
        include /etc/nginx/snippets/ssr-proxy.conf;
        include /etc/nginx/snippets/ssr-cache.conf;
    }

    # Sonde du conteneur : nginx et Node vivants, sans appel à l'API.
    location = /healthz {
        include /etc/nginx/snippets/ssr-proxy.conf;
    }

    # Routes prérendues : leur propre index.html ; sinon 404 (corps : la coquille CSR). Même
    # revalidation que la coquille : une page ou une 404 en cache chargerait un bundle périmé.
    location / {
        include /etc/nginx/snippets/security-headers.conf;
        add_header Cache-Control "no-cache" always;
        try_files $uri $uri/index.html =404;
    }
}
NGINX

# Node et nginx tournent ensemble : si l'un meurt, le conteneur sort en erreur et sa politique de
# redémarrage le relance. À l'arrêt, chacun finit ses requêtes en cours : TERM pour Node (fermeture de
# l'écouteur), QUIT pour nginx (arrêt gracieux, TERM serait l'arrêt rapide).
RUN cat > /usr/local/bin/start.sh <<'START' && chmod +x /usr/local/bin/start.sh
#!/bin/sh
stopping=0
NODE_OPTIONS=--max-old-space-size=256 su-exec ssr node /app/server/server.mjs &
node_pid=$!
/docker-entrypoint.sh nginx -g 'daemon off;' &
nginx_pid=$!
trap 'stopping=1' TERM INT
while [ "$stopping" = 0 ] && kill -0 "$node_pid" 2>/dev/null && kill -0 "$nginx_pid" 2>/dev/null; do
  sleep 1
done
# Arrêt gracieux des deux : QUIT seul pour nginx (TERM l'arrêterait net), borné à 8 s (sous les
# 10 s de délai d'arrêt de Docker), puis KILL.
kill -QUIT "$nginx_pid" 2>/dev/null
kill -TERM "$node_pid" 2>/dev/null
(sleep 8; kill -KILL "$nginx_pid" "$node_pid" 2>/dev/null) &
wait "$nginx_pid" "$node_pid"
[ "$stopping" = 1 ] && exit 0
exit 1
START

EXPOSE 3000

STOPSIGNAL SIGTERM

ENTRYPOINT []
CMD ["/usr/local/bin/start.sh"]

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O - http://127.0.0.1:3000/healthz >/dev/null || exit 1
