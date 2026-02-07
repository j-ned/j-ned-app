export type SocialLink = {
  readonly url: string;
  readonly label: string;
  readonly icon: string;
};

export type SocialLinks = {
  readonly linkedin: SocialLink;
  readonly github: SocialLink;
  readonly email: SocialLink;
  readonly phone: SocialLink;
  readonly twitter: SocialLink;
};
