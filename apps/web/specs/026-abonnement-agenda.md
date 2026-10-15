---
id: 026
title: Abonnement d'agenda des rendez-vous (webcal secret) et mention d'annulation manuelle
type: feature
status: draft
created: 2026-10-15
related: [specs/024-prise-de-rendez-vous.md, specs/025-calendrier-des-disponibilites.md, docs/adr/0026-rendez-vous-instants-utc-et-contrainte-d-exclusion.md]
---

# 026 — Abonnement d'agenda des rendez-vous

## Description

### Objectif

Test réel du propriétaire (2026-10-15) : un rendez-vous ajouté à l'agenda de son iPhone **n'est pas retiré**
quand il est annulé. L'ajout s'est fait par le bandeau « Siri a trouvé un évènement » (iOS Mail), qui crée
un événement indépendant, sans l'`UID` de l'invitation : le `METHOD:CANCEL` envoyé à l'annulation ne peut
pas le rattacher. Pour sa propre copie, le propriétaire est en plus organisateur et destinataire (déjà
relevé : Google Agenda ne l'importait pas).

### Arbitrages du propriétaire (2026-10-15)

1. **Abonnement d'agenda (webcal) pour le propriétaire** : un lien secret qu'il ajoute une fois dans
   Calendrier (iPhone) ou Google Agenda ; ses rendez-vous à venir y apparaissent seuls et une annulation
   les retire à la synchronisation suivante.
2. **Mention dans l'email d'annulation du visiteur** : « Si vous l'aviez ajouté à votre agenda à la main,
   supprimez-le » (l'annulation automatique par `METHOD:CANCEL` reste en place pour les clients qui ont
   importé l'invitation : Gmail, Outlook, ouverture du `.ics`).

### Exigence (contrat)

1. Un flux iCalendar (RFC 5545, `text/calendar`) des rendez-vous **confirmés** du propriétaire, à venir et
   récents, servi par l'API sur une URL secrète, utilisable en abonnement par Apple Calendrier et Google
   Agenda (`webcal://` et `https://`).
2. Un rendez-vous annulé **n'apparaît plus** dans le flux ; chaque événement garde l'`UID` du rendez-vous
   (aligné sur les invitations des specs 024/025) pour que l'agenda remplace plutôt qu'il ne duplique.
3. Secret : jeton aléatoire long, jamais en clair en base (empreinte), **régénérable** depuis l'admin
   (l'ancien lien cesse aussitôt de fonctionner), absent des logs et de Sentry ; réponse 404 indistincte
   pour un jeton faux ou absent ; aucune donnée de visiteur exposée hors du flux authentifié par le jeton.
4. Admin : section « Abonnement d'agenda » (page Rendez-vous ou Disponibilités) avec le lien, un bouton
   « Copier le lien », un lien `webcal://` cliquable, une courte aide (iPhone, Google Agenda) et
   « Régénérer le lien » derrière une confirmation.
5. Email d'annulation au visiteur : la mention de l'arbitrage 2, sans changer les autres emails.
6. Aucune régression des specs 024/025 ; WCAG AA sur la nouvelle section admin (zéro violation au job
   `a11y`).

### Constat (2026-10-15, front `master` `1e07c1f`, API `master` `b2486ce`)

1. Les invitations sont envoyées en une seule alternative `text/calendar` (#57) : visiteur `REQUEST` puis
   `CANCEL` ; propriétaire `PUBLISH` puis `CANCEL`, même `UID` (identifiant du rendez-vous).
2. L'API sait produire un `VEVENT` (`src/booking/to-ics.ts`) mais aucun `VCALENDAR` à plusieurs
   événements ni aucune route publique `text/calendar`.
3. Le propriétaire ajoute aujourd'hui ses rendez-vous à la main via Siri ; ces événements ne suivent ni les
   modifications ni les annulations.

### Hors périmètre

- Synchronisation bidirectionnelle (CalDAV) ou écriture dans l'agenda du propriétaire.
- Abonnement pour les visiteurs.
- Exposer les disponibilités ou les fermetures dans le flux.

## Plan technique

### Décision d'architecture (ADR-0028)

Flux public `GET /api/booking/feed/<jeton>.ics`. Le jeton est dans le **chemin**, parce qu'un client
d'abonnement fait un `GET` nu, sans en-tête ni cookie.

Le jeton est **dérivé, jamais stocké** : `base64url(HMAC-SHA256(BOOKING_FEED_SECRET, 'booking-feed:' + sel))`,
soit 32 octets, 43 caractères.
- `BOOKING_FEED_SECRET` est une nouvelle variable d'environnement de l'API, **facultative**, d'au moins
  32 caractères.
- Le sel est de 16 octets aléatoires en base64url, stocké dans le singleton `booking_setting` avec sa date
  de création.
- Régénérer = tirer un nouveau sel : l'ancien lien ne correspond plus dès la requête suivante.
- La comparaison se fait à **temps constant** (`timingSafeEqual`).

L'admin **relit le lien à tout moment** (`GET feed-subscription`, protégé par JWT, `no-store`), comme le
propriétaire l'a arbitré.

Ce que permet une fuite :
- **la base seule** donne un sel, inutilisable sans le secret ;
- **le secret seul** ne suffit pas non plus : il faut le sel. C'est pour cela qu'on a préféré un sel
  aléatoire à un compteur, qui se devinerait.

La **rotation du secret** invalide tous les liens : c'est documenté, et c'est aussi le recours en cas de
fuite du secret.

**Variable absente** : le démarrage n'échoue pas (Dokploy ne casse pas), le flux répond 404 et l'admin
affiche « Abonnement non configuré ». Une valeur **présente mais trop courte** vaut absente et journalise un
avertissement qui nomme la variable sans sa valeur (décision du 2026-10-15 : une faute de frappe dans
Dokploy ne doit pas couper l'API ni les réservations).

La fonction pure `redactUrl` (`src/common/log-redact.ts`) masque le segment du jeton dans pino, dans le
corps et le log de `HttpExceptionFilter` et dans Sentry. Les requêtes du flux sont en plus exclues du
traçage Sentry. Un jeton faux, malformé ou absent, un abonnement jamais créé et un secret absent reçoivent
tous le **même 404**.

Le flux est un `VCALENDAR` **sans `METHOD`** : c'est un objet publié, pas un message iTIP.
- Il contient les rendez-vous `confirmed` dont la fin tombe dans les **6 derniers mois**, sans borne
  haute (la réservation est déjà bornée à 21 jours).
- La borne réutilise `BOOKING_POLICY.retentionMonths` et l'expression SQL même de la purge nocturne
  (`now() - make_interval(months => …)`), sans nouvelle constante.
- L'`UID` est celui des invitations (`booking.id`), avec `SEQUENCE:0`, `STATUS:CONFIRMED` et `DTSTAMP` =
  `created_at` (stable d'une lecture à l'autre).
- Un rendez-vous annulé **disparaît** du flux.
- Le générateur `to-ics.ts` est factorisé, et `toIcs` doit rester identique à l'octet (les tests existants
  le garantissent).

Côté email, une phrase change dans l'**introduction visiteur** de l'annulation, qui est une chaîne du
`BookingNotifier`. Le gabarit HTML ne bouge pas : ses tests de contraste restent valides sans
modification. Cf. ADR-0028.

**Écarts au brief, justifiés** :

1. **Pas de table dédiée** : un seul propriétaire et un seul lien actif. Le singleton `booking_setting`
   existe déjà (ADR-0027) ; une table serait l'étape suivante si un jour il fallait un lien par appareil.
2. **Mention d'annulation dans l'introduction, pas dans le gabarit** : `booking-cancelled.html` est
   partagé entre l'email du visiteur et celui du propriétaire. Son paragraphe `{{intro}}` porte déjà, côté
   visiteur seulement, la promesse « Il est retiré de votre agenda si vous l'y aviez ajouté ». Cette
   phrase est fausse pour une copie manuelle, et c'est exactement le cas du test réel. On la remplace, ce
   qui ne demande ni nouveau placeholder, ni nouvelle couleur, ni nouveau test de contraste ; l'email du
   propriétaire reste inchangé par construction.
3. **Routes admin `feed-subscription`, pas `feed`** : un chemin distinct du flux public évite qu'une route
   sous garde JWT et une route publique partagent le préfixe `booking/feed`.
4. **Limite de débit globale gardée, sans décorateur** : 10 requêtes par minute, par route et par IP. Un
   iPhone, un iPad et un Mac derrière la même box, à la fréquence la plus courte d'Apple (5 min), font au
   plus 3 requêtes par tranche de 5 minutes. Avec 256 bits de sortie HMAC, la force brute est hors de
   portée, et le throttle ne sert qu'à borner le coût.
5. **Sel aléatoire plutôt que compteur de génération** : même coût, un facteur de plus à voler (voir
   ci-dessus).
6. **Contrat 3 (« empreinte »)** : le propriétaire l'a remplacé le 2026-10-15 par la dérivation HMAC.
   L'esprit est tenu, puisqu'aucune donnée de la base ne permet seule de reconstituer le lien.

### Architecture

```mermaid
flowchart LR
  subgraph clients[Clients d'abonnement]
    IOS[Calendrier iPhone<br/>webcal://]
    GG[Google Agenda<br/>serveurs Google]
  end
  IOS -->|GET feed/:file| FC
  GG -->|GET feed/:file| FC
  subgraph api[API booking]
    FC[BookingFeedController<br/>public] --> FS[BookingFeedService]
    AC[BookingAdminController<br/>JWT] -->|feed-subscription| FS
    FS --> PURE[parseFeedFile · toFeedEvent · toIcsFeed<br/>deriveFeedToken · feedTokenMatches]
    FS --> CFG[AppConfigService.bookingFeedSecret<br/>facultatif]
    FS --> DB[(booking_setting.feed_salt<br/>booking)]
    LOG[redactUrl] -.-> PINO[pino req]
    LOG -.-> HEF[HttpExceptionFilter]
    LOG -.-> SEN[sentryBeforeSend<br/>ignoreIncomingRequests]
  end
  subgraph front[Front /admin/rendez-vous]
    P[AdminBookings] --> F[FeedSubscriptionPanel<br/>facade de page]
    P --> C[admin-booking-feed<br/>section présentationnelle]
    F --> V[toBookingFeedView · toWebcalUrl<br/>purs]
    F --> CB[writeToClipboard<br/>shared, extrait de code-copy]
    F --> G[BookingGateway]
  end
  G -->|GET/POST feed-subscription| AC
```

**API**

- **Configuration** :
  - `env.schema.ts` :
    ```ts
    BOOKING_FEED_SECRET: z.preprocess((v) => (v === '' ? undefined : v),
      z.string().min(32, { message: 'BOOKING_FEED_SECRET must be at least 32 characters' }).optional())
    ```
    Une variable vide dans Dokploy vaut « absente », et non une erreur de démarrage.
  - `AppConfigService.bookingFeedSecret: string | undefined`.
  - Valeur à générer : `openssl rand -base64 48` (64 caractères).
- `feed-token.ts` (pur, sauf l'aléa de `createFeedSalt`) :
  - `deriveFeedToken(secret, salt)` = `createHmac('sha256', secret).update(\`booking-feed:${salt}\`).digest('base64url')`
    (43 caractères) ;
  - `createFeedSalt()` = `randomBytes(16).toString('base64url')` (22 caractères) ;
  - `feedTokenMatches(candidate, expected)` : longueurs égales, puis `timingSafeEqual` sur les deux
    `Buffer` UTF-8 ; longueurs différentes → `false` sans appel.

  Le module `cancel-token.ts` **n'est pas touché** : aucun besoin commun, puisque le jeton du flux n'est
  ni aléatoire ni haché.
- `parseFeedFile(file): string | null` (`booking-feed.ts`) : `^([A-Za-z0-9_-]{43})\.ics$`, sinon `null`.
  Express décode le paramètre avant l'appel, donc un `%2F` devient `/` et la regex le rejette.
- `BookingFeedService.renderFeed(file): Promise<string | null>` :
  1. secret absent → `null`, sans requête SQL ;
  2. `parseFeedFile` ; `null` → `null`, sans requête SQL ;
  3. `select feed_salt from booking_setting where id = 'main'` ; ligne absente ou sel `null` → `null` ;
  4. `feedTokenMatches(token, deriveFeedToken(secret, salt))` faux → `null`. Le jeton présenté ne part
     jamais en paramètre SQL ;
  5. `select * from booking where status = 'confirmed' and ends_at > now() - make_interval(months => ${BOOKING_POLICY.retentionMonths}) order by starts_at`.
     C'est la même expression que `purgeExpired` : le flux montre exactement ce que la purge n'a pas
     encore supprimé ;
  6. `toIcsFeed({ name, refreshMinutes, events: rows.map(row => toFeedEvent(row, siteUrl)) })`.

  Le contrôleur transforme `null` en `new NotFoundException()` (aucun corps propre). Les cas
  « secret absent », « malformé », « aucun sel » et « jeton faux » donnent le même corps, puisque `path`
  est masqué.
- `BookingFeedService.readSubscription(): Promise<FeedSubscription>`, avec
  `FeedSubscription = { status: 'unconfigured' } | { status: 'none' } | { status: 'active'; token: string; createdAt: string }` :
  - secret absent → `unconfigured`, **sans** lecture de la base ;
  - sel `null` ou ligne absente → `none` ;
  - sinon `active`, avec le jeton dérivé.

  Le secret absent n'est pas une erreur : c'est une donnée de l'écran.
- `BookingFeedService.regenerate(): Promise<FeedSubscription & { status: 'active' }>` :
  - secret absent → `ConflictException({ error: 'feed_not_configured', message: 'Abonnement non configuré.' })` ;
  - sinon `insert into booking_setting (id, feed_salt, feed_created_at) values ('main', $sel, now())
    on conflict (id) do update set feed_salt = excluded.feed_salt, feed_created_at =
    excluded.feed_created_at, updated_at = now() returning feed_created_at`, puis `active` avec le
    jeton dérivé du nouveau sel ;
  - le défaut de `close_public_holidays` ne joue qu'à la création de la ligne ; une ligne existante garde
    son réglage.
- `toFeedEvent(row, siteUrl): IcsFeedEvent` (pur, `booking-feed.ts`), contenu exact en section Modèles.
  `meetingOf` est **extrait** de `booking-notifier.service.ts` vers `booking-meeting.ts` (export) et
  réutilisé : la ligne « Lien de visio / Téléphone » et `LOCATION` restent identiques entre l'invitation
  et le flux.
- `to-ics.ts` : `veventLines(core)` interne (UID → LOCATION, échappement et repli communs) ;
  `calendarLines(props, events)` interne ; `toIcs(event)` y ajoute `METHOD` et ORGANIZER/ATTENDEE comme
  aujourd'hui ; `toIcsFeed(feed)` exporté.
- Masquage (inchangé par l'arbitrage) :
  - `redactUrl(url: string | undefined)` (`log-redact.ts`) : `/^(\/api\/booking\/feed\/)[^]*$/` →
    `$1[Filtered]`, query string comprise ; le reste passe tel quel, y compris
    `/api/booking/feed-subscription`.
  - `serializeRequest(req)` (`log-redact.ts`, sorti de l'inline d'`app.module.ts`) :
    `{ id, method, url: redactUrl(url) }`.
  - `HttpExceptionFilter` : `path: redactUrl(req.url)` et `redactUrl` dans le log 5xx.
  - `sentryBeforeSend` : `request.url` passé à `redactUrl`, `request.query_string` supprimé si l'URL est
    celle du flux, `event.transaction` passé à `redactUrl`.
  - `isUntracedIncomingRequest(url)` (`sentry-before-send.ts`) : `/api/health` ou préfixe
    `/api/booking/feed/`, branché sur `httpIntegration({ ignoreIncomingRequests })` d'`instrument.ts`.
  - La réponse JSON de `GET`/`POST feed-subscription` porte le jeton : ni pino (qui ne journalise que la
    requête) ni Sentry (qui ne capture pas les réponses) ne la reçoivent. Le secret lui-même n'est
    journalisé nulle part : `validateEnv` ne cite que le nom de la variable dans ses erreurs.
- Notifier : la constante `MANUAL_CALENDAR_NOTE` remplace « Il est retiré de votre agenda si vous l'y
  aviez ajouté. » dans les **deux** introductions visiteur (annulation par le propriétaire et par le
  visiteur). Texte exact :
  « Si votre agenda avait enregistré l’invitation, le rendez-vous en est retiré ; si vous l’y aviez
  ajouté à la main, supprimez-le. »
  Les introductions de l'email du propriétaire ne changent pas.

**Front**

- Section « Abonnement d'agenda » sur `/admin/rendez-vous`, sous la liste : le flux, ce sont les
  rendez-vous. Pour les landmarks, la page est dans le shell admin : la section est une
  `<section aria-labelledby>` avec un `h2`, sous l'unique `h1` (`AdminPageHeader`), sans
  `header`/`main`/`footer`.
- **Frontière facade / présentation** :
  - `FeedSubscriptionPanel` (`pages/admin-bookings/feed-subscription-panel.ts`, renommée le 2026-10-15 : le type du domaine porte déjà `BookingFeedSubscription`) : **facade** déclarée
    dans les `providers` de la page, sans suffixe `Store`. Elle possède la ressource de l'abonnement,
    l'état « création en cours », la copie au presse-papiers et les toasts. Aucune dépendance DOM. Le
    lien n'est **jamais écrit en storage**. La page reste sous le seuil de 250 LOC.
  - `toBookingFeedView(subscription)` et `toWebcalUrl(url)` (`application/booking-feed-view.ts`, purs) :
    ils traduisent l'état en `unconfigured | none | active`.
  - `admin-booking-feed` (`application/components/admin-booking-feed.ts`) : section présentationnelle.
    Entrées : `view`, `state`, `regenerating`. Sorties : `copyRequested`, `regenerateRequested`, `retry`.
    Elle porte un `ConfirmDialog` local, dont l'ouverture est un `signal` d'UI.
- Rendu par état :
  - `loading` : squelette dans un `role="status"` (« Chargement de l'abonnement… »).
  - `error` : `app-load-error` + Réessayer.
  - `unconfigured` : « Abonnement non configuré : ajoutez la variable `BOOKING_FEED_SECRET` (32 caractères
    au moins, par exemple la sortie de `openssl rand -base64 48`) à l'environnement de l'API dans
    Dokploy, puis redéployez l'API. » Aucun bouton d'action, aucune aide.
  - `none` : « Aucun lien d'abonnement pour l'instant. »
  - `active` :
    - `<label for>` « Lien d'abonnement » + `<input type="text" readonly class="form-input">` (valeur =
      URL https, sélectionnable à la main) ;
    - bouton « Copier le lien » (`appButton`, icône `clipboard`, déjà au sprite) ;
    - lien `<a appButton variant="outlined" [href]="webcalUrl">Ouvrir dans Calendrier</a>` (le sanitizer
      Angular ne bloque que `javascript:`) ;
    - « Lien créé le jeudi 15 octobre 2026 à 10:32. »
  - L'aide est visible en `active` seulement (`<ul role="list">`) :
    - « iPhone : touchez « Ouvrir dans Calendrier » puis « S'abonner », ou, dans Calendrier,
      Calendriers › Ajouter un calendrier › Ajouter un calendrier avec abonnement, et collez le lien.
      Choisissez une mise à jour toutes les 15 minutes. »
    - « Google Agenda (ordinateur) : Autres agendas › + › À partir de l'URL, collez le lien. Google met
      l'agenda à jour toutes les quelques heures : une annulation peut y rester visible jusqu'à un jour. »
    - « Ce lien donne accès aux coordonnées de vos visiteurs : ne le partagez pas. En cas de doute,
      régénérez-le. »
    - « Une fois abonné, n'ajoutez plus les rendez-vous à la main depuis l'email : ces copies ne suivent
      pas les annulations. »
  - **Un seul bouton d'action**, hors du `@switch`, présent en `none` et `active` :
    - libellés : `none` → « Créer le lien d'abonnement » (création directe, rien à invalider),
      `active` → « Régénérer le lien » (ouvre la confirmation) ;
    - l'élément reste le même d'un état à l'autre : le focus n'est jamais perdu, et le `<dialog>` natif
      rend le focus au bouton à sa fermeture ;
    - pendant l'appel, le bouton passe en `aria-disabled="true"` et l'activation est ignorée (précédent :
      l'interrupteur des fériés), jamais `disabled` ;
    - en `unconfigured`, il n'est pas rendu (aucune transition ne mène de cet état à un autre sans
      rechargement).
  - Confirmation : titre « Régénérer le lien d'abonnement ? » ; corps « L'ancien lien cessera aussitôt
    de fonctionner : les agendas qui y sont abonnés ne recevront plus vos rendez-vous tant que vous ne
    les aurez pas abonnés au nouveau. » ; boutons « Régénérer le lien » / « Garder le lien actuel ».
- Toasts (`ToastStore`, live region existante) :
  - création : « Lien d'abonnement créé : ajoutez-le à vos agendas. » ;
  - régénération : « Nouveau lien créé : l'ancien ne fonctionne plus. Remplacez-le dans vos agendas. » ;
  - copie : « Lien copié dans le presse-papiers » ;
  - échec de copie : « Copie impossible : sélectionnez le lien et copiez-le à la main. » ;
  - échec de création :
    - `not-configured` → « Abonnement non configuré : ajoutez BOOKING_FEED_SECRET à l'API. », suivi d'une
      relecture de l'abonnement ;
    - `network` → « Création impossible : vérifiez votre connexion, puis réessayez. » ;
    - autres → « Création impossible : le serveur n'a pas répondu. Réessayez dans un instant. ».

  Le toast est le retour accessible de la copie, sur le modèle de l'annulation dans la même page. Deux
  copies successives créent deux toasts, donc deux annonces, sans le contournement de
  vidage-réécriture de `code-copy`.
- Presse-papiers : `writeToClipboard(text): Promise<boolean>` est **extrait** de
  `features/blog/application/components/code-copy.ts` (fonction privée aujourd'hui) vers
  `shared/clipboard/write-to-clipboard.ts`, et `code-copy.ts` l'importe. C'est le seul patron de copie du
  repo. La facade appelle `PendingTasks.run(...)` (même précédent), si bien que
  `await fixture.whenStable()` attend la copie.
- Aucune couleur nouvelle : seulement des utilitaires et variantes existants (`form-label`, `form-input`,
  `appButton` `primary`/`outlined`, `text-muted`, `app-load-error`, `app-skeleton`). Aucun ratio à
  calculer, et l'audit axe de F4 tranche.

### Contrat d'API (préfixe `/api/booking`)

Corps d'erreur : `HttpExceptionFilter` existant, `path` masqué pour le flux.

| Méthode, route | Accès | Réponse |
|---|---|---|
| `GET feed/:file` | public, throttle global | 200 corps iCalendar, en-têtes ci-dessous ; **404** `{ statusCode: 404, error: 'Not Found', message: 'Not Found', path: '/api/booking/feed/[Filtered]', timestamp }` identique pour un secret absent, un fichier malformé, aucun abonnement ou un jeton faux ; 429 au-delà de la limite |
| `GET feed-subscription` | `JwtAuthGuard` de classe, `Cache-Control: no-store` | 200 `{ status: 'unconfigured' }` \| `{ status: 'none' }` \| `{ status: 'active', token: string, createdAt: string }` ; 401 |
| `POST feed-subscription` | `JwtAuthGuard` de classe, corps vide, `Cache-Control: no-store` | 201 `{ status: 'active', token, createdAt }` ; 409 `feed_not_configured` ; 401 |

Ni le secret, ni le sel ne sortent jamais de l'API.

En-têtes du `200` du flux, par `@Header` sur la méthode :

- `Content-Type: text/calendar; charset=utf-8` ;
- `Cache-Control: no-store` ;
- `X-Robots-Tag: noindex, nofollow`.

L'ETag faible d'Express reste actif et permet le 304. Aucun CORS. `HEAD` est servi par Express.
Swagger : `@ApiOperation` sur chaque route, et `@ApiResponse({ status: 404 })` sur le flux, sans
exposer le format du jeton.

Corps du flux (CRLF, lignes repliées à 75 octets, TEXT échappé par les fonctions existantes) :

```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//nedellec-julien.fr//Booking//FR
CALSCALE:GREGORIAN
NAME:Rendez-vous nedellec-julien.fr
X-WR-CALNAME:Rendez-vous nedellec-julien.fr
REFRESH-INTERVAL;VALUE=DURATION:PT15M
X-PUBLISHED-TTL:PT15M
BEGIN:VEVENT
UID:<booking.id>
SEQUENCE:0
STATUS:CONFIRMED
DTSTAMP:<created_at UTC>
DTSTART:<starts_at UTC>
DTEND:<ends_at UTC>
SUMMARY:Appel de cadrage · <name>
DESCRIPTION:<voir Modèles>
LOCATION:<meetingOf(row).location>
END:VEVENT
END:VCALENDAR
```

Sans rendez-vous, l'enveloppe est rendue seule. RFC 5545 exige en principe au moins un composant, mais
Apple et Google acceptent un calendrier vide (cf. Risques).

### Modèles de données

**API — `src/database/schema/booking.ts`**, dans `bookingSettings` :

- `feedSalt: text('feed_salt')` et
  `feedCreatedAt: timestamp('feed_created_at', { withTimezone: true })`, nullables ;
- `check('booking_setting_feed_check', sql\`(${t.feedSalt} is null) = (${t.feedCreatedAt} is null)\`)`.

Le type `BookingSetting` (`$inferSelect`) suit.

```sql
-- drizzle/0026_booking_feed.sql (pnpm db:generate --name booking_feed, relu ; tranche A1)
ALTER TABLE "booking_setting" ADD COLUMN "feed_salt" text;
ALTER TABLE "booking_setting" ADD COLUMN "feed_created_at" timestamp with time zone;
ALTER TABLE "booking_setting" ADD CONSTRAINT "booking_setting_feed_check"
  CHECK (("booking_setting"."feed_salt" is null) = ("booking_setting"."feed_created_at" is null));
```

Migration additive : aucune donnée lue ni réécrite, et la ligne existante reçoit `null`/`null`, qui
satisfait le check.

**API — logique pure** :

```ts
// to-ics.ts
export type IcsFeedEvent = { uid: string; stamp: Date; startsAt: Date; endsAt: Date;
  summary: string; description: string; location: string };
export type IcsFeed = { name: string; refreshMinutes: number; events: readonly IcsFeedEvent[] };
export function toIcsFeed(feed: IcsFeed): string;

// booking-feed.ts (fenêtre : BOOKING_POLICY.retentionMonths, aucune constante de durée ici)
export const BOOKING_FEED = { refreshMinutes: 15, calendarName: 'Rendez-vous nedellec-julien.fr' } as const;
export function parseFeedFile(file: string): string | null;
export function toFeedEvent(row: Booking, siteUrl: string): IcsFeedEvent;

// feed-token.ts
export function deriveFeedToken(secret: string, salt: string): string;   // HMAC-SHA256 base64url, 43 caractères
export function createFeedSalt(): string;                                // 16 octets base64url, 22 caractères
export function feedTokenMatches(candidate: string, expected: string): boolean; // timingSafeEqual
```

`DESCRIPTION` de `toFeedEvent`, lignes jointes par `\n` (échappées en `\n` par `escapeText`) ; une ligne
dont la valeur est absente est omise :

```
Appel de cadrage de 30 minutes avec <name>.
<meeting.label> : <meeting.value>
Email : <email>
Téléphone : <phone>          ← seulement si format = video et phone non nul (en téléphone, déjà dans la ligne meeting)
Société : <company>          ← si non nul
Message :
<message>
Gérer : <siteUrl>/admin/rendez-vous
```

`stamp` = `row.createdAt`. `siteUrl` = `config.publicSiteUrl` sans slash final, même normalisation que
`BookingNotifier.siteUrl()`.

**Front — `features/booking/domain/models/booking-admin.model.ts`** (`type` immuables) :

```ts
export type BookingFeedSubscription =
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'none' }
  | { readonly kind: 'active'; readonly url: string; readonly createdAt: string }; // url https absolue
```

Ajout de `'not-configured'` à `BookingAdminFailure`. `toAdminFailure` : `409` + `feed_not_configured` →
`not-configured` ; les autres `409` sont inchangés.

**Front — infra** :

- DTO `BookingFeedSubscriptionDto = { status: 'unconfigured' } | { status: 'none' } | { status: 'active';
  token: string; createdAt: string }` (`booking-api.types.ts`).
- Adapter pur `toBookingFeedSubscription(dto, feedBaseUrl)` (`booking.adapter.ts`), copie champ par champ.
- `HttpBookingGateway` injecte `API_LINK_BASE_URL` et `DOCUMENT`, et calcule
  `feedBaseUrl = new URL(\`${linkBase}/booking/feed/\`, document.location.href).href`. URL du flux =
  `${feedBaseUrl}${encodeURIComponent(token)}.ics`. Elle est absolue en développement aussi (`/api` y est
  relatif), comme en production (`https://api.nedellec-julien.fr/api/booking/feed/…`).
- Validation runtime des réponses non vérifiée (profil).

**Front — `features/admin/application/booking-feed-view.ts`** :

```ts
export type BookingFeedView =
  | { readonly kind: 'unconfigured' }
  | { readonly kind: 'none'; readonly actionLabel: 'Créer le lien d'abonnement' }
  | { readonly kind: 'active'; readonly since: string; readonly url: string; readonly webcalUrl: string;
      readonly actionLabel: 'Régénérer le lien' };
export function toBookingFeedView(subscription: BookingFeedSubscription): BookingFeedView;
export function toWebcalUrl(url: string): string; // ^https?: → webcal:
```

`since` = `formatParisDateTime(createdAt)` existant (« jeudi 15 octobre 2026 à 10:32 », « 1er »).

### Fichiers à créer / modifier

**API (`/home/j-ned/Projects/Portfolio/nest-portfolio-app`, branche `feat/booking-feed` depuis `origin/master`
`b2486ce` ; la copie de travail est aujourd'hui sur `fix/emails-thunderbird`)**

| Fichier | Rôle |
|---|---|
| `src/config/env.schema.ts`, `app-config.service.ts` | `BOOKING_FEED_SECRET` facultatif (vide = absent, ≥ 32 sinon), `bookingFeedSecret` |
| `src/database/schema/booking.ts` | deux colonnes et `check` sur `bookingSettings` |
| `drizzle/0026_booking_feed.sql`, `drizzle/meta/0026_snapshot.json`, `_journal.json` | générés |
| `src/booking/feed-token.ts` | `deriveFeedToken`, `createFeedSalt`, `feedTokenMatches` |
| `src/booking/booking-meeting.ts` | `Meeting`, `meetingOf` extraits du notifier |
| `src/booking/booking-notifier.service.ts` | importe `meetingOf` ; `MANUAL_CALENDAR_NOTE` dans les deux introductions visiteur |
| `src/booking/to-ics.ts` | `veventLines` / `calendarLines` internes, `IcsFeedEvent`, `IcsFeed`, `toIcsFeed` |
| `src/booking/booking-feed.ts` | `BOOKING_FEED`, `parseFeedFile`, `toFeedEvent` |
| `src/booking/booking-feed.service.ts` | `renderFeed`, `readSubscription`, `regenerate` |
| `src/booking/booking-feed.controller.ts` | `GET booking/feed/:file` public |
| `src/booking/booking-admin.controller.ts` | `GET` / `POST feed-subscription` (`no-store`) |
| `src/booking/booking.module.ts` | `BookingFeedController`, `BookingFeedService` |
| `src/common/log-redact.ts` | `redactUrl`, `serializeRequest` |
| `src/app.module.ts` | `serializers.req: serializeRequest` |
| `src/common/filters/http-exception.filter.ts` | `redactUrl` sur `path` et le log 5xx |
| `src/common/sentry-before-send.ts` | masquage `request.url` / `query_string` / `transaction`, `isUntracedIncomingRequest` |
| `src/instrument.ts` | `ignoreIncomingRequests: isUntracedIncomingRequest` |
| `src/**/*.spec.ts`, `booking.integration.spec.ts` | tests (rôle de `qa`) |
| `README.md` | ligne `BOOKING_FEED_SECRET` du tableau Configuration (facultatif, ≥ 32, `openssl rand -base64 48`, **à ajouter dans Dokploy**, rotation = tous les liens invalidés) ; flux, routes admin, masquage, aide d'abonnement |

**Front (`/home/j-ned/Projects/Portfolio/ng-portfolio-app`, branche `feat/026-abonnement-agenda`)**

| Fichier | Rôle |
|---|---|
| `src/app/features/booking/domain/models/booking-admin.model.ts` | `BookingFeedSubscription`, raison `not-configured` |
| `src/app/features/booking/domain/gateways/booking.gateway.ts` | `getFeedSubscription()`, `regenerateFeedSubscription()` |
| `src/app/features/booking/infra/booking-api.types.ts`, `booking.adapter.ts`, `http-booking.gateway.ts` | DTO, adapter, deux méthodes (`silentErrors()`), URL composée, `toAdminFailure` étendu |
| `src/app/features/booking/testing/stub-booking-gateway.ts`, `booking-builders.ts` | deux méthodes doublées ; `aBookingFeedSubscription`, builders DTO |
| `src/app/shared/clipboard/write-to-clipboard.ts` | extrait de `code-copy.ts` |
| `src/app/features/blog/application/components/code-copy.ts` | importe `writeToClipboard` (fonction privée supprimée) |
| `src/app/features/admin/application/booking-feed-view.ts` | vue pure, `toWebcalUrl` |
| `src/app/features/admin/application/components/admin-booking-feed.ts` | section, aide, confirmation |
| `src/app/features/admin/pages/admin-bookings/feed-subscription-panel.ts` | facade |
| `src/app/features/admin/pages/admin-bookings/admin-bookings.ts` | `providers: [BookingFeedSubscription]`, section sous la liste |
| `ci/api-stub/server.mjs` | `GET` / `POST /api/booking/feed-subscription` |
| `e2e/a11y/booking-states.spec.ts` | scénario « lien affiché » |

### Réactivité / état

- **`FeedSubscriptionPanel`** (facade : rien n'est partagé hors de l'écran, donc pas de store) :
  - `subscription = rxResource({ stream: () => gateway.getFeedSubscription() })`. Les erreurs de lecture
    arrivent brutes, comme `getAvailabilityCalendar`.
  - `_regenerating = signal(false)`.
  - `view = computed(() => subscription.hasValue() ? toBookingFeedView(subscription.value()) : null)` ;
    `state = computed(() => loadState(subscription, () => false))`.
  - `regenerate()` : déjà en cours → rien ; sinon `_regenerating.set(true)`, puis
    `regenerateFeedSubscription()` et `finalize` → `false`.
    - Succès : `subscription.set(data)` (nouvelle référence), puis le toast de création ou de
      régénération selon l'état d'avant.
    - Échec : toast, et l'état affiché est gardé (le serveur n'a rien écrit) ; `not-configured` →
      `subscription.reload()`.
  - `copyLink()` : pas d'état `active` → rien ; sinon `PendingTasks.run(() => writeToClipboard(url))` →
    toast succès ou échec.
  - `reload()` → `subscription.reload()`.
  - Aucune `effect()` : toutes les écritures partent d'un événement. Signaux exposés par
    `asReadonly()`.
- **`admin-booking-feed`** : seul état local, `_confirmOpen = signal(false)`. Activer le bouton d'action
  en `none` émet `regenerateRequested` directement ; en `active`, il ouvre la confirmation, qui émet à la
  validation. `regenerating()` vrai → activation ignorée.
- Immutabilité : modèles `readonly`, état remplacé, jamais muté.

### Tranches

Commandes :

- **API** : `pnpm test -- src/booking src/common src/config src/mailer; echo $?`, puis
  `pnpm test; echo $?`, `pnpm lint`, `pnpm build`.
- **Intégration sur Postgres jetable** :
  1. `docker run --rm -d --name booking-it -e POSTGRES_PASSWORD=it -p 55433:5432 postgres:17-alpine` ;
  2. `BOOKING_IT_DATABASE_URL=postgres://postgres:it@127.0.0.1:55433/postgres pnpm test -- booking.integration; echo $?` ;
  3. `docker stop booking-it`.
- **Front** : `pnpm test --include='src/app/{features/admin,features/booking,features/blog,shared/clipboard}/**/*.spec.ts'; echo $?`
  (pnpm 10 : sans `--`), puis `pnpm test; echo $?`, `pnpm lint`, `pnpm run format:check`,
  `pnpm run build --configuration production`.

Le code de sortie fait foi.

**API (PR 1, `nest-portfolio-app`)**

- **Tranche A1 — qui détient le jeton lit ses rendez-vous confirmés en iCalendar** :
  - contenu : variable `BOOKING_FEED_SECRET`, schéma et migration `0026`, `feed-token.ts`,
    `booking-meeting.ts`, factorisation de `to-ics.ts` et `toIcsFeed`, `booking-feed.ts`,
    `BookingFeedService` (`renderFeed`, `regenerate`), `BookingFeedController`, module ;
  - vérifiable :
    - unitaires purs (`parseFeedFile`, `toIcsFeed`, `toFeedEvent`, `feed-token`, schéma d'env) et
      `to-ics.spec.ts` existant vert sans modification ;
    - unitaires du service ; supertest (200 avec en-têtes, 404 identiques, secret absent compris) ;
    - intégration : migration `0026` au journal ; `regenerate()` puis `GET` → 200 avec le rendez-vous
      confirmé, sans le rendez-vous annulé ni celui terminé il y a 7 mois ; `regenerate()` à nouveau →
      l'ancien jeton reçoit 404 ; un autre secret → l'ancien jeton reçoit 404.
- **Tranche A2 — le jeton n'apparaît dans aucun journal** :
  - contenu : `redactUrl`, `serializeRequest`, `HttpExceptionFilter`, `sentryBeforeSend`,
    `isUntracedIncomingRequest`, `instrument.ts` ;
  - vérifiable :
    - unitaires ; supertest, corps 404 avec `path` masqué ;
    - runtime : `pnpm build && BOOKING_FEED_SECRET=… node dist/main.js` sur la base jetable, `curl` du
      flux avec un jeton valide puis avec un faux, puis `grep -c <jeton>` et `grep -c <secret>` sur la
      sortie du processus → `0` et `0` ;
    - même démarrage **sans** la variable : processus démarré, flux en 404.
- **Tranche A3 — l'admin lit, crée et régénère le lien** :
  - contenu : `readSubscription`, `GET` / `POST feed-subscription`, README ;
  - vérifiable :
    - supertest : 401 sans session ; `unconfigured` sans secret et `POST` → 409 `feed_not_configured` ;
      `none` → `POST` 201 → `GET` rend le même jeton ; `cache-control: no-store` sur les deux routes ;
      aucune clé `salt` ni secret dans les corps ;
    - intégration : `close_public_holidays` inchangé par l'upsert ;
    - `node dist/main.js` : routes mappées.
- **Tranche A4 — l'email d'annulation dit au visiteur de supprimer une copie manuelle** :
  - contenu : `MANUAL_CALENDAR_NOTE` ;
  - vérifiable : `booking-notifier.service.spec.ts` ; `src/mailer/mail-templates.spec.ts` vert sans
    modification (gabarit inchangé).

**Front (PR 2, après déploiement de l'API — CLAUDE.md item 10)**

- **Tranche F1 — la gateway parle le contrat de l'abonnement** :
  - contenu : modèles, deux méthodes abstraites, DTO, adapter, `HttpBookingGateway`, `toAdminFailure`,
    stub, builders ;
  - vérifiable : `HttpTestingController` (URL, verbe, corps vide ; les trois statuts ; URL du flux
    absolue composée sur `API_LINK_BASE_URL` ; échecs `0` / `409 feed_not_configured` / `500` →
    `network` / `not-configured` / `server`).
- **Tranche F2 — la section montre l'état et crée ou régénère le lien** :
  - contenu : `booking-feed-view.ts`, facade (lecture, `regenerate`), `admin-booking-feed` (quatre états
    rendus, aide, lien `webcal://`, confirmation), branchement dans la page ;
  - vérifiable : purs, puis specs de la page (`unconfigured` sans bouton ; créer sans confirmation ;
    régénérer avec confirmation ; annuler la confirmation → aucune requête ; double activation → un seul
    `POST` ; échec → toast et lien précédent gardé ; focus resté sur le bouton d'action ; lien relu
    affiché dès le chargement).
- **Tranche F3 — le lien se copie avec un retour annoncé** :
  - contenu : `writeToClipboard` extrait, `code-copy.ts` adapté, `copyLink`, toasts ;
  - vérifiable : spec de la page (copie de l'URL exacte, toast succès ; `writeText` rejeté → toast
    d'échec) ; `code-copy.spec.ts` vert sans modification.
- **Tranche F4 — zéro violation axe sur la section** :
  - contenu : doublure et scénario (cf. Consignes) ;
  - vérifiable : `docker build -t ng-portfolio-app:a11y . && ci/a11y-stack.sh up && pnpm a11y; echo $?`,
    puis `ci/a11y-stack.sh down`. Tranche d'audit : on s'attend à la voir verte d'emblée (exception actée
    en 024).

### Consignes pour `qa`

- **Purs sans Nest ni TestBed** : `feed-token`, `to-ics`, `booking-feed`, `booking-meeting`,
  `log-redact`, `sentry-before-send`, `env.schema` ; côté front, `booking-feed-view` et
  `booking.adapter`.
- **`env.schema`, `it.each`** :
  - variable absente → valide, `undefined` ;
  - `''` → valide, `undefined` ;
  - 31 caractères → erreur citant `BOOKING_FEED_SECRET` mais **pas la valeur** ;
  - 32 caractères → valide.
- **`feed-token`** :
  - `deriveFeedToken` est déterministe (deux appels → même valeur), produit 43 caractères
    `[A-Za-z0-9_-]` acceptés par `parseFeedFile`, et change avec le sel comme avec le secret ;
  - vecteur figé : calculé une fois avec `node -e` sur `secret = 'a'.repeat(32)`, `salt = 'AAAAAAAAAAAAAAAAAAAAAA'`,
    puis recopié dans le test (le nombre se calcule, il ne s'affirme pas) ;
  - `createFeedSalt` : 22 caractères, deux appels différents ;
  - `feedTokenMatches` : égal → vrai ; un caractère différent → faux ; longueurs différentes → faux, sans
    exception ;
  - `timingSafeEqual` appelé uniquement à longueurs égales (spy).
- **`parseFeedFile`, `it.each`** :
  - accepté : 43 caractères `[A-Za-z0-9_-]` + `.ics` → le jeton ;
  - rejetés (`null`) : 42 et 44 caractères ; `.ICS` ; sans suffixe ; `+`, `/` ou `=` dans le jeton ;
    chaîne vide ; `<jeton>.ics.ics`.
- **`toIcsFeed`** :
  - aucune ligne `METHOD`, `ORGANIZER` ni `ATTENDEE` ;
  - `NAME`, `X-WR-CALNAME`, `REFRESH-INTERVAL;VALUE=DURATION:PT15M`, `X-PUBLISHED-TTL:PT15M` présents
    une fois chacun ;
  - deux événements → deux `BEGIN:VEVENT`, dans l'ordre reçu ; zéro événement → enveloppe seule ;
  - CRLF partout, repli à 75 octets sur un nom à émojis ;
  - `to-ics.spec.ts` existant : **aucune modification** (sortie de `toIcs` identique à l'octet).
- **`toFeedEvent`** :
  - `UID` = `id` ; `DTSTAMP` = `createdAt`, pas l'heure courante (deux appels à 1 min d'écart → même
    sortie) ;
  - `SUMMARY` = « Appel de cadrage · Marie Dupont » ;
  - visio avec téléphone et société → lignes « Lien de visio », « Email », « Téléphone », « Société » ;
    téléphone sans société → pas de ligne « Société » et une seule ligne de téléphone ;
  - message sur trois lignes → échappé en `\n` dans la ligne repliée ;
  - `LOCATION` égal à celui de l'invitation pour la même ligne.
- **`renderFeed` (unitaire, mocks)** :
  - secret absent ou fichier malformé → `null` sans aucun appel à la base ;
  - sel `null` → `null` ;
  - jeton dérivé d'un autre sel → `null` ;
  - le jeton présenté n'apparaît dans aucun argument de requête (assertion sur le mock).
- **Fenêtre (intégration, date réelle)** :
  - fin à `now() - interval '5 months'` → présent ; à `now() - interval '7 months'` → absent ; à venir →
    présent ; `cancelled` à venir → absent ;
  - l'expression SQL est celle de `purgeExpired`, avec `BOOKING_POLICY.retentionMonths` : le golden de
    `booking-policy.spec.ts` reste inchangé.
- **404 indistinct (supertest)** : secret absent, malformé, jeton bien formé faux, aucun sel → statuts
  égaux et corps égaux une fois `timestamp` retiré, `path` = `/api/booking/feed/[Filtered]`.
- **200 (supertest)** : `content-type` = `text/calendar; charset=utf-8`, `cache-control` = `no-store`,
  `x-robots-tag` = `noindex, nofollow`, corps qui commence par `BEGIN:VCALENDAR\r\n`.
- **`redactUrl`, `it.each`** :
  - `/api/booking/feed/abc.ics` et `/api/booking/feed/abc.ics?x=1` → `/api/booking/feed/[Filtered]` ;
  - `/api/booking/feed-subscription`, `/api/booking/slots` et `undefined` → inchangés ;
  - `serializeRequest` rend `{ id, method, url }` masqué ;
  - `HttpExceptionFilter` : `path` masqué et message du log 5xx sans le jeton (spy sur le logger) ;
  - `sentryBeforeSend` : `request.url`, `transaction` masqués, `query_string` retiré, événement d'origine
    non muté ;
  - `isUntracedIncomingRequest` : `/api/health` et `/api/booking/feed/x` → vrai, `/api/booking/slots`
    → faux.
- **Admin (supertest + intégration)** :
  - `GET` et `POST` sans session → 401 ;
  - sans secret : `GET` → `{ status: 'unconfigured' }` sans requête SQL, `POST` → 409
    `feed_not_configured` ;
  - avec secret : `GET` → `none`, puis `POST` → 201 `active` avec un `token` conforme à `parseFeedFile` ;
    le `GET` suivant rend **le même** `token` et le même `createdAt` ; un second `POST` → nouveau jeton ;
  - aucune clé `salt` ni secret dans les corps ; `cache-control: no-store` sur les deux routes ;
  - `close_public_holidays` posé à `false` avant le `POST` reste `false` ;
  - les intégrations existantes mettent `feed_salt`/`feed_created_at` à `null` dans leur `beforeEach`
    si elles partagent `booking_setting`.
- **Notifier** :
  - les deux introductions visiteur contiennent exactement `MANUAL_CALENDAR_NOTE` et plus « Il est
    retiré de votre agenda si vous l'y aviez ajouté » ;
  - les deux introductions propriétaire sont inchangées (valeurs littérales) ;
  - `mail-templates.spec.ts` n'est pas modifié.
- **Front, gateway** :
  - `API_LINK_BASE_URL` fourni explicitement (`https://api.example.test/api`), jeton
    `aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa` → URL
    `https://api.example.test/api/booking/feed/aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa.ics` ;
  - `/api` (relatif) → URL absolue sur l'origine du document de test ;
  - `toWebcalUrl('https://x/a.ics')` → `webcal://x/a.ics`, `http:` aussi.
- **Front, vue** : `unconfigured` → `unconfigured` ; `none` → `none` ; `active` → `active` avec `since`
  en « 1er » quand c'est le cas.
- **Front, page** :
  - zoneless, jamais `fakeAsync` : `await fixture.whenStable()` ;
  - presse-papiers réel de happy-dom (précédent `code-copy.spec.ts`), rejet par
    `vi.spyOn(navigator.clipboard, 'writeText')` ;
  - le lien n'est jamais écrit dans `localStorage` ni `sessionStorage` (assertion après chargement et
    après création).
- **`data-testid`** (seuls sélecteurs) :
  - section : `admin-booking-feed`, `admin-booking-feed-heading`, `admin-booking-feed-loading`,
    `load-error` (existant) ;
  - états : `admin-booking-feed-unconfigured`, `admin-booking-feed-none`, `admin-booking-feed-since` ;
  - lien : `admin-booking-feed-url` (l'`input`), `admin-booking-feed-copy`, `admin-booking-feed-webcal` ;
  - `admin-booking-feed-help`, `admin-booking-feed-action` ;
  - confirmation : `confirm-dialog`, `confirm-dialog-confirm`, `confirm-dialog-cancel` (existants ; la
    page en contient deux, à cibler sous `admin-booking-feed`).
- **a11y (F4)** :
  - doublure :
    - `GET /api/booking/feed-subscription` →
      `{ status: 'active', token: 'stubFeedToken000000000000000000000000000000', createdAt: '2026-10-15T08:32:00.000Z' }`
      (43 caractères base64url) ;
    - `POST` → 201, même forme avec `createdAt` = maintenant ;
    - routes testées avant le 405 ;
  - le scénario existant `/admin/rendez-vous` analyse déjà la section en état `active` : y ajouter
    l'attente de `admin-booking-feed-url` ;
  - nouveau scénario « lien régénéré », clair et sombre : `admin-booking-feed-action`, puis
    `confirm-dialog-confirm` de la section, attente du toast de régénération, puis
    `expectNoA11yViolations('admin-booking-feed', 'abonnement-lien-regenere')`.
  - L'état `unconfigured` (un paragraphe) n'a pas de scénario axe : il est couvert par les specs Vitest.

### Risques & inconnues

- **Variable oubliée ou mal saisie au déploiement** :
  - absente → flux en 404 et admin « non configuré », sans casse ;
  - trop courte → traitée comme absente (admin « non configuré ») et avertissement journalisé sans la
    valeur, l'API démarre (décision du 2026-10-15) ;
  - rotation ou perte du secret → tous les abonnements tombent en 404 jusqu'au remplacement du lien dans
    chaque agenda (documenté au README et dans l'ADR).
- **Journaux hors de notre contrôle** : le journal d'accès de Traefik devant `api.nedellec-julien.fr`, s'il
  est activé dans Dokploy, écrit le chemin complet. À vérifier au déploiement (`docker ps` autorisé, accès
  aux logs non) ; à défaut, le propriétaire contrôle le réglage dans Dokploy. La régénération borne
  l'exposition.
- **Doublons et lenteur côté clients** :
  - si le propriétaire garde l'événement ajouté depuis l'email `PUBLISH` (même `UID`) dans un autre
    agenda, il le voit deux fois : l'aide lui dit d'arrêter les ajouts manuels ;
  - Google rafraîchit en heures, voire un jour : c'est écrit dans l'aide ;
  - le `VCALENDAR` vide est techniquement hors grammaire RFC 5545. À vérifier au test réel sur les deux
    clients ; si l'un le refuse, on y ajoutera un composant neutre.
- **Ordre de déploiement** : API d'abord (migration `0026` additive, rejouée au démarrage du conteneur,
  et variable ajoutée dans Dokploy), puis front. Un front en avance affiche la section en erreur ; rien
  d'autre n'est touché.

### Décisions à arbitrer par le propriétaire

> **Décision du 2026-10-15 (orchestrateur, sûreté du déploiement)** : une valeur de `BOOKING_FEED_SECRET`
> trop courte **ne bloque pas le démarrage** : elle est traitée comme absente (abonnement « non configuré »)
> et un avertissement est journalisé sans la valeur. Une faute de frappe dans Dokploy ne doit pas couper
> l'API ni les réservations.

> **Arbitré le 2026-10-15 par le propriétaire** : (1) lien relisible à tout moment, par un jeton dérivé
> par HMAC d'un secret serveur (et non « affiché une fois ») ; (2) six mois d'historique dans le flux,
> alignés sur la purge (`BOOKING_POLICY.retentionMonths`). Le plan ci-dessus en tient compte.

1. ~~Lien affiché une seule fois~~ → **Arbitré le 2026-10-15** : HMAC, avec `BOOKING_FEED_SECRET` et un sel
   par génération.
2. ~~Fenêtre de 30 jours~~ → **Arbitré le 2026-10-15** : six mois, `BOOKING_POLICY.retentionMonths`
   réutilisé.

Plus aucune question ouverte.

## Plan de test

### Tranche A1 — qui détient le jeton lit ses rendez-vous confirmés en iCalendar

API `nest-portfolio-app`, branche `feat/booking-feed` (depuis `b2486ce`) : 88 tests neufs (83 unitaires,
5 d'intégration), dans 7 fichiers neufs et 2 suites existantes complétées (`env.validation.spec.ts`,
`app-config.service.spec.ts`). Builder partagé `aBooking` ; `createMockDb` ; aucun module Nest pour les purs.
`to-ics.spec.ts` n'est **pas modifié** et reste vert (sortie de `toIcs` identique à l'octet).

Signatures figées par les tests (squelettes sans comportement posés pour que les suites se chargent :
retours `''`, `null`, `false`, objets vides, contrôleur sans route, getter `undefined`) :

- `feed-token.ts` : `deriveFeedToken(secret, salt): string`, `createFeedSalt(): string`,
  `feedTokenMatches(candidate, expected): boolean`. **`timingSafeEqual` importé de `'node:crypto'`** (le
  spec le double par `jest.mock('node:crypto')` ; `'crypto'` nu échapperait à la doublure). Vecteur figé,
  calculé par `node -e` : `deriveFeedToken('a'.repeat(32), 'AAAAAAAAAAAAAAAAAAAAAA')` =
  `XYJXH9MoGdppkZYT0jI3g2rP-qFcqKBWL0budyMj488`.
- `booking-meeting.ts` : `type Meeting`, `meetingOf(row: Booking): Meeting` (valeurs actuelles du notifier).
- `to-ics.ts` : `IcsFeedEvent`, `IcsFeed`, `toIcsFeed(feed: IcsFeed): string`.
- `booking-feed.ts` : `BOOKING_FEED`, `parseFeedFile(file)`, `toFeedEvent(row, siteUrl)`.
- `booking-feed.service.ts` : `FeedSubscription` (union du plan), `BookingFeedService(@Inject(DRIZZLE) db,
  config: AppConfigService)`, `renderFeed(file): Promise<string | null>`, `regenerate()`. Forme Drizzle
  attendue, sur le précédent `AvailabilityService` : lecture du sel `select … from booking_setting where id =
  'main'` **terminée par `.limit(…)`** (`db.limit` y rend `[{ feedSalt }]`) ; lecture des rendez-vous
  `select … from booking where … ` **terminée par `.orderBy(…starts_at…)`** ; régénération
  `insert(bookingSettings).values({ id: 'main', feedSalt, … }).onConflictDoUpdate({ target: id, set: {
  feedSalt, feedCreatedAt, updatedAt } }).returning(…)` qui rend `[{ feedCreatedAt: Date }]`, sans
  `closePublicHolidays` ni dans `values` ni dans `set`.
- `booking-feed.controller.ts` : `@Controller('booking')`, `GET feed/:file`, aucune garde de classe.
- `AppConfigService.bookingFeedSecret: string | undefined`.
- `validateEnv` (décision du 2026-10-15) : absente ou `''` → absente sans avertissement ; ≥ 32 → retenue ;
  **31 caractères → absente, démarrage maintenu, avertissement qui nomme `BOOKING_FEED_SECRET` sans sa
  valeur** (capté sur `Logger.prototype.warn`, `Logger.warn` ou `console.warn`, au choix de
  l'implémentation).
- Corps 404 en A1 : `{ statusCode: 404, error: 'Not Found', message: 'Not Found' }` comparé **hors `path` et
  `timestamp`** ; le masquage de `path` est l'objet de A2.

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `feed-token.spec.ts` | 1 | vecteur figé | jeton exact |
| | 1 | deux appels | même valeur |
| | 1 | forme | `^[A-Za-z0-9_-]{43}$`, accepté par `parseFeedFile` |
| | 2 | autre sel, autre secret | jetons exacts calculés par `node -e` |
| | 2 | `createFeedSalt` | 22 caractères base64url = 16 octets ; deux tirages différents |
| | 2 | `feedTokenMatches` égal, un caractère différent | `true`, `false` |
| | 3 | candidat plus court, plus long, vide | `false`, sans exception, `timingSafeEqual` jamais appelé |
| | 2 | même longueur, égaux ou non | `timingSafeEqual` appelé une fois |
| `booking-meeting.spec.ts` | 2 | visio, téléphone | objet `Meeting` exact (libellé, `tel:+33612345678`, aide, lieu) |
| `to-ics-feed.spec.ts` | 1 | un événement | lignes de contenu exactes du contrat (enveloppe + VEVENT) |
| | 1 | deux événements | aucune ligne `METHOD`, `ORGANIZER`, `ATTENDEE` |
| | 4 | `NAME`, `X-WR-CALNAME`, `REFRESH-INTERVAL`, `X-PUBLISHED-TTL` | une seule fois, avant le premier VEVENT |
| | 1 | deux événements | deux VEVENT, UID dans l'ordre reçu |
| | 1 | zéro événement | enveloppe seule, exacte |
| | 1 | virgule, point-virgule, retours à la ligne | `\,` `\;` `\n` |
| | 3 | un, zéro, description multiligne | CRLF partout et en fin |
| | 1 | nom et résumé à émojis | lignes physiques ≤ 75 octets, aucun demi-caractère, dépliage fidèle |
| `booking-feed.spec.ts` | 1 | `BOOKING_FEED` | golden `toEqual` |
| | 1 | 43 caractères + `.ics` | le jeton |
| | 10 | 42, 44, `.ICS`, sans suffixe, `+`, `/`, `=`, vide, `.ics.ics`, préfixe de chemin | `null` |
| | 1 | visio avec téléphone et société | `IcsFeedEvent` exact : UID, `stamp` = `createdAt`, résumé « Appel de cadrage · Marie Dupont », description ligne à ligne, lieu |
| | 1 | téléphone sans société | une seule ligne téléphone, pas de « Société » (description exacte) |
| | 1 | visio sans téléphone ni société | description exacte |
| | 1 | message sur trois lignes | ligne `DESCRIPTION` dépliée exacte, `\n` échappés |
| | 1 | deux rendus à une minute d'écart (horloge simulée) | flux identique, `DTSTAMP:20261020T071500Z` |
| | 2 | visio, téléphone | ligne `LOCATION` du flux = celle de l'invitation émise par `BookingNotifier` |
| `booking-feed.service.spec.ts` | 1 | secret absent | `null`, zéro appel à la base |
| | 4 | fichiers malformés | `null`, zéro appel à la base |
| | 2 | aucune ligne, sel `null` | `null`, rendez-vous jamais lus |
| | 1 | lecture du sel | table `booking_setting`, paramètre `main` |
| | 2 | jeton d'un autre sel, d'un autre secret | `null`, rendez-vous jamais lus |
| | 1 | bon jeton | flux qui commence par `BEGIN:VCALENDAR\r\n`, nom du calendrier, UID dans l'ordre de la requête |
| | 1 | bon jeton | table `booking`, `"ends_at" > now() - make_interval(months => $n)`, `status`, paramètres `confirmed` et `retentionMonths`, aucun littéral d'intervalle, tri par `starts_at` |
| | 1 | `publicSiteUrl` avec barre finale | `Gérer : https://nedellec-julien.fr/admin/rendez-vous` |
| | 2 | jeton valide, jeton faux | absent de tout argument passé au builder (SQL rendu compris) |
| | 1 | `regenerate` sans secret | `ConflictException` `{ error: 'feed_not_configured', message: 'Abonnement non configuré.' }`, zéro appel |
| | 1 | `regenerate` | insert `booking_setting`, `id: 'main'`, sel de 22 caractères, pas de `closePublicHolidays` ; `{ status: 'active', token: deriveFeedToken(secret, sel), createdAt }` exact |
| | 1 | upsert | cible `id`, `set` = `feedCreatedAt`, `feedSalt`, `updatedAt` ; même sel qu'en `values` |
| | 1 | deux régénérations | sels et jetons différents |
| `booking-feed.controller.spec.ts` (supertest, service réel, base simulée) | 1 | bon jeton | 200, corps qui commence par `BEGIN:VCALENDAR\r\n`, UID présent |
| | 1 | bon jeton | `text/calendar; charset=utf-8`, `no-store`, `noindex, nofollow` |
| | 5 | secret absent, `.txt`, `%2F` dans le jeton, aucun sel, jeton faux | 404, corps égal hors `path`/`timestamp`, aucun `VCALENDAR`, rendez-vous jamais lus |
| | 1 | contrôleur | aucune garde |
| `env.validation.spec.ts` | 2 | absente, `''` | pas de valeur, aucun avertissement |
| | 2 | 32 et 64 caractères | valeur retenue, aucun avertissement |
| | 1 | 31 caractères | démarrage maintenu, valeur absente |
| | 1 | 31 caractères | avertissement nommant la variable, sans la valeur ni ses 12 premiers caractères |
| `app-config.service.spec.ts` | 2 | fourni, absent | getter = valeur, `undefined` |
| `booking-feed.integration.spec.ts` (base dédiée `booking_feed_it`) | 1 | migrations | `0026_booking_feed` au journal ; sel sans date refusé `23514` `booking_setting_feed_check` |
| | 1 | `regenerate()` puis `GET` | 200 `text/calendar` ; UID = fini il y a 150 jours puis à venir ; ni l'annulé à venir ni le fini il y a 210 jours |
| | 1 | deux `regenerate()` | jetons différents, ancien 404, nouveau 200 |
| | 1 | même sel, autre secret | 200 avec le premier secret, 404 avec l'autre |
| | 1 | aucun lien créé | jeton bien formé → 404 |

Preuves (code de sortie lu après chaque commande) :

- `pnpm test -- src/booking src/config; echo $?` → `1` ; **53 failed / 794 total** (691 passed, 50 skipped).
- `pnpm test; echo $?` → `1` ; **53 failed / 1807 total** (1699 passed, 55 skipped) ; les 8 suites en échec
  sont les 6 neuves et les 2 complétées, et chaque échec est un test neuf.
- Intégration (Postgres 17 jetable sur `55433`) : `BOOKING_IT_DATABASE_URL=… pnpm test -- booking.integration
  booking-scheduler.integration booking-feed.integration; echo $?` → `1` ; **4 failed / 50 total** ;
  `booking.integration` et `booking-scheduler.integration` verts.
- Nature des échecs : uniquement des assertions (`toBe`, `toEqual`, `toHaveLength`, `toContain`,
  `toHaveProperty`, `toHaveBeenCalledTimes`, statut HTTP) ; aucune erreur de compilation ts-jest, aucun
  `TypeError`, aucun module introuvable. Prettier et ESLint propres sur les fichiers de test.
- Verts par construction avant GREEN (gardes sur le squelette, discriminants une fois le code écrit) : rejets
  de `parseFeedFile`, `feedTokenMatches` à longueurs différentes, `renderFeed` → `null`, absence de
  `METHOD`, absence de garde, variable absente ou vide, getter absent, « aucun lien créé » en intégration.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 18:56, 53 failed / 1807 total).

### Tranche A2 — le jeton n'apparaît dans aucun journal

API `nest-portfolio-app`, branche `feat/booking-feed` (après `b47c4f1`) : 33 tests neufs dans 2 fichiers neufs
(`src/common/filters/http-exception.filter.spec.ts`, `src/instrument.spec.ts`) et 2 suites complétées
(`log-redact.spec.ts`, `sentry-before-send.spec.ts`) ; 5 tests existants de `booking-feed.controller.spec.ts`
recalibrés sur le contrat (`path` n'est plus exclu de la comparaison). Purs sans Nest ; le filtre est exercé
seul (hôte simulé, espion `Logger.prototype.error`) et à travers le contrôleur (supertest).

Signatures figées (squelettes sans comportement : `redactUrl` rend l'URL telle quelle, `serializeRequest` ne
rend que `id`, `isUntracedIncomingRequest` rend `false`) :

- `log-redact.ts` : `redactUrl(url: string): string` et `redactUrl(url: string | undefined): string | undefined`
  (surcharges, pour que `path: redactUrl(req.url)` reste un `string`) ; `type SerializedRequest = { id?; method?;
  url? }` ; `serializeRequest(req: SerializedRequest): SerializedRequest`.
- `sentry-before-send.ts` : `isUntracedIncomingRequest(url: string): boolean`.

**Écart au plan relevé (à trancher par l'implémentation, pas par le test)** : Sentry 10.73 remplit
`event.request.url` avec l'URL **absolue** (`getAbsoluteUrl` : `https://<host>/api/booking/feed/…?x=1`) et
`transaction` avec `GET /api/booking/feed/….ics` (`bestEffortTransactionName`). La regex ancrée du plan
(`^(\/api\/booking\/feed\/)…`) ne masque ni l'une ni l'autre. Les tests `sentryBeforeSend` utilisent ces formes
réelles : `request.url` → `https://api.nedellec-julien.fr/api/booking/feed/[Filtered]`, `transaction` →
`GET /api/booking/feed/[Filtered]`. Les cas `redactUrl` restent ceux du plan (chemins relatifs, ceux de pino et
du filtre) : désancrer la regex ou masquer le chemin dans `sentryBeforeSend` sont tous deux conformes.

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `log-redact.spec.ts` | 5 | `redactUrl` : flux `.ics`, `.ics?x=1`, `abc.ics`, `%2F`, `.txt` | `/api/booking/feed/[Filtered]` exact |
| | 4 | `feed-subscription`, `slots`, `bookings?from=…`, `health` | inchangés |
| | 1 | `undefined` | `undefined` |
| | 1 | `serializeRequest` sur le flux, avec en-têtes | `{ id, method, url: '/api/booking/feed/[Filtered]' }` exact, en-têtes absents |
| | 1 | `serializeRequest` sur une autre route | `{ id, method, url }` exact |
| | 1 | `serializeRequest` branché sur `pino` | ligne sans le jeton, `"url":"/api/booking/feed/[Filtered]"` |
| `sentry-before-send.spec.ts` | 1 | URL absolue du flux | `request.url` = origine + `/api/booking/feed/[Filtered]` |
| | 1 | flux avec `query_string` | clé `query_string` absente |
| | 1 | flux | `transaction` = `GET /api/booking/feed/[Filtered]` |
| | 1 | flux | jeton absent de l'événement sérialisé |
| | 1 | sans `request`, transaction du flux | `transaction` masquée |
| | 1 | autre route | `url`, `query_string`, `transaction` inchangés |
| | 1 | flux | événement d'origine inchangé (`toEqual` du gabarit) |
| | 6 | `isUntracedIncomingRequest` : `health`, flux (3 formes) / `slots`, `feed-subscription` | `true` / `false` |
| `http-exception.filter.spec.ts` | 1 | 404 sur le flux | corps exact, `path: '/api/booking/feed/[Filtered]'` |
| | 1 | `Error` 500 sur le flux | `logger.error({ err, path masqué, method }, 'Unhandled 500 on GET /api/booking/feed/[Filtered]')`, jeton absent des appels |
| | 1 | 404 sur une autre route | `path` avec sa query string |
| `instrument.spec.ts` (`@sentry/nestjs` et `dotenv/config` doublés, `SENTRY_DSN` posé) | 4 | `ignoreIncomingRequests` passé à `httpIntegration` : `health`, flux / `slots`, `feed-subscription` | `true` / `false` |
| `booking-feed.controller.spec.ts` (préfixe `api` comme `main.ts`) | 5 (recalibrés) | secret absent, `.txt`, `%2F`, aucun sel, jeton faux | corps égal hors `timestamp` seul, `path: '/api/booking/feed/[Filtered]'` |

Non couvert par un test unitaire, renvoyé au contrôle runtime de A2 (`node dist/main.js`, `grep -c <jeton>` et
`grep -c <secret>` → `0`) : le branchement `serializers.req: serializeRequest` dans `app.module.ts` (fabrique
inline, module complet non montable sans base) et l'absence du secret dans la sortie du processus (déjà
couverte côté `validateEnv` en A1). Spans et breadcrumbs : le plan ne prescrit rien, les requêtes du flux
n'étant plus tracées.

Preuves (code de sortie lu après chaque commande) :

- `pnpm test -- src/common src/booking; echo $?` → `1` ; **24 failed / 886 total** (812 passed, 50 skipped).
- `pnpm test; echo $?` → `1` ; **25 failed / 1840 total** (1760 passed, 55 skipped) ; 5 suites en échec, les 4
  touchées et `instrument.spec.ts`, chaque échec étant un test neuf ou recalibré.
- Nature des échecs : uniquement des assertions (`toBe`, `toEqual`, `toHaveBeenCalledWith`, `toContain`,
  `not.toHaveProperty`) ; aucun `TypeError`, module introuvable ni erreur TS. ESLint et Prettier propres ;
  `tsc --noEmit` sans erreur dans les fichiers touchés.
- Verts par construction avant GREEN (gardes contre le sur-masquage) : routes hors flux inchangées, `undefined`,
  `isUntracedIncomingRequest` à `false`, `instrument` pour `health`/`slots`/`feed-subscription`, chemin d'une
  autre route dans le filtre, non-mutation, et les deux 200 du contrôleur sous préfixe `api`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 19:15, 25 failed / 1840 total).

### Tranche A3 — l'admin lit, crée et régénère le lien

API `nest-portfolio-app`, branche `feat/booking-feed` (après `49a9469`) : 28 tests neufs (22 unitaires, 6
d'intégration), tous dans des suites existantes complétées : `booking-feed.service.spec.ts`,
`booking-admin.controller.spec.ts`, `booking-notifier.service.spec.ts`, `booking-feed.integration.spec.ts`.
Sur consigne de l'orchestrateur, la mention d'annulation (`MANUAL_CALENDAR_NOTE`, tranche A4 du plan) est
jouée dans cette tranche.

Signatures figées (squelette sans comportement : `readSubscription` rend un objet vide) :

- `BookingFeedService.readSubscription(): Promise<FeedSubscription>`. Forme Drizzle attendue, sur le précédent
  de `renderFeed` : `select … from booking_setting where id = 'main'` **terminée par `.limit(…)`**, qui rend
  `[{ feedSalt, feedCreatedAt }]` ; un seul `from`.
- `BookingAdminController` injecte `BookingFeedService` ; `GET feed-subscription` (200) et
  `POST feed-subscription` (201, `@Body` absent), `Cache-Control: no-store`, aucun décorateur de throttle
  (limite globale, comme les autres routes admin hors calendrier), garde JWT de classe inchangée.
- Introductions visiteur de l'annulation, texte exact : `Votre rendez-vous est bien annulé. <NOTE>` et
  `Je dois malheureusement annuler notre rendez-vous. <NOTE> Vous pouvez réserver un autre créneau sur
  <site>/rendez-vous.`, avec `<NOTE>` = « Si votre agenda avait enregistré l’invitation, le rendez-vous en est
  retiré ; si vous l’y aviez ajouté à la main, supprimez-le. » (apostrophes typographiques). Lue dans le
  premier `<p class="muted">` du gabarit ; l'égalité stricte exclut l'ancienne promesse sans test négatif.

401 : prouvé par métadonnées (`GUARDS_METADATA` de classe = `[JwtAuthGuard]`, test existant, et routes
déclarées sur ce contrôleur), comme les autres routes admin ; aucun spec du dépôt ne monte la stratégie
Passport.

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `booking-feed.service.spec.ts` | 1 | `readSubscription` sans secret | `{ status: 'unconfigured' }`, zéro appel à la base |
| | 2 | aucune ligne, sel `null` | `{ status: 'none' }` |
| | 1 | sel et date | `{ status: 'active', token: <vecteur figé A1>, createdAt: '2026-10-15T08:32:00.000Z' }` |
| | 1 | lecture | table `booking_setting`, paramètre `main`, un seul `from` |
| | 1 | deux relectures, sel inchangé | même jeton, même date |
| | 1 | `regenerate` puis relecture du sel écrit | objet égal au retour de `regenerate` |
| | 1 | lien actif | clés exactes `createdAt`, `status`, `token` ; ni sel ni secret sérialisés |
| | 1 | `regenerate` puis `renderFeed` | ancien jeton → `null`, nouveau → `BEGIN:VCALENDAR` |
| `booking-admin.controller.spec.ts` | 2 | `GET` / `POST feed-subscription` | déclarées sur le contrôleur gardé |
| | 2 | `GET` / `POST feed-subscription` | aucune métadonnée de throttle propre |
| | 3 | `GET` : non configuré, sans lien, actif | 200, corps égal au service, `cache-control: no-store`, `regenerate` jamais appelé |
| | 1 | `POST` | 201, corps exact, `no-store`, `regenerate()` sans argument, `readSubscription` jamais appelé |
| | 1 | `POST` sans secret | 409 `{ statusCode, error: 'feed_not_configured', message, path }` |
| `booking-notifier.service.spec.ts` | 2 | annulation par le visiteur, par le propriétaire | introduction visiteur exacte avec la note |
| | 2 | idem | introductions propriétaire exactes, inchangées |
| `booking-feed.integration.spec.ts` (contrôleurs admin et flux, garde levée) | 1 | `GET` → `POST` → `GET` | `none`, 201 aux clés exactes et jeton de 43 caractères, relecture égale, flux 200 |
| | 1 | lien créé | `createdAt` = `feed_created_at` en base ; ni le sel stocké ni le secret dans les deux corps |
| | 1 | deux `POST` | jetons différents, relecture = dernier, ancien 404, nouveau 200 |
| | 2 | fériés à `false` puis `true` | `close_public_holidays` inchangé après `POST` |
| | 1 | sans secret | `unconfigured`, 409 `feed_not_configured`, `booking_setting` vide |

Sweep : l'ancienne phrase « Il est retiré de votre agenda… » n'est assertée nulle part (`grep` sur `src` et
`test`) ; `mail-templates.spec.ts` n'est pas touché. Les autres intégrations n'ont pas à remettre le sel à
`null` : seul `booking-feed.integration.spec.ts` écrit `feed_salt`, dans sa base dédiée `booking_feed_it`.

Preuves (code de sortie lu après chaque commande) :

- `pnpm test -- src/booking; echo $?` → `1` ; **19 failed / 777 total** (702 passed, 56 skipped).
- `pnpm test; echo $?` → `1` ; **19 failed / 1868 total** (1788 passed, 61 skipped) ; 3 suites en échec, les 3
  suites unitaires complétées, chaque échec étant un test neuf.
- Intégration (Postgres 17 jetable sur `55433`) : `BOOKING_IT_DATABASE_URL=… pnpm test -- booking.integration
  booking-scheduler.integration booking-feed.integration; echo $?` → `1` ; **6 failed / 56 total** ; les 6 sont
  les tests neufs (`Received: 404`, routes absentes), `booking.integration`, `booking-scheduler.integration` et
  les 5 tests A1 du flux verts.
- Nature des échecs : uniquement des assertions (`toBe`, `toEqual`, `resolves.toEqual`, `toBeDefined`,
  `toHaveBeenCalledTimes`, statut HTTP) ; aucun `TypeError`, module introuvable ni erreur TS. ESLint et Prettier
  propres ; `tsc --noEmit` : les 4 erreurs préexistantes seules.
- Verts par construction avant GREEN (gardes) : les deux introductions propriétaire, et « ancien jeton → `null`
  après `regenerate` » (comportement livré en A1, épinglé ici côté service).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 19:27, 19 failed / 1868 total).

### Tranche F1 — la gateway parle le contrat de l'abonnement

Front, branche `feat/026-abonnement-agenda` : 16 tests neufs (4 dans l'adapter, 12 dans la gateway), dans deux
suites existantes complétées (`booking.adapter.spec.ts`, `http-booking.gateway.spec.ts`). Contrat relu sur le
code API de `origin/master` : `GET`/`POST booking/feed-subscription` sous la garde JWT de classe, union
`unconfigured | none | active { token, createdAt }`, 409 `{ error: 'feed_not_configured' }`.

Signatures figées (squelettes sans comportement : l'adapter rend un `active` vide, les deux méthodes HTTP
rendent `NEVER`, donc aucune requête) :

- `BookingFeedSubscription` (`booking-admin.model.ts`), union du plan ; `'not-configured'` ajouté à
  `BookingAdminFailure` (tous les consommateurs sont des `Partial<Record<…>>`, aucune casse).
- `BookingGateway.getFeedSubscription(): Observable<BookingFeedSubscription>` et
  `regenerateFeedSubscription(): Observable<BookingAdminResult<BookingFeedSubscription>>`.
- `BookingFeedSubscriptionDto` (`booking-api.types.ts`) ; `toBookingFeedSubscription(raw, feedBaseUrl)`
  (`booking.adapter.ts`), où `feedBaseUrl` finit par `/booking/feed/` et l'URL vaut
  `${feedBaseUrl}${encodeURIComponent(token)}.ics`.
- Requêtes sur `API_BASE_URL` (comme les autres routes), URL du flux sur `API_LINK_BASE_URL` résolue contre
  `DOCUMENT.location.href` : le test fournit deux bases différentes pour distinguer les deux jetons.
- Doublures : `stubBookingGateway` double les deux méthodes (`active` par défaut) ; builders
  `aBookingFeedSubscription` (domaine, `active`) et `aBookingFeedSubscriptionDto` (DTO `active`, jeton
  `stubFeedToken000000000000000000000000000000`, 43 caractères, celui de la doublure F4).

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `booking.adapter.spec.ts` | 2 (`it.each`) | DTO `unconfigured` / `none` avec un champ en trop (`feedSalt`) | `toEqual({ kind })` seul |
| `booking.adapter.spec.ts` | 1 | DTO `active` avec `feedSalt` en trop | `{ kind: 'active', url: '<base>XYJX…488.ics', createdAt }` : ni `token`, ni `feedSalt` recopiés |
| `booking.adapter.spec.ts` | 1 | jeton `a/b?c#d` | segment encodé `a%2Fb%3Fc%23d.ics` |
| `http-booking.gateway.spec.ts` | 3 (`it.each`) | `GET` rend `unconfigured`, `none`, `active` | `GET` sur `https://api.test/api/booking/feed-subscription`, `SKIP_ERROR_TOAST` vrai, modèle exact ; en `active` : `https://api.example.test/api/booking/feed/<43 a>.ics` |
| `http-booking.gateway.spec.ts` | 1 | `API_LINK_BASE_URL` relatif (`/api`) | URL `${document.location.origin}/api/booking/feed/<jeton>.ics`, absolue |
| `http-booking.gateway.spec.ts` | 3 (`it.each`) | lecture en 500, 401, réseau coupé | l'erreur atteint l'appelant (`'error'`) |
| `http-booking.gateway.spec.ts` | 1 | création, 201 `active` | `POST`, corps `null`, silencieux, `{ success: true, data: { kind: 'active', url, createdAt } }` |
| `http-booking.gateway.spec.ts` | 4 (`it.each`) | création en échec : réseau, 409 `feed_not_configured`, 500, 502 HTML | `network`, `not-configured`, `server`, `server` |

Les 409 aux autres codes restent couverts par les tests existants (`cancel_too_late` → `too-late`,
`day_in_closure` → `day-in-closure`) : un `toAdminFailure` qui rendrait `not-configured` pour tout 409 les
casserait.

Hors F1 (plan) : `toWebcalUrl` et `toBookingFeedView` vivent dans `booking-feed-view.ts`, contenu de F2 ; leurs
tests y seront écrits.

Preuve RED (cache invalidé par `pnpm exec ng cache clean`) :

- `pnpm test --include='src/app/features/booking/**/*.spec.ts'; echo $?` → `1` ; **16 failed / 282 total**
  (266 passed) ; 2 suites en échec, les deux complétées.
- `pnpm test; echo $?` → `1` ; **16 failed / 4802 total** (4786 passed) ; 252 suites vertes sur 254, aucune
  erreur TS, aucun rejet non géré.
- Nature des échecs : 4 `AssertionError` `toEqual` (adapter) et 12 `Expected one matching request for criteria
  "Match URL: https://api.test/api/booking/feed-subscription", found none` (`HttpTestingController.expectOne` :
  la requête n'est pas émise). Aucun échec de harnais. Prettier et ESLint propres sur `features/booking`.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 20:37, 16 failed / 4802 total).

### Tranche F2 — la section montre l'état et crée ou régénère le lien

Front, branche `feat/026-abonnement-agenda` : 37 tests neufs dans deux suites neuves
(`booking-feed-view.spec.ts`, `feed-subscription-panel.spec.ts`) et une suite existante complétée
(`admin-bookings.spec.ts`). La copie au presse-papiers et son toast restent en F3 : aucun test ne cible
`admin-booking-feed-copy` ici.

**Nommage (arbitrage de l'orchestrateur, 2026-10-15)** : le type du domaine garde le nom
`BookingFeedSubscription` ; la facade de page s'appelle **`FeedSubscriptionPanel`**
(`pages/admin-bookings/feed-subscription-panel.ts`, `@Injectable()` instance-scopé, déclaré dans les
`providers` de `AdminBookings`). Le plan la nomme encore `BookingFeedSubscription` : ce nom-là désigne
désormais le seul type.

Signatures figées (squelettes sans comportement : `toBookingFeedView` rend un `active` vide, `toWebcalUrl`
rend `''`, la facade expose des signaux constants et deux méthodes vides, sans lire la gateway) :

- `booking-feed-view.ts` : `BookingFeedView` (union du plan, libellés littéraux) ;
  `toBookingFeedView(subscription)` ; `toWebcalUrl(url)` (`^https?:` → `webcal:`, préfixe seul).
- `FeedSubscriptionPanel` : `view: Signal<BookingFeedView | null>`, `state: Signal<LoadState>`,
  `regenerating: Signal<boolean>`, `regenerate(): void`, `reload(): void`. `copyLink()` viendra en F3.
- Le composant `admin-booking-feed` n'est pas squelettisé : présentationnel, il est prouvé par la page
  (aucun spec isolé). Il n'est pas encore branché : la page ne rend pas la section.

Copie proposée (le plan n'en fixait pas trois) :

- erreur de lecture (`load-error-message` de la section) : « L'abonnement d'agenda n'a pas pu être chargé.
  Vérifiez votre connexion, puis réessayez. » ;
- squelette (`role="status"`) : « Chargement de l'abonnement… » ;
- corps de la confirmation, complété comme le demande l'orchestrateur : « L'ancien lien cessera aussitôt
  de fonctionner sur tous vos appareils : les agendas qui y sont abonnés ne recevront plus vos rendez-vous
  tant que vous ne les aurez pas abonnés au nouveau. » ;
- titre de la section : « Abonnement d'agenda » ; titre de la confirmation : « Régénérer le lien
  d'abonnement ? ».

Le reste reprend le plan mot pour mot (message `unconfigured`, `none`, `since`, quatre aides, libellés du
bouton et de la confirmation, cinq toasts). Les textes du DOM sont comparés espaces repliés (`\s+`, insécables
compris) ; les toasts sont comparés exacts, avec l'insécable avant les deux-points, comme ceux de
l'annulation.

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `booking-feed-view.spec.ts` | 2 (`it.each`) | `unconfigured`, `none` | `{ kind }`, `{ kind: 'none', actionLabel: "Créer le lien d'abonnement" }` |
| `booking-feed-view.spec.ts` | 1 | `active` créé le 15 octobre 08:32Z | objet exact : `since` « jeudi 15 octobre 2026 à 10:32 », `url`, `webcalUrl`, « Régénérer le lien » |
| `booking-feed-view.spec.ts` | 2 (`it.each`) | 30 septembre 22:30Z, 1er décembre 08:00Z | « jeudi 1er octobre 2026 à 00:30 » (jour de Paris, pas d'UTC), « mardi 1er décembre 2026 à 09:00 » (heure d'hiver) |
| `booking-feed-view.spec.ts` | 4 (`it.each`) | `https:`, `http:` avec port, déjà `webcal:`, `https` répété dans le chemin | `webcal://…` ; inchangé ; seul le préfixe remplacé |
| `feed-subscription-panel.spec.ts` | 1 | lien actif au serveur | une lecture, `ready`, vue exacte |
| `feed-subscription-panel.spec.ts` | 2 (`it.each`) | `unconfigured`, `none` | une lecture, `ready`, vue exacte |
| `feed-subscription-panel.spec.ts` | 1 | lecture en attente | une lecture, `loading`, vue `null` |
| `feed-subscription-panel.spec.ts` | 1 | lecture en échec puis `reload()` | `error` sans vue, puis deux lectures et `ready` |
| `feed-subscription-panel.spec.ts` | 1 | création depuis `none` | un `POST`, nouvelle vue, `regenerating` faux, toast « Lien d'abonnement créé : … » |
| `feed-subscription-panel.spec.ts` | 1 | régénération depuis `active` | un `POST`, aucune relecture, nouvelle vue, toast « Nouveau lien créé : … » |
| `feed-subscription-panel.spec.ts` | 1 | deuxième `regenerate()` en vol | un seul `POST`, `regenerating` vrai et ancienne vue pendant, faux et nouvelle vue après |
| `feed-subscription-panel.spec.ts` | 3 (`it.each`) | échecs `network`, `server`, `invalid` | toast par raison (`invalid` → message serveur), ancienne vue gardée, aucune relecture |
| `feed-subscription-panel.spec.ts` | 1 | échec `not-configured` | toast « Abonnement non configuré : … », deuxième lecture, vue `unconfigured` |
| `admin-bookings.spec.ts` | 1 | page chargée | `section` après la liste, `aria-labelledby` = id du `h2` « Abonnement d'agenda », un seul `h1`, aucun landmark ni `region` dans la section |
| `admin-bookings.spec.ts` | 1 | lien relu au chargement | `input` texte `readonly` non `disabled`, valeur https, `label for` « Lien d'abonnement » ; `a` `webcal://…` nommé « Ouvrir dans Calendrier » ; « Lien créé le … » ; `ul role="list"` des quatre aides ; bouton « Régénérer le lien » |
| `admin-bookings.spec.ts` | 1 | `none` | message, bouton « Créer le lien d'abonnement », ni lien, ni date, ni aide |
| `admin-bookings.spec.ts` | 1 | `unconfigured` | message qui nomme `BOOKING_FEED_SECRET`, zéro bouton dans la section, ni lien ni aide |
| `admin-bookings.spec.ts` | 1 | lecture en attente | `role="status"`, « Chargement de l'abonnement… », pas de bouton d'action |
| `admin-bookings.spec.ts` | 1 | lecture en échec, Réessayer de la section | message proposé, pas de bouton ; deux lectures, lien affiché, liste intacte |
| `admin-bookings.spec.ts` | 1 | créer depuis `none` | pas de confirmation, un `POST`, nouveau lien et date, toast, **même** bouton et focus dessus, libellé « Régénérer le lien » |
| `admin-bookings.spec.ts` | 1 | régénérer depuis `active` | confirmation ouverte, titre, corps, « Régénérer le lien » / « Garder le lien actuel », aucun `POST` |
| `admin-bookings.spec.ts` | 1 | confirmation acceptée | un `POST`, nouveaux https et webcal, toast, même bouton focalisé, aucune annulation de rendez-vous |
| `admin-bookings.spec.ts` | 2 (`it.each`) | confirmation refusée, Échap | dialogue fermé, aucun `POST`, lien inchangé, aucun toast |
| `admin-bookings.spec.ts` | 1 | double appui pendant la création | un `POST`, `aria-disabled="true"` sans `disabled` pendant, attribut retiré après, nouveau lien |
| `admin-bookings.spec.ts` | 1 | appui pendant une régénération | aucune nouvelle confirmation, un seul `POST`, `aria-disabled="true"` |
| `admin-bookings.spec.ts` | 1 | régénération en `network` | toast d'échec, ancien lien et ancienne date gardés, bouton de nouveau disponible |
| `admin-bookings.spec.ts` | 1 | création en `not-configured` | toast, deuxième lecture, message `unconfigured`, plus de bouton |
| `admin-bookings.spec.ts` | 1 | lecture puis création | lien affiché ; aucune entrée de `localStorage`/`sessionStorage` ne contient le jeton ni `/booking/feed/` |

Le focus : happy-dom ne déplace pas le focus à l'ouverture ni à la fermeture d'un `<dialog>`. Le test
focalise le bouton avant de l'activer et vérifie que le **même élément** est toujours dans le DOM et
focalisé après la réponse : un bouton rendu dans les branches du `@switch` serait recréé et perdrait le focus.

Sweep d'état seedé : la page porte désormais deux `app-confirm-dialog`. Les tests de l'annulation lisaient le
premier `confirm-dialog` de la page ; ils ciblent maintenant celui qui n'est pas dans `admin-booking-feed`,
quel que soit l'ordre que retiendra l'implémentation. `answerConfirmDialog` reçoit un troisième paramètre
facultatif `root` (défaut : la fixture), sans changement pour ses autres appelants. Le harnais `spies()` de la
page double `getFeedSubscription` (actif par défaut) et `regenerateFeedSubscription`.

Adaptation mécanique : `admin-bookings.spec.ts` (annulation) — 9 sites repointés vers
`cancellationDialog(host)`, `shared/ui/testing/confirm-dialog-page.ts` — paramètre `root` ajouté ; aucune
valeur attendue modifiée.

Preuve RED (cache invalidé par `pnpm exec ng cache clean` et `rm -rf node_modules/.vite`) :

- `pnpm test --include='src/app/features/{admin,booking}/**/*.spec.ts'; echo $?` → `1` ;
  **37 failed / 2359 total** (2322 passed) ; 3 suites en échec : les deux neuves et `admin-bookings.spec.ts`.
- `pnpm test; echo $?` → `1` ; **37 failed / 4839 total** (4802 passed, soit tout l'existant) ; 253 suites
  vertes sur 256, aucune erreur TS, aucun rejet non géré.
- Nature des échecs : uniquement des `AssertionError` (`toEqual`/`toBe`) : vue vide, gateway jamais lue,
  section absente de la page. Aucun échec de harnais. Prettier et ESLint propres sur les six fichiers touchés.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 20:51, 37 failed / 4839 total).

### Tranche F3 — le lien se copie avec un retour annoncé

Front, branche `feat/026-abonnement-agenda` : 13 tests neufs et 1 test existant complété, dans une suite
neuve (`shared/clipboard/write-to-clipboard.spec.ts`) et deux suites existantes complétées
(`feed-subscription-panel.spec.ts`, `admin-bookings.spec.ts`). `code-copy.spec.ts` n'est pas touché : il doit
rester vert quand `code-copy.ts` importera la fonction partagée (aucune adaptation mécanique nécessaire).

Signatures figées (squelettes sans comportement) :

- `writeToClipboard(text: string): Promise<boolean>` (`shared/clipboard/write-to-clipboard.ts`) : le
  squelette rend `true` sans écrire. Contrat : `true` quand `navigator.clipboard.writeText` a résolu ;
  `false`, sans rejet, quand il rejette ou que `navigator.clipboard` est absent (repli de l'existant, aucun
  `execCommand`). Le GREEN y déplace le corps de la fonction privée de `code-copy.ts` et l'y importe.
- `FeedSubscriptionPanel.copyLink(): void` : squelette vide. Contrat : hors état `active`, rien ; sinon
  `PendingTasks.run(() => writeToClipboard(view.url))` (l'URL https, jamais le `webcal://`), puis toast.
  Les tests de la facade attendent par `ApplicationRef.whenStable()` : une copie hors `PendingTasks` n'y
  est pas attendue.
- Composant `admin-booking-feed` (non squelettisé, prouvé par la page) : sortie `copyRequested` branchée sur
  `feed.copyLink()` ; bouton `type="button"` `data-testid="admin-booking-feed-copy"`, nom accessible
  « Copier le lien », rendu en `active` seulement, élément stable (le focus y reste après la copie).
- Focus en `unconfigured` après un `409` (ajout de l'orchestrateur, écart F2 n° 2) : le bouton d'action
  disparaît, le focus va sur le `h2` de la section (`AdminSectionHead.focusHeading()`, `tabindex="-1"`
  existant, précédent `AdminClosures`).

Copie (plan, mot pour mot ; insécable avant les deux-points comme les autres toasts) :

- succès : `{ severity: 'success', detail: 'Lien copié dans le presse-papiers' }` ;
- échec : `{ severity: 'error', detail: 'Copie impossible\u00a0: sélectionnez le lien et copiez-le à la main.' }`.

| Fichier | Tests | Scénario | Assertions clés |
|---|---|---|---|
| `write-to-clipboard.spec.ts` | 1 | presse-papiers qui accepte | `true`, presse-papiers = texte exact |
| `write-to-clipboard.spec.ts` | 1 | `writeText` rejeté (`NotAllowedError`) | `false` sans rejet, presse-papiers inchangé (`avant`) |
| `write-to-clipboard.spec.ts` | 1 | `navigator.clipboard` absent | résout `false` |
| `feed-subscription-panel.spec.ts` | 1 | `active`, `copyLink()` | presse-papiers = URL https (pas le webcal), un toast succès |
| `feed-subscription-panel.spec.ts` | 1 | régénéré puis copié | presse-papiers = nouvelle URL |
| `feed-subscription-panel.spec.ts` | 1 | deux copies | deux toasts succès (deux annonces) |
| `feed-subscription-panel.spec.ts` | 1 | `writeText` rejeté | presse-papiers inchangé, un toast d'erreur exact |
| `feed-subscription-panel.spec.ts` | 1 | `none`, copie, puis création et copie | avant : aucune écriture, aucun toast ; après : une écriture de la nouvelle URL |
| `feed-subscription-panel.spec.ts` | 1 | lecture en attente, copie, puis arrivée et copie | avant : rien ; après : une écriture de l'URL lue |
| `feed-subscription-panel.spec.ts` | 1 | lecture en échec, copie, puis relecture et copie | avant : rien ; après : une écriture de l'URL lue |
| `admin-bookings.spec.ts` | 1 | `active`, « Copier le lien » focalisé et activé | `BUTTON` `type="button"` nommé « Copier le lien » ; presse-papiers = URL https ; toast succès ; même élément, toujours focalisé ; aucun `POST` |
| `admin-bookings.spec.ts` | 1 | `writeText` rejeté | presse-papiers inchangé, toast d'erreur, champ toujours affiché avec l'URL |
| `admin-bookings.spec.ts` | 1 | `none`, puis création, puis copie | aucun bouton de copie avant ; après création, la copie écrit la nouvelle URL et annonce le succès |
| `admin-bookings.spec.ts` (complété) | 1 | création en `not-configured` | en plus de l'existant : focus sur `admin-booking-feed-heading` |

Hors état `active` côté page : l'absence du bouton de copie en `unconfigured` est déjà tenue par le test F2
« zéro bouton dans la section » ; en `none`, par le troisième test de la page. Les gardes de la facade
(`none`, chargement, échec) sont écrites en « rien, puis copie dès que le lien existe », pour échouer au
squelette et tuer une garde trop large comme une garde absente ; `unconfigured` y partage le chemin de
`none` et n'a pas de test dédié (il ne pourrait qu'être vert au squelette).

Adaptation : aucune adaptation mécanique. Le test F2 `not-configured` de la page reçoit une assertion et un
titre neufs (changement de contrat acté par l'orchestrateur, rouge d'assertion) ; aucune valeur attendue
existante n'a bougé.

Preuve RED (cache invalidé par `pnpm exec ng cache clean` et `rm -rf node_modules/.vite`) :

- `pnpm test --include='src/app/{features/admin,shared}/**/*.spec.ts'; echo $?` → `1` ;
  **14 failed / 2357 total** (2343 passed) ; 3 suites en échec : `write-to-clipboard.spec.ts`,
  `feed-subscription-panel.spec.ts`, `admin-bookings.spec.ts`.
- `pnpm test; echo $?` → `1` ; **14 failed / 4852 total** (4838 passed : les 4839 du GREEN F2 moins le test
  complété) ; 254 suites vertes sur 257, `code-copy.spec.ts` compris ; aucune erreur TS, aucun rejet non géré.
- Nature des échecs : uniquement des `AssertionError` (`toEqual`/`toBe`) : `true` au lieu de `false` ou
  presse-papiers resté à `avant` (squelette), aucun toast ni écriture (facade vide), bouton de copie absent,
  `focused: false` au lieu de `true`. Aucun échec de harnais. Prettier et ESLint propres sur les cinq
  fichiers touchés.

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le
2026-10-15 21:49, 14 failed / 4852 total).

### Tranche F4 — zéro violation axe sur la section

Audit, branche `feat/026-abonnement-agenda` (F3 commitée `21b01b2`) : 4 scénarios neufs × 2 thèmes dans
`e2e/a11y/booking-states.spec.ts` (`describe("abonnement d'agenda")`), repère recalé du scénario existant
`/admin/rendez-vous`, doublure étendue.

Doublure (`ci/api-stub/server.mjs`, sous `STUB_ADMIN_SESSION=1`, testée en tête de `routeBookingAdmin`,
donc avant le 405) :

- `GET /api/booking/feed-subscription` → 200
  `{ status: 'active', token: 'stubFeedToken000000000000000000000000000000', createdAt: '2026-10-15T08:32:00.000Z' }` ;
- `POST` → 201 `{ status: 'active', token: 'stubFeedRegenerated000000000000000000000000', createdAt: <maintenant> }` ;
- sans état : la lecture rend toujours le premier lien (les workers parallèles ne se contaminent pas).
  Les deux jetons font 43 caractères `[A-Za-z0-9_-]` (mesuré avec `node -e`).

| Scénario (clair et sombre) | Repère | Assertion d'atteinte avant l'analyse |
|---|---|---|
| `/admin/rendez-vous` (`ADMIN_PAGES`, repère recalé) | `admin-booking-feed-url` | aucun squelette, erreur ni toast (liste des rendez-vous et section chargées) |
| dialogue de régénération ouvert | `admin-booking-feed` | lien affiché ; « Régénérer le lien » activé → un seul `dialog[open]`, celui de la section, titre « Régénérer le lien d'abonnement ? » (U+202F) |
| lien régénéré avec son toast | `toast` | confirmation → aucun `dialog[open]`, champ = `…/booking/feed/stubFeedRegenerated…ics`, un toast « Nouveau lien créé : l'ancien ne fonctionne plus. » ; toast **encore visible après l'analyse** (il se retire à 3 s) |
| toast « Lien copié » | `toast` | `clipboard-read`/`clipboard-write` accordés à l'origine du site ; champ = `…/booking/feed/stubFeedToken…ics` ; « Copier le lien » → toast « Lien copié dans le presse-papiers », presse-papiers relu = valeur du champ ; toast encore visible après l'analyse |
| abonnement non configuré | `admin-booking-feed-unconfigured` | `page.route` sur `feed-subscription` (GET seul, CORS de l'origine, aucun appel réseau) → `{ status: 'unconfigured' }` ; paragraphe visible, aucun bouton dans la section, aucun squelette, erreur ni toast |

L'état `unconfigured` n'avait pas de scénario au plan (couvert par Vitest) : ajouté parce que `page.route`
le sert sans toucher la doublure ni ouvrir le réseau.

Adaptation mécanique : `booking-states.spec.ts`, scénario « open booking cancellation dialog » — 1 site
repointé : repère `confirm-dialog` → `admin-booking-reason`, aucune valeur attendue modifiée. La section en
état `active` rend désormais son propre `confirm-dialog`, fermé, avant celui de l'annulation : le repère
`getByTestId('confirm-dialog').first()` visait le dialogue fermé (`hidden`). Le champ du motif, déjà
attendu visible par le test, est propre au dialogue d'annulation.

Premier passage, avant cette adaptation : `pnpm a11y` → exit 1, **2 failed / 91 total**, les deux thèmes
du scénario d'annulation en `toBeVisible` sur `confirm-dialog` (« unexpected value "hidden" ») : échec de
repère, pas une violation axe. Les 8 scénarios neufs passaient déjà. Non mesuré mais déductible du code :
avant l'extension, la doublure répondait 404 à `feed-subscription`, la section s'affichait en
`load-error` et `/admin/rendez-vous` tombait sur `ADMIN_PENDING_OR_FAILED` depuis F2.

**Pas de RED : tout passe d'emblée** (tranche d'audit, exception actée en 024 F6). `pnpm a11y` le
2026-10-15 22:15, 0 failed / 91 total (91 passed, dont 8 nouveaux scénarios ; les 83 existants restent
verts), exit 0 ; aucune violation WCAG 2.0/2.1/2.2 A et AA sur les 12 analyses de l'écran
(reporter JSON, sous-ensemble `abonnement|/admin/rendez-vous|cancellation dialog`, 12 passed).
`incomplete` à relire : `color-contrast` sur le dialogue de régénération (deux thèmes), le lien régénéré
(deux thèmes) et le dialogue d'annulation existant ; aucun sur la page chargée, la copie ni `unconfigured`.
Le rapport axe des deux scénarios de toast contient le nœud `data-testid="toast"` (3 nœuds analysés) :
le toast a bien été audité. Réseau, relu dans `network.json` de chaque test : `blocked=0` sur les 12,
`GET /api/booking/feed-subscription` rejoué sur la doublure (et le `POST` dans le scénario de
régénération) ; aucun appel à `feed-subscription` dans `unconfigured` (servi par `page.route`).

```text
$ docker build -t ng-portfolio-app:a11y .; echo $?   → 0
$ ci/a11y-stack.sh up                                → Pile a11y prête
$ pnpm a11y; echo $?
  91 passed (1.4m)
0
$ ci/a11y-stack.sh down; echo $?                     → 0
$ pnpm run a11y:typecheck; echo $?                   → 0
$ pnpm test; echo $?
 Test Files  257 passed (257)
      Tests  4852 passed (4852)
0
$ pnpm exec eslint e2e/a11y ci/api-stub; echo $?     → 0
$ pnpm exec prettier --check e2e/a11y ci/api-stub    → All matched files use Prettier code style!
```

## Journal des tranches

- **Tranche A1 — qui détient le jeton lit ses rendez-vous confirmés en iCalendar** : implémentée le
  2026-10-15 (API `feat/booking-feed`, non commitée), verte sauf 2 tests du service bloqués par un défaut du
  test lui-même (cf. `### A1`), à corriger par `qa`.
- **Tranche A2 — le jeton n'apparaît dans aucun journal** : implémentée le 2026-10-15 (API `feat/booking-feed`,
  non commitée), verte ; contrôle runtime : jeton et secret absents de la sortie du processus (cf. `### A2`).
- **Tranche A3 — l'admin lit, crée et régénère le lien** (avec la mention d'annulation, A4 du plan) : implémentée
  le 2026-10-15 (API `feat/booking-feed`, non commitée), verte ; contrôle runtime : cycle `none` → lien → relecture
  → régénération (ancien lien 404), 401 sans session, `unconfigured` et 409 sans secret (cf. `### A3`).
- **Tranche F1 — la gateway parle le contrat de l'abonnement** : GREEN 4802 passed / 4802 total (booking :
  282 passed / 282 total) · refactor : `toAdminFailure` lit le code métier une seule fois (`const code`, comme
  `toBookingFailure`) au lieu de trois appels à `apiErrorCode` ; verify reportée : aucune surface atteignable
  restructurée (cf. `### F1`).
- **Tranche F2 — la section montre l'état et crée ou régénère le lien** : GREEN 4839 passed / 4839 total
  (admin : 2077 passed / 2077 total) · refactor : aucun (passe manuelle sur le diff : rien à extraire, la
  dérivation vit déjà dans `toBookingFeedView` et la facade) ; verify ✅ PASS sur `/admin/rendez-vous`
  (surface atteignable restructurée : la page porte la section et une seconde confirmation) (cf. `### F2`).
- **Tranche F3 — le lien se copie avec un retour annoncé** : GREEN 4852 passed / 4852 total · refactor :
  aucun (passe manuelle sur le diff : `writeToClipboard` déplacée telle quelle, deux sites d'appel réels,
  `code-copy.ts` et la facade) ; verify ✅ PASS sur `/admin/rendez-vous` (surface atteignable restructurée :
  la section `active` gagne un bouton, le `409` déplace désormais le focus) (cf. `### F3`).
- **Tranche F4 — zéro violation axe sur la section** : tranche d'audit, verte d'emblée par nature (comme 024 F6 et 025 F5) · `pnpm a11y` 91 passed / 91 total, exit 0, dont 8 analyses neuves (lien affiché, dialogue de régénération, lien régénéré, toast « Lien copié », état non configuré ; clair et sombre), réseau fermé (`blocked=0`) ; repère du dialogue d'annulation recalé (adaptation mécanique) ; `pnpm test` 4852 passed, exit 0

### A1

Fichiers (API `nest-portfolio-app`) :

- créés : `src/booking/feed-token.ts`, `booking-meeting.ts`, `booking-feed.ts`, `booking-feed.service.ts`,
  `booking-feed.controller.ts`, `drizzle/0026_booking_feed.sql`, `drizzle/meta/0026_snapshot.json` (générés
  par `drizzle-kit generate --name booking_feed`, SQL identique au plan) ;
- modifiés : `to-ics.ts` (`calendarLines` / `veventLines` / `serialize` internes, `toIcsFeed`),
  `booking-notifier.service.ts` (importe `meetingOf`, rien d'autre), `booking.module.ts`,
  `src/config/env.schema.ts`, `env.validation.ts`, `app-config.service.ts`, `src/database/schema/booking.ts`,
  `drizzle/meta/_journal.json`, `README.md` (ligne `BOOKING_FEED_SECRET` « à ajouter dans Dokploy »,
  `openssl rand -base64 48`, paragraphe « Abonnement d'agenda »).

Écarts au plan :

1. **`Content-Type` posé au succès seulement** (`res.setHeader` via `@Res({ passthrough: true })`), pas par
   `@Header` : Nest applique les `@Header` avant le gestionnaire, donc aussi au 404, dont le corps JSON partait
   en `text/calendar` (supertest le voyait vide). `Cache-Control` et `X-Robots-Tag` restent en `@Header`.
2. **`new NotFoundException('Not Found')`** : sans argument, Nest ne renseigne pas `error` et le filtre
   écrivait `NOT_FOUND` ; le corps vaut désormais celui du contrat.
3. **Secret trop court** : la règle des 32 caractères vit dans `validateEnv` (avertissement `Logger('Env')`
   sans la valeur, variable retirée de la config) et non dans le schéma Zod (qui ferait échouer le démarrage).
   Le getter `bookingFeedSecret` revérifie la longueur, parce que `ConfigService.get` retombe sur
   `process.env`, où la valeur écartée reste présente : sans cette garde, le secret de 20 caractères aurait
   été utilisé (prouvé au démarrage réel ci-dessous).
4. README écrit dès A1 (le plan le plaçait en A3), à la demande de l'orchestrateur.

**Défaut de test signalé (non corrigé, consigne « ne pas modifier les tests »)** :
`booking-feed.service.spec.ts`, les deux cas « Given un jeton valide / faux, Then il n'apparaît dans aucun
argument de requête » échouent en `TypeError: sql2.toQuery is not a function`. Leur `serialize` teste
`isSQLWrapper(value)`, vrai aussi pour une table Drizzle (qui porte `getSQL`), puis appelle
`PgDialect.sqlToQuery(table)`. Or `.from(table)` est inévitable (le test « sel lu » exige
`getTableName(db.from.mock.calls[0][0])`). Correctif proposé : `is(value, SQL)` (import `is`, `SQL` de
`drizzle-orm`) à la place de `isSQLWrapper(value)`. Copie temporaire du spec ainsi corrigée : **19/19 verts**
avec l'implémentation actuelle (copie supprimée).

Preuves (code de sortie lu) :

- `pnpm test -- src/booking src/config; echo $?` → `1` : 2 failed (les deux ci-dessus), 742 passed, 50 skipped.
- `pnpm test; echo $?` → `1` : 2 failed (les mêmes), 1750 passed, 55 skipped / 1807.
- Intégration (Postgres 17 jetable `55433`) `booking.integration booking-scheduler.integration
  booking-feed.integration` → `0`, 50/50.
- `pnpm lint` → `0` (aucun fichier modifié par `--fix`) ; `pnpm build` → `0` ; `npx tsc --noEmit` : 4 erreurs,
  toutes dans des specs préexistants non touchés (`analytics-tracker.service`, `referrer`, `auth.service`,
  `update-profile.dto`), aucune nouvelle.
- `to-ics.spec.ts`, `booking-notifier.service.spec.ts`, `booking-policy.spec.ts` verts sans modification.
- Démarrage réel (`node dist/main.js`, base migrée jusqu'à `0026`) :
  - sans la variable : API démarrée, route `Mapped {/api/booking/feed/:file, GET}`, `GET
    /api/booking/feed/<43 A>.ics` → 404 JSON, `no-store`, `noindex, nofollow` ;
  - variable de 20 caractères : API démarrée (`/api/health` 200), avertissement
    `BOOKING_FEED_SECRET ignored: it must be at least 32 characters…`, valeur absente du journal (0
    occurrence) ; 404 pour un jeton quelconque **et** pour le jeton dérivé de ce secret court et du sel posé en
    base ;
  - contrôle positif, secret de 64 caractères et même sel : 200 `text/calendar; charset=utf-8`, corps
    `BEGIN:VCALENDAR` … `END:VCALENDAR`, aucun avertissement.
- Reste A2 : le chemin du 404 et le journal pino portent encore le jeton en clair (masquage prévu en A2).

### A2

Fichiers (API `nest-portfolio-app`, tous modifiés, aucun créé hors tests de `qa`) :

- `src/common/log-redact.ts` : `redactUrl` (regex `FEED_PATH`), `serializeRequest` ;
- `src/app.module.ts` : `serializers: { req: serializeRequest }` (sérialiseur inline retiré) ;
- `src/common/filters/http-exception.filter.ts` : `path = redactUrl(req.url)`, réutilisé dans le corps, l'objet
  et le message du log 5xx ;
- `src/common/sentry-before-send.ts` : `transaction` et `request.url` passés à `redactUrl`, `query_string`
  retirée quand l'URL a été masquée ; `isUntracedIncomingRequest` (`/api/health` ou préfixe
  `/api/booking/feed/`) ;
- `src/instrument.ts` : `ignoreIncomingRequests: isUntracedIncomingRequest`.

Écarts au plan :

1. **Regex désancrée** (ambiguïté 1 du plan de test) : `/(\/api\/booking\/feed\/)[\s\S]*$/` remplacée par
   `$1[Filtered]`, au lieu de `^(\/api\/booking\/feed\/)…`. Une seule fonction couvre ainsi les chemins
   relatifs (pino, filtre), l'URL absolue de Sentry (`https://<hôte>/api/booking/feed/[Filtered]`) et la
   transaction (`GET /api/booking/feed/[Filtered]`), sans extraire le chemin dans `sentryBeforeSend`. Coût : un
   chemin qui contiendrait `/api/booking/feed/` ailleurs qu'en tête serait masqué aussi (sur-masquage sans
   risque). `feed-subscription` n'est pas touché (le motif exige `feed/`). `[\s\S]` plutôt que `.` pour ne
   rien laisser après un saut de ligne encodé puis décodé.
2. **`query_string` retirée seulement si l'URL a changé** (`redactUrl(url) !== url`) : critère « URL du flux »
   du plan, sans second motif.
3. **`transaction` absente → clé non ajoutée** : un événement sans `transaction` ni `request` est rendu tel
   quel (même référence), comme avant A2.

Preuves (code de sortie lu) :

- `pnpm test -- src/common src/booking; echo $?` → `0` : 836 passed, 50 skipped / 886.
- `pnpm test; echo $?` → `0` : 1785 passed, 55 skipped / 1840 (les 2 tests du service signalés en A1 sont
  verts, spec corrigé entre-temps par `qa`).
- `pnpm lint; echo $?` → `0` (aucun fichier modifié par `--fix`) ; `pnpm build; echo $?` → `0` ;
  `npx tsc --noEmit -p tsconfig.json` : les 4 mêmes erreurs préexistantes qu'en A1, aucune nouvelle.
- Contrôle runtime (`node dist/main.js`, `NODE_ENV=production`, Postgres 17 jetable `55433` migré jusqu'à
  `0026`, `BOOKING_FEED_SECRET` de 64 caractères, sel de 22 caractères posé en SQL, jeton dérivé par
  `dist/booking/feed-token.js`, sortie standard et d'erreur capturées dans un fichier) :
  - bon jeton → 200, corps `BEGIN:VCALENDAR` ; bon jeton `?x=1` → 200 ;
  - jeton faux (bien formé, autre sel) → 404, corps
    `{"statusCode":404,"error":"Not Found","message":"Not Found","path":"/api/booking/feed/[Filtered]",…}` ;
    jeton faux `?x=1` → même corps ;
  - lignes pino des quatre requêtes : `"req":{"id":…,"method":"GET","url":"/api/booking/feed/[Filtered]"}` ;
  - `grep -c <jeton>` → `0`, `grep -c <jeton faux>` → `0`, `grep -c <secret>` → `0`, `grep -c 'x=1'` → `0` sur
    la sortie capturée ; `grep -c <jeton>` sur le corps du 404 → `0` ;
  - même démarrage **sans** la variable : `/api/health` 200, flux en 404 au chemin masqué, jeton absent de la
    sortie (`0`) ; `GET /api/booking/slots?from=2026-10-20` journalisé avec son URL intacte (pas de
    sur-masquage) ;
  - processus et conteneur arrêtés.
- Non vérifié en runtime : Sentry (aucun DSN local) ; couvert par `sentry-before-send.spec.ts` et
  `instrument.spec.ts`.

### A3

Fichiers (API `nest-portfolio-app`, tous modifiés, aucun créé hors tests de `qa`) :

- `src/booking/booking-feed.service.ts` : `readSubscription()` (secret absent → `unconfigured` sans lecture ;
  `select feedSalt, feedCreatedAt … where id = 'main' limit 1` ; sel ou date absents → `none` ; sinon jeton
  recalculé par `deriveFeedToken` et date ISO). `regenerate()` inchangé : déjà livré en A1 conforme au plan (sel
  `createFeedSalt()` de 16 octets, upsert `onConflictDoUpdate` limité à `feedSalt`, `feedCreatedAt`,
  `updatedAt`, 409 `ConflictException({ error: 'feed_not_configured', message })` sans secret) ;
- `src/booking/booking-admin.controller.ts` : `BookingFeedService` injecté, `GET feed-subscription` (200) et
  `POST feed-subscription` (201, sans `@Body`), `@Header('Cache-Control', 'no-store')`, `@ApiOperation` /
  `@ApiResponse` (409 `feed_not_configured`), aucun throttle propre, garde JWT de classe inchangée ;
- `src/booking/booking-notifier.service.ts` : constante `MANUAL_CALENDAR_NOTE` (texte exact du plan de test),
  insérée dans les deux introductions **visiteur** ; introductions du propriétaire inchangées ;
- `README.md` : routes `GET|POST /feed-subscription` (et le flux) dans la liste des routes ; sous « Abonnement
  d'agenda », lecture admin, création et régénération (409, `no-store`, fériés intacts), rotation du secret.

Écarts au plan : aucun sur le comportement. Précision : une ligne avec un sel mais sans `feed_created_at` (état
que `regenerate` n'écrit jamais) rend `none`, le contrat `active` exigeant une date. `@Header` s'applique aussi au
409 (`no-store` sur l'erreur), sans effet sur le contrat.

Preuves (code de sortie lu) :

- `pnpm test -- src/booking; echo $?` → `0` : 721 passed, 56 skipped / 777.
- Intégration (Postgres 17 jetable `55433`) `booking.integration booking-scheduler.integration
  booking-feed.integration; echo $?` → `0` : 56/56.
- `pnpm test; echo $?` → `0` : 1807 passed, 61 skipped / 1868.
- `pnpm lint; echo $?` → `0` (aucun fichier modifié par `--fix`) ; `pnpm build; echo $?` → `0` ;
  `npx tsc --noEmit -p tsconfig.json` : les 4 erreurs préexistantes seules (`analytics-tracker.service`,
  `referrer`, `auth.service`, `update-profile.dto`).
- `mail-templates.spec.ts` et les tests A1/A2 verts sans modification ; aucun test touché.
- Contrôle runtime (`node dist/main.js`, `NODE_ENV=production`, base `rt` du Postgres jetable migrée jusqu'à
  `0026` par `drizzle-kit migrate`, utilisateur inséré en SQL, JWT HS256 signé localement avec le `JWT_SECRET` de
  test, `BOOKING_FEED_SECRET` aléatoire de 64 caractères, sortie capturée dans un fichier) :
  - `Mapped {/api/booking/feed-subscription, GET}`, `Mapped {/api/booking/feed-subscription, POST}` ;
  - `GET` → `{"status":"none"}`, `Cache-Control: no-store` ; `POST` → 201
    `{"status":"active","token":<43 car.>,"createdAt":…}`, `no-store` ; `GET` → corps identique ; flux → 200 ;
  - second `POST` → 201, jeton différent ; ancien flux → 404, nouveau → 200 ;
  - sans session : `GET` 401, `POST` 401 ;
  - redémarrage sans la variable : `GET` → `{"status":"unconfigured"}` ; `POST` → 409
    `{"statusCode":409,"error":"feed_not_configured","message":"Abonnement non configuré.","path":"/api/booking/feed-subscription",…}` ;
    flux → 404 ;
  - sur la sortie capturée des deux démarrages : `grep -c <jeton 1>` → `0`, `grep -c <jeton 2>` → `0`,
    `grep -cF <secret>` → `0` ; requêtes du flux journalisées en `/api/booking/feed/[Filtered]` ;
  - processus et conteneur arrêtés.

### F1

Fichiers (front, branche `feat/026-abonnement-agenda`, non commités ; squelettes de `qa` remplis, tests et
doublures inchangés) :

- `infra/booking.adapter.ts` : `toBookingFeedSubscription(raw, feedBaseUrl)` par `switch` sur `status`,
  copie champ par champ (`unconfigured`/`none` → `{ kind }` ; `active` → `url` =
  `${feedBaseUrl}${encodeURIComponent(token)}.ics`, `createdAt`) ; ni `token` ni champ inconnu recopiés ;
- `infra/http-booking.gateway.ts` : `getFeedSubscription()` (`GET feed-subscription`, `silentErrors()`, erreur
  propagée) et `regenerateFeedSubscription()` (`POST feed-subscription`, corps `null`, `silentErrors()`,
  `toResult(toAdminFailure)`) ; `DOCUMENT` et `API_LINK_BASE_URL` injectés ; la base du flux est résolue à
  chaque réponse par `new URL(linkBase + '/booking/feed/', document.location.href)`, donc absolue aussi
  quand la base vaut `/api` ; `toAdminFailure` : `409` + `feed_not_configured` → `not-configured`, `day_in_closure`
  → `day-in-closure`, tout autre `409` → `too-late` (inchangé) ; import `NEVER` du squelette retiré ;
- `domain/models/booking-admin.model.ts`, `domain/gateways/booking.gateway.ts`, `infra/booking-api.types.ts` :
  conformes aux squelettes, sans changement.

Écarts au plan : aucun. Précision : la base du flux est calculée dans un `map` plutôt qu'à la construction, pour
qu'un `document.location` sans origine exploitable (`about:blank`) ne fasse pas échouer l'instanciation de la
gateway, dont dépendent toutes les autres routes de réservation.

Preuves (code de sortie lu) :

- `pnpm test --include='src/app/features/booking/**/*.spec.ts'; echo $?` → `0` : 282 passed / 282, 10 suites.
- `pnpm test; echo $?` → `0` : 4802 passed / 4802, 254 suites.
- `pnpm lint; echo $?` → `0` ; `pnpm run format:check` → `0`.
- `pnpm run build --configuration production; echo $?` → `0` (CSP durcie sur 10 pages).
- Verify runtime reportée : aucun composant ne consomme encore ces méthodes (F2), aucune surface atteignable n'est
  modifiée ; le seul changement sur un chemin existant (`toAdminFailure` en `409`) est tenu par les tests
  `cancel_too_late` et `day_in_closure` verts sans modification.

### F2

Fichiers (front, non commités ; tests et helper de `qa` inchangés) :

- `application/booking-feed-view.ts` : `toBookingFeedView` par `switch` sur `kind` (`since` =
  `formatParisDateTime(createdAt)`) ; `toWebcalUrl` remplace le seul préfixe `^https?:` par `webcal:` ;
- `pages/admin-bookings/feed-subscription-panel.ts` : facade `@Injectable()` instance-scopée.
  `rxResource` sur `getFeedSubscription()`, `view`/`state` en `computed` (`loadState(…, () => false)`),
  `regenerating` en lecture seule. `regenerate()` : ignorée si en vol ; toast de création si l'état d'avant
  est `none`, de régénération sinon ; `subscription.set(data)` au succès ; échec → toast par raison
  (`not-configured`, `network`, sinon message serveur, `invalid` compris) et relecture seulement en
  `not-configured` ; `finalize` remet `regenerating` à faux ; `takeUntilDestroyed` ;
- `application/components/admin-booking-feed.ts` : `section[app-admin-booking-feed]` (host
  `aria-labelledby`, `AdminSectionHead` pour le `h2`, grammaire des sections `Fermetures`). Entrées `view`,
  `state`, `regenerating` ; sorties `regenerateRequested`, `retry` (`copyRequested` viendra en F3).
  Squelette `role="status"`, `app-load-error`, message `unconfigured` en encadré `status-warn` avec les deux
  `code`, `none`, puis en `active` le `label for` + `input readonly form-input font-mono` et la date. Le
  bouton d'action unique (`primary` en `none`, `outlined` en `active`) et le lien `webcal://` sont **hors**
  des branches d'état, sous un `@if` booléen stable : l'élément survit au passage `none` → `active`.
  `aria-disabled="true"` pendant l'appel, activation ignorée. L'aide (`ul role="list"`) et la confirmation
  ne sont rendues qu'en `active` (zéro bouton en `unconfigured`) ;
- `pages/admin-bookings/admin-bookings.ts` : `providers: [FeedSubscriptionPanel]`, section `mt-14` entre
  la liste et la confirmation d'annulation.

Écarts : le lien `webcal://` porte le libellé du plan et des tests, « Ouvrir dans Calendrier », et non
« S'abonner depuis cet appareil » évoqué dans le brief de l'orchestrateur (l'aide iPhone cite ce libellé).
Pas de focus déplacé quand la section bascule en `unconfigured` après un `409` (le bouton disparaît ; non
demandé par les tests).

Preuves (code de sortie lu) :

- `pnpm test --include='src/app/features/admin/**/*.spec.ts'; echo $?` → `0` : 2077 passed / 2077, 74 suites.
- `pnpm test; echo $?` → `0` : 4839 passed / 4839, 256 suites.
- `pnpm lint; echo $?` → `0` ; `pnpm run format:check` → `0`.
- `pnpm run build --configuration production; echo $?` → `0` (chunk `admin-bookings` 19,18 kB ; CSP durcie
  sur 10 pages).

#### Verify

Steps : `STUB_ADMIN_SESSION=1 node ci/api-stub/server.mjs` + `pnpm start`, script Playwright jetable
(`page.route('**/api/booking/feed-subscription')`, état en mémoire, `POST` différé de 400 ms), indice
`auth:session` posé, `/admin/rendez-vous`.

- `none` : bouton « Créer le lien d'abonnement » ; focus + Entrée deux fois → `aria-disabled="true"`, **un**
  `POST` ; lien `http://localhost:4200/api/booking/feed/<jeton>.ics`, `webcal://localhost:4200/api/booking/feed/<jeton>.ics` ;
  focus resté sur le même bouton, libellé « Régénérer le lien ».
- `active` : Entrée → confirmation ; Échap → aucun `POST`, focus rendu au bouton ; Entrée → « Régénérer le
  lien » → nouveau jeton affiché, focus rendu au bouton, toast « l'ancien ne fonctionne plus », 2 `POST` au
  total ; `localStorage`/`sessionStorage` sans jeton.
- `none` puis secret retiré : création → `409 feed_not_configured` → toast « ajoutez BOOKING_FEED_SECRET »,
  section `unconfigured`, plus de bouton.
- `unconfigured` au chargement : zéro bouton dans la section.
- Aucun débordement horizontal à 375 px (clair et sombre).

Verdict : **PASS**. Captures (`scratchpad/s026-f2/`) : `desktop-light-none`, `desktop-light-active`,
`desktop-light-confirm`, `desktop-light-regenerated-page`, `desktop-dark-active`, `mobile-light-active`,
`mobile-dark-active`, `desktop-light-unconfigured`, `mobile-dark-unconfigured`. Console : aucune erreur JS ni
avertissement Angular ; seules entrées, des ressources réseau : `404 /api/config`, préexistant (la doublure
n'a pas cette route ; même 404 sur `/admin/messages`), et le `409` voulu du scénario `not-configured`.

### F3

Fichiers (front, non commités ; tests de `qa` inchangés) :

- `shared/clipboard/write-to-clipboard.ts` : corps de la fonction privée de `code-copy.ts` déplacé tel quel
  (`navigator.clipboard` absent ou `writeText` rejeté → `false`, jamais de rejet) ;
- `features/blog/application/components/code-copy.ts` : fonction privée retirée, import de
  `@shared/clipboard/write-to-clipboard` (`code-copy.spec.ts` vert sans modification) ;
- `pages/admin-bookings/feed-subscription-panel.ts` : `copyLink()` lit `view()`, hors `active` → rien ;
  sinon `PendingTasks.run` autour de `writeToClipboard(view.url)` (l'URL https, jamais le `webcal://`) puis
  toast succès ou échec (textes du plan, insécable avant les deux-points) ;
- `application/components/admin-booking-feed.ts` : sortie `copyRequested` ; bouton `appButton`
  `variant="outlined"` `type="button"` `data-testid="admin-booking-feed-copy"`, icône `clipboard`
  (`aria-hidden`), « Copier le lien », sous le champ, dans la branche `active` (élément stable tant que
  l'état reste `active`). Focus : `afterRenderEffect({ write })` qui retient qu'un bouton d'action a été
  rendu et, au passage en `unconfigured`, appelle `AdminSectionHead.focusHeading()` (`viewChild.required`) ;
  aucune lecture de layout, aucun vol de focus quand la page s'ouvre déjà en `unconfigured` ;
- `pages/admin-bookings/admin-bookings.ts` : `(copyRequested)="feed.copyLink()"`.

Écarts : aucun sur le contrat. L'écart F2 n° 2 (focus non déplacé en `unconfigured`) est soldé.

Preuves (code de sortie lu) :

- `pnpm test; echo $?` → `0` : 4852 passed / 4852, 257 suites.
- `pnpm lint; echo $?` → `0`.
- `pnpm run build --configuration production; echo $?` → `0` (CSP durcie sur 10 pages).

#### Verify

Steps : `STUB_ADMIN_SESSION=1 node ci/api-stub/server.mjs` + `pnpm start`, script Playwright jetable
(`scratchpad/verify-f3.mjs` : `context.grantPermissions(['clipboard-read','clipboard-write'])`,
`page.route('**/api/booking/feed-subscription')`, état en mémoire), indice `auth:session` posé,
`/admin/rendez-vous`.

- `active` (1280 px clair, 375 px sombre) : presse-papiers mis à `avant`, focus sur « Copier le lien » +
  Entrée → presse-papiers = `http://localhost:4200/api/booking/feed/<jeton>.ics` (l'URL du champ, pas le
  `webcal://` ; la doublure sert en `http`), toast « Lien copié dans le presse-papiers », focus resté sur le
  bouton, aucun `POST`, aucun débordement horizontal.
- `none` : aucun bouton de copie ; secret retiré, création → `409` → section `unconfigured`, focus sur
  `admin-booking-feed-heading`.
- `unconfigured` au chargement : focus non déplacé (`BODY`).

Verdict : **PASS**. Captures (`scratchpad/s026-f3/`) : `desktop-light-active`, `desktop-light-copied-page`,
`mobile-dark-active`, `mobile-dark-copied-page`, `desktop-light-unconfigured-focus`. Console : aucune erreur
JS ni avertissement Angular ; seules entrées, des ressources réseau : `404 /api/config`, préexistant (cf. F2),
et le `409` voulu du scénario `not-configured`.

## Review code

### API

Revue du 2026-10-15, `nest-portfolio-app`, branche `feat/booking-feed` (`b47c4f1`, `49a9469`, `2bd33c8`),
`git diff origin/master...HEAD`.

**Verdict** : REJECTED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile` → 0) / tests ✅ (`pnpm test` → 0, 1807 passed, 61 skipped / 1868) / intégration ✅ (`BOOKING_IT_DATABASE_URL=… pnpm test -- booking.integration booking-scheduler.integration booking-feed.integration` → 0, 56/56) / lint ✅ (`pnpm lint` → 0, aucun fichier réécrit par `--fix`) / build ✅ (`pnpm build` → 0) / image ✅ (`docker build -t nest-portfolio-app:review-feed .` → 0)
**Checks mécaniques** : checker non vendoré (dépôt NestJS sans `.claude/`) : auto-checks joués à la main ; profil absent pour ce dépôt, politique d'archéologie non appliquée (trace)
**Warnings de gate** : (b) `pnpm test` : deux journaux `ERROR` attendus de `MailerService` et `ContactService`, suites hors diff ; (b) `npx tsc --noEmit -p tsconfig.json` → 2 : les 4 erreurs préexistantes dans des specs non touchés (`analytics-tracker.service`, `referrer`, `auth.service`, `update-profile.dto`), aucune nouvelle
**Rendu compilé** : N/A
**Preuve de verify runtime** : ❌ (image démarrée sur une base au niveau de `master` : flux, routes admin et déploiement conformes ; mais le jeton part dans les transactions Sentry, cf. point 1)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : N/A (API NestJS)
**Cross-platform** : N/A
**Tests** : ❌ (`instrument.spec.ts` ne prouve que le prédicat `ignoreIncomingRequests`, pas l'absence du jeton dans ce que Sentry envoie : vert alors que la fuite existe)
**Sécurité** : ❌
**Alignement spec** : ❌ (exigence 3 « absent des logs et de Sentry » non tenue)

**Vérifié conforme** :

- HMAC-SHA256 `booking-feed:<sel>` en base64url (43 caractères) ; `feedTokenMatches` compare les longueurs avant `timingSafeEqual` ; le jeton présenté ne part jamais en paramètre SQL.
- 404 indistinct au runtime : jeton faux bien formé, `.txt`, `%2F`, `.ICS`, aucun sel, secret absent, court ou vide : même corps JSON, `path` masqué, `Content-Type: application/json` ; `text/calendar` seulement sur le 200 ; `no-store` et `noindex, nofollow` sur les deux.
- Déploiement : secret de 31 caractères, absent ou vide → API démarrée, `/api/health` 200, flux 404, `GET` → `unconfigured`, `POST` → 409 `feed_not_configured`. Avertissement `[Env] BOOKING_FEED_SECRET ignored…` sans la valeur (0 occurrence). Le getter revérifie la longueur, donc le repli de `ConfigService.get` sur `process.env` ne ressuscite pas une valeur écartée.
- Migration `0026` (chaîne `prevId` du snapshot correcte) appliquée par le `CMD` de l'image sur une base migrée par `master`, avec une ligne `booking_setting` existante (`close_public_holidays = false`) : deux colonnes nullables et le `check`, ligne intacte, `false` conservé après `POST`. Migration additive, donc un retour à l'image précédente ne pose pas de problème.
- Admin : 401 sans session ; `none` → `POST` 201 → `GET` identique (jeton et `createdAt`) ; une régénération fait passer l'ancien lien en 404 et le nouveau en 200 ; `no-store` ; ni sel ni secret dans les corps.
- iCalendar validé par `ical.js` 2.1.0 et `node-ical` 0.20.1 (cas réel : émojis, `,` `;`, message de trois lignes, visio et téléphone) : aucun `METHOD`, `NAME`/`X-WR-CALNAME`/`REFRESH-INTERVAL;VALUE=DURATION:PT15M`/`X-PUBLISHED-TTL:PT15M`, CRLF seul, 75 octets au plus par ligne, dépliage fidèle. `UID` = `booking.id` comme `invitation()`, `SEQUENCE:0`, `DTSTAMP` = `created_at`. Présents : le rendez-vous fini il y a 150 jours et ceux à venir. Absents : l'annulé à venir et celui fini il y a 210 jours. Le format convient aux abonnements Apple et Google : UTC sans `VTIMEZONE`, nom lu par `X-WR-CALNAME`.
- `toIcs` : `to-ics.spec.ts` non modifié et vert ; note d'annulation dans les deux introductions visiteur, introductions propriétaire et `mail-templates.spec.ts` inchangés.
- Journaux pino au runtime : `"url":"/api/booking/feed/[Filtered]"` ; jetons, secret, JWT et `x=1` à 0 occurrence ; corps et log des 5xx masqués ; événements d'erreur Sentry (5xx réel provoqué) masqués (`request.url`, `transaction`).

**Risque résiduel** (advisory, § 8) :

- réversibilité : profil absent ; monitoring : Sentry (actif en prod, 20 % de traces) ;
- le seul état persistant ajouté est la migration `0026`, additive, et un revert du code n'a rien à défaire ;
- non couvert par les gates : l'acceptation réelle du `VCALENDAR` vide par Apple et Google (risque déjà acté, à confirmer au test réel).

**Points à corriger** :

1. **Bloquant, sécurité.** `src/instrument.ts:15-33` et `src/common/sentry-before-send.ts` : le jeton du flux
   part en clair dans les **transactions** Sentry. `ignoreIncomingRequests` ne supprime que le span `http.server`.
   Le span `request_context.nestjs` de `@sentry/nestjs` 10.73 (`wrapRequestContextHandler`, `core.startSpan` sans
   parent requis) ouvre alors une transaction racine `GET /api/booking/feed/:file`. Elle porte
   `request.url = https://<hôte>/api/booking/feed/<jeton>.ics`, `query_string`, et `contexts.trace.data`
   `http.url`/`url`, plus une transaction `HttpExceptionFilter` pour les 404 et 5xx. `beforeSend` ne s'applique
   pas aux transactions.
   - Preuve : image `review-feed`, DSN vers un collecteur local, `SENTRY_TRACES_SAMPLE_RATE=1`. Trois
     transactions contiennent le jeton valide (deux `GET /api/booking/feed/:file`, dont une avec `x=1`, et un
     `HttpExceptionFilter`) ; l'événement d'erreur du 5xx est propre.
   - En prod, à 20 %, environ un rafraîchissement sur cinq envoie le lien à Sentry.
   - Correctif : un `beforeSendTransaction` qui **écarte** (`return null`) toute transaction dont `transaction`,
     `request.url` ou `contexts.trace.data['http.url']` désigne le flux, à défaut qui les masque avec
     `query_string`, `http.query` et les `spans[].data`. Ou, en amont, un `tracesSampler` qui rend `0` pour le
     flux.
   - Tests : un test pur sur un événement de transaction de la forme réelle ci-dessus, et une preuve runtime
     avec un collecteur local. `instrument.spec.ts` doit vérifier le branchement de ce hook, pas seulement le
     prédicat.
2. **Bloquant, sécurité.** `src/common/log-redact.ts:36` et `src/common/sentry-before-send.ts:62-63` : la
   comparaison est sensible à la casse, alors que le routage Express ne l'est pas.
   - `GET /api/BOOKING/feed/<jeton>.ics` (ou `/Feed/`) rend **200** avec le flux, et pino journalise
     `"url":"/api/BOOKING/feed/<jeton>.ics"` en clair. `isUntracedIncomingRequest` rend `false` (la requête est
     tracée), et un 404/429 renvoie le chemin non masqué dans `path`.
   - Correctif : drapeau `i` sur `FEED_PATH` et comparaison en minuscules dans `isUntracedIncomingRequest`.
   - En défense en profondeur, `/api//booking/feed/<jeton>.ics` et `/api/booking/%66eed/<jeton>.ics` (404, non
     servis) journalisent aussi le jeton. Envisager en plus un masquage par la forme
     (`[A-Za-z0-9_-]{43}\.ics`).
   - Tests `it.each` sur ces variantes dans `log-redact.spec.ts` et `sentry-before-send.spec.ts`.
3. Mineur : `README.md` ne documente ni le masquage du jeton (pino, corps d'erreur, Sentry), prévu au plan
   (tableau des fichiers, ligne README), ni la contrainte sur les traces Sentry.
4. Mineur : exports sans consommateur hors du fichier : `SerializedRequest` (`src/common/log-redact.ts:43`) et
   `Meeting` (`src/booking/booking-meeting.ts:4`) ; `IcsFeed` n'est consommé que par un test.

Informatif, non bloquant :

- **Temps de réponse** : un jeton faux bien formé coûte une requête SQL, alors qu'un fichier malformé ou un
  secret absent n'en coûte aucune. Le corps reste identique et aucun secret n'est révélé.
- **Commentaires** : ils citent `ADR-0028`, `(spec 026)` et `(décision du 2026-10-15)`. Le dépôt API n'a pas
  de profil et `master` cite déjà des ADR dans une trentaine de fichiers ; les deux derniers relèvent tout de
  même de l'archéologie.
- **Avertissement d'environnement** : il sort par le `ConsoleLogger` de Nest et non en JSON pino, car il est
  émis avant le logger applicatif.

#### Correctifs

Correctifs du 2026-10-15 sur `feat/booking-feed` (au-dessus de `2bd33c8`, non commités). Le jeton est noté
`<T>` ci-dessous.

1. **Transactions Sentry (bloquant).**
   - **Choix** : `beforeSendTransaction` plutôt que `tracesSampler`. Le hook voit l'événement final, quel que soit
     le span devenu racine : `request_context.nestjs`, `http.server` sur les chemins non reconnus, ou le filtre
     d'exceptions. Le sampler, lui, ne reçoit que le nom et les attributs du span au démarrage, et la racine
     `HttpExceptionFilter` n'y porte pas d'URL.
   - **Forme réelle** : relevée sur un collecteur local avec `@sentry/nestjs` 10.73. Le nom est la route
     (`GET /api/booking/feed/:file`), mais l'URL concrète figure dans `request.url`, dans
     `contexts.trace.data['http.url' | 'url']`, et dans `url.full`, `url.path` et `http.target` pour une racine
     `http.server`.
   - **RED** (`sentry-before-send.spec.ts`, `instrument.spec.ts`) : 35 tests en échec, dont
     `sentryBeforeSendTransaction is not a function`. Sept variantes de chemin sont testées sur trois formes de
     transaction (route, `http.server`, filtre), plus une donnée de trace seule, un span qui cite le jeton, trois
     transactions d'autres routes à rendre intactes et la non-mutation. `instrument.spec.ts` vérifie
     maintenant le branchement : le hook passé à `Sentry.init` est la fonction exportée, et il écarte une
     transaction du flux.
   - **GREEN** : `sentryBeforeSendTransaction` (`src/common/sentry-before-send.ts`) rend `null` dès que
     `transaction`, `request.url` ou une clé URL de `contexts.trace.data` désigne le flux. Sinon, il masque par
     `redactUrl` les chaînes de `request`, de `contexts.trace.data` et des `spans[]` (`description`, `data`).
     Le hook est branché dans `src/instrument.ts`.
   - **Défaut trouvé au runtime, puis corrigé en TDD** : la première version parcourait tout l'événement. Or
     l'événement remis au hook porte `sdkProcessingMetadata`, qui contient les scopes et est circulaire : le
     parcours finissait en `RangeError: Maximum call stack size exceeded`, et Sentry remontait cette erreur à la
     place de chaque transaction. RED : un test avec des métadonnées circulaires. GREEN : le parcours est limité
     aux champs sérialisés, et les métadonnées gardent leur référence.
   - **Preuve runtime** (`node dist/main.js`) :
     - Montage : base jetable `postgres:16-alpine` migrée (port 55433), secret de 64 caractères, sel posé,
       `SENTRY_DSN=http://k@127.0.0.1:3912/1`, `SENTRY_TRACES_SAMPLE_RATE=1`, collecteur HTTP jetable
       (`POST /api/<id>/envelope/`).
     - Appels : bon jeton, `?x=1`, faux jeton, `/api/BOOKING/feed/`, `/api/booking/Feed/`, `.ICS`, `//`,
       `%66eed`, `/slots`, `/health`, `/feed-subscription`. Trois 5xx réels sont provoqués en renommant
       `booking_setting` : flux, flux en majuscules, `/slots`.
     - Avant correctif (code de `2bd33c8`) : 22 enveloppes, dont **7** contiennent `<T>` (cinq
       `GET /api/booking/feed/:file`, dont `?x=1`, `BOOKING`, `Feed` et `.ICS`, et un `HttpExceptionFilter`).
     - Après correctif : 11 enveloppes, `grep -c <T>` → **0**. Le collecteur reçoit bien les transactions
       `GET /api/booking/slots`, `GET /api/health`, `Create Nest App` et les spans SQL, mais aucune transaction
       du flux. Les trois événements d'erreur 500 arrivent masqués :
       `request.url = …/api/booking/feed/[Filtered]` et `…/api/BOOKING/feed/[Filtered]`,
       `transaction = GET /api/booking/feed/[Filtered]`.
2. **Masquage insensible à la casse (bloquant).**
   - **RED** : 17 tests en échec.
     - `log-redact.spec.ts` : `redactUrl` et une ligne pino via `serializeRequest`, sur `BOOKING`, `Feed`,
       `.ICS`, `//`, `%66eed`, `%2Eics?x=1` et l'URL absolue `Booking/FEED`. Trois URL sans forme de jeton
       doivent rester intactes.
     - `http-exception.filter.spec.ts` : corps 404 et log 500 sur cinq variantes.
     - `sentry-before-send.spec.ts` : événement d'erreur et `isUntracedIncomingRequest` sur les sept variantes.
   - **GREEN** (`src/common/log-redact.ts`) :
     - `FEED_PATH` prend le drapeau `i`.
     - En renfort, `FEED_TOKEN_SEGMENT = /[A-Za-z0-9_-]{43}(?:\.|%2e)ics/gi` est remplacé par `[Filtered]` où
       qu'il apparaisse.
     - `isUntracedIncomingRequest` passe par le même critère (`redactUrl(url) !== url`) : casse, `//` et
       encodages sont couverts sans seconde règle.
   - **Preuve runtime** (même montage) : avant correctif, `grep -c <T>` dans la sortie pino → **4**. Après →
     **0**, avec `"url":"/api/BOOKING/feed/[Filtered]"` (3), `"/api//booking/feed/[Filtered]"` (1),
     `"/api/booking/%66eed/[Filtered]"` (1) et `"/api/booking/feed/[Filtered]"` (6).
3. **README** : la section Logging décrit le sérialiseur, le masquage par chemin et par forme, et le `path`
   du filtre. La section Observabilité décrit pourquoi `ignoreIncomingRequests` ne suffit pas, le
   `beforeSendTransaction` qui écarte et masque, `beforeSend` sur les erreurs, et la consigne pour toute
   future route qui porterait un secret dans son chemin.
4. **Exports** :
   - `SerializedRequest` et `Meeting` ne sont plus exportés. Le grep sur `src` et `test`, specs comprises, ne
     trouve aucun consommateur hors de leur fichier, et le build (`declaration: true`) passe.
   - `IcsFeed` reste exporté : il type le paramètre de `toIcsFeed`, fonction exportée et API publique du module
     (consommée par `booking-feed.service.ts`). Un appelant doit pouvoir nommer ce type pour construire son
     argument, comme le fait le builder du test.

Vérifications finales :

- `pnpm test; echo $?` → 0 (1873 passed, 61 skipped / 1934) ;
- `pnpm lint; echo $?` → 0, aucun fichier réécrit par `--fix` ;
- `pnpm build; echo $?` → 0 ;
- intégration `booking.integration booking-scheduler.integration booking-feed.integration` sur la base
  jetable → 0, 56/56 ;
- `npx tsc --noEmit -p tsconfig.json` : les 4 erreurs préexistantes seulement ;
- conteneur et processus arrêtés.

Constat hors périmètre : `GET /api/health` produit lui aussi une transaction Sentry malgré
`ignoreIncomingRequests`, par le même mécanisme de span racine Nest. Il n'y a pas de secret, seulement du
bruit et du quota.

#### Re-revue (verdict final)

Re-revue du 2026-10-15 sur `git diff 2bd33c8..e38a83b`, branche `feat/booking-feed` à `e38a83b`, copie de travail propre.

**Verdict** : APPROVED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile` → 0) / tests ✅ (`pnpm test` → 0, 1873 passed, 61 skipped / 1934) / intégration ✅ (`… booking.integration booking-scheduler.integration booking-feed.integration` → 0, 56/56) / lint ✅ (`pnpm lint` → 0, aucun fichier réécrit) / build ✅ (`pnpm build` → 0) / image ✅ (`docker build -t nest-portfolio-app:review-feed .` → 0)
**Checks mécaniques** : checker non vendoré (dépôt NestJS sans `.claude/`) : auto-checks joués à la main
**Warnings de gate** : (b) seulement : journaux `ERROR` attendus des specs `MailerService`/`ContactService`, et `tsc --noEmit` avec les 4 erreurs préexistantes de specs non touchés, aucune nouvelle
**Rendu compilé** : N/A
**Preuve de verify runtime** : ✅ (image reconstruite sur une base migrée au niveau de `master` puis passée à `0026`, collecteur Sentry local, `SENTRY_TRACES_SAMPLE_RATE=1`)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : N/A (API NestJS)
**Cross-platform** : N/A
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Preuve rejouée** :

- **Requêtes jouées** :
  - variantes du flux : jeton valide, `?x=1`, `/api/BOOKING/feed/`, `/api/booking/Feed/` et `<jeton>%2eics` → 200 ;
  - `/api//booking/feed/<jeton>.ics`, `/api/booking/%66eed/<jeton>.ics` et un jeton faux → 404 ;
  - deux 5xx réels, provoqués en renommant la table `booking`, en minuscules et en `/api/BOOKING/feed/…?x=1` → 500.
  - Les corps d'erreur portent `path` masqué : `/api/booking/feed/[Filtered]` et `/api/BOOKING/feed/[Filtered]`.
- **Occurrences, enveloppes Sentry puis sortie pino** : jeton `0`/`0`, secret `0`/`0`, `x=1` `0`/`0`, jeton faux `0` dans Sentry.
- **pino** : toutes les variantes sont journalisées en `[Filtered]`. Les deux logs 5xx portent `Unhandled 500 on GET /api/…/feed/[Filtered]`.
- **Sentry, flux** : les transactions du flux sont toutes écartées. Les deux 5xx arrivent en **événements d'erreur**, avec `transaction` et `request.url` masqués.
- **Sentry, autres routes** : leurs transactions arrivent (`GET /api/booking/slots` × 3 avec leur query string, `POST /api/booking/feed-subscription`, `GET /api/health`, `Create Nest App`).
- **Code** :
  - `sentryBeforeSendTransaction` ne parcourt que les champs sérialisés. Le test sur `sdkProcessingMetadata` circulaire couvre le `RangeError` trouvé en GREEN.
  - Les exports `SerializedRequest` et `Meeting` sont retirés.
  - Le maintien de l'export `IcsFeed`, type du paramètre d'une fonction exportée, est accepté.
  - Le README décrit maintenant le masquage et la contrainte des transactions.

**Risque résiduel** (advisory, § 8) :

- réversibilité : profil absent ; monitoring : Sentry ;
- **critère d'écart des transactions** : il s'appuie sur la forme des URL (chemin du flux, ou jeton suivi de `.ics`). Une montée de version de `@sentry/nestjs` qui ajouterait un champ d'URL hors des clés listées (`TRACE_URL_KEYS`, `request`, `spans[].data`) ne serait pas couverte. Rejouer la preuve avec collecteur à chaque montée majeure de Sentry ;
- **non couvert par les gates** : l'acceptation d'un `VCALENDAR` vide par Apple et Google (à confirmer au test réel), et le journal d'accès de Traefik, hors de notre contrôle (ADR-0028).

**Points à corriger** : aucun.

### Front

Revue du 2026-10-15, `ng-portfolio-app`, branche `feat/026-abonnement-agenda` (`b6c806c`, tranches F1-F4),
`git diff origin/master...HEAD`. API de référence : `nest-portfolio-app` `origin/master` `99f5e6a` (#59).

**Verdict** : APPROVED
**Gates CI locaux** : install ✅ (`pnpm install --frozen-lockfile` → 0) / tests ✅ (`pnpm test` → 0, 4852 passed / 4852, 257 suites) / lint ✅ (`pnpm lint` → 0, « All files pass linting ») / format ✅ (`pnpm run format:check` → 0) / build ✅ (`pnpm run build --configuration production` → 0, CSP durcie sur 10 pages) / image ✅ (`docker build -t ng-portfolio-app:review .` → 0) / a11y ✅ (`ci/a11y-stack.sh up ng-portfolio-app:review && pnpm a11y` → 0, 91 passed / 91 ; `pnpm run a11y:typecheck` → 0)
**Checks mécaniques** : checker non vendoré (`.claude/checks/` absent) : auto-checks joués à la main sur les lignes ajoutées : archéologie 0 hit (motif du profil), `export default` 0, `effect(` 0, `fakeAsync`/`waitForAsync`/`flushMicrotasks` 0, `innerHTML`/`bypassSecurity`/`console.`/`debugger` 0, écriture en storage 0 ; 5 commentaires d'une ligne, tous des WHY intemporels
**Warnings de gate** : aucun (sortie de test sans `stderr` ni rejet non géré, build et lint sans avertissement)
**Rendu compilé** : N/A (aucun fichier `shared/ui/**` touché hors `testing/`, aucune nouvelle page ; la section est vérifiée au runtime ci-dessous)
**Preuve de verify runtime** : ✅ (rejouée sur l'image `review`, cf. ci-dessous)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅ (profil `aucun` ; presse-papiers par `navigator.clipboard` dans une fonction partagée, sans plateforme native)
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

**Verify runtime** (image `ng-portfolio-app:review` devant la doublure `STUB_ADMIN_SESSION=1`, script Playwright jetable, indice `auth:session` posé, `api.nedellec-julien.fr` rejoué sur la doublure comme dans le harnais a11y ; 1280 px clair et 375 px sombre) :

- `/admin/rendez-vous` : champ = `https://api.nedellec-julien.fr/api/booking/feed/stubFeedToken000…000.ics`, lien `webcal://api.nedellec-julien.fr/api/booking/feed/stubFeedToken000…000.ics` (pas de préfixe `unsafe:` : le sanitizer laisse passer `webcal:`), « Lien créé le jeudi 15 octobre 2026 à 10:32. », bouton « Régénérer le lien » ; aucun défilement horizontal.
- Copier : presse-papiers mis à `avant`, focus sur « Copier le lien » + Entrée → presse-papiers = l'URL https du champ (pas le `webcal://`), toast « Lien copié dans le presse-papiers », focus resté sur le bouton.
- Régénérer : focus + Entrée → confirmation (titre, corps, « Garder le lien actuel » focalisé, « Régénérer le lien ») ; confirmé → un `POST /api/booking/feed-subscription`, champ et `webcal://` sur `stubFeedRegenerated…`, toast de régénération, focus rendu au bouton d'action.
- Après les deux scénarios : `localStorage` = thème + indice de session seulement, `sessionStorage` vide, `caches.keys()` vide, aucun service worker.
- Console : aucune erreur JS ni avertissement Angular ; une seule entrée, `404 /api/config` sur l'origine du site, préexistante (la doublure n'a pas cette route, même constat en F2/F3).
- Verdict : **PASS**. Captures (scratchpad de la revue) : `desktop-light-active`, `desktop-light-confirm`, `desktop-light-regenerated`, `mobile-dark-active`, `mobile-dark-confirm`, `mobile-dark-regenerated`.

**Vérifié conforme** :

- **Contrat = API réelle** (`origin/master` de l'API) : `@Controller('booking')` + `JwtAuthGuard` de classe, `GET`/`POST feed-subscription` avec `Cache-Control: no-store` ; union `unconfigured | none | active { token, createdAt }` = `BookingFeedSubscriptionDto` ; `POST` à corps `null` ; `409` `ConflictException({ error: 'feed_not_configured' })`, relu par `apiErrorCode` sur `body.error` → `not-configured`, les autres `409` inchangés (`day_in_closure`, `too-late`). Les deux appels passent par `silentErrors()`.
- **URL du flux** : base `API_LINK_BASE_URL` (prod `https://api.nedellec-julien.fr/api`, dev `/api`) résolue contre `DOCUMENT.location.href` à chaque réponse, jeton par `encodeURIComponent`. Elle est absolue dans les deux cas et pointe sur l'hôte qui sert `GET /api/booking/feed/:file`. `toWebcalUrl` ne remplace que le préfixe `^https?:`.
- **Sécurité, aucun stockage ni fuite côté navigateur** :
  - aucun storage (test Vitest et runtime) ;
  - pas de transfer cache : `admin/**` est en `RenderMode.Client` ;
  - pas de cache HTTP : `no-store` côté API ;
  - aucun `console.*` ;
  - Sentry front : pas de Replay, `dataCollection.httpBodies: []` (le corps qui porte le jeton n'est jamais capturé), et les breadcrumbs/spans ne voient que l'URL `feed-subscription`, qui ne contient pas de jeton ; le breadcrumb `ui.click` relève un sélecteur, pas un `href` ;
  - analytics : `outboundChannel('webcal://api.nedellec-julien.fr/…')` rend `null` (`api` est exclu des démos), et seul le chemin du routeur serait envoyé, jamais le `href`.
- **Architecture** : `FeedSubscriptionPanel` est une facade `@Injectable()` instance-scopée dans `providers` de `AdminBookings`, sans suffixe `Store`, sans dépendance DOM ; signaux exposés en lecture seule (`computed`, `asReadonly()`), aucune `effect()`. `toBookingFeedView` est pur. `AdminBookingFeed` est présentationnel (`input`/`output`, seul état local la confirmation), et le sélecteur attribut `section[app-admin-booking-feed]` porte `aria-labelledby` sur le host, sans wrapper.
- **Focus** : le bouton d'action unique vit hors du `@switch`, sous un `@if` stable, et survit à `none` → `active` (test et runtime). `aria-disabled="true"` pendant l'appel, jamais `disabled`, activation ignorée. Après un `409` → `unconfigured`, `afterRenderEffect({ write })` focalise le `h2` sans lecture de layout, et ne vole pas le focus si la page s'ouvre déjà en `unconfigured`.
- **Presse-papiers** : `writeToClipboard` est déplacée à l'identique dans `shared/clipboard/`, `code-copy.ts` l'importe et `code-copy.spec.ts` n'est pas modifié (vert). La facade passe par `PendingTasks.run` et copie l'URL https.
- **Conventions** : signals, `input`/`output`, `viewChild.required`, control flow `@switch`/`@if`/`@let`, aucun `styles:`, Tailwind et tokens existants seulement (`status-warn`, `line`, `surface`, `muted`), `appButton` pour le bouton et le lien, textes de toast avec insécable avant les deux-points (6/6). `admin-bookings.ts` fait 205 lignes, `admin-booking-feed.ts` 204 lignes, dont environ 130 de template (sous les seuils).
- **Tests** : les adaptations déclarées sont mécaniques (`cancellationDialog(host)`, paramètre `root` facultatif d'`answerConfirmDialog`, repère a11y recalé), et aucune valeur attendue n'a bougé. Fixtures par builders (`aBookingFeedSubscription`, `aBookingFeedSubscriptionDto`). `it.each` pour la triangulation, et `data-testid` comme seuls sélecteurs.
- **Doublure et axe** : `feed-subscription` est routé avant le 405, sans état. Cinq scénarios × deux thèmes : lien affiché, dialogue, lien régénéré avec son toast, toast de copie avec relecture du presse-papiers, `unconfigured` servi par `page.route`. Le toast reste visible après l'analyse, donc il est bien audité.

**Tests notables** :

- ✨ `admin-bookings.spec.ts` (création depuis `none`) : on vérifie que c'est le même élément qui garde le focus après la réponse, ce qui attrape un bouton recréé dans une branche du `@switch`.
- ✨ `feed-subscription-panel.spec.ts` (gardes de `copyLink`) : écrites en « rien, puis copie dès que le lien existe », elles tuent aussi bien une garde trop large qu'une garde absente.
- ⚠️ `booking-feed-view.spec.ts` + `feed-subscription-panel.spec.ts` + `admin-bookings.spec.ts` : la vue `active` est assertée à trois niveaux. C'est voulu par le plan (pur, facade, page) mais coûteux au refacto. Informatif.

**Remarques non bloquantes** (à traiter dans la PR ou au test réel, au choix de l'orchestrateur) :

1. **Texte, aide iPhone** (`admin-booking-feed.ts:242-245`, texte du plan repris mot pour mot) : « Choisissez une mise à jour toutes les 15 minutes ». À ma connaissance, l'ajout d'un calendrier avec abonnement dans l'app Calendrier d'iOS (Calendriers › Ajouter un calendrier › Ajouter un calendrier avec abonnement, puis « S'abonner » depuis un lien `webcal://`) propose nom, couleur, compte, alertes et pièces jointes, mais **pas de fréquence**. Ce réglage existe par calendrier dans Calendrier sur Mac ; sur iPhone, la fréquence est globale (Réglages › Calendrier › Comptes › Récupérer les données). Je n'ai pas d'appareil pour le confirmer : à vérifier au test réel du propriétaire, puis reformuler si besoin, par exemple « La mise à jour suit le réglage Récupérer les données de l'iPhone ; le lien demande 15 minutes ». Les menus Google (« Autres agendas › + › À partir de l'URL ») et le parcours iOS (Calendriers › Ajouter un calendrier › Ajouter un calendrier avec abonnement) correspondent aux libellés français connus.
2. **Spec, Journal des tranches** (ligne « Tranche F4 ») : elle a été insérée au milieu de l'entrée F3, entre « refactor : » et « aucun (passe manuelle… ». L'entrée F3 est coupée en deux. Remettre F4 après la fin de F3.
3. **Visuel, `admin-booking-feed.ts:217`** : en `aria-disabled`, le bouton `outlined` garde son survol (bordure et texte primaires). Le précédent `admin-messages.ts:48` le neutralise (`aria-disabled:hover:border-foreground/15 aria-disabled:hover:text-foreground`). Cosmétique, sur un état de quelques centaines de millisecondes.
4. **Export, `booking-feed-view.ts:31`** : `toWebcalUrl` n'a que son spec comme consommateur hors du fichier. L'export est prescrit par le plan (pur testé seul) : accepté, à inliner si le plan est révisé.

**Risque résiduel** (advisory, § 8) :

- réversibilité : profil absent ; monitoring : Sentry (front) ;
- aucun état persistant touché côté front ; le lien n'est jamais écrit dans le navigateur ;
- non couvert par les gates : l'abonnement réel sur iPhone et Google Agenda (aide, `VCALENDAR` vide, délai Google), et le comportement du lien `webcal://` hors Apple (Windows, Android : sans gestionnaire, le clic ne fait rien ; l'aide oriente vers le copier-coller).
