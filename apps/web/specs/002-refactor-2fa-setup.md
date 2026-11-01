---
id: 002
title: Refactor du god-file two-factor-setup en composants dumb pilotés par un smart parent
type: refactor
status: done
finding: F007
created: 2026-06-14
related: [ADR-0002]
---

# 002 — Refactor `two-factor-setup` (god-file 3-en-1)

## Description

Le composant `src/app/features/auth/application/two-factor-setup.ts` (618 LOC)
porte **trois formulaires de sécurité distincts** dans une seule classe et un
seul template inline :

1. **Changement de mot de passe** (`pwdForm`, `changePassword()`).
2. **Activation 2FA** : génération du secret + QR code, puis vérification d'un
   code TOTP (`tfaForm`, `generate()`, `enable()`, `reconfigure()`).
3. **Désactivation 2FA** : confirmation par mot de passe (`disableForm`,
   `disableTwoFactor()`).

Le fichier dépasse de loin le seuil d'altitude composant du profil (250 LOC ;
gate advisory `code-reviewer`). Il cumule trois préoccupations métier
indépendantes sur une **surface de sécurité sensible**, ce qui pénalise la
lisibilité, la testabilité ciblée et la sûreté des modifications (un changement
sur le flux 2FA force la relecture du flux mot de passe). Finding d'intake
**F007**.

Défaut de convention secondaire constaté : l'**ordre des propriétés** n'est pas
conforme au profil (CLAUDE.md § Composants). Les blocs d'état du mot de passe
(`pwdSuccess`, `pwdError`, `isPwdLoading`, `pwdForm`) et de la méthode
`changePassword()` sont déclarés **avant** les signals/forms du 2FA
(`qrCodeUrl`, `secret`, `tfaForm`, `disableForm`), si bien que des signals sont
déclarés après une méthode — l'ordre attendu est : deps injectées → inputs/
outputs → queries → signals/computed → méthodes.

### Objectif

Découper le god-file en **trois composants dumb** (`PasswordChangeForm`,
`TwoFactorEnableForm`, `TwoFactorDisableForm`) pilotés par un **smart parent**
qui conserve le selector public `app-two-factor-setup` et orchestre les appels à
`AuthStore`. Aucune régression fonctionnelle ni d'accessibilité : mêmes flux,
mêmes libellés, mêmes `data-testid`/ids d'erreurs, mêmes attributs ARIA, mêmes
`autocomplete`.

### Périmètre

- **Dans le périmètre** : `features/auth/application/` (le composant cible et
  ses nouveaux enfants), sa spec, le barrel `application/index.ts`.
- **Hors périmètre** : `AuthStore` (inchangé — son API publique est conservée),
  `auth.gateway`, `http-auth.gateway`, la route `admin.routes.ts` (le selector
  et l'export `TwoFactorSetup` restent stables, aucun changement d'import requis
  côté appelant), les composants `shared/ui` (`Button`, `AppIcon` réutilisés tels
  quels).

### Critères d'acceptation

- L'export `TwoFactorSetup` et le selector `app-two-factor-setup` sont préservés ;
  `admin.routes.ts` et `application/index.ts` n'ont pas besoin d'être modifiés
  pour continuer à fonctionner.
- Les trois flux (changer mot de passe, activer 2FA via QR+TOTP, désactiver 2FA)
  produisent le **même comportement observable** qu'avant (succès/erreur, reset
  de form, transition d'états).
- Tous les attributs d'a11y existants sont préservés à l'identique : `aria-required`,
  `aria-invalid`, `aria-describedby`, `role="alert"`, ids d'erreur
  (`twofa-setup-*-error`), `autocomplete`, `inputmode`.
- Chaque nouveau fichier respecte le seuil d'altitude (< 250 LOC) et l'ordre des
  propriétés du profil.
- `pnpm test`, `pnpm lint`, `pnpm build` au vert.

## Plan technique

> cf. ADR-0002 (découpage smart/dumb, formulaire local au dumb).

### 1. Architecture

Refactor en **un smart parent + trois dumb children**, sans nouvelle couche ni
nouveau store/facade.

```
app-two-factor-setup  (SMART — inject AuthStore, orchestre RxJS, détient l'état serveur)
├── app-password-change-form     (DUMB — pwdForm local, émet (submit))
├── app-two-factor-enable-form   (DUMB — tfaForm local + affichage QR/secret, émet (generate)/(verify))
└── app-two-factor-disable-form  (DUMB — disableForm local, émet (disable)/(cancel))
```

