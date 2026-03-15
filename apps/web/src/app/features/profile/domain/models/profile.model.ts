export type ProfileInfo = {
  readonly id: string;
  readonly displayName: string;
  readonly location: string;
  readonly avatarUrl: string;
  readonly isAvailable: boolean;
  readonly availabilityMessage: string;
};

export type SocialButton = {
  readonly id: string;
  readonly icon: string;
  readonly label: string;
  readonly href: string;
};
