#!/usr/bin/env bash
# Attend que l'API en production annonce la version qui vient d'être publiée : `/api/health` rend la
# release de l'image (`version`, `sha-<commit>`). Une réponse du site ne prouve pas que la nouvelle
# image tourne ; un tirage raté laisserait l'ancienne répondre. L'API est jointe par l'origine du site,
# qui la relaie.
#   DEPLOY_HEALTH_URL : adresse de la sonde du site, dont seule l'origine est gardée
#   EXPECTED_RELEASE : release attendue (`sha-<commit>`)
#   PROBE_ATTEMPTS, PROBE_DELAY : nombre d'essais et secondes entre deux (24 et 10 par défaut)
set -euo pipefail

: "${DEPLOY_HEALTH_URL:?}" "${EXPECTED_RELEASE:?}"
attempts="${PROBE_ATTEMPTS:-24}"
delay="${PROBE_DELAY:-10}"

if [[ ! "$DEPLOY_HEALTH_URL" =~ ^(https?://[^/?#]+) ]]; then
  echo "::error::DEPLOY_HEALTH_URL n'est pas une adresse http(s) : $DEPLOY_HEALTH_URL" >&2
  exit 1
fi
url="${BASH_REMATCH[1]}/api/health"

# Version lue dans le rapport ; une réponse qui n'est pas ce JSON (page d'erreur du proxy pendant le
# redémarrage) ne donne aucune version et l'essai suivant est tenté.
version_of() {
  python3 -c '
import json, sys
try:
    report = json.load(sys.stdin)
except ValueError:
    report = None
version = report.get("version") if isinstance(report, dict) else None
print(version if isinstance(version, str) else "")
'
}

seen="aucune réponse"
for attempt in $(seq 1 "$attempts"); do
  if body="$(curl --fail --silent --show-error --max-time 10 "$url" 2>&1)"; then
    version="$(version_of <<<"$body")"
    if [ "$version" = "$EXPECTED_RELEASE" ]; then
      echo "L'API annonce $version (essai $attempt)."
      exit 0
    fi
    seen="version ${version:-illisible}"
  else
    seen="$body"
  fi
  if [ "$attempt" -lt "$attempts" ]; then sleep "$delay"; fi
done

echo "::error::L'API n'annonce pas $EXPECTED_RELEASE après $attempts essais (dernier : $seen). Vérifier dans Dokploy que l'image a bien été tirée ; si une image plus récente a été publiée entre-temps, c'est elle qui répond." >&2
exit 1
