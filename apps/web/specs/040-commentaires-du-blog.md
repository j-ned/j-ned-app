# Commentaires du blog sans compte tiers

## Description

Les articles du blog s'adressent autant à des tourneurs CN qu'à des développeurs. Les commentaires
passent aujourd'hui par Giscus, qui exige un compte GitHub : une partie du lectorat ne peut pas
écrire. Le dépôt ne contient aucune discussion, il n'y a donc rien à migrer.

Besoin : un lecteur laisse un commentaire sous un article avec son nom et son e-mail, sans créer de
compte. Rien n'est publié sans la validation du propriétaire du site.

Décisions du propriétaire (2026-11-21) :

- le commentateur donne un **nom** et un **e-mail** ; l'e-mail n'est jamais affiché ;
- **un seul niveau de réponse** sous un commentaire ;
- le propriétaire est **prévenu par e-mail** de chaque commentaire en attente.

Décision du propriétaire (2026-11-22) : **refuser un commentaire, c'est le supprimer**, avec ses
réponses, immédiatement. Aucun commentaire refusé n'est conservé (cf. Points à trancher n° 3).

Hypothèses retenues en l'absence de décision, à confirmer :

- modération **avant publication** pour tout ce qu'écrit un visiteur, commentaire ou réponse ;
- un visiteur peut répondre à un commentaire publié, comme le propriétaire ; la réponse du
  propriétaire est publiée directement depuis l'admin et signalée comme celle de l'auteur ;
- le commentateur peut demander à être prévenu par e-mail quand on répond à son commentaire, par un
  consentement explicite et facultatif ;
- texte brut, sans Markdown ni lien cliquable ;
- Giscus est retiré : composant, configuration, origines CSP et mention de la politique de
  confidentialité.

## Critères d'acceptation

### Lecteur

1. Sous un article publié, la liste des commentaires publiés s'affiche du plus ancien au plus
   récent, chaque réponse sous son commentaire. Elle fait partie du HTML rendu par le serveur.
2. Sans commentaire, un état vide invite à écrire le premier.
3. Le formulaire demande un nom, un e-mail et un message. Les erreurs de saisie sont annoncées près
   du champ, comme sur le formulaire de contact.
4. Après l'envoi, le lecteur lit que son commentaire sera publié après validation. Le commentaire
   n'apparaît pas dans la liste.
5. Un lecteur peut répondre à un commentaire publié ; il ne peut pas répondre à une réponse.
6. L'e-mail d'un commentateur n'apparaît dans aucune réponse de l'API publique ni dans le HTML.
7. Un envoi trop fréquent, un champ piège rempli ou un article inexistant ou non publié est refusé
   sans rien enregistrer ; un envoi refusé pour débit est annoncé comme tel.
8. Toute l'interface est utilisable au clavier et annoncée par un lecteur d'écran (formulaire,
   confirmation, erreurs, structure de la liste).

### Propriétaire

9. Chaque commentaire en attente déclenche un e-mail de notification, comme un message de contact ;
   un échec d'envoi n'empêche pas l'enregistrement du commentaire.
10. L'admin liste les commentaires en attente et publiés, avec l'article concerné, le nom et
    l'e-mail du commentateur.
11. Le propriétaire publie, refuse ou supprime un commentaire ; supprimer un commentaire supprime
    ses réponses, après confirmation.
12. Le propriétaire répond à un commentaire publié depuis l'admin ; sa réponse est publiée
    immédiatement et signalée comme celle de l'auteur du site.
13. Le nombre de commentaires en attente est visible dans la navigation de l'admin.

### Données et sécurité

14. Le contenu d'un commentaire est affiché comme du texte : aucune balise n'est interprétée.
15. La politique de confidentialité décrit les données collectées (nom, e-mail, message), leur
    finalité, leur durée de conservation et le moyen de demander leur suppression ; la mention de
    Giscus disparaît.
16. La CSP ne cite plus `https://giscus.app`.
17. Supprimer un article supprime ses commentaires.

## Plan technique

Décision structurante : cf. ADR-0040 (commentaires hébergés par l'API, modérés avant publication,
retrait de Giscus). Ce plan s'en tient aux décisions de la `## Description` ; les écarts proposés
sont dans « Points à trancher », à la fin.

### Architecture

```
Lecteur ── GET /blog/:slug (nginx, micro-cache 1 s) ── rendu Node
                                                         ├─ GET /api/blog/posts/:slug            (existant)
                                                         └─ GET /api/blog/posts/:slug/comments   (nouveau, transfer cache)
Lecteur ── POST /api/blog/posts/:slug/comments ── API ── blog_comment (pending) ── Resend → propriétaire
Admin   ── /admin/comments ── GET|PATCH|DELETE /api/blog/comments… , POST /api/blog/comments/:id/replies
```

- **API** : nouveau module `apps/api/src/blog-comments/`, branché dans les routes du blog
  existantes (`blog.routes.ts`) ; aucune nouvelle racine sous `/api`.
- **Front** : nouvelle feature `features/comments/` (domaine, gateway, composants), consommée par
  la page `blog-detail` (section publique) et par l'admin (`features/admin/pages/admin-comments/`,
  compteur de la navigation), sur le modèle de `features/contact` consommée par `admin-messages`.
- **Landmarks** : la section des commentaires est une `<section aria-labelledby>` dans le `main`
  du shell, après l'`<article>` de l'article (comme aujourd'hui `<app-blog-comments>`). Elle
  n'émet ni `header`, ni `footer`, ni `main`. Chaque commentaire est un `<article>` (élément de
  contenu autonome, pas un landmark).
- **Cache** : aucune invalidation à écrire. Le HTML des articles est servi par le micro-cache nginx
  d'une seconde, sans purge (`apps/web/Dockerfile`, snippet `ssr-cache.conf`, ADR-0038) ; l'API ne
  pose pas de cache sur ses lectures. Un commentaire publié apparaît au plus 2 s plus tard. Le
  transfer cache sérialise déjà toute lecture sous `/api/blog/posts` (`PUBLIC_READ_PATHS`,
  `app.config.ts`) : la liste n'est pas relue après hydratation.

### Modèle de données (API)

Table `blog_comment`, schéma Drizzle `apps/api/src/database/schema/blog-comments.ts`, ajoutée au
barrel `schema/index.ts`. Style des contraintes : `login-events.ts` (`check()` nommé, union
`as const` partagée entre le type et le `CHECK`).

