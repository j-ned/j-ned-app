import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../models';

export type ProfileGateway = {
  getProfileInfo(): ResourceRef<ProfileInfo>;
  getBiography(): ResourceRef<Biography>;
  getSocialButtons(): Observable<readonly SocialButton[]>;
  getDiplomas(): Observable<readonly Diploma[]>;
  getTechnologies(): Observable<readonly Technology[]>;
  getHighlights(): Observable<readonly Highlight[]>;
  getWhatIDo(): Observable<readonly WhatIDo[]>;
  getWhatISeek(): Observable<WhatISeek>;
};

export { PROFILE_GATEWAY } from './profile.gateway.token';
