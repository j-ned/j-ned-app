import { blogTagCategory, type BlogTagCategory } from '../domain/models/blog-tag.model';

/** Classes Tailwind d'un tag : `tint` pour la pastille de lecture, `solid` pour l'état sélectionné. */
export type BlogTagPalette = { readonly tint: string; readonly solid: string };

const CATEGORY_PALETTE: Record<BlogTagCategory, BlogTagPalette> = {
  stack: {
    tint: 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20',
    solid: 'bg-primary-bg text-white border-primary-bg',
  },
  security: {
    tint: 'bg-rose-500/12 text-rose-700 border-rose-500/30 hover:bg-rose-500/22 dark:text-rose-300',
    solid: 'bg-rose-700 text-white border-rose-700',
  },
  engineering: {
    tint: 'bg-emerald-500/12 text-emerald-700 border-emerald-500/30 hover:bg-emerald-500/22 dark:text-emerald-300',
    solid: 'bg-emerald-700 text-white border-emerald-700',
  },
  journey: {
    tint: 'bg-amber-500/15 text-amber-800 border-amber-500/30 hover:bg-amber-500/25 dark:text-amber-300',
    solid: 'bg-amber-700 text-white border-amber-700',
  },
  projects: {
    tint: 'bg-sky-500/12 text-sky-700 border-sky-500/30 hover:bg-sky-500/22 dark:text-sky-300',
    solid: 'bg-sky-700 text-white border-sky-700',
  },
};

/** Tag hors catalogue (tags projet, saisie libre) : neutre, sélection en couleur primaire. */
const FREE_TAG_PALETTE: BlogTagPalette = {
  tint: 'bg-foreground/8 text-muted border-foreground/20 hover:bg-foreground/15',
  solid: 'bg-primary-bg text-white border-primary-bg',
};

export function blogTagPalette(tag: string): BlogTagPalette {
  const category = blogTagCategory(tag);
  return category ? CATEGORY_PALETTE[category] : FREE_TAG_PALETTE;
}
