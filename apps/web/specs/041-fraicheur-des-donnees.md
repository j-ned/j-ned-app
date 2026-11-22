# Fraîcheur des données après une écriture et au retour sur l'onglet

## Description

Demande du propriétaire (2026-11-22) : « J'aimerais que tous les autres formulaires soient aussi
réactifs que pour les commentaires. »

« Réactif », d'après ce que la PR D de la spec 040 a livré pour les commentaires :

1. Après une action, l'écran reflète le résultat tout de suite, sans rafraîchir le navigateur : là
   où l'on vient d'agir, et partout ailleurs dans l'onglet où la donnée est affichée (listes,
   détails, compteurs de la navigation, pages publiques visitées ensuite).
2. Au retour sur un onglet, les données qui ont pu changer ailleurs sont relues
   (`refreshWhenVisible`), sans clignotement, sans perdre un brouillon ni fermer un formulaire
   ouvert ; une relecture en échec garde l'affichage.
3. Un retour clair pendant et après l'envoi. Tous les formulaires l'avaient déjà (bouton occupé,
   confirmation, erreur) : rien n'a été changé sur ce point.

Hors périmètre : aucun changement de l'API ni du contrat HTTP, ni polling continu, ni WebSocket/SSE.
Exception livrée ensuite : la version des articles et des projets (section « Éditeurs : version plus
récente enregistrée ailleurs », ADR-0041).

## Mécanismes en place avant cette spec

