#!/usr/bin/env bash
# Pile du smoke test de l'image du site : le conteneur (nginx devant Node) sur :3000, devant la
# doublure de l'API, sur un réseau dédié. Même script en CI et en local, après
# `docker build -f apps/web/Dockerfile -t j-ned-app-web:ci .` depuis la racine du monorepo.
#   ci/image-stack.sh up [image] | down | stop-stub | restart-stub
set -euo pipefail

CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
NETWORK=portfolio-image-ci
APP=portfolio-image
STUB=portfolio-image-api-stub
SITE=http://127.0.0.1:3000

start_stub() {
  docker run -d --name "$STUB" --network "$NETWORK" --network-alias api-stub \
    -e STUB_ADMIN_SESSION=1 -v "$CI_DIR/api-stub:/stub:ro" \
    node:26-alpine node /stub/server.mjs >/dev/null
}

# `rm -f` tue tout de suite : `docker stop` attendrait 10 s que la doublure ignore SIGTERM.
stop_stub() {
  docker rm -f "$STUB" >/dev/null 2>&1 || true
}

wait_for_stub() {
  for _ in $(seq 1 30); do
    if docker exec "$APP" wget -q -O /dev/null http://api-stub:3000/api/projects 2>/dev/null; then return 0; fi
    sleep 1
  done
  echo "Doublure de l'API non prête après 30 s" >&2
  docker logs "$STUB" >&2 || true
  return 1
}

down() {
  docker rm -f "$APP" "$STUB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}

up() {
  local image="${1:-j-ned-app-web:ci}"
  down
  docker network create "$NETWORK" >/dev/null
  start_stub
  docker run -d --name "$APP" --network "$NETWORK" -p 127.0.0.1:3000:3000 \
    -e API_UPSTREAM=http://api-stub:3000 "$image" >/dev/null
  for _ in $(seq 1 30); do
    if curl -fsS "$SITE/healthz" >/dev/null 2>&1; then break; fi
    sleep 1
  done
  curl -fsS "$SITE/healthz" >/dev/null || {
    echo "Pas de réponse de $SITE/healthz après 30 s" >&2
    docker logs "$APP" >&2 || true
    return 1
  }
  wait_for_stub
  echo "Pile de l'image prête : site $SITE ($image)"
}

case "${1:-}" in
  up) up "${2:-}" ;;
  down) down ;;
  stop-stub) stop_stub ;;
  restart-stub)
    stop_stub
    start_stub
    wait_for_stub
    ;;
  *)
    echo "usage: $0 up [image] | down | stop-stub | restart-stub" >&2
    exit 2
    ;;
esac
