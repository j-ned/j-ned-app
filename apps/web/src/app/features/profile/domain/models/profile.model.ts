export type ProfileInfo = {
  readonly id: number;
  readonly displayName: string;
  readonly location: string;
  readonly avatarUrl: string;
  readonly isAvailable: boolean;
  readonly availabilityMessage: string;
};

export type SocialButton = {
  readonly id: number;
  readonly icon: string;
  readonly label: string;
  readonly href: string;
};
