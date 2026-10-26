export type ContactFormData = {
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
  /** Champ piège : vide pour un humain. Rempli, l'API répond comme d'habitude sans rien garder. */
  readonly website: string;
};

export type ContactFormSubmission = {
  readonly success: boolean;
  readonly message: string;
};
