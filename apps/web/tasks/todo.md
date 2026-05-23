# Refactor — Suppression overkill et duplication

Date : 2026-05-23
Branche : master
Source : audit 3 agents (duplication, CSS Tailwind, overkill)

Gain total estimé : ~1000 lignes, ~20 fichiers supprimés, complexité -30%.

---

## Phase 1 — Quick wins (low risk, high ROI)

### 1.1 Supprimer 8 use-cases triviaux `profile`
- [ ] Identifier les 8 passthrough : `get-{biography,diplomas,highlights,profile-info,social-buttons,technologies,what-i-do,what-i-seek}.use-case.ts`
- [ ] Mettre à jour 8 consumers (about-*) pour injecter `ProfileGateway` directement et appeler `.getBiography()` au lieu de `_getBiography.execute()`
- [ ] Supprimer les 8 fichiers + nettoyer `domain/use-cases/index.ts`
- [ ] Supprimer le ré-export depuis `domain/index.ts` si présent
- [ ] Lint + tests

### 1.2 Supprimer abstract gateways sans impl alternative
- [ ] Lister tous les `abstract class *Gateway` et compter les `extends`
- [ ] Pour chaque gateway avec 1 seule impl HTTP : merger abstract + impl en classe concrète `@Injectable({ providedIn: 'root' })`
- [ ] Supprimer les bindings `{ provide: XGateway, useClass: HttpXGateway }` dans `app.config.ts` / routes feature
- [ ] Mettre à jour les imports
- [ ] Lint + tests

### 1.3 Supprimer spec in-memory profile trivial
- [ ] Supprimer `features/profile/infra/in-memory-profile.gateway.spec.ts`
- [ ] Vérifier qu'il ne reste pas un fichier `in-memory-profile.gateway.ts` utilisé en prod

---

## Phase 2 — CSS Tailwind

### 2.1 header.ts
- [ ] Retirer le bloc `styles: \`.nav-surface { ... }\``
- [ ] Remplacer `class="nav-surface"` par utility classes équivalentes (`border-b border-foreground/10 shadow-sm` ou approchant)
- [ ] Vérifier visuel

---

## Phase 3 — RxJS verbeux -> signals

### 3.1 Contact gateway
- [ ] `http-contact.gateway.ts:51-61` : `Subject + startWith + switchMap + shareReplay` -> signal + `refetch()`

### 3.2 Projects gateway
- [ ] `http-projects.gateway.ts:18-28` : même refactor

---

## Phase 4 — FormField partagé

### 4.1 Composant
- [ ] Créer `shared/ui/form-field.ts` : input + label + error display + classes erreur auto
- [ ] API : `label`, `control`, `type`, `autocomplete`, `placeholder`

### 4.2 Refactor consumers
- [ ] `contact-form.ts` : utiliser `<form-field>`
- [ ] `login.ts` : idem
- [ ] `two-factor-verify.ts` : idem
- [ ] Vérifier styles et a11y identiques

---

## Phase 5 — Cleanup divers

### 5.1 Admin column providers
- [ ] Retirer `providers: [{ provide: AdminColumnBase, useExisting: ... }]` dans les 7 composants admin-col-*
- [ ] Vérifier que `contentChildren(AdminColumnBase)` fonctionne sans

### 5.2 @defer abusif
- [ ] Retirer `@defer (hydrate on viewport)` sur about-* (composants <5KB)
- [ ] Garder uniquement pour widgets > 5KB ou under-the-fold lourds

### 5.3 AuthStore
- [ ] Remplacer `_ready: Promise` + `.ready` getter par `isReady = signal(false)`
- [ ] Tests SSR à valider

---

## Phase 6 — Optionnel (BaseHttpGateway + cachedResource)

À évaluer après Phase 1-5. Si les gateways concrètes restent verbeuses (>50 lignes répétées), créer la base.

---

## Review

### Livré
- **CLAUDE.md** : full Tailwind policy + YAGNI gateway rule + anti-trivial use case rule + auto-révision avec consultation doc officielle
- **Phase 1.1** : 8 use-cases triviaux `profile` supprimés, 7 composants `about-*` refactorés pour injecter `ProfileGateway` direct (-120 lignes, -8 fichiers)
- **Phase 1.3** : `in-memory-profile.gateway.spec.ts` supprimé (-65 lignes, -1 fichier)
- **Phase 2** : `header.ts` CSS `.nav-surface` migré en utility Tailwind via `@theme` tokens (`--color-nav-border`, `--shadow-nav`)

### Gain total
- **~200 lignes supprimées**, **9 fichiers supprimés**
- Tests : 174 passent, lint : clean, TS : clean

### Rejetés après revue critique (audits trop agressifs)
| Phase | Cible | Verdict | Raison |
|-------|-------|---------|--------|
| 1.2 | Collapse 7 abstract gateways | Reporté | 54 fichiers d'imports à modifier pour 70 lignes gain. ROI trop faible. |
| 3 | Subjects → signals (Contact/Projects) | Rejeté | `Subject+startWith+switchMap+shareReplay` est le canonique RxJS pour cache HTTP + invalidation. Convertir casserait le contrat `Observable<T>` du gateway. |
| 4 | FormField shared | Reporté | Les 3 formulaires (contact/login/2FA) ont des styles visuels distincts. Genericiser = API à 8 props ou design churn. À reconsidérer si un 4e form émerge avec le même pattern. |
| 5a | Admin column providers | Rejeté | `providers: [{ useExisting }]` est REQUIS pour que `contentChildren(AdminColumnBase)` résolve les subclasses via DI. |
| 5b | `@defer (hydrate on viewport)` about-* | Rejeté | C'est le pattern Angular 21 d'incremental hydration pour under-the-fold. Correct. |
| 5c | AuthStore `_ready: Promise` → signal | Rejeté | Consommé par `provideAppInitializer()` qui attend une Promise. Recréation au `restoreSession()` documentée pour SSR/hydration. |
| 6 | BaseHttpGateway / cachedResource | Reporté | Faible gain réel, risque architectural. À reprendre quand 6e gateway HTTP émergera. |

### Leçon
Les audits agents ont sur-flagué : 70% des recommandations finales se sont révélées être des **patterns Angular avancés mal compris** (DI polymorphique via `useExisting`, incremental hydration, SSR boundary). La règle pratique : **toujours lire le fichier cible + le doc-comment avant de "simplifier"**.
