#!/usr/bin/env bash
# Pile de l'audit d'accessibilité : l'image du site devant la doublure de l'API, sur un réseau
# dédié. Même script pour la CI et le poste local.
#   ci/a11y-stack.sh up [image]   (défaut : ng-portfolio-app:a11y)
#   ci/a11y-stack.sh down
set -euo pipefail

NETWORK=a11y-ci
APP=a11y-portfolio
STUB=a11y-api-stub
STUB_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/api-stub"

down() {
  docker rm -f "$APP" "$STUB" >/dev/null 2>&1 || true
  docker network rm "$NETWORK" >/dev/null 2>&1 || true
}

up() {
  local image="${1:-ng-portfolio-app:a11y}"
  down
  docker network create "$NETWORK" >/dev/null
  docker run -d --name "$STUB" --network "$NETWORK" --network-alias api-stub \
    -p 127.0.0.1:3001:3000 -e STUB_ADMIN_SESSION=1 \
    -v "$STUB_DIR:/stub:ro" node:22-alpine node /stub/server.mjs >/dev/null
  docker run -d --name "$APP" --network "$NETWORK" \
    -p 127.0.0.1:3000:3000 -e API_UPSTREAM=http://api-stub:3000 "$image" >/dev/null

  for _ in $(seq 1 30); do
    if curl -fsS http://127.0.0.1:3000/healthz >/dev/null 2>&1 &&
      curl -fsS http://127.0.0.1:3001/api/projects >/dev/null 2>&1; then
      echo "Pile a11y prête : site http://127.0.0.1:3000, doublure http://127.0.0.1:3001 ($image)"
      return 0
    fi
    sleep 1
  done
  echo "Pile a11y non prête après 30 s" >&2
  docker logs "$STUB" >&2 || true
  docker logs "$APP" >&2 || true
  return 1
}

case "${1:-}" in
  up) up "${2:-}" ;;
  down) down ;;
  *)
    echo "usage: $0 up [image] | down" >&2
    exit 2
    ;;
esac
