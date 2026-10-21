---
id: 030-a1
titre: "Du HTML frais à chaque requête, sans rebuild : le rendu de ce site avec Angular 22"
extrait: "Une modification faite dans l'admin devait être visible au rechargement suivant, sans relancer de build. Comment ce site rend ses pages à la requête avec Angular 22, nginx et une seconde de cache, et pourquoi le corps d'un article n'est jamais hydraté."
tags: [SSR, Performance, Angular, Architecture, Docker, Portfolio]
projet: Portfolio
adr:
  - docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md
  - docs/adr/0001-hydratation-incrementale-des-defer-de-route-publique.md
  - docs/adr/0014-coloration-du-code-et-corps-d-article-non-hydrate.md
faits-verifies: 2026-10-21 sur master a328bb3 / en production (curl et navigateur)
statut: brouillon
slug: ""
---

<!--
Relecture : le corps commence après ce commentaire. À coller dans l'éditeur de l'admin sans le
front-matter ni ce commentaire. Les tags SSR, Performance et Portfolio arrivent avec la PR 3 de la
spec 030 : publier après son déploiement (et après la création de la fiche projet « Portfolio »),
sinon ils restent neutres (hors thème) et l'article n'est rattaché à aucune fiche.
-->

Jusqu'au début du mois d'octobre, chaque page de ce site était prérendue au moment du build. C'est rapide à servir et simple à héberger, mais une correction faite dans l'admin n'apparaissait qu'après un nouveau build : plusieurs minutes pour un article, et aucune publication du tout pour un projet tant que je ne poussais pas de code. Je voulais l'inverse : enregistrer, recharger la page, voir le changement.

Cet article raconte comment le site est passé au rendu à la requête avec Angular 22, ce que fait nginx devant le serveur Node, comment une seconde de cache suffit à encaisser une panne de l'API, et pourquoi le corps d'un article est rendu par le serveur mais jamais hydraté dans le navigateur.

## Le point de départ : tout est prérendu

Le site est une application Angular avec une API NestJS séparée. Au build, Angular générait un fichier HTML par page publique, en interrogeant l'API pour connaître la liste des articles et des projets. nginx servait ensuite ces fichiers.

Ce modèle a deux défauts dès que le contenu vit dans une base de données :

- **Le contenu est figé au build.** Pour publier un article, l'API appelait un webhook qui relançait le build complet du conteneur.
- **Le build dépend de l'API.** Si l'API est en panne ou n'est pas encore déployée, le build du front échoue, alors que le code du front n'a pas changé.

## Quatre options

J'ai comparé quatre façons de faire :

1. **Garder le prérendu et déclencher un build à chaque écriture.** C'est ce qui existait. Plusieurs minutes de délai, et des builds en rafale quand je corrige trois fautes de suite.
2. **Prérendu avec revalidation incrémentale**, comme l'ISR de Next.js. `@angular/ssr` ne le fournit pas : il aurait fallu construire le cache, l'invalidation depuis l'API et la purge de nginx à la main, pour gagner quelques dizaines de millisecondes sur un site à faible trafic.
3. **Rendre les pages de contenu dans le navigateur.** Le HTML servi serait vide de contenu : mauvais pour le référencement, pour les aperçus de partage et pour le premier affichage.
4. **Rendre les pages à chaque requête**, côté serveur, avec un cache très court devant.

J'ai retenu la quatrième.

## Quel mode de rendu pour quelle page

Angular 22 permet de choisir le mode de rendu route par route, dans `app.routes.server.ts` :

```typescript
// Extrait : connexion et double authentification sont aussi en RenderMode.Client.
export const serverRoutes: ServerRoute[] = [
  { path: '', renderMode: RenderMode.Server },
  { path: 'about', renderMode: RenderMode.Server },
  { path: 'projects', renderMode: RenderMode.Server },
  { path: 'projects/:slug', renderMode: RenderMode.Server },
  { path: 'blog', renderMode: RenderMode.Server },
  { path: 'blog/:slug', renderMode: RenderMode.Server },
  { path: 'mentions-legales', renderMode: RenderMode.Prerender },
  { path: 'confidentialite', renderMode: RenderMode.Prerender },
  { path: 'admin/**', renderMode: RenderMode.Client },
  { path: '**', renderMode: RenderMode.Client },
];
```

Les pages dont le contenu vient de l'API sont rendues à la requête. Les pages juridiques, qui ne changent qu'avec le code, restent prérendues. L'admin et la connexion sont rendues dans le navigateur : elles n'ont rien à indexer. Le build ne lit plus l'API du tout, ce qui règle aussi le second défaut.

