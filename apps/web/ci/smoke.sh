#!/usr/bin/env bash
# Test de fumée de l'image : nginx devant Node, doublure de l'API, en-têtes, caches, codes HTTP.
#   ci/smoke.sh [image]   (défaut : ng-portfolio-app:ci)
set -euo pipefail
image="${1:-ng-portfolio-app:ci}"
# Doublure de l'API sur un réseau commun : les pages de contenu sont rendues à la requête.
docker network create portfolio-ci
docker run -d --rm --name api-stub --network portfolio-ci -v "$PWD/ci/api-stub:/stub:ro" node:22-alpine node /stub/server.mjs
docker run -d --rm --name portfolio --network portfolio-ci -p 3000:3000 -e API_UPSTREAM=http://api-stub:3000 "$image"
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/healthz -o /dev/null; then break; fi
  sleep 1
done
test "$(curl -fsS http://127.0.0.1:3000/healthz)" = "ok"
curl -fsS http://127.0.0.1:3000/ -o /tmp/index.html
grep -q '<app-root' /tmp/index.html
# Corps écrit dans un fichier avant grep : `curl | grep -q` casse sous pipefail
# (grep sort au premier match, curl échoue en écrivant dans le tube fermé : code 23)
curl -fsS http://127.0.0.1:3000/about/ -o /tmp/about.html
grep -q '<app-about' /tmp/about.html
# Accueil de l'atelier : relayé à Node, la carte du guide suit l'interrupteur lu dans la doublure (activé)
curl -fsS -D /tmp/atelier-headers.txt http://127.0.0.1:3000/atelier/ -o /tmp/atelier.html
grep -q 'data-testid="workshop-title"' /tmp/atelier.html || { echo "titre absent : /atelier/"; exit 1; }
grep -q 'data-testid="workshop-tool-card"' /tmp/atelier.html || { echo "carte du guide absente : /atelier/"; exit 1; }
grep -qi '^x-cache-status' /tmp/atelier-headers.txt || { echo "/atelier/ non rendu par Node"; exit 1; }
# Guide des plaquettes : relayé à Node, la matière de l'URL partagée affiche son tableau dès le HTML serveur
curl -fsS -D /tmp/guide-headers.txt 'http://127.0.0.1:3000/atelier/plaquettes?matiere=Acier%20t%C3%A9moin' -o /tmp/guide.html
grep -q 'data-testid="insert-guide-title"' /tmp/guide.html || { echo "titre absent : /atelier/plaquettes"; exit 1; }
grep -q 'PLAQUETTE-TEMOIN-1' /tmp/guide.html || { echo "tableau absent : /atelier/plaquettes"; exit 1; }
grep -q '"noseRadius"' /tmp/guide.html || { echo "document /api/workshop-guide absent de l'état de transfert"; exit 1; }
grep -qi '^x-cache-status' /tmp/guide-headers.txt || { echo "/atelier/plaquettes non rendu par Node"; exit 1; }
# Matière inconnue : jamais réaffichée
curl -fsS 'http://127.0.0.1:3000/atelier/plaquettes?matiere=mati%C3%A8re-pi%C3%A9g%C3%A9e' -o /tmp/guide-unknown.html
! grep -q 'matière-piégée' /tmp/guide-unknown.html || { echo "matière inconnue réaffichée"; exit 1; }
# Chaque route rendue à la requête lit la doublure et embarque l'état de transfert
for path in / /projects /projects/projet-temoin /blog /blog/article-temoin; do
  curl -fsS "http://127.0.0.1:3000$path" -o /tmp/ssr.html
  grep -q 'témoin A' /tmp/ssr.html || { echo "contenu de l'API absent : $path"; exit 1; }
  grep -q 'id="ng-state"' /tmp/ssr.html || { echo "état de transfert absent : $path"; exit 1; }