**Pourquoi smart parent + dumb children, et pas une facade `application/**` ?**
Le partage d'état est **sous le seuil de promotion** du profil (« partagé entre
2+ composants non liés »). Ici l'état ne franchit jamais la frontière du parent :
chaque enfant gère son propre formulaire ; le parent détient l'état serveur
(QR/secret) et le statut 2FA dérivé. `AuthStore` (`core/auth`, singleton de
session, cf. ADR-0001) **est déjà** le store qui possède la vérité de session
(`currentUser`, commandes `enableTwoFactor`/`disableTwoFactor`/`changePassword`).
Introduire une facade `application/**` ne ferait que **ré-exposer** des slices
d'`AuthStore` et des `Observable` — précisément ce que le profil interdit à une
facade (« pas de ré-exposition d'un store », « ne rend pas l'Observable comme API
principale »). Le smart parent suffit et reste le bon coordinateur instance-scopé
de l'écran.

**Responsabilités**

| Acteur | Responsabilité |
|--------|----------------|
| `TwoFactorSetup` (smart) | injecte `AuthStore`, `DestroyRef` ; détient `qrCodeUrl`/`secret`/`showDisableForm`/`isTwoFactorEnabled` ; détient les signals de feedback (`pwd*`, `tfa*`) ; souscrit aux Observables d'`AuthStore` avec `takeUntilDestroyed`, applique le Result-like (booléen) aux signals ; choisit quel enfant rendre via `@if`. |
| `PasswordChangeForm` (dumb) | possède `pwdForm` ; rend les 3 champs + erreurs a11y ; expose `loading`/`successMessage`/`errorMessage` en `input()` ; émet `submit` (payload `{ currentPassword, newPassword }`) ; se réinitialise sur ordre du parent. |
| `TwoFactorEnableForm` (dumb) | possède `tfaForm` (code TOTP) ; rend le bouton « Configurer », le bloc QR+secret quand `qrCodeUrl` est fourni, le champ code ; expose `qrCodeUrl`/`secret`/`loading`/`errorMessage`/`successMessage` en `input()` ; émet `generate` (aucun payload) et `verify` (payload `code: string`). |
| `TwoFactorDisableForm` (dumb) | possède `disableForm` ; rend l'état « 2FA activé », le toggle d'affichage du form, le champ mot de passe ; expose `loading`/`errorMessage`/`successMessage`/`showForm` ; émet `disable` (payload `password: string`), `cancel`, `reconfigure`. |

**Invariant a11y (landmarks).** Aucun des composants n'introduit de landmark
`banner`/`main`/`contentinfo` : ce sont des sections de formulaire (`<h2>`,
`<form>`, `<label>`). Aucun risque d'ambiguïté de landmark ; le shell admin reste
seul propriétaire de ses landmarks. Le `<h1>` de la page reste hors de ce
composant (déjà le cas). Les `<h2>` par carte sont conservés.

### 2. Fichiers à créer / modifier

**Créer**

| Chemin | Rôle |
|--------|------|
| `src/app/features/auth/application/password-change-form.ts` | Dumb : formulaire de changement de mot de passe (form local, inputs feedback, output `submit`). |
| `src/app/features/auth/application/password-change-form.spec.ts` | Specs a11y + comportement du dumb mot de passe (auteur : `qa`). |
| `src/app/features/auth/application/two-factor-enable-form.ts` | Dumb : génération QR + saisie code TOTP (form local, inputs QR/secret/feedback, outputs `generate`/`verify`). |
| `src/app/features/auth/application/two-factor-enable-form.spec.ts` | Specs a11y + comportement du dumb d'activation (auteur : `qa`). |
| `src/app/features/auth/application/two-factor-disable-form.ts` | Dumb : statut 2FA activé + désactivation par mot de passe (form local, outputs `disable`/`cancel`/`reconfigure`). |
| `src/app/features/auth/application/two-factor-disable-form.spec.ts` | Specs a11y + comportement du dumb de désactivation (auteur : `qa`). |
| `docs/adr/0002-decoupage-two-factor-setup-smart-dumb.md` | ADR du découpage (déjà créé, cf. plus bas). |

**Modifier**

| Chemin | Changement |
|--------|------------|
| `src/app/features/auth/application/two-factor-setup.ts` | Devient le **smart parent** : importe les 3 dumbs, conserve `AuthStore` + l'orchestration RxJS + l'état serveur/feedback, template réduit au câblage des 3 enfants via `@if`. Selector et nom de classe inchangés. Ordre des propriétés remis conforme. |
| `src/app/features/auth/application/two-factor-setup.spec.ts` | Réécrit par `qa` : tests d'intégration du smart parent (orchestration + sélection d'enfant) ; les assertions a11y fines migrent vers les specs des dumbs. |

