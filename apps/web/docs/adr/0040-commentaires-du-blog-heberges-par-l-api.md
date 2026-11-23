# ADR-0040 — Commentaires du blog hébergés par l'API, modérés avant publication

- **Statut** : accepté et appliqué (2026-11-22) : API (PR #68), modération (PR #69), puis page
  publique (PR #70)
- **Date** : 2026-11-21
- **Spec** : 040 (commentaires du blog sans compte tiers)
- **Remplace** : les commentaires Giscus (composant `BlogComments`, `GISCUS_CONFIG`, origines
  `https://giscus.app` de la CSP)

## Context

Les commentaires passent par Giscus, qui exige un compte GitHub : les tourneurs CN qui lisent le
blog ne peuvent pas écrire. Le dépôt ne contient aucune discussion, il n'y a rien à migrer.

Le propriétaire a tranché (2026-11-21) : un nom et un e-mail suffisent pour commenter, l'e-mail
n'est jamais affiché, un seul niveau de réponse, une notification par e-mail pour chaque
commentaire en attente.

Contraintes du site au 2026-11-21 :

- une seule instance de l'API (ADR-0038), quotas en mémoire (`common/throttle.ts`) ;
- les articles sont rendus à la requête, derrière un micro-cache nginx d'une seconde, sans purge
  (ADR-0038) ;
- pas de dépendance tierce côté navigateur hors Sentry ; aucune lib de CAPTCHA ;
- le formulaire de contact a déjà fixé les réponses aux abus (champ piège, quota par IP, empreinte
  HMAC de l'IP, aucun e-mail envoyé à l'adresse saisie).

## Decision

1. **Une table `blog_comment` dans la base de l'API**, servie sous `/api/blog/…`. Le front lit la
   liste publiée pendant le rendu serveur de l'article ; elle fait partie du HTML et passe par le
   transfer cache comme l'article.
2. **Un seul niveau de réponse garanti par la base** : colonne `depth` (0 ou 1) et clé étrangère
   composite `(parent_id, post_id, parent_depth) → (id, post_id, depth)` avec `parent_depth = 0`
   imposé par `CHECK`. Une réponse à une réponse, ou à un commentaire d'un autre article, est
   refusée par Postgres, quel que soit le code qui écrit.
3. **Modération avant publication** de tout ce qu'écrit un visiteur ; statut `pending` /
   `published`, cohérent avec `moderated_at` par `CHECK`. **Refuser, c'est supprimer** (décision du
   propriétaire, 2026-11-22) : le commentaire et ses réponses disparaissent, rien n'est conservé.
   La réponse du propriétaire, écrite depuis l'admin, est publiée directement et marquée
   `author_kind = 'owner'`.
4. **Anti-abus sans compte ni CAPTCHA tiers** : champ piège (réponse identique à un envoi
   accepté), quota par IP, plafond de commentaires en attente par expéditeur (empreinte HMAC de
   l'IP, comme le contact) et plafond global de la file de modération. Texte brut seulement,
   affiché par interpolation : aucun lien cliquable, aucune balise interprétée.
5. **L'e-mail est stocké en clair**, jamais exposé publiquement : le schéma de sortie public ne le
   porte pas. Le propriétaire doit pouvoir écrire au commentateur ; une empreinte ne le permettrait
   pas.
6. **Pas d'e-mail au commentateur en première version.** Envoyer, signé du domaine, un message à
   une adresse saisie par un inconnu est l'abus que le contact refuse déjà ; le jour où ce besoin
   est confirmé, il passera par une confirmation de l'adresse (double opt-in), un lien de
   désinscription et le traitement des rebonds, dans une spec à part.
7. **Bascule en trois livraisons** : API d'abord (rien de visible), puis l'écran de modération de
   l'admin, puis, en une seule PR, la section publique et le retrait de Giscus. Il n'existe ni
   moment sans commentaires, ni moment avec deux systèmes.

## Consequences

- Le site traite une nouvelle donnée personnelle (nom, e-mail, empreinte d'IP) : politique de
  confidentialité et durée de conservation. Un refus supprime aussitôt : aucune purge à programmer.
- La CSP perd ses dernières origines tierces de script, de style et de cadre.
- La modération repose sur le propriétaire : sans lui, rien n'apparaît. Le plafond global borne la
  file ; au-delà, l'API répond 503 et le formulaire l'annonce.
- Les quotas en mémoire se remettent à zéro à chaque redémarrage de l'API ; le plafond par
  expéditeur, lu en base, ne dépend pas du redémarrage.
- Retour arrière : la table est nouvelle et ignorée par une image antérieure ; revenir à Giscus se
  fait par `git revert` de la PR publique tant que l'app Giscus reste installée sur le dépôt.

## Alternatives considered

- **Garder Giscus** : écarté, c'est la raison de la spec.
- **Autre service tiers sans compte** (Commento, Disqus, Hyvor…) : écarté. Données confiées à un
  tiers, script et cadre tiers dans la CSP, publicité ou abonnement, et toujours pas de rendu
  serveur.
- **CAPTCHA (hCaptcha, Turnstile)** : écarté. Script tiers, cookie ou empreinte du navigateur,
  friction pour un lectorat qui écrit peu ; la modération avant publication rend le spam invisible
  et les plafonds bornent son coût.
- **Jeton signé posé au rendu (délai minimal avant envoi)** : écarté en première version. Il
  demande un secret côté front et une validation côté API pour un gain faible tant que rien n'est
  publié sans relecture ; à reconsidérer si la file se remplit de robots.
- **Une table de réponses distincte** : garantirait aussi le niveau unique, mais doublerait les
  colonnes, les requêtes de l'admin et le compteur. La clé composite donne la même garantie sur une
  seule table.
- **Profondeur garantie par le code seul** : écarté, le critère demande une garantie de la base.
