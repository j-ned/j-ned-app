---
name: angular-routing-patterns
description: Patterns de routing Angular 20+ pour guards et flux de remédiation — récupérer l'URL complète demandée dans un guard fonctionnel, et le pattern returnUrl (guard refuse → page de remédiation → retour vers l'intention initiale). Déclencher quand on implémente ou teste un guard (`CanMatchFn`/`CanActivateFn`) qui a besoin de l'URL/des query params demandés, un redirect d'authentification, un paywall, une page d'erreur réseau avec retour, ou un deep link protégé. Couvre aussi les évolutions router Angular 22 (changement de défaut `paramsInheritanceStrategy` à la migration, injecteurs de route auto-nettoyés `withExperimentalAutoCleanupInjectors`, `isActive` réactif) et les footguns associés (open redirect, reload-en-place qui piège l'utilisateur, `getCurrentNavigation()` null, param parent vu `null` depuis un enfant après v22).
---

# Angular routing patterns — guards & remédiation

Référence ciblée pour deux besoins récurrents et leurs footguns. Code Angular 20+ : guards fonctionnels, `inject()`, signals. Conventions de nommage et préfixe selon le profil-projet (`.claude/project-profile.md`).

Les deux patterns se combinent : un guard qui **refuse** capture l'URL demandée (Pattern A) pour la passer en `returnUrl` à une page de remédiation qui **y ramène** une fois le blocage levé (Pattern B).

---

## Pattern A — récupérer l'URL complète demandée dans un guard

**Le problème** : la signature `CanMatchFn(route: Route, segments: UrlSegment[])` ne donne **pas** l'URL complète demandée — `segments` ne porte que les segments de chemin matchés pour *cette* route, **sans** les query params ni le contexte de navigation. `CanActivateFn` est mieux loti (`RouterStateSnapshot.url`), mais `CanMatchFn` s'exécute **plus tôt** (avant résolution de la route), ce qui le rend idéal pour un guard d'aiguillage/paywall — au prix de cette ergonomie réduite.

**La solution** : `inject(Router).getCurrentNavigation()` expose la navigation en cours, dont `extractedUrl` est l'`UrlTree` complète (query params inclus).

```ts
import { inject } from '@angular/core';
import { CanMatchFn, Route, Router, UrlSegment } from '@angular/router';

export const paidModuleGuard: CanMatchFn = (route: Route, segments: UrlSegment[]) => {
  const router = inject(Router);

  // segments = chemin matché pour CETTE route, sans query params.
  // URL complète réellement demandée (avec query params) :
  const requested = router.getCurrentNavigation()?.extractedUrl;
  const requestedPath = requested ? router.serializeUrl(requested) : '/';

  // … logique d'autorisation …
  return true;
};
```

| Tu veux… | Champ |
| --- | --- |
| l'URL demandée (avec query params), avant redirects internes | `getCurrentNavigation()?.extractedUrl` |
| l'URL d'origine telle que tapée | `getCurrentNavigation()?.initialUrl` |
| sérialiser une `UrlTree` en `string` | `router.serializeUrl(urlTree)` |
| reparser une `string` en `UrlTree` | `router.parseUrl(str)` |

**Footgun** : `getCurrentNavigation()` renvoie `null` **hors** d'une navigation en cours. Dans un guard, on est par définition en pleine navigation → non-null. Mais ne mémoïse pas le résultat ailleurs et ne l'appelle pas depuis un service hors cycle de navigation. Toujours prévoir le fallback `?? '/'`.

**Quand préférer `CanActivateFn`** : si tu n'as pas besoin de t'exécuter avant la résolution de route, `CanActivateFn(route, state)` te donne `state.url` directement, sans passer par `getCurrentNavigation()` — plus simple et plus testable. Réserve `CanMatchFn` aux cas où l'aiguillage doit décider *quelle* route matcher (variantes de composant, lazy chunk conditionnel, paywall avant chargement).

---

## Pattern B — flux returnUrl (guard refuse → remédiation → retour)

Flux réutilisable : login, ré-authentification, paywall, erreur réseau, deep link protégé. Le guard refuse l'accès, redirige vers une page de remédiation en **capturant l'intention initiale** dans un query param `returnUrl` ; la page, une fois le blocage levé, **renavigue vers cette intention**.

### 1. Le guard refuse en renvoyant une `UrlTree` (pas un `boolean`)

Un guard qui retourne une `UrlTree` déclenche la redirection atomiquement — pas de `router.navigate()` impératif suivi d'un `return false` (qui crée une fenêtre d'état incohérent).

```ts
export const authGuard: CanMatchFn = () => {
  const router = inject(Router);
  const auth = inject(AuthStore);

  if (auth.isAuthenticated()) return true;

  const requested = router.getCurrentNavigation()?.extractedUrl;
  return router.createUrlTree(['/login'], {
    queryParams: { returnUrl: requested ? router.serializeUrl(requested) : '/' },
  });
};
```

