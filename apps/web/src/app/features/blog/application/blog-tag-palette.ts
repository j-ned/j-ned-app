import { blogTagCategory } from '../domain/models/blog-tag.model';

/** Classes Tailwind d'un tag : `tint` pour la pastille de lecture, `solid` pour l'état sélectionné. */
export type BlogTagPalette = { readonly tint: string; readonly solid: string };

// One Indigo Rule (DESIGN.md) : une seule teinte pour tout le catalogue, quelle que soit la
// catégorie. La distinction catalogue / tag libre passe par l'intensité, pas par la couleur.
const CATALOG_TAG_PALETTE: BlogTagPalette = {
  tint: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
  solid: 'bg-primary-bg text-white border-primary-bg',
};

/** Tag hors catalogue (tags projet, saisie libre) : neutre, sélection en couleur primaire. */
const FREE_TAG_PALETTE: BlogTagPalette = {
  tint: 'bg-foreground/8 text-muted border-foreground/20 hover:bg-foreground/15',
  solid: 'bg-primary-bg text-white border-primary-bg',
};

export function blogTagPalette(tag: string): BlogTagPalette {
  return blogTagCategory(tag) ? CATALOG_TAG_PALETTE : FREE_TAG_PALETTE;
}
