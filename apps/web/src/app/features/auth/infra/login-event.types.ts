import type { LoginEvent } from '../domain/models/login-event.model';

// `kind` reste une chaîne : l'API peut journaliser une étape que ce front ne connaît pas encore.
export type LoginEventDto = Omit<LoginEvent, 'kind'> & { readonly kind: string };

export type LoginEventsResponse = {
  readonly data: readonly LoginEventDto[];
  readonly total: number;
};
