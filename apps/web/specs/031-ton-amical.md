---
id: 031
title: Un ton plus amical, au tutoiement
type: refactor
status: draft
created: 2026-10-21
related: [PRODUCT.md, specs/029-repositionnement-portfolio-passion.md, specs/030-adr-en-articles.md, src/app/editorial-identity.spec.ts]
---

# 031 — Un ton plus amical, au tutoiement

## Description

### Objectif

Demande du propriétaire (2026-10-21) : le développement web devient **entièrement un loisir**. Le
site doit le dire par son ton : moins professionnel, plus amical, au **tutoiement**. C'est la suite
de la spec 029, qui a retiré l'activité commerciale mais gardé une voix sobre de portfolio.

### Arbitrages (2026-10-21)

1. **Le ton des textes seulement.** L'identité visuelle (registres Console et Ivoire, typographie
   « plan d'atelier », cartouche, cotes, `DESIGN.md`) ne change pas.
2. **Tutoiement** du lecteur sur les pages publiques.
3. **Les brouillons A1 à A4** de la spec 030 sont réécrits dans le nouveau ton **avant** leur
   publication, sans toucher aux faits vérifiés.

### Exigences

1. **`PRODUCT.md`** : la section « Voix » est réécrite (tutoiement, ton détendu et personnel, humour
   léger permis, toujours précis et vérifiable ; « aucun em-dash » et « aucune preuve inventée »
   restent). Les sections « Users », « Brand Personality » et « Anti-references » sont relues pour
   un site de loisir, sans le public recruteur (arbitrage complémentaire 1).
2. **Textes publics du front** au tutoiement et dans le nouveau ton : accueil, à propos, liste du
   blog, réalisations et fiches, pied de page, 404, formulaire de contact, messages d'erreur et de
   confirmation, titres et descriptions des pages (`<title>`, meta, Open Graph, `index.html`).
3. **Contenu en base** relu dans le même ton : parcours (`profile_content`), descriptions des
   projets. Modifié par l'admin, avec l'accord du propriétaire sur chaque texte.
4. **E-mails envoyés par l'API** au visiteur (confirmation du formulaire de contact) : même ton,
   au tutoiement (arbitrage complémentaire 3). PR API.
5. **Brouillons A1 à A4** (`docs/articles/`) réécrits : même structure, mêmes faits, mêmes extraits
   de code ; seuls le ton et l'adresse au lecteur changent. Le front-matter `faits-verifies` ne
   bouge pas.
6. **Verrou éditorial** (`src/app/editorial-identity.spec.ts`) : une règle empêche le retour du
   vouvoiement dans les sources éditoriales publiques, pages légales comprises (arbitrage
   complémentaire 2).
7. **Aucune régression** : AXE à zéro violation, noms accessibles toujours distincts (un libellé
   reformulé reste unique), tests mis à jour sur les nouveaux textes.

### Constat (2026-10-21, `master` `2e55a1a`)

- `PRODUCT.md`, « Voix » : « directe, en français, phrases courtes […] Aucun superlatif. Aucun
  em-dash. » Le second public déclaré reste le recruteur ou tech lead.
- Vouvoiement dans les sources publiques (hors admin et authentification) : `privacy-policy.ts`
  (10 lignes), `contact-form.ts` (5), `http-contact.gateway.ts` (3, messages d'erreur et de
  confirmation), `page-not-found.ts`, et les messages « Vérifiez votre connexion » de
  `blog-list.ts`, `projects.ts` et `project-detail.ts`.
- Textes éditoriaux du front : `features/home/infra/data/home.static-data.ts`,
  `features/home/domain/home-hero.static-data.ts`, `shared/identity/site-identity.static-data.ts`,
  `layout/components/footer/footer.static-data.ts`, les fichiers `*-copy.ts` (blog, projets), les
  titres et descriptions posés par les pages.
- L'admin et l'authentification vouvoient leur seul utilisateur, le propriétaire : hors périmètre
  par défaut.

### Découpage en PR

| # | Dépôt | Périmètre | Dépend de |
|---|---|---|---|
| 1 | front | cette spec, `PRODUCT.md` (voix et publics) | — |
| 2 | front | textes publics du front, titres et descriptions, verrou éditorial | 1 |
| 3 | — | contenu en base (parcours, projets) par l'admin, texte par texte | 1 |
| 4 | API | e-mail de confirmation du contact au tutoiement | 1 |
| 5 | front | brouillons A1 à A4 réécrits | 1 |

