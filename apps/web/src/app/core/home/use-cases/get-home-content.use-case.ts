import { inject, Injectable } from '@angular/core';
import { HOME_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetHomeContentUseCase {
  private gateway = inject(HOME_GATEWAY);

  getHeroData() {
    return this.gateway.getHeroData();
  }

  getSpecialities() {
    return this.gateway.getSpecialities();
  }

  getTechStack() {
    return this.gateway.getTechStack();
  }
}
