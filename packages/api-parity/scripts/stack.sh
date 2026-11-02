#!/usr/bin/env bash
# Pile de la suite de parité : une image d'API (Nest aujourd'hui, Hono demain) devant un Postgres jetable,
# en mode production, avec un admin créé pour l'occasion. Même script pour la CI et le poste local.
#   scripts/stack.sh up [image]   (défaut : nest-portfolio-app:ci)
#   scripts/stack.sh down
# `up` écrit l'URL et les identifiants dans `.parity-env` (ignoré par Git), lu par la suite.
set -euo pipefail

NETWORK=api-parity
DB=api-parity-db
API=api-parity-api
API_PORT=3100
DB_PORT=55439
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
ENV_FILE="$HERE/.parity-env"

down() {
  docker rm -f "$API" "$DB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
  rm -f "$ENV_FILE"
}

up() {
  local image="${1:-nest-portfolio-app:ci}"
  down
  local db_url="postgres://parity:parity@$DB:5432/parity"
  local admin_email="admin@parity.test"
  local admin_password
  admin_password="parity-$(openssl rand -hex 16)"

  docker network create "$NETWORK" >/dev/null
  docker run -d --name "$DB" --network "$NETWORK" -p "127.0.0.1:$DB_PORT:5432" \
    -e POSTGRES_USER=parity -e POSTGRES_PASSWORD=parity -e POSTGRES_DB=parity \
    postgres:17-alpine >/dev/null
  for _ in $(seq 1 30); do
    docker exec "$DB" pg_isready -U parity -d parity >/dev/null 2>&1 && break
    sleep 1
  done

  # S3 et Resend ne sont joints qu'à l'usage : la suite n'envoie ni fichier valide ni message.
  docker run -d --name "$API" --network "$NETWORK" -p "127.0.0.1:$API_PORT:3000" \
    -e DATABASE_URL="$db_url" \
    -e JWT_SECRET="$(openssl rand -hex 32)" \
    -e CORS_ORIGINS=https://nedellec-julien.fr \
    -e S3_ENDPOINT=http://s3.invalid:9000 -e S3_REGION=auto \
    -e S3_ACCESS_KEY=parity -e S3_SECRET_KEY=parity-secret \
    -e RESEND_API_KEY=re_parity -e MAIL_FROM=parity@parity.test \
    "$image" >/dev/null

  for _ in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null || {
    echo "API non prête après 60 s" >&2
    docker logs "$API" >&2 || true
    return 1
  }

  # Migrations appliquées par l'image au démarrage ; l'admin est créé par le seed du dépôt.
  DATABASE_URL="postgres://parity:parity@127.0.0.1:$DB_PORT/parity" \
    ADMIN_EMAIL="$admin_email" ADMIN_INITIAL_PASSWORD="$admin_password" \
    pnpm --dir "$HERE/../../apps/api" --silent db:seed

  umask 077
  cat >"$ENV_FILE" <<EOF
PARITY_API_URL=http://127.0.0.1:$API_PORT
PARITY_ADMIN_EMAIL=$admin_email
PARITY_ADMIN_PASSWORD=$admin_password
EOF
  echo "Pile de parité prête : http://127.0.0.1:$API_PORT ($image)"
}

case "${1:-}" in
  up) up "${2:-}" ;;
  down) down ;;
  *)
    echo "usage: $0 up [image] | down" >&2
    exit 2
    ;;
esac
