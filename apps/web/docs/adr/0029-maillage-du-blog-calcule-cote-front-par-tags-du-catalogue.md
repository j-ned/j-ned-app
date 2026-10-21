# ADR-0029 — Maillage du blog calculé côté front, un article déclare son projet par un tag du catalogue

- **Statut** : accepté (2026-10-21, appliqué par la PR 3 de la spec 030)
- **Date** : 2026-10-21
- **Contexte spec** : `specs/030-adr-en-articles.md`
- **Prolonge** : ADR-0011 (thèmes dérivés du catalogue de tags), ADR-0019 (donnée éditoriale statique
  indexée par slug, seuil de migration vers l'API)
- **Préserve** : ADR-0024 (pages de contenu rendues à la requête, 503 sur lecture d'API en échec)

## Context

La spec 030 demande trois liens dans le HTML servi : jusqu'à trois articles proches sur la page d'un
article, un lien de l'article vers la fiche du projet dont il parle, et la liste des articles d'un
projet sur sa fiche. Rien ne relie aujourd'hui un article à un projet.

Faits vérifiés (2026-10-21) :

- `blog_post.tags` est un `text[]` libre (15 au plus, 50 caractères chacun) ; `project.tags` décrit la
  stack du projet (`Angular`, `NestJS`, `TailwindCSS`…), sans rapport avec les tags du blog.
- La page article charge **déjà** toute la liste publiée (`BlogGateway.getPublishedPosts()`, pour
  « article précédent / suivant ») ; elle est dans le HTML servi et dans l'état de transfert
  (47 566 octets de `ng-state` sur un article en production, pour 3 articles, Markdown compris).
- L'API ne propose ni filtre par tag, ni liste allégée sans `contentMarkdown`.
- Le catalogue (`BLOG_TAGS_BY_CATEGORY`) range déjà `DashFlow` dans le thème « Projets ». Un tag du
  catalogue s'ajoute par un commit front (ADR-0011).
- Toute lecture d'API en échec pendant le rendu serveur passe la page en 503, et nginx sert alors sa
  dernière copie (`ssrUpstreamInterceptor`, ADR-0024 §3).
- Les projets en production : `dashflow`, `candidash`, `le-vieux-comptoir`, `coaching-life`,
  `labelsync-pro`, `gitpush-auto`. Le portfolio lui-même n'a pas encore de fiche ; le propriétaire
  la crée dans l'admin (arbitrage du 2026-10-21) pour y rattacher les articles tirés des ADR.

## Decision

1. **Les articles proches sont calculés par le front** (`relatedPosts`, fonction pure du domaine
   blog), sur la liste publiée que la page article charge déjà : aucun appel d'API ajouté. Score =
   nombre de tags partagés + nombre de thèmes partagés ; un candidat à score nul n'est pas proposé ;
   tri par score décroissant, puis date de publication décroissante, puis slug ; trois au plus.
2. **Un article déclare son projet par un tag du catalogue** qui nomme ce projet. La correspondance
   tag → slug de projet est une table statique du domaine blog, `PROJECT_TAGS`, et le thème
   « Projets » du catalogue **dérive** de cette table : un tag de projet est par construction un tag
   du catalogue, rangé dans « Projets ». Le rattachement d'un article se fait dans l'admin, par ses
   tags, sans commit.
3. **La page article n'appelle pas l'API des projets** : le lien vers la fiche se construit depuis la
   table (le tag est le nom affiché du projet, le slug donne l'URL).
4. **La fiche projet lit la liste publiée du blog seulement si son slug figure dans la table** :
   `rxResource` dont les `params` valent `undefined` pour un projet sans tag, donc aucune requête ni
   état de transfert supplémentaire pour les autres fiches.
5. **Données structurées** : `BlogPosting.about` cite le projet lié (`CreativeWork`, nom et URL de la
   fiche) ; `CreativeWork.subjectOf` liste les articles du projet (`BlogPosting`, titre et URL). Ni
   `isBasedOn` vers les ADR, ni articles proches dans le JSON-LD.
6. **Pas d'évolution d'API** pour cette spec.

## Consequences

- Ajouter un projet au maillage (premier article sur un nouveau projet) demande un commit front : une
  ligne dans `PROJECT_TAGS`. Rattacher un article à un projet déjà connu se fait dans l'admin.
- Une entrée de `PROJECT_TAGS` suppose que la fiche existe **en production avant** le déploiement
  qui l'ajoute (sinon lien 404) ; son slug, dérivé du titre par l'API, se vérifie par
  `GET /api/projects` avant le merge.
- Couplage par slug, comme ADR-0019 : si le slug d'un projet change dans l'admin, le lien de l'article
  pointe vers une fiche absente (404) tant que la table n'est pas corrigée. Changer un slug casse déjà
  les URL indexées ; on l'accepte au même titre.
- Un tag mal orthographié (« Candidash » au lieu de « CandiDash ») reste un tag libre : ni thème, ni
  lien. La correction se fait sur l'article, dans l'admin.
- Les fiches `dashflow`, `candidash` et `portfolio` embarquent la liste publiée du blog dans leur état de
  transfert (environ 15 Ko par article publié, Markdown compris). La page article l'embarquait déjà.
- Les articles proches dépendent de la qualité des tags : un article ne portant que des tags
  génériques (`Angular`, `TypeScript`) est proche de presque tout.
- **Seuils de migration** :
  - vers une colonne API (`blog_post.project_id`, clé étrangère, choix dans l'admin) si plus de la
    moitié des projets ont un article, ou si le propriétaire veut rattacher un article à un projet
    sans commit ;
  - vers une liste allégée côté API (sans `contentMarkdown`, avec un nombre de mots pour le temps de
    lecture) si le `ng-state` d'une page de contenu dépasse 100 Ko, ce qui arrivera vers 7 articles
    publiés indépendamment de cette spec.

## Alternatives considered

- **Colonne `project_id` sur `blog_post`** : intégrité référentielle, choix dans l'admin, aucun commit
  par projet. Mais PR API, migration, champ admin et ordre de déploiement API puis front pour trois
  projets concernés aujourd'hui. Écarté sous le seuil (YAGNI, même raisonnement qu'ADR-0011 pour le
  champ thème).
- **Correspondance à l'exécution entre un tag et le titre d'un projet** (insensible à la casse) : pas
  de table, mais la page article devrait charger les projets (un appel de plus, donc une cause de 503
  de plus), un renommage de titre casserait le lien en silence, et la casse divergente existe déjà.
  Écarté.
- **Correspondance par les tags de projet** (`project.tags` ∩ `blog_post.tags`) : ces tags décrivent
  la stack ; presque tout article relierait presque tout projet. Écarté.
- **Articles proches calculés par l'API** (`GET /blog/posts/:slug/related`) : duplique le catalogue
  et ses thèmes, qui sont une donnée du front, et ajoute un appel par rendu. Écarté.
- **Liens ajoutés dans le navigateur après hydratation** : absents du HTML servi, contraire à
  l'exigence 7. Écarté.
- **`isBasedOn` vers les ADR** : demanderait de stocker les ADR sources de chaque article (champ API
  ou table par slug) pour un effet nul sur les résultats enrichis ; les ADR sont cités dans le corps
  de l'article. Écarté.
