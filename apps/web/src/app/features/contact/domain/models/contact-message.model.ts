export type ContactMessage = {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly subject: string;
  readonly message: string;
  readonly createdAt: string;
  readonly read: boolean;
};
