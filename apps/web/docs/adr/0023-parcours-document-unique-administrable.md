# ADR-0023 — Contenu du Parcours : un document unique versionné côté API, identité verrouillée dans le code

- **Statut** : accepté (décisions du propriétaire du 2026-10-10), à appliquer par la spec 021
- **Date** : 2026-10-10
- **Contexte spec** : `specs/021-parcours-administrable.md`
- **Exécute** : ADR-0004 §4 (« le jour où une source distante apparaît, la constante migre derrière un gateway »)
- **Prolonge** : ADR-0013 (édition en page dédiée, brouillon possédé par la page, aperçu par les composants publics)
- **Amendé par** : ADR-0024 (2026-10-10) — §5 et §6 remplacés : aucun rebuild, `/about` rendue à la
  requête, aucune garde de build ; justification de §7 mise à jour

## Context

Le contenu de `/about` est une constante TypeScript (`features/profile/infra/data/profile.static-data.ts`)
servie par `InMemoryProfileGateway`, câblé en production (`app.config.ts:148`). Le propriétaire
veut l'éditer depuis l'admin, « de manière pro et en cohérence avec le reste ».

Faits vérifiés le 2026-10-10 :

- L'API stocke projets et articles en tables Drizzle avec listes en `jsonb` (`project.tech_choices`,
  `architecture_decisions`) ; les DTO `class-validator` valident les listes imbriquées
  (`ValidateNested` + `Type`), `ValidationPipe` global en `whitelist` + `forbidNonWhitelisted`.
- Le site public est **prérendu au build** (nginx sert `browser/`, aucun SSR à la requête). Seul
  `BlogService.triggerDeploy` (`nest-portfolio-app/src/blog/blog.service.ts:243-258`) appelle le
  webhook Dokploy `DOKPLOY_DEPLOY_WEBHOOK_URL` ; **aucune** mutation de projet ne le fait, alors que
  l'éditeur de projet annonce « en ligne au prochain déploiement, quelques minutes après
  l'enregistrement » (`admin-project-editor.ts:88-91`).
- Une partie du texte de `/about` est **partagée** : la phrase d'identité `SITE_IDENTITY.journey`
  (accroche de l'accueil, sous-titre de l'offre atelier, meta de `/about`), verrouillée par
  `editorial-identity.spec.ts` ; nom, ville, réseaux, e-mail (`SITE_IDENTITY`, repris par le contact,
  le pied de page et le JSON-LD) ; disponibilité recrutement (`SITE_IDENTITY.hiringAvailability`).
- La page est éditée d'un bloc : six sections qui se lisent ensemble, un seul enregistrement attendu.
  (À la rédaction : un rebuild complet du site par publication ; remplacé par le rendu à la requête,
  ADR-0024.)

## Decision

1. **Un document unique** côté API : table `profile_content`, une seule ligne (clé `'main'`, `CHECK`),
   colonne `content jsonb` typée, `version integer`, `updated_at`. Pas de table par section.
2. **Lecture publique, remplacement complet** : `GET /api/profile` (public, `PublicReadThrottle`) ;
   `PUT /api/profile` (JWT) reçoit le document entier et la `version` lue. Mise à jour
   conditionnelle `WHERE version = $lue` : sinon **409**. Un document identique n'écrit rien. L'ordre des listes est l'ordre du tableau ; chaque élément de liste porte un `id`
   UUID stable (unicité validée), généré par le client à l'ajout.
3. **Identité verrouillée dans le code** : `journey`, nom, ville, réseaux, e-mail, disponibilité
   recrutement, titres structurels de section, rôle et stack du premier écran restent des constantes
   front. Le document API porte le contenu propre à `/about`, résumés de section compris. Le test
   d'identité garde son périmètre sur ces constantes.
4. **Contenu initial = migration** : une migration SQL personnalisée insère le document à partir du
   contenu statique actuel, généré mécaniquement (aucune recopie à la main), `ON CONFLICT DO NOTHING`.
   Un test API prouve l'égalité entre le JSON de la migration et la constante de seed, et la validité
   de ce seed au regard du DTO d'écriture.
5. **Publication** (amendé par ADR-0024) : aucun webhook ni rebuild. `/about` est rendue à la
   requête ; l'enregistrement est visible au rechargement suivant. `SiteRebuild` n'est pas créé ; le
   webhook du blog est retiré après la bascule.
