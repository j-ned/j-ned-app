# 009 — Copy des quatre nouvelles offres (validée le 2026-10-04)

Annexe de `specs/009-plateforme-acquisition.md`, prérequis du GREEN de la tranche 3. Structure
alignée sur le modèle `OfferSummary` / `OfferPageContent` (§ 3 du Plan technique). Voix
`PRODUCT.md` : phrases courtes, aucun superlatif, aucun em-dash, faits vérifiables.

Engagements validés par Julien le 2026-10-04 : réponse sous 24 heures ouvrées, première version
d'application en 4 à 8 semaines, échange de 30 minutes gratuit et cadrage compris dans le projet,
hébergement en France avec sauvegardes quotidiennes, maintenance applicative dès 190 €/mois
(tarif distinct par offre, même montant), restitution d'audit d'une heure, renfort à temps
partiel uniquement.

Tarifs validés le 2026-10-04 (source unique `OFFER_PRICES`).

---

## 1. `site-vitrine`

### Résumé (`OfferSummary`)

| Champ | Valeur |
|---|---|
| family | `sites` |
| name | Site vitrine pour TPE, PME et artisans |
| audience | TPE, PME, artisans et professions libérales |
| promise | Votre site, en ligne en 7 jours. |
| priceTeaser | 890 €, prix final |
| featuredOnHome | `true` |
| seo.title | Création de site vitrine en 7 jours \| Julien Nédellec |
| seo.description | Site vitrine pour TPE, PME et artisans des Yvelines et d'Île-de-France, en ligne en 7 jours. 890 € prix final, maintenance 29 €/mois sans engagement. |
| seo.serviceType | Création de site vitrine |
| seo.serviceDescription | Site vitrine pour TPE, PME et artisans, en ligne en 7 jours, avec maintenance mensuelle. |
| seo.breadcrumbName | Site vitrine |

### Page

**Hero**
- Titre : Votre site vitrine, en ligne en 7 jours.
- Sous-titre : Un site clair, rapide sur téléphone, qui donne envie de vous appeler. Un prix fixe, un seul interlocuteur.
- CTA : Demander mon site

**Pourquoi passer par moi**
- **Un prix fixe** : 890 €, annoncé avant de commencer, sans dépassement.
- **Un seul interlocuteur** : la personne qui vous répond est celle qui construit le site.
- **Rien ne vous enferme** : le nom de domaine et les fichiers sont à votre nom.

**Ce que contient le site**
Présentation de l'entreprise · Services et prestations · Zone d'intervention · Réalisations en
photos · Formulaire de demande de devis · Fiche Google Business reliée · Mentions légales et RGPD ·
Adapté au téléphone · Référencement local Google

**Le déroulé en 7 jours**
- **Échanger** (jour 1) : 20 minutes au téléphone. Vous m'envoyez textes, logo et photos.
- **Construire** (jours 2 à 5) : je monte le site et vous envoie un lien de prévisualisation.
- **Ajuster** (jour 6) : vos corrections.
- **Mettre en ligne** (jour 7) : sur votre nom de domaine.

**Tarif**
- **Création** · 890 € · Une fois. 50 % à la commande, 50 % à la mise en ligne.
- **Maintenance** · 29 €/mois · Par mois, sans engagement. Inclus : hébergement, nom de domaine,
  HTTPS, sauvegardes, 30 minutes de modifications par mois.

**Questions fréquentes**
- *Je n'ai ni textes ni photos, c'est un problème ?* Non. On les prépare au premier échange :
  je rédige à partir de vos réponses, vous validez.
- *J'ai déjà un site, ça vaut le coup ?* Si votre site est lent, illisible sur téléphone ou
  absent de Google, oui. Je reprends les contenus utiles.
- *Le nom de domaine reste à moi ?* Oui, il est à votre nom.
- *Et si j'arrête la maintenance ?* Vous récupérez les fichiers du site et pouvez l'héberger
  ailleurs.
- *Je pourrai ajouter des pages plus tard ?* Oui. Les petites modifications entrent dans les
  30 minutes mensuelles ; une nouvelle page fait l'objet d'un devis avant travaux.

**Demande**
- Sujet prérempli : Site vitrine pour mon entreprise
- Intro : Indiquez votre activité et votre ville. Je vous réponds sous 24 heures ouvrées.

---

## 2. `application-metier`

### Résumé

