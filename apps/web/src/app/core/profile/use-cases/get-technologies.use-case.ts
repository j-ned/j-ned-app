import { inject, Injectable } from '@angular/core';
import { PROFILE_GATEWAY } from '../gateways';

@Injectable({ providedIn: 'root' })
export class GetTechnologiesUseCase {
  private gateway = inject(PROFILE_GATEWAY);

  execute() {
    return this.gateway.getTechnologies();
  }
}
