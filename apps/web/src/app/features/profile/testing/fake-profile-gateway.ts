import { defer, of } from 'rxjs';
import type { ProfileGateway } from '../domain/gateways/profile.gateway';
import {
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_AVATAR_URL,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_MOTIVATION,
  STATIC_PROFILE_BASE,
  STATIC_SOCIAL_BUTTONS,
  STATIC_TECHNOLOGIES,
  STATIC_WHAT_I_DO,
} from '../infra/data/profile.static-data';

/** Gateway de test : renvoie les données statiques livrées, de façon asynchrone. */
export function fakeProfileGateway(): ProfileGateway {
  return {
    getProfileInfo: () => defer(() => of({ ...STATIC_PROFILE_BASE, avatarUrl: STATIC_AVATAR_URL })),
    getBiography: () => defer(() => of(STATIC_BIOGRAPHY)),
    getSocialButtons: () => defer(() => of(STATIC_SOCIAL_BUTTONS)),
    getDiplomas: () => defer(() => of(STATIC_DIPLOMAS)),
    getTechnologies: () => defer(() => of(STATIC_TECHNOLOGIES)),
    getHighlights: () => defer(() => of(STATIC_ABOUT_HIGHLIGHTS)),
    getWhatIDo: () => defer(() => of(STATIC_WHAT_I_DO)),
    getMotivation: () => defer(() => of(STATIC_MOTIVATION)),
  };
}
