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
