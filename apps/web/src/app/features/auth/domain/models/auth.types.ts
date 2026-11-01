export type UserResponse = {
  id: string;
  email: string;
  isTwoFactorEnabled: boolean;
};

export type LoginResponse = {
  user?: UserResponse;
  requiresTwoFactor?: boolean;
  challengeToken?: string;
};

export type TwoFactorSecretResponse = {
  secret: string;
  qrCodeDataUrl: string;
};
