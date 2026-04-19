# syntax=docker/dockerfile:1.7

# ==============================================================================
# Stage 1 — Build : Angular SSR prerender + bundle API + migrations SQL
# ==============================================================================
FROM node:22-alpine AS build

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

# Couche cachée : installation des dépendances (--ignore-scripts évite husky)
COPY package.json pnpm-lock.yaml ./
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts \
 && pnpm rebuild argon2 esbuild

# Sources + build (Angular SSR prerender + esbuild bundle + SQL migrations)
COPY . .
RUN pnpm run build --configuration production \
 && pnpm run build:api \
 && pnpm run db:generate \
 && test -f dist/angular-portfolio-app/browser/index.html \
 && test -f dist/server/index.mjs

# ==============================================================================
# Stage 2 — Production dependencies (argon2 native + drizzle-orm pour migrations)
# ==============================================================================
FROM node:22-alpine AS prod-deps

RUN apk add --no-cache python3 make g++
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

WORKDIR /app

COPY package.json pnpm-lock.yaml ./
# --ignore-scripts : évite le prepare script (husky devDep absent en prod)
# Puis on rebuild les natifs (argon2 + sharp)
RUN --mount=type=cache,id=pnpm-store,target=/root/.local/share/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts \
 && pnpm rebuild argon2 sharp

# ==============================================================================
# Stage 2b — Compile ngx_brotli pour nginx:alpine (modules dynamiques .so)
# Aligné sur la même version nginx que la stage production ci-dessous.
# ==============================================================================
FROM nginx:alpine AS nginx-brotli-modules

RUN apk add --no-cache --virtual .build \
      git build-base linux-headers pcre2-dev zlib-dev openssl-dev wget \
 && NGX_VER="$(nginx -v 2>&1 | sed 's|.*/||')" \
 && wget -qO- "https://nginx.org/download/nginx-${NGX_VER}.tar.gz" | tar xz -C /tmp \
 && git clone --depth=1 https://github.com/google/ngx_brotli.git /tmp/ngx_brotli \
 && (cd /tmp/ngx_brotli && git submodule update --init --recursive --depth=1) \
 && cd "/tmp/nginx-${NGX_VER}" \
 && ./configure --with-compat --add-dynamic-module=/tmp/ngx_brotli > /dev/null \
 && make -j"$(nproc)" modules \
 && mkdir -p /modules && cp objs/ngx_http_brotli_*.so /modules/

# ==============================================================================
# Stage 3 — Production : nginx statiques + Hono API bundle + migrations runtime
# ==============================================================================
FROM nginx:alpine AS production

# Modules brotli compilés à côté + libs runtime
COPY --from=nginx-brotli-modules /modules/ /etc/nginx/modules/

# Node minimal pour l'API et les migrations + libs brotli runtime pour nginx.
# brotli CLI en virtual (.brotli-build) pour précompresser puis retiré.
# load_module doit être en contexte main (avant events/http) : on prepend proprement.
RUN apk add --no-cache nodejs brotli-libs \
 && apk add --no-cache --virtual .brotli-build brotli \
 && { echo 'load_module /etc/nginx/modules/ngx_http_brotli_filter_module.so;'; \
      echo 'load_module /etc/nginx/modules/ngx_http_brotli_static_module.so;'; \
      cat /etc/nginx/nginx.conf; } > /tmp/nginx.conf \
 && mv /tmp/nginx.conf /etc/nginx/nginx.conf

