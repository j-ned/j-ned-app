#!/usr/bin/env bash
# Juge `probe-release.sh` devant une fausse API locale dont les réponses successives sont écrites dans
# un fichier, une par ligne (`<statut> <corps>`, la dernière se répète) : l'ancienne version, une page
# d'erreur ou un JSON sans version ne sont jamais un succès ; la version attendue l'est, même tard.
#   deploy/probe-release.check.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WORK="$(mktemp -d)"
PORT=38472

python3 - "$PORT" "$WORK/responses" <<'PY' &
import sys
from http.server import BaseHTTPRequestHandler, HTTPServer

port, responses = int(sys.argv[1]), sys.argv[2]

class Api(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path != '/api/health':
            self.send_response(404)
            self.end_headers()
            return
        with open(responses) as f:
            lines = f.read().splitlines()
        if len(lines) > 1:
            with open(responses, 'w') as f:
                f.write('\n'.join(lines[1:]) + '\n')
        status, _, body = lines[0].partition(' ')
        self.send_response(int(status))
        self.end_headers()
        self.wfile.write(body.encode())

    def log_message(self, *args):
        pass

HTTPServer(('127.0.0.1', port), Api).serve_forever()
PY
STUB=$!
trap 'kill "$STUB" 2>/dev/null || true; rm -rf "$WORK"' EXIT
echo '200 {}' > "$WORK/responses"
for _ in $(seq 1 50); do
  if curl -s -o /dev/null "http://127.0.0.1:$PORT/api/health"; then break; fi
  sleep 0.1
done

probe() {
  env -i PATH="$PATH" PROBE_ATTEMPTS=4 PROBE_DELAY=0 EXPECTED_RELEASE=sha-new \
    DEPLOY_HEALTH_URL="http://127.0.0.1:$PORT/healthz?x=1" "$@" "$HERE/probe-release.sh" 2>&1
}
responses() {
  printf '%s\n' "$@" > "$WORK/responses"
}
fails_with() {
  local expected="$1" output
  shift
  if output="$(probe "$@")"; then
    echo "succès annoncé alors que la version attendue n'a pas répondu ($expected attendu) : $output" >&2
    exit 1
  fi
  grep -q "$expected" <<<"$output" || { echo "message attendu absent ($expected) : $output" >&2; exit 1; }
}

# L'ancienne image répond toujours : échec qui nomme la version vue.
responses '200 {"status":"ok","version":"sha-old"}'
fails_with 'dernier : version sha-old'
# Page d'erreur du proxy, puis JSON sans version : jamais un succès.
responses '502 <html>Bad Gateway</html>' '200 <html>maintenance</html>' '200 {"status":"ok"}'
fails_with 'dernier : version illisible'
# API injoignable tout du long.
responses '503 indisponible'
fails_with 'sha-new après 4 essais'
# Adresse de sonde invalide ou absente : rien n'est tenté.
fails_with "n'est pas une adresse" DEPLOY_HEALTH_URL=ftp://exemple.invalid/healthz
fails_with 'EXPECTED_RELEASE' EXPECTED_RELEASE=

# Redémarrage puis ancienne version, puis la nouvelle au quatrième essai : succès.
responses '502 <html>Bad Gateway</html>' '200 {"version":"sha-old"}' '200 pas du json' '200 {"version":"sha-new"}'
output="$(probe)"
grep -q 'annonce sha-new (essai 4)' <<<"$output" || { echo "succès non annoncé : $output" >&2; exit 1; }

echo "probe-release.sh : ancienne version, réponse illisible et API injoignable échouent, la nouvelle version réussit."