## nginx et Node dans la même image

Le conteneur contient deux processus. nginx écoute sur le port public, sert les fichiers statiques et les pages prérendues, et ne transmet à Node qu'une **liste fermée** de routes :

```nginx
location ~ ^/(about|projects(/[^/]+)?|blog(/[^/]+)?)?/?$ {
    limit_except GET { deny all; }
    include /etc/nginx/snippets/security-headers.conf;
    include /etc/nginx/snippets/ssr-proxy.conf;
    include /etc/nginx/snippets/ssr-cache.conf;
}
```

Une URL inconnue, comme les `/wp-login.php` que les robots essaient en boucle, ne réveille jamais Node : nginx répond directement 404. Node écoute uniquement sur `127.0.0.1`, et nginx fixe lui-même l'en-tête `Host` : le serveur Angular vérifie en plus cet hôte contre `allowedHosts` dans `angular.json`.

Pourquoi une seule image plutôt que deux services ? Parce qu'au moment d'un déploiement, deux services se mettent à jour l'un après l'autre. Pendant quelques secondes, le HTML rendu par le nouveau Node pourrait citer des fichiers JavaScript que l'ancien nginx ne connaît pas encore. Dans une seule image, le HTML et les fichiers qu'il cite viennent toujours du même build.

## Une seconde de cache, et une copie de secours

Rendre chaque page à chaque requête coûte un aller-retour vers l'API. nginx garde donc chaque page rendue pendant une seconde :

```nginx
proxy_cache ssr;
proxy_cache_key "$uri$is_args$args";
proxy_cache_valid 200 404 1s;
proxy_cache_use_stale error timeout updating http_500 http_502 http_503 http_504;
proxy_cache_lock on;
add_header X-Cache-Status $upstream_cache_status always;
```

Une seconde suffit pour qu'une écriture dans l'admin soit visible au rechargement suivant, et pour qu'une rafale de visites sur la même page ne fasse qu'un seul rendu (`proxy_cache_lock`).

La ligne la plus importante est `proxy_cache_use_stale` : si Node répond par une erreur, nginx sert sa dernière copie de la page, même périmée. Pour que ça marche, le rendu ne doit jamais produire une page vide avec un statut 200, sinon nginx la mettrait en cache comme une bonne réponse. Un intercepteur HTTP, côté serveur uniquement, transforme donc toute lecture d'API en échec en réponse 503 :

```typescript
// Toute lecture en échec sauf 404 (qui est une réponse) : la page répond 503 pour que nginx serve
// sa dernière copie au lieu de mettre en cache une page sans contenu.
const isUpstreamFailure = (error: unknown): boolean =>
  error instanceof TimeoutError || (error instanceof HttpErrorResponse && error.status !== 404);
```

Une lecture qui dépasse 3 secondes est aussi abandonnée : mieux vaut servir la copie de secours que faire attendre le visiteur.

Mesures faites le 21 octobre sur un article, depuis une connexion domestique, avec le temps jusqu'au premier octet reçu :

| Situation | En-tête `X-Cache-Status` | Temps mesuré |
|---|---|---|
| Première visite, rien en cache | `MISS` | 280 ms |
| Même page dans la seconde | `HIT` | 26 à 46 ms |
| Page de nouveau rendue, cache expiré | `EXPIRED` | 140 à 190 ms |

Chaque mesure ouvre sa propre connexion, l'écart vient donc du travail fait derrière nginx. Le `MISS` est le premier rendu d'une page absente du cache ; le cas courant d'un visiteur isolé est la dernière ligne.

## Ce que le HTML doit contenir : l'hydratation incrémentale

Rendre la page côté serveur ne sert à rien si le HTML envoyé est vide. C'est arrivé sur ce site, à cause d'un détail des blocs `@defer`.

Le site active l'hydratation incrémentale (`withIncrementalHydration()`). Dans ce mode, Angular ne rend côté serveur le contenu d'un bloc `@defer` que s'il porte un déclencheur `hydrate`. Sans lui, le serveur envoie le `@placeholder`. La page « À propos » posait `hydrate on viewport` ; la page d'accueil, non. Résultat : la page qui reçoit le plus de visites était la seule dont les sections principales arrivaient sous forme de `<div>` vides, invisibles pour un moteur de recherche.