| Colonne         | Type                                           | Contrainte / rôle                                                                         |
| --------------- | ---------------------------------------------- | ----------------------------------------------------------------------------------------- |
| `id`            | `uuid` PK, `gen_random_uuid()`                 |                                                                                           |
| `post_id`       | `uuid NOT NULL`                                | FK `blog_post(id) ON DELETE CASCADE` (critère 17)                                         |
| `parent_id`     | `uuid NULL`                                    | `NULL` : commentaire ; sinon : réponse                                                    |
| `depth`         | `smallint NOT NULL DEFAULT 0`                  | `CHECK (depth IN (0,1))`, `CHECK ((parent_id IS NULL) = (depth = 0))`                     |
| `parent_depth`  | `smallint NULL`                                | `CHECK (parent_depth = 0)`, `CHECK ((parent_id IS NULL) = (parent_depth IS NULL))`        |
| `status`        | `text NOT NULL DEFAULT 'pending'`              | `CHECK (status IN ('pending','published'))` ; refuser = supprimer la ligne                |
| `moderated_at`  | `timestamptz NULL`                             | `CHECK ((status = 'pending') = (moderated_at IS NULL))`                                   |
| `author_kind`   | `text NOT NULL`                                | `CHECK (author_kind IN ('visitor','owner'))`                                              |
| `author_name`   | `text NULL`                                    | visiteur : `NOT NULL`, 2 à 80 caractères ; propriétaire : `NULL`                          |
| `author_email`  | `text NULL`                                    | visiteur : `NOT NULL` ; propriétaire : `NULL`                                             |
| `sender_hash`   | `text NULL`                                    | HMAC de `quotaAddress(ip)` (IPv4, ou son /64 en IPv6, comme le quota) ; propriétaire : `NULL` |
| `body`          | `text NOT NULL`                                | `CHECK (char_length(body) BETWEEN 2 AND 2000)`                                            |
| `created_at`    | `timestamptz NOT NULL DEFAULT now()`           | ordre d'affichage                                                                         |

Contraintes composées :

