import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { HeroData, Speciality, Tech } from '../models';
import type { Comment } from '../../../blog/domain';

export type HomeGateway = {
  getHeroData(): ResourceRef<HeroData>;
  getSpecialities(): Observable<readonly Speciality[]>;
  getTechStack(): Observable<readonly Tech[]>;
  getFeaturedComments(): Observable<readonly Comment[]>;
};

export { HOME_GATEWAY } from './home.gateway.token';
