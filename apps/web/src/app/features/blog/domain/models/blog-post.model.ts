export type BlogPost = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly excerpt: string;
  readonly contentMarkdown: string;
  readonly coverImage: string;
  readonly tags: readonly string[];
  readonly status: 'draft' | 'published';
  readonly likesCount: number;
  readonly publishedAt: string | null;
  /** Dernière modification éditoriale (titre, contenu, couverture) ; un like ne la change pas. */
  readonly updatedAt: string;
  /** Mots du corps, comptés par l'API : les listes n'ont pas le corps, mais affichent la lecture. */
  readonly wordCount: number;
};

/** Article d'une liste publique : l'API n'y joint pas le corps, réservé à la page de l'article. */
export type BlogPostSummary = Omit<BlogPost, 'contentMarkdown'>;

// Payload d'écriture. `id`, `slug`, `likesCount`, `publishedAt`, `updatedAt` gérés serveur ;
// `coverImage` transite par uploadCoverImage (POST /:id/image), jamais en string ici.
export type BlogPostInput = Pick<
  BlogPost,
  'title' | 'excerpt' | 'contentMarkdown' | 'tags' | 'status'
>;
