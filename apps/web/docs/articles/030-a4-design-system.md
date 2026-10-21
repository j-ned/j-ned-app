---
id: 030-a4
titre: "Le design system d'un site personnel : polices auto-hébergées, thème sans flash et Tailwind v4 sans @apply partout"
extrait: "Trois polices servies par le site sans Google Fonts ni décalage à l'affichage, une licence qui impose de renommer IBM Plex, un thème clair ou sombre appliqué avant la première peinture, et des règles simples pour savoir quand Tailwind v4 mérite un composant."
tags: [Design system, Tailwind CSS, Performance, Angular, Portfolio]
projet: Portfolio
adr:
  - docs/adr/0006-polices-auto-hebergees.md
  - docs/adr/0012-source-de-verite-du-theme.md
  - docs/adr/0003-utility-tailwind-et-apply.md
  - docs/adr/0017-bouton-en-directive-d-attribut.md
faits-verifies: 2026-10-21 sur master bb9640d / en production (navigateur et curl)
statut: brouillon
slug: ""
---

<!--
Relecture : le corps commence après ce commentaire. À coller dans l'éditeur de l'admin sans le
front-matter ni ce commentaire. Ne publier qu'après la recréation de la fiche projet « Portfolio »,
et après A1, A2 et A3 (un article par semaine).
-->

L'identité visuelle de ce site s'inspire des plans d'atelier : un cartouche comme on en trouve en bas d'un dessin technique, des cotes, une typographie qui distingue clairement les titres, le texte et les données. Ce genre d'identité tient en grande partie à la typographie et à la cohérence des composants. Cet article décrit trois décisions qui la portent : des polices servies par le site lui-même, un thème clair ou sombre appliqué sans flash, et des règles claires pour Tailwind CSS v4.

## Trois polices, servies par le site

Le site utilise trois familles : Archivo pour les titres (avec un axe de largeur variable), IBM Plex Sans pour le texte et IBM Plex Mono pour les données. La façon la plus simple de les charger aurait été Google Fonts. Je ne l'ai pas fait : servir des polices depuis les serveurs de Google transmet l'adresse IP de chaque visiteur à Google, et un tribunal de Munich a jugé cette pratique illicite sans consentement (LG München, 20 janvier 2022). Ce site n'a pas de bandeau de consentement et n'en veut pas.

Les fichiers sont donc servis par le site, depuis son propre domaine. La politique de sécurité du contenu n'a même pas eu à changer : `font-src 'self'` les couvrait déjà.

### Des fichiers réduits à ce qui sert

Les fichiers viennent des paquets Fontsource (déjà découpés au sous-ensemble latin), puis sont réduits avec `fontTools` aux seules plages d'axes réellement employées. Archivo n'est utilisée qu'en titre, entre les graisses 600 et 800 et les largeurs 100 et 110 :

```sh
python3 -m fontTools.varLib.instancer archivo-latin-wdth-normal.woff2 wdth=100:110 wght=600:800 \
  -o archivo-2.001-latin-wdth100-110-wght600-800.woff2
```

| Fichier servi | Avant réduction | Après |
|---|---|---|
| Archivo (titres) | 90 104 octets | 39 512 octets |
| JN Sans (texte) | 45 712 octets | 35 864 octets |
| JN Sans italique | 50 184 octets | 38 840 octets |
| JN Mono (données, renommée seulement) | 14 888 octets | 14 924 octets |

Mesuré en production le 21 octobre : la page d'accueil télécharge trois fichiers, soit 90 300 octets. L'italique n'est jamais préchargée : le navigateur ne la demande que si un texte de la page l'utilise, ce qui n'arrive que dans les articles.

Seule la police des titres est préchargée, parce que le titre principal de chaque page est l'élément affiché en premier :

```html
<!-- crossorigin requis même en même origine, sinon double téléchargement -->
<link rel="preload" href="/fonts/archivo-2.001-latin-wdth100-110-wght600-800.woff2"
      as="font" type="font/woff2" crossorigin />
```

### La version dans le nom du fichier

nginx sert les polices avec `Cache-Control: public, max-age=31536000, immutable` : un navigateur ne redemande jamais un fichier pendant un an. Comme ces fichiers ne passent pas par le build, leur nom n'est pas haché automatiquement. La règle est donc d'écrire la version et les axes dans le nom : tout changement de binaire change le nom, dans la feuille de styles et dans le préchargement.

### Pas de décalage quand la police arrive

Avec `font-display: swap`, le texte s'affiche d'abord dans une police système, puis bascule quand la vraie police est chargée. Si les deux n'ont pas les mêmes proportions, toute la page saute. Chaque police principale a donc une face de repli ajustée pour avoir les mêmes métriques :

```css
@font-face {
  font-family: 'Archivo Fallback';
  src: local('Arial Bold'), local('Arial-BoldMT'), local('Liberation Sans Bold'),
    local('LiberationSans-Bold');
  size-adjust: 109.59%;
  ascent-override: 80.11%;
  descent-override: 19.16%;
  line-gap-override: 0%;
}
```

Les valeurs sont calculées depuis les tables de métriques des deux polices et la largeur moyenne d'un échantillon de texte français. La face de repli d'Archivo pointe vers Arial **Bold** : le site interdit le faux gras (`font-synthesis-weight: none`), et une Arial normale aurait affiché les titres environ 10 % plus étroits.

### Une licence qui impose de renommer

