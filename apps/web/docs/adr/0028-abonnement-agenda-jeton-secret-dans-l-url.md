# ADR-0028 — Abonnement d'agenda : jeton dérivé par HMAC dans le chemin, sel en base, URL masquée partout

- **Statut** : obsolète (2026-10-20, abonnement d'agenda retiré par `specs/029-repositionnement-portfolio-passion.md`) ;
  historique : proposé (2026-10-15), appliqué par la spec 026 ; révisé le 2026-10-15 après arbitrage du
  propriétaire (lien relisible, six mois d'historique)
- **Date** : 2026-10-15
- **Contexte spec** : `specs/archive/026-abonnement-agenda.md`
- **Portée** : API `nest-portfolio-app` (module `src/booking/`, `src/common/`, `src/config/`,
  `src/instrument.ts`) et front (`features/booking`, `features/admin`)
- **Amende** : ADR-0026 §6 (« les URL sont journalisées : aucun secret dans l'URL ») pour la seule
  route du flux

## Context

Le propriétaire veut ses rendez-vous confirmés dans Calendrier (iPhone) et Google Agenda, retirés
d'eux-mêmes à l'annulation (spec 026, arbitrage 1). Le seul mécanisme commun aux deux est
l'abonnement à une URL iCalendar (`webcal://` chez Apple, « À partir de l'URL » chez Google).

Faits vérifiés le 2026-10-15 :

1. Un client d'abonnement fait un `GET` nu, rafraîchi périodiquement : ni en-tête
   `Authorization`, ni cookie, ni corps. Le seul porteur possible d'un secret est l'URL. Google
   récupère le flux depuis ses propres serveurs, sans aucune session du propriétaire.
2. L'API journalise l'URL de chaque requête : sérialiseur pino `req: { id, method, url }`
   (`app.module.ts`). `HttpExceptionFilter` recopie `req.url` dans le corps de chaque erreur
   (`path`) et dans le log des 5xx, que Sentry reçoit (`@SentryExceptionCaptured`). L'intégration
   HTTP de Sentry trace 20 % des requêtes entrantes en production, URL comprise.
3. Le flux contient des données personnelles : nom, email, téléphone, société et message de
   chaque visiteur. Le secret de l'URL est le seul contrôle d'accès.
4. Le propriétaire veut **relire et copier le lien à tout moment** depuis l'admin (arbitrage du
   2026-10-15). Une empreinte seule l'interdirait.
5. Le déploiement (Dokploy) ne doit pas casser tant que le nouveau secret n'est pas posé. Le schéma
   Zod de l'API fait échouer le démarrage sur une variable requise absente (`env.schema.ts`).
6. La purge nocturne supprime les rendez-vous terminés depuis plus de
   `BOOKING_POLICY.retentionMonths` (6) mois (`booking-scheduler.service.ts`).

## Decision

1. **URL** : `GET /api/booking/feed/<jeton>.ics`, sur un contrôleur public dédié.
   - Le paramètre est analysé par une fonction pure (`^[A-Za-z0-9_-]{43}\.ics$`) et non par un DTO :
     un chemin malformé répond 404, jamais 400.
2. **Dérivation** : `jeton = base64url(HMAC-SHA256(BOOKING_FEED_SECRET, 'booking-feed:' + sel))`, soit
   32 octets, 43 caractères.
   - `BOOKING_FEED_SECRET` : variable d'environnement facultative, au moins 32 caractères, à générer
     par `openssl rand -base64 48`.
   - Le sel est de 16 octets aléatoires en base64url, stocké dans le singleton `booking_setting`
     (`feed_salt`, `feed_created_at`, liés par un `check`).
   - **Régénérer** = tirer un nouveau sel : l'ancien jeton ne correspond plus dès la requête
     suivante, sans liste de révocation.
   - La **vérification** recalcule le jeton attendu et le compare au jeton présenté par
     `timingSafeEqual`, à longueurs égales. Le jeton présenté ne part jamais en paramètre SQL.
3. **Lecture par l'admin** : `GET /api/booking/feed-subscription` (JWT, `Cache-Control: no-store`)
   rend `unconfigured`, `none` ou `active` avec le jeton dérivé ; le `POST` régénère.
   - Ni le sel ni le secret ne sortent de l'API.
   - Le front compose l'URL avec `API_LINK_BASE_URL` (précédent du lien du CV) et dérive `webcal://`
     par substitution du schéma.
4. **Secret absent** : un démarrage normal. Une chaîne vide vaut « absente ».
   - Le flux répond 404, l'admin lit `unconfigured` et affiche « Abonnement non configuré : ajoutez
     la variable `BOOKING_FEED_SECRET` », le `POST` répond 409 `feed_not_configured`.
   - Une valeur **présente mais trop courte** vaut absente et journalise un avertissement qui nomme la
     variable sans sa valeur : une faute de frappe dans Dokploy ne doit pas couper l'API (décision du
     2026-10-15).
5. **404 indistinct** : secret absent, chemin malformé, aucun sel ou jeton faux donnent la même
   `NotFoundException`. Le `path` du corps étant masqué, les corps sont identiques à l'horodatage
   près.
