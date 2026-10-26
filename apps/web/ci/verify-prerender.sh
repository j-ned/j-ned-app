#!/usr/bin/env bash
# Garanties du build de production sur les fichiers servis (prérendu, CSP, coquille CSR, preloads).
# Lancé par la CI sur le contenu extrait de l'image : exactement ce que Dokploy déploie.
#   ci/verify-prerender.sh <dossier browser> <dossier server>
set -euo pipefail
browser="$1"
server="$2"
# Seules les pages statiques sont prérendues ; les pages de contenu sont rendues à la requête.
test -f "$server/server.mjs"
test ! -f $browser/index.html
# Pages par défaut de l'image nginx : jamais servies
test ! -e $browser/50x.html
# Sitemap et RSS sont rendus à la requête par Node : aucun fichier figé au build
test ! -f $browser/sitemap.xml && test ! -f $browser/rss.xml
# Pages statiques prérendues (offres et rendez-vous retirés, spec 029 : aucun fichier ne doit rester)
test -f $browser/mentions-legales/index.html && test -f $browser/confidentialite/index.html
test -f $browser/atelier/index.html
# Guide des plaquettes rendu à la requête : son affichage dépend de la query string
test ! -f $browser/atelier/plaquettes/index.html
test ! -e $browser/offres && test ! -e $browser/rendez-vous
# postbuild : la CSP des pages prérendues est hachée par page, plus d'unsafe-inline.
! grep -l -E "(script|style)-src [^;]*'unsafe-inline'" $(find $browser -name index.html -o -name index.csr.html) || { echo "unsafe-inline dans une page prérendue"; exit 1; }
# Manifeste appliqué par Node aux pages rendues à la requête : scripts constants et feuilles de styles
node -e 'const m = require(process.argv[1]); if (m.scriptHashes.length < 3 || m.styleElementHashes.length === 0) process.exit(1)' "$(realpath "$server/csp-manifest.json")"
# La coquille CSR est servie aux routes client et aux 404 : hachée elle aussi, sans état d'hydratation
test -f $browser/index.csr.html
! grep -q 'ng-state' $browser/index.csr.html || { echo "état d'hydratation dans la coquille CSR"; exit 1; }
# Gestionnaire inline (`on…="…"`) présent => haché dans `script-src-attr`. beasties >= 0.5
# n'en émet plus (bascule du CSS par un `<script>` haché dans `script-src`) : directive absente.
if grep -qE '\son[a-z]+="' $browser/mentions-legales/index.html; then
  grep -q "script-src-attr 'unsafe-hashes'" $browser/mentions-legales/index.html
fi
# theme-color suit la préférence système : une couleur par thème, chacune bornée par `media`.
for page in $browser/mentions-legales/index.html $browser/index.csr.html; do
  metas=$(tr '\n' ' ' < "$page" | grep -oE '<meta [^>]*name="theme-color"[^>]*>')
  test "$(echo "$metas" | wc -l)" -eq 2
  echo "$metas" | grep -q 'media="(prefers-color-scheme: light)"'
  echo "$metas" | grep -q 'media="(prefers-color-scheme: dark)"'
done
# Carte de partage par défaut : nom daté, un renommage oublié annoncerait une image absente.
og_image=$(tr '\n' ' ' < $browser/mentions-legales/index.html | grep -oE '<meta[[:space:]]+property="og:image"[[:space:]]+content="[^"]*"' | sed -E 's|.*content="https://nedellec-julien\.fr/(.*)"|\1|')
test -n "$og_image"
test -f "$browser/$og_image" || { echo "og:image sans fichier : $og_image"; exit 1; }
# Un preload vers un nom de police périmé télécharge un fichier absent et retarde la vraie police.
preloads=$(tr '\n' ' ' < $browser/mentions-legales/index.html | grep -o '<link[^>]*rel="preload"[^>]*>' | grep -o 'href="/[^"]*"' | sed -E 's/^href="\/(.*)"$/\1/')
test -n "$preloads"
for f in $preloads; do
  test -f "$browser/$f" || { echo "preload sans fichier : $f"; exit 1; }
done
