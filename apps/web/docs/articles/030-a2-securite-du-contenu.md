---
id: 030-a2
titre: "Afficher du Markdown sans ouvrir la porte au XSS : je te montre l'assainissement, les images et la CSP sans unsafe-inline"
extrait: "Ton blog en Markdown injecte du HTML dans la page. Je te montre comment j'assainis ce HTML avec DOMPurify au rendu serveur comme dans le navigateur, comment je sers les images depuis l'origine du site, et comment je tiens une CSP sans 'unsafe-inline' en SSR."
tags: [Sécurité web, XSS, CSP, Angular, Portfolio]
projet: Portfolio
adr:
  - docs/adr/0002-assainissement-du-markdown-du-blog.md
  - docs/adr/0015-images-du-corps-des-articles.md
  - docs/adr/0018-images-servies-depuis-l-origine-du-site.md
  - docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md
faits-verifies: 2026-10-21 sur master aabe8ca / en production (curl) / démonstration avec marked et DOMPurify du dépôt
statut: brouillon
slug: ""
---

<!--
Relecture : le corps commence après ce commentaire. À coller dans l'éditeur de l'admin sans le
front-matter ni ce commentaire. Ne publier qu'après la recréation de la fiche projet « Portfolio »
(titre exact « Portfolio », slug `portfolio` vérifié par GET /api/projects), et après A1.
Une fois A1 publié, remplacer le lien de fin vers l'article DashFlow par un lien vers A1 si on
préfère enchaîner la série.
Réécrit au tutoiement, spec 031.
-->

Les articles de ce blog sont écrits en Markdown, stockés dans PostgreSQL, puis transformés en HTML et injectés dans la page. Injecter du HTML dans une page, tu le sais, c'est la définition même d'une faille XSS possible. Je suis le seul à écrire ici, mais ça ne suffit pas à rendre le risque nul : un compte d'administration volé, ou un extrait de code collé sans être relu, et un script se retrouverait servi à tous les lecteurs. Toi compris.

Je te montre ici les trois barrières que j'ai posées : un seul point d'assainissement du HTML, valable aussi au rendu serveur ; des images servies depuis l'origine du site ; et une politique de sécurité du contenu (CSP) sans `'unsafe-inline'`, alors qu'Angular ne sait pas la produire quand les pages sont rendues côté serveur.

## Le problème de départ : marked ne filtre rien

