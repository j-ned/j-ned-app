---
id: 031
title: Un ton plus amical, au tutoiement
type: refactor
status: done
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
| `SITE_IDENTITY.journey` | Chaudronnier puis tourneur CN de haute précision dans l'aéronautique, mon métier aujourd'hui, je suis aussi développeur web full-stack depuis 2025. | Chaudronnier, puis tourneur CN dans l'aéronautique (toujours mon métier), je code aussi en full-stack, par passion, depuis 2025. |
| `STATIC_HERO.lead` (après `journey`) | J'écris ici sur ce que je construis avec Angular, NestJS et PostgreSQL, et sur l'auto-hébergement : le code, les choix et leurs compromis. | Ici, je raconte ce que je construis avec Angular, NestJS et PostgreSQL, et comment je l'héberge chez moi : le code, les choix, et les erreurs en chemin. |
| `FOOTER_COPY.tagline` | Tourneur CN le jour, développeur web le reste du temps. Angular, NestJS et auto-hébergement. | Tourneur CN le jour, développeur web le reste du temps. Angular, NestJS et auto-hébergement, pour le plaisir. |
| `FOOTER_COPY.contactCta`, lien « Me contacter » de `about-motivation.ts`, `ctaLabel` de `header.ts` | Me contacter | M'écrire |
| Description de `''` (route et `index.html`) | Tourneur CN dans l'aéronautique et développeur web full-stack Angular / NestJS. Articles techniques, projets en production et code auto-hébergé. | Tourneur CN dans l'aéronautique et développeur web par passion : Angular, NestJS, auto-hébergement, et des projets qui tournent vraiment. |
| `ABOUT_TITLE` | Développeur full-stack Angular / NestJS, parcours et CV \| Julien Nédellec | Parcours : de l'atelier au code \| Julien Nédellec |
| Description de `about` | `${journey}` Stack et CV. | `${journey}` Ma stack et mon CV. |
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
| Contact, exception à l'envoi (toast de `contact-form.ts`) | Une erreur inattendue est survenue. Réessayez ou contactez-moi par email. | Quelque chose a coincé pendant l'envoi. Réessaie, ou écris-moi par e-mail. |
| Contact, succès | Votre message a bien été envoyé. Je reviens vers vous rapidement. | Message bien reçu, merci ! Je te réponds dès que je peux. |
| `PROJECT_ARTICLES_COPY.summary` | Les articles du blog qui en racontent la conception. | Les articles où je raconte comment je l'ai construit. |
| Politique de confidentialité, mentions légales | vouvoiement | tutoiement, fond juridique inchangé (bases légales, durées, droits, CNIL) |

Arbitrage du 2026-10-21 (remonté par `qa`) : la borne de 160 caractères des descriptions de route
est conservée (règle SEO, extrait de recherche tronqué au-delà) ; `journey` et la description de
l'accueil sont raccourcis en conséquence (about : 148, accueil : 137). Espaces insécables : U+202F
avant `?` et `!`, U+00A0 avant `:` (`editorial-typography.spec.ts`).

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

## Plan de test

### Tranche 1 — les textes publics passent au tutoiement