**Inchangé (vérifié)** : `application/index.ts` (exporte toujours
`TwoFactorSetup`), `admin.routes.ts` (`loadComponent` sur le même module/export),
`core/auth/auth-store.ts`.

> Les 3 dumbs restent dans `application/` (et non `shared/ui/`) : ils sont
> spécifiques à la feature `auth`, non réutilisables ailleurs (YAGNI ; le profil
> réserve `shared/ui/` aux primitives réutilisables). Pas de barrel ajouté pour
> eux (le profil proscrit les barrels qui cassent le tree-shaking ; ils sont
> importés par chemin direct depuis le smart parent).

### 3. Modèles de données

Aucun modèle de domaine nouveau. On introduit des **types de payload d'output**
locaux (non exportés hors de la feature, déclarés dans le fichier du dumb
concerné), en `type` immutable conforme au profil :

```ts
type PasswordChangeRequest = {
  readonly currentPassword: string;
  readonly newPassword: string;
};
```

L'activation émet le `code: string` (output `verify`), la désactivation émet le
`password: string` (output `disable`) — types primitifs, pas de wrapper requis.

**Shapes de formulaire** (`PasswordFormShape`, `TfaFormShape`,
`DisableFormShape`) : **déplacées telles quelles** dans le fichier du dumb qui
porte le form correspondant. Pas de mutualisation (un concept par fichier).

**Validation aux frontières** : le profil déclare *aucune lib de validation
runtime côté front*. La validation reste assurée par les `Validators` Angular du
form (longueur, pattern mot de passe, pattern `^\d{6}$` du code) — identiques à
l'existant. La frontière HTTP reste tenue par `AuthStore`/gateway, hors périmètre.
*Trace profil : validation runtime des réponses HTTP non vérifiée (conforme au
profil : non applicable côté front).*

### 4. Réactivité

- **Forms** : `Reactive Forms` typés (`FormGroup<...Shape>`, `nonNullable: true`),
  identiques à l'existant — un formulaire reste l'outil adapté pour saisie +
  validation + erreurs a11y ; pas de migration vers Signal Forms dans ce refactor
  (objectif : zéro régression, pas de changement de techno).
- **Feedback** : `signal()` pour `loading`/`error`/`success`, **propriété du
  smart parent**, poussés vers les dumbs en `input()`. Les dumbs ne portent
  aucun signal d'état serveur.
- **État dérivé** : `isTwoFactorEnabled` reste un `computed()` dans le smart
  parent, dérivé de `AuthStore.currentUser()`.
- **Flux async** : RxJS justifié (l'API d'`AuthStore` renvoie des `Observable`).
  On conserve `subscribe` + `takeUntilDestroyed(this.destroyRef)` **dans le smart
  parent uniquement**. Pas de `rxResource()` ici : ce sont des **commandes**
  déclenchées par interaction (submit), pas des lectures déclaratives — le profil
  réserve `resource()` aux flux de lecture.