# Artefacts Angular prerenderés + précompression (gzip + brotli) offline
COPY --from=build /app/dist/angular-portfolio-app/browser /usr/share/nginx/html
RUN find /usr/share/nginx/html -type f \
    \( -name '*.js' -o -name '*.css' -o -name '*.html' -o -name '*.svg' -o -name '*.json' \) \
    -exec sh -c 'gzip -9 -k "$1" && brotli -q 11 -k "$1"' _ {} \; \
 && apk del .brotli-build \
 && rm -rf /var/cache/apk/* /tmp/*

# Bundle API + migrations SQL + prod deps
COPY --from=build /app/dist/server/index.mjs /app/api.mjs
COPY --from=build /app/server/db/migrations /app/migrations
COPY --from=prod-deps /app/node_modules /app/node_modules

# Runner de migrations minimal (utilise drizzle-orm déjà en prod deps)
COPY <<'MIGRATE' /app/migrate.mjs
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { drizzle } from 'drizzle-orm/postgres-js';
import { migrate } from 'drizzle-orm/postgres-js/migrator';
import postgres from 'postgres';

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is required');
  process.exit(1);
}

const MIGRATIONS_DIR = '/app/migrations';
const client = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(client);

// Baseline: si des tables publiques existent mais __drizzle_migrations est vide
// (drift typique d'un drizzle-kit push initial basculé vers migrate), stamper les
// migrations déjà dans l'image comme appliquées. created_at = when + 1 pour éviter
// la comparaison d'égalité bugguée dans drizzle-orm 0.45.
async function baselineIfNeeded() {
  await client.unsafe('CREATE SCHEMA IF NOT EXISTS drizzle');
  await client.unsafe(
    'CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (id SERIAL PRIMARY KEY, hash text NOT NULL, created_at bigint)',
  );

  const stamped = await client`SELECT 1 FROM drizzle.__drizzle_migrations LIMIT 1`;
  if (stamped.length > 0) return;

  const publicTables = await client`SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' LIMIT 1`;
  if (publicTables.length === 0) return;

  const journal = JSON.parse(readFileSync(`${MIGRATIONS_DIR}/meta/_journal.json`, 'utf8'));
  console.log(`Baselining ${journal.entries.length} existing migration(s)…`);
  for (const entry of journal.entries) {
    const sql = readFileSync(`${MIGRATIONS_DIR}/${entry.tag}.sql`, 'utf8');
    const hash = createHash('sha256').update(sql).digest('hex');
    await client`INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES (${hash}, ${entry.when + 1})`;
  }
}

try {
  await baselineIfNeeded();
  console.log('Applying migrations…');
  await migrate(db, { migrationsFolder: MIGRATIONS_DIR });
  console.log('Migrations applied.');
} catch (err) {
  console.error('Migration failed:', err);
  process.exit(1);
} finally {
  await client.end();
}
MIGRATE

# Nginx config : SPA prerender + proxy /api + sitemap dynamique
COPY <<'NGINXCONF' /etc/nginx/conf.d/default.conf
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    client_max_body_size 10m;

    # Compression statique : sert les .br et .gz précompressés (build-time, niveau max)
    brotli_static on;
    gzip_static on;

    # Fallback compression dynamique pour les réponses non précompressées (API proxy)
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_min_length 256;
    gzip_types text/plain text/css text/javascript application/javascript application/json application/xml image/svg+xml;

    # Security headers (HTTPS/HSTS géré par Traefik/Dokploy en amont)
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;

    # Proxy API → Hono sur :3000
    location ^~ /api/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Sitemap dynamique
    location = /sitemap.xml {
        proxy_pass http://127.0.0.1:3000/api/sitemap.xml;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Assets hashés : cache immutable 1 an
    location ~* \.(?:css|js)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Médias : cache 30 jours
    location ~* \.(?:woff2?|svg|png|jpg|jpeg|gif|ico|webp|avif)$ {
        expires 30d;
        add_header Cache-Control "public";
    }

    # Routes prerender + fallback CSR
    location / {
        add_header Cache-Control "no-cache, no-store, must-revalidate";
        try_files $uri $uri/ $uri.html $uri/index.html /index.csr.html;
    }
}
NGINXCONF

# Entrypoint : migrations → API (background) → Nginx (foreground)
COPY <<'ENTRY' /docker-entrypoint.sh
#!/bin/sh
set -e

if [ -n "$DATABASE_URL" ]; then
  node /app/migrate.mjs
else
  echo "WARN: DATABASE_URL missing — skipping migrations."
fi

echo "Starting Hono API on :3000…"
node /app/api.mjs &
API_PID=$!

# Propager les signaux proprement
trap "kill -TERM $API_PID; exit 0" TERM INT

echo "Starting Nginx on :80…"
exec nginx -g "daemon off;"
ENTRY

RUN chmod +x /docker-entrypoint.sh

EXPOSE 80

# 127.0.0.1 explicite : sur Alpine, `localhost` résout parfois en ::1 (IPv6)
# alors que nginx n'écoute qu'en IPv4, ce qui fait échouer le healthcheck.
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

ENTRYPOINT ["/docker-entrypoint.sh"]
