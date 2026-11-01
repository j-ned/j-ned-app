# ADR-0027 — Calendrier des disponibilités : jour résolu par le serveur, exceptions en état souhaité, fériés calculés

- **Statut** : obsolète (2026-10-20, calendrier des disponibilités retiré par `specs/029-repositionnement-portfolio-passion.md`) ;
  historique : proposé (2026-10-14), appliqué par la spec 025
- **Date** : 2026-10-14
- **Contexte spec** : `specs/archive/025-calendrier-des-disponibilites.md`
- **Portée** : API `nest-portfolio-app` (module `src/booking/`) et front (`features/admin`, `features/booking`)
- **Étend** : ADR-0026 (§2 règles à l'heure de Paris, §3 le serveur seul calcule les créneaux)

## Context

Le propriétaire veut fermer ou rouvrir un jour d'un clic dans un calendrier du mois, fermer les jours
fériés par défaut et en rouvrir un au cas par cas (spec 025, arbitrages 2 à 5). L'exigence 2 fixe un
ordre de priorité à six niveaux : passé, fermeture par période, exception « fermé », exception
« ouvert », férié si l'interrupteur est actif, semaine type.

Faits vérifiés le 2026-10-14 :

1. `computeFreeSlots` (API) est pur et ne connaît que plages hebdomadaires, fermetures par période et
   rendez-vous. Il parcourt les dates de Paris de la fenêtre et décide seul si un jour est ouvert.
2. Le calendrier de l'admin doit afficher l'état **résolu** de chaque jour. Si le front calculait cet
   état, il recopierait l'ordre de priorité et la liste des fériés : deux implémentations de la même
   règle, contraire à l'exigence 2 de la spec 024 (« le front n'en recopie pas les règles »).
3. Une exception « ouvert » n'a de sens que sur un jour que le férié fermerait. Stockée sans
   discipline, une table d'exceptions accumule des lignes sans effet (« ouvert » un mardi ordinaire),
   et le front devrait connaître le férié pour savoir quoi écrire.
4. Les jours fériés de métropole (Code du travail, art. L3133-1) sont 8 dates fixes et 3 dates
   mobiles dérivées de Pâques (lundi de Pâques +1, Ascension +39, lundi de Pentecôte +50).
   L'algorithme grégorien anonyme (Meeus/Jones/Butcher) donne Pâques en arithmétique entière ; contrôlé
   sous Node le 2026-10-14 contre les dates publiées : 2008-03-23, 2019-04-21, 2026-04-05,
   2027-03-28, 2028-04-16, 2029-04-01, 2030-04-21, 2038-04-25 (plus tardive du siècle),
   2285-03-22 (plus précoce possible).
5. L'API n'a aucune bibliothèque de dates (ADR-0026) ; les fériés publiés par l'État existent en API
   ouverte (`calendrier.api.gouv.fr`), mais l'API du portfolio ne dépend aujourd'hui d'aucun service
   tiers à l'exécution pour calculer un créneau.

## Decision

1. **Une seule fonction pure décide si un jour est fermé**, côté API :
   `closedReason(date, ctx): 'past' | 'closed-period' | 'closed' | 'holiday' | null`, dans l'ordre
   de l'exigence 2 ; `null` signifie « créneaux de la semaine type ». `computeFreeSlots` et le
   calendrier de l'admin l'appellent tous les deux, et les créneaux d'un jour viennent d'une seule
   fonction `templateSlotsOn(date, rules)` extraite de `computeFreeSlots`. Le nombre de créneaux
   affiché par le calendrier est donc exactement celui que le calcul public proposerait ce jour-là
   (hors préavis, horizon et rendez-vous), changements d'heure compris.
2. **Le serveur rend le calendrier résolu.** `GET /api/booking/availability/calendar?month=YYYY-MM`
   rend l'état de chaque jour du mois (`past | closed-period | closed | holiday | open | empty`), le
   nom du férié, le nombre de créneaux de la semaine type et les bornes de navigation. Le front
   n'applique aucune règle de priorité et ne connaît pas les fériés.
