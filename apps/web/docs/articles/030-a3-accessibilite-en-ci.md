---
id: 030-a3
titre: "Tester l'accessibilité à chaque PR dans un vrai navigateur : comment je fais tourner axe et Playwright contre l'image Docker de production"
extrait: "Mes régressions de contraste passaient les revues. Je t'explique pourquoi l'audit axe tourne dans Chromium contre l'image Docker de production plutôt que dans les tests unitaires, comment j'y ferme le réseau, et les conventions de formulaires et de boutons qui vont avec."
tags: [Accessibilité, Tests, CI/CD, Angular, Portfolio]
projet: Portfolio
adr:
  - docs/adr/0025-audit-axe-en-navigateur-reel-contre-l-image-de-ci.md
  - docs/adr/0016-erreur-de-champ-et-convention-aria-des-formulaires.md
  - docs/adr/0017-bouton-en-directive-d-attribut.md
faits-verifies: 2026-10-21 sur master 349142c / CI de la PR #242 / démonstration axe dans happy-dom avec les versions du dépôt
statut: brouillon
slug: ""
---

<!--
Relecture : le corps commence après ce commentaire. À coller dans l'éditeur de l'admin sans le
front-matter ni ce commentaire. Ne publier qu'après la recréation de la fiche projet « Portfolio »,
et après A1 et A2.