Tests alignés sur la table (adapter avant d'ajouter) :

- `shared/identity/site-identity.static-data.spec.ts` : `SITE_IDENTITY.journey` égale la nouvelle phrase (128 caractères).
- `features/home/infra/data/home.static-data.spec.ts` : `STATIC_HERO.lead` = `${journey} Ici, je raconte … chez moi\u00a0: le code, les choix, et les erreurs en chemin.`
- `layout/components/footer/footer.spec.ts` : `tagline` (« …, pour le plaisir. »), `contactCta` « M'écrire », `trackCtaClick` reçoit `['footer_contact', "M'écrire"]`.
- `layout/components/header/header.spec.ts` : le bouton d'appel s'intitule « M'écrire » et le clic est mesuré sous `('header_contact', "M'écrire")` ; `describe('public recruteur')` renommé `describe('lien CV')`, assertions inchangées.
- `features/profile/pages/about/about.spec.ts` : ajout, la sortie `about-cta-contact` s'intitule « M'écrire ».
- `app.routes.home.spec.ts` : description de `''` = `Tourneur CN dans l'aéronautique et développeur web par passion\u00a0: Angular, NestJS, auto-hébergement, et des projets qui tournent vraiment.` (137) ; ajout, `meta[name=description]` et `meta[property=og:description]` de `src/index.html` égalent ce texte.
- `app.routes.about.spec.ts` : `ABOUT_TITLE` = `Parcours\u00a0: de l'atelier au code | Julien Nédellec` ; description = `${journey} Ma stack et mon CV.` (148).
- `app.routes.projects.spec.ts` : `PROJECTS_TITLE` = `Mes projets Angular et NestJS | Julien Nédellec` ; nouvelle description (`\u00a0:`).
- `app.routes.blog.spec.ts` : nouvelle description (`\u00a0:`).
- `app.routes.legal.spec.ts` (neuf) : description de `confidentialite` finit par « et tes droits. »
- `features/blog/pages/blog-list/blog-list.spec.ts` : introduction (`blog-intro`) et message d'erreur au nouveau texte.
- `features/projects/pages/projects/projects.spec.ts`, `…/project-detail/project-detail.spec.ts` : le test d'erreur asserte aussi le message (`… Vérifie ta connexion, puis réessaie.`).
- `pages/page-not-found.spec.ts` (neuf) : `[data-testid="not-found-message"]` = `Oups\u202f! La page que tu cherches … sections du site.`
- `features/contact/infra/gateways/http-contact.gateway.spec.ts` : succès (`merci\u202f!`), `it.each` 400/429/5xx/418 et statut 0 au nouveau texte.
- `features/contact/application/contact-form.spec.ts` : describe *Wording* (neuf) : section nommée « Écris-moi. » ; légende « Tes coordonnées » ; libellés distincts `['Ton nom (requis)', 'Email (requis)', 'Sujet (requis)', 'Message (requis)']` ; placeholders `['Ton nom', 'toi@exemple.fr', 'De quoi veux-tu parler\u202f?', 'Ta question, ta remarque, ou juste un bonjour…']` ; mention `contact-privacy-note`. Le test d'exception du gateway asserte le détail du toast : « Quelque chose a coincé pendant l'envoi. Réessaie, ou écris-moi par e-mail. »
- `features/projects/application/project-articles-copy.spec.ts` (neuf) : golden `toEqual` de `PROJECT_ARTICLES_COPY`.
- `shared/ui/load-error.spec.ts` : entrée de test au tutoiement, reste verte.

Dû au GREEN, hors textes : `data-testid="not-found-message"` (404) et `data-testid="contact-privacy-note"` (mention du formulaire) ; U+202F avant `?` et `!`, U+00A0 avant `:`.

Bornes de longueur tenues une fois la table appliquée : description de `''` 137 ≤ 160, de `about` 148 ≤ 160 et > `journey` (128).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le 2026-10-21 21:45, 36 failed / 4095 total), tous en `AssertionError` sur l'ancien texte, aucune erreur de harnais ; 17 fichiers en échec, tous touchés par cette tranche ; lint et format verts sur les fichiers modifiés.

```
Test Files  17 failed | 206 passed (223)
     Tests  36 failed | 4059 passed (4095)
EXIT=1
```

### Tranche 2 — le vouvoiement ne revient plus

Mécanisme : lecture disque dans le test (`readdirSync('src/app', { recursive: true })` +
`readFileSync`), comme `src/index.html` déjà lu par ce spec ; le builder `@angular/build:unit-test`
bundle par esbuild, sans `import.meta.glob`. Portée par motif, donc ouverte aux futurs fichiers :
`pages/`, `layout/`, `shared/`, `features/*` sauf `admin` et `auth`, fichiers `.ts` et `.html`,
hors `*.spec.ts` et dossiers `testing/` (174 fichiers lus). `core/` entre dans la portée (cf.
tranche 2bis) : l'intercepteur `error-toast.ts` est global et les gateways publics (contact, blog,
projets) n'utilisent pas `silentErrors()`, ses messages atteignent donc les visiteurs.

Motif : `vous`, `votre`, `vos`, `vôtre(s)` et les impératifs `réessayez`, `vérifiez`,
`patientez`, `retournez`, `écrivez`, `contactez`, `explorez`, plus `sélectionnez` (trouvé dans
`code-copy.ts`), insensible à la casse, bornes de mot Unicode, `rendez-vous` exclu.

Tests (`src/app/editorial-identity.spec.ts`, describe *the public site never says « vous »*) :