done
# /about lit le parcours dans la doublure et l'embarque dans l'état de transfert
curl -fsS http://127.0.0.1:3000/about -o /tmp/about-ssr.html
grep -q 'data-testid="about-lead"' /tmp/about-ssr.html || { echo "accroche absente : /about"; exit 1; }
grep -q 'data-testid="journey-paragraph"' /tmp/about-ssr.html || { echo "parcours absent : /about"; exit 1; }
grep -q '"leadEmphasis"' /tmp/about-ssr.html || { echo "document /api/profile absent de l'état de transfert"; exit 1; }
# CSP des pages rendues à la requête : une seule meta, hachée, sans unsafe-inline ; HTML revalidé
for path in / /about /projects /projects/projet-temoin /blog /blog/article-temoin /atelier /atelier/plaquettes; do
  curl -fsS -D /tmp/ssr-headers.txt "http://127.0.0.1:3000$path" -o /tmp/ssr.html
  test "$(grep -o 'http-equiv="Content-Security-Policy"' /tmp/ssr.html | wc -l)" = "1" || { echo "meta CSP absente ou dupliquée : $path"; exit 1; }
  ! grep -qE "(script|style)-src [^;]*'unsafe-inline'" /tmp/ssr.html || { echo "unsafe-inline : $path"; exit 1; }
  grep -qi '^cache-control: no-cache' /tmp/ssr-headers.txt || { echo "HTML sans revalidation : $path"; exit 1; }
done
# Attributs style rendus au serveur (portrait, délais d'animation) : hachés dans style-src-attr
curl -fsS http://127.0.0.1:3000/about -o /tmp/about-csp.html
grep -q "style-src-attr 'unsafe-hashes'" /tmp/about-csp.html
# Le rendu Node ne tourne pas en root
node_user=$(docker exec portfolio ps -o user= -o args= | awk '$2 == "node" {print $1}')
test "$node_user" = "ssr" || { echo "Node lancé par : $node_user"; exit 1; }
# Slug inconnu : vraie 404 rendue par le serveur, puis servie par le micro-cache
for path in /projects/inexistant /blog/inexistant; do
  test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$path")" = "404" || { echo "pas de 404 : $path"; exit 1; }
done
# Offres et prise de rendez-vous retirées (spec 029) : 410 Gone, corps = shell client
for path in /offres /offres/site-vitrine /offre-site-industrie /rendez-vous /rendez-vous/ /rendez-vous/annulation; do
  test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$path")" = "410" || { echo "pas de 410 : $path"; exit 1; }
done
curl -s http://127.0.0.1:3000/offres -o /tmp/gone.html
grep -q '<app-root' /tmp/gone.html || { echo "corps du 410 sans shell client"; exit 1; }
# Micro-cache d'une seconde : HIT dans la seconde, rendu neuf ensuite ; /healthz jamais en cache
curl -fsS -D /tmp/c1.txt -o /dev/null http://127.0.0.1:3000/projects
curl -fsS -D /tmp/c2.txt -o /dev/null http://127.0.0.1:3000/projects
grep -qi '^x-cache-status: HIT' /tmp/c2.txt || { echo "pas de HIT"; cat /tmp/c2.txt; exit 1; }
sleep 2
curl -fsS -D /tmp/c3.txt -o /dev/null http://127.0.0.1:3000/projects
grep -qiE '^x-cache-status: (MISS|EXPIRED)' /tmp/c3.txt || { echo "entrée non renouvelée"; cat /tmp/c3.txt; exit 1; }
curl -fsS -D /tmp/healthz-headers.txt -o /dev/null http://127.0.0.1:3000/healthz
! grep -qi '^x-cache-status' /tmp/healthz-headers.txt || { echo "/healthz mis en cache"; cat /tmp/healthz-headers.txt; exit 1; }
# Routes rendues : lecture seule (une écriture ne déclenche aucun rendu)
for method in POST DELETE; do
  test "$(curl -s -o /dev/null -w '%{http_code}' -X "$method" http://127.0.0.1:3000/blog)" = "403" || { echo "$method /blog accepté"; exit 1; }
