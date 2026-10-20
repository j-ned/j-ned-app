# ADR-0026 — Rendez-vous : instants UTC, règles à l'heure de Paris, contrainte d'exclusion et créations sérialisées

- **Statut** : obsolète (2026-10-20, prise de rendez-vous retirée par `specs/029-repositionnement-portfolio-passion.md`) ;
  historique : proposé (2026-10-12), appliqué par la spec 024
- **Date** : 2026-10-12
- **Contexte spec** : `specs/archive/024-prise-de-rendez-vous.md`
- **Portée** : API `nest-portfolio-app` (module `src/booking/`) et front (feature `features/booking/`)
- **Préserve** : ADR-0024 (pages de contenu rendues à la requête, `/rendez-vous` reste un prérendu),
  ADR-0025 (audit axe des nouvelles pages)

## Context

Le propriétaire veut qu'un visiteur réserve lui-même l'appel de cadrage de 30 min, confirmé
immédiatement, sans double réservation possible (spec 024, Exigence 1 à 5).

Faits vérifiés le 2026-10-12 :

1. **L'ancien module `bookings` de l'API** (supprimé le 2026-05-21, `0c823b4`) stockait `date` +
   `start_time` en texte, sans contrainte : deux rendez-vous identiques passaient, et l'heure n'avait
   pas de fuseau.
2. **Coaching Life** (référence fonctionnelle) a le même défaut (audit F001). Sa branche non mergée
   `fix/f001-booking-server-validation` pose une contrainte `EXCLUDE USING gist (... WITH &&)` sur un
   `tsrange` d'heure murale, via une fonction SQL `IMMUTABLE` rendue nécessaire par le stockage texte,
   et un `paris-time.ts` à base d'`Intl`.