- `UNIQUE (id, post_id, depth)` nommée `blog_comment_thread_key`, cible de la clé suivante ;
- **un seul niveau, garanti par la base** : `FOREIGN KEY (parent_id, post_id, parent_depth)
  REFERENCES blog_comment (id, post_id, depth) ON DELETE CASCADE` (`MATCH SIMPLE`, défaut : une
  ligne sans parent n'est pas contrôlée). `parent_depth` vaut toujours 0 : le parent a donc
  `depth = 0`, une réponse à une réponse viole la clé ; le parent porte le même `post_id` ; la
  suppression d'un commentaire supprime ses réponses (critère 11). Drizzle 0.45 :
  `foreignKey({ columns: [t.parentId, t.postId, t.parentDepth], foreignColumns: [t.id, t.postId,
  t.depth] }).onDelete('cascade')` et `unique('blog_comment_thread_key').on(t.id, t.postId,
  t.depth)` (signatures vérifiées dans `node_modules/drizzle-orm/pg-core`) ;
- auteur : `CHECK ((author_kind = 'visitor') = (author_name IS NOT NULL AND author_email IS NOT
  NULL))`, `CHECK (author_kind = 'visitor' OR sender_hash IS NULL)`, `CHECK (author_kind =
  'visitor' OR status <> 'pending')` (le propriétaire n'attend pas sa propre validation).

Index :

- `blog_comment_post_status_created_idx (post_id, status, created_at)` : lecture publique, et
  couvre la cascade depuis `blog_post` (colonne de tête) ;
- `blog_comment_parent_idx (parent_id)` : réponses d'une page de commentaires, et cascade depuis
  le parent (Postgres n'indexe pas le côté référençant) ;
- `blog_comment_status_created_idx (status, created_at)` : liste de l'admin, compteur, plafonds.

Union discriminée côté TypeScript (types dérivés du schéma Drizzle, puis rétrécis dans le service) :

```ts
type CommentAuthor =
  | { readonly kind: 'visitor'; readonly name: string; readonly email: string }
  | { readonly kind: 'owner' };
type CommentModeration =
  | { readonly status: 'pending' }
  | { readonly status: 'published'; readonly moderatedAt: Date };
```

Un mappeur `toCommentRecord(row)` rétrécit une ligne (`author_kind`, colonnes nullables) en ces
unions et lève une erreur sur une ligne incohérente (impossible tant que les `CHECK` tiennent).

**E-mail en clair** : le propriétaire doit pouvoir écrire au commentateur (critère 10) ; une
empreinte ne le permettrait pas. Il ne quitte la base que vers l'admin et vers la notification du
propriétaire. **Conservation** : celle du commentaire (cf. Vie privée). **Consentement à la
notification** : aucune colonne en première version (cf. E-mails) ; l'ajout futur sera une colonne
nullable, migration additive.

**Migration** `apps/api/drizzle/0036_blog_comment.sql` (générée par `pnpm db:generate`, renommée,
commentée en tête comme `0029_contact_sender.sql`). Relire le SQL généré : la contrainte `UNIQUE`
doit précéder la clé étrangère composite. Expand pur : une table neuve, aucune colonne existante
touchée ; une image antérieure de l'API l'ignore. Retour arrière : redéployer le tag
`sha-<commit>` précédent (la table reste, inerte). Abandon définitif : migration de contraction
`DROP TABLE "blog_comment"` dans une PR ultérieure, après export des commentaires publiés.

### Contrat HTTP (API)

Toutes les entrées passent par `jsonBody` / `queryParams` / `uuidParam` (`common/http.ts`), objets
`z.strictObject` (400 sur champ inconnu), erreurs au format de `common/http-errors.ts`.

**Public**, dans `blogPostsRoutes` (`blog/blog.routes.ts`), à côté de `/:slug/like` :

| Méthode | Chemin                          | Quota                 | Réponse                                                                                     |
| ------- | ------------------------------- | --------------------- | ------------------------------------------------------------------------------------------- |
| GET     | `/blog/posts/:slug/comments`    | `PUBLIC_READ_THROTTLE` | 200 `PaginatedResult<PublicComment>` ; 404 si l'article n'est pas publié                    |
| POST    | `/blog/posts/:slug/comments`    | `COMMENT_THROTTLE`    | 202 sans corps ; 400, 404, 409, 413, 429, 503                                               |

- **GET** : `?page&limit` par `paginationSchema` / `parsePagination` (`common/pagination.ts`,
  limite ≤ 100). La pagination porte sur les **commentaires** publiés (`depth = 0`), triés par
  `created_at ASC` ; chacun embarque **toutes** ses réponses publiées, triées de même. Une
  réponse dont le parent n'est pas publié n'est jamais renvoyée. Deux requêtes (page de
  commentaires + `count`, puis réponses `WHERE parent_id IN (…)`), pas de N+1.
- **Sortie publique, sans e-mail par construction** : `blog-comments/public-comment.ts` déclare
  `publicCommentPageSchema` (Zod, `z.object`, qui retire toute clé non déclarée) ; la route
  renvoie `publicCommentPageSchema.parse(page)`. Le type `PublicComment` en dérive (`z.infer`).
  La requête ne sélectionne de toute façon ni `author_email` ni `sender_hash` (liste de colonnes
  fermée, comme `toBlogPostSummary`). Forme :

  ```json
  {
    "data": [
      {
        "id": "uuid",
        "author": { "kind": "visitor", "name": "Camille" },
        "body": "texte brut",
        "createdAt": "2026-11-21T10:00:00.000Z",
        "replies": [
          { "id": "uuid", "author": { "kind": "owner" }, "body": "…", "createdAt": "…" }
        ]
      }
    ],
    "total": 1,
    "page": 1,
    "limit": 100
  }
  ```

- **POST** : corps `createCommentSchema = z.strictObject({ name, email, body, parentId?, website?
  })`.
  - `name` : `z.string().trim()`, 2 à 80, sans caractère de contrôle, sans caractère de format
    (`\p{Cf}` : largeur nulle, contrôles bidirectionnels, marque d'ordre), sauf le ZWJ `U+200D` qui
    compose les émojis, sans moitié de paire UTF-16 isolée, et avec au moins un caractère visible
    (lettre, chiffre, ponctuation ou symbole, hors remplissages hangul et cellule braille vide) ;
  - `email` : `z.email().max(320)` (comme le contact) ;
  - `body` : retours chariot normalisés en `\n`, `trim()`, 2 à 2 000, sans caractère de contrôle
    hors `\n` et `\t`, mêmes règles que le nom pour les caractères de format, les moitiés de
    paire isolées et le caractère visible. Les chevrons sont **acceptés** : un
    développeur cite `<app-root>` ; l'affichage par interpolation les neutralise. On ne reprend
    donc pas le refus du balisage HTML de `profile` ;
  - `parentId` : `z.uuid()` facultatif ;
  - `website` : champ piège, `z.string().max(200).optional()` (copie de
    `create-contact-message.dto.ts`).

  Ordre de traitement, dans le service : champ piège rempli → **202, rien d'écrit ni d'envoyé**
  (journal `warn`, comme `ContactService.create`) ; article inconnu ou non publié → 404 ; parent
  absent, d'un autre article ou en attente → 404 (aucune fuite sur l'existence d'un commentaire
  en attente) ; parent qui est une réponse → 409 ; plafond de l'expéditeur atteint → 429 ; plafond
  global atteint → 503 ; sinon insertion `pending`, puis notification (fire-and-forget), 202.
  Les filtres « article publié » sont partagés avec `BlogService` : la condition privée
  `publishedSlugFilter` sort dans `blog/published-post.ts` (fonction exportée), réutilisée par les
  deux services.

**Admin**, sous-application `/blog/comments` montée dans `blogRoutes` (`requireAuth` partout) :

| Méthode | Chemin                              | Quota                  | Réponse                                                                       |
| ------- | ----------------------------------- | ---------------------- | ----------------------------------------------------------------------------- |
| GET     | `/blog/comments?status&page&limit`  | défaut                 | 200 `PaginatedResult<AdminComment>`, `created_at DESC`                        |
| GET     | `/blog/comments/pending-count`      | défaut                 | 200 `{ count }`                                                               |
| PATCH   | `/blog/comments/:id`                | `ADMIN_WRITE_THROTTLE` | 200 `AdminComment` ; 404 ; 409 déjà publié ou parent non publié               |
| DELETE  | `/blog/comments/:id`                | `ADMIN_WRITE_THROTTLE` | 204 ; 404 ; refus ou suppression, réponses supprimées par la cascade          |
| POST    | `/blog/comments/:id/replies`        | `ADMIN_WRITE_THROTTLE` | 201 `AdminComment` ; 404 ; 409 parent non publié ; 409 parent qui est une réponse |

- `status` : `z.enum(['pending','published']).optional()`, ajouté à `paginationSchema` par
  `.extend()`.
- `AdminComment` : `{ id, post: { id, slug, title }, parent: { id, author, excerpt } | null,
  author: CommentAuthor, body, status, createdAt, moderatedAt, replyCount }` (jointure
  `blog_post`, auto-jointure par `alias()` de `drizzle-orm/pg-core` pour le parent, `count` des
  réponses en sous-requête).
- PATCH, corps `z.strictObject({ status: z.literal('published') })` : la seule transition est
  `pending → published`. Publier une réponse dont le parent n'est pas publié : 409. Republier : 409.
  **Refuser = `DELETE /blog/comments/:id`** : le commentaire et ses réponses disparaissent (cascade),
  y compris les réponses en attente, qui cessent donc de compter dans les plafonds.
- `ADMIN_WRITE_THROTTLE` (60/min, existant) sur les écritures : une session de modération dépasse
  vite les 10/min du quota par défaut.
- Ordre des routes : les chemins fixes (`/pending-count`) avant `/:id`, comme `/admin` avant
  `/:slug` dans `blogPostsRoutes`.

**Quotas et plafonds**, dans `blog-comments/comment-limits.ts` (et **pas** dans
`common/throttle.ts`, que le lot en cours modifie) :

- `COMMENT_THROTTLE: ThrottleConfig = { limit: 5, ttlMs: 3_600_000 }` : 5 envois par heure et par
  IP, clé de route propre (indépendante du quota du contact) ;
- `PENDING_PER_SENDER = 3` : au-delà, 429 ; compté en base sur `sender_hash` parmi les `pending`,
  donc insensible au redémarrage ;
- `PENDING_TOTAL = 100` : au-delà, 503 « commentaires momentanément fermés ». Ce plafond borne aussi
  le coût du comptage par expéditeur (au plus 100 lignes `pending` lues).

**Empreinte de l'expéditeur** : la dérivation de `ContactService` (clé `sha256('contact|' +
jwtSecret)`, HMAC de l'IP) sort dans `common/sender-hash.ts` (`senderHasher(secret, scope)`),
réutilisée par le contact (scope `contact`, empreintes inchangées) et par les commentaires (scope
`comments`).

**Tâche quotidienne** : inchangée. Un refus supprime immédiatement, aucune purge n'est à
programmer.

**Parité HTTP** (`packages/api-parity`) :

- `routes.ts` : `ADMIN_ROUTES` + les cinq routes admin ; `PUBLIC_READ_ROUTES` + `GET
  /api/blog/posts/parity-unknown-slug/comments` ; `PUBLIC_WRITE_ROUTES` + `POST
  /api/blog/posts/parity-unknown-slug/comments`. Accès, CSRF et 401 suivent automatiquement ;
- `throttle.spec.ts` : un 6ᵉ envoi de commentaire dans l'heure → 429 (corps invalides compris) ;
- nouveau `comments.spec.ts` : article créé par la session admin, commentaire posté, publié, puis
  lu : le JSON public ne contient ni la clé `email`, ni l'adresse envoyée (critère 6) ; champ piège
  rempli → 202 et file admin inchangée (critère 7) ;
- tableau « Ce qui est couvert » du README de la suite mis à jour.

### Anti-abus

Retenu : quota par IP, champ piège, plafond par expéditeur, plafond global, modération avant
publication, texte brut, bornes de longueur, refus des caractères de contrôle et bidirectionnels
(usurpation visuelle d'un nom), contrôle d'origine existant (`crossOriginProtection`).

Écarté, et pourquoi :

- CAPTCHA tiers (Turnstile, hCaptcha) : script et cookie tiers, friction ; la modération rend le
  spam invisible (ADR-0040) ;
- jeton signé posé au rendu pour imposer un délai minimal : secret partagé front/API pour un gain
  faible tant que rien n'est publié sans relecture ;
- refus des messages contenant des URL : un tourneur cite une référence fabricant ; la modération
  tranche. Les URL ne sont jamais cliquables : rendu par interpolation, sans autolien ;
- liste de mots interdits, filtrage bayésien : coût d'entretien, faux positifs, inutiles à ce
  volume.

### E-mails

- **Notification au propriétaire** (critère 9), première version. Nouveau gabarit Resend
  **`comment-notification`** (alias dans `mailer/mailer.constants.ts`,
  `COMMENT_NOTIFICATION_TEMPLATE`), envoyé à `OWNER_EMAIL` par `MailSender.sendMail` (échappement
  des variables déjà fait par `MailerService`). Variables : `NAME`, `SENDER_EMAIL`, `POST_TITLE`,
  `POST_SLUG` (le gabarit compose `https://nedellec-julien.fr/blog/{{{POST_SLUG}}}` et le lien vers
  `/admin/comments`), `PARENT_NAME` (vide pour un commentaire, nom du commentaire parent ou
  « l'auteur » pour une réponse), `MESSAGE`, `YEAR` (`EMAIL` est réservé par Resend). Objet :
  `Commentaire en attente : <titre>`. `replyTo` = adresse du commentateur, comme le contact.
  Échec non bloquant : `fireAndForget` (`common/utils.ts`) après l'insertion ; l'erreur est
  journalisée (donc remontée à Sentry), le commentaire reste dans la file. Aucune notification pour
  une réponse du propriétaire.
- **Notification au commentateur** : **hors première version**, spec ultérieure. Raisons :
  `ContactService` refuse déjà d'écrire à une adresse saisie (un tiers y met l'adresse d'une
  victime et fait envoyer un mail signé SPF/DKIM du domaine) ; le faire proprement exige une
  confirmation de l'adresse (double opt-in), un lien de désinscription sans suivi, et le traitement
  des rebonds par un webhook Resend signé (nouvelle route publique, nouvelle vérification de
  signature). Contenu minimal prévu le moment venu : titre de l'article, lien vers l'article, aucun
  texte saisi par un visiteur, aucun pixel ni lien de suivi ; un rebond dur efface l'adresse et le
  consentement. Le formulaire de la première version ne propose donc **pas** la case.

### Front

Arborescence (clean architecture du dépôt, règle « Contrats injectables » : une seule
implémentation HTTP ⇒ classe concrète, pas de port abstrait ; précédent :
`features/auth/infra/gateways/login-journal.gateway.ts`) :

```
features/comments/
├── domain/
│   ├── models/comment.model.ts          # unions : CommentAuthor, PublishedComment, CommentThread,
│   │                                    #   CommentDraft, CommentRejection, CommentSubmission (Result),
│   │                                    #   AdminComment (union sur status), ModerationStatus
│   └── can-reply.ts                     # (+ spec) règle pure : un commentaire publié, de profondeur 0
├── infra/
│   ├── comments.gateway.ts              # (+ spec, HttpTestingController) @Injectable({ providedIn: 'root' })
│   ├── comment.adapter.ts               # (+ spec) toCommentThread, toAdminComment, toCommentRejection(status)
│   └── comment.types.ts                 # DTO de l'API
├── application/
│   ├── comment-thread-view.ts           # (+ spec) presenter pur : libellés d'auteur, dates, ids d'ancres
│   ├── comment-copy.ts                  # textes : rejet → message, état vide, confirmation
│   └── components/
│       ├── comment-thread.ts            # (+ spec) section : titre, liste, formulaires, messages d'état
│       ├── comment-item.ts              # (+ spec) un commentaire ou une réponse
│       └── comment-form.ts              # (+ spec) Signal Forms, dumb
└── testing/
    ├── comment-builders.ts              # builders PublishedComment / AdminComment
    └── comments-fixtures.ts             # réponses d'API typées pour les specs du gateway et des pages
features/blog/pages/blog-detail/article-comments.ts   # (+ spec) coordinateur de la section, propre à la page
features/admin/pages/admin-comments/admin-comments.ts # (+ spec)
features/admin/application/admin-comments-view.ts     # (+ spec) presenter pur de la liste admin
features/admin/application/components/admin-comment-row.ts        # (+ spec) li[app-admin-comment-row]
features/admin/application/components/admin-comment-reply-form.ts # (+ spec) Signal Forms, dumb
features/admin/application/pager.ts                   # (+ spec) extrait de loginJournalPager
shared/forms/email-pattern.ts                         # EMAIL_PATTERN, extrait de contact-form.ts
core/ssr/ssr-upstream-interceptor.ts                  # + jeton OPTIONAL_UPSTREAM
```

**Gateway** `CommentsGateway` (concret) : `getThread(slug, page)`, `submit(slug, draft, parentId)
→ Observable<CommentSubmission>` (jamais d'erreur : statut HTTP → `CommentRejection` par
`toCommentRejection`, comme `toSubmissionError` du contact), `getAdminPage(status, page)`,
`moderate(id, status)`, `remove(id)`, `reply(id, body)`, `getPendingCount()` +
`invalidatePendingCount()` par `refreshable()` (`shared/api/refreshable.ts`, même montage que
`HttpContactGateway.unreadCount`). Contexte `silentErrors()` partout côté public et sur les
écritures admin (la page nomme l'échec elle-même).

`CommentRejection = 'invalid' | 'not-found' | 'conflict' | 'rate-limited' | 'closed' |
'unavailable' | 'network'` (400, 404, 409, 429, 503, 5xx, 0).

**Panne de la section sans panne de l'article** : `ssrUpstreamInterceptor` passe la page en 503
pour toute lecture en échec sauf 404 ; une régression des commentaires mettrait alors tous les
articles en 503 (copie périmée, puis 503 franc). Décision : jeton `OPTIONAL_UPSTREAM`
(`HttpContextToken<boolean>`, défaut `false`) exporté par l'intercepteur, posé par
`getThread` ; l'échec d'une telle lecture ne touche pas `RESPONSE_INIT.status`. La section affiche
alors « Les commentaires n'ont pas pu être chargés. » ; l'article reste en 200.

**Coordinateur de la section** `ArticleComments` (`pages/blog-detail/article-comments.ts`) :
classe instanciée par la page dans un champ (`new ArticleComments(this.slug)`, contexte
d'injection, précédent `PendingDeletion`), qui injecte `CommentsGateway` et `DestroyRef`. Ce
n'est ni un store (instance d'écran, pas de partage) ni un port.

- `thread` : `rxResource({ params: slug, stream: getThread(slug, 1) })`, page de 100 commentaires ;
- `view` : `computed(() => toCommentThreadView(...))` ;
- `replyTarget = signal<string | null>(null)` ; `openReply(id)`, `closeReply()` ;
- `submission = signal<SubmissionState>` avec
  `SubmissionState = { kind: 'idle' } | { kind: 'sending'; parentId: string | null } |
  { kind: 'sent'; parentId: string | null } | { kind: 'failed'; parentId: string | null;
  reason: CommentRejection }`, exposé `.asReadonly()` ;
- `resetToken = signal(0)` incrémenté à chaque succès ;
- `send(draft, parentId)`. Le commentaire envoyé n'est **pas** ajouté à la liste (critère 4).

**Rendu et hydratation** : dans `blog-detail.ts`, `<app-blog-comments>` est remplacé par

```html
@defer (hydrate on viewport; on viewport) {
  <app-comment-thread … />
} @placeholder { <!-- squelette CSS aux dimensions de la section --> }
```

précédent `app.ts` / `about.ts`. Au rendu serveur le bloc est rendu (déclencheurs `hydrate`), la
liste est dans le HTML (critère 1) ; au client il s'hydrate à l'approche, les événements sont
rejoués (`withEventReplay`). Lors d'une navigation client, il se rend à l'approche du viewport. La
lecture `GET …/comments` part dès la page (coordinateur dans la page), en parallèle de l'article.

**Composants** (dumb : `input()`/`output()`, aucune injection de gateway) :

- `comment-thread.ts` — `<section aria-labelledby="comments-heading">`, `<h2>` « Commentaires »
  avec le nombre, liste `<ol>` de `comment-item`, état vide (critère 2 : « Aucun commentaire pour
  l'instant. Écris le premier ! »), formulaire principal, `app-status-message` de confirmation ou
  d'échec. Après un succès, le focus va sur le message de confirmation (`tabindex="-1"`,
  `role="status"` posé par `StatusMessage`), par `afterRenderEffect({ write })` lu sur
  `submission()` ; après un échec, `role="alert"` (ton `error`) et le focus reste sur le bouton.
  Au-delà de 100 commentaires, une phrase signale que seuls les 100 premiers sont affichés (cf.
  Points à trancher).
- `comment-item.ts` — `<article [attr.aria-labelledby]>` : auteur en `<h3>` (`<h4>` pour une
  réponse), `<time [attr.datetime]>`, corps en interpolation `{{ }}` avec `whitespace-pre-line` et
  `[overflow-wrap:anywhere]` (critère 14 : jamais `[innerHTML]`). Réponse du propriétaire :
  nom de `SITE_IDENTITY` suivi d'une mention textuelle « auteur de l'article » (pas une couleur
  seule). Les réponses sont dans un `<ol aria-label="Réponses à <nom>">` imbriqué dans le `<li>`.
  Bouton « Répondre » (`aria-expanded`, `aria-controls`) seulement si `canReply` (critère 5).
- `comment-form.ts` — Signal Forms, modèle de `contact-form.ts` : `form(model, schema, {
  submission: { action → output submitted, onInvalid: focusFirstInvalid } })`, `[formRoot]`,
  `[formField]`, `app-field-error` sous chaque champ, `aria-invalid` / `aria-describedby`,
  `<fieldset>` + `<legend>` (« Laisser un commentaire » / « Répondre à <nom> »), champ piège
  `website` copié du contact (hors écran, hors tabulation, `aria-hidden`), note de
  confidentialité avec lien `/confidentialite`. Entrées : `idPrefix` (ids uniques : formulaire
  principal et formulaire de réponse coexistent), `legend`, `sending`, `resetToken` (+ `effect()`
  qui remet le modèle à vide). Bornes identiques à l'API : nom 2–80 (libellé « Nom ou pseudo »),
  e-mail requis + `EMAIL_PATTERN`, message 2–2 000. Bouton désactivé sur `sending()` seulement.
  Ouverture d'un formulaire de réponse : focus sur son premier champ (`afterNextRender`) ; Annuler
  ou Échap : fermeture et focus rendu au bouton « Répondre ».

**Messages** (`comment-copy.ts`, tutoiement) : confirmation « Merci ! Ton commentaire sera publié
après relecture. » ; `rate-limited` : « Trop d'envois en peu de temps. Réessaie dans une heure. »
(critère 7) ; `closed` : « Les commentaires sont momentanément fermés. Réessaie plus tard. » ;
`not-found` : « Cet article ou ce commentaire n'accepte plus de réponse. » ; `invalid`, `network`,
`unavailable` : repris du contact.

**Admin** :

- route `comments` dans `features/admin/admin.routes.ts` (lazy, titre « Commentaires ») ;
- `admin-nav-groups.ts` : clé `comments`, `link('comments', '/admin/comments', 'comment',
  'Commentaires', counts.pendingComments, 'en attente')` dans le groupe « Audience » ;
  `AdminNavCounts.pendingComments: number | null` ; `admin-layout.ts` ajoute
  `rxResource({ stream: () => commentsGateway.getPendingCount() })` (critère 13) ;
- page `admin-comments.ts` (modèle `admin-messages.ts` + `admin-logins.ts`) :
  `app-admin-page-header`, `app-filter-group` (En attente / Publiés), pagination serveur
  (`rxResource` sur `{ status, page }`), `app-admin-list-state`, liste `<ul role="list">` de
  `li[app-admin-comment-row]` (article lié, nom, e-mail en `mailto:`, extrait du parent, date par
  `receivedAgo` d'`admin-messages-view.ts`, statut en texte). Actions : Publier (succès : la ligne
  quitte le filtre courant, `invalidatePendingCount()`, toast), Refuser ou Supprimer (un seul appel,
  `DELETE`) par `PendingDeletion` + `app-confirm-dialog` dont le texte annonce le nombre de réponses
  supprimées
  (`replyCount`, critère 11), puis `focusTitle()` ; Répondre (commentaire publié de profondeur 0
  seulement) ouvre `admin-comment-reply-form` sous la ligne, la réponse créée s'affiche comme
  publiée (critère 12) ;
- `admin-comments-view.ts` : presenter pur (options du filtre, lignes, libellés) ;
- `pager.ts` : `pager(total, page, pageSize)` extrait de `loginJournalPager` (qui le délègue,
  tests inchangés) : second consommateur.

**Réutilisation explicite** : `StatusMessage`, `FieldError`, `focusFirstInvalid`, `Button`,
`AppIcon` (icône `comment` déjà dans `icon-map.ts`), `silentErrors`, `refreshable`,
`PendingDeletion`, `AdminListState`, `AdminEmptyState`, `AdminPageHeader`, `ConfirmDialog`,
`FilterGroup`, `counted`, `receivedAgo`, `SITE_IDENTITY`, utilities `form-label` / `form-input` /
`form-textarea`, aides de test `features/admin/application/testing/admin-list-page.ts`
(`deleteThroughDialog`, `readPageTitleFocus`). `EMAIL_PATTERN` sort de `contact-form.ts` vers
`shared/forms/email-pattern.ts` : deux formulaires ne valident pas l'e-mail de deux façons.

### Retrait de Giscus

Fichiers et configurations, tous dans la PR publique (tranches 10 à 12) :

- supprimer `features/blog/application/components/blog-comments.ts` et `blog-comments.spec.ts` ;
- supprimer `shared/api/giscus-config.ts` ;
- `features/blog/pages/blog-detail/blog-detail.ts` : import et balise remplacés par la nouvelle
  section ;
- `src/index.html` : CSP sans `https://giscus.app` dans `script-src`, `style-src` ; directive
  `frame-src` retirée (repli sur `default-src 'self'`, aucun cadre sur le site) ; commentaire
  au-dessus de la meta réécrit sans Giscus (critère 16). nginx (`Dockerfile`) ne cite pas Giscus :
  rien à changer ; `server/csp/harden-csp.ts` non plus ;
- `src/server/csp/harden-csp.spec.ts` et `core/ssr/ssr-upstream-interceptor.spec.ts` : l'origine
  tierce d'exemple devient `https://third-party.example` (donnée d'entrée, assertions inchangées),
  pour que `grep -ri giscus apps/web/src` ne rende rien ;
- `vitest.config.mts` : `disableJavaScriptFileLoading` et `handleDisabledFileLoadingAsSuccess`
  n'existaient que pour le script de Giscus ; retirés. Si la suite émet alors une `DOMException` de
  chargement, ils restent avec un commentaire qui en nomme la vraie raison ;
- `pages/privacy-policy.ts` : section « Commentaires des articles » réécrite (cf. Vie privée),
  date de mise à jour ;
- `apps/web/README.md` (tableau des fonctionnalités, paragraphe Giscus) et `apps/api/README.md`
  (ligne PATCH « thread Giscus », nouvelle section Commentaires, schéma, tâche quotidienne) ;
- `ci/api-stub/` : fixtures `blog-comments.json` (forme publique, deux commentaires dont une
  réponse visiteur et une réponse du propriétaire sur `article-temoin`) et `admin-comments.json`
  (forme admin, adresses en `@example.test`), routes GET publique, POST (202) et lectures admin
  (`readAdmin`) dans `server.mjs` ;
- `ci/smoke.sh` : `/blog/article-temoin` contient `data-testid="comment-item"` et ne contient ni
  `giscus` ni `@example.test` ;
- les ADR acceptés qui citent Giscus (0006, 0012, 0025) restent tels quels : ils datent leur
  contexte ; ADR-0040 acte le retrait.

Ordre : API en production → admin en production → PR publique (ajout de la section **et** retrait
de Giscus dans le même commit de merge). Aucune page sans commentaires, jamais deux systèmes.

### Vie privée

Points à couvrir dans `privacy-policy.ts` (rédaction finale en GREEN, `data-testid` par
paragraphe) :

- données : nom ou pseudo (publié), e-mail (jamais publié), message (publié après validation),
  date, empreinte non réversible de l'adresse IP (lutte contre les abus ; l'IP n'est pas
  conservée) ;
