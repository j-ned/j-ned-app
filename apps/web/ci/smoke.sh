#!/usr/bin/env bash
# Test de fumée de la sortie Vercel (`.vercel/output`), rejouée par `ci/vercel-local.mjs` devant la
# doublure de l'API : table de routes, en-têtes, codes HTTP, rendu serveur. Pile démarrée avant :
#   ci/local-stack.sh up && ci/smoke.sh; ci/local-stack.sh down
set -euo pipefail
CI_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
test "$(curl -fsS http://127.0.0.1:3000/healthz)" = "ok"
curl -fsS http://127.0.0.1:3000/ -o /tmp/index.html
grep -q '<app-root' /tmp/index.html
# Corps écrit dans un fichier avant grep : `curl | grep -q` casse sous pipefail
# (grep sort au premier match, curl échoue en écrivant dans le tube fermé : code 23)
curl -fsS http://127.0.0.1:3000/about/ -o /tmp/about.html
grep -q '<app-about' /tmp/about.html
# Accueil de l'atelier : relayé à Node, chaque carte suit son interrupteur lu dans la doublure (activés)
curl -fsS -D /tmp/atelier-headers.txt http://127.0.0.1:3000/atelier/ -o /tmp/atelier.html
grep -q 'data-testid="workshop-title"' /tmp/atelier.html || { echo "titre absent : /atelier/"; exit 1; }
grep -q 'data-testid="workshop-tool-card"' /tmp/atelier.html || { echo "carte du guide absente : /atelier/"; exit 1; }
grep -q 'href="/atelier/decodeur"' /tmp/atelier.html || { echo "carte du décodeur absente : /atelier/"; exit 1; }
# Guide des plaquettes : relayé à Node, la matière de l'URL partagée affiche son tableau dès le HTML serveur
curl -fsS -D /tmp/guide-headers.txt 'http://127.0.0.1:3000/atelier/plaquettes?matiere=Acier%20t%C3%A9moin' -o /tmp/guide.html
grep -q 'data-testid="insert-guide-title"' /tmp/guide.html || { echo "titre absent : /atelier/plaquettes"; exit 1; }
grep -q 'PLAQUETTE-TEMOIN-1' /tmp/guide.html || { echo "tableau absent : /atelier/plaquettes"; exit 1; }
grep -q '"noseRadius"' /tmp/guide.html || { echo "document /api/workshop-guide absent de l'état de transfert"; exit 1; }
# Une ligne « toutes matières » sans rayon s'affiche sous la matière demandée, avec sa mention
grep -q 'data-testid="insert-guide-all-materials"' /tmp/guide.html || { echo "ligne toutes matières absente : /atelier/plaquettes"; exit 1; }
grep -q 'Alésage (ébauche et finition)' /tmp/guide.html || { echo "opération alésage absente : /atelier/plaquettes"; exit 1; }
# Un code décodable du guide mène à son décodage ; un code non décodable reste du texte
grep -q 'href="/atelier/decodeur?code=CCGT09T304PM"' /tmp/guide.html || { echo "lien vers le décodeur absent : /atelier/plaquettes"; exit 1; }
! grep -q 'href="/atelier/decodeur?code=PLAQUETTE' /tmp/guide.html || { echo "code non décodable lié : /atelier/plaquettes"; exit 1; }
# Décodeur : relayé à Node, le code de l'URL partagée est décodé dès le HTML serveur (guide activé dans la doublure)
curl -fsS -D /tmp/decoder-headers.txt 'http://127.0.0.1:3000/atelier/decodeur?code=CNMG120408' -o /tmp/decoder.html
grep -q 'data-testid="insert-decoder-result"' /tmp/decoder.html || { echo "décodage absent : /atelier/decodeur"; exit 1; }
grep -q 'Losange 80°' /tmp/decoder.html || { echo "forme non décodée : /atelier/decodeur"; exit 1; }
grep -q 'name="code"' /tmp/decoder.html || { echo "champ sans nom : /atelier/decodeur"; exit 1; }
grep -q '"noseRadius"' /tmp/decoder.html || { echo "document /api/workshop-guide absent de l'état de transfert : /atelier/decodeur"; exit 1; }
grep -q 'rel="canonical" href="https://nedellec-julien.fr/atelier/decodeur"' /tmp/decoder.html || { echo "canonical avec query : /atelier/decodeur"; exit 1; }
# Code en pouces : refusé avec son motif, jamais décodé
curl -fsS 'http://127.0.0.1:3000/atelier/decodeur?code=CNMG%20432' -o /tmp/decoder-ansi.html
grep -q 'role="alert"' /tmp/decoder-ansi.html || { echo "erreur ANSI absente : /atelier/decodeur"; exit 1; }
! grep -q 'data-testid="insert-decoder-result"' /tmp/decoder-ansi.html || { echo "code ANSI décodé : /atelier/decodeur"; exit 1; }
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
for path in / /about /projects /projects/projet-temoin /blog /blog/article-temoin /atelier /atelier/plaquettes /atelier/decodeur; do
  curl -fsS -D /tmp/ssr-headers.txt "http://127.0.0.1:3000$path" -o /tmp/ssr.html
  test "$(grep -o 'http-equiv="Content-Security-Policy"' /tmp/ssr.html | wc -l)" = "1" || { echo "meta CSP absente ou dupliquée : $path"; exit 1; }
  ! grep -qE "(script|style)-src [^;]*'unsafe-inline'" /tmp/ssr.html || { echo "unsafe-inline : $path"; exit 1; }
  grep -qi '^cache-control: no-cache' /tmp/ssr-headers.txt || { echo "HTML sans revalidation : $path"; exit 1; }
  grep -qi '^vercel-cache-tag: content' /tmp/ssr-headers.txt || { echo "HTML hors du tag de purge : $path"; exit 1; }
