# ADR-0021 — La mesure d'audience part par l'origine du site

- **Statut** : proposé (2026-10-10, spec 020)
- **Date** : 2026-10-10
- **Contexte spec** : `specs/020-mesure-honnete.md`
- **Voir aussi** : ADR-0018 (relais `/api/storage/`)

## Context

Le front envoie ses événements à `api.nedellec-julien.fr/api/analytics/track`. La durée d'affichage
part sur `beforeunload` par `navigator.sendBeacon` d'un `Blob` `application/json` : en
cross-origin, c'est une requête CORS avec pré-vol et `credentials: include`, dont la prise en charge
varie selon les navigateurs, et `beforeunload` est peu fiable en mobile. La mesure de la durée est
donc lacunaire, et c'est elle qui sépare un rebond réel d'une lecture (ADR-0022).

L'empreinte de session de l'API est `sha256(ip|ua|jour)` ; l'IP vient de `req.ip` en
`trust proxy 1` (dernier élément de `X-Forwarded-For` posé par le saut immédiat, aujourd'hui
Traefik). Toute IP privée est écartée.

## Decision

1. Toutes les écritures de mesure (`POST /api/analytics/track`) partent vers l'**origine du site** ;
   nginx les relaie à l'API par le réseau Docker (`location = /api/analytics/track`, `POST` seul,
   corps ≤ 4 ko, sans cache). Les lectures admin (`stats/*`) restent cross-origin.
2. nginx transmet `X-Forwarded-For` **tel que Traefik l'a posé**
   (`proxy_set_header X-Forwarded-For $http_x_forwarded_for`) : l'API, sans changement de
   `trust proxy`, lit le même dernier élément que par le chemin direct. Ne **pas** utiliser
   `$proxy_add_x_forwarded_for` : il ajouterait l'IP de Traefik, privée, et toute la mesure serait
   écartée en silence.
3. Le relais vide `Cookie` et `Authorization` (aucune donnée de session de l'admin vers la mesure).
4. La durée devient un **temps visible** envoyé par incréments à `visibilitychange→hidden` et
   `pagehide` (beacon, même origine, sans pré-vol) ; `beforeunload` est abandonné.
5. Upstream : `${STORAGE_UPSTREAM}` (même service API que le relais d'images), pour ne pas exiger
   de nouvelle variable Dokploy.

## Consequences

- Beacon fiable (même origine), pas de pré-vol par événement, bfcache préservé.
- Nouveau point de défaillance unique pour la mesure : une erreur de transmission d'IP l'annule sans
  erreur visible ⇒ livraison isolée (PR front 1), preuve d'en-têtes en conteneur local, observation
  des compteurs après déploiement.
- En dev, le proxy CLI pose un `X-Forwarded-For` de documentation (`203.0.113.10`) : l'API locale
  enregistre enfin les événements, en base locale.
- Le nom `STORAGE_UPSTREAM` désigne désormais l'API au sens large ; le renommer demanderait un
  changement Dokploy synchronisé.

## Alternatives considered

- **Beacon `text/plain` cross-origin** (requête simple, sans pré-vol) : impose à l'API un parseur de
  corps texte dédié à `/track` et une validation manuelle ; garde la dépendance au CORS.
- **`fetch(…, { keepalive: true })` cross-origin** : même pré-vol, même incertitude.
- **Statu quo** : durée absente sur une part inconnue des visites mobiles, rebond réel inexploitable.
