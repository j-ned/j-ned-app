---
name: angular-signal-forms
description: Doctrine et footguns Signal Forms Angular (stable en v22, `@angular/forms/signals`) — quand préférer Signal Forms à Reactive/Template forms, validation au bord du formulaire, binding `[formField]`, soumission `submit()`, et tests d'un formulaire signals. Déclencher quand on implémente ou teste un formulaire (saisie utilisateur, validation, soumission), qu'on migre un Reactive Form, ou qu'on hésite entre Signal Forms / Reactive Forms / `ngModel`. Couvre les footguns associés (collision d'attributs `[formField]`, appel `()` du champ, `submit()` non-async, défauts `null`, validation au bord vs validation de modèle HTTP).
---

# Angular Signal Forms — doctrine & footguns

Référence ciblée pour les formulaires en **Angular 22+**, où **Signal Forms est
stable** (`@angular/forms/signals`). Code signals : `form()`, schéma de validation,
`[formField]`, `submit()`.

> **Périmètre.** Ce skill porte la **doctrine AAK** (quoi préférer, où valider,
> comment tester) et les **footguns vécus** — pas le tutoriel d'API exhaustif. La
> liste complète des validateurs et l'API détaillée vivent dans la doc officielle
> Angular (et le skill officiel `angular-developer`). Ici : les décisions et les
> pièges que cette doc ne tranche pas pour toi.

---

## Doctrine — Signal Forms d'abord

Sur un projet **Angular 22+**, un formulaire neuf se fait en **Signal Forms**. Le
modèle est un `signal`, la validation est déclarative, et tout l'état (`valid`,
`errors`, `touched`, `dirty`, `pending`) est exposé en signals — cohérent avec le
reste de la stack (signals d'abord, `OnPush` par défaut en v22, zoneless).

| Forme | Quand | Statut AAK |
| --- | --- | --- |
| **Signal Forms** | tout formulaire neuf en v22+ | **défaut** |
| **Reactive Forms** | code legacy pas encore migré ; lib tierce qui n'expose que `ControlValueAccessor`/Reactive | toléré, à migrer |
| **Template-driven (`ngModel`)** | — | **interdit** (même posture que `*ngIf` : l'ancien monde) |

Ne mélange pas les deux mondes dans un même formulaire. Migrer un Reactive Form
vers Signal Forms est un **changement de forme assumé**, pas un patch partiel.

---

## Pattern A — créer le formulaire et valider **au bord de la saisie**

Le modèle est un `signal` avec des **défauts non-`null`** (`''`, `0`, `[]`) — un
`null` casse le typage des validateurs et le binding.

```ts
import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { form, submit, required, email, minLength } from '@angular/forms/signals';

@Component({
  selector: 'app-signup-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form (submit)="onSubmit(); $event.preventDefault()">
      <input [formField]="signupForm.email" />
      <input type="password" [formField]="signupForm.password" />
      <button type="submit" [disabled]="signupForm().invalid() || signupForm().pending()">
        Créer le compte
      </button>
    </form>
  `,
})
export class SignupForm {
  private readonly api = inject(SignupGateway);

  protected readonly model = signal({ email: '', password: '' });

  protected readonly signupForm = form(this.model, (path) => {
    required(path.email, { message: 'Email requis' });
    email(path.email);
    minLength(path.password, 12, { message: '12 caractères minimum' });
  });

  // …
}
```

**Validation au bord ≠ validation de modèle HTTP.** Les validateurs Signal Forms
gardent **l'entrée utilisateur** (forme du champ, requis, format). Ils **ne
remplacent pas** la validation runtime aux frontières réseau/storage
(`angular-expert` § Modèles de données : réponses HTTP, lectures de storage). Un
`POST` validé côté form peut quand même renvoyer une réponse à re-valider avec la
lib de schéma du profil. Deux barrières distinctes, ne les confonds pas.

**Schéma de vérité unique.** Si le profil dérive ses modèles d'un schéma
(`z.infer<typeof Schema>`, point de vérité unique), garde ce schéma comme source
du **type** du modèle de formulaire ; reporte ses contraintes dans le schéma
Signal Forms (ou via l'interop standard-schema si le profil l'utilise — vérifie
l'API exacte dans la doc officielle avant de l'employer). Ne duplique pas en
double maintenance deux jeux de règles qui divergeront.

---

## Pattern B — binding `[formField]` et lecture d'état

`[formField]` **possède** l'élément : il pilote `value`, `disabled`, `readonly`,
`min`, `max`. **Footgun central** : ne pose **aucun** de ces attributs en parallèle
sur le même élément — tu crées deux sources de vérité qui se battent.

```html
<!-- ❌ collision : min/max/disabled posés à la main ET par [formField] -->
<input [formField]="form.age" min="18" max="100" [disabled]="busy()" />