- `in %s` × `EDITORIAL_SOURCES` + `src/index.html` : liste `<chemin> line N: « mot »` égale `[]`.
- `in %s` × gabarits publics (174) : liste `line N: « mot »` égale `[]`, le fichier dans le nom du test.
- `reads the template of %s` (10) : pages légales, 404, formulaire et gateway de contact, liste du
  blog, réalisations, fiche projet, pied de page, `load-error` figurent dans la liste lue.
- `leaves %s out` (4) : aucun chemin admin, auth, `.spec.ts` ni `testing/` lu.
- `flags %s` (4) / `does not flag %s` (4) : discriminance du motif (majuscule initiale, `Écrivez`,
  plusieurs mots et numéro de ligne ; `chez`, `assez`, `Vosges`, `voûte`, `rendez-vous`, tutoiement).

Occurrences trouvées (dû au GREEN) :

- `src/app/pages/privacy-policy.ts` : lignes 27 votre, 28 vous, 63 vous ×2, 64 votre, 86 votre ×2,
  87 vous, 93 Vos, 95 Vous, 96 vous et écrivez, 98 Vous.
- `src/app/features/blog/application/components/code-copy.ts` : ligne 5 sélectionnez
  (« Copie impossible : sélectionnez le code. »).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le 2026-10-21 21:49, 2 failed / 4308 total), tous deux en `AssertionError` du nouveau verrou, aucune erreur de harnais ; les 4095 tests de la tranche 1 et antérieurs restent verts ; typecheck, lint et format verts.

```
FAIL  editorial-identity.spec.ts > the public site never says « vous » > in src/app/features/blog/application/components/code-copy.ts
AssertionError: expected [ 'line 5: « sélectionnez »' ] to deeply equal []
FAIL  editorial-identity.spec.ts > the public site never says « vous » > in src/app/pages/privacy-policy.ts
AssertionError: expected [ 'line 27: « votre »', …(12) ] to deeply equal []
 Test Files  1 failed | 222 passed (223)
      Tests  2 failed | 4306 passed (4308)
EXIT=1
```

Valeurs attendues alignées sur le tutoiement (`code-copy.spec.ts` : « sélectionne le code », `legal-pages.spec.ts` : `h2` « Tes droits ») : RED d'assertion confirmé via la commande test du profil le 2026-10-21 21:53, 6 failed / 4308 total (verrou 2, `code-copy.spec.ts` 3, `legal-pages.spec.ts` 1), tous en `AssertionError`.

### Tranche 2bis — corrective : revue code

Origine : `## Review code` (REJECTED, point bloquant 1, non bloquants 2 à 5) et `## Corrections de revue`.

Verrou (`src/app/editorial-identity.spec.ts`) :

- Portée élargie : `core/` ajouté à `PUBLIC_ROOT` ; `src/server/feeds/**` (`.ts` hors `*.spec.ts`)
  et `public/security.txt`, `public/.well-known/security.txt` lus aussi (`PUBLIC_FILES`).
- Motif : `veuillez`, `découvrez`, `consultez`, `cliquez`, `hésitez`, `lisez`, `téléchargez`
  ajoutés à la liste fermée. Pas de règle « nous » (faux positifs).
- `reads %s` : `core/interceptors/error-toast.ts`, `src/server/feeds/rss.ts` et les deux
  `security.txt` figurent dans la liste lue.
- `flags %s` : « veuillez patienter » → `line 1: « veuillez »` ; une phrase avec les six nouveaux
  impératifs (dont `n'hésitez`) → les six mots, dans l'ordre de la ligne.
- *the security policy speaks to the reader*, `in %s` × les deux `security.txt` : lignes `#`
  jointes = `Tu as trouvé une faille de sécurité ? Écris-moi à l'adresse ci-dessus, sans la
  rendre publique avant ma réponse. Je réponds dès que je peux.`

Textes épinglés :

- `core/interceptors/error-toast.spec.ts` : `tells the visitor what to do after a %i` (429, 500,
  503) : `ToastStore.add` reçu une fois avec `{ severity: 'error', detail }`, 429 → `Trop de
  requêtes en peu de temps, réessaie dans une minute`, 5xx → `Le serveur a un souci passager,
  réessaie dans un instant`.