La règle du dépôt est devenue : **tout `@defer` d'une page publique porte un déclencheur `hydrate`**, `hydrate on viewport` par défaut. Les déclencheurs habituels restent à côté, parce qu'ils servent quand on arrive sur la page par une navigation interne, sans passer par le serveur :

```html
@defer (hydrate on viewport; on viewport; prefetch on idle) {
  <app-home-latest-posts [posts]="latestPosts()" />
} @placeholder {
  <div class="block h-[38rem]"></div>
}
```

Le contenu est dans le HTML servi, et le JavaScript de la section n'est chargé et exécuté que lorsqu'elle devient visible.

## Le corps d'un article n'est jamais hydraté

Un article est écrit en Markdown. Pour l'afficher, il faut un analyseur (marked), un assainisseur (DOMPurify) et, pour la coloration du code, highlight.js. Au moment de ce choix, ces trois bibliothèques pesaient ensemble près de 50 Ko compressés. Les envoyer à chaque lecteur pour transformer un texte que le serveur a déjà transformé n'a aucun sens.

Le corps de l'article est donc placé dans un bloc qui se rend tout de suite côté serveur, mais ne s'hydrate jamais :

```html
@for (current of [p]; track current.id) {
  @defer (on immediate; hydrate never) {
    <app-blog-article-body [markdown]="current.contentMarkdown" />
  } @placeholder {
    <!-- squelette de chargement, simplifié ici -->
  }
}
```

`hydrate never` gèle ce morceau de page : il ne réagit plus à rien, pas même à un changement d'entrée. D'où le `@for` sur un tableau d'un seul élément, suivi par l'identifiant de l'article : quand on passe d'un article à un autre, le bloc est détruit et recréé au lieu d'être mis à jour.

J'ai vérifié le résultat en production le 21 octobre, en listant les fichiers JavaScript chargés par le navigateur :

- **Arrivée directe sur un article** (depuis Google ou un lien partagé) : aucun des fichiers chargés ne contient marked, DOMPurify ou highlight.js.
- **Navigation interne** depuis la liste du blog : le bloc est rendu dans le navigateur, et un fichier de 164 Ko (51,7 Ko recompressé en gzip) contenant les trois bibliothèques est chargé à ce moment-là, et seulement là.

Le bouton « Copier » des blocs de code continue de fonctionner sans hydratation : une directive posée sur un élément parent, lui hydraté, écoute les clics de tout le corps de l'article.

## Ce que ça coûte

Ce choix a un prix, et il vaut mieux le connaître :

- **Un processus Node permanent** sur un petit serveur auto-hébergé. Je l'ai borné à 256 Mo de tas (`--max-old-space-size=256`) et nginx limite les rendus à 10 par seconde et par visiteur.
- **Une route ajoutée se déclare à deux endroits** : dans `app.routes.server.ts` et dans la liste fermée de nginx. L'oublier dans nginx revient à servir une 404.
- **La politique de sécurité du contenu (CSP) ne peut pas être générée par Angular.** L'option `autoCsp` n'est pas compatible avec le rendu côté serveur. Le site calcule donc lui-même les empreintes des scripts autorisés, au build puis à chaque rendu. Ce sera le sujet d'un prochain article.
- **Juste après un déploiement, avec l'API en panne**, il n'existe encore aucune copie de secours : le visiteur reçoit une page d'erreur.

## Ce que je retiens

Le rendu à la requête n'a rien d'exotique, mais tout se joue dans les détails : un statut 503 au lieu d'une page vide, un déclencheur `hydrate` oublié, un bloc qu'on choisit de ne jamais hydrater. Le résultat est un site où une correction faite dans l'admin est en ligne une seconde plus tard, où le build ne dépend plus de l'API, et où un lecteur qui arrive sur un article ne télécharge pas le code qui a servi à le fabriquer.

Les décisions détaillées, avec les alternatives écartées, sont dans les ADR du dépôt : [rendu à la requête (ADR-0024)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md), [hydratation incrémentale (ADR-0001)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0001-hydratation-incrementale-des-defer-de-route-publique.md) et [corps d'article non hydraté (ADR-0014)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0014-coloration-du-code-et-corps-d-article-non-hydrate.md). Le code du site est public sur [GitHub](https://github.com/j-ned/ng-portfolio-app). Sur le même serveur, j'ai aussi décrit comment je [mesure la fréquentation du site sans cookie](https://nedellec-julien.fr/blog/mesurer-la-frequentation-de-son-site-sans-cookie-ni-bandeau-de-consentement).
