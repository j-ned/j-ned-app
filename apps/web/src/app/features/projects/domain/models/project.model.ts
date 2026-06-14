export type TechChoice = { readonly techno: string; readonly why: string };
export type ArchitectureDecision = {
  readonly decision: string;
  readonly rationale: string;
};

export type Project = {
  readonly id: string;
  readonly title: string;
  readonly slug: string;
  readonly category: string;
  readonly tags: readonly string[];
  readonly description: string;
  readonly image: string;
  readonly techChoices?: readonly TechChoice[];
  readonly architectureDecisions?: readonly ArchitectureDecision[];
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

// Payload d'écriture (create/update). `id`, `image` et `slug` sont gérés côté
// serveur : `id`/`slug` générés (slug dérivé du titre), `image` via uploadImage
// (POST /:id/image). techChoices/architectureDecisions, eux, sont éditables.
export type ProjectInput = Omit<Project, 'id' | 'image' | 'slug'>;
