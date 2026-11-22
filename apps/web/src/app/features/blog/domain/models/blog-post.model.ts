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
  // Modification éditoriale seulement : un like ne la change pas.
  readonly updatedAt: string;
  // Incrémentée par chaque écriture du contenu : l'admin enregistre sous condition de version.
  readonly version: number;
  // Compté par l'API : les listes n'ont pas le corps, mais affichent le temps de lecture.
  readonly wordCount: number;
};

// Les listes publiques ne reçoivent pas le corps, réservé à la page de l'article.
export type BlogPostSummary = Omit<BlogPost, 'contentMarkdown'>;

// Payload d'écriture. `id`, `slug`, `likesCount`, `publishedAt`, `updatedAt`, `version` gérés serveur ;
// `coverImage` transite par uploadCoverImage (POST /:id/image), jamais en string ici.
export type BlogPostInput = Pick<
  BlogPost,
  'title' | 'excerpt' | 'contentMarkdown' | 'tags' | 'status'
>;
