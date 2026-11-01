# ADR-0002 — Assainissement du Markdown du blog avant `bypassSecurityTrustHtml`

- **Statut** : accepté
- **Date** : 2026-09-08
- **Contexte spec** : `specs/005-intake-audit-repo.md` (F002)

## Context

Les articles du blog sont stockés en Markdown et rendus en HTML par `marked` dans
`features/blog/infra/parse-markdown.ts`. Deux consommateurs injectent cette sortie via
`[innerHTML]` après `DomSanitizer.bypassSecurityTrustHtml()` : la page publique
`blog-detail.ts` et l'aperçu de l'éditeur `admin-blog-form.ts`.

`marked` ne filtre rien : son option `sanitize` a été retirée en v5, le HTML inline du Markdown
(`<script>`, `<img onerror>`, `href="javascript:"`, `<iframe>`) traverse intact. Et
`bypassSecurityTrustHtml` désactive explicitement le sanitiseur Angular qui l'aurait nettoyé.

Deux circonstances aggravent le cas :

- `blog/:slug` est **prérendu** : un payload ne s'exécuterait pas seulement chez un lecteur, il
  serait figé dans le HTML statique servi par nginx à tous les visiteurs.
- La CSP d'`index.html` porte `script-src 'unsafe-inline'` : elle n'arrête pas un script inline.

Le contenu est rédigé par le seul administrateur, ce qui borne le risque à un compte admin
compromis ou à un contenu collé sans relecture. C'est précisément le cas où une défense en
profondeur se justifie, et `CLAUDE.md` exige une justification écrite pour tout
`bypassSecurityTrust*`.

## Decision

1. **`parseMarkdown()` renvoie du HTML assaini, et c'est le seul endroit où l'assainissement a
   lieu.** `DOMPurify.sanitize()` avec le profil `html` et `FORBID_ATTR: ['style']` est appliqué
   à la sortie de `marked`. Les deux consommateurs n'ont pas changé : ils reçoivent désormais un
   HTML digne de confiance.
2. **`bypassSecurityTrustHtml` est conservé, sur la sortie assainie.** Le sanitiseur Angular
   retirerait `id` et d'autres attributs utiles au rendu typographique, et une double passe
   n'apporte rien de plus que DOMPurify, référence du domaine.
3. **`isomorphic-dompurify`, pas `dompurify` seul.** Le rendu tourne au prérendu (Node) autant
   que dans le navigateur. Sans DOM réel, DOMPurify positionne `isSupported = false` et **renvoie
   la chaîne non assainie** sans erreur : le prérendu serait la seule surface non protégée, et la
   plus exposée. `isomorphic-dompurify` fournit jsdom côté Node et délègue au DOM natif dans le
   navigateur (champ `browser` du paquet, respecté par le builder Angular).
4. **Tout nouveau consommateur de HTML issu du Markdown passe par `parseMarkdown()`.** Appeler
   `marked` directement ailleurs est un défaut.

## Consequences

- Une balise inoffensive du Markdown (`<kbd>`, `<details>`, tables GFM) reste rendue ; `<script>`,
  gestionnaires `on*`, `javascript:`, `<iframe>` et `style` inline sont retirés. Garde-fou :
  `parse-markdown.spec.ts` triangule ces cas en `it.each`.
- Le chunk paresseux du blog embarque DOMPurify (~22 Ko avant gzip) ; jsdom n'entre que dans le
  bundle serveur, utilisé au build.
- `jsdom` apparaît deux fois dans l'arbre (`^29` en devDependency pour Vitest, `^30` via
  `isomorphic-dompurify`) tant que la question F008 de l'audit (jsdom vs happy-dom) n'est pas
  tranchée.

## Alternatives considered

- **Retirer le bypass et laisser `[innerHTML]` au sanitiseur Angular.** Zéro dépendance et
  SSR-safe, mais le sanitiseur Angular strippe `id` (ancres de titres) et journalise un
  avertissement à chaque rendu ; sa liste blanche n'est pas configurable. Écarté pour la perte de
  contrôle, gardé en repli si DOMPurify posait problème au prérendu.
- **`dompurify` seul avec le `DOCUMENT` de `platform-server`.** DOMPurify ne reconnaît pas ce DOM
  comme supporté et renvoie l'entrée telle quelle : faux sentiment de sécurité. Écarté.
- **Échapper tout HTML inline dans `marked` (renderer custom).** Protège, mais interdit `<kbd>` et
  consorts, et ne couvre pas les URL `javascript:` produites par la syntaxe Markdown elle-même.
  Écarté.
