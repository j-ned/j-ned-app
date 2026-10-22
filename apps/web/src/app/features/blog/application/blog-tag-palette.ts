import { blogTagCategory } from '../domain/models/blog-tag.model';

/** Classes Tailwind d'un tag : `tint` pour la pastille de lecture. */
export type BlogTagPalette = { readonly tint: string };

// One Orange Rule (DESIGN.md) : une seule teinte pour tout le catalogue, quelle que soit la
// catégorie. Teinte ≤ 8 % sous le texte d'accent, sinon il passe sous 4,5:1 en clair.

const CATALOG_TAG_PALETTE: BlogTagPalette = {
  tint: 'bg-primary/5 text-primary border-primary/30 hover:bg-primary/8',
};

/** Tag hors catalogue (tags projet, saisie libre) : neutre. */
const FREE_TAG_PALETTE: BlogTagPalette = {
  tint: 'bg-foreground/8 text-muted border-foreground/20 hover:bg-foreground/15',
};

export function blogTagPalette(tag: string): BlogTagPalette {
  return blogTagCategory(tag) ? CATALOG_TAG_PALETTE : FREE_TAG_PALETTE;
}