- finalités : publier le commentaire après relecture, permettre à l'éditeur de te répondre ou de
  te joindre, limiter les abus ;
- base légale : intérêt légitime de l'éditeur à animer et modérer le blog (à confirmer, cf. Points
  à trancher) ;
- destinataires : l'éditeur ; l'e-mail de notification passe par le prestataire d'envoi (Resend),
  qui le transmet à l'éditeur ;
- conservation : commentaire publié et e-mail, tant que le commentaire est en ligne ; commentaire
  en attente, jusqu'à la décision de l'éditeur ; commentaire refusé, supprimé au moment du refus,
  avec ses réponses ; tout commentaire disparaît avec son article ;
- droits : suppression ou rectification sur demande à l'adresse de l'éditeur ; l'éditeur supprime
  le commentaire (et ses réponses) depuis l'admin ;
- disparition de la mention de Giscus et de GitHub (critère 15).

### Tranches

Trois PR, fusionnées dans l'ordre A → B → C. A ne touche que l'API, B et C que le front. B et C
peuvent se développer en parallèle de A, contre le contrat ci-dessus (`HttpTestingController`,
fixtures de `ci/api-stub`) ; C se rebase sur B (domaine, gateway, doublure partagés). Les tranches
d'une même PR sont séquentielles.

**PR A — API** (rien de visible ; chaque tranche fusionnable seule)

