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

  getProfileInfoForEdit(): Observable<ProfileInfo>;
  updateProfileInfo(data: Partial<ProfileInfo>): Observable<ProfileInfo>;
  uploadAvatar(file: File): Observable<string>;

  getBiographyForEdit(): Observable<Biography>;
  updateBiography(data: Partial<Biography>): Observable<Biography>;

  getWhatISeekForEdit(): Observable<WhatISeek>;
  updateWhatISeek(data: Partial<WhatISeek>): Observable<WhatISeek>;

  getSocialButtonById(id: number): Observable<SocialButton>;
  createSocialButton(data: Omit<SocialButton, 'id'>): Observable<SocialButton>;
  updateSocialButton(id: number, data: Partial<SocialButton>): Observable<SocialButton>;
  deleteSocialButton(id: number): Observable<void>;

  getDiplomaById(id: number): Observable<Diploma>;
  createDiploma(data: Omit<Diploma, 'id'>): Observable<Diploma>;
  updateDiploma(id: number, data: Partial<Diploma>): Observable<Diploma>;
  deleteDiploma(id: number): Observable<void>;

  getTechnologyById(id: number): Observable<Technology>;
  createTechnology(data: Omit<Technology, 'id'>): Observable<Technology>;
  updateTechnology(id: number, data: Partial<Technology>): Observable<Technology>;
  deleteTechnology(id: number): Observable<void>;

  getHighlightById(id: number): Observable<Highlight>;
  createHighlight(data: Omit<Highlight, 'id'>): Observable<Highlight>;
  updateHighlight(id: number, data: Partial<Highlight>): Observable<Highlight>;
  deleteHighlight(id: number): Observable<void>;

  getWhatIDoById(id: number): Observable<WhatIDo>;
  createWhatIDo(data: Omit<WhatIDo, 'id'>): Observable<WhatIDo>;
  updateWhatIDo(id: number, data: Partial<WhatIDo>): Observable<WhatIDo>;
  deleteWhatIDo(id: number): Observable<void>;
};

export { PROFILE_GATEWAY } from './profile.gateway.token';
