export interface ContactFormData {
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
}

export interface ContactFormSubmission {
  readonly success: boolean;
  readonly message: string;
}