- **Tranche 1 — un visiteur laisse un commentaire, enregistré en attente, et le propriétaire est
  prévenu** : schéma + migration 0036, `createCommentSchema`, `POST /blog/posts/:slug/comments`,
  service (champ piège, article publié, parent, plafonds), `senderHasher`, notification.
  Tests d'abord : DTO (bornes, normalisation, caractères refusés, chevrons acceptés, champ inconnu)
  en unitaire ; service avec base et mailer doublés (champ piège ⇒ ni insertion ni mail ; échec
  du mail ⇒ commentaire gardé, erreur journalisée ; variables du gabarit) ; routes par
  `app.request()` (202, 400, 404 inconnu, 404 brouillon, 404 parent en attente, 409 réponse à une
  réponse, 429 plafond expéditeur, 503 plafond global, 429 du quota) ; **intégration Postgres**
  `blog-comments.integration.spec.ts` (`COMMENTS_IT_DATABASE_URL`, base ajoutée à
  `.github/workflows/api-ci.yml` comme `profile_it`) : insertion SQL directe d'une réponse à une
  réponse et d'une réponse inter-articles refusées par la base, `DELETE` d'un article ⇒
  commentaires supprimés (critère 17), `DELETE` d'un commentaire ⇒ réponses supprimées ; parité :
  inventaire + quota 5/h ; non-régression de `contact.service.spec.ts` (empreinte inchangée).