3. **Exception par date stockée en écart à la règle, écrite en état souhaité.** Table
   `availability_override (day date primary key, kind 'open' | 'closed')`. Le front écrit l'état
   voulu (`PUT availability/days/:date { open }`) ; le serveur compare à l'état qu'aurait le jour sans
   exception (férié fermé si l'interrupteur est actif, ouvert sinon) : égal, il supprime l'exception ;
   différent, il l'insère ou la remplace. Aucune ligne sans effet n'est créée ; une ligne devenue sans
   effet après un changement de l'interrupteur est gardée (décision explicite du propriétaire, qui
   reprend effet si l'interrupteur revient). Un jour passé (422) ou couvert par une fermeture par
   période (409) est refusé.
4. **Réglage `close_public_holidays` dans une table singleton `booking_setting`** (`id = 'main'`,
   contrôle `check`), sur le modèle de `profile_content` (ADR-0023). Pas de ligne amorcée par
   migration : la lecture rend la constante `DEFAULT_CLOSE_PUBLIC_HOLIDAYS` (vrai) tant que la ligne
   n'existe pas, et la même constante sert de `default` à la colonne ; l'écriture est un upsert.
5. **Fériés calculés par l'API, sans dépendance** : `frenchPublicHolidays(year)` (8 fixes + 3 mobiles
   de L3133-1) et `easterSunday(year)` (Meeus/Jones/Butcher), testés de 2026 à 2030 et aux bornes du
   calcul de Pâques. Dates en `YYYY-MM-DD`, aucune méthode locale de `Date`.
6. **Écritures du calendrier non optimistes.** Le front marque le jour « en cours », attend la
   réponse, remplace la cellule par le jour résolu que rend le serveur. Prédire l'état suivant
   obligerait le front à connaître la priorité (point 2).

## Consequences

- Une seule implémentation de la priorité, testée une fois en pur ; la page publique et l'admin ne
  peuvent pas diverger.
- La table d'exceptions ne contient que des écarts effectifs au moment de l'écriture ; sa taille est
  bornée par les clics du propriétaire.
- Le réglage par défaut ferme les fériés dès le déploiement : un férié de la fenêtre de 21 jours
  disparaît de `/rendez-vous` sans action (voulu, arbitrage 4).
- Les fériés d'Alsace-Moselle et d'outre-mer restent hors périmètre ; les ajouter serait une liste de
  plus dans `frenchPublicHolidays`, sans changement de modèle.
- Une décision législative (nouveau férié, suppression du lundi de Pentecôte) demande une évolution de
  code, pas une donnée : risque accepté, la liste n'a pas changé depuis 2004 (journée de solidarité,
  qui n'a pas retiré le lundi de Pentecôte de L3133-1).
- Chaque clic du calendrier fait un aller-retour visible (état « en cours ») ; acceptable pour un
  écran d'administration à un seul utilisateur.

## Alternatives considered

- **Calcul de l'état du jour côté front** (le front reçoit règles, exceptions, fériés et résout) :
  duplique la priorité et la liste des fériés dans deux langages. Rejeté (point 2 du contexte).
- **Exceptions en commandes brutes** (`POST` « fermer », `DELETE` « supprimer l'exception ») : le
  front devrait savoir si le jour est férié pour choisir entre « supprimer l'exception » et « créer
  une exception ouvert ». Rejeté au profit de l'état souhaité, idempotent.
- **Exceptions dans `availability_closure`** (fermeture d'un jour = période d'un jour) : ne sait pas
  exprimer « ouvert » (réouverture d'un férié) et mélange les congés saisis avec un motif et les clics
  du calendrier. Rejeté.
- **Colonne `close_public_holidays` sur une table existante** : aucune table de réglages n'existe,
  `availability_rule` porte plusieurs lignes. Rejeté.
- **API `calendrier.api.gouv.fr` ou bibliothèque de fériés** (`@socialgouv/jours-feries`,
  `date-holidays`) : ajoute un appel réseau ou une dépendance au calcul des créneaux pour onze dates
  dont trois se calculent en dix lignes. Rejeté.
- **Écritures optimistes** : imposent de recopier la priorité au front pour prédire l'état suivant.
  Rejeté (point 6).
