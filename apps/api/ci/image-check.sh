#!/usr/bin/env bash
# Juge l'image de l'API devant un Postgres jetable : migrations appliquées par l'image (rejouées une
# seconde fois sans effet), démarrage en production déclarée, sonde `/api/health`, arrêt propre.
# Même script en CI et en local, après `docker build -f apps/api/Dockerfile -t j-ned-app-api:ci .`.
#   apps/api/ci/image-check.sh [image]
set -euo pipefail

IMAGE="${1:-j-ned-app-api:ci}"
NETWORK=portfolio-api-image-ci
DB=portfolio-api-image-db
API=portfolio-api-image
PORT=3190

cleanup() {
  docker rm -f "$API" "$DB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}
trap cleanup EXIT
cleanup

# S3 et Resend ne sont joints qu'à l'usage : seules leurs variables sont exigées au démarrage.
ENV_ARGS=(
  -e "DATABASE_URL=postgres://postgres:it@$DB:5432/portfolio"
  -e "JWT_SECRET=$(openssl rand -hex 32)"
  -e APP_ENV=production
  -e CORS_ORIGINS=https://nedellec-julien.fr
  -e S3_ENDPOINT=http://s3.invalid:9000 -e S3_REGION=auto
  -e S3_ACCESS_KEY=image-check -e S3_SECRET_KEY=image-check-secret
  -e RESEND_API_KEY=re_image_check -e MAIL_FROM=image-check@parity.test
)

docker network create "$NETWORK" >/dev/null
docker run -d --name "$DB" --network "$NETWORK" \
  -e POSTGRES_PASSWORD=it -e POSTGRES_DB=portfolio postgres:17-alpine >/dev/null
for _ in $(seq 1 60); do
  if docker exec "$DB" psql -U postgres -d portfolio -c 'select 1' >/dev/null 2>&1; then break; fi
  sleep 1
done

for _ in 1 2; do
  docker run --rm --network "$NETWORK" "${ENV_ARGS[@]}" "$IMAGE" node dist/database/scripts/migrate.js
done

docker run -d --name "$API" --network "$NETWORK" -p "127.0.0.1:$PORT:3000" "${ENV_ARGS[@]}" "$IMAGE" >/dev/null
for _ in $(seq 1 60); do
  if curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null 2>&1; then break; fi
  sleep 1
done
curl -fsS "http://127.0.0.1:$PORT/api/health" >/dev/null || {
  echo "API non prête après 60 s" >&2
  docker logs "$API" >&2 || true
  exit 1
}
test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:$PORT/api/projects")" = "200" || {
  echo "/api/projects ne répond pas 200 sur une base migrée" >&2
  exit 1
}
test "$(docker exec "$API" id -un)" = "node" || { echo "API lancée en root" >&2; exit 1; }

docker stop "$API" >/dev/null
test "$(docker inspect "$API" --format '{{.State.ExitCode}}')" = "0" || {
  echo "arrêt non propre sur SIGTERM" >&2
  docker logs "$API" >&2 || true
  exit 1
}
echo "Image $IMAGE : migrations, santé et arrêt propre vérifiés."