<!-- ✅ tout passe par le schéma (min/max) et l'état du champ (disabled) -->
<input [formField]="form.age" />
```

Les contraintes `min`/`max`/`disabled`/`hidden`/`readonly` se déclarent dans le
**schéma** (`min(path.age, 18)`, `disabled(path.x, { when })`), pas sur le DOM.

**Lire l'état = appeler le champ comme une fonction.** Le footgun le plus fréquent :

```ts
form.email().errors()   // ✅ champ appelé, puis le signal d'erreurs
form().invalid()        // ✅ état de la racine du formulaire
form.email.errors()     // ❌ erreur : il manque l'appel du champ
form.invalid()          // ❌ idem sur la racine
form.items.length       // ✅ exception : longueur de tableau = accès structurel, sans ()
```

---

## Pattern C — soumission `submit()`

Le callback de `submit()` **doit être `async`** et renvoyer une `Promise`.
`submit()` marque tous les champs `touched` (révèle les erreurs), n'exécute
l'action que si le formulaire est valide, et expose `pending()` pendant l'attente.

```ts
async onSubmit(): Promise<void> {
  await submit(this.signupForm, async () => {
    await this.api.create(this.model());
    // erreurs serveur : remonter via le canal d'erreurs du form (cf. doc),
    // pas un signal d'erreur bricolé à côté.
  });
}
```

Le bouton submit se désactive sur `form().invalid() || form().pending()` —
**pas** via un `[disabled]` posé sur un `[formField]` (cf. Pattern B).

---

## Footguns critiques

- **🔴 Collision d'attributs `[formField]`.** Jamais `min`/`max`/`value`/`[value]`/
  `[disabled]`/`[readonly]` sur un élément déjà porté par `[formField]` : le champ
  les possède, le double pilotage produit des états incohérents invisibles aux
  tests qui n'asservissent que « le champ s'affiche ».
- **🔴 Modèle initialisé à `null`.** Défauts non-`null` obligatoires (`''`, `0`,
  `[]`). Un `null` casse le typage des paths du schéma et le binding.
- **🟡 Champ non appelé.** `form.x().valid()`, pas `form.x.valid()` ; racine =
  `form().valid()`. Erreur de compilation au mieux, signal jamais lu au pire.
- **🟡 `submit()` non-async.** `submit(form, async () => {…})` — un callback
  synchrone casse le cycle de soumission (`pending`, erreurs serveur).
- **🟡 Mélange Reactive + Signal Forms** dans un même formulaire : choisis un monde
  par formulaire. La migration est un changement de forme, pas un patch.
- **🟡 Validation du form prise pour validation de modèle.** Le schéma Signal Forms
  garde l'entrée utilisateur ; il ne dispense pas de re-valider les réponses HTTP
  au bord réseau avec la lib du profil.

---

## Tests (cf. conventions `qa`)

- **Construis le modèle via le builder du domaine, jamais un littéral d'objet.**
  L'invariant builder de `qa` vaut ici : le modèle qui alimente `form(...)` passe
  par son builder/factory, y compris pour une construction unique. Un littéral
  n'est légitime que comme **valeur attendue** d'une assertion, jamais comme
  **entrée sous test**.
- **Teste le comportement de validation, pas l'arrivée.** Pilote le `signal` du
  modèle (ou la saisie via Angular Testing Library) puis asserte
  `form.x().errors()` / `form().valid()`. Couvre au moins : champ requis manquant,
  format invalide (email/pattern), et le **passage à valide** quand l'entrée est
  corrigée.
- **Teste la soumission des deux côtés.** Form invalide ⇒ `submit()` n'appelle pas
  la gateway et révèle les erreurs (`touched`). Form valide ⇒ la gateway est
  appelée **une fois** avec le modèle attendu. Spy sur la gateway injectée, pas sur
  un détail interne du form.
- **Validation async / erreurs serveur** : couvre l'état `pending()` pendant
  l'attente et le mapping d'une erreur serveur vers le champ concerné — un test
  vert sur la seule soumission heureuse laisse passer le cas d'échec réel.