done
# Sitemap et RSS rendus à la requête depuis l'API, XML bien formé
curl -fsS -D /tmp/sitemap-headers.txt http://127.0.0.1:3000/sitemap.xml -o /tmp/sitemap.xml
grep -qi '^content-type: application/xml' /tmp/sitemap-headers.txt
grep -q '<loc>https://nedellec-julien.fr/blog/article-temoin</loc>' /tmp/sitemap.xml
grep -q '<loc>https://nedellec-julien.fr/projects/projet-temoin</loc>' /tmp/sitemap.xml
grep -q '<loc>https://nedellec-julien.fr/atelier/plaquettes</loc>' /tmp/sitemap.xml
curl -fsS -D /tmp/rss-headers.txt http://127.0.0.1:3000/rss.xml -o /tmp/rss.xml
grep -qi '^content-type: application/rss+xml' /tmp/rss-headers.txt
grep -q '<title>Article témoin A</title>' /tmp/rss.xml
python3 -c 'import sys, xml.dom.minidom; [xml.dom.minidom.parse(f) for f in sys.argv[1:]]' /tmp/sitemap.xml /tmp/rss.xml
# API en panne : copie périmée servie (STALE), /healthz toujours vivant
# rm -f tue tout de suite : docker stop attendrait 10 s que la doublure ignore SIGTERM
docker rm -f api-stub > /dev/null
sleep 2
curl -fsS -D /tmp/stale.txt -o /tmp/stale.html http://127.0.0.1:3000/blog
grep -qi '^x-cache-status: STALE' /tmp/stale.txt || { echo "pas de copie périmée"; cat /tmp/stale.txt; exit 1; }
grep -q 'Article témoin A' /tmp/stale.html
test "$(curl -fsS http://127.0.0.1:3000/healthz)" = "ok"
# À froid, sans copie ni API : 503, jamais une page vide en 200
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/blog/jamais-lu)" = "503"
docker run -d --rm --name api-stub --network portfolio-ci -v "$PWD/ci/api-stub:/stub:ro" node:22-alpine node /stub/server.mjs
# Host forcé par nginx : un hôte arbitraire ne change ni le rendu ni le canonical
curl -fsS -H 'Host: evil.test' http://127.0.0.1:3000/blog -o /tmp/evil.html
grep -q 'href="https://nedellec-julien.fr/blog"' /tmp/evil.html
# Page d'accueil par défaut de l'image nginx : absente de l'image
curl -s http://127.0.0.1:3000/index.html -o /tmp/default-index.html
! grep -q 'Welcome to nginx' /tmp/default-index.html || { echo "page par défaut de nginx servie"; exit 1; }
# Une URL inconnue ne réveille pas Node : 404 nginx sur la coquille CSR
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/wp-login.php)" = "404"
# Routes client → coquille CSR en 200 ; URL inconnue → coquille CSR en 404 (pas la home)
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/login)" = "200"
# La coquille CSR annonce la carte par défaut : elle doit être servie, en PNG.
curl -fsS http://127.0.0.1:3000/login -o /tmp/login.html
login_og=$(tr '\n' ' ' < /tmp/login.html | grep -oE '<meta[[:space:]]+property="og:image"[[:space:]]+content="[^"]*"' | sed -E 's|.*content="https://nedellec-julien\.fr(/.*)"|\1|')
test -n "$login_og"
test "$(curl -s -o /dev/null -w '%{http_code} %{content_type}' "http://127.0.0.1:3000$login_og")" = "200 image/png"
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/admin/analytics)" = "200"
# Ancien lien d'annulation de rendez-vous (e-mails déjà envoyés) : 410, en-têtes de sécurité gardés
cancel_headers=$(curl -s -D - -o /dev/null http://127.0.0.1:3000/rendez-vous/annulation)
grep -q ' 410' <<<"${cancel_headers%%$'\n'*}" || { echo "pas de 410 : annulation"; exit 1; }
grep -qi '^strict-transport-security:' <<<"$cancel_headers"
test "$(curl -s -o /tmp/404.html -w '%{http_code}' http://127.0.0.1:3000/does-not-exist)" = "404"
grep -q '<app-root' /tmp/404.html && ! grep -q 'ng-state' /tmp/404.html
# Anciennes URL d'offre, query comprise : 410 sans redirection (spec 029)
for url in '/offre-site-industrie?utm_source=x' '/offres/application-metier?utm_source=x' '/offres/inexistant'; do
  gone=$(curl -s -D - -o /dev/null "http://127.0.0.1:3000$url")
  grep -q ' 410' <<<"${gone%%$'\n'*}" || { echo "pas de 410 : $url"; exit 1; }
  ! grep -qi '^location:' <<<"$gone" || { echo "redirection résiduelle : $url"; exit 1; }
done
# Les en-têtes de sécurité tiennent aussi sur les assets (snippet inclus dans la location)
# -o sort toutes les occurrences de la ligne (HTML minifié) : on garde la première
asset=$(grep -o 'main-[A-Za-z0-9_-]*\.js' /tmp/index.html)
asset=${asset%%$'\n'*}
asset_headers=$(curl -fsS -D - -o /dev/null "http://127.0.0.1:3000/$asset")
grep -qi 'x-frame-options: deny' <<<"$asset_headers"
# En-têtes de sécurité posés par nginx (Traefik ne fait que le TLS)
headers=$(curl -fsS -D - -o /dev/null http://127.0.0.1:3000/)
for h in 'strict-transport-security' 'x-content-type-options: nosniff' 'x-frame-options: deny' "content-security-policy: frame-ancestors 'none'" 'referrer-policy' 'permissions-policy'; do
  grep -qi "$h" <<<"$headers" || { echo "en-tête manquant : $h"; exit 1; }
done
! grep -qi '^server: nginx/' <<<"$headers" || { echo "version nginx exposée"; echo "$headers"; exit 1; }
# Polices auto-hébergées servies par nginx avec le bon type (sinon rejetées par le navigateur)
font=$(curl -fsS -D - -o /dev/null http://127.0.0.1:3000/fonts/bricolage-grotesque-1.001-latin-opsz48-wdth100-wght600-800.woff2)
grep -qi 'content-type: font/woff2' <<<"$font" || { echo "police mal servie"; echo "$font"; exit 1; }
# Polices : nom versionné, cache immuable (seule location ^/fonts/ depuis le retrait des démos)
grep -qi 'cache-control: .*immutable' <<<"$font" || { echo "police sans cache immuable"; echo "$font"; exit 1; }
# Cache immuable réservé aux URL empreintées : un fichier dont l'URL ne change pas avec le
# contenu reste figé un an chez le visiteur (sprite d'icônes resté périmé après un ajout)
grep -qi 'cache-control: .*immutable' <<<"$asset_headers" || { echo "chunk haché sans cache immuable"; echo "$asset_headers"; exit 1; }
sprite=$(grep -o '/icons/sprite\.svg?v=[0-9a-f]*' /tmp/index.html)
sprite=${sprite%%$'\n'*}
test -n "$sprite"
sprite_headers=$(curl -fsS -D - -o /dev/null "http://127.0.0.1:3000$sprite")
grep -qi 'cache-control: .*immutable' <<<"$sprite_headers" || { echo "sprite empreinté sans cache immuable"; echo "$sprite_headers"; exit 1; }
grep -qi 'x-frame-options: deny' <<<"$sprite_headers" || { echo "sprite sans en-têtes de sécurité"; echo "$sprite_headers"; exit 1; }
for path in /favicon.svg /icons/sprite.svg; do
  mutable_headers=$(curl -fsS -D - -o /dev/null "http://127.0.0.1:3000$path")
  ! grep -qi 'cache-control: .*immutable' <<<"$mutable_headers" || { echo "fichier non empreinté en cache immuable : $path"; echo "$mutable_headers"; exit 1; }
  grep -qi 'cache-control: .*must-revalidate' <<<"$mutable_headers" || { echo "fichier non empreinté sans revalidation : $path"; echo "$mutable_headers"; exit 1; }
  grep -qi 'x-frame-options: deny' <<<"$mutable_headers" || { echo "en-têtes de sécurité absents : $path"; echo "$mutable_headers"; exit 1; }
done
docker rm -f portfolio api-stub > /dev/null
docker network rm portfolio-ci
