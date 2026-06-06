export type Project = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly image: string;
  // `null` = lien explicitement effacé (envoyé dans le PATCH pour vider le champ) ;
  // `undefined`/absent = champ non fourni. La distinction est cruciale : JSON.stringify
  // supprime les `undefined`, donc seul `null` transmet l'intention d'effacement au backend.
  readonly liveUrl?: string | null;
  readonly repoUrl?: string | null;
  readonly repoUrlFront?: string | null;
  readonly repoUrlBack?: string | null;
  readonly featured: boolean;
  readonly order: number;
};

// Payload d'écriture (create/update). `id` est généré côté serveur et `image`
// est géré exclusivement via uploadImage (POST /:id/image) — jamais comme string
// dans create/update, que le DTO backend rejette (400).
export type ProjectInput = Omit<Project, 'id' | 'image'>;
