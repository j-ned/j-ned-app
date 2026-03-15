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
  getProfileInfo(): Observable<ProfileInfo>;
  getBiography(): Observable<Biography>;
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

  getSocialButtonById(id: string): Observable<SocialButton>;
  createSocialButton(data: Omit<SocialButton, 'id'>): Observable<SocialButton>;
  updateSocialButton(id: string, data: Partial<SocialButton>): Observable<SocialButton>;
  deleteSocialButton(id: string): Observable<void>;

  getDiplomaById(id: string): Observable<Diploma>;
  createDiploma(data: Omit<Diploma, 'id'>): Observable<Diploma>;
  updateDiploma(id: string, data: Partial<Diploma>): Observable<Diploma>;
  deleteDiploma(id: string): Observable<void>;

  getTechnologyById(id: string): Observable<Technology>;
  createTechnology(data: Omit<Technology, 'id'>): Observable<Technology>;
  updateTechnology(id: string, data: Partial<Technology>): Observable<Technology>;
  deleteTechnology(id: string): Observable<void>;

  getHighlightById(id: string): Observable<Highlight>;
  createHighlight(data: Omit<Highlight, 'id'>): Observable<Highlight>;
  updateHighlight(id: string, data: Partial<Highlight>): Observable<Highlight>;
  deleteHighlight(id: string): Observable<void>;

  getWhatIDoById(id: string): Observable<WhatIDo>;
  createWhatIDo(data: Omit<WhatIDo, 'id'>): Observable<WhatIDo>;
  updateWhatIDo(id: string, data: Partial<WhatIDo>): Observable<WhatIDo>;
  deleteWhatIDo(id: string): Observable<void>;
};
