export type User = {
  readonly id: string;
  readonly email: string;
  readonly displayName: string;
  readonly role: string;
  readonly isTwoFactorEnabled: boolean;
};
