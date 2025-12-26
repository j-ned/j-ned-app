import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { ProfileGateway } from '../../../core/profile/gateways';
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
} from '../../../core/profile/models';
import {
  PROFILE_INFO,
  BIOGRAPHY,
  SOCIAL_BUTTONS,
  EXPERIENCE,
  DIPLOMAS,
  TECHNOLOGIES,
  HIGHLIGHTS,
  WHAT_I_DO,
  WHAT_I_SEEK,
} from './profile.data';

@Injectable()
export class InMemoryProfileGateway implements ProfileGateway {
  getProfileInfo(): ResourceRef<ProfileInfo> {
    return resource({
      loader: () => {
        return new Promise<ProfileInfo>((resolve) => {
          setTimeout(() => resolve(PROFILE_INFO), 200);
        });
      },
    }) as ResourceRef<ProfileInfo>;
  }

  getBiography(): ResourceRef<Biography> {
    return resource({
      loader: () => {
        return new Promise<Biography>((resolve) => {
          setTimeout(() => resolve(BIOGRAPHY), 200);
        });
      },
    }) as ResourceRef<Biography>;
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return of(SOCIAL_BUTTONS).pipe(delay(100));
  }

  getExperiences(): Observable<readonly Experience[]> {
    return of(EXPERIENCE).pipe(delay(100));
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return of(DIPLOMAS).pipe(delay(100));
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return of(TECHNOLOGIES).pipe(delay(100));
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return of(HIGHLIGHTS).pipe(delay(100));
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return of(WHAT_I_DO).pipe(delay(100));
  }

  getWhatISeek(): Observable<WhatISeek> {
    return of(WHAT_I_SEEK).pipe(delay(100));
  }

  updateProfileInfo(profile: Partial<ProfileInfo>): Observable<ProfileInfo> {
    // In-memory simulation - would mutate PROFILE_INFO in real scenario
    return of({ ...PROFILE_INFO, ...profile }).pipe(delay(200));
  }

  updateBiography(bio: Biography): Observable<Biography> {
    return of(bio).pipe(delay(200));
  }
}
