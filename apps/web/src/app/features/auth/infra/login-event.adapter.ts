import {
  KNOWN_LOGIN_EVENT_KINDS,
  type LoginEvent,
  type LoginEventKind,
} from '../domain/models/login-event.model';
import type { LoginEventDto } from './login-event.types';

const isKnownKind = (kind: string): kind is LoginEventKind =>
  KNOWN_LOGIN_EVENT_KINDS.some((known) => known === kind);

export function toLoginEvent(dto: LoginEventDto): LoginEvent {
  return { ...dto, kind: isKnownKind(dto.kind) ? dto.kind : 'unknown' };
}
