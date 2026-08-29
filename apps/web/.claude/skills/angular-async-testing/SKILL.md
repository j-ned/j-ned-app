---
name: angular-async-testing
description: Tester l'asynchrone Angular (timers, debounce, animations, stabilité de fixture) selon le régime zone du projet — zoneless vs zone.js. Déclencher avant d'écrire ou de corriger tout test qui touche du temps (`setTimeout`/`setInterval`/debounce/retry/animation), de l'attente de stabilité (`whenStable`), ou dès qu'on hésite entre `fakeAsync`/`tick` et les fake timers du runner (`vi.useFakeTimers`). Couvre les footguns vécus — `fakeAsync` qui plante au runtime sans `zone-testing`, mélange `fakeAsync` + fake timers runner, faux RED par erreur de harnais, timers armés avant la pose des fake timers.
---

# Tester l'async Angular — zoneless vs zone.js

> **Périmètre.** Ce skill porte la **doctrine AAK** (quel outillage temps selon le
> régime du projet, et les pièges) — pas le tutoriel d'API exhaustif de Vitest ni
> de `@angular/core/testing`. Ici : la décision que la doc officielle ne tranche
> pas pour toi, et les footguns qui produisent des suites cassées ou des faux RED.

## Porte de décision (obligatoire, avant toute recette)

Le régime est une propriété du **runtime du projet**, jamais du style des specs
voisines (un repo en migration peut charrier d'anciens `fakeAsync` cassés — ne
les imite pas) :

1. Champ profil **« Régime zone »** (`.claude/project-profile.md`, section
   *Tests*) s'il est renseigné.
2. Muet ⇒ `package.json` : `zone.js` présent en dépendance ?
   - **absent** ⇒ **zoneless** → § A (défaut des projets neufs Angular 21+) ;
   - **présent** ⇒ **zone.js** → § B.

Trace la détermination si elle vient de `package.json` et pas du profil.

## § A — Projet zoneless

**Interdits** : `fakeAsync`, `tick`, `flush`, `flushMicrotasks`,
`discardPeriodicTasks`, `waitForAsync` (de `@angular/core/testing`). Ces helpers
exigent les patches `zone-testing` et **plantent au runtime** (« zone-testing.js
is needed for the fakeAsync() test helper but could not be found »). Le réflexe
« test Angular + timers = `fakeAsync` » date des projets zone.js — il ne survit
pas au zoneless.

À la place :

- **Timers** (`setTimeout`/`setInterval`/debounce/retry) :
  `vi.useFakeTimers()` **avant** le `render`/`TestBed.createComponent`, puis
  `await vi.advanceTimersByTimeAsync(ms)` (la variante **async** — elle laisse
  les microtasks intercalées se résoudre ; la variante sync gèle les chaînes de
  promesses). Drainage complet : `await vi.runAllTimersAsync()`. Restaure en
  `afterEach(() => vi.useRealTimers())`.
- **Opérateurs RxJS temporels** (`debounceTime`, `delay`, `timer`, retry/backoff,
  `rxMethod` débouncé) : le scheduler par défaut s'appuie sur
  `setTimeout`/`setInterval` → les fake timers du runner les pilotent.
  `await vi.advanceTimersByTimeAsync(<durée du debounce>)` suffit — pas besoin
  de marble tests pour un simple debounce.
- **Stabilité Angular** (effets, `resource()`, rendu différé) :
  `await fixture.whenStable()` après `fixture.detectChanges()` (ou
  `await TestBed.inject(ApplicationRef).whenStable()` hors fixture).
  Un `await Promise.resolve()` n'est **pas** un substitut — il ne draine qu'un
  tour de microtasks, pas la stabilité de l'application.
- **Horloge absolue** (`Date.now()`, timestamps) : `vi.setSystemTime(...)` —
  couvert par `vi.useFakeTimers()`.

**Footgun d'ordre** : des fake timers posés **après** le mount ratent les timers
déjà armés au constructeur/`ngOnInit` — ils courent en temps réel et flakent.
Pose les fake timers avant le premier `render`, avance-les avant d'asserter.

## § B — Projet zone.js

- `fakeAsync`/`tick(ms)`/`flush()` sont **légitimes** (le setup de test charge
  `zone-testing`). `discardPeriodicTasks()` pour solder un `setInterval` encore
  armé en fin de test ; `waitForAsync` pour le vrai async hors `fakeAsync`.
- **Jamais** mélanger `fakeAsync` et les fake timers du runner
  (`vi.useFakeTimers()`) dans un même test : les deux patchent l'horloge,
  comportement indéfini — l'un des deux ne voit pas les timers de l'autre.
  Un seul régime d'horloge par test ; dans une même suite, choisis et tiens.
- **Footgun `runOutsideAngular`** : un timer armé hors zone (pattern perf
  courant pour les animations/scroll) n'est **pas** visible de `tick()` —
  c'est le cas où les fake timers du runner restent le bon outil, dans un
  test **sans** `fakeAsync`.

## Footguns communs aux deux régimes

- **Erreur de harnais ≠ RED.** Un nouveau test qui échoue sur « Zone is
  needed », « zone-testing.js is needed… », un module introuvable ou un
  provider manquant n'est pas un test rouge : il échouera toujours,
  implémentation faite ou non. En phase RED, lis le **message** d'échec —
  seule une assertion comportementale qui compare vaut RED (cf. contrat `qa`).
- **Assertions sur le temps réel = fenêtre de tolérance**, jamais d'égalité
  exacte sur un delta `Date.now()` (cf. contrat `qa`).
- **Fake timers jamais avancés** : un test vert dont l'assertion vit après un
  timer non avancé n'exerce souvent rien (le code en attente n'a jamais couru).
  Si le RED ne devient pas vert en GREEN, vérifie d'abord l'avancement
  d'horloge avant de suspecter l'implémentation.