6. **API indisponible** (amendé par ADR-0024) : pas de garde de build (le build ne lit plus l'API).
   À la requête, une lecture en échec rend la page en 503 et nginx sert la dernière copie bonne. Pas
   de repli statique du contenu.
7. **Portrait** : colonnes `portrait_key` et `previous_portrait_key` de la même ligne, **hors
   version** (un remplacement n'invalide pas un brouillon de texte ouvert). `POST
   /api/profile/portrait` recadre en AVIF 640×800 (pipeline `ImageOptimizer`), clé
   `profile/portrait-<sha8>.avif`, ordre envoi → base → suppression de l'**avant-dernière** clé,
   compensation (suppression de la nouvelle clé) si l'écriture en base échoue ; `DELETE` revient au
   portrait par défaut. **La clé remplacée ou retirée n'est pas supprimée tout de suite** (décision
   du 2026-10-10) : une page `/about` déjà ouverte, ou la copie périmée servie par nginx pendant une
   panne d'API (ADR-0024), la cite encore ; la supprimer leur donnerait un 404 sur l'image LCP. Chaque changement fait glisser les clés (courante → précédente) et
   supprime l'ancienne précédente : au plus un fichier « en trop » dans le bucket, jamais une image
   cassée. L'écriture est conditionnée aux deux clés lues (409 sinon), pour que la clé supprimée soit
   toujours la bonne. Le front sert `public/avatar.avif` tant que
   `portrait` est `null` ; le portrait reste l'image LCP de `/about`, servie même origine par
   `/api/storage/` (ADR-0018). Texte alternatif fixe.
8. **Formulations à relire** : liste unique `FORBIDDEN_WORDINGS` (« 20 ans », « vingt ans »,
   « métallurgie ») côté front, lue par l'avertissement **non bloquant** de l'admin et par le test
   d'identité éditoriale ; l'API ne filtre pas.
9. **Front** : `ProfileGateway` (port abstrait, implémentation HTTP + doublure de test) expose
   `getProfile()` et `saveProfile()` ; la constante statique, l'adapter in-memory et la doublure qui
   la relisait disparaissent. L'admin édite par une page unique à sections (ADR-0013 : la page possède
   le brouillon, le formulaire l'édite en `model()`).

## Consequences

- Une écriture = un document remplacé atomiquement, visible à la requête suivante (ADR-0024) : aucun
  état intermédiaire publié entre deux sections.
- La validation vit à la frontière API (bornes, listes non vides, ids uniques) ; les bornes sont
  recopiées côté front pour les messages de formulaire (précédent `PROJECT_PITCH_MAX_LENGTH`).
- Le contenu de `/about` quitte la couverture des tests éditoriaux (typographie, formulations
  interdites) : la typographie est rétablie par normalisation à l'enregistrement ; trois
  formulations déclenchent un avertissement non bloquant, la décision reste au propriétaire.
- L'ordre API puis front reste requis : le front lit `/api/profile` à l'exécution (le build ne la lit
  plus depuis ADR-0024, la CI ne l'impose donc plus mécaniquement).
- Un envoi de portrait est visible à la requête suivante ; l'ancienne clé reste dans le bucket
  (clé précédente) pour les pages déjà ouvertes et la copie périmée de nginx. Seuls deux changements
  rapprochés pendant une panne d'API peuvent supprimer une clé encore citée (servie alors par le
  cache disque des images s'il l'a déjà relayée).
- Le bucket garde au plus un portrait non affiché (la clé précédente) ; c'est l'unique « orphelin »
  voulu, borné, et effacé au changement suivant.
- Pas d'historique de versions : la restauration d'un état antérieur passe par la sauvegarde de base
  ou par le seed initial.

## Alternatives considered

- **Tables par section** (biographie, traits, activités, technologies, formations, motivation) :
  six tables, six jeux de CRUD et de réordonnancement, un rebuild par écriture partielle, des états
  intermédiaires publiables. Rejeté : complexité sans bénéfice pour un document édité d'un bloc.
- **Document JSONB sans version** : deux onglets ouverts s'écrasent en silence. Rejeté : la version
  coûte une colonne et une clause `WHERE`.
- **PATCH par section** : fusion partielle côté API, conflits plus fins mais logique de fusion à
  tester ; le formulaire envoie de toute façon le document entier. Rejeté.
- **Repli statique si l'API ne répond pas** : deux sources de vérité, contenu publié périmé en
  silence. Rejeté.
- **Webhook de rebuild partagé (`SiteRebuild`)**, décision initiale de §5 : minutes de délai et builds
  en rafale ; remplacé par le rendu à la requête (ADR-0024).
- **Identité éditable dans l'admin** : la phrase `journey` est reprise sur l'accueil, l'offre et la
  meta ; l'éditer depuis `/about` changerait trois pages et casserait le test d'identité. Rejeté
  tant que l'identité n'a pas sa propre source éditable (hors périmètre).