- `shared/api/refreshable.ts` : cache de session partagé, relu par `refresh()`. Utilisé pour
  `allProjects` (home, `/projects`, page d'un projet, admin), `adminPosts` (admin), `unreadCount`
  (navigation et vue d'ensemble de l'admin), `pendingCount` (navigation de l'admin).
- Cache de transfert HTTP (`app.config.ts`, `PUBLIC_READ_PATHS`) : il ne sert qu'à l'hydratation.
  `@angular/common/http` le coupe dès la première stabilité de l'application
  (`appRef.whenStable().then(() => isCacheActive = false)`) : il ne fige aucune lecture faite
  ensuite dans l'onglet. Ce n'est pas une source de donnée périmée.
- Les lectures publiques sans cache (`/blog`, article, `/about`, liens CV) sont refaites à chaque
  navigation : une page visitée **après** une écriture est à jour ; une page **déjà ouverte** restait
  figée.

## Inventaire

« Même onglet » : la donnée est-elle à jour, sans rechargement, sur les écrans qui l'affichent
quand on y va après l'écriture ? « Retour » : un écran déjà ouvert la relit-il quand l'onglet
redevient visible ? Chaque défaut a été prouvé par un test rouge avant correctif (sorties dans le
rapport de la PR).

| Formulaire ou action                                                                                            | Donnée modifiée                | Écrans qui l'affichent                                                                                      | Même onglet (avant)                                                                                     | Retour (avant)                                                                                             | Défaut constaté → correctif                                                                                                                                                |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------ | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `admin-project-form` (créer, modifier, couverture)                                                              | projets                        | admin projets, éditeur, vue d'ensemble, compteur de la navigation, home (vitrine), `/projects`, page projet | à jour (invalidation dans l'éditeur)                                                                    | figé partout                                                                                               | invalidation dispersée dans deux pages ; listes figées au retour → invalidation dans le gateway ; relecture au retour sur la liste admin, `/projects` et la page projet    |
| galerie (`admin-gallery-upload-form`, `admin-gallery-image-item` : ajout, texte alternatif, ordre, suppression) | captures d'un projet           | page projet, éditeur                                                                                        | à jour (via `galleryChange` de la page)                                                                 | figé                                                                                                       | idem projets                                                                                                                                                               |
| suppression d'un projet                                                                                         | projets                        | idem                                                                                                        | à jour                                                                                                  | figé                                                                                                       | idem projets                                                                                                                                                               |
| `admin-post-form` (créer, modifier, couverture), suppression d'un article                                       | articles                       | admin articles, éditeur, vue d'ensemble, compteur, `/blog`, article, home                                   | admin à jour (invalidation dans la page) ; public relu à la navigation                                  | figé                                                                                                       | invalidation dispersée → gateway ; relecture au retour sur la liste admin et sur `/blog`                                                                                   |
| « J'aime » d'un article (public)                                                                                | nombre de « j'aime »           | liste des articles de l'admin                                                                               | **périmé** : la liste de l'admin déjà lue dans l'onglet gardait l'ancien nombre (test rouge `likePost`) | figé                                                                                                       | relecture de la liste admin par le gateway                                                                                                                                 |
| `contact-form` (public, rendu serveur)                                                                          | messages, non-lus              | boîte de réception, compteur de la navigation, vue d'ensemble                                               | **périmé** : compteur de non-lus déjà lu dans l'onglet non relu (test rouge `submitContactForm`)        | **figé** : boîte et compteur ne voyaient pas un message arrivé (test rouge `AdminMessages`, `AdminLayout`) | gateway relit le compteur après un envoi réussi ; boîte, compteur et derniers messages de la vue d'ensemble relus au retour                                                |
| marquer lu, tout marquer lu, supprimer un message                                                               | non-lus                        | compteur, vue d'ensemble                                                                                    | à jour (trois invalidations dans la page)                                                               | —                                                                                                          | invalidations dispersées → gateway                                                                                                                                         |
| publier, refuser un commentaire ; `admin-comment-reply-form`                                                    | file de modération, en attente | file, compteur                                                                                              | à jour (spec 040)                                                                                       | file relue (spec 040), **une relecture en échec remplaçait la file par une erreur** (test rouge)           | compteur relu par le gateway (succès, ou refus 404/409 parce que la file a changé) ; la navigation recompte au retour ; la file garde son affichage si la relecture échoue |
| `admin-profile-form`, portrait                                                                                  | parcours                       | `/about`, éditeur du parcours                                                                               | `/about` relu à la navigation                                                                           | **figé** : `/about` ouverte (test rouge `About`)                                                           | `/about` relue au retour ; l'éditeur n'est jamais relu                                                                                                                     |
| CV (téléverser, retirer)                                                                                        | CV                             | admin CV, lien de `/about`, téléchargement                                                                  | admin relu après l'écriture ; même URL de téléchargement                                                | **figé** : admin CV et nombre de téléchargements (test rouge `AdminCv`)                                    | admin CV relu au retour                                                                                                                                                    |
| `login`, `two-factor-verify`                                                                                    | journal des connexions         | admin « Connexions »                                                                                        | —                                                                                                       | **figé** (test rouge `AdminLogins`)                                                                        | journal relu au retour, page courante                                                                                                                                      |
| `two-factor-enable-form`, `two-factor-disable-form`                                                             | 2FA de l'utilisateur           | écran de sécurité                                                                                           | à jour (`AuthStore` mis à jour sur succès)                                                              | —                                                                                                          | aucun                                                                                                                                                                      |
| `password-change-form`                                                                                          | mot de passe                   | aucun affichage                                                                                             | —                                                                                                       | —                                                                                                          | aucun                                                                                                                                                                      |
| image dans le corps d'un article                                                                                | aucune liste                   | —                                                                                                           | —                                                                                                       | —                                                                                                          | aucun                                                                                                                                                                      |

Écrans relus au retour sur l'onglet, et pourquoi :

- **Navigation de l'admin** (`AdminLayout`) : messages non lus et commentaires en attente arrivent
  des visiteurs. Elle ne relit **pas** les listes de projets et d'articles : la liste des articles
  alimente l'éditeur d'article (`EditorDraft` recopie l'entité chargée dans le brouillon), la relire
  sous un éditeur ouvert écraserait la saisie.
- **Boîte de réception**, **liste des articles**, **liste des projets** de l'admin, **CV** (fichier
  et téléchargements), **journal des connexions**, **derniers messages de la vue d'ensemble** :
  données modifiées par les visiteurs ou par l'admin d'un autre onglet. Les listes d'articles et de
  projets passent par leur cache partagé : le compteur de la navigation suit. Intervalle minimal de
  **15 s** pour tous les écrans de l'admin (`refreshAdminWhenVisible`, calcul dans « Limites »).
- **`/blog`, `/projects`, page d'un projet, `/about`** : pages publiques rendues par le serveur, qui
  restaient figées une fois ouvertes. Même intervalle minimal que la PR D (2 s,
  `REFRESH_MIN_INTERVAL_MS`), une requête par retour au plus.

## Correctifs

1. **Une relecture en échec garde l'affichage** (`shared/api/refreshable.ts`). Le cache partagé
   remplaçait la liste par une erreur quand une relecture échouait ; il garde désormais la dernière
   valeur. Un premier chargement en échec reste une erreur.
2. **Chaque gateway relit son cache après ses propres écritures**, et seulement sur succès :
   `HttpProjectsGateway` (huit écritures), `HttpBlogGateway` (création, modification, suppression,
   couverture, « j'aime »), `HttpContactGateway` (envoi, lu, tout lu, suppression),
   `CommentsGateway` (publier, supprimer ; et un refus 404/409 de publier, supprimer ou répondre,
   qui dit que la file a changé). Les
   invalidations des pages disparaissent, ainsi que les doublons `invalidateFeatured` (projets) et
   `invalidateBundle` (home).
3. **`keepShownOnFailedReload(resource)`** (`shared/api/keep-shown-on-failed-reload.ts`) : opérateur
   posé dans le `stream` d'une `rxResource`. Pendant `reload()`, la ressource porte encore sa valeur
   (`reloading`) ; si la relecture échoue, l'opérateur la réémet au lieu de l'erreur. Un premier
   chargement en échec reste une erreur. Utilisé par chaque écran relu sans cache partagé, et par la
   file de modération.
4. **Écrans relus au retour** (liste ci-dessus), tous par `refreshWhenVisible`, qui prend désormais
   un intervalle minimal (`minIntervalMs`, 2 s par défaut, gardé pour les pages publiques). L'admin
   passe par `refreshAdminWhenVisible` (`features/admin/application`), à 15 s.
5. **Une relecture de fond est silencieuse.** L'intercepteur `errorToastInterceptor` toaste toute
   erreur sans `SKIP_ERROR_TOAST` : une relecture au retour ou après une écriture affichait une
   alerte (deux pour les lectures relancées). Le cache partagé passe `background: true` à sa lecture
   dès qu'une valeur est affichée, et les gateways posent alors `silentWhen(true)` (contexte HTTP) ;
   les compteurs de non-lus et de commentaires en attente ne relancent plus leur seconde tentative,
   non silencieuse. Hors cache, `/blog`, `/about` et le CV de l'admin demandent
   `{ background: resource.hasValue() }` à leur gateway ; les autres lectures relues étaient déjà
   silencieuses (messages, file de modération, journal, statistiques). Le **premier chargement**
   garde son comportement : état d'erreur de la page et toast tel qu'avant.
6. La vue d'ensemble n'affiche le squelette des messages que si rien n'est encore affiché : une
   relecture ne fait pas clignoter la liste.
7. La doublure de l'API (`ci/api-stub`) reçoit `POST /api/contact/messages`, gardé en mémoire, pour
   le parcours navigateur.

## Alternatives écartées

- **Invalider dans les pages** (l'existant) : une écriture oubliée laisse un écran périmé, c'est ce
  que l'inventaire a trouvé (« j'aime », envoi du formulaire de contact). Le gateway est le seul
  endroit qui voit toutes les écritures d'une donnée.
- **Relire tout le cache partagé depuis la navigation de l'admin** : écraserait le brouillon de
  l'éditeur d'article, lié à la liste partagée.
- **`rxResource.reload()` seul** : une relecture qui échoue fait passer l'écran en erreur. Une
  relecture « silencieuse » (`set()` sur succès, hors `reload()`) a été envisagée : elle double la
  fonction de lecture et entre en course avec un changement de paramètres (filtre, page) ; Angular
  annule déjà la lecture périmée quand c'est `reload()` qui la porte.
- **Polling, WebSocket, SSE** : exclus par la demande.
- **Relire `/about` et le lien du CV ensemble** : le lien vient de `CvDownload`, lu une fois par
  page ; le relire demanderait de le transformer en ressource pour un cas marginal (CV retiré
  pendant que `/about` est ouverte).

## Volontairement laissé

- **Éditeurs ouverts non relus** : éditeur d'article, de projet, du parcours, écran de sécurité. Les
  relire écraserait la saisie. Les trois éditeurs signalent désormais une version plus récente sans
  toucher au brouillon (« Éditeurs : version plus récente enregistrée ailleurs »).
- **Article ouvert** : son corps est rendu une fois (`@defer (hydrate never)`) ; seule sa discussion
  est relue (spec 040). **Home** : la vitrine des projets suit le cache partagé quand une écriture a
  lieu dans l'onglet, mais une home ouverte n'est pas relue au retour.
- **Audience** : statistiques relues à chaque visite de l'écran, pas au retour.
- **Vue d'ensemble** : au retour, seuls les derniers messages (et, via la navigation, les non-lus)
  sont relus ; ses chiffres de projets et d'articles suivent les écritures de l'onglet.

## Limites

- Navigation de l'admin sur l'éditeur d'article : les compteurs de projets et d'articles ne sont
  pas relus au retour ; ils le sont dès que la liste correspondante ou la vue d'ensemble s'ouvre.
- Une relecture de fond (retour sur l'onglet, relecture après une écriture) qui échoue n'affiche ni
  toast ni état d'erreur : l'écran garde une version peut-être périmée, sans le dire. La relecture
  suivante la remplace. Un premier chargement en échec, lui, montre toujours l'état d'erreur de la
  page et, selon la lecture, le toast de l'intercepteur, comme avant.
- **Quota de l'admin.** L'API limite chaque lecture de l'admin à 10 par minute, par IP et par route
  (`DEFAULT_THROTTLE`, `apps/api/src/common/throttle.ts`). Chaque retour sur une page de l'admin lit
  au moins `unread-count` et `pending-count` (navigation), plus la liste de l'écran ouvert
  (`/contact/messages` pour la boîte de réception). Avec 2 s d'intervalle, 30 retours par minute
  l'épuisaient. À 15 s, un écran relit au plus 4 fois par minute et par route, ce qui laisse 6
  lectures aux actions (« marquer lu », « tout marquer lu », suppression : chacune relit
  `unread-count`) et aux navigations. Au-delà de 6 actions par minute sur la même route, l'API
  répond 429 ; la relecture de fond reste alors silencieuse et garde l'affichage. Les pages
  publiques gardent 2 s (quota de 120 lectures par minute et par visiteur).
- Une suppression ou un « marquer lu » en cours peut croiser une relecture de la boîte de réception
  ou de la file de modération ; la relecture suivante remet l'état du serveur (même limite que la
  PR D pour les commentaires).
- Le téléchargement du CV suit la même URL ; l'API n'envoie pas d'en-tête de cache et la doublure ne
  la reproduit pas : l'absence de copie périmée dans le cache du navigateur n'est pas vérifiée.

## Éditeurs : version plus récente enregistrée ailleurs

Demande (2026-11-22) : au retour sur l'onglet d'un éditeur (article, projet, parcours), dire que
l'entité a été enregistrée ailleurs depuis son chargement, sans jamais écraser le brouillon.

**Comportement.**

- Au retour sur l'onglet (`refreshAdminWhenVisible`, 15 s au plus souvent), l'éditeur relit l'entité
  **en arrière-plan et sans toast**, et compare sa `version` (entier, incrémenté par l'API à chaque
  écriture) à celle du document édité. Jamais le contenu du brouillon.
- Rien n'est relu pour un nouvel article ou projet jamais enregistré, ni pendant un enregistrement.
  Une relecture partie avant un enregistrement de l'onglet, ou avant l'ouverture d'une autre entité
  dans le même éditeur, et revenue après est ignorée (la garde compare l'`id` et la version). Un
  enregistrement réussi devient la version de référence : pas de faux avertissement au retour. Une
  version plus récente déjà signalée n'est plus relue (pour l'article, chaque relecture lit toute la
  liste sur le quota de 10 lectures par minute).
- Version différente : « Une version plus récente de cet article (de ce projet, du parcours) a été
  enregistrée ailleurs. » et le bouton « Recharger la dernière version ». Sans modification non
  enregistrée, le rechargement est direct ; sinon un dialogue (`ConfirmDialog`) dit ce qui sera
  perdu : « Ton brouillon sera remplacé par la dernière version enregistrée : 2 modifications non
  enregistrées de cet article seront perdues. » Une couverture choisie et non envoyée est perdue
  avec le reste.
- Rien n'est rechargé automatiquement. Une relecture en échec, un article supprimé ailleurs ou une
  même version ne disent rien.
- Enregistrer alors qu'une version plus récente est signalée (article, projet) demande une
  confirmation : « Une version plus récente de cet article a été enregistrée ailleurs : enregistrer
  ton brouillon la remplacera. », « Enregistrer quand même » ou « Continuer l'édition ». Annuler
  n'écrit rien et garde le brouillon. « Enregistrer quand même » relit la dernière version et
  envoie le brouillon sous condition de celle-ci (`If-Match`) ; si elle ne peut pas être relue, le
  brouillon part avec sa propre version, l'API répond 409 et l'avertissement reste. Jamais
  d'écriture sans condition.
- Tout enregistrement d'article ou de projet part sous condition de la version d'où vient le
  brouillon (`If-Match: "<version>"`), l'envoi de la couverture sous celle que l'écriture vient de
  rendre. Un refus 409 (version enregistrée ailleurs avant tout retour sur l'onglet) affiche le même
  avertissement et la même action que le parcours, garde le brouillon et sa couverture, et le toast
  dit « L'article (Le projet) n'a pas été enregistré : une version plus récente a été enregistrée
  ailleurs. ». Une couverture refusée en 409 après l'écriture affiche aussi l'avertissement.
- Parcours : pas de confirmation, l'API refuse la version périmée. Un enregistrement refusé en 409
  affiche le même avertissement et la même action. Le toast d'erreur dit « Le parcours n'a pas été
  enregistré : une version plus récente a été enregistrée ailleurs. » au lieu de demander de
  recharger la page.
- Projet : chaque écriture de galerie (ajout, texte alternatif, ordre, retrait) change la version du
  projet. Celles faites depuis l'onglet avancent d'autant la version attendue par l'éditeur (pas de
  faux avertissement, pas de 409 au prochain enregistrement) ; celles faites ailleurs sont
  signalées comme une version plus récente.
- « Dernière version chargée. » n'est dit que si la version éditée a effectivement changé depuis
  celle d'où le rechargement est parti ; il retombe à la saisie suivante et à l'enregistrement
  suivant. Un rechargement de projet ou de parcours qui échoue donne le focus à « Réessayer ».

**Accessibilité.** La zone d'avertissement est un `role="status"` présent dès que l'éditeur est
affiché, vide tant que rien n'est détecté : son contenu change, il est donc annoncé (une région
insérée déjà remplie ne l'est pas sûrement). `status` et non `alert` : l'information arrive en
arrière-plan, rien n'est perdu, la saisie en cours ne doit pas être interrompue. Le focus n'est pas
déplacé à la détection. Au rechargement, le bouton disparaît : le focus passe à la zone
(`tabindex="-1"`), qui affiche « Dernière version chargée. ». Le refus 409, lui, reste annoncé par
le toast d'erreur (`role="alert"`), conséquence directe de l'action de l'utilisateur.
`StatusMessage` n'est pas réutilisé : il porte son propre rôle et n'existe que rempli ; la zone
réutilise `Button` et `ConfirmDialog`.

**Mutualisation.**

- `NewerVersionCheck` (`features/admin/application/newer-version-check.ts`) : relit au retour, compare
  les versions, ignore la réponse si l'entité ou sa version a changé entre-temps ; `detected`
  retombe dès que la version éditée change (enregistrement, rechargement). Il porte aussi le
  rechargement, l'état « rechargée » et la confirmation d'écrasement : `beforeSave()` rend
  `{ proceed, version }`, la version à envoyer (relue après confirmation). Chaque éditeur lui donne
  son `id` et sa version, sa lecture de fond, son rechargement, `draft.saving` et l'existence de
  modifications ; le parcours déclare `staleRejectedByApi`. `isStaleVersion()` (409) est commun aux
  trois éditeurs.
- `AdminEditorFrame`, déjà commun aux trois éditeurs, porte la zone, le bouton et les deux
  dialogues (recharger, enregistrer par-dessus).
- Lectures de fond : `BlogGateway.getLatestAdminPost(id)` lit `/blog/posts/admin` **hors du cache
  partagé** (le relire réécrirait le brouillon, lié à la liste) ; `getProjectById(id, { background })`
  et `getProfile({ background })` existants. Recharger : relire le cache des articles, ou
  `reload()` de la ressource du projet et du parcours.
- `BlogPost` et `Project` portent `version` ; les gateways prennent la version attendue
  (`updatePost`, `updateProject`, `uploadCoverImage`, `uploadImage`) et la posent en `If-Match`
  (`shared/api/if-match.ts`). `EditorDraft` vide la couverture choisie quand une nouvelle version
  est chargée et passe l'entité écrite à l'envoi de la couverture.

**Protection de l'API contre l'écrasement silencieux (articles et projets) : livrée (2026-11-22,
ADR-0041).** Avant, `PATCH /api/blog/posts/:id` et `PATCH /api/projects/:id` écrivaient sans
condition : un brouillon parti d'une version périmée écrasait la version enregistrée ailleurs si
l'onglet n'avait pas été quitté puis retrouvé.

- Version : colonne entière `version` (`integer NOT NULL DEFAULT 1`) sur `blog_post` et `project`,
  plutôt que `updatedAt`, que JSON tronque à la milliseconde alors que PostgreSQL la garde à la
  microseconde. Migration `0037_content_version.sql`, en expansion seule. Incrémentée dans le même
  `UPDATE` par le `PATCH` (couverture retirée comprise), l'envoi de couverture et, pour un projet,
  chaque écriture de galerie (dans la transaction de la capture) ; le « j'aime » ne la change pas.
- Contrat : `PATCH` et `POST …/image` acceptent un en-tête facultatif `If-Match: "<version>"`
  (ETag fort ; `*`, liste, `W/` ou valeur sans guillemets ⇒ 400). Présent, l'écriture devient
  conditionnelle (`UPDATE … WHERE id = :id AND version = :version`) ; aucune ligne écrite alors que
  l'entité existe ⇒ **409** « Une version plus récente de cet article (ce projet) a été enregistrée
  ailleurs : recharge-le avant d'enregistrer. », comme le parcours (et non 412 : ADR-0041) ; entité
  supprimée ⇒ 404. Absent ⇒ comportement d'avant. `version` est dans toutes les réponses (lectures,
  listes, écritures) et `ETag: "<version>"` sur les réponses d'une entité.
- Compatibilité : en-tête facultatif, aucun client existant ne casse ; l'API de `master` fonctionne
  sur la base migrée (vérifié : lectures, `PATCH`, création).

**Limites.** Un rechargement d'article qui échoue (relecture du cache, silencieuse) laisse
l'avertissement affiché, sans erreur : l'action peut être relancée. Un rechargement de projet ou de
parcours qui échoue montre l'état d'erreur de l'éditeur, comme un premier chargement. Le brouillon
d'article reste lié au cache partagé de la liste : la relecture que déclenche l'écriture (gateway)
peut réécrire ce qui a été saisi juste après un enregistrement, couverture choisie dans cette
fenêtre comprise. Une saisie faite entre la confirmation du rechargement et l'arrivée des données
est écrasée par la version chargée. Une écriture de galerie réussie côté API mais dont la réponse
s'est perdue n'est pas comptée par l'onglet : le prochain enregistrement du projet reçoit 409.
Une écriture de galerie faite depuis l'onglet efface un avertissement déjà affiché ; le retour
suivant sur l'onglet, ou le prochain enregistrement (409), le rétablit. Pendant le déploiement,
l'ancienne API écrit sans incrémenter la version. Le seuil d'altitude du checker est dépassé par
l'éditeur de projet (295 lignes, 273 avant ce changement) ; le parcours est à 257 (261 avant).
Aucun découpage n'a été fait ici.

## Journal des tranches

- **Tranche 1 — relecture en échec du cache partagé** : GREEN 3386 passed / 3386 total · refactor : aucun
- **Tranche 2 — invalidation dans les gateways** : GREEN 3386 passed / 3386 total · refactor : invalidations des pages et doublons `invalidateFeatured`/`invalidateBundle` retirés, tests de pages recentrés sur leur contrat
- **Tranche 3 — écrans de l'admin relus au retour** : GREEN 3401 passed / 3401 total · refactor : aide de test `shared/testing/tab-visibility.ts` partagée par les nouveaux tests
- **Tranche 4 — pages publiques relues au retour** : GREEN 3407 passed / 3407 total · refactor : aucun
- **Tranche 5 — relecture de fond silencieuse** : GREEN 3421 passed / 3421 total · refactor : aucun
- **Tranche 6 — intervalle de 15 s dans l'admin** : GREEN 3425 passed / 3425 total · refactor : aucun
- **Tranche 7 — réponse refusée, file recomptée** : GREEN 3432 passed / 3432 total · refactor : opérateur `recountWhenStale` partagé par `recountWhenSettled` et `reply`
- **Tranche 8 — version plus récente, éditeur d'article** : GREEN 3450 passed / 3450 total · refactor : aucun
- **Tranche 9 — version plus récente, éditeur de projet** : GREEN 3457 passed / 3457 total · refactor : aucun
- **Tranche 10 — version plus récente et 409, éditeur du parcours** : GREEN 3462 passed / 3462 total · refactor : test du refus 409 commun (`isStaleVersion`) au toast et à l'avertissement
- **Tranche 11 — écrasement confirmé, garde sur l'id, état « rechargée », relectures superflues** : GREEN 3474 passed / 3474 total · refactor : `editedVersion` partagé par les éditeurs d'article et de projet ; rechargement et état « rechargée » déplacés du cadre vers `NewerVersionCheck`
- **Tranche 12 — version des articles et des projets, `If-Match`, 409** : API GREEN 1384 passed (dont 18 sur Postgres), parité 250 passed, web GREEN 3496 passed / 3496 total · refactor : `isStaleVersion` commun aux trois éditeurs

## Verify

2026-11-22 : image `j-ned-app-web:ci` sur `ci/image-stack.sh` (doublure de l'API, session admin de
la doublure), Chromium headless (Playwright 1.64), viewport 1280×900, appels à l'API de production
relayés vers la doublure, CSP contournée (`bypassCSP`).

1. **Même onglet** : `/admin` (navigation « 3 non lus »), navigation interne vers `/`, envoi du
   formulaire de contact (« Message bien reçu »), navigation interne vers `/admin` ⇒ « 4 non lus »
   sans rechargement.
2. **Retour sur l'onglet** : `/admin/messages` ouverte ; un message envoyé depuis un autre onglet ;
   la boîte affiche toujours 5 messages ; `visibilitychange` (caché puis visible) ⇒ 6 messages,
   « Sacha Ailleurs » en tête, navigation « 5 non lus ».
3. **Retour sur l'onglet, page publique** : `/about` ouverte ; `PUT /api/profile` sur la doublure ;
   `visibilitychange` ⇒ le résumé du parcours affiche la nouvelle version.

Verdict : **PASS**. Captures (scratchpad de la session, non versionnées) :
`1-meme-onglet-compteur.png`, `2-retour-boite.png`, `3-retour-about.png`. Console : seulement
`GET /api/config` en 404 (route absente de la doublure, déjà notée en spec 040) ; aucune erreur
Angular ni d'hydratation. `ci/smoke.sh` et `pnpm a11y` (75 scénarios) verts sur la même image.

2026-11-22, éditeurs : image construite depuis cette branche sur `ci/image-stack.sh`, même harnais
(scénario `newer version saved elsewhere…` de `e2e/a11y/interactive-states.spec.ts`, clair et
sombre). `/admin/profile` ouverte, titre modifié ; `PUT /api/profile` sur la doublure (l'« autre
onglet ») ; `visibilitychange` ⇒ l'avertissement s'affiche (`role="status"`), le champ garde son
brouillon et le focus ; « Recharger la dernière version » ⇒ dialogue « 1 modification non
enregistrée du parcours sera perdue » ; confirmation ⇒ titre de la version enregistrée, « Dernière
version chargée. » focalisée. axe : zéro violation sur l'avertissement et sur le dialogue. Verdict :
**PASS**. Captures (scratchpad, non versionnées) : `clair-version-plus-recente.png`,
`sombre-recharger-confirmation.png`, `clair-version-rechargee.png`. `ci/smoke.sh` et `pnpm a11y`
(77 scénarios) verts. Console : non relue scénario par scénario (le harnais n'échoue pas sur une
erreur de console).

2026-11-22, éditeurs d'article et de projet (preuve du `code-reviewer`, sur l'image de la branche
avant les corrections qui suivent) : Chromium, même harnais et même doublure. Article : retour sur
l'onglet après une écriture « ailleurs » ⇒ avertissement ; « Recharger la dernière version » ⇒
version enregistrée chargée. Projet : même parcours ⇒ « Dernière version chargée. », brouillon
remplacé, « Aucune modification ». axe : aucune violation. Console : seulement `GET /api/config` en
404 (route absente de la doublure). Verdict : **PASS**. Captures :
`/tmp/claude-1000/-home-j-ned-Projects-j-ned-app/bfee6a5f-c770-499f-8a82-1dcf1be822c0/scratchpad/verify/article-1-avertissement.png`,
`/tmp/claude-1000/-home-j-ned-Projects-j-ned-app/bfee6a5f-c770-499f-8a82-1dcf1be822c0/scratchpad/verify/article-2-recharge.png`,
`/tmp/claude-1000/-home-j-ned-Projects-j-ned-app/bfee6a5f-c770-499f-8a82-1dcf1be822c0/scratchpad/verify/projet-recharge.png`.
La confirmation d'écrasement, la garde sur l'`id`, l'état « rechargée » et le focus après un
rechargement en échec (commit suivant) sont prouvés par les tests unitaires seulement : l'image
n'a pas été reconstruite.