À trancher avant publication : le job a11y n'est PAS un check requis de la protection de branche de
master au 2026-10-21 (requis : « Lint · Test · Build production » et « Docker build »). Le texte le
dit honnêtement (section « Ce que l'audit ne garantit pas »). Si le propriétaire le rend requis
avant publication, remplacer ce passage par « le job est un check requis : une violation bloque le
merge ».
Réécrit au tutoiement, spec 031.
-->

Sur ce site, deux régressions de contraste n'ont été repérées qu'après leur merge, alors que chaque PR était relue à la main. Tu le sais sûrement : une couleur de texte un peu trop claire sur un fond un peu trop clair ne se voit pas dans une revue de code, et rarement à l'œil sur un bon écran. J'ai donc ajouté un audit d'accessibilité automatique à chaque PR.

Je t'explique ici pourquoi cet audit tourne dans un vrai navigateur contre l'image Docker de production, et pas dans les tests unitaires ; comment il est isolé de la production ; et les deux conventions de code qui rendent ses résultats stables : une erreur de formulaire partagée et un bouton unique.

## Pourquoi pas dans les tests unitaires

Les tests unitaires du site tournent avec Vitest dans happy-dom, un DOM simulé, rapide et sans navigateur. Ajouter axe-core à ces tests semblait naturel. Avant de foncer, j'ai mesuré ce qu'il y voit, avec les versions installées dans le dépôt (axe-core 4.13.0, happy-dom 20.14.5), sur une page qui contient trois défauts :

```html
<main>
  <p style="color:#bbb;background:#fff">texte peu contrasté</p>
  <button></button>
  <img src="x.png">
</main>
```

Résultat : `button-name` et `image-alt` sont bien signalés. Le texte gris clair sur fond blanc, lui, n'est pas signalé : la règle `color-contrast` finit dans les résultats « incomplets », à vérifier par un humain. Un DOM simulé ne calcule ni le rendu des couleurs ni la mise en page, donc ni le contraste, ni la taille des zones cliquables, ni le recouvrement d'un élément par un autre.

Or le contraste était précisément le défaut qui passait entre les mailles. Un audit qui ne le voit pas ne me servait à rien ici.

## L'audit tourne sur ce qui est déployé

L'audit tourne donc avec Playwright et `@axe-core/playwright`, dans Chromium, contre **l'image Docker que la production exécute**, et non contre le serveur de développement. C'est la seule façon de tester ce que tu verrais en visitant le site : le HTML rendu par le serveur, servi par nginx, avec la vraie politique de sécurité du contenu et les vraies polices.

Chaque PR construit l'image, la démarre à côté d'une doublure de l'API qui sert des données de test, puis l'audit parcourt les pages publiques, les pages de l'administration (avec une session simulée et des données) et quelques états interactifs : menu mobile ouvert, dialogue de confirmation. Chaque scénario est joué **en thème clair et en thème sombre**. Sur la dernière PR du site, le job a exécuté 55 tests en 2 min 54 s.

Les règles appliquées sont celles de WCAG 2.0, 2.1 et 2.2, niveaux A et AA :

```typescript
export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'] as const;
```

Le tag `wcag21a` te paraîtra peut-être redondant, mais sans lui les règles de niveau A ajoutées par WCAG 2.1 ne tournent pas.

La règle est **zéro violation**, sans exception silencieuse : aucune règle désactivée, aucune zone exclue, aucune liste de défauts « connus ». Une exception future devra passer par un amendement écrit de la décision, avec sa justification et une date de réexamen.

## Un audit qui ne touche jamais la production

Le site appelle son API à une adresse de production écrite en dur dans le code du navigateur. Sans précaution, un audit de l'image lirait la base de production, et pourrait même y écrire : la mesure d'audience envoie des requêtes `POST`. Pas le genre de surprise que tu veux un lundi matin.

Chaque contexte de navigateur intercepte donc toutes les requêtes :

```typescript
await context.route('**/*', async (route) => {
  const url = new URL(route.request().url());
  if (url.origin === origin) {
    await route.continue();
    return;
  }
  if (url.hostname === PRODUCTION_API_HOST) {
    network.rerouted.push(`${route.request().method()} ${url.pathname}${url.search}`);
    await replayOnStub(route, url, origin);
    return;
  }
  network.blocked.push(url.href);
  await route.abort('blockedbyclient');
});
```

Ce qui vient de l'image passe. Ce qui vise l'API de production est rejoué contre la doublure. Tout le reste (commentaires, suivi des erreurs, services tiers) est coupé. La liste des requêtes redirigées et bloquées est jointe au rapport de chaque test.

Trois autres réglages rendent l'audit reproductible : le thème est forcé avant le premier script, les animations sont réduites (`reducedMotion: 'reduce'`), et chaque test attend un repère explicite de la page plutôt qu'un « réseau au repos », que Playwright déconseille. Le test fait aussi défiler la page avant l'audit, pour que les sections chargées à l'affichage soient présentes.

## Des formulaires qui annoncent leurs erreurs de la même façon

Un audit automatique vérifie qu'un champ a un nom ou qu'une erreur est reliée à son champ. Il ne peut pas inventer une convention à ta place. J'en ai fixé une pour tous les formulaires du site, avec un composant d'erreur partagé :

```typescript
@Component({
  selector: 'app-field-error',
  host: { class: 'contents' },
  template: `
    @let state = field()();
    @if (state.touched() && state.invalid()) {
      <p [id]="errorId()" role="alert" class="form-error">
        {{ state.errors()[0]?.message }}
      </p>
    }
  `,
})
export class FieldError { /* field, errorId */ }
```

Le composant n'affiche que la première erreur d'un champ déjà touché, avec `role="alert"` pour qu'elle soit annoncée. Le champ, lui, porte son propre état :

```html
<input
  id="name"
  [formField]="contactForm.name"
  aria-required="true"
  [attr.aria-invalid]="nameInError"
  [attr.aria-describedby]="nameInError ? 'contact-name-error' : null"
/>
<app-field-error [field]="contactForm.name" errorId="contact-name-error" />
```

Quand tu envoies un formulaire invalide, le focus va sur le premier champ en erreur, dans l'ordre de la page. Le bouton d'envoi n'est jamais désactivé parce que le formulaire est invalide : un bouton désactivé ne reçoit pas le focus et n'est pas annoncé, tu ne saurais pas pourquoi rien ne se passe.

## Un seul bouton

Avant, le site avait trois façons de styler un bouton, avec deux apparences différentes. Un peu trop pour un seul bouton. Il n'en reste qu'une : une directive posée sur l'élément natif, `button[appButton]` ou `a[appButton]`. Elle ajoute ses classes Tailwind sans envelopper l'élément, donc `type`, `disabled`, `href`, `aria-pressed` et `aria-label` restent ceux du HTML natif. Toutes les variantes partagent une hauteur minimale de 44 px (`min-h-11`), la taille de cible tactile recommandée.

Deux garde-fous complètent la directive. Le linter impose un `type` explicite sur chaque `<button>`, car un bouton sans type soumet le formulaire qui l'entoure. Et la règle globale de focus ne change plus la forme d'un élément : avant, elle imposait un rayon de 4 px qui transformait le bouton rond du thème en carré arrondi au focus clavier.

## Ce que l'audit ne garantit pas

L'audit automatique ne couvre qu'une partie de WCAG, et la documentation de Playwright le rappelle. Il ne dit rien de l'ordre du focus, de la pertinence d'un texte alternatif, de l'utilisation au clavier ni de ce qu'annonce réellement un lecteur d'écran. Ces points restent couverts par les tests de composants (rôles, noms, focus) et par des vérifications à la main. Garde-les dans ta routine.

Autre limite, plus terre à terre : au moment où j'écris, le job d'accessibilité échoue bien en rouge sur une PR fautive, mais il ne fait pas encore partie des contrôles obligatoires de la branche principale. Une violation se voit, mais rien n'empêche techniquement de fusionner.

## Ce que je retiens

Tester l'accessibilité dans un DOM simulé te donne une impression de sécurité sur le défaut le plus courant, le contraste, alors qu'il n'y est pas évalué. Auditer l'image de production dans un vrai navigateur, en clair et en sombre, avec un réseau fermé, coûte trois minutes par PR et voit ce que voit le visiteur. Les conventions de code font le reste : un audit stable a besoin de composants qui se comportent tous de la même façon.

Si tu veux creuser, les décisions détaillées sont dans les ADR du dépôt : [audit axe en navigateur réel (ADR-0025)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0025-audit-axe-en-navigateur-reel-contre-l-image-de-ci.md), [erreur de champ et convention ARIA (ADR-0016)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0016-erreur-de-champ-et-convention-aria-des-formulaires.md) et [bouton en directive d'attribut (ADR-0017)](https://github.com/j-ned/ng-portfolio-app/blob/master/docs/adr/0017-bouton-en-directive-d-attribut.md). Tu trouveras les scénarios d'audit dans le dossier [`e2e/a11y`](https://github.com/j-ned/ng-portfolio-app/tree/master/e2e/a11y) du dépôt.
