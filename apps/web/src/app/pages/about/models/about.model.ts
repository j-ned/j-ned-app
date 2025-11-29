export interface SocialButton {
  readonly icon: string;
  readonly label: string;
  readonly href: string;
}

export interface Highlight {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export interface Diploma {
  readonly id: string;
  readonly title: string;
  readonly provider: string;
  readonly shortDescription: string;
  readonly skills: readonly string[];
}

export interface Experience {
  readonly role: string;
  readonly company: string;
  readonly date: string;
}

export interface QuickStat {
  readonly label: string;
  readonly value: string;
  readonly icon: string;
}

export interface ProfileInfo {
  readonly displayName: string;
  readonly location: string;
  readonly avatarUrl: string;
  readonly isAvailable: boolean;
  readonly availabilityMessage: string;
}

export interface Technology {
  readonly name: string;
  readonly category: string;
  readonly icon: string;
}

export interface WhatIDo {
  readonly title: string;
  readonly description: string;
}

export interface WhatISeek {
  readonly title: string;
  readonly description: string;
}

export interface Biography {
  readonly title: string;
  readonly paragraphs: readonly string[];
}

export interface PageMetadata {
  readonly title: string;
  readonly description: string;
}