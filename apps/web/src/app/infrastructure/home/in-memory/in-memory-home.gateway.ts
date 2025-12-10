import { Injectable, resource, type ResourceRef } from '@angular/core';
import { Observable, of, delay } from 'rxjs';
import type { HomeGateway } from '../../../core/home/gateways';
import type { HeroData, Speciality, Tech } from '../../../core/home/models';
import { HERO_DATA, SPECIALITIES, TECH_STACK } from './home.data';

@Injectable()
export class InMemoryHomeGateway implements HomeGateway {
  getHeroData(): ResourceRef<HeroData> {
    return resource({
      loader: () => {
        return new Promise<HeroData>((resolve) => {
          setTimeout(() => resolve(HERO_DATA), 200);
        });
      },
    }) as ResourceRef<HeroData>;
  }

  getSpecialities(): Observable<readonly Speciality[]> {
    return of(SPECIALITIES).pipe(delay(100));
  }

  getTechStack(): Observable<readonly Tech[]> {
    return of(TECH_STACK).pipe(delay(100));
  }
}
