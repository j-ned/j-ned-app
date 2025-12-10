import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type {
  ProfileInfo,
  Biography,
  Experience,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../models';

export interface ProfileGateway {
  // Primary data
  getProfileInfo(): ResourceRef<ProfileInfo>;
  getBiography(): ResourceRef<Biography>;

  // Related data
  getSocialButtons(): Observable<readonly SocialButton[]>;
  getExperiences(): Observable<readonly Experience[]>;
  getDiplomas(): Observable<readonly Diploma[]>;
  getTechnologies(): Observable<readonly Technology[]>;
  getHighlights(): Observable<readonly Highlight[]>;
  getWhatIDo(): Observable<readonly WhatIDo[]>;
  getWhatISeek(): Observable<WhatISeek>;

  // CRUD (for future backend)
  updateProfileInfo(profile: Partial<ProfileInfo>): Observable<ProfileInfo>;
  updateBiography(bio: Biography): Observable<Biography>;
}

export { PROFILE_GATEWAY } from './profile.gateway.token';
