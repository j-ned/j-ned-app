import type { ResourceRef } from '@angular/core';
import type { Observable } from 'rxjs';
import type { HeroData, Speciality, Tech } from '../models';

export interface HomeGateway {
  getHeroData(): ResourceRef<HeroData>;
  getSpecialities(): Observable<readonly Speciality[]>;
  getTechStack(): Observable<readonly Tech[]>;
}

export { HOME_GATEWAY } from './home.gateway.token';
