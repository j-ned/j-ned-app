// Document unique de la page Parcours, listes dans l'ordre d'affichage, `id` UUID stable généré par
// le client à l'ajout. L'identité (phrase `journey`, nom, ville, réseaux) reste dans le code du front.
type ProfileBiography = {
  readonly title: string;
  readonly summary: string;
  readonly leadEmphasis: string;
  readonly paragraphs: readonly string[];
};

type ProfileTitledItem = {
  readonly id: string;
  readonly title: string;
  readonly description: string;
};

type ProfileTechnology = {
  readonly id: string;
  readonly name: string;
  readonly category: string;
  readonly icon: string;
};

type ProfileDiploma = {
  readonly id: string;
  readonly title: string;
  readonly provider: string;
  readonly level: string;
  readonly shortDescription: string;
  readonly skills: readonly string[];
};

type ProfileMotivation = {
  readonly title: string;
  readonly statement: string;
  readonly description: string;
};

export type ProfileContent = {
  readonly biography: ProfileBiography;
  readonly highlights: readonly ProfileTitledItem[];
  readonly workSummary: string;
  readonly whatIDo: readonly ProfileTitledItem[];
  readonly technologies: readonly ProfileTechnology[];
  readonly diplomasSummary: string;
  readonly diplomas: readonly ProfileDiploma[];
  readonly motivation: ProfileMotivation;
};

// `portrait` `null` : portrait par défaut du front.
export type ProfileDocument = ProfileContent & {
  readonly version: number;
  readonly updatedAt: Date;
  readonly portrait: string | null;
};
