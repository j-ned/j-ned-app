#!/bin/sh
# Sauvegarde de la base du portfolio vers un bucket S3 (Cloudflare R2), hors du serveur.
#   backup.sh loop             (défaut) une sauvegarde par jour à BACKUP_HOUR_UTC (3 h UTC)
#   backup.sh once             une sauvegarde tout de suite
#   backup.sh restore <objet>  télécharge, déchiffre et restaure l'objet dans la base désignée par
#                              PGHOST/PGUSER/PGPASSWORD/PGDATABASE, qui doit exister et être vide
# Dump au format personnalisé de pg_dump, chiffré par gpg (AES-256, phrase BACKUP_PASSPHRASE) avant
# de quitter le conteneur. La durée de conservation se règle sur le bucket (règle de cycle de vie).
set -eu

: "${PGHOST:?}" "${PGUSER:?}" "${PGPASSWORD:?}" "${PGDATABASE:?}"
: "${BACKUP_S3_ENDPOINT:?}" "${BACKUP_S3_BUCKET:?}"
: "${BACKUP_S3_ACCESS_KEY:?}" "${BACKUP_S3_SECRET_KEY:?}" "${BACKUP_PASSPHRASE:?}"
HOUR="${BACKUP_HOUR_UTC:-3}"

WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT
# État de gpg dans le dossier de travail : rien ne survit au conteneur.
export GNUPGHOME="$WORK/gnupg"
mkdir -m 700 "$GNUPGHOME"

# Phrase lue sur un descripteur : elle n'apparaît ni dans la ligne de commande ni dans un fichier.
encrypt() {
  gpg --batch --quiet --symmetric --cipher-algo AES256 --pinentry-mode loopback \
    --passphrase-fd 3 --output "$2" "$1" 3<<EOF
$BACKUP_PASSPHRASE
EOF
}

decrypt() {
  gpg --batch --quiet --decrypt --pinentry-mode loopback \
    --passphrase-fd 3 --output "$2" "$1" 3<<EOF
$BACKUP_PASSPHRASE
EOF
}

# Signature AWS v4 par curl ; les clés passent par un fichier de configuration lu sur l'entrée
# standard, pas par la ligne de commande.
s3() {
  curl --fail --silent --show-error --retry 3 --aws-sigv4 'aws:amz:auto:s3' \
    -H 'x-amz-content-sha256: UNSIGNED-PAYLOAD' --config - "$@" <<EOF
user = "$BACKUP_S3_ACCESS_KEY:$BACKUP_S3_SECRET_KEY"
EOF
}

backup_once() {
  name="portfolio-$(date -u +%Y%m%dT%H%M%SZ).dump.gpg"
  pg_dump --format=custom --no-owner --no-privileges --file "$WORK/dump"
  encrypt "$WORK/dump" "$WORK/$name"
  s3 --upload-file "$WORK/$name" "$BACKUP_S3_ENDPOINT/$BACKUP_S3_BUCKET/$name" >/dev/null
  echo "$(date -u +%FT%TZ) sauvegarde envoyée : $name ($(wc -c <"$WORK/$name") octets)"
  rm -f "$WORK/dump" "$WORK/$name"
}

restore() {
  object="${1:?usage: backup.sh restore <objet>}"
  s3 --output "$WORK/restore.gpg" "$BACKUP_S3_ENDPOINT/$BACKUP_S3_BUCKET/$object"
  decrypt "$WORK/restore.gpg" "$WORK/restore.dump"
  pg_restore --no-owner --no-privileges --exit-on-error --dbname "$PGDATABASE" "$WORK/restore.dump"
  echo "$(date -u +%FT%TZ) restauration terminée : $object dans $PGDATABASE"
}

seconds_until_next_run() {
  now="$(date -u +%s)"
  wait=$(( (HOUR * 3600 - now % 86400 + 86400) % 86400 ))
  [ "$wait" -gt 0 ] || wait=86400
  echo "$wait"
}

case "${1:-loop}" in
  once) backup_once ;;
  restore) restore "${2:-}" ;;
  loop)
    while :; do
      sleep "$(seconds_until_next_run)"
      # Un échec est journalisé et la boucle continue : la sauvegarde du lendemain reste due.
      backup_once || echo "$(date -u +%FT%TZ) sauvegarde en échec" >&2
    done
    ;;
  *)
    echo "usage: $0 loop | once | restore <objet>" >&2
    exit 2
    ;;
esac
