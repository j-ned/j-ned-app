#!/usr/bin/env bash
# Valide `compose.yaml` avant de demander le déploiement : Dokploy lit ce fichier dans le dépôt à
# chaque déploiement, donc un fichier invalide fusionné serait déployé tel quel. Les variables
# viennent du modèle `portfolio.env.example`, les vides remplies d'une valeur factice.
#   deploy/compose.check.sh
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$(mktemp)"
trap 'rm -f "$ENV_FILE"' EXIT

sed -E 's/^([A-Z0-9_]+)=$/\1=valeur/' "$HERE/portfolio.env.example" > "$ENV_FILE"

services="$(docker compose --env-file "$ENV_FILE" -f "$HERE/compose.yaml" config --services | sort | paste -sd' ')"
echo "compose.yaml valide, services : $services"