IBM Plex est sous licence SIL Open Font License, avec un *Reserved Font Name* : « Plex ». Une version modifiée de la police ne peut pas porter ce nom. Or réduire les axes et découper un sous-ensemble, c'est modifier la police. Les fichiers servis sont donc renommés dans leur table de noms, sans toucher aux glyphes : IBM Plex Sans devient **JN Sans**, IBM Plex Mono devient **JN Mono**. Archivo, sans nom réservé, garde le sien. Les deux licences sont publiées à côté des fichiers.

## Un thème clair ou sombre, sans flash

Le site a deux registres de couleurs, un sombre et un clair. Le thème suit la préférence du système, sauf si le visiteur en a choisi un. La logique tient dans une fonction pure :

```typescript
export type ThemePreference = 'system' | 'light' | 'dark';

export function resolveIsDark(preference: ThemePreference, systemPrefersDark: boolean): boolean {
  return preference === 'system' ? systemPrefersDark : preference === 'dark';
}
```

Un seul store Angular, `ThemeStore`, possède la préférence. Il expose `isDark` sous forme de signal, écoute les changements de préférence système, et pose lui-même la classe `app-dark` sur `<html>`. Le bouton du site, l'administration, les commentaires et les graphiques lisent tous ce même signal. Le store n'enregistre la préférence que lorsque le visiteur fait un choix explicite : sans choix, le site continue de suivre le système, même si celui-ci change.

Reste le flash : la page arrive du serveur avant qu'Angular démarre. Sans précaution, un visiteur en thème sombre verrait d'abord la page claire. Un petit script placé en tête de page pose la classe avant la première peinture, selon la même règle que le store :

```html
<script>
  try {
    var t = localStorage.getItem('j-ned:theme');
    if (t === 'dark' || (t !== 'light' && matchMedia('(prefers-color-scheme: dark)').matches))
      document.documentElement.classList.add('app-dark');
  } catch (e) {}
</script>
```

Ce script est un des rares scripts inline du site : son empreinte figure dans la politique de sécurité du contenu, qui n'accepte pas `'unsafe-inline'`. Côté Tailwind, la variante `dark:` lit cette même classe :

```css
@custom-variant dark (&:where(.app-dark, .app-dark *));
```

## Tailwind v4 : quand faut-il un composant ?

Tailwind encourage à écrire les classes directement dans le HTML. Le risque, dans un projet qui grandit, est de voir apparaître des classes CSS maison et des `@apply` un peu partout, ce qui recrée exactement le CSS que Tailwind voulait éviter. J'ai fixé quatre règles :

1. **Par défaut, des classes utilitaires** dans le gabarit, y compris sur l'élément hôte du composant.
2. **Une structure de plusieurs éléments réutilisée devient un composant Angular**, jamais une classe CSS. C'est aussi ce que recommande la documentation de Tailwind v4.
3. **Une liste de classes réutilisée sur un élément natif qu'on ne peut pas envelopper** (un `input` possédé par un formulaire, une cellule de tableau, un conteneur de mise en page) devient un `@utility` dans la feuille globale, nommé par son rôle. Le site en compte 15, comme `form-input`, `table-head` ou `page-container`.
4. **`@apply` n'est permis qu'à l'intérieur d'un `@utility`.** Jamais dans les styles d'un composant, jamais dans une classe ad hoc.

Les boutons ont posé un cas particulier. Le site avait trois façons de les styler, dont des `@utility` pour les liens présentés en bouton. En préparant leur unification, une mesure avec Tailwind 4.3 a montré un défaut de cascade : dans un `@utility`, une règle `&:disabled` imbriquée sort avant `hover:opacity-90`, si bien qu'un bouton désactivé survolé redevient presque opaque. Boutons et liens présentés en bouton sont donc devenus une directive Angular posée sur l'élément natif, `button[appButton]` ou `a[appButton]`, qui calcule ses classes et utilise les variantes de Tailwind (`disabled:`, `aria-pressed:`), dont l'ordre est correct.

Les couleurs, enfin, sont des tokens en OKLCH déclarés dans `@theme`, une fois pour chaque registre. OKLCH sépare la luminosité de la teinte, ce qui rend les contrastes plus prévisibles d'un thème à l'autre.

## Ce que ça coûte

- **Les polices sont à maintenir à la main.** Une nouvelle version d'Archivo ou d'IBM Plex ne s'installe pas avec un `pnpm update` : il faut refaire la réduction, le renommage, changer les noms de fichiers et mettre à jour le préchargement. La commande complète est consignée dans l'ADR.
- **Les métriques des faces de repli sont calibrées sur Arial et Liberation Sans.** Un système qui n'a aucune des deux tombe sur une police de repli non ajustée.
- **Le script de pré-peinture duplique la règle du store.** Si la clé de stockage ou la règle change, il faut changer les deux.
- **Les règles Tailwind demandent du jugement** à la frontière entre utility et composant. Elles sont écrites pour que la décision soit la même d'une PR à l'autre.

## Ce que je retiens

Un design system de site personnel n'a pas besoin d'une bibliothèque de composants entière. Il a besoin de quelques décisions tenues partout : des polices servies par le site et sans décalage, une seule source de vérité pour le thème, et des règles qui disent quand une répétition mérite un composant.

Les décisions détaillées sont dans les ADR du dépôt : [polices auto-hébergées (ADR-0006)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0006-polices-auto-hebergees.md), [source de vérité du thème (ADR-0012)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0012-source-de-verite-du-theme.md), [utilities Tailwind et `@apply` (ADR-0003)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0003-utility-tailwind-et-apply.md) et [bouton en directive d'attribut (ADR-0017)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0017-bouton-en-directive-d-attribut.md). La référence visuelle complète est le fichier [`DESIGN.md`](https://github.com/j-ned/ng-portfolio-app/blob/master/DESIGN.md) du dépôt.