- **Tranche 2 — les commentaires publiés d'un article se lisent** : `GET …/comments`, schéma de
  sortie public, requêtes. Tests : routes (ordre, réponses sous leur parent, réponse d'un parent
  refusé absente, pagination et `total`, 404 article non publié, **aucune clé `email` ni
  `senderHash` et aucune adresse dans le JSON** même si une ligne en porte) ; parité : lecture
  publique servie.
- **Tranche 3 — le propriétaire liste, compte et modère** : `GET /blog/comments`,
  `/pending-count`, `PATCH /:id`. Tests : routes (filtre, pagination, `post`, `parent`,
  `replyCount`, e-mail présent côté admin, publication et 409, 401 sans session) ;
  parité : routes admin 401, `comments.spec.ts` (publié puis lu sans e-mail, champ piège sans
  effet).
- **Tranche 4 — le propriétaire supprime et répond** : `DELETE /:id`, `POST /:id/replies`. Tests :
  routes (204 puis réponses absentes, 404, réponse du propriétaire publiée d'emblée, 409 sur parent
  en attente ou sur une réponse) ; parité : inventaire.
- **Tranche 5 — retirée** (2026-11-22) : refuser = supprimer, il n'y a plus de refus à purger.
  `cronRoutes` reste celui de `master`.

