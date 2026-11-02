#!/usr/bin/env bash
# Pile de la suite de parité, sans conteneur : l'API construite (`apps/api`, `pnpm build`) lancée par Node en
# mode production devant une base jetable, migrations appliquées et admin créé pour l'occasion.
# Même script en CI (service Postgres du job) et en local (`pnpm --filter @portfolio/api db:up`).
#   PARITY_DATABASE_URL=postgres://… scripts/stack.sh up
#   scripts/stack.sh down
# La base doit exister et être vide. `up` écrit l'URL et les identifiants dans `.parity-env` (ignoré par
# Git), lu par la suite.
set -euo pipefail

API_PORT=3100
HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
API_DIR="$HERE/../../apps/api"
ENV_FILE="$HERE/.parity-env"
PID_FILE="$HERE/.parity-api.pid"
LOG_FILE="$HERE/.parity-api.log"

down() {
  if [ -f "$PID_FILE" ]; then
    kill "$(cat "$PID_FILE")" 2>/dev/null || true
    rm -f "$PID_FILE"
  fi
  rm -f "$ENV_FILE"
}

up() {
  : "${PARITY_DATABASE_URL:?PARITY_DATABASE_URL manquant (base Postgres vide dédiée à la suite)}"
  down
  test -f "$API_DIR/dist/main.js" || { echo "API non construite : pnpm --filter @portfolio/api build" >&2; return 1; }
  local admin_email="admin@parity.test"
  local admin_password
  admin_password="parity-$(openssl rand -hex 16)"

  DATABASE_URL="$PARITY_DATABASE_URL" pnpm --dir "$API_DIR" --silent db:migrate

  # S3 et Resend ne sont joints qu'à l'usage : la suite n'envoie ni fichier valide ni message.
  (
    cd "$API_DIR"
    NODE_ENV=production PORT="$API_PORT" \
      DATABASE_URL="$PARITY_DATABASE_URL" \
      JWT_SECRET="$(openssl rand -hex 32)" \
      CORS_ORIGINS=https://nedellec-julien.fr \
      S3_ENDPOINT=http://s3.invalid:9000 S3_REGION=auto \
      S3_ACCESS_KEY=parity S3_SECRET_KEY=parity-secret \
      RESEND_API_KEY=re_parity MAIL_FROM=parity@parity.test \
      nohup node dist/main.js >"$LOG_FILE" 2>&1 &
    echo $! >"$PID_FILE"
  )

  for _ in $(seq 1 60); do
    if curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fsS "http://127.0.0.1:$API_PORT/api/health" >/dev/null || {
    echo "API non prête après 60 s" >&2
    cat "$LOG_FILE" >&2 || true
    return 1
  }

  DATABASE_URL="$PARITY_DATABASE_URL" \
    ADMIN_EMAIL="$admin_email" ADMIN_INITIAL_PASSWORD="$admin_password" \
    pnpm --dir "$API_DIR" --silent db:seed

  umask 077
  cat >"$ENV_FILE" <<EOF
PARITY_API_URL=http://127.0.0.1:$API_PORT
PARITY_ADMIN_EMAIL=$admin_email
PARITY_ADMIN_PASSWORD=$admin_password
EOF
  echo "Pile de parité prête : http://127.0.0.1:$API_PORT (journal : $LOG_FILE)"
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  *)
    echo "usage: PARITY_DATABASE_URL=… $0 up | $0 down" >&2
    exit 2
    ;;
esac