done
# Attributs style rendus au serveur (portrait, délais d'animation) : hachés dans style-src-attr
curl -fsS http://127.0.0.1:3000/about -o /tmp/about-csp.html
grep -q "style-src-attr 'unsafe-hashes'" /tmp/about-csp.html
# Slug inconnu : vraie 404 rendue par le serveur
for path in /projects/inexistant /blog/inexistant; do
  test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$path")" = "404" || { echo "pas de 404 : $path"; exit 1; }
done
# Offres et prise de rendez-vous retirées (spec 029) : 410 Gone, corps = shell client
for path in /offres /offres/site-vitrine /offre-site-industrie /rendez-vous /rendez-vous/ /rendez-vous/annulation; do
  test "$(curl -s -o /dev/null -w '%{http_code}' "http://127.0.0.1:3000$path")" = "410" || { echo "pas de 410 : $path"; exit 1; }
done
curl -s http://127.0.0.1:3000/offres -o /tmp/gone.html
grep -q '<app-root' /tmp/gone.html || { echo "corps du 410 sans shell client"; exit 1; }
# Routes rendues : lecture seule (une écriture ne réveille pas la fonction, 404 comme en production)
for method in POST DELETE; do
  test "$(curl -s -o /dev/null -w '%{http_code}' -X "$method" http://127.0.0.1:3000/blog)" = "404" || { echo "$method /blog accepté"; exit 1; }
done
# Sitemap et RSS rendus à la requête depuis l'API, XML bien formé
curl -fsS -D /tmp/sitemap-headers.txt http://127.0.0.1:3000/sitemap.xml -o /tmp/sitemap.xml
grep -qi '^content-type: application/xml' /tmp/sitemap-headers.txt
grep -q '<loc>https://nedellec-julien.fr/blog/article-temoin</loc>' /tmp/sitemap.xml
grep -q '<loc>https://nedellec-julien.fr/projects/projet-temoin</loc>' /tmp/sitemap.xml
grep -q '<loc>https://nedellec-julien.fr/atelier/plaquettes</loc>' /tmp/sitemap.xml
grep -q '<loc>https://nedellec-julien.fr/atelier/decodeur</loc>' /tmp/sitemap.xml
curl -fsS -D /tmp/rss-headers.txt http://127.0.0.1:3000/rss.xml -o /tmp/rss.xml
grep -qi '^content-type: application/rss+xml' /tmp/rss-headers.txt
# Flux mis en cache par le CDN : vidés avec les pages à chaque écriture de contenu
grep -qi '^vercel-cache-tag: content' /tmp/sitemap-headers.txt
grep -qi '^vercel-cache-tag: content' /tmp/rss-headers.txt
grep -q '<title>Article témoin A</title>' /tmp/rss.xml
python3 -c 'import sys, xml.dom.minidom; [xml.dom.minidom.parse(f) for f in sys.argv[1:]]' /tmp/sitemap.xml /tmp/rss.xml
# API en panne : /healthz reste vivant (la copie périmée relève du CDN, `stale-if-error`, hors de portée ici)
"$CI_DIR/local-stack.sh" stop-stub
test "$(curl -fsS http://127.0.0.1:3000/healthz)" = "ok"
# À froid, sans copie ni API : 503, jamais une page vide en 200
test "$(curl -s -o /dev/null -w '%{http_code}' http://127.0.0.1:3000/blog/jamais-lu)" = "503"
"$CI_DIR/local-stack.sh" restart-stub
# Hôte forcé par la fonction : un hôte arbitraire ne change ni le rendu ni le canonical
curl -fsS -H 'Host: evil.test' -H 'X-Forwarded-Host: evil.test' http://127.0.0.1:3000/blog -o /tmp/evil.html
grep -q 'href="https://nedellec-julien.fr/blog"' /tmp/evil.html
# HTML statique (coquille CSR, pages prérendues, 404) : revalidé à chaque visite, sinon le
# navigateur garde une coquille périmée qui charge l'ancien bundle après un déploiement.
for path in /login /admin/guide-plaquettes /mentions-legales/ /does-not-exist; do
  html_headers=$(curl -s -D - -o /dev/null "http://127.0.0.1:3000$path")
  grep -qi '^cache-control: no-cache' <<<"$html_headers" || { echo "HTML sans revalidation : $path"; echo "$html_headers"; exit 1; }
  grep -qi '^x-frame-options: deny' <<<"$html_headers" || { echo "en-têtes de sécurité absents : $path"; exit 1; }
done
# Une URL inconnue ne réveille pas la fonction : 404 sur la coquille CSR
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
# Les en-têtes de sécurité tiennent aussi sur les assets
# -o sort toutes les occurrences de la ligne (HTML minifié) : on garde la première
asset=$(grep -o 'main-[A-Za-z0-9_-]*\.js' /tmp/index.html)
asset=${asset%%$'\n'*}
asset_headers=$(curl -fsS -D - -o /dev/null "http://127.0.0.1:3000/$asset")
grep -qi 'x-frame-options: deny' <<<"$asset_headers"
# En-têtes de sécurité posés par la table de routes
headers=$(curl -fsS -D - -o /dev/null http://127.0.0.1:3000/)
for h in 'strict-transport-security' 'x-content-type-options: nosniff' 'x-frame-options: deny' "content-security-policy: frame-ancestors 'none'" 'referrer-policy' 'permissions-policy'; do
  grep -qi "$h" <<<"$headers" || { echo "en-tête manquant : $h"; exit 1; }
done
# Polices auto-hébergées servies avec le bon type (sinon rejetées par le navigateur)
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