- **Reset de form post-succès** : aujourd'hui le parent appelait `form.reset()`.
  Comme le form vit désormais dans le dumb, le parent signale le reset via un
  `input()` de version/jeton de reset (ex. `resetToken = input<number>()`) que le
  dumb observe avec un `effect()` pour appeler `form.reset()`, **ou** via une
  méthode publique exposée par le dumb et appelée par le parent via `viewChild`.
  **Décision** : `input()` jeton de reset + `effect()` côté dumb (évite le
  couplage impératif `viewChild`, reste signal-first). À trancher au test par
  `qa` (l'API de reset est un détail testable).

### 5. État partagé & coordination

**Signals locaux + smart parent** (défaut du profil), **pas de nouveau store ni
facade** — justification au §1. `AuthStore` (`core/auth`) demeure l'unique store
de session ; le smart parent le consomme directement via `inject()`, conforme à
`application → core` (ADR-0001). Aucun état ne franchit la frontière entre deux
enfants : chaque dumb est autonome sur son form, le parent agrège le feedback.

### 6. Cross-platform

Sans objet : le profil déclare `Cross-platform : aucun` (pas de Capacitor/
Electron). Aucune abstraction injectable de plateforme requise.

### 7. Choix de bibliothèques

**Aucun ajout de dépendance.** On réutilise strictement l'existant : `@angular/
forms` (Reactive Forms), `@angular/core/rxjs-interop` (`takeUntilDestroyed`),
`rxjs`, et les composants partagés `@shared/ui` (`Button`) et `@shared/icons`
(`AppIcon`) déjà importés par le god-file. Contrats réutilisés vérifiés :
`app-button` (`severity`/`variant`/`block`/`disabled`/`type`), `app-icon`
(`name`/`size`/`label`).

### 8. Ordre des propriétés conforme (gabarit smart parent)

Le smart parent et chaque dumb suivent l'ordre du profil :

1. Deps injectées (`private readonly … = inject(...)`) — smart : `AuthStore`,
   `DestroyRef`. Dumbs : aucune (ils sont dumb, zéro `inject` de service).
2. Inputs / outputs / models (`readonly`).
3. Queries (`viewChild`) — a priori aucune (cf. décision reset par `input()`).
4. Signals & computed (`protected` si lus en template ; privés préfixés `_`).
5. Méthodes (`protected` si appelées en template).

Cela corrige le défaut F007 secondaire (signals déclarés après une méthode dans
le fichier actuel) : dans le smart refactoré, **tous** les signals/forms/computed
précèdent **toutes** les méthodes.

### 9. Stratégie de test (cadrage pour `qa`, phase RED)

Le profil impose `data-testid` (mais l'existant teste via `formcontrolname` et
ids d'erreur). **Décision** : on **préserve** les `formcontrolname` et ids
d'erreur existants (contrat d'a11y) et on **ajoute** des `data-testid` sur les
conteneurs/boutons clés pour les nouvelles assertions, sans casser l'existant.

- **Specs des dumbs** (3 fichiers) : reprennent les assertions a11y fines
  aujourd'hui dans `two-factor-setup.spec.ts` (autocomplete, aria-required,
  aria-invalid/-describedby, role=alert, ids d'erreur), désormais scopées au dumb.
  Les inputs sont posés via `fixture.componentRef.setInput(...)` ; les outputs
  vérifiés par souscription à l'`OutputEmitterRef`.
- **Spec du smart parent** : test d'**intégration** (TestBed + `AuthStore` mock,
  comme l'existant) — vérifie que (a) l'action d'un enfant déclenche la bonne
  commande `AuthStore`, (b) le feedback (success/error) est répercuté en `input`
  vers le bon enfant, (c) la sélection d'enfant suit `isTwoFactorEnabled` /
  `qrCodeUrl` / `showDisableForm`.
- **Régime async** : zoneless. Les fakes `AuthStore` renvoient `of(...)`
  (synchrone) comme l'existant ; si un test introduit du différé, utiliser
  `defer(() => of(...))` + `await fixture.whenStable()` (jamais `fakeAsync`/`tick`,
  cf. profil et skill `angular-async-testing`).
- **Mock `AuthStore`** : réutiliser le `AuthStoreMock` de la spec actuelle
  (signal `currentUser` + 4 méthodes) — précédent établi à conserver.

### 10. Plan de migration sans régression

1. **Filet RED d'abord** (`qa`) : écrire les specs des 3 dumbs + la spec
   d'intégration du smart parent, prouver le RED. Les specs encodent le contrat
   a11y/comportement actuel → garantissent l'absence de régression.
2. **Extraction mécanique** (`angular-expert`, GREEN) : créer les 3 dumbs en
   déplaçant template + form + types de chaque section ; le template de chaque
   dumb est **copié à l'identique** depuis le god-file (mêmes classes Tailwind,
   mêmes libellés, mêmes ids/aria).
3. **Réduction du parent** : remplacer les 3 blocs de template par
   `<app-password-change-form … />`, `<app-two-factor-enable-form … />`,
   `<app-two-factor-disable-form … />` câblés sur les signals/handlers existants ;
   l'orchestration RxJS et les signals de feedback **restent** dans le parent.
4. **Remise en ordre des propriétés** du parent (conformité profil).
5. **Gates** : `pnpm test` (vert), `pnpm lint` (zéro warning), `pnpm build`.
   Invalidation cache si le diff touche le cache (non attendu ici).
6. **Garantie d'API stable** : le selector `app-two-factor-setup`, le nom de
   classe `TwoFactorSetup` et l'export du barrel restent inchangés → aucun impact
   sur `admin.routes.ts`. Vérifié par grep d'usage (2 sites : route + barrel).

### 11. Risques & inconnues

- **Surface sécurité** : un copier-coller imparfait d'un attribut a11y/autocomplete
  ou d'un libellé d'erreur est une régression silencieuse — le filet RED de `qa`
  (étape 1) doit couvrir chaque attribut avant extraction.
- **API de reset du form** (jeton `input()`+`effect()` vs méthode `viewChild`) :
  sous-spécifiée ; tranchée par le test `qa`. Risque mineur de boucle si un
  `effect()` réécrit un signal — l'`effect()` ne fait qu'appeler `form.reset()`
  (effet de bord DOM/form), pas de réécriture de signal observé.
- **Glissement de scope** : ne pas migrer vers Signal Forms ni toucher `AuthStore`
  dans ce refactor (objectif = zéro régression) ; tout est borné à `application/`.

## Plan de test

> Phase RED (TDD strict). Auteur : `qa`. Régime **zoneless** (jamais `fakeAsync`/
> `tick` ; fakes `AuthStore` en `of(...)`, différé via `defer(() => of(...))` +
> `await fixture.whenStable()`). Sélection enfant en intégration via
> `By.directive(...)`. Inputs posés par `componentRef.setInput(...)`, outputs
> vérifiés par souscription à l'`OutputEmitterRef`.

### `password-change-form.spec.ts` (dumb mot de passe)

| Test | Scénario | Assertions clés |
|------|----------|-----------------|
| autocomplete current/new/confirm | rendu initial | `autocomplete=current-password` / `new-password` / `new-password`, `aria-required=true` sur les 3 champs |
| aria-invalid current/new/confirm | champ touché + vide | `aria-invalid=true`, `aria-describedby=twofa-setup-{current,new,confirm}-pw-error`, `<p role="alert">` présent |
| message minlength | newPassword `Aa1!` | texte contient `8` + `caractères` dans `#twofa-setup-new-pw-error` |
| message pattern | newPassword `aaaaaaaa` | « Majuscule, minuscule, chiffre et caractère spécial requis » |
| message mismatch | new ≠ confirm | `pwdForm.hasError('mismatch')`, « Les mots de passe ne correspondent pas » |
| feedback success/error | `setInput('successMessage'/'errorMessage')` | message rendu dans le DOM |
| loading désactive submit | `setInput('loading', true)` | `button[type=submit].disabled === true` |
| pas d'émission si invalide | submit form vide | `submit` non émis |
| émission valide | 3 champs valides + submit | `submit` émis avec `{ currentPassword, newPassword }` |
| resetToken | changement de `resetToken` | les 3 contrôles repassent à `''` |

### `two-factor-enable-form.spec.ts` (dumb activation 2FA)

| Test | Scénario | Assertions clés |
|------|----------|-----------------|
| pas de champ code sans QR | `qrCodeUrl` absent | `input[formcontrolname=code]` absent |
| émission generate | clic bouton `twofa-generate` | `generate` émis (sans payload) |
| loading désactive generate | `setInput('loading', true)` | bouton generate `disabled` |
| QR + secret rendus | `setInput('qrCodeUrl'/'secret')` | `img[src]` + `alt` exact, secret affiché |
| a11y code | QR fourni | `autocomplete=one-time-code`, `inputmode=numeric`, `aria-required=true` |
| aria-invalid code | code touché + vide | `aria-invalid=true`, `aria-describedby=twofa-setup-code-error`, `role=alert` « Ce champ est obligatoire » |
| message pattern code | code `12` | « Le code doit contenir 6 chiffres » |
| feedback success/error | `setInput(...)` | message rendu |
| pas d'émission si invalide | submit code vide | `verify` non émis |
| émission verify | code `123456` + submit | `verify` émis avec `'123456'` |
| resetToken | changement de `resetToken` | contrôle `code` repasse à `''` |

### `two-factor-disable-form.spec.ts` (dumb désactivation 2FA)

| Test | Scénario | Assertions clés |
|------|----------|-----------------|
| statut activé | `showForm=false` | texte « 2FA activé », form absent |
| émission reconfigure | clic `twofa-reconfigure` | `reconfigure` émis |
| loading désactive reconfigure | `setInput('loading', true)` | bouton reconfigure `disabled` |
| a11y password | `showForm=true` | `autocomplete=current-password`, `aria-required=true` |
| aria-invalid password | password touché + vide | `aria-invalid=true`, `aria-describedby=twofa-setup-disable-pw-error`, `role=alert` « Ce champ est obligatoire » |
| émission cancel | clic `twofa-disable-cancel` | `cancel` émis |
| feedback success/error | `setInput(...)` | message rendu |
| pas d'émission si invalide | submit form vide | `disable` non émis |
| émission disable | password renseigné + submit | `disable` émis avec le mot de passe |
| resetToken | changement de `resetToken` | contrôle `password` repasse à `''` |

### `two-factor-setup.spec.ts` (smart parent — intégration)

| Test | Scénario | Assertions clés |
|------|----------|-----------------|
| sélection enfant | états 2FA off/on | `PasswordChangeForm` toujours rendu ; `TwoFactorEnableForm` si off, `TwoFactorDisableForm` si on (mutuellement exclusifs) |
| changePassword | enfant émet `submit` | `AuthStore.changePassword(current, next)` appelé |
| feedback pwd success/false/error | `of(true)`/`of(false)`/`throwError` | `successMessage`/`errorMessage` poussés en `input()` au bon enfant |
| generate | enfant émet `generate` | `AuthStore.generateTwoFactorSecret()` appelé ; `qrCodeUrl`/`secret` poussés à l'enfant |
| enableTwoFactor | enfant émet `verify('123456')` | `AuthStore.enableTwoFactor('123456')` appelé ; success/error répercutés |
| disableTwoFactor | enfant émet `disable(pwd)` | `AuthStore.disableTwoFactor(pwd)` appelé ; success/error répercutés |
| reconfigure | enfant émet `reconfigure` | `AuthStore.generateTwoFactorSecret()` appelé |
| commande différée | `defer(() => of(true))` + `whenStable()` | `loading` redescend à `false` après résolution |

### API de reset tranchée (spec §4)

L'API de reset est encodée comme **`resetToken = input<number>()` + `effect()`
côté dumb** (option signal-first du Plan, retenue contre le `viewChild`
impératif) : chaque spec de dumb vérifie qu'un changement de `resetToken` vide les
contrôles du form local. Le smart parent incrémente ce jeton après chaque succès.

### Symboles dus au GREEN (scaffold applicatif à créer par `angular-expert`)

Les specs référencent par anticipation des symboles de **code applicatif** encore
inexistants (contrat acté au Plan technique §1/§2) ; leur absence est l'unique
cause d'échec de la gate `pnpm test` (build esbuild) :

- `./password-change-form` → `PasswordChangeForm` (selector `app-password-change-form`)
  + type exporté `PasswordChangeRequest` (`{ readonly currentPassword; readonly newPassword }`).
  Inputs : `loading`, `successMessage`, `errorMessage`, `resetToken`. Output :
  `submit: OutputEmitterRef<PasswordChangeRequest>`. Form public `pwdForm`.
- `./two-factor-enable-form` → `TwoFactorEnableForm` (selector `app-two-factor-enable-form`).
  Inputs : `qrCodeUrl`, `secret`, `loading`, `errorMessage`, `successMessage`,
  `resetToken`. Outputs : `generate: OutputEmitterRef<void>`,
  `verify: OutputEmitterRef<string>`. Form public `tfaForm`. `data-testid="twofa-generate"`.
- `./two-factor-disable-form` → `TwoFactorDisableForm` (selector `app-two-factor-disable-form`).
  Inputs : `loading`, `errorMessage`, `successMessage`, `showForm`, `resetToken`.
  Outputs : `disable: OutputEmitterRef<string>`, `cancel: OutputEmitterRef<void>`,
  `reconfigure: OutputEmitterRef<void>`. Form public `disableForm`.
  `data-testid="twofa-reconfigure"`, `data-testid="twofa-disable-cancel"`.

### Confirmation RED

Tous les tests ci-dessus échouent à ce stade (RED confirmé via la commande test
du profil `pnpm test` le 2026-06-14). Nature de l'échec : la gate build/typecheck
(`@angular/build:unit-test`, esbuild + angular-compiler) ne résout pas les 3
modules composants inexistants — `Could not resolve "./password-change-form"`,
`"./two-factor-enable-form"`, `"./two-factor-disable-form"` et leurs `TS2307`
correspondants, **et rien d'autre** : aucune faute de type dans les specs, aucune
autre suite du repo cassée. C'est le RED attendu pour des composants neufs ; le
filet devient vert une fois les 3 dumbs créés par `angular-expert` (phase GREEN).

## Notes

- `ToastStore` évoqué au brief n'est **pas** une dépendance de ce composant : le
  feedback est rendu en bandeaux inline via signals locaux. Aucune intégration
  toast introduite par ce refactor (hors scope).