**PR B — admin** (invisible pour les lecteurs)

- **Tranche 6 — le propriétaire voit les commentaires et le nombre en attente** : domaine,
  `CommentsGateway` (lectures admin, compteur), adapter, `pager`, page `admin-comments` en lecture
  (filtre, pagination, lignes), entrée et compteur de navigation, fixtures et routes de lecture
  de `ci/api-stub`. Tests : adapter et presenter en unitaire sans TestBed ; gateway
  (`HttpTestingController`, `verify()`) ; `admin-nav-groups.spec.ts` (compte et suffixe) ;
  `admin-layout.spec.ts` (compteur affiché) ; page (états chargement/erreur/vide/liste, e-mail et
  article visibles, critère 10) ; `login-journal-view.spec.ts` inchangé et vert ; e2e axe :
  scénario `/admin/comments` dans `e2e/a11y/scenarios.ts`.
- **Tranche 7 — publier** : action de ligne. Tests page : la ligne quitte le filtre, compteur
  relu, toast ; échec ⇒ ligne remise et toast d'erreur. Refuser passe par la suppression
  (tranche 8).
- **Tranche 8 — supprimer après confirmation** : `PendingDeletion` + `ConfirmDialog`. Tests :
  `deleteThroughDialog` (confirmer, annuler, Échap), texte annonçant les réponses supprimées,
  focus sur le titre (`readPageTitleFocus`).
- **Tranche 9 — répondre en tant qu'auteur** : `admin-comment-reply-form`. Tests composant
  (validation, `resetToken`) et page (réponse publiée affichée, critère 12 ; bouton absent sur une
  réponse et sur un commentaire non publié).

**PR C — section publique et retrait de Giscus** (une seule fusion ; les tranches restent des
cycles RED → GREEN distincts)

- **Tranche 10 — les lecteurs lisent les commentaires dans le HTML de l'article ; Giscus
  disparaît** : `getThread`, `OPTIONAL_UPSTREAM`, `ArticleComments` (lecture), presenter,
  `comment-thread` + `comment-item` en lecture, `@defer (hydrate on viewport; on viewport)`,
  retrait complet de Giscus, politique de confidentialité, READMEs, `smoke.sh`, doublure publique.
  Tests : presenter (libellé du propriétaire, ordre conservé) ; intercepteur (lecture
  `OPTIONAL_UPSTREAM` en 500 ⇒ statut inchangé ; lecture ordinaire ⇒ 503) ; composants (structure
  `ol`/`article`/titres, réponses imbriquées, état vide, corps `<img src=x onerror=…>` rendu comme
  texte sans élément `img`, critère 14) ; `blog-detail.spec.ts` (section présente, échec de
  lecture ⇒ message, article affiché) ; page de confidentialité (paragraphe commentaires présent,
  aucun lien vers giscus.app, critère 15) ; rendu serveur : `ci/smoke.sh` sur l'image (liste dans
  le HTML, critère 1 ; CSP sans giscus, critère 16 ; aucune adresse, critère 6) ; e2e axe sur
  `/blog/article-temoin` avec commentaires, clair et sombre.
