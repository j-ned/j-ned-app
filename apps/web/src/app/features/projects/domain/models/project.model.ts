export type Project = {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly image: string;
  readonly liveUrl?: string;
  readonly repoUrl?: string;
  readonly repoUrlFront?: string;
  readonly repoUrlBack?: string;
  readonly featured: boolean;
  readonly order: number;
};

// Payload d'écriture (create/update). `id` est généré côté serveur et `image`
// est géré exclusivement via uploadImage (POST /:id/image) — jamais comme string
// dans create/update, que le DTO backend rejette (400).
export type ProjectInput = Omit<Project, 'id' | 'image'>;