- `src/server/feeds/rss.spec.ts` (adapté) : `<title>Le blog de Julien Nédellec</title>` et
  `<description>Ce que j'apprends en construisant mes projets : Angular, NestJS, PostgreSQL et
  l'auto-hébergement, erreurs comprises.</description>` (U+00A0 avant `:`, U+202F avant `?`, règle
  typographique du dépôt).

Adaptation mécanique : `app.routes.legal.spec.ts`, `pages/page-not-found.spec.ts` — 2 espaces
insécables brutes réécrites en ` ` / ` `, aucune valeur attendue modifiée.

Dû au GREEN : `error-toast.ts` lignes 45 et 48, `rss.ts` lignes 58 et 61, commentaire des deux
`security.txt` (lignes 8-10).

Tous les tests de cette tranche échouent à ce stade (RED confirmé via la commande test du profil le 2026-10-21 22:12, 9 failed / 4346 total), tous en `AssertionError`, aucune erreur de harnais ; les 4337 autres tests restent verts ; prettier et eslint verts sur les fichiers modifiés.

```
FAIL editorial-identity.spec.ts > the public site never says « vous » > in src/app/core/interceptors/error-toast.ts
AssertionError: expected [ 'line 45: « veuillez »', …(1) ] to deeply equal []
FAIL editorial-identity.spec.ts > the public site never says « vous » > in public/security.txt
FAIL editorial-identity.spec.ts > the public site never says « vous » > in public/.well-known/security.txt
AssertionError: expected [ 'line 8: « vous »', …(1) ] to deeply equal []
FAIL editorial-identity.spec.ts > the security policy speaks to the reader > in public/security.txt
FAIL editorial-identity.spec.ts > the security policy speaks to the reader > in public/.well-known/security.txt
AssertionError: expected 'Si vous découvrez une vulnérabilité d…' to be 'Tu as trouvé une faille de sécurité\u…'
FAIL rss.spec.ts > buildRss > Given a build time When the feed is built Then the channel names the blog, …
FAIL error-toast.spec.ts > errorToastInterceptor > tells the visitor what to do after a 429 | 500 | 503
 Test Files  3 failed | 220 passed (223)
      Tests  9 failed | 4337 passed (4346)
EXIT=1
```

## Journal des tranches

- **Tranche 1 — les textes publics passent au tutoiement** : GREEN 4095 passed / 4095 total · refactor : aucun
- **Tranche 2 — le vouvoiement ne revient plus** : GREEN 4308 passed / 4308 total · refactor : aucun
- **Tranche 2bis — corrective, revue code** : GREEN 4346 passed / 4346 total · refactor : aucun

## Verify

Exécuté par `code-reviewer` le 2026-10-21 (preuve absente de la spec, re-jouée inline) sur l'image
Docker de la branche (`ng-portfolio-app:a11y`, `ci/a11y-stack.sh up`, site servi sur
`http://127.0.0.1:3000` devant la doublure `ci/api-stub`).

Steps :

1. `/` : en-tête « M'écrire » visible ; clic, la page défile jusqu'à `#contact` (haut de section à 80 px).
   Titre « Écris-moi. », légende « Tes coordonnées », libellés `Ton nom (requis)`, `Email (requis)`,
   `Sujet (requis)`, `Message (requis)`, placeholders et mention au tutoiement (lus dans le DOM).
2. Hydratation : saisie `pas-un-email` dans l'e-mail puis focus sur le sujet : `aria-invalid="true"`,
   message « Format d'email invalide » affiché.
3. `/confidentialite` : `h2` « Tes droits », aucun `vous|votre|vos` dans `main`.
4. `/does-not-exist` : « Oups ! La page que tu cherches […] sections du site. »
5. `/about` : titre « Parcours : de l'atelier au code | Julien Nédellec », description `journey` +
   « Ma stack et mon CV. », trois boutons « M'écrire » (en-tête, conclusion, pied de page), tous
   vers `scrollTo('contact')`.

Captures : accueil (hero au nouveau texte), section contact avant et après saisie invalide, `/about`
(navigateur de la session de revue).

Console : erreurs réseau uniquement, toutes environnementales et sans lien avec le diff (appels
navigateur vers `https://api.nedellec-julien.fr` refusés par CORS depuis l'origine `127.0.0.1`,
404 de ressources de la doublure) ; aucune erreur JS applicative, aucune erreur d'hydratation.