3. **L'API n'a aucune bibliothèque de dates.** Node 24 (image `node:24-alpine` de l'API) embarque ICU
   complet par défaut : `Intl.DateTimeFormat` avec `timeZone: 'Europe/Paris'` donne les heures justes
   des deux côtés des changements d'heure. Contrôle fait le 2026-10-12 sous Node local :
   `2026-10-25T00:30:00Z` et `2026-10-25T01:30:00Z` s'affichent tous deux « 02:30 » (heure ambiguë),
   `2027-03-28T00:30:00Z` s'affiche « 01:30 » et `2027-03-28T01:00:00Z` « 03:00 » (02:00 à 02:59
   n'existent pas). Le même contrôle est à rejouer dans l'image (tranche A1).
4. **PostgreSQL 17** (compose de l'API) indexe nativement les types range en GiST (`range_ops`).
   L'extension `btree_gist` n'est requise que pour mêler une égalité sur une colonne scalaire
   (`salle WITH =`) à un chevauchement ; ici, une seule ressource (le propriétaire), donc aucune
   extension. Le constructeur `tstzrange(timestamptz, timestamptz, text)` est immuable, donc
   utilisable dans l'expression de la contrainte, sans fonction intermédiaire.
5. **Une contrainte d'exclusion ne couvre que le chevauchement strict.** Le battement de 15 min et le
   plafond de 2 rendez-vous à venir par email sont des règles de politique : vérifiées en lecture
   puis écriture, deux requêtes concurrentes (10:00 et 10:30, ou trois réservations du même email)
   passeraient toutes les deux sous `READ COMMITTED`.
6. **Les URL sont journalisées** : le sérialiseur pino de l'API écrit `req.url` à chaque requête
   (`app.module.ts`), et le suivi d'audience du front envoie le chemin **avec sa query string**
   (`trackedPath` ne retire que le fragment). Un jeton d'annulation placé dans un chemin ou une
   query string finirait dans les logs de l'API et dans la base d'audience. Le corps `token` est
   déjà masqué par pino (`req.body.token`).
7. **nodemailer 10** (version de l'API) gère l'option `icalEvent` : le même contenu part en
   alternative `text/calendar; method=…` et en pièce jointe `invite.ics`, la forme que Gmail et
   Outlook reconnaissent comme invitation.

## Decision

1. **Instants UTC.** Un rendez-vous est stocké par `starts_at` et `ends_at` en `timestamptz`. L'API
   n'échange que des chaînes ISO 8601 UTC (`…Z`). Jamais de date ou d'heure en texte.
2. **Règles à l'heure de Paris, converties par `Intl`, sans bibliothèque.** Une plage hebdomadaire
   est `(weekday ISO 1-7, start_minute, end_minute)` en heure murale de Paris ; une fermeture est un
   intervalle de dates de Paris `[starts_on, ends_on]` inclusif. `paris-time.ts` convertit une heure
   murale en instant en essayant les deux décalages possibles de Paris (+01:00, +02:00) et en gardant
   ceux dont le formatage `Intl` redonne l'heure demandée :
   - aucun candidat (trou du passage à l'heure d'été) : l'heure n'est pas proposée ;
   - deux candidats (heure répétée du passage à l'heure d'hiver) : seul le plus tôt est proposé.
3. **Le serveur est la seule source des créneaux.** `GET /api/booking/slots` renvoie toute la fenêtre
   réservable (de maintenant + 24 h à maintenant + 21 jours), sans paramètre : le front n'a besoin de
   connaître ni l'horizon ni le préavis. Une création dont l'instant n'est pas dans ce calcul est
   refusée.
4. **Double réservation impossible en base** : contrainte posée par une migration écrite à la main
   (drizzle-kit ne sait pas exprimer `EXCLUDE`) :

   ```sql
   ALTER TABLE "booking" ADD CONSTRAINT "booking_no_overlap"
     EXCLUDE USING gist (tstzrange("starts_at", "ends_at", '[)') WITH &&)
     WHERE ("status" = 'confirmed');
   ```

   Plage semi-ouverte : un rendez-vous qui finit à 10:30 ne chevauche pas celui qui commence à 10:30.
   Partielle : un rendez-vous annulé libère son créneau. Une violation (SQLSTATE `23P01`) devient
   **409 `slot_taken`**.
5. **Créations sérialisées par un verrou consultatif de transaction.** La création ouvre une
   transaction, prend `pg_advisory_xact_lock(hashtext('booking:create'))`, recalcule les créneaux
   libres et le plafond par email à partir de lectures faites **sous le verrou**, puis insère. Le
   verrou se libère au commit ou au rollback. Le battement et le plafond deviennent sûrs sous
   concurrence ; la contrainte du point 4 reste la garantie de dernier recours contre toute écriture
   qui ne passerait pas par ce chemin. Codes : instant hors calcul mais en conflit avec un rendez-vous
   (battement compris) → 409 `slot_taken` ; instant hors calcul sans conflit → 422
   `slot_unavailable` ; plafond atteint → 422 `booking_limit_reached`.
6. **Politique en constantes** (`BOOKING_POLICY`, API) : créneau 30 min, départ toutes les 30 min,
   battement 15 min, préavis 24 h, horizon 21 jours, 2 rendez-vous à venir par email, rappel 24 h
   avant, conservation 6 mois. Pas de réglage dans l'admin (YAGNI, spec 024 Hors périmètre).
7. **Jeton d'annulation** : 32 octets aléatoires (`crypto.randomBytes`), encodés en base64url
   (43 caractères), envoyés seulement par email ; la base ne garde que l'empreinte SHA-256
   (`cancel_token_hash`, unique). Le lien porte le jeton **dans le fragment**
   (`/rendez-vous/annulation#<jeton>`) : un fragment n'est envoyé ni au serveur, ni dans le
   `Referer`, ni au suivi d'audience. Le front le transmet à l'API dans un **corps** `POST`
   (`bookings/cancel/preview`, `bookings/cancel`), masqué par pino. Conséquence assumée : le rappel
   de la veille ne peut pas contenir de lien d'annulation (le jeton en clair n'est plus connu) ; il
   renvoie à l'email de confirmation.
8. **Invitation `.ics` maison** (`to-ics.ts`, RFC 5545 : CRLF, repli à 75 octets UTF-8, échappement
   des TEXT, `DTSTART`/`DTEND` en UTC `Z` sans `VTIMEZONE`, `UID` = id du rendez-vous, `SEQUENCE` 0
   puis 1 à l'annulation, `METHOD:REQUEST` puis `METHOD:CANCEL`), transmise par l'option `icalEvent`
   de nodemailer exposée par `MailerService.sendMail`.

## Consequences

- Heures justes toute l'année, quel que soit le fuseau du processus (`TZ=UTC` des tests, ou
  `TZ=Pacific/Kiritimati` pour le prouver) et quel que soit le fuseau du visiteur, à qui le front
  affiche explicitement « heure de Paris ».
- Aucune dépendance ajoutée, ni dans l'API ni dans le front.
- Toutes les créations sont sérialisées : une seule à la fois en base. Sans effet mesurable au
  volume visé (quelques réservations par semaine) ; le verrou est pris dans la transaction, jamais
  au niveau session, donc aucun risque de verrou orphelin.
- Changer `BOOKING_POLICY` (durée, battement) se fait dans le code, sans migration : la contrainte ne
  dépend que de `starts_at`/`ends_at`.
- La contrainte n'est pas visible de drizzle-kit (absente des snapshots) : un futur `db:generate` ne
  la retire pas, mais un renommage de colonne devra la reprendre à la main.
- meet.jit.si exige que l'organisateur se connecte (Google, GitHub ou Facebook) pour ouvrir la salle :
  le propriétaire rejoint le lien avant le visiteur. `BOOKING_VIDEO_URL_BASE` permet de changer de
  fournisseur (Jitsi auto-hébergé) sans code.

## Alternatives considered

- **Bibliothèque de dates** (Luxon, date-fns-tz, `@js-joda/timezone`) : résout les mêmes cas avec une
  dépendance de plus, alors que trois fonctions `Intl` suffisent et sont testables sur les deux
  changements d'heure. Rejeté. `Temporal` est hors du runtime Node 24 de l'API ; à reconsidérer à la
  montée de version.
- **Date + heure de Paris en texte** (modèle de l'ancien module et de Coaching Life) : exige une
  fonction SQL d'heure murale pour la contrainte, rend l'heure répétée d'octobre ambiguë en base et
  oblige chaque lecteur à connaître le fuseau. Rejeté.
- **Vérification applicative seule** (lire puis insérer) : double réservation possible sous requêtes
  concurrentes, cas F001 de Coaching Life. Rejeté (Exigence 1).
- **Isolation `SERIALIZABLE`** à la place du verrou : protège aussi le battement et le plafond, mais
  renvoie des erreurs de sérialisation (`40001`) à rejouer côté service, plus difficiles à tester et à
  traduire en codes métier. Rejeté au profit d'un verrou explicite, plus lisible.
- **Contrainte élargie au demi-battement** (`tstzrange(starts_at - 7 min 30 s, ends_at + 7 min 30 s)`) :
  encode le battement en base, mais fige la politique dans une migration et laisse le plafond par
  email non protégé. Rejeté.
- **`SELECT … FOR UPDATE`** : ne verrouille rien quand le créneau est libre (aucune ligne à
  verrouiller), donc ne sérialise pas deux créations sur un créneau vide. Rejeté.
- **Jeton en clair en base, ou dans le chemin ou la query string du lien** : le premier expose tous
  les liens d'annulation en cas de fuite de la base ; le second les écrit dans les logs de l'API et
  dans la base d'audience (Context 6). Rejeté.
- **Paramètres `from`/`to` sur `GET slots`** : obligent le front à connaître l'horizon de 21 jours
  pour borner sa navigation, soit une règle recopiée (contraire à l'Exigence 2), pour un gain nul :
  la fenêtre entière pèse environ 20 Ko non compressés pour des plages de 9 h à 18 h en semaine
  (270 créneaux de 76 octets), 80 Ko au pire théorique (plages de 24 h tous les jours).
- **Synchronisation Google Agenda ou service tiers (Cal.com, Calendly)** : hors périmètre par
  arbitrage du propriétaire (spec 024).