Le Markdown est converti par [marked](https://marked.js.org). Le Markdown autorise le HTML brut, et marked le laisse passer tel quel : `<script>`, `<img onerror>`, `href="javascript:"` ou `<iframe>` traversent la conversion intacts. marked avait une option `sanitize`, retirée depuis longtemps ; la documentation renvoie vers une bibliothèque dédiée.

Côté Angular, le HTML produit est affiché avec `[innerHTML]`. Par défaut, Angular le nettoie lui-même. Mais ici, le résultat passait par `bypassSecurityTrustHtml`, qui désactive précisément ce nettoyage.

## Pourquoi ne pas laisser faire Angular

La solution la plus simple serait de retirer le contournement et de laisser le nettoyage d'Angular s'appliquer. Tu y as sans doute pensé, moi aussi. Je l'ai écartée en lisant la liste des attributs qu'il conserve, dans le code source d'`@angular/core` : `id` n'en fait pas partie, ni `loading`, ni `decoding`.

Sans `id`, les titres perdent leurs ancres (impossible de te partager un lien vers une section). Sans `loading="lazy"` et `decoding="async"`, toutes les images d'un long article se chargent d'emblée. Et cette liste n'est pas configurable.

## Un seul point d'assainissement

Tout le Markdown passe par une seule fonction, `parseMarkdown`, qui assainit sa sortie avec [DOMPurify](https://github.com/cure53/DOMPurify) avant de la rendre. C'est la seule fonction du code autorisée à produire du HTML à partir du Markdown :

```typescript
const SANITIZE_OPTIONS = {
  USE_PROFILES: { html: true },
  // `style` inline peut recouvrir la page (position:fixed) : rien dans le blog n'en a besoin.
  FORBID_ATTR: ['style'],
  FORBID_TAGS: ['style'],
};

// Un <button> sans type soumet le <form> qui l'entoure (l'aperçu de l'éditeur en est un).
DOMPurify.addHook('afterSanitizeAttributes', (node) => {
  if (node.nodeName === 'BUTTON') node.setAttribute('type', 'button');
});
```

Le contournement d'Angular est conservé, mais il s'applique désormais à un HTML déjà nettoyé.

Regarde ce que donne la chaîne complète, marked puis DOMPurify avec ces options, sur un Markdown volontairement hostile. J'ai lancé cette démonstration avec les versions installées dans le dépôt :

```markdown
Salut <script>alert(1)</script> toi

<img src="x" onerror="alert(1)">

<a href="javascript:alert(1)">clic</a>

[lien](javascript:alert(1))

<p style="position:fixed;inset:0">voile</p>

<iframe src="https://exemple.test"></iframe>

<kbd>Ctrl</kbd> + <kbd>C</kbd>
```

```html
<p>Salut  toi</p>
<img src="x"><p><a>clic</a></p>
<p><a>lien</a></p>
<p>voile</p><p><kbd>Ctrl</kbd> + <kbd>C</kbd></p>
```

Le script, le gestionnaire `onerror`, les deux liens `javascript:` (en HTML comme en syntaxe Markdown), le `style` qui aurait pu couvrir toute la page et l'`iframe` ont disparu. Le HTML inoffensif, comme `<kbd>`, reste à sa place. Ces cas sont repris un par un dans les tests de `parseMarkdown`.

## Le piège du rendu serveur

Les articles sont rendus côté serveur, dans Node, avant d'arriver dans ton navigateur. C'est là qu'il est le plus important d'assainir : une page rendue avec un script est mise en cache et servie à tout le monde.

Le piège : DOMPurify a besoin d'un DOM pour fonctionner, et Node n'en a pas. Je l'ai vérifié avec la version 3.4.16 installée dans le dépôt : instancié sans `window`, DOMPurify indique `isSupported = false` et n'expose même pas de méthode `sanitize`. Le site utilise donc [isomorphic-dompurify](https://github.com/kkomelin/isomorphic-dompurify), qui fournit un DOM simulé (jsdom) côté serveur et utilise le DOM natif dans le navigateur. La même fonction protège ainsi les deux mondes.

## Des images servies par le site lui-même

Les images d'un article sont envoyées depuis l'admin, converties en AVIF par l'API et stockées dans un espace de stockage objet. Au départ, le Markdown contenait l'adresse absolue de l'API. Il contient désormais un chemin relatif à l'origine du site :

```markdown
![Schéma de la double enveloppe](/api/storage/portfolio-storage/blog-content/<uuid>-<empreinte>-1600x900.avif)
```

nginx relaie ce chemin vers l'API et garde chaque image en cache disque pendant un an. Comme l'empreinte du fichier fait partie de son nom, une image modifiée change d'adresse : le cache n'a jamais besoin d'être purgé. En production, le 21 octobre, la même image répondait d'abord `X-Cache-Status: MISS`, puis `HIT`, avec `Cache-Control: public, max-age=31536000, immutable`.

Ce choix a deux effets, un pour la sécurité et un pour la performance :

- **Un seul hôte de confiance.** L'image principale d'un article ne demande plus de connexion vers un second domaine, et changer l'adresse de l'API n'impose plus de réécrire le contenu des articles.
- **Pas de décalage à l'affichage.** Les dimensions de l'image sont écrites dans son nom (`1600x900`). Au rendu, une expression régulière stricte les relit et pose `width`, `height`, `loading="lazy"` et `decoding="async"`, sans requête supplémentaire. Une adresse qui ne respecte pas exactement ce format n'obtient aucune dimension.

## Une CSP sans `'unsafe-inline'`

L'assainissement est la première barrière. La politique de sécurité du contenu est la seconde : si un script passait malgré tout, le navigateur refuserait de l'exécuter. Encore faut-il que ta CSP n'autorise pas tous les scripts inline, ce que fait `'unsafe-inline'`.

Angular propose une option `autoCsp`, mais elle n'est pas compatible avec le rendu côté serveur. Le site calcule donc lui-même l'empreinte SHA-256 de chaque script inline autorisé, en deux temps :

1. **Au build**, un script lit toutes les pages prérendues, calcule l'empreinte de chaque script inline constant (la pré-peinture du thème clair ou sombre, par exemple) et écrit une liste autorisée. Il remplace `'unsafe-inline'` par ces empreintes, et le build échoue si `'unsafe-inline'` subsiste ou si un script inconnu apparaît.
2. **À chaque requête**, le serveur Node applique la même fonction aux pages rendues. Un script inline n'est accepté que s'il figure dans la liste du build, ou s'il a exactement la forme du script d'amorçage qu'Angular génère pour rejouer les événements :

```typescript
// Seule forme admise sans manifeste : la liste d'événements de l'event replay varie par page.
const EVENT_REPLAY_BOOTSTRAP =
  /^window\.__jsaction_bootstrap\(document\.body,"ng",\[("[a-z]+"(,"[a-z]+")*)?\],\[("[a-z]+"(,"[a-z]+")*)?\]\);$/;
```

Tout autre script inline n'est pas ajouté à la CSP : le navigateur le bloque, et le serveur le signale dans ses journaux. Les blocs JSON-LD et l'état de transfert d'Angular, qui ne sont pas exécutés, ne sont pas concernés.

Tu vas me dire : pourquoi pas un nonce, la solution habituelle ? Angular ne pose le nonce que sur ses propres styles et sur le script de rejeu des événements. Les autres scripts inline auraient de toute façon exigé un traitement après coup, et poser un nonce après coup sur tous les scripts inline reviendrait à l'accorder aussi à un script injecté.

Le résultat en production : la CSP de chaque page liste quatre empreintes de scripts, et aucune directive ne contient `'unsafe-inline'`.

## Ce que ces barrières ne couvrent pas

Soyons honnêtes sur les limites :

- **Un compte d'administration volé** peut toujours publier un texte trompeur ou un lien vers un site malveillant. L'assainissement empêche l'exécution de code, pas le mensonge.
- **Les commentaires** sont fournis par un service tiers, giscus, dont le script est autorisé par la CSP et dont le contenu s'affiche dans une iframe. Sa sécurité dépend en partie de lui.
- **DOMPurify doit rester à jour.** C'est lui qui porte la première barrière, et ses correctifs de sécurité doivent arriver vite.
- **Le source de développement garde `'unsafe-inline'`**, pour le serveur de développement d'Angular. C'est la sortie de production que la CI vérifie, pas le fichier source.

## Ce que je retiens

Une seule fonction pour transformer le Markdown en HTML, un assainisseur qui marche aussi côté serveur, des images servies par le site, et une CSP dont chaque script autorisé est connu à l'avance. Aucune de ces barrières n'est parfaite seule. Ensemble, elles laissent très peu de place à un script injecté.

Si tu veux creuser, les décisions détaillées sont dans les ADR du dépôt : [assainissement du Markdown (ADR-0002)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0002-assainissement-du-markdown-du-blog.md), [images du corps des articles (ADR-0015)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0015-images-du-corps-des-articles.md), [images servies depuis l'origine du site (ADR-0018)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0018-images-servies-depuis-l-origine-du-site.md) et [CSP du rendu à la requête (ADR-0024)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0024-rendu-a-la-requete-des-pages-de-contenu.md). Le code est public sur [GitHub](https://github.com/j-ned/ng-portfolio-app). Sur la sécurité côté navigateur, j'ai aussi décrit comment [DashFlow chiffre les données avant de les envoyer](https://nedellec-julien.fr/blog/chiffrer-des-donnees-sensibles-cote-client-avec-aes-256-gcm-et-pbkdf2-retour-d-experience-sur-dashflow).