| Champ | Valeur |
|---|---|
| family | `applications` |
| name | Application métier sur mesure |
| audience | PME, équipes métier et fondateurs |
| promise | L'outil qui remplace vos tableurs et vos ressaisies. |
| priceTeaser | À partir de 4 500 € |
| featuredOnHome | `true` |
| seo.title | Application métier sur mesure, Angular et NestJS \| Julien Nédellec |
| seo.description | Outil interne, back-office ou portail client développé sur mesure en Angular et NestJS. Devis ferme après cadrage, à partir de 4 500 €. |
| seo.serviceType | Développement d'application web sur mesure |
| seo.serviceDescription | Outil interne, back-office ou portail client sur mesure, du cadrage à la mise en production et à la maintenance. |
| seo.breadcrumbName | Application métier |

### Page

**Hero**
- Titre : Une application taillée pour votre façon de travailler.
- Sous-titre : Outil interne, back-office, portail client. Je cadre le besoin avec vous, je livre en production et je maintiens.
- CTA : Décrire mon besoin

**Ce qui change avec une application sur mesure**
- **Fini les ressaisies** : une donnée saisie une fois, disponible partout où elle sert.
- **Adaptée à votre métier** : vos étapes, vos statuts, vos documents, pas ceux d'un logiciel générique.
- **Elle vous appartient** : code source, données et hébergement à votre nom.

**Ce qui est livré**
Cadrage écrit (écrans, règles métier, priorités) · Application web utilisable sur ordinateur et
téléphone · Comptes utilisateurs et droits d'accès · Base de données sauvegardée · Exports CSV
ou PDF selon le besoin · Mise en production · Code source et documentation · Tests automatisés
sur les règles métier

**Comment ça se passe**
- **Cadrer** (semaine 1) : ateliers avec les futurs utilisateurs. Vous recevez un devis ferme :
  périmètre, planning, prix.
- **Construire** (itérations de 2 semaines) : une version utilisable à chaque itération, sur un
  lien de test.
- **Mettre en production** (fin du planning) : reprise des données existantes, prise en main par
  les utilisateurs.
- **Maintenir** (au mois, sans engagement) : corrections, mises à jour de sécurité, évolutions
  sur devis.

**Tarif**
- **Projet** · À partir de 4 500 € · Devis ferme après le cadrage. Ce qui n'y figure pas fait
  l'objet d'un avenant que vous validez avant.
- **Maintenance** · Dès 190 €/mois · Sans engagement, montant fixé selon la taille de
  l'application.

**Questions fréquentes**
- *Combien de temps pour une première version ?* Pour un outil de taille moyenne, 4 à 8 semaines.
  Le planning exact figure dans le devis.
- *Pourquoi pas un logiciel du marché ?* S'il couvre votre besoin, je vous le dirai au cadrage.
  Le sur mesure se justifie quand vous adaptez votre travail à l'outil au lieu de l'inverse.
- *Le cadrage est payant ?* Le premier échange de 30 minutes est gratuit. Le cadrage détaillé est
  compris dans le projet.
- *Mes données sont-elles protégées ?* Hébergement en France, connexions chiffrées, sauvegardes
  quotidiennes, double authentification possible.
- *Je pourrai faire évoluer l'application ?* Oui. Le code vous appartient : vous pouvez aussi
  confier la suite à un autre prestataire.

**Demande**
- Sujet prérempli : Application métier sur mesure
- Intro : Décrivez ce que vous utilisez aujourd'hui (tableur, logiciel, papier) et ce qui vous
  fait perdre du temps.

---

## 3. `refonte-maintenance`

### Résumé

| Champ | Valeur |
|---|---|
| family | `applications` |
| name | Refonte, audit et maintenance |
| audience | Entreprises qui ont déjà une application web |
| promise | Reprendre une application existante, la sécuriser et la faire durer. |
| priceTeaser | Audit 450 €, maintenance dès 190 €/mois |
| featuredOnHome | `true` |
| seo.title | Audit, refonte et maintenance d'application web \| Julien Nédellec |
| seo.description | Audit d'application web à 450 €, refonte et maintenance dès 190 €/mois. Reprise de projets Angular et NestJS existants, en Île-de-France et à distance. |
| seo.serviceType | Audit et maintenance d'application web |
| seo.serviceDescription | Audit, modernisation et maintenance d'applications web existantes, en priorité Angular et NestJS. |
| seo.breadcrumbName | Refonte et maintenance |

### Page

**Hero**
- Titre : Votre application existe. Je la reprends, je la sécurise, je la fais durer.
- Sous-titre : Prestataire parti, versions dépassées, bugs qui reviennent. Je commence par un audit chiffré, puis vous décidez.
- CTA : Demander un audit

**Quand faire appel à moi**
- **Le prestataire n'est plus là** : personne ne connaît le code et chaque modification inquiète.
- **Les versions sont dépassées** : le framework ou les dépendances ne reçoivent plus de
  correctifs de sécurité.
