# ADR-0030 : Accent unique orange (One Orange Rule), couleurs d'autocollant bornées, tokens dans le gamut sRGB

- **Statut** : proposé (2026-10-21, plan technique de la spec 033) ; accepté au merge de la PR 4 de la spec
- **Date** : 2026-10-21
- **Contexte spec** : `specs/033-nouveau-visuel.md` (direction C « Copeaux vifs », exigences 3, 4, 5, 10)
- **Remplace** : la « One Indigo Rule » et la « Indigo Accent Rule » de `DESIGN.md` (règles nommées, pas un ADR)
- **Préserve** : ADR-0003 (`@utility`), ADR-0012 (source de vérité du thème), ADR-0017 (bouton en directive), ADR-0025 (audit axe)

## Context

Le système « The Production Console » repose sur un accent unique, Signal Indigo, décliné en trois
intensités, avec une seule exception bornée (six teintes de coloration syntaxique). Le propriétaire a
retenu le 2026-10-21 la direction C, « Copeaux vifs » : orange copeau sur sable en clair, sur bleu nuit
en sombre, formes rondes, autocollants colorés (sauge et lavande).

Faits vérifiés (calcul OKLCH → sRGB, WCAG 2.x, script du plan technique de la spec 033) :

- L'orange de bouton clair `oklch(68% 0.18 48)` (`#ed6e12`) n'a que **2,81:1** contre le sable : le texte
  posé dessus doit être sombre (bleu nuit, **5,36:1**), pas blanc (3,07:1). Aujourd'hui, `text-white`
  est écrit en dur sur `bg-primary-bg` à quatre endroits, et sur `bg-status-success` à un cinquième.
- L'accent texte clair de la spec, `oklch(53% 0.18 40)`, est **hors du gamut sRGB** : le `#bc3700`
  annoncé est le résultat d'un rognage par canal. Un navigateur qui applique la mise en gamut de CSS
  Color 4 (réduction de chroma) rendrait une autre couleur, donc un autre contraste. Il en va de même,
  à l'arrondi près, pour `#974d00` et `#d1e2ff`.
- `--theme-accent` (violet secondaire) n'a plus aucun consommateur (`grep` : seul `accent-primary-bg`,
  propriété `accent-color` des cases à cocher, contient le mot).
- Une case cochée en `accent-primary-bg` aurait 2,81:1 contre le sable (WCAG 1.4.11 exige 3:1 pour
  l'indicateur d'état) ; en `accent-primary` (accent texte), 5,21:1.
- Une teinte d'accent à 10 % sous un texte `text-primary` (pastilles de tags, survol des boutons
  texte) tombe à 4,50:1 en clair ; à 8 %, 4,63:1 ; à 20 %, 3,86:1 (échec).

## Decision

1. **One Orange Rule.** Un seul accent : l'orange copeau, porté par deux tokens.
   `--color-primary` (accent texte : liens, focus, accent du `h1`, traits de cote) et
   `--color-primary-bg` (aplat : bouton primaire, sélection). En sombre, les deux valent le même orange.
   Pas de second accent : `--color-accent` / `--theme-accent` sont supprimés. Pour différencier, on
   change l'intensité ou le style (plein, contour, texte), jamais la teinte. L'orange ne signale jamais
   un état (succès, erreur) : il est proche en teinte du rouge d'erreur, qu'on ne distingue que par
   l'icône et le texte.
2. **Texte sur l'accent plein par token** : `--color-on-primary` (clair : `foreground`, bleu nuit ;
   sombre : `background`). Plus aucun `text-white` sur `bg-primary-bg`. Même mécanique pour le bouton
   de succès : `--color-on-status-success` (clair : blanc ; sombre : `background`), sur le modèle
   d'`--color-on-status-error`.
3. **Teinte d'accent sous un texte d'accent : 8 % au plus** (`bg-primary/8`), 5 % au repos pour les
   pastilles. Au-delà, le texte `text-primary` passe sous 4,5:1 en clair.
4. **Couleurs d'autocollant, exception bornée** : deux paires fond / texte, sauge et lavande,
   tokens `--color-sticker-{sage,lavender}` et `--color-on-sticker-{sage,lavender}`. Elles ne servent
   qu'au composant autocollant (`shared/ui/sticker.ts`) et aux pastilles de catégorie : jamais à un
   lien, un bouton, un état, un trait porteur d'information. Elles ne portent jamais seules une
   information (le texte de la pastille la porte). Le type `StickerTone = 'sage' | 'lavender'` est la
   liste fermée : une troisième couleur est une modification de ce type, des tokens et de cet ADR.
5. **Coloration syntaxique** : l'exception bornée existante est maintenue (six rôles
   `--color-code-*`, dans `code.code-syntax` seulement). Les teintes sont re-dérivées de la nouvelle
   palette ; le mot-clé reprend l'orange. Chaque teinte est à **≥ 5,0:1** (clair) et **≥ 6,0:1**
   (sombre) sur le fond réel du bloc (`foreground` à 4 % sur le fond **et** sur la surface).
6. **Tous les tokens de couleur sont dans le gamut sRGB** (valeurs OKLCH dont la conversion ne rogne
   aucun canal). Le rendu, donc le contraste calculé, ne dépend pas de l'algorithme de mise en gamut
   du navigateur. L'accent texte clair devient `oklch(53.2% 0.178 37)` (même `#bc3700`).
7. **Cases à cocher** : `accent-primary` (accent texte), jamais `accent-primary-bg`.

## Consequences

- `src/styles.css` : nouveaux tokens `on-primary`, `on-status-success`, `sticker-*`, `on-sticker-*` ;
  suppression d'`accent` ; valeurs des deux thèmes et des six teintes de code remplacées.
- Les gabarits qui écrivent `text-white` sur un aplat, `accent-primary-bg` ou une teinte d'accent
  au-delà de 8 % sous un texte d'accent changent (liste au plan technique de la spec 033). Les tests
  qui nomment l'indigo sont renommés.
- `DESIGN.md` et `DESIGN.json` remplacent la One Indigo Rule par la One Orange Rule et ajoutent la
  règle des autocollants.
- Le bouton primaire clair (aplat à 2,81:1 contre le sable) est identifié par son texte (WCAG 1.4.11
  n'exige pas de bordure) ; un bouton primaire qui ne porterait qu'une icône exige un trait ≥ 3:1.
  Aucun n'existe aujourd'hui (les boutons icône sont `outlined`, `text-muted` ou `text-danger`).
- Le bouton de double authentification en sombre, aujourd'hui blanc sur vert (2,28:1 avec
  `#22c55e`), est corrigé au passage (9,17:1).

## Alternatives considered

- **Garder l'indigo et adoucir le reste** (option « actuel adouci »). Écartée par le propriétaire.
- **Texte blanc sur l'orange clair, orange assombri pour l'atteindre** : un orange à 4,5:1 avec du
  blanc est un orange brûlé (`oklch(58% 0.155 48)`, `#c05708`), qui perd le caractère « copeau vif » de la maquette validée.
  Écarté.
- **Une couleur d'autocollant par catégorie de tag du blog** : il y a plus de catégories que de
  couleurs, et une couleur par catégorie deviendrait porteuse d'information. Écarté : le catalogue
  reste en accent, la catégorie est dite par le texte.
- **Valeurs OKLCH de la spec telles quelles, hors gamut** : rendu dépendant du navigateur (rognage
  aujourd'hui, mise en gamut CSS Color 4 demain), contraste non garanti. Écarté.