Les PR 2 à 5 sont indépendantes entre elles.

### Hors périmètre

- Identité visuelle, `DESIGN.md`.
- Admin et authentification (vues du seul propriétaire).
- Articles déjà publiés : relus au cas par cas plus tard, pas réécrits ici.

### Arbitrages complémentaires (2026-10-21)

1. **Publics** : le site ne vise plus le recruteur. `PRODUCT.md` déclare les développeurs et les
   curieux du métier ; le CV et le parcours restent en ligne, sans viser un recrutement.
2. **Pages légales** : tutoiement aussi. Le fond juridique (droits, CNIL, bases légales) ne change
   pas ; aucune exception au vouvoiement dans le verrou éditorial.
3. **E-mail de confirmation** du formulaire de contact : passé au tutoiement par une PR API
   (PR 4 du découpage).

## Plan technique — PR 2 (textes publics du front, `PRODUCT.md`, verrou)

Rédigé par l'orchestrateur : la PR est surtout éditoriale ; la seule décision technique est
l'extension du verrou (§ Verrou). Une PR, deux tranches TDD.

### `PRODUCT.md` (fait dans la PR, hors TDD)

- **Users** : le site est le coin personnel de Julien, tourneur CN dans l'aéronautique, qui code
  pour le plaisir. Public principal : le développeur qui arrive par une recherche sur un problème
  précis. Public secondaire : le curieux (du parcours de l'atelier au code, du métier de tourneur).
  Plus de public recruteur ; le CV reste une pièce du parcours.
- **Voix** : amicale et directe, au tutoiement, en « je ». Humour léger bienvenu, jamais au
  détriment de la précision. Aucun superlatif, aucun em-dash, aucune preuve inventée.
- **Anti-references** : ajout du ton corporate (« nous », formules de plaquette, vouvoiement
  distant).

### Table des textes (tranche 1)

| Où | Avant | Après |
|---|---|---|
| `SITE_IDENTITY.journey` | Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025. | Chaudronnier, puis tourneur CN de haute précision dans l'aéronautique (c'est toujours mon métier), je suis aussi développeur web full-stack, par passion, depuis 2025. |
| `STATIC_HERO.lead` (après `journey`) | J'écris ici sur ce que je construis avec Angular, NestJS et PostgreSQL, et sur l'auto-hébergement : le code, les choix et leurs compromis. | Ici, je raconte ce que je construis avec Angular, NestJS et PostgreSQL, et comment je l'héberge chez moi : le code, les choix, et les erreurs en chemin. |
| `FOOTER_COPY.tagline` | Tourneur CN le jour, développeur web le reste du temps. Angular, NestJS et auto-hébergement. | Tourneur CN le jour, développeur web le reste du temps. Angular, NestJS et auto-hébergement, pour le plaisir. |
| `FOOTER_COPY.contactCta`, lien « Me contacter » de `about-motivation.ts` | Me contacter | M'écrire |
| Description de `''` (route et `index.html`) | Tourneur CN dans l'aéronautique et développeur web full-stack Angular / NestJS. Articles techniques, projets en production et code auto-hébergé. | Tourneur CN dans l'aéronautique et développeur web par passion. Des articles sur Angular, NestJS et l'auto-hébergement, des projets qui tournent vraiment, et le code qui va avec. |
| `ABOUT_TITLE` | Développeur full-stack Angular / NestJS, parcours et CV \| Julien Nédellec | Parcours : de l'atelier au code \| Julien Nédellec |
| Description de `about` | `${journey}` Stack et CV. | `${journey}` Ma stack, mon parcours et mon CV. |
| `PROJECTS_TITLE` | Réalisations Angular et NestJS en production \| Julien Nédellec | Mes projets Angular et NestJS \| Julien Nédellec |
| Description de `projects` | Applications Angular et NestJS en production, sites de démonstration et scripts : le besoin réglé et les choix techniques de chaque projet. | Les applications Angular et NestJS que j'utilise vraiment, des démos et quelques scripts : pour chacun, le problème de départ et les choix techniques. |
| Description de `blog` | Retours d'expérience réels sur Angular, NestJS, PostgreSQL et le déploiement self-hosted. | Ce que j'apprends en construisant mes projets : Angular, NestJS, PostgreSQL et l'auto-hébergement, erreurs comprises. |
| Description de `confidentialite` | … suivi des erreurs, vos droits. | … suivi des erreurs, et tes droits. |
| Introduction de `/blog` | Retours d'expérience concrets sur mes projets, mon parcours et la façon dont je les construis. | Ce que j'apprends en construisant mes projets, mon parcours, et la façon dont je m'y prends. |
| Erreur de chargement (blog, projets, fiche projet) | … Vérifiez votre connexion, puis réessayez. | … Vérifie ta connexion, puis réessaie. |
| 404 | Oups ! La page que vous cherchez n'existe pas ou a été déplacée. Retournez à l'accueil ou explorez d'autres sections du site. | Oups ! La page que tu cherches n'existe pas ou a été déplacée. Retourne à l'accueil ou fais un tour dans les autres sections du site. |
| Contact, titre | Écrivez-moi. | Écris-moi. |
| Contact, légende (`sr-only`) | Informations personnelles | Tes coordonnées |
| Contact, libellé du nom | Nom complet | Ton nom |
| Contact, placeholders | Votre nom · votre@email.com · Objet de votre message · Votre message, votre question ou votre remarque… | Ton nom · toi@exemple.fr · De quoi veux-tu parler ? · Ta question, ta remarque, ou juste un bonjour… |
| Contact, mention | Vos nom, e-mail et message servent uniquement à vous répondre. | Ton nom, ton e-mail et ton message servent seulement à te répondre. |
| Contact, réseau (statut 0) | Connexion impossible. Vérifiez votre réseau, puis réessayez dans un instant. | Connexion impossible. Vérifie ton réseau, puis réessaie dans un instant. |
| Contact, 400 | Certains champs sont invalides. Vérifiez votre saisie et réessayez. | Certains champs ne vont pas. Vérifie ta saisie et réessaie. |
| Contact, 429 | Trop de tentatives en peu de temps. Patientez une minute avant de réessayer. | Trop d'essais en peu de temps. Attends une minute avant de réessayer. |
| Contact, 5xx | Le serveur rencontre un souci temporaire. Réessayez dans quelques minutes. | Le serveur a un souci passager. Réessaie dans quelques minutes. |
| Contact, autre erreur | Une erreur inattendue est survenue lors de l'envoi. Réessayez ou contactez-moi par email. | Quelque chose a coincé pendant l'envoi. Réessaie, ou écris-moi par e-mail. |
| Contact, succès | Votre message a bien été envoyé. Je reviens vers vous rapidement. | Message bien reçu, merci ! Je te réponds dès que je peux. |
| `PROJECT_ARTICLES_COPY.summary` | Les articles du blog qui en racontent la conception. | Les articles où je raconte comment je l'ai construit. |
| Politique de confidentialité, mentions légales | vouvoiement | tutoiement, fond juridique inchangé (bases légales, durées, droits, CNIL) |

