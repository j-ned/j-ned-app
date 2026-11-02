#!/usr/bin/env bash
# Pile locale du smoke test et de l'audit axe, sans conteneur : la sortie Vercel rejouée par
# `ci/vercel-local.mjs` sur :3000, devant la doublure de l'API sur :3001. Même script en CI et en local,
# après `pnpm run build --configuration production && node scripts/build-vercel.mjs`.
#   ci/local-stack.sh up | down | restart-stub
set -euo pipefail

CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RUN_DIR="${RUNNER_TEMP:-/tmp}/portfolio-local-stack"
SITE=http://127.0.0.1:3000
STUB=http://127.0.0.1:3001

stop() {
  local name="$1"
  if [ -f "$RUN_DIR/$name.pid" ]; then
    kill "$(cat "$RUN_DIR/$name.pid")" 2>/dev/null || true
    rm -f "$RUN_DIR/$name.pid"
  fi
}

start_stub() {
  PORT=3001 STUB_ADMIN_SESSION=1 nohup node "$CI_DIR/api-stub/server.mjs" >"$RUN_DIR/stub.log" 2>&1 &
  echo $! >"$RUN_DIR/stub.pid"
}

wait_for() {
  for _ in $(seq 1 30); do
    if curl -fsS "$1" >/dev/null 2>&1; then return 0; fi
    sleep 1
  done
  echo "Pas de réponse de $1 après 30 s" >&2
  cat "$RUN_DIR"/*.log >&2 || true
  return 1
}

up() {
  down
  mkdir -p "$RUN_DIR"
  start_stub
  API_UPSTREAM="$STUB" PORT=3000 nohup node "$CI_DIR/vercel-local.mjs" >"$RUN_DIR/site.log" 2>&1 &
  echo $! >"$RUN_DIR/site.pid"
  wait_for "$STUB/api/projects"
  wait_for "$SITE/healthz"
  echo "Pile locale prête : site $SITE, doublure $STUB (journaux : $RUN_DIR)"
}

down() {
  stop site
  stop stub
}

case "${1:-}" in
  up) up ;;
  down) down ;;
  stop-stub) stop stub ;;
  restart-stub)
    stop stub
    start_stub
    wait_for "$STUB/api/projects"
    ;;
  *)
    echo "usage: $0 up | down | stop-stub | restart-stub" >&2
    exit 2
    ;;
esac