Verdict : **PASS**.

Complément tranche 2bis (re-revue, même pile Docker reconstruite sur `2f0495c`) : `/rss.xml` sert
`<title>Le blog de Julien Nédellec</title>` et la nouvelle description ; `/.well-known/security.txt`
sert le domaine `nedellec-julien.fr` et le commentaire au tutoiement ; `/security.txt` répond 200.
Verdict : **PASS**.

## Review code

Re-revue du 2026-10-21 sur `2f0495c` (`git diff 18bd0d8..HEAD` : tranche 2bis et corrections de revue).

**Verdict** : APPROVED
**Gates CI locaux** : tests ✅ (`pnpm test` exit 0, 223 fichiers / 4346 tests) / lint ✅ (`pnpm lint` exit 0) / build ✅ (`pnpm run build --configuration production` exit 0, 0 warning) ; `pnpm install --frozen-lockfile` 0, `pnpm a11y:typecheck` 0, `pnpm run format:check` 0, `pnpm icons:check` 0, `pnpm a11y` 0 au second passage (55 passed, zéro violation ; premier passage : 54 passed, 1 timeout de 30 s sur `/admin/profile`, sans violation, cf. risque résiduel), spec-lint 0
**Checks mécaniques** : 10 hit(s) — archeologie altitude au premier passage, inchangés : 8 hits d'archéologie pré-existants (titres « spec 029 »), aucune ligne ajoutée par le diff ; altitude advisory ; profil non transmis pour immutabilité (défaut universel). Checker lancé depuis le plugin (non vendoré dans `.claude/checks/`).
**Warnings de gate** : aucun
**Rendu compilé** : N/A
**Preuve de verify runtime** : ✅ (section `## Verify`, complétée pour la tranche 2bis)
**Score de mutation** : N/A (profil sans outil)
**Conventions Angular 20+** : ✅
**Cross-platform** : ✅
**Tests** : ✅
**Sécurité** : ✅
**Alignement spec** : ✅

Points du premier passage :

1. Bloquant, soldé : `error-toast.ts:45` et `:48` au tutoiement, épinglés par `error-toast.spec.ts` (429, 500, 503) ; `core/` dans `PUBLIC_ROOT`, `veuillez` dans `FORMAL_ADDRESS` avec un cas `flags` ; justification du Plan de test corrigée.
2. Soldé : `rss.ts` aligné sur la description du blog, titre du canal sans em-dash ; `src/server/feeds/` lu par le verrou.
3. Soldé : les deux `security.txt` au tutoiement et lus par le verrou. `public/.well-known/security.txt` repointé de l'ancien domaine `julien-nedellec.fr` vers `nedellec-julien.fr` (vérifié servi par l'image : 200, mêmes champs que `/security.txt` sauf `Canonical`).
4. Soldé : six impératifs ajoutés, triangulés par un cas `flags` sur une même ligne.
5. Soldé : ` ` et ` ` en échappement dans `app.routes.legal.spec.ts` et `page-not-found.spec.ts` ; adaptation mécanique vérifiée contre le diff, aucune valeur attendue modifiée.

Grep indépendant (src entier hors admin, auth et specs, plus `public/`) : aucune occurrence de `vous|votre|vos|vôtre|veuillez` ni d'impératif en *-ez* hors « chez », « assez », « nez ».

**Tests notables** :
- ✨ `src/app/editorial-identity.spec.ts` — garde de portée (`reads %s`, `leaves %s out`) étendue à `core/`, `src/server/feeds/` et aux deux `security.txt` : un fichier sorti du périmètre fait échouer le verrou.
- ✨ `src/app/core/interceptors/error-toast.spec.ts` — `it.each` 429/500/503 sur le message reçu par `ToastStore.add`, assertion exacte.

**Altitude composant** (advisory, non bloquant) :
- ⚠️ `src/app/features/contact/application/contact-form.ts` — 263 LOC (déjà au-dessus de 250 avant, +3) — candidat découpe : sortir le bloc de mention et d'envoi en sous-composant.