Textes inchangés car neutres : libellés de navigation et de filtres, natures de projet, « Lire le
blog », « Voir les réalisations », « Pour aller plus loin », « Articles sur ce projet », fiche
technique de l'accueil, `HOME_TITLE`, `BLOG_TITLE`.

### Verrou (tranche 2)

- Règle « pas de vouvoiement » dans `editorial-identity.spec.ts` : pronoms (`vous`, `votre`,
  `vos`, `vôtre`) et impératifs en *-ez* d'une liste fermée (`Réessayez`, `Vérifiez`, `Patientez`,
  `Retournez`, `Écrivez`, `Contactez`, `Explorez`) ; liste fermée plutôt qu'un motif `\w+ez\b`, qui
  attraperait « chez » ou « assez ».
- Portée : `EDITORIAL_SOURCES` existantes **plus** les gabarits des pages et composants publics
  (contact, 404, mentions légales, confidentialité, liste du blog, réalisations, fiche projet) et
  `src/index.html`, lus comme texte. Le mécanisme de lecture (import `?raw` ou lecture de fichier
  dans le test) est au choix de `qa`, dans le respect du runner Vitest du projet.
- Admin et authentification hors portée.

### Tranches

- **Tranche 1 — les textes publics passent au tutoiement** : `qa` aligne les assertions existantes
  sur la table (RED : les tests attendent les nouveaux textes) ; `angular-expert` applique la table.
- **Tranche 2 — le vouvoiement ne revient plus** : `qa` écrit la règle du verrou (RED sur les
  sources qui vouvoient encore, en particulier les pages légales si la tranche 1 ne les a pas
  traitées) ; `angular-expert` passe les pages légales au tutoiement.

Gates : `pnpm test` (lire `$?`), `pnpm lint`, build de production, audit a11y (noms accessibles
toujours distincts).
