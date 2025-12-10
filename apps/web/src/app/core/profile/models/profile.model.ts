export interface ProfileInfo {
  readonly displayName: string;
  readonly location: string;
  readonly avatarUrl: string;
  readonly isAvailable: boolean;
  readonly availabilityMessage: string;
}

export interface SocialButton {
  readonly icon: string;
  readonly label: string;
  readonly href: string;
}

export interface QuickStat {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}
