import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { ProfileGateway } from '../../domain/gateways';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  SocialButton,
  WhatIDo,
  WhatISeek,
} from '../../domain/models';
import {
  PROFILE_INFO,
  BIOGRAPHY,
  SOCIAL_BUTTONS,
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
}
