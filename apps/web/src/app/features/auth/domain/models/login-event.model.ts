export const KNOWN_LOGIN_EVENT_KINDS = [
  'password_accepted',
  'password_rejected',
  'two_factor_accepted',
  'two_factor_rejected',
] as const;

// `unknown` : étape journalisée par une API plus récente que ce front.
export type LoginEventKind = (typeof KNOWN_LOGIN_EVENT_KINDS)[number] | 'unknown';

export type LoginEvent = {
  readonly id: string;
  readonly kind: LoginEventKind;
  // `null` : compte inconnu, ou jeton de challenge illisible.
  readonly userId: string | null;
  readonly browser: string | null;
  readonly os: string | null;
  readonly country: string | null;
  readonly createdAt: string;
};

export type LoginEventPage = {
  readonly events: readonly LoginEvent[];
  // Nombre d'étapes dans tout le journal, pas dans la page.
  readonly total: number;
};