- **Tranche 11 — un lecteur commente** : `comment-form`, `submit` du gateway et `toCommentRejection`,
  `send` du coordinateur, messages, POST de la doublure. Tests : adapter (statut → rejet, `it.each`) ;
  gateway (corps envoyé, 202 ⇒ succès, 429 ⇒ `rate-limited`) ; formulaire (erreurs sous le champ
  touché, focus du premier invalide, champ piège hors tabulation, bornes) ; `comment-thread` (succès
  ⇒ message de confirmation focalisé, formulaire vidé, liste inchangée, critère 4 ; 429 ⇒ message de
  débit en `alert`, critère 7) ; preuve d'hydratation sur l'image : saisie puis sortie du champ ⇒
  `aria-invalid` (leçon `tasks/lessons.md`) ; e2e axe : états d'erreur et de confirmation dans
  `interactive-states.spec.ts`.
- **Tranche 12 — un lecteur répond à un commentaire publié** : `canReply`, `replyTarget`,
  formulaire de réponse inline. Tests : bouton présent sous un commentaire, absent sous une réponse
  (critère 5) ; ouverture ⇒ focus sur le nom, Annuler/Échap ⇒ focus rendu ; `parentId` envoyé ;
  un seul formulaire de réponse ouvert ; ids uniques.

### Risques et retour arrière

| PR | Risque                                                                                                                                                                             | Retour arrière                                                                                     |
| -- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| A  | SQL de la clé composite auto-référente mal ordonné par drizzle-kit (FK avant `UNIQUE`) : relire la migration, la jouer sur la base d'intégration et dans le job `image` de la CI. | Redéployer le tag `sha-<commit>` précédent de l'API ; table neuve, inerte.                         |
| A  | Le lot parallèle sur `common/throttle.ts` change `ThrottleConfig` (option `whenFull`) : `COMMENT_THROTTLE` devra suivre au rebase. Aucune modification de `throttle.ts` ici, donc pas de conflit textuel. Quota en mémoire remis à zéro au redémarrage (plafonds en base non concernés). | —                                                                                                  |
| A  | Gabarit `comment-notification` absent dans Resend : chaque envoi échoue (journalisé, Sentry), les commentaires restent enregistrés.                                                | Créer le gabarit ; rien à redéployer.                                                              |
| B  | Conflits avec C sur `ci/api-stub/server.mjs` et la feature `comments` : C se rebase après la fusion de B.                                                                          | `git revert` de B : l'écran disparaît, la file reste en base.                                      |
| C  | Incrémental : une hydratation ratée laisse un formulaire inerte ; preuve fonctionnelle exigée (tranche 11).                                                                        | `git revert` de C : Giscus revient (tant que l'app Giscus reste installée sur le dépôt) ; les commentaires écrits entre-temps restent en base, invisibles. |
| C  | Retirer les réglages happy-dom de `vitest.config.mts` peut faire bruiter des specs qui chargent un script externe.                                                                 | Réglages remis avec un commentaire juste.                                                          |

Actions du propriétaire en production :

1. **Avant le déploiement de A** : créer dans Resend le gabarit d'alias `comment-notification`
   avec les variables listées (le texte du gabarit relève du contenu éditorial, hors licence MIT).
2. **Après A** : vérifier `curl https://nedellec-julien.fr/api/blog/posts/<slug>/comments` (200,
   `data: []`) et la présence de la migration 0036 dans les journaux de l'image.
3. **Après C** : vérifier sur une page d'article la CSP (sans giscus, sans `'unsafe-inline'`),
   `X-Cache-Status`, un commentaire de test complet (envoi, e-mail reçu, publication, affichage) ;
   puis, une fois la bascule tenue, désinstaller l'app Giscus du dépôt GitHub et désactiver les
   Discussions si elles ne servent plus. L'article tiré de `docs/articles/030-a2-securite-du-contenu.md`
   cite Giscus : son texte en ligne se corrige depuis l'admin.

Aucune variable d'environnement nouvelle ; une base d'intégration nouvelle en CI
(`COMMENTS_IT_DATABASE_URL`).

### Points à trancher

1. **Notification au commentateur lors d'une réponse** (hypothèse de la Description). Reco :
   **hors première version**, spec dédiée avec double opt-in, désinscription et rebonds (cf.
   E-mails). La première version n'affiche pas de case de consentement : une case sans effet
   serait trompeuse.
2. **Champ piège : « refusé » (critère 7) ou réponse identique à un succès ?** Reco : réponse 202
   identique, comme le contact ; le critère se vérifie par « rien d'enregistré, rien d'envoyé ».
   Un refus explicite apprendrait au robot quel champ éviter.
3. **Refuser ou supprimer** (critère 11). **Tranché le 2026-11-22 : refuser = supprimer**, le
   commentaire et ses réponses, immédiatement. Aucune finalité ne justifiait de conserver un texte
   refusé ; plus de statut `refused`, plus de purge quotidienne.
4. **Conservation de l'e-mail d'un commentaire publié**. Reco : tant que le commentaire est en
   ligne, suppression sur demande. Alternative plus sobre : effacer l'adresse 12 mois après la
   publication (colonne déjà nullable pour le propriétaire, mais la contrainte « visiteur ⇒
   e-mail » devrait s'assouplir).
5. **Base légale** à citer dans la politique : intérêt légitime (reco) ou consentement.
6. **Valeurs des quotas** : 5 envois/h/IP, 3 en attente par expéditeur, 100 en attente au total.
   Hypothèses : un lecteur commente rarement plus de 3 articles avant ta relecture ; la file est
   relue au moins chaque semaine ; une IP partagée (entreprise, atelier) peut bloquer un collègue
   jusqu'à ta relecture.
7. **Ordre d'affichage** : par date d'écriture (reco, la conversation reste chronologique même si
   tu publies en retard) plutôt que par date de publication.
8. **Au-delà de 100 commentaires** sur un article : la première version n'affiche que les 100
   premiers et le dit ; un bouton « commentaires suivants » se fera quand un article approchera ce
   volume. L'API est déjà paginée.
9. **Réponse du propriétaire à un commentaire en attente** : refusée (409), conforme au critère 12
   (« un commentaire publié »). Publier d'abord, puis répondre.
10. **Écart existant, hors périmètre** : la politique de confidentialité affirme qu'une
    confirmation est envoyée à l'auteur d'un message de contact, alors que `ContactService` ne
    l'envoie pas (choix anti-abus documenté). Reco : corriger cette phrase dans la PR C, qui
    réécrit déjà la page, et y nommer Resend comme prestataire d'envoi pour les deux traitements.
11. **Critère 8** (« annoncé par un lecteur d'écran ») : testable structurellement (rôles, noms
    accessibles, `role="status"`/`alert`, focus) et par axe ; l'écoute réelle avec un lecteur
    d'écran reste une vérification manuelle, à consigner dans `## Suivi`.
