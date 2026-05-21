import { Injectable } from '@angular/core';
import { defer, of, type Observable } from 'rxjs';
import type {
  ProfileInfo,
  Biography,
  Diploma,
  Technology,
  Highlight,
  WhatIDo,
  WhatISeek,
  SocialButton,
  ProfileGateway,
} from '../../domain';
import {
  STATIC_PROFILE_BASE,
  STATIC_AVATAR_URL,
  STATIC_BIOGRAPHY,
  STATIC_DIPLOMAS,
  STATIC_TECHNOLOGIES,
  STATIC_ABOUT_HIGHLIGHTS,
  STATIC_WHAT_I_DO,
  STATIC_WHAT_I_SEEK,
  STATIC_SOCIAL_BUTTONS,
} from '../data/profile.static-data';

@Injectable()
export class InMemoryProfileGateway implements ProfileGateway {
  getProfileInfo(): Observable<ProfileInfo> {
    return defer(() => of({ ...STATIC_PROFILE_BASE, avatarUrl: STATIC_AVATAR_URL }));
  }

  getBiography(): Observable<Biography> {
    return defer(() => of(STATIC_BIOGRAPHY));
  }

  getDiplomas(): Observable<readonly Diploma[]> {
    return defer(() => of([...STATIC_DIPLOMAS]));
  }

  getTechnologies(): Observable<readonly Technology[]> {
    return defer(() => of([...STATIC_TECHNOLOGIES]));
  }

  getHighlights(): Observable<readonly Highlight[]> {
    return defer(() => of([...STATIC_ABOUT_HIGHLIGHTS]));
  }

  getWhatIDo(): Observable<readonly WhatIDo[]> {
    return defer(() => of([...STATIC_WHAT_I_DO]));
  }

  getWhatISeek(): Observable<WhatISeek> {
    return defer(() => of(STATIC_WHAT_I_SEEK));
  }

  getSocialButtons(): Observable<readonly SocialButton[]> {
    return defer(() => of([...STATIC_SOCIAL_BUTTONS]));
  }
}