- **Les bugs reviennent** : les mêmes problèmes réapparaissent, faute de tests.

**Ce que contient l'audit**
État des versions et des dépendances · Failles de sécurité connues · Qualité du code et de
l'architecture · Performance et accessibilité mesurées · Couverture de tests · Plan d'action
priorisé et chiffré

**Comment ça se passe**
- **Auditer** (semaine 1) : accès en lecture au code et à l'hébergement. Vous recevez un rapport
  écrit et une restitution d'une heure.
- **Décider** (après la restitution) : vous choisissez les actions. Chaque chantier a son devis
  ferme.
- **Moderniser** (selon le plan) : montées de version, corrections, tests, par étapes mises en
  production.
- **Maintenir** (au mois, sans engagement) : mises à jour de sécurité, surveillance, corrections.

**Tarif**
- **Audit** · 450 € · Une fois. Rapport écrit et restitution.
- **Chantiers** · Sur devis · Chaque chantier issu de l'audit a son devis ferme.
- **Maintenance** · Dès 190 €/mois · Sans engagement, montant fixé après l'audit. Inclus : mises
  à jour de sécurité, montées de version mineures, corrections de bugs, surveillance des erreurs
  en production.

**Questions fréquentes**
- *Vous reprenez du code que vous n'avez pas écrit ?* Oui, c'est l'objet de l'audit. Je travaille
  surtout sur Angular et NestJS ; pour une autre technologie, je vous le dis avant de commencer.
- *L'audit m'engage pour la suite ?* Non. Le rapport vous appartient, vous pouvez le confier à un
  autre prestataire.
- *Faut-il tout refaire ?* Rarement. L'audit distingue ce qui se corrige de ce qui doit être
  réécrit, avec le coût de chaque option.
- *Comment est fixé le prix de la maintenance ?* Après l'audit, selon la taille de l'application et
  le niveau de suivi. À partir de 190 €/mois, sans engagement.

**Demande**
- Sujet prérempli : Audit de mon application
- Intro : Indiquez la technologie si vous la connaissez, depuis quand l'application existe et ce
  qui vous inquiète.

---

## 4. `renfort-freelance`

### Résumé

| Champ | Valeur |
|---|---|
| family | `applications` |
| name | Renfort Angular / NestJS |
| audience | Équipes produit, CTO et ESN |
| promise | Un développeur full-stack Angular et NestJS pour renforcer votre équipe. |
| priceTeaser | TJM sur demande |
| featuredOnHome | `true` |
| seo.title | Développeur Angular / NestJS freelance en régie \| Julien Nédellec |
| seo.description | Développeur full-stack Angular et NestJS en freelance, en régie à distance ou sur site en Île-de-France. TJM sur demande, contrat direct ou via Malt. |
| seo.serviceType | Développement logiciel en régie |
| seo.serviceDescription | Renfort développeur full-stack Angular et NestJS en régie, à distance ou sur site en Île-de-France. |
| seo.breadcrumbName | Renfort freelance |

### Page

**Hero**
- Titre : Un développeur Angular et NestJS dans votre équipe.
- Sous-titre : En régie à temps partiel, à distance ou sur site en Île-de-France. Je m'intègre à vos outils et à vos rituels, et je livre en production.
- CTA : Proposer une mission

**Ce que j'apporte**
- **Full-stack réel** : Angular récent (signals, SSR), NestJS, PostgreSQL, Docker. Du composant au
  déploiement.
- **Autonome** : je lis la documentation et le code existant avant de poser des questions.
- **Rigoureux** : tests, revues de code, conventions de l'équipe respectées.

**Stack et pratiques** (section `deliverables`)
Angular 22, signals, SSR · NestJS, API REST · PostgreSQL, Drizzle · Docker, CI/CD · Vitest, tests
automatisés · Accessibilité WCAG AA

**Déroulé** : aucun (section absente, conforme au plan).

**Conditions** (section `pricing`)
- **Régie** · TJM sur demande · Temps partiel, contrat direct ou via Malt (lien
  `SITE_IDENTITY.socials.malt`). Démarrage sous 2 semaines.

**Questions fréquentes**
- *Temps plein ou temps partiel ?* Temps partiel pour le moment. Pour une mission à temps plein,
  décrivez-la dans votre message : on en parle.
- *À distance ou sur site ?* À distance partout en France, sur site en Île-de-France.
- *Comment contractualiser ?* En direct par contrat de prestation, ou via Malt, qui gère le contrat
  et la facturation.

**Demande**
- Sujet prérempli : Proposition de mission Angular / NestJS
- Intro : Indiquez la stack, la durée, le rythme et le mode (distance ou sur site).