### 2. La page de remédiation ramène vers `returnUrl`

```ts
@Component({
  selector: 'app-login-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button type="button" (click)="signIn()">Se connecter</button>
  `,
})
export default class LoginPage {
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);
  private readonly auth = inject(AuthStore);

  async signIn(): Promise<void> {
    await this.auth.signIn();
    const raw = this.route.snapshot.queryParamMap.get('returnUrl') ?? '/';
    await this.router.navigateByUrl(safeInternalUrl(raw, this.router));
  }
}
```

### 3. Garde anti open-redirect (obligatoire)

Un `returnUrl` vient de l'URL → c'est une **entrée non fiable**. Sans contrôle, un attaquant forge `/login?returnUrl=https://evil.tld` et ta page renvoie l'utilisateur authentifié vers un site externe (open redirect, vol de session via phishing). N'accepte **que** des chemins internes relatifs.

```ts
import { Router, UrlTree } from '@angular/router';

function safeInternalUrl(raw: string, router: Router): UrlTree | string {
  // Refuse absolu/externe : doit commencer par un seul '/', jamais '//' (protocol-relative).
  if (!raw.startsWith('/') || raw.startsWith('//')) return '/';
  try {
    return router.parseUrl(raw);
  } catch {
    return '/';
  }
}
```

---

## Angular 22 — évolutions router

- **🔴 `paramsInheritanceStrategy` — le défaut a changé (footgun de migration).** En v22, la stratégie d'héritage des paramètres en **routes imbriquées** bascule : `paramMap`/`data` d'une route enfant ne résolvent plus la même chose qu'avant. Un guard/résolveur/composant enfant qui lit un **param du parent** peut soudain le voir `null` (ou l'inverse) après `ng update`. Restaure l'ancien comportement explicitement :
  ```ts
  import { provideRouter, withRouterConfig } from '@angular/router';
  provideRouter(routes, withRouterConfig({ paramsInheritanceStrategy: 'emptyOnly' }));
  ```
  Audite tout lecteur de param parent depuis un enfant avant de migrer — bug silencieux, vert au compile.
- **Injecteurs de route auto-nettoyés** : `provideRouter(routes, withExperimentalAutoCleanupInjectors())` détruit l'`EnvironmentInjector` d'une route — **et les services providés à son niveau** — à la sortie de la route. C'est le bon support pour une **facade instance-scopée à un écran** (cf. doctrine store/facade de `angular-expert`) : providers **scopés-route**, durée de vie = durée de la route. **Footgun** : opt-in **expérimental** ; sans lui, un service providé au niveau route **survit** après la sortie (fuite d'état/mémoire — l'instance d'écran précédent persiste).
- **`isActive` réactif** : préfère la nouvelle forme programmatique réactive pour savoir si une route est active (computed/guard) plutôt qu'un `router.isActive(url, opts)` impératif à base de comparaison de chaîne fragile.

---

## Footguns critiques

- **🔴 Le retour/retry ne doit JAMAIS être `window.location.reload()`.** Sur une page de remédiation (erreur réseau, paywall, login), un bouton « Réessayer » implémenté en `window.location.reload()` **recharge la page de remédiation elle-même** → l'utilisateur est **coincé indéfiniment** sur l'écran d'erreur. Le retour se fait **toujours** par `router.navigateByUrl(returnUrl)` vers l'intention initiale. Bug vécu, invisible aux tests qui n'asservissent que « la page d'erreur s'affiche » — d'où le point suivant.
- **🔴 Open redirect** : tout `returnUrl` issu d'un query param passe par `safeInternalUrl` (cf. Pattern B.3). Jamais `navigateByUrl(rawReturnUrl)` directement.
- **🟡 `getCurrentNavigation()` null hors navigation** : valide uniquement dans un guard/résolveur pendant la navigation. Fallback `?? '/'` systématique.
- **🟡 `boolean` + `navigate()` impératif** au lieu de retourner une `UrlTree` : crée une double navigation et une fenêtre d'incohérence. Retourne la `UrlTree`.

---

## Tests (cf. conventions `qa`)

- **Teste le bout du comportement, pas seulement l'arrivée.** Asserte **et** « le guard refusé redirige vers `/login?returnUrl=…` » **et** « le bouton de la page de remédiation renavigue effectivement vers `returnUrl` ». Un test vert sur la seule arrivée laisse passer le footgun `reload()` ci-dessus.
- Fournis un `Router` réel via `provideRouter([])` dans les `providers` du `render(...)` ; ne stub pas `{ navigate: vi.fn() }` seul si un template binde `routerLink`. Pour asserter une navigation : `vi.spyOn(TestBed.inject(Router), 'navigateByUrl')` après le `render(...)`.
- Cas open-redirect à couvrir explicitement : `returnUrl=https://evil.tld` et `returnUrl=//evil.tld` doivent retomber sur `/`.
- Paramètre les variantes de `returnUrl` via `it.each`, pas une boucle `for` génératrice de `it`.
