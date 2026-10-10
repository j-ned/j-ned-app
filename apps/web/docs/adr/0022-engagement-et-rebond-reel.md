# ADR-0022 — Engagement, rebond réel et « mesuré depuis »

- **Statut** : proposé (2026-10-10, spec 020)
- **Date** : 2026-10-10
- **Contexte spec** : `specs/020-mesure-honnete.md`

## Context

L'admin Audience appelle « rebond » toute visite d'une seule URL : un visiteur qui lit l'accueil
trois minutes puis appelle compte comme un départ immédiat. « Visiteurs » égale « sessions »
(empreinte d'un appareil sur une journée UTC). Les tables brutes sont purgées à 30 jours ; seuls des
totaux journaliers (`daily_stat`) survivent. Le propriétaire veut juger l'effet de la spec 019 sur
l'engagement.

## Decision

1. **Visite** = empreinte `ip|ua|jour UTC` (inchangé). L'admin l'appelle « visite », jamais
   « visiteur ».
2. **Visite engagée** si l'une des conditions tient : au moins deux pages distinctes (URL sans
   fragment) ; au moins un événement d'engagement ; temps visible cumulé ≥ 30 s (seuil validé par
   le propriétaire le 2026-10-10).
   Événements d'engagement : `cta_click`, `project_click`, `article_read`, `cv_download`,
   `contact_submit`, `outbound_click`, `section_view`. `article_view` et `page_duration` n'en sont
   pas (automatiques).
3. **Rebond réel** = visite non engagée ; **taux d'engagement** = 100 − taux de rebond réel. Une
   durée inconnue compte comme inférieure au seuil (le rebond réel majore, il ne minore jamais).
   Le « rebond » historique (une page) est conservé et renommé « Rebond (une page) ». L'admin
   affiche une seule tuile « Rebond réel », l'engagement en détail (arbitrage du 2026-10-10).
4. **« Mesuré depuis »** : les nouvelles colonnes journalières sont nullables ; `NULL` = jour non
   mesuré, exclu des numérateurs **et** des dénominateurs. Le rebond réel est mesurable sur tout jour
   encore présent en brut (rattrapage automatique par le cron) ; les conversions ne sont « mesurées »
   qu'à partir du premier jour où un événement `contact_submit|outbound_click|section_view` a été vu,
   pour ne jamais afficher un zéro qui n'a pas été mesuré.
5. Le calcul vit dans l'API (`summarizeSessions`, fonction pure) : une définition unique pour le
   cumul journalier et le temps réel ; le front formate.

## Consequences

- Le taux de rebond réel est toujours ≤ au rebond une page.
- Rupture de série au déploiement des événements v2 et du temps visible : la comparaison avant/après
  019 s'appuie sur la série stable (rebond une page, CTA, CV, pages par visite) ; le rebond réel des
  jours rattrapés est un repère surestimé.
- Changer le seuil ou la liste d'événements ne recalcule que les jours encore présents en brut.

## Alternatives considered

- **Seuil de 10 s** (défaut GA4) : comparable aux outils du marché, mais compte comme engagée une
  lecture du seul titre ; écarté par le propriétaire le 2026-10-10 au profit de 30 s.
- **Calcul côté front** à partir des listes brutes : impossible au-delà de 30 jours, et deux
  définitions divergeraient (cumul journalier vs écran).
- **Conversions à zéro par défaut** pour les jours passés : affiche des zéros non mesurés.