6. **Masquage de l'URL** : une fonction pure `redactUrl` (`src/common/log-redact.ts`) remplace tout
   ce qui suit `/api/booking/feed/` par `[Filtered]`. Elle est appliquée :
   - au sérialiseur pino des requêtes ;
   - au `path` et au log 5xx de `HttpExceptionFilter` ;
   - à `sentryBeforeSend` (`request.url`, `transaction`, `query_string`).

   Les requêtes du flux sont en plus exclues du traçage Sentry (`ignoreIncomingRequests`), comme
   `/api/health`.
7. **Forme du flux** : un `VCALENDAR` sans `METHOD` (objet publié, pas un message iTIP), avec un
   `VEVENT` par rendez-vous `confirmed`.
   - **Fenêtre** : rendez-vous dont la fin tombe après
     `now() - make_interval(months => BOOKING_POLICY.retentionMonths)`, la même expression que la
     purge. Le flux montre exactement ce que la base garde.
   - `UID` = identifiant du rendez-vous, le même que les invitations ; `SEQUENCE:0`,
     `STATUS:CONFIRMED`, `DTSTAMP` = création du rendez-vous.
   - Un rendez-vous annulé est **absent** du flux : les clients d'abonnement suppriment ce qui
     disparaît.
8. **HTTP** : `Content-Type: text/calendar; charset=utf-8`, `Cache-Control: no-store`,
   `X-Robots-Tag: noindex, nofollow`, ETag faible d'Express. Pas de CORS. La limite globale de débit
   (10 requêtes par minute, par route et par IP) suffit.

## Consequences

- **Fuite de la base seule** : elle livre le sel, inutilisable sans le secret, donc aucun lien.
- **Fuite du secret seul** : inutilisable sans le sel, qui ne se devine pas (128 bits). C'est la
  raison du sel aléatoire plutôt qu'un compteur de génération.
- **Fuite des deux, ou du lien lui-même** (capture, partage, journal d'un tiers) : elle donne la liste
  des rendez-vous et les coordonnées des visiteurs jusqu'à la régénération (nouveau sel) ou la
  rotation du secret.
- **Rotation du secret** : changer `BOOKING_FEED_SECRET` invalide **tous** les liens d'un coup.
  - C'est le recours si le secret a fui.
  - Chaque agenda doit ensuite être réabonné avec le lien affiché par l'admin.
  - Retirer la variable désactive le flux. La remettre à l'identique rend l'ancien lien valide, puisque
    le sel est conservé.
  - Le README le documente, avec la mention « à ajouter dans Dokploy ».
- **Journaux** : ceux sous notre contrôle (pino, Sentry, corps d'erreur) ne contiennent jamais le
  jeton. Le journal d'accès de Traefik devant l'API, s'il est activé, et les serveurs de Google qui
  conservent l'URL de l'abonnement ne sont pas sous notre contrôle.
- **Rafraîchissement** : Google rafraîchit un agenda abonné toutes les quelques heures, et une
  annulation peut y rester visible jusqu'à un jour. Apple suit la fréquence choisie sur l'appareil.
- **Historique** : six mois dans l'agenda abonné, puis l'événement disparaît en même temps que la
  purge le supprime de la base.
- **Migration** : additive (deux colonnes nullables, un `check`), donc un retour à l'image précédente
  l'ignore sans risque.

## Alternatives considered

- **Empreinte SHA-256 seule, lien affiché une fois** (première version de ce plan) : aucun secret
  serveur, mais le lien est impossible à relire. Abonner un agenda de plus imposerait de régénérer et
  de réabonner tous les autres. Rejeté par le propriétaire le 2026-10-15.
- **Jeton chiffré en base (AES-GCM, clé en variable d'environnement)** : lien relisible aussi, mais
  un vrai secret stocké (déchiffrable) et une clé à faire tourner, pour le même résultat que la
  dérivation. Rejeté.
- **HMAC sur un compteur de génération** : équivalent, sauf qu'une fuite du secret seul suffit alors
  à recalculer les liens des premières générations. Rejeté au profit du sel aléatoire.
- **Dériver de `JWT_SECRET`** (HKDF avec un libellé distinct) : pas de nouvelle variable, mais la
  rotation des sessions couperait les abonnements, et les deux secrets n'ont pas le même cycle de vie.
  Rejeté.
- **Variable requise au démarrage** : un oubli dans Dokploy arrêterait l'API entière. Rejeté.
- **Jeton en query string (`?token=`)** : même exposition aux journaux que le chemin, et certains
  clients retirent ou réordonnent la query string. Rejeté.
- **Authentification HTTP Basic dans l'URL** : refusée par Google Agenda, mal gérée par iOS. Rejeté.
- **Table dédiée (un lien par agenda)** : permettrait de révoquer un appareil sans toucher aux autres.
  Rejeté (YAGNI : un seul propriétaire, deux agendas).
- **Annulés gardés en `STATUS:CANCELLED`** : rendu variable selon le client. Rejeté : l'exigence 2 veut
  qu'ils disparaissent.
- **Fenêtre propre de 30 jours** : l'historique disparaîtrait de l'agenda alors que la base le garde.
  Rejeté par le propriétaire au profit de `retentionMonths`.
