export type ContactFormData = {
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
};

export type ContactFormSubmission = {
  readonly success: boolean;
  readonly message: string;
};
