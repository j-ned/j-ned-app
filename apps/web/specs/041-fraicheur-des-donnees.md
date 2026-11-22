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
  projets passent par leur cache partagé : le compteur de la navigation suit.
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
   `CommentsGateway` (publier, supprimer, et un refus 404/409 qui dit que la file a changé). Les
   invalidations des pages disparaissent, ainsi que les doublons `invalidateFeatured` (projets) et
   `invalidateBundle` (home).
3. **`keepShownOnFailedReload(resource)`** (`shared/api/keep-shown-on-failed-reload.ts`) : opérateur
   posé dans le `stream` d'une `rxResource`. Pendant `reload()`, la ressource porte encore sa valeur
   (`reloading`) ; si la relecture échoue, l'opérateur la réémet au lieu de l'erreur. Un premier
   chargement en échec reste une erreur. Utilisé par chaque écran relu sans cache partagé, et par la
   file de modération.
4. **Écrans relus au retour** (liste ci-dessus), tous par `refreshWhenVisible`, inchangé.
5. La vue d'ensemble n'affiche le squelette des messages que si rien n'est encore affiché : une
   relecture ne fait pas clignoter la liste.
6. La doublure de l'API (`ci/api-stub`) reçoit `POST /api/contact/messages`, gardé en mémoire, pour
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
  relire écraserait la saisie. Proposition non implémentée : au retour sur l'onglet, relire l'entité
  en arrière-plan et, si sa version (`updatedAt`, ou `version` pour le parcours) diffère de celle
  éditée, afficher « Une version plus récente existe » avec un bouton pour la charger. Le parcours
  refuse déjà une version périmée à l'enregistrement (409).
- **Article ouvert** : son corps est rendu une fois (`@defer (hydrate never)`) ; seule sa discussion
  est relue (spec 040). **Home** : la vitrine des projets suit le cache partagé quand une écriture a
  lieu dans l'onglet, mais une home ouverte n'est pas relue au retour.
- **Audience** : statistiques relues à chaque visite de l'écran, pas au retour.
- **Vue d'ensemble** : au retour, seuls les derniers messages (et, via la navigation, les non-lus)
  sont relus ; ses chiffres de projets et d'articles suivent les écritures de l'onglet.

## Limites

- Navigation de l'admin sur l'éditeur d'article : les compteurs de projets et d'articles ne sont
  pas relus au retour ; ils le sont dès que la liste correspondante ou la vue d'ensemble s'ouvre.
- Une relecture qui échoue est muette : l'écran garde une version peut-être périmée, sans le dire.
  La relecture suivante (retour, filtre, écriture) la remplace.
- Une suppression ou un « marquer lu » en cours peut croiser une relecture de la boîte de réception
  ou de la file de modération ; la relecture suivante remet l'état du serveur (même limite que la
  PR D pour les commentaires).
- Le téléchargement du CV suit la même URL ; l'API n'envoie pas d'en-tête de cache et la doublure ne
  la reproduit pas : l'absence de copie périmée dans le cache du navigateur n'est pas vérifiée.

## Journal des tranches

- **Tranche 1 — relecture en échec du cache partagé** : GREEN 3386 passed / 3386 total · refactor : aucun
- **Tranche 2 — invalidation dans les gateways** : GREEN 3386 passed / 3386 total · refactor : invalidations des pages et doublons `invalidateFeatured`/`invalidateBundle` retirés, tests de pages recentrés sur leur contrat
- **Tranche 3 — écrans de l'admin relus au retour** : GREEN 3401 passed / 3401 total · refactor : aide de test `shared/testing/tab-visibility.ts` partagée par les nouveaux tests
- **Tranche 4 — pages publiques relues au retour** : GREEN 3407 passed / 3407 total · refactor : aucun

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