**Risque résiduel** (advisory, § 8) :
- réversibilité : profil absent · monitoring : Sentry (profil)
- ⚠️ `src/app/layout/components/header/header.ts:145`, `footer.ts:118` — le libellé mesuré par `trackCtaClick` passe de « Me contacter » à « M'écrire » : l'historique d'audience du même CTA se scinde en deux lignes.
- ⚠️ audit a11y : `/admin/profile` (thème sombre) a dépassé le timeout de 30 s une fois sur deux passages, machine chargée ; page hors diff, aucune violation remontée. À surveiller sur le job `a11y` de la CI de la PR : s'il s'y reproduit, il bloque le merge.
- ⚠️ un 429 ou un 5xx du formulaire de contact affiche toujours deux messages (toast global et message du gateway), désormais tous deux au tutoiement ; comportement antérieur à la PR.
- non couvert par les gates : la mise à jour de `/.well-known/security.txt` n'est observable qu'en production après déploiement.

## Corrections de revue (2026-10-21)

Suite du REJECTED de `## Review code` : le toast global (`core/interceptors/error-toast.ts`) est
atteint par les appels publics (contact, blog, projets n'utilisent pas `silentErrors()`), donc
`core/` entre dans le périmètre du verrou. La justification inverse du Plan de test était fausse.

| Où | Avant | Après |
|---|---|---|
| `error-toast.ts`, 429 | Trop de requêtes, veuillez patienter | Trop de requêtes en peu de temps, réessaie dans une minute |
| `error-toast.ts`, 5xx | Erreur serveur, veuillez réessayer | Le serveur a un souci passager, réessaie dans un instant |
| `src/server/feeds/rss.ts`, `<title>` du canal | `${AUTHOR} — Blog` (em-dash) | `Le blog de ${AUTHOR}` |
| `src/server/feeds/rss.ts`, `<description>` du canal | Retours d'expérience Angular, NestJS, PostgreSQL et self-hosting. | Ce que j'apprends en construisant mes projets : Angular, NestJS, PostgreSQL et l'auto-hébergement, erreurs comprises. |
| `public/security.txt` et `public/.well-known/security.txt`, commentaire | Si vous découvrez une vulnérabilité de sécurité, merci de nous en informer de manière responsable en utilisant les coordonnées ci-dessus. Nous nous engageons à répondre rapidement aux rapports de sécurité. | Tu as trouvé une faille de sécurité ? Écris-moi à l'adresse ci-dessus, sans la rendre publique avant ma réponse. Je réponds dès que je peux. |

Verrou : `core/` dans la portée ; `veuillez` et les impératifs `découvrez`, `consultez`, `cliquez`,
`hésitez`, `lisez`, `téléchargez` ajoutés à la liste fermée ; `src/server/feeds/` et
`public/*.txt` (dont `.well-known/`) lus aussi. Les espaces insécables des specs s'écrivent en
échappements (` `, ` `), comme dans le reste du dépôt.

Défaut trouvé par `qa` pendant le RED (hors périmètre du ton, corrigé dans la même PR) :
`public/.well-known/security.txt`, servi en production, annonce l'ancien domaine `julien-nedellec.fr`
(e-mail, page de contact, `Canonical`, `Acknowledgments`), qui ne répond plus (vérifié le
2026-10-21). Il reprend les champs de `public/security.txt`, avec
`Canonical: https://nedellec-julien.fr/.well-known/security.txt`.

## Clôture (2026-10-22)

- **PR 1** : #246 (spec), #250 (`PRODUCT.md`). **PR 2** : #253 (textes publics, verrou anti-vouvoiement,
  `security.txt`), vérifiée en production le 2026-10-22 : aucun vouvoiement hors citation d'un titre
  de la CNIL et du nom commun « rendez-vous ».
- **PR 3, contenu en base**, fait dans l'admin avec l'accord du propriétaire, texte par texte, et
  vérifié par l'API et en production : phrase de l'article DashFlow au tutoiement ; parcours
  (accroche, trois traits, deux « Ce que je fais ») ; accroche et description des six fiches projet,
  les démos dites fictives jusque dans leurs avis.
- **PR 4, API** : `nest-portfolio-app#66` (e-mail de confirmation du contact au tutoiement). La graine
  `profile.seed.ts` n'est pas réécrite : copie figée de la migration 0021, dont la migration 0028
  dépend mot pour mot ; le contenu réel vit en base.
- **PR 5** : #248 (brouillons A1 à A4 au tutoiement).
- Hors périmètre, constaté : les articles déjà publiés sont relus au cas par cas ; aucun ne vouvoie
  plus le lecteur au 2026-10-22.
